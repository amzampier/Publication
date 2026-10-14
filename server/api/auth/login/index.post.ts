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
  type UsuarioSessao
} from '../../../utils/auth'
import { query } from '../../../utils/db'
import { exigirRateLimit } from '../../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  const body = await readBody<{ email?: unknown; senha?: unknown }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const senha = typeof body?.senha === 'string' ? body.senha : ''
  if (!email || !senha) {
    throw createError({ statusCode: 400, statusMessage: 'Informe e-mail e senha.' })
  }

  const usuario = await buscarUsuarioPorEmail(email)

  // Conta inexistente → mesmo 401 genérico da senha errada (anti-enumeração).
  if (!usuario) {
    throw createError({ statusCode: 401, statusMessage: 'E-mail ou senha inválidos.' })
  }

  // Inativo: aviso próprio, antes do lockout (não conta como falha de senha).
  if (usuario.situacao !== 'Ativo') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Usuário inativo. Contate o administrador.'
    })
  }

  // Lockout: consulta antes do bcrypt (design D5 — sem custo p/ bloqueadas).
  const minutos = bloqueioVigente(usuario.bloqueado_ate)
  if (minutos) {
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
    await registrarFalhaLogin(usuario.id)
    throw createError({ statusCode: 401, statusMessage: 'E-mail ou senha inválidos.' })
  }

  await limparFalhasLogin(usuario.id)
  await query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP(6) WHERE id = ?', [usuario.id])

  const sessao: UsuarioSessao = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil
  }
  await emitirSessao(event, sessao)
  return { usuario: sessao }
})
