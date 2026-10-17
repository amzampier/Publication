// POST /api/auth/login — autenticação real (change auth-backend-resend):
// rate limit → lockout → bcrypt → situação → sessão (cookies HttpOnly).
// Erros de credencial são sempre 401 genérico (não revela qual campo falhou);
// bloqueio e inativo são 403 com aviso próprio (spec `login`).
import { compare } from 'bcrypt'
import {
  buscarUsuarioPorEmail,
  bloqueioVigente,
  registrarFalhaLogin,
  limparFalhasLogin,
  emitirSessao,
  sessaoPublica,
  TENTATIVAS_MAX,
  type UsuarioSessao
} from '../../../utils/auth'
import { query } from '../../../utils/db'
import { exigirRateLimit, ipDoCliente } from '../../../utils/rateLimit'
import { registrarEventoLogin, consultarBloqueioEmailInexistente } from '../../../utils/seguranca'
import { registrarAuditoria } from '../../../utils/audit'

// Hash bcrypt fixo (cost 12) para o trabalho de tempo equivalente quando a
// conta não existe (RL02 M-07) — nunca autentica nada.
const HASH_TIMING = '$2b$12$sJ0Oyrd9.IfUDWhwbDv/Ye1x.PSqznvqNJeI3qA3felsn2YPSGVLW'

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  const body = await readBody<{ email?: unknown; senha?: unknown }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const senha = typeof body?.senha === 'string' ? body.senha : ''
  if (!email || !senha) {
    throw createError({ statusCode: 400, statusMessage: 'Informe e-mail e senha.' })
  }
  const ip = ipDoCliente(event)

  const usuario = await buscarUsuarioPorEmail(email)

  // Conta inexistente: mesmo 401 genérico da senha errada. Depois de 5
  // tentativas na janela de 15 min o próprio e-mail bloqueia com o MESMO 403
  // das contas — resposta uniforme não revela se a conta existe (spec `login`).
  if (!usuario) {
    const bloqueioEmail = await consultarBloqueioEmailInexistente(email)
    if (bloqueioEmail.bloqueado) {
      await registrarEventoLogin({
        emailAlvo: email,
        usuarioId: null,
        ip,
        tipo: 'tentativa-bloqueado',
        tentativas: bloqueioEmail.tentativas
      })
      throw createError({
        statusCode: 403,
        statusMessage: `Conta bloqueada temporariamente por tentativas inválidas. Tente novamente em ${bloqueioEmail.minutosRestantes} minuto(s).`
      })
    }
    await registrarEventoLogin({
      emailAlvo: email,
      usuarioId: null,
      ip,
      tipo: 'email-inexistente',
      tentativas: bloqueioEmail.tentativas + 1
    })
    // M-07: custo bcrypt equivalente ao caminho de conta existente.
    await compare(senha, HASH_TIMING).catch(() => false)
    throw createError({ statusCode: 401, statusMessage: 'E-mail ou senha inválidos.' })
  }

  // Inativo: aviso próprio, antes do lockout (não conta como falha de senha).
  if (usuario.situacao !== 'Ativo') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Usuário inativo. Contate o administrador.'
    })
  }

  // Perfil não-Ativo também bloqueia o acesso (RL02 M-05).
  if (usuario.perfil_situacao !== 'Ativo') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Perfil de acesso inativo. Contate o administrador.'
    })
  }

  // Lockout: consulta antes do bcrypt (design D5 — sem custo p/ bloqueadas).
  const minutos = bloqueioVigente(usuario.bloqueado_ate)
  if (minutos) {
    await registrarEventoLogin({
      emailAlvo: email,
      usuarioId: usuario.id,
      ip,
      tipo: 'tentativa-bloqueado',
      tentativas: TENTATIVAS_MAX
    })
    throw createError({
      statusCode: 403,
      statusMessage: `Conta bloqueada temporariamente por tentativas inválidas. Tente novamente em ${minutos} minuto(s).`
    })
  }

  let senhaOk = false
  try {
    senhaOk = await compare(senha, usuario.hash_senha)
  } catch {
    senhaOk = false // hash corrompido/ausente trata como credencial inválida
  }

  if (!senhaOk) {
    const { bloqueou, tentativas } = await registrarFalhaLogin(usuario.id)
    await registrarEventoLogin({
      emailAlvo: email,
      usuarioId: usuario.id,
      ip,
      tipo: bloqueou ? 'bloqueio-aplicado' : 'senha-invalida',
      tentativas
    })
    throw createError({ statusCode: 401, statusMessage: 'E-mail ou senha inválidos.' })
  }

  await limparFalhasLogin(usuario.id)
  await query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP(6) WHERE id = ?', [usuario.id])

  const sessao: UsuarioSessao = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    provisoria: usuario.provisoria === 1,
    tokenVersion: usuario.token_version
  }
  await emitirSessao(event, sessao)
  // Trilha 'Acesso' — os cookies são da RESPOSTA, então a sessão é informada
  // explicitamente (sem ela o registro sairia como 'Desconhecido').
  await registrarAuditoria(event, {
    acao: 'Acesso',
    recurso: 'Autenticação',
    entidadeId: sessao.id,
    detalhes: `Realizou login no sistema (perfil ${sessao.perfil})`,
    sessao: { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil }
  })
  return { usuario: sessaoPublica(sessao) }
})
