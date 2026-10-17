// GET /api/auth/seguro — hidratação da sessão no cliente (design D7): devolve
// { usuario } a partir dos cookies HttpOnly (renovando o access expirado pelo
// refresh, com rotação) ou 401 — o cliente não tem como ler o cookie sozinho.
// A sessão é validada também no servidor (change endurecer-revogacao-sessao,
// design D1): token revogado por logout não hidrata (401).
import { obterSessaoValida, sessaoPublica } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const sessao = await obterSessaoValida(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada ou revogada.' })
  }
  return { usuario: sessaoPublica(sessao) }
})
