import { sessoes } from '../config/navigation'

// Preferência de quais sessões do menu iniciam expandidas — compartilhada entre
// Configurações > Sidebar e o AppSidebar do shell. Fase 1: em memória (useState).
export const useSessoesAbertas = () => {
  const abertas = useState<Record<string, boolean>>('sessoes-menu-abertas', () =>
    Object.fromEntries(sessoes.map((sessao) => [sessao.label, sessao.aberto]))
  )
  return { abertas }
}
