// GET /api/esteira-revisao/:id — detalhe da chamada com contexto dos vínculos.
import { requirePermission } from '../../../utils/permission'
import { validarIdChamada } from '../../../utils/lancar-chamadas'
import { buscarItemEsteira } from '../../../utils/esteira-revisao'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'esteira-revisao', 'visualizar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const item = await buscarItemEsteira(id)
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Chamada não encontrada.' })
  }
  return item
})
