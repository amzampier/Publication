import { listarOpcoesChamadas } from '../../utils/lancar-chamadas'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'visualizar')
  return await listarOpcoesChamadas()
})
