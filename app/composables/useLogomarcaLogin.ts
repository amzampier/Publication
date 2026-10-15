// Estado compartilhado entre Configurações > Logomarcas (logo da tela de login) e
// o relatório em PDF da Gestão de Auditoria (cabeçalho do relatório).
// Fase 1: em memória (useState) - recarregar a página restaura a marca padrão
// (a hidratação real vem de carregarIdentidadeLogin ou carregarConfiguracoesGlobais).
import { useApiFetch } from './useApiFetch'

export const useLogomarcaLogin = () => {
  const caminho = useState<string>('logomarca-login-caminho', () => '')
  const preview = useState<string>('logomarca-login-preview', () => '')
  return { caminho, preview }
}

/**
 * Hidrata a logomarca do login a partir do endpoint público
 * GET /api/configuracoes/identidade (change auth-layout-logomarca-login).
 * O GET completo de configurações exige sessão (server/middleware/auth-api.ts),
 * então as telas sem sessão consomem este endpoint mínimo (só logo_login_url).
 * Falha mantém os defaults — o AuthLoginHeader cai na marca padrão do sistema.
 */
export async function carregarIdentidadeLogin(): Promise<void> {
  // useState ANTES do await (o contexto Nuxt se perde após await no SSR — NUXT_E1001).
  const { caminho, preview } = useLogomarcaLogin()
  try {
    const { logo_login_url } = await useApiFetch<{ logo_login_url: string | null }>(
      '/api/configuracoes/identidade'
    )
    caminho.value = logo_login_url ?? ''
    preview.value = logo_login_url ?? ''
  } catch {
    // Falha do GET (ex.: banco indisponível) → marca padrão, sem quebrar a tela.
  }
}
