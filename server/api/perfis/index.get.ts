// GET /api/perfis — lista de perfis com matriz normalizada e contagem de vínculos
import { listarPerfis } from '../../utils/perfis'

export default defineEventHandler(async () => {
  return await listarPerfis()
})
