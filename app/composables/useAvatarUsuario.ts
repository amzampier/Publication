// app/composables/useAvatarUsuario.ts — avatar do usuário da sessão para o bloco
// Account do header. A sessão (JWT/`GET /api/auth/seguro`) não carrega o avatar,
// então ele é lido de `GET /api/usuarios/eu` uma única vez e mantido em
// `useState`; o Meu Perfil atualiza o MESMO estado ao salvar (sem recarregar).
import { useApiFetch } from './useApiFetch'

export function useAvatarUsuario() {
  const avatar = useState<string>('usuario-avatar', () => '')
  const carregado = useState<boolean>('usuario-avatar-carregado', () => false)

  /** Lê o avatar uma única vez (no-op se já carregado). Sem sessão, mantém ''. */
  const carregar = async (): Promise<void> => {
    if (carregado.value) return
    try {
      const eu = await useApiFetch<{ avatar?: string }>('/api/usuarios/eu')
      avatar.value = eu?.avatar ?? ''
      carregado.value = true
    } catch {
      // erro/sem sessão: o header segue com as iniciais
    }
  }

  /** Atualiza o avatar em memória (usado pelo Meu Perfil após salvar). */
  const definir = (valor: string): void => {
    avatar.value = valor ?? ''
    carregado.value = true
  }

  return { avatar, carregar, definir }
}
