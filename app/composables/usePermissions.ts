// app/composables/usePermissions.ts — RBAC no cliente (change
// rbac-require-permission, D4; UI control em rbac-funcionalidades-por-modulo):
// expõe .can(modulo, acao) reativo a partir da matriz do PRÓPRIO usuário
// (GET /api/usuarios/eu/permissoes, session-only) e .podeVisualizar(modulo) para
// ocultar itens de navegação (sidebar/menu) quando o perfil não tem `visualizar`.
import { useApiFetch } from './useApiFetch'

type Matriz = Record<string, string[]>

export function usePermissions() {
  const permissoes = useState<Matriz>('permissoes-usuario', () => ({}))
  // Só depois de carregar é seguro ESCONDER: enquanto `carregado` é false a
  // navegação mostra os itens (fail-open) — evita sumir tudo no SSR/primeiro
  // paint ou quando a leitura falha.
  const carregado = useState<boolean>('permissoes-carregado', () => false)

  /** Lê a matriz do usuário (idempotente). Em erro mantém vazio (fail-open). */
  async function carregar(): Promise<void> {
    try {
      const resposta = await useApiFetch<{ permissoes: Matriz }>('/api/usuarios/eu/permissoes')
      permissoes.value = resposta?.permissoes ?? {}
      carregado.value = true
    } catch {
      // sem sessão/erro: mantém vazio e `carregado` false
    }
  }

  /** Carrega uma única vez (no-op se já carregado). */
  async function garantir(): Promise<void> {
    if (carregado.value) return
    await carregar()
  }

  /** true quando o perfil do usuário concede a ação no módulo. */
  function can(modulo: string, acao: string): boolean {
    return Boolean(permissoes.value[modulo]?.includes(acao))
  }

  /**
   * Visibilidade de um item de navegação: enquanto a matriz não carregou,
   * mostra (fail-open); depois, só quando há `visualizar` no módulo.
   */
  function podeVisualizar(modulo: string): boolean {
    return !carregado.value || can(modulo, 'visualizar')
  }

  return { permissoes, carregado, can, podeVisualizar, carregar, garantir }
}
