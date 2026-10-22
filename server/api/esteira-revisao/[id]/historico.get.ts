// GET /api/esteira-revisao/:id/historico — transições registradas para a chamada.
import { requirePermission } from '../../../utils/permission'
import { validarIdChamada } from '../../../utils/lancar-chamadas'
import { buscarHistoricoEsteira } from '../../../utils/esteira-revisao'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'esteira-revisao', 'visualizar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  return await buscarHistoricoEsteira(id)
})
