import { getCookie, getHeader } from 'h3'
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  caminhoIsentoCsrf,
  metodoExigeCsrf,
  origemConfiavel,
  origemDeUrl,
  tokenCsrfValido
} from '../utils/csrf'

export default defineEventHandler((event) => {
  const caminho = String(event.path ?? '/').split('?')[0] || '/'
  if (!caminho.startsWith('/api/')) return
  if (!metodoExigeCsrf(String(event.method ?? 'GET'))) return
  if (caminhoIsentoCsrf(caminho)) return

  const cookie = getCookie(event, CSRF_COOKIE)
  const header = getHeader(event, CSRF_HEADER)
  if (tokenCsrfValido(cookie, header)) return

  const origem = getHeader(event, 'origin') ?? getHeader(event, 'referer')
  const protocolo =
    String(event.node.req.headers['x-forwarded-proto'] ?? '').split(',')[0]?.trim() ||
    ((event.node.req.socket as { encrypted?: boolean }).encrypted ? 'https' : 'http')
  const appUrl = String(useRuntimeConfig().appUrl || '')
  if (origemConfiavel(origemDeUrl(origem), appUrl, protocolo, getHeader(event, 'host'))) return

  throw createError({
    statusCode: 403,
    statusMessage: 'Requisição bloqueada por proteção CSRF.'
  })
})