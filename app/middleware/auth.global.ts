// Guarda global de rotas (docs/02 §5.3, spec `login`):
// - Área Pública (fora de /admin/**), /admin/login e /admin/esqueci-senha são
//   livres (telas de autenticação, as únicas rotas /admin/** sem shell);
// - as duas telas de autenticação com sessão redirecionam para /admin;
// - /admin/primeiro-acesso exige sessão (provisória) e é a única rota /admin/**
//   liberada enquanto a senha for provisória (change endurecer-banco-e-bootstrap);
// - qualquer outra rota /admin/** exige sessão e, se a senha for provisória,
//   força o redirecionamento para /admin/primeiro-acesso; sem sessão, manda para
//   /admin/login?redirect=.
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { sanitizarRedirectAdmin, useAuth } from '../composables/useAuth'

const ROTAS_AUTENTICACAO = ['/admin/login', '/admin/esqueci-senha']
const ROTA_PRIMEIRO_ACESSO = '/admin/primeiro-acesso'

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureSessao, usuario } = useAuth()
  const logado = await ensureSessao()
  const provisoria = usuario.value?.provisoria === true

  if (ROTAS_AUTENTICACAO.includes(to.path)) {
    if (!logado) return undefined
    return navigateTo(provisoria ? ROTA_PRIMEIRO_ACESSO : '/admin')
  }

  if (to.path === ROTA_PRIMEIRO_ACESSO) {
    if (!logado) return navigateTo('/admin/login')
    // Já trocou a senha: não faz sentido permanecer na tela.
    return provisoria ? undefined : navigateTo('/admin')
  }

  if (to.path.startsWith('/admin')) {
    if (!logado) {
      const destino = sanitizarRedirectAdmin(to.fullPath)
      return navigateTo(`/admin/login?redirect=${encodeURIComponent(destino)}`)
    }
    if (provisoria) return navigateTo(ROTA_PRIMEIRO_ACESSO)
    return undefined
  }

  // Área Pública: acesso anônimo.
  return undefined
})
