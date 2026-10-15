// GET /api/configuracoes/identidade — identidade pública do portal de
// autenticação (change auth-layout-logomarca-login): expõe SOMENTE o caminho
// da logomarca do login, para as telas sem sessão (/admin/login e
// /admin/esqueci-senha) hidratarem o cabeçalho no primeiro paint. O restante
// da linha de configurações permanece protegido por server/middleware/auth-api.ts
// (que dispensa este caminho explicitamente).
import { getConfiguracoes } from '../../../utils/configuracoes'

export default defineEventHandler(async () => {
  const cfg = await getConfiguracoes()
  return { logo_login_url: cfg.logo_login_url }
})
