// GET /api/publico/releases - histórico público filtrável e paginado.
// Parâmetros inválidos são normalizados; a leitura não exige sessão.
import { getQuery, setResponseHeader } from 'h3'
import { listarHistoricoPublico } from '../../utils/publico'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
  return await listarHistoricoPublico({
    software: query.software,
    tipo: query.tipo,
    pagina: query.pagina,
    porPagina: query.porPagina
  })
})
