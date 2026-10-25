// Mapeia saturação da fila do pool para 503 + Retry-After em qualquer rota,
// inclusive quando o erro ocorre na sessão ou no RBAC (antes do try do handler).
import { setResponseHeader, setResponseStatus } from 'h3'
import { ehSaturacaoDePool } from '../utils/pool-error'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    if (!event || !ehSaturacaoDePool(error)) return
    setResponseStatus(event, 503)
    setResponseHeader(event, 'Retry-After', 2)
  })
})