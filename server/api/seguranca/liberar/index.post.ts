// POST /api/seguranca/liberar — destrava na hora: { usuarioId } zera falhas e
// bloqueio da conta; { email } registra a liberação de um bloqueio de e-mail
// inexistente no log (evento 'bloqueio-liberado', append-only). Ação imediata
// da aba Segurança, fora do rascunho do Salvar global.
import { liberarBloqueio, liberarBloqueioEmail } from '../../../utils/seguranca'
import { ipDoCliente } from '../../../utils/rateLimit'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ usuarioId?: unknown; email?: unknown }>(event)
  const usuarioId = typeof body?.usuarioId === 'string' ? body.usuarioId.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (usuarioId) {
    const liberado = await liberarBloqueio(usuarioId)
    if (!liberado) {
      throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
    }
    await registrarAuditoria(event, {
      acao: 'Alteração',
      recurso: 'Rate Limits',
      entidadeId: usuarioId,
      detalhes: 'Liberou o bloqueio de uma conta de usuário (zerou falhas e bloqueio)'
    })
    return { ok: true }
  }

  if (email) {
    await liberarBloqueioEmail(email, ipDoCliente(event))
    await registrarAuditoria(event, {
      acao: 'Alteração',
      recurso: 'Rate Limits',
      detalhes: `Liberou o bloqueio do e-mail inexistente '${email}'`
    })
    return { ok: true }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Informe o usuário (usuarioId) ou o e-mail bloqueado.'
  })
})
