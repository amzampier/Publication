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
    // Genérico: mesma resposta de um e-mail cadastrado (nenhum e-mail sai).
    return RESPOSTA_GENERICA
  }

  try {
    const senha = gerarSenhaProvisoria()
    const hashSenha = await hash(senha, 12)
    await query('UPDATE usuarios SET hash_senha = ?, senha_provisoria = 1 WHERE id = ?', [
      hashSenha,
      usuario.id
    ])

    const link = `${getRequestURL(event).origin}/admin/login`
    await enviarEmail({
      para: usuario.email,
      assunto: ASSUNTO_RECUPERACAO,
      html: renderHtmlRecuperacao({ nome: usuario.nome, senha, link }),
      text: renderTextoRecuperacao({ nome: usuario.nome, senha, link })
    })
  } catch (erro) {
    // Resposta idêntica em qualquer falha (D11) — detalhe só no servidor.
    console.error('[auth/esqueci-senha] falha no envio via Resend:', erro)
  }

  return RESPOSTA_GENERICA
})
