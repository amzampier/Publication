// GET /api/configuracoes — linha completa de configuracoes_globais (config_default)
import { getConfiguracoes } from '../../utils/configuracoes'

export default defineEventHandler(async () => {
  return await getConfiguracoes()
})
