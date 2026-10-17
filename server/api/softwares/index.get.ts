// GET /api/softwares — catálogo completo ordenado por código
import { listarSoftwares } from '../../utils/softwares'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'softwares', 'visualizar')
  return await listarSoftwares()
})
