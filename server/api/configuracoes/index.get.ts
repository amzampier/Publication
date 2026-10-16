// GET /api/configuracoes — linha completa de configuracoes_globais (config_default)
import { getConfiguracoes } from '../../utils/configuracoes'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'configuracoes-globais', 'visualizar')
  return await getConfiguracoes()
})
