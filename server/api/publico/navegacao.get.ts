// GET /api/publico/navegacao — resumo anônimo do conteúdo publicado para o
// shell da Área Pública. Não exige sessão e não expõe campos internos.
import { setResponseHeader } from 'h3'
import { listarNavegacaoPublica } from '../../utils/publico'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  return await listarNavegacaoPublica()
})
