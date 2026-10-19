// GET /api/release-week/:id/itens — itens (entregas_itens) da release,
// somente leitura; exige release-week/visualizar_itens.
import { buscarReleaseWeek, listarItensRelease, validarIdRelease } from '../../../../utils/release-week'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'visualizar_itens')
  const id = validarIdRelease(getRouterParam(event, 'id'))
  const release = await buscarReleaseWeek(id)
  if (!release) {
    throw createError({ statusCode: 404, statusMessage: 'Release Week não encontrada.' })
  }
  return await listarItensRelease(id)
})
