// GET /api/manuais/:id/itens — itens (entregas_itens) do manual, somente
// leitura; exige manuais/visualizar_itens.
import { buscarManual, listarItensManual, validarIdManual } from '../../../../utils/manuais'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'visualizar_itens')
  const id = validarIdManual(getRouterParam(event, 'id'))
  const manual = await buscarManual(id)
  if (!manual) {
    throw createError({ statusCode: 404, statusMessage: 'Manual não encontrado.' })
  }
  return await listarItensManual(id)
})
