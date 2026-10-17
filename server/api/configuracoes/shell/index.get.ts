// GET /api/configuracoes/shell — preferências do shell (RL04-M-03): apenas
// SESSÃO (sem permissão de módulo), para que qualquer perfil administrativo
// aplique logomarca/sidebar/sessões salvas. Não devolve rate limit nem retenção.
import { getConfiguracoes } from '../../../utils/configuracoes'

export default defineEventHandler(async () => {
  const cfg = await getConfiguracoes()
  return {
    logo_header_url: cfg.logo_header_url,
    logo_login_url: cfg.logo_login_url,
    sidebar_grupos: cfg.sidebar_grupos,
    sidebar_expandida: cfg.sidebar_expandida
  }
})