// Montagem do contexto inicial da sessão (GET /api/auth/contexto).
// Reúne, em um único payload, o usuário público, as preferências do shell, a
// matriz RBAC e o avatar — substitui as chamadas SSR separadas de auth, shell,
// permissões e usuário.
import type { SessaoPublica } from './auth'
import type { ConfiguracoesGlobais } from './configuracoes'
import type { PermissoesSessao } from './permission'
import { MODULOS_IDS } from './perfis'

export interface ContextoBootstrap {
  usuario: SessaoPublica
  shell: {
    logo_header_url: string | null
    logo_login_url: string | null
    sidebar_grupos: Record<string, boolean>
    sidebar_expandida: boolean
  }
  permissoes: Record<string, string[]>
  avatar: string
}

export function montarContextoBootstrap(
  usuario: SessaoPublica,
  cfg: ConfiguracoesGlobais,
  permissoes: PermissoesSessao,
  avatar: string
): ContextoBootstrap {
  const matriz: Record<string, string[]> = {}
  for (const modulo of MODULOS_IDS) {
    matriz[modulo] = [...(permissoes.get(modulo) ?? [])]
  }
  return {
    usuario,
    shell: {
      logo_header_url: cfg.logo_header_url,
      logo_login_url: cfg.logo_login_url,
      sidebar_grupos: cfg.sidebar_grupos,
      sidebar_expandida: cfg.sidebar_expandida
    },
    permissoes: matriz,
    avatar
  }
}
