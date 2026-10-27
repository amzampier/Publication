// GET /api/esteira-revisao — fila do ciclo ativo, opções de filtro e progresso.
// ?busca=1 e ?filtros=1 exigem as funcionalidades correspondentes.
import { setResponseHeader, setResponseStatus } from 'h3'
import { listarEsteira } from '../../utils/esteira-revisao'
import { funcionalidadesDeConsulta, requirePermission } from '../../utils/permission'
import { ehSaturacaoDePool } from '../../utils/pool-error'

export default defineEventHandler(async (event) => {
  const consulta = getQuery(event)
  const busca = String(consulta.busca ?? '').trim() === '1'
  const filtros = String(consulta.filtros ?? '').trim() === '1'
  for (const acao of funcionalidadesDeConsulta({ busca, filtros })) {
    await requirePermission(event, 'esteira-revisao', acao)
  }
  const pagina = Math.max(1, Math.trunc(Number(consulta.pagina) || 1))
  const porPagina = Math.min(500, Math.max(1, Math.trunc(Number(consulta.porPagina) || 200)))
  const status = String(consulta.status ?? '').trim()
  try {
    return await listarEsteira(pagina, porPagina, status)
  } catch (erro) {
    if (!ehSaturacaoDePool(erro)) throw erro
    setResponseStatus(event, 503)
    setResponseHeader(event, 'Retry-After', 2)
    return { message: 'Serviço temporariamente indisponível. Tente novamente em instantes.' }
  }
})
