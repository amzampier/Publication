// Camada de comunicação com a API (docs/02 §5.2) — change auth-backend-resend:
// credentials + headers de contexto de auditoria + AUTO-REFRESH com
// single-flight (design D8): num 401, TODAS as chamadas em voo compartilham a
// MESMA promessa de /api/auth/refresh (cada rotação invalida o token anterior
// — N refreshes simultâneos derrubariam a sessão) e refazem a requisição uma
// vez; refresh definitivamente falho → estado local cai (sessão inválida) e o
// middleware leva ao login.
import type { UsuarioLogado } from './useAuth'
import { useAuth } from './useAuth'

let refreshEmVoo: Promise<boolean> | null = null

function renovarUmaVez(): Promise<boolean> {
  if (!refreshEmVoo) {
    refreshEmVoo = $fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshEmVoo = null
      })
  }
  return refreshEmVoo
}

export function useApiFetch<T = any>(
  request: Parameters<typeof $fetch>[0],
  opts?: Parameters<typeof $fetch>[1]
) {
  const usuario = useState<UsuarioLogado | null>('auth-usuario', () => null)
  const headers: Record<string, string> = { ...(opts?.headers as Record<string, string>) }

  if (usuario.value?.id) headers['x-usuario-id'] = usuario.value.id
  if (usuario.value?.nome) headers['x-usuario-nome'] = encodeURIComponent(usuario.value.nome)

  const doFetch = () => {
    // No SSR, useRequestFetch encaminha os cookies da requisição entrante
    // (mesmo padrão de useAuth.ensureSessao) — essencial para rotas protegidas
    // chamadas no setup do layout (ex.: GET /api/configuracoes no admin, que o
    // auth-api.ts exige sessão). No cliente é $fetch com credentials, como antes.
    const fetchInterno = import.meta.server ? useRequestFetch() : $fetch
    return fetchInterno<T>(request, {
      ...opts,
      headers,
      credentials: 'include'
    })
  }

  return doFetch().catch(async (erro: any) => {
    if (erro?.statusCode !== 401 && erro?.status !== 401) throw erro

    const renovado = await renovarUmaVez()
    if (!renovado) {
      useAuth().sessaoInvalidada()
      throw erro
    }
    return doFetch()
  }) as Promise<T>
}
