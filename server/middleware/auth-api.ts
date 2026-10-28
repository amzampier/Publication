// Middleware global de sessão para as APIs administrativas (change
// gestao-usuarios-backend, design D1): todo request sob /api/ (exceto
// /api/auth/* — a porta de autenticação) exige sessão válida; sem ela → 401.
// Fecha o achado crítico do QA da change de auth: /api/perfis, /api/configuracoes
// e /api/uploads também passam a ser protegidos. Com access JWT válido o
// getSessionUser só verifica o token (sem banco); expirado rotaciona o refresh.
import { getSessionUser, sessaoAtivaNoServidor, limparCookiesAuth } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const caminho = event.path ?? ''
  if (!caminho.startsWith('/api/')) return
  if (caminho.startsWith('/api/auth/')) return
  // Identidade pública do portal de autenticação (só logo_login_url) —
  // change auth-layout-logomarca-login: as telas sem sessão (/admin/login,
  // /admin/esqueci-senha) hidratam a logomarca via este endpoint mínimo.
  if (caminho.startsWith('/api/configuracoes/identidade')) return
  // Leitura pública da Área Pública (change area-publica-shell): somente GET/HEAD.
  const metodo = event.method ?? ''
  if ((metodo === 'GET' || metodo === 'HEAD') && caminho.startsWith('/api/publico/')) return

  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  // Revogação server-side (capability revogacao-sessao): conta ativa e versão
  // do token em dia, senão a sessão cai (logout/desativação/exclusão).
  if (!(await sessaoAtivaNoServidor(sessao))) {
    limparCookiesAuth(event)
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada ou revogada.' })
  }
  // Reaproveitada por requirePermission (server/utils/permission.ts) no mesmo
  // request — evita reautenticar e um segundo giro de refresh.
  event.context.sessaoUsuario = sessao
  // Senha provisória: bloqueia o uso administrativo até a troca (change
  // endurecer-banco-e-bootstrap). As rotas /api/auth/* já retornaram acima,
  // então a própria troca/logout/refresh seguem acessíveis.
  if (sessao.provisoria) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Defina uma nova senha para continuar (troca obrigatória no primeiro acesso).'
    })
  }
})
