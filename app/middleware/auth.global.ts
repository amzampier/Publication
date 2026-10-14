// Guarda global de rotas (docs/02 §5.3, spec `login`):
// - Área Pública (fora de /admin/**), /admin/login e /admin/esqueci-senha são
//   livres (telas de autenticação, as únicas rotas /admin/** sem shell);
// - as duas telas de autenticação com sessão redirecionam para /admin;
// - qualquer outra rota /admin/** exige sessão (hidratada via API —
//   GET /api/auth/seguro, com cache em useState) e, sem ela, manda para
//   /admin/login?redirect=.
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { sanitizarRedirectAdmin, useAuth } from '../composables/useAuth'

const ROTAS_AUTENTICACAO = ['/admin/login', '/admin/esqueci-senha']

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureSessao } = useAuth()

  if (ROTAS_AUTENTICACAO.includes(to.path)) {
    return (await ensureSessao()) ? navigateTo('/admin') : undefined
  }

  if (to.path.startsWith('/admin')) {
    if (await ensureSessao()) return undefined

    const destino = sanitizarRedirectAdmin(to.fullPath)
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(destino)}`)
  }

  // Área Pública: acesso anônimo.
  return undefined
})
