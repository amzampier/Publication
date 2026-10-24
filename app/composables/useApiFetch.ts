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
let csrfToken: string | null = null
let csrfEmVoo: Promise<string | null> | null = null

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

async function obterCsrf(): Promise<string | null> {
  if (!import.meta.client) return null
  if (csrfToken) return csrfToken
  if (!csrfEmVoo) {
    csrfEmVoo = $fetch<{ csrfToken: string }>('/api/auth/csrf', { credentials: 'include' })
      .then((resp) => {
        csrfToken = resp?.csrfToken ?? null
        return csrfToken
      })
      .catch(() => null)
      .finally(() => {
        csrfEmVoo = null
      })
  }
  return csrfEmVoo
}

export function useApiFetch<T = any>(
  request: Parameters<typeof $fetch>[0],
  opts?: Parameters<typeof $fetch>[1]
) {
  const usuario = useState<UsuarioLogado | null>('auth-usuario', () => null)
  const ultimoErro = useState<{ status: number; message: string } | null>(
    'api-ultimo-erro',
    () => null
  )
  const headers: Record<string, string> = { ...(opts?.headers as Record<string, string>) }

  if (usuario.value?.id) headers['x-usuario-id'] = usuario.value.id
  if (usuario.value?.nome) headers['x-usuario-nome'] = encodeURIComponent(usuario.value.nome)

  const doFetch = async () => {
    const metodo = String(opts?.method ?? 'GET').toUpperCase()
    if (!['GET', 'HEAD', 'OPTIONS'].includes(metodo)) {
      const token = await obterCsrf()
      if (token) headers['x-csrf-token'] = token
    }
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

  const registrarErro = (erro: any) => {
    const status = Number(erro?.statusCode ?? erro?.status ?? 0)
    ultimoErro.value = {
      status: Number.isFinite(status) ? status : 0,
      message: String(erro?.data?.statusMessage ?? erro?.statusMessage ?? '')
    }
  }

  return doFetch().catch(async (erro: any) => {
    if (erro?.statusCode !== 401 && erro?.status !== 401) {
      registrarErro(erro)
      throw erro
    }

    const renovado = await renovarUmaVez()
    if (!renovado) {
      registrarErro(erro)
      useAuth().sessaoInvalidada()
      throw erro
    }
    return doFetch().catch((erroFinal: any) => {
      registrarErro(erroFinal)
      throw erroFinal
    })
  }) as Promise<T>
}
