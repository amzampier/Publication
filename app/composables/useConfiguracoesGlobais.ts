// Carga das Configurações Globais salvas e aplicação no estado do shell.
// Usada pelo layout admin (qualquer rota da Área Administrativa) e pela
// página de Configurações Globais — sem ela, as preferências salvas só
// valiam na própria página de config e o shell reabria com os defaults.
import { useApiFetch } from './useApiFetch'
import { useLogomarcaHeader } from './useLogomarcaHeader'
import { useLogomarcaLogin } from './useLogomarcaLogin'
import { useSidebarExpandida } from './useSidebarExpandida'
import { useSessoesAbertas } from './useSessoesAbertas'
import { sessoes } from '../config/navigation'
import { chavePorLabel } from '../config/sidebar-keys'

export interface ConfiguracoesGlobaisApi {
  dias_retencao_auditoria: number
  logo_header_url: string | null
  logo_login_url: string | null
  sidebar_grupos: Record<string, boolean>
  sidebar_expandida: boolean
  /** Linha configuracoes_limite_requisicao (aba Segurança — change seguranca-rate-limits-reais). */
  rate_limit: {
    ativo: boolean
    limite_requisicoes_minuto: number
  }
}

/** Preferências do shell (porta somente-sessão /api/configuracoes/shell — RL04-M-03). */
export interface ShellConfiguracoesApi {
  logo_header_url: string | null
  logo_login_url: string | null
  sidebar_grupos: Record<string, boolean>
  sidebar_expandida: boolean
}

/**
 * Captura os composables de estado do shell ANTES do await (NUXT_E1001: após
 * await o contexto Nuxt se perde no SSR). Devolve os refs para aplicar depois.
 */
const capturarPreferencias = () => ({
  header: useLogomarcaHeader(),
  login: useLogomarcaLogin(),
  sidebar: useSidebarExpandida(),
  sessoesAbertas: useSessoesAbertas()
})

/** Aplica as preferências de shell (logo, sidebar, sessões) ao estado compartilhado. */
const aplicarPreferencias = (
  refs: ReturnType<typeof capturarPreferencias>,
  cfg: ShellConfiguracoesApi
): void => {
  refs.header.caminho.value = cfg.logo_header_url ?? ''
  refs.header.preview.value = cfg.logo_header_url ?? ''
  refs.login.caminho.value = cfg.logo_login_url ?? ''
  refs.login.preview.value = cfg.logo_login_url ?? ''
  refs.sidebar.expandida.value = cfg.sidebar_expandida
  // A preferência salva prevalece sobre o ajuste de largura da viewport.
  refs.sidebar.marcarPreferenciaManual()
  refs.sessoesAbertas.abertas.value = Object.fromEntries(
    sessoes.map((sessao) => {
      const chave = chavePorLabel(sessao.label)
      return [sessao.label, chave ? (cfg.sidebar_grupos[chave] ?? sessao.aberto) : sessao.aberto]
    })
  )
}

/**
 * Preferências do SHELL (RL04-M-03): lê `GET /api/configuracoes/shell` — porta
 * SOMENTE SESSÃO, disponível a qualquer perfil administrativo (não exige a
 * permissão `configuracoes-globais/visualizar`). Usada pelo layout admin.
 */
export async function carregarShell(forcar = false): Promise<ShellConfiguracoesApi | null> {
  const refs = capturarPreferencias()
  const cache = useState<ShellConfiguracoesApi | null>('config-shell-cache', () => null)

  if (!forcar && cache.value) {
    aplicarPreferencias(refs, cache.value)
    return cache.value
  }
  try {
    const cfg = await useApiFetch<ShellConfiguracoesApi>('/api/configuracoes/shell')
    cache.value = cfg
    aplicarPreferencias(refs, cfg)
    return cfg
  } catch {
    return null
  }
}

/**
 * Configuração COMPLETA (RL04-M-04) para a tela de Configurações Globais
 * (`GET /api/configuracoes`, gated pela permissão). `forcar = true` refaz a busca.
 */
export async function carregarConfiguracoesGlobais(
  forcar = false
): Promise<ConfiguracoesGlobaisApi | null> {
  const refs = capturarPreferencias()
  const cache = useState<ConfiguracoesGlobaisApi | null>('config-globais-cache', () => null)

  if (!forcar && cache.value) {
    aplicarPreferencias(refs, cache.value)
    return cache.value
  }
  try {
    const cfg = await useApiFetch<ConfiguracoesGlobaisApi>('/api/configuracoes')
    cache.value = cfg
    aplicarPreferencias(refs, cfg)
    return cfg
  } catch {
    return null
  }
}

/**
 * Após salvar (RL04-M-04): atualiza os caches (completo + shell) com a resposta
 * do PUT e reaplica no shell, de modo que reentrar na tela e navegar (sem F5)
 * mostrem os valores salvos.
 */
export function atualizarCachesAposSalvar(cfg: ConfiguracoesGlobaisApi): void {
  const refs = capturarPreferencias()
  const cacheCompleto = useState<ConfiguracoesGlobaisApi | null>('config-globais-cache', () => null)
  const cacheShell = useState<ShellConfiguracoesApi | null>('config-shell-cache', () => null)
  cacheCompleto.value = cfg
  cacheShell.value = {
    logo_header_url: cfg.logo_header_url,
    logo_login_url: cfg.logo_login_url,
    sidebar_grupos: cfg.sidebar_grupos,
    sidebar_expandida: cfg.sidebar_expandida
  }
  aplicarPreferencias(refs, cacheShell.value)
}