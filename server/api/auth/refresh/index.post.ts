// POST /api/auth/refresh — rotação do refresh token (design D1/D8):
// valida a sessão ativa, revoga o token antigo e emite novos cookies.
// 401 quando não há refresh válido (o cliente cai para deslogado).
import { renovarSessao, sessaoPublica } from '../../../utils/auth'
import { exigirRateLimit } from '../../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  const sessao = await renovarSessao(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão inválida ou expirada.' })
  }
  return { usuario: sessaoPublica(sessao) }
})
