// POST /api/seguranca/liberar — destrava na hora: { usuarioId } zera falhas e
// bloqueio da conta; { email } registra a liberação de um bloqueio de e-mail
// inexistente no log (evento 'bloqueio-liberado', append-only). Ação imediata
// da aba Segurança, fora do rascunho do Salvar global.
import { liberarBloqueio, liberarBloqueioEmail } from '../../../utils/seguranca'
import { ipDoCliente } from '../../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ usuarioId?: unknown; email?: unknown }>(event)
  const usuarioId = typeof body?.usuarioId === 'string' ? body.usuarioId.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (usuarioId) {
    const liberado = await liberarBloqueio(usuarioId)
    if (!liberado) {
      throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
    }
    return { ok: true }
  }

  if (email) {
    await liberarBloqueioEmail(email, ipDoCliente(event))
    return { ok: true }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Informe o usuário (usuarioId) ou o e-mail bloqueado.'
  })
})
