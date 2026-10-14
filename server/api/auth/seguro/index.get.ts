// GET /api/auth/seguro — hidratação da sessão no cliente (design D7): devolve
// { usuario } a partir dos cookies HttpOnly (renovando o access expirado pelo
// refresh, com rotação) ou 401 — o cliente não tem como ler o cookie sozinho.
import { getSessionUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  return { usuario: sessao }
})
