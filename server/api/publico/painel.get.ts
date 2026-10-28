// GET /api/publico/painel - leitura anônima do painel de destaques da Área
// Pública. Não exige sessão e não expõe campos internos.
import { setResponseHeader } from 'h3'
import { listarPainelPublico } from '../../utils/publico'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  return await listarPainelPublico()
})
