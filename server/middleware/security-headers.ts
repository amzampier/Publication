import { setHeader } from 'h3'
import { headersSeguranca } from '../utils/security-headers'

export default defineEventHandler((event) => {
  const caminho = String(event.path ?? '/').split('?')[0] || '/'
  const protocolo =
    String(event.node.req.headers['x-forwarded-proto'] ?? '').split(',')[0]?.trim() ||
    ((event.node.req.socket as { encrypted?: boolean }).encrypted ? 'https' : 'http')
  const headers = headersSeguranca(
    caminho,
    process.env.NODE_ENV === 'production',
    protocolo === 'https'
  )
  for (const [nome, valor] of Object.entries(headers)) {
    if (valor) setHeader(event, nome, valor)
  }
})