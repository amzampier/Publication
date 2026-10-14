// POST /api/auth/logout — revoga a sessão no servidor (revogado_em) e limpa
// os cookies HttpOnly (design D1). Sempre responde ok (idempotente).
import { getCookie } from 'h3'
import { revogarSessao, limparCookiesAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const refresh = getCookie(event, 'auth-refresh') ?? getCookie(event, '__Host-auth-refresh')
  await revogarSessao(refresh)
  limparCookiesAuth(event)
  return { ok: true }
})
