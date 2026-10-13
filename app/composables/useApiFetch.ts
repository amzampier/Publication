// Camada de comunicação com a API (docs/02 §5.2) — versão mínima desta fase:
// credentials + headers de contexto de auditoria. O auto-refresh de 401
// (/api/auth/refresh) entra junto com a change de auth (JWT/sessões).
import type { UsuarioLogado } from './useAuth'

export function useApiFetch<T = any>(
  request: Parameters<typeof $fetch>[0],
  opts?: Parameters<typeof $fetch>[1]
) {
  const usuario = useState<UsuarioLogado | null>('auth-usuario', () => null)
  const headers: Record<string, string> = { ...(opts?.headers as Record<string, string>) }

  if (usuario.value?.id) headers['x-usuario-id'] = usuario.value.id
  if (usuario.value?.nome) headers['x-usuario-nome'] = encodeURIComponent(usuario.value.nome)

  return $fetch<T>(request, {
    ...opts,
    headers,
    credentials: 'include'
  })
}
