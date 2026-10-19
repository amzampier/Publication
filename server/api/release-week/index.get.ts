// GET /api/release-week — releases não arquivadas (com itensCount); ?exportar=1
// exige release-week/exportar (senão visualizar).
import { listarReleaseWeeks } from '../../utils/release-week'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  const exportando = String(getQuery(event).exportar ?? '').trim() === '1'
  await requirePermission(event, 'release-week', exportando ? 'exportar' : 'visualizar')
  return await listarReleaseWeeks()
})
