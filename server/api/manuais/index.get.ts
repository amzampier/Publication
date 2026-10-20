// GET /api/manuais — catálogos não arquivados (com itensCount); ?exportar=1
// exige manuais/exportar (senão visualizar).
import { listarManuais } from '../../utils/manuais'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  const exportando = String(getQuery(event).exportar ?? '').trim() === '1'
  await requirePermission(event, 'manuais', exportando ? 'exportar' : 'visualizar')
  return await listarManuais()
})
