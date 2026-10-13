// Sessão fake da fase 1 (frontend puro, sem backend): estado reativo + cookie
// fino (apenas o id do usuário na base demo) para sobreviver a F5. Na fase com
// servidor, `entrar` passa a chamar POST /api/auth/login e o cookie vira o
// __Host-auth-token HttpOnly (docs/02 §3.4, docs/08).
import { computed } from 'vue'
import { useCookie, useState } from '#app'
import {
  SENHA_DEMO,
  useUsuariosDemo,
  type PerfilUsuario
} from '../components/usuarios/useUsuariosDemo'
import { COOKIE_EMAIL_LEMBRADO, COOKIE_SESSAO } from '../utils/cookies'
import { useToast } from './useToast'

export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
}

export interface CredenciaisLogin {
  email: string
  senha: string
  lembrar: boolean
}

const opcoesCookie = {
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7
}

/**
 * Sanitiza o parâmetro `?redirect=` do login: só caminhos relativos sob
 * `/admin` (sem `//` nem esquema externo) — evita open redirect. Inválido cai
 * em `/admin`. Usado pelo middleware e pela página de login.
 */
export const sanitizarRedirectAdmin = (valor: unknown): string => {
  if (typeof valor !== 'string') return '/admin'
  if (!valor.startsWith('/admin')) return '/admin'
  if (valor.startsWith('//')) return '/admin'
  return valor
}

export const useAuth = () => {
  const usuario = useState<UsuarioLogado | null>('auth-usuario', () => null)

  const sessao = useCookie<string | null>(COOKIE_SESSAO, {
    default: () => null,
    ...opcoesCookie
  })

  const emailLembrado = useCookie<string | null>(COOKIE_EMAIL_LEMBRADO, {
    default: () => null,
    ...opcoesCookie
  })

  const { toast } = useToast()
  const { usuarios } = useUsuariosDemo()

  const loggedIn = computed(() => usuario.value !== null)

  /**
   * Restaura a sessão a partir do cookie (F5/SSR): o cookie guarda só o id;
   * o usuário é reidenciado na base demo. Cookie sem registro correspondente
   * (ou com usuário inativo) é descartado e conta como sem sessão.
   */
  const ensureSessao = (): boolean => {
    if (usuario.value) return true
    if (!sessao.value) return false

    const registro = usuarios.value.find((u) => u.id === sessao.value)
    if (!registro || registro.status !== 'Ativo') {
      sessao.value = null
      return false
    }

    usuario.value = {
      id: registro.id,
      nome: registro.nome,
      email: registro.email,
      perfil: registro.perfil
    }
    return true
  }

  /**
   * Valida as credenciais contra a base demo (e-mail exato + senha vigente do
   * registro — `SENHA_DEMO` por padrão ou a senha provisória gravada pelo fluxo
   * de recuperação — + status Ativo). Erro genérico para e-mail/senha (não
   * revela qual campo falhou); aviso próprio para inativo. Em sucesso: atualiza
   * `ultimoAcesso`, grava sessão e aplica o "Lembrar-me".
   */
  const entrar = (credenciais: CredenciaisLogin): boolean => {
    const email = credenciais.email.trim().toLowerCase()
    const registro = usuarios.value.find((u) => u.email.toLowerCase() === email)

    if (!registro || credenciais.senha !== (registro.senha || SENHA_DEMO)) {
      toast.danger('E-mail ou senha inválidos.')
      return false
    }

    if (registro.status !== 'Ativo') {
      toast.warning('Usuário inativo. Contate o administrador.')
      return false
    }

    registro.ultimoAcesso = new Date().toISOString()

    usuario.value = {
      id: registro.id,
      nome: registro.nome,
      email: registro.email,
      perfil: registro.perfil
    }
    sessao.value = registro.id
    emailLembrado.value = credenciais.lembrar ? registro.email : null

    return true
  }

  const sair = () => {
    usuario.value = null
    sessao.value = null
  }

  return { usuario, loggedIn, entrar, sair, ensureSessao }
}
