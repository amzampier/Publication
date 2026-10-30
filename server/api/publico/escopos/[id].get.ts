// GET /api/publico/escopos/:id - cabeçalho público de um escopo publicado.
// Não exige sessão e não expõe autoria, revisão ou auditoria.
import { createError, getRouterParam, setResponseHeader } from 'h3'
import { buscarEscopoPublico } from '../../../utils/publico'

export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=60, stale-while-revalidate=300'
  )

  const id = getRouterParam(event, 'id') ?? ''
  const escopo = await buscarEscopoPublico(id)
  if (!escopo) {
    throw createError({ statusCode: 404, statusMessage: 'Escopo público não encontrado.' })
  }
  return escopo
})
