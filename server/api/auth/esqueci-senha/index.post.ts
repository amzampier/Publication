// POST /api/auth/esqueci-senha — recuperação com senha provisória POR E-MAIL
// (change auth-backend-resend, design D11): resposta SEMPRE { ok: true } com
// o mesmo corpo (anti-enumeração — cadastrado ou não, mesma aparência); o
// servidor só gera/grava/envia quando a conta existe. Falha do Resend é logada
// aqui sem alterar a resposta (não pode vazar existência).
import { hash } from 'bcrypt'
import { getRequestURL } from 'h3'
import {
  gerarSenhaProvisoria,
  renderHtmlRecuperacao,
  renderTextoRecuperacao,
  ASSUNTO_RECUPERACAO
} from '#shared/utils/emails'
import { buscarUsuarioPorEmail } from '../../../utils/auth'
import { query } from '../../../utils/db'
import { enviarEmail } from '../../../utils/mailer'
import { exigirRateLimit } from '../../../utils/rateLimit'
import { registrarAuditoria } from '../../../utils/audit'

const RESPOSTA_GENERICA = { ok: true }

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  const body = await readBody<{ email?: unknown }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail válido.' })
  }

  const usuario = await buscarUsuarioPorEmail(email)
  if (!usuario || usuario.situacao !== 'Ativo') {
    // Trilha 'Acesso': tentativa registrada mesmo sem conta — a resposta ao
    // cliente continua genérica (anti-enumeração), o log é interno.
    await registrarAuditoria(event, {
      acao: 'Acesso',
      recurso: 'Autenticação',
      detalhes: `Solicitou recuperação de senha para e-mail sem conta ativa (${email})`,
      sessao: { id: null, nome: email }
    })
    // M-07: custo bcrypt equivalente ao caminho de conta existente (o tempo de
    // resposta não deve revelar se o e-mail existe).
    await hash(gerarSenhaProvisoria(), 12).catch(() => '')
    // Genérico: mesma resposta de um e-mail cadastrado (nenhum e-mail sai).
    return RESPOSTA_GENERICA
  }

  try {
    const senha = gerarSenhaProvisoria()
    const hashSenha = await hash(senha, 12)
    // M-09: origem fixa dos links (APP_URL) — não confia no Host recebido.
    const base = String(useRuntimeConfig().appUrl || '') || getRequestURL(event).origin
    const link = `${base}/admin/login`
    // 5.1: entrega o e-mail PRIMEIRO; só grava a nova senha se o envio der certo
    // (falha do provedor mantém a senha anterior válida).
    await enviarEmail({
      para: usuario.email,
      assunto: ASSUNTO_RECUPERACAO,
      html: renderHtmlRecuperacao({ nome: usuario.nome, senha, link }),
      text: renderTextoRecuperacao({ nome: usuario.nome, senha, link })
    })
    await query('UPDATE usuarios SET hash_senha = ?, senha_provisoria = 1 WHERE id = ?', [
      hashSenha,
      usuario.id
    ])
  } catch (erro) {
    // Resposta idêntica em qualquer falha (D11) — detalhe só no servidor.
    console.error('[auth/esqueci-senha] falha ao gravar/enviar a senha provisória:', erro)
  }

  await registrarAuditoria(event, {
    acao: 'Acesso',
    recurso: 'Autenticação',
    entidadeId: usuario.id,
    detalhes: `Solicitou a recuperação de senha (senha provisória enviada por e-mail para ${usuario.email})`,
    sessao: { id: usuario.id, nome: usuario.nome }
  })

  return RESPOSTA_GENERICA
})
