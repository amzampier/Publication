// Preferência de a sidebar do shell iniciar expandida ou recolhida — compartilhada
// entre Configurações > Sidebar e o layout admin (toggle do header incluído).
// Fase 1: em memória (useState).
export const useSidebarExpandida = () => {
  const expandida = useState<boolean>('sidebar-expandida', () => true)
  // Marcada quando o usuário altera a sidebar por conta própria (toggle do header,
  // clique no backdrop ou cartão de Configurações) — daí em diante a escolha manual
  // prevalece sobre a largura da viewport (spec layout-navigation).
  const preferenciaManual = useState<boolean>('sidebar-preferencia-manual', () => false)

  // Inicialização de primeira carga no cliente: abaixo de lg (1024px) a sidebar
  // começa recolhida; em telas largas, expandida. O valor SSR continua `true`
  // (o servidor não conhece a largura) e a preferência manual bloqueia o reaproveitamento.
  const aplicarLarguraInicial = () => {
    if (import.meta.server || preferenciaManual.value) return
    expandida.value = window.matchMedia('(min-width: 1024px)').matches
  }

  const marcarPreferenciaManual = () => {
    preferenciaManual.value = true
  }

  return { expandida, aplicarLarguraInicial, marcarPreferenciaManual }
}
