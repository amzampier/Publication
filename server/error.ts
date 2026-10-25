import { send, setResponseHeader, setResponseHeaders, setResponseStatus } from 'h3'
import { defineNitroErrorHandler } from 'nitropack/runtime'
import { ehSaturacaoDePool } from './utils/pool-error'

export default defineNitroErrorHandler(async (error, event, { defaultHandler }) => {
  if (ehSaturacaoDePool(error) || ehSaturacaoDePool(error.cause)) {
    setResponseStatus(event, 503, 'Service Unavailable')
    setResponseHeader(event, 'Retry-After', 2)
    return send(event, JSON.stringify({
      error: true,
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: 'Serviço temporariamente indisponível. Tente novamente em instantes.'
    }))
  }

  const res = await defaultHandler(error, event, { silent: true, json: true })
  if (res.status >= 500) {
    res.statusText = 'Server Error'
    res.body = {
      error: true,
      statusCode: res.status,
      statusMessage: 'Server Error',
      message: 'Erro interno do servidor.'
    }
  }
  setResponseHeaders(event, res.headers)
  setResponseStatus(event, res.status, res.statusText)
  return send(event, JSON.stringify(res.body))
})