// POST /api/auth/esqueci-senha — recuperação com senha provisória POR E-MAIL
// (change auth-backend-resend, design D11; change corrigir-ordenacao-shell-e-carga,
// D4): resposta SEMPRE { ok: true } com o mesmo corpo e a MESMA latência
// (anti-enumeração). O envio do e-mail e a gravação da senha provisória ocorrem
// FORA do caminho da resposta (event.waitUntil), preservando a ordem "entrega
// antes da troca" — falha do envio mantém a senha anterior válida.
import { hash } from 'bcrypt'
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

  // Trabalho fora do caminho da resposta (D4): geração/envio/gravação — ou o
  // custo equivalente quando não há conta — sem atrasar nem diferenciar a resposta.
  const trabalho = async (): Promise<void> => {
    if (!usuario || usuario.situacao !== 'Ativo') {
      await registrarAuditoria(event, {
        acao: 'Acesso',
        recurso: 'Autenticação',
        detalhes: `Solicitou recuperação de senha para e-mail sem conta ativa (${email})`,
        sessao: { id: null, nome: email }
      })
      // Custo bcrypt equivalente ao caminho de conta existente (não revela existência).
      await hash(gerarSenhaProvisoria(), 12).catch(() => '')
      return
    }

    let enviado = false
    try {
      const senha = gerarSenhaProvisoria()
      const hashSenha = await hash(senha, 12)
      // Origem fixa dos links (APP_URL) — nunca o Host da requisição (RL03 M-03).
      const base = String(useRuntimeConfig().appUrl || '').replace(/\/+$/, '')
      if (!base) {
        throw new Error('APP_URL não configurada — não é possível montar o link de recuperação.')
      }
      const link = `${base}/admin/login`
      // Entrega o e-mail PRIMEIRO; só grava a nova senha se o envio der certo
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
      enviado = true
    } catch (erro) {
      // Detalhe só no servidor (a resposta genérica já foi emitida).
      console.error('[auth/esqueci-senha] falha ao gravar/enviar a senha provisória:', erro)
    }

    // A trilha reflete o desfecho real do envio (RL04 B-17), não um texto fixo.
    await registrarAuditoria(event, {
      acao: 'Acesso',
      recurso: 'Autenticação',
      entidadeId: usuario.id,
      detalhes: enviado
        ? `Solicitou a recuperação de senha (senha provisória enviada por e-mail para ${usuario.email})`
        : `Solicitou a recuperação de senha (falha no envio do e-mail para ${usuario.email}; senha anterior mantida)`,
      sessao: { id: usuario.id, nome: usuario.nome }
    })
  }

  // Emite a resposta genérica imediatamente; mantém a tarefa viva sem atrasá-la.
  const tarefa = trabalho()
  const waitUntil = (event as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil
  if (typeof waitUntil === 'function') {
    waitUntil.call(event, tarefa.catch(() => {}))
  } else {
    void tarefa.catch(() => {})
  }

  return RESPOSTA_GENERICA
})