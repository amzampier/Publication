// GET /api/perfis — lista de perfis com matriz normalizada e contagem de vínculos;
// ?exportar=1 exige a funcionalidade perfis-acesso/exportar (senão visualizar).
import { listarPerfis } from '../../utils/perfis'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  const exportando = String(getQuery(event).exportar ?? '').trim() === '1'
  await requirePermission(event, 'perfis-acesso', exportando ? 'exportar' : 'visualizar')
  return await listarPerfis()
})
