// Contexto inicial da sessão — uma única chamada autenticada por request.
// Substitui as chamadas SSR separadas de /api/auth/seguro, shell, permissões e
// avatar. No servidor, a promessa fica no contexto do evento; no cliente, em
// uma promessa de módulo. O estado resultante é compartilhado pelos
// composables existentes (useAuth/usePermissions/useConfiguracoesGlobais/avatar).
import { useState } from '#app'
import type { UsuarioLogado } from './useAuth'
import type { ShellConfiguracoesApi } from './useConfiguracoesGlobais'

type Matriz = Record<string, string[]>

interface RespostaContexto {
  usuario: UsuarioLogado
  shell: ShellConfiguracoesApi
  permissoes: Matriz
  avatar: string
}

interface ContextoRequest {
  bootstrapPromise?: Promise<void>
}

let promessaCliente: Promise<void> | null = null
let geracao = 0

export function useBootstrap() {
  const carregado = useState<boolean>('bootstrap-carregado', () => false)
  const usuario = useState<UsuarioLogado | null>('auth-usuario', () => null)
  const verificada = useState<boolean>('auth-verificada', () => false)
  const shell = useState<ShellConfiguracoesApi | null>('config-shell-cache', () => null)
  const permissoes = useState<Matriz>('permissoes-usuario', () => ({}))
  const permissoesCarregado = useState<boolean>('permissoes-carregado', () => false)
  const avatar = useState<string>('usuario-avatar', () => '')
  const avatarCarregado = useState<boolean>('usuario-avatar-carregado', () => false)

  const aplicar = (dados: RespostaContexto): void => {
    usuario.value = dados.usuario
    shell.value = dados.shell
    permissoes.value = dados.permissoes ?? {}
    permissoesCarregado.value = true
    avatar.value = dados.avatar ?? ''
    avatarCarregado.value = true
    verificada.value = true
    carregado.value = true
  }

  const limpar = (): void => {
    usuario.value = null
    shell.value = null
    permissoes.value = {}
    permissoesCarregado.value = false
    avatar.value = ''
    avatarCarregado.value = false
    verificada.value = true
    carregado.value = true
  }

  const carregar = async (): Promise<void> => {
    const atual = geracao
    try {
      const buscar = import.meta.server ? useRequestFetch() : $fetch
      const dados = await buscar<RespostaContexto>('/api/auth/contexto', {
        credentials: 'include'
      })
      if (atual === geracao) aplicar(dados)
    } catch {
      if (atual === geracao) limpar()
    } finally {
      if (atual === geracao) carregado.value = true
    }
  }

  const garantir = async (): Promise<void> => {
    if (carregado.value) return

    if (import.meta.server) {
      const evento = useRequestEvent()
      const contexto = evento?.context as ContextoRequest | undefined
      if (contexto) {
        if (!contexto.bootstrapPromise) contexto.bootstrapPromise = carregar()
        await contexto.bootstrapPromise
      } else {
        await carregar()
      }
      return
    }

    if (!promessaCliente) promessaCliente = carregar()
    try {
      await promessaCliente
    } finally {
      promessaCliente = null
    }
  }

  return {
    garantir,
    carregado,
    usuario,
    shell,
    permissoes,
    avatar
  }
}

/** Invalida o bootstrap no cliente (logout/troca de usuário). */
export function resetBootstrap(): void {
  geracao += 1
  promessaCliente = null
  useState<boolean>('bootstrap-carregado', () => false).value = false
}
