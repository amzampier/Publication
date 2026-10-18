// GET /api/softwares — catálogo completo ordenado por código; ?exportar=1 exige
// a funcionalidade softwares/exportar (senão visualizar).
import { listarSoftwares } from '../../utils/softwares'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  const exportando = String(getQuery(event).exportar ?? '').trim() === '1'
  await requirePermission(event, 'softwares', exportando ? 'exportar' : 'visualizar')
  return await listarSoftwares()
})
