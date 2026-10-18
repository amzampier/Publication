// GET /api/parceiros — cadastro completo ordenado por código
import { listarParceiros } from '../../utils/parceiros'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'parceiros', 'visualizar')
  return await listarParceiros()
})
