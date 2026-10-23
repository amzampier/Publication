// GET /api/lancar-chamadas/:id — detalhe completo (HTML/mídias/tags) sob demanda.
import { buscarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'visualizar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const chamada = await buscarChamada(id)
  if (!chamada) {
    throw createError({ statusCode: 404, statusMessage: 'Chamada não encontrada.' })
  }
  return chamada
})