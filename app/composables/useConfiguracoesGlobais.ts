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
}

/**
 * Busca `GET /api/configuracoes` e aplica no estado compartilhado do shell:
 * logomarcas (header/login), sidebar expandida/recolhida e sessões do menu.
 * Retorna os dados em sucesso e `null` em falha (defaults do seed valem).
 */
export async function carregarConfiguracoesGlobais(): Promise<ConfiguracoesGlobaisApi | null> {
  // useState-backed composables ANTES do await — após await o contexto Nuxt se
  // perde no SSR (NUXT_E1001) e o estado não hidrata no payload. Só o GET e as
  // atribuições ficam depois.
  const { caminho: caminhoHeader, preview: previewHeader } = useLogomarcaHeader()
  const { caminho: caminhoLogin, preview: previewLogin } = useLogomarcaLogin()
  const { expandida, marcarPreferenciaManual } = useSidebarExpandida()
  const { abertas } = useSessoesAbertas()

  try {
    const cfg = await useApiFetch<ConfiguracoesGlobaisApi>('/api/configuracoes')

    caminhoHeader.value = cfg.logo_header_url ?? ''
    previewHeader.value = cfg.logo_header_url ?? ''
    caminhoLogin.value = cfg.logo_login_url ?? ''
    previewLogin.value = cfg.logo_login_url ?? ''
    expandida.value = cfg.sidebar_expandida
    // A preferência salva prevalece sobre o ajuste de largura da viewport
    // (aplicarLarguraInicial do layout não deve sobrescrever o banco).
    marcarPreferenciaManual()
    abertas.value = Object.fromEntries(
      sessoes.map((sessao) => {
        const chave = chavePorLabel(sessao.label)
        return [sessao.label, chave ? (cfg.sidebar_grupos[chave] ?? sessao.aberto) : sessao.aberto]
      })
    )

    return cfg
  } catch {
    return null
  }
}
