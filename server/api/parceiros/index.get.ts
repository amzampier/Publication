// GET /api/parceiros — cadastro completo ordenado por código; ?exportar=1 exige
// a funcionalidade parceiros/exportar (senão visualizar).
import { listarParceiros } from '../../utils/parceiros'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  const exportando = String(getQuery(event).exportar ?? '').trim() === '1'
  await requirePermission(event, 'parceiros', exportando ? 'exportar' : 'visualizar')
  return await listarParceiros()
})
