// GET /api/perfis — lista de perfis com matriz normalizada e contagem de vínculos
import { listarPerfis } from '../../utils/perfis'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'perfis-acesso', 'visualizar')
  return await listarPerfis()
})
