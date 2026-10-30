// GET /api/publico/escopos/:id/chamadas - chamadas públicas do escopo,
// opcionalmente filtradas por sistema. Leitura anônima e paginada.
import { createError, getQuery, getRouterParam, setResponseHeader } from 'h3'
import {
  buscarEscopoPublico,
  listarChamadasEscopoPublico
} from '../../../../utils/publico'

export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=30, stale-while-revalidate=120'
  )

  const id = getRouterParam(event, 'id') ?? ''
  const escopo = await buscarEscopoPublico(id)
  if (!escopo) {
    throw createError({ statusCode: 404, statusMessage: 'Escopo público não encontrado.' })
  }

  const query = getQuery(event)
  return await listarChamadasEscopoPublico({
    id,
    sistema: query.sistema,
    pagina: query.pagina,
    porPagina: query.porPagina
  })
})
