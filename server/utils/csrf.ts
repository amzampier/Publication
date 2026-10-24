import { timingSafeEqual } from 'node:crypto'

export const CSRF_COOKIE = 'csrf_token'
export const CSRF_HEADER = 'x-csrf-token'
export const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS'])

const CAMINHOS_ISENTOS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/esqueci-senha',
  '/api/auth/csrf',
  '/api/configuracoes/identidade'
]

export function caminhoIsentoCsrf(caminho: string): boolean {
  return CAMINHOS_ISENTOS.some((base) => caminho === base || caminho.startsWith(`${base}/`))
}

export function metodoExigeCsrf(metodo: string): boolean {
  return !METODOS_SEGUROS.has(metodo.toUpperCase())
}

export function origemDeUrl(valor: string | undefined | null): string | null {
  if (!valor) return null
  try {
    return new URL(valor).origin
  } catch {
    return null
  }
}

export function origemConfiavel(
  origem: string | undefined | null,
  appUrl: string,
  protocolo: string,
  host: string | undefined
): boolean {
  const recebida = origemDeUrl(origem)
  if (!recebida) return false
  const configurada = origemDeUrl(appUrl)
  const atual = host ? `${protocolo}//${host}` : null
  return recebida === configurada || recebida === atual
}

export function tokenCsrfValido(cookie: string | undefined, header: string | undefined): boolean {
  if (!cookie || !header || cookie.length !== header.length) return false
  try {
    return timingSafeEqual(Buffer.from(cookie), Buffer.from(header))
  } catch {
    return false
  }
}
