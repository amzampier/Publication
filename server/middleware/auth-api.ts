// Middleware global de sessão para as APIs administrativas (change
// gestao-usuarios-backend, design D1): todo request sob /api/ (exceto
// /api/auth/* — a porta de autenticação) exige sessão válida; sem ela → 401.
// Fecha o achado crítico do QA da change de auth: /api/perfis, /api/configuracoes
// e /api/uploads também passam a ser protegidos. Com access JWT válido o
// getSessionUser só verifica o token (sem banco); expirado rotaciona o refresh.
import { getSessionUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const caminho = event.path ?? ''
  if (!caminho.startsWith('/api/')) return
  if (caminho.startsWith('/api/auth/')) return

  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
})
