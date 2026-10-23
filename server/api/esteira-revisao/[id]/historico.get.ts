// GET /api/esteira-revisao/:id/historico — transições registradas para a chamada.
import { requirePermission } from '../../../utils/permission'
import { buscarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { buscarHistoricoEsteira } from '../../../utils/esteira-revisao'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'esteira-revisao', 'visualizar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const chamada = await buscarChamada(id)
  if (!chamada) {
    throw createError({ statusCode: 404, statusMessage: 'Chamada não encontrada.' })
  }
  return await buscarHistoricoEsteira(id)
})