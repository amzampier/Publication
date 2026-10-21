import { listarChamadas } from '../../utils/lancar-chamadas'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  const baixar = String(getQuery(event).download ?? '').trim() === '1'
  await requirePermission(event, 'lancar-chamadas', baixar ? 'download' : 'visualizar')
  return { chamadas: await listarChamadas() }
})
