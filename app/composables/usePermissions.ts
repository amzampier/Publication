// app/composables/usePermissions.ts — RBAC no cliente (change
// rbac-require-permission, D4): expõe .can(modulo, acao) reativo a partir da
// matriz do PRÓPRIO usuário (GET /api/usuarios/eu/permissoes, session-only).
// Nesta etapa o helper fica disponível; o ocultamento de itens de UI é etapa
// posterior (ver design.md — Non-Goals).
import { useApiFetch } from './useApiFetch'

type Matriz = Record<string, string[]>

let carregando: Promise<void> | null = null

export function usePermissions() {
  const permissoes = useState<Matriz>('permissoes-usuario', () => ({}))

  async function carregar(): Promise<void> {
    const resposta = await useApiFetch<{ permissoes: Matriz }>('/api/usuarios/eu/permissoes')
    permissoes.value = resposta?.permissoes ?? {}
  }

  /** Carrega a matriz uma única vez (single-flight); no-op se já carregada. */
  async function garantir(): Promise<void> {
    if (Object.keys(permissoes.value).length > 0) return
    if (!carregando) {
      carregando = carregar().finally(() => {
        carregando = null
      })
    }
    await carregando
  }

  /** true quando o perfil do usuário concede a ação no módulo. */
  function can(modulo: string, acao: string): boolean {
    return Boolean(permissoes.value[modulo]?.includes(acao))
  }

  return { permissoes, can, carregar, garantir }
}
