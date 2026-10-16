// GET /api/seguranca/estado — constantes, contas em estado de segurança e
// últimos eventos de login (aba Segurança; sessão exigida pelo middleware)
import { listarEstadoSeguranca } from '../../../utils/seguranca'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'configuracoes-globais', 'visualizar')
  return await listarEstadoSeguranca()
})
