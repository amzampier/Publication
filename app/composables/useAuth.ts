// Sessão real via API (change auth-backend-resend): login/logout/recuperação
// rodam em /api/auth/** com cookies HttpOnly gerados no servidor (access JWT +
// refresh rotativo — design D1). O cliente nunca lê o cookie: a sessão é
// hidratada por GET /api/auth/seguro e cacheada em useState (D7). O cookie fino
// da fase 1 (auth-sessao) saiu de cena; só o "Lembrar-me" continua no cliente.
import { computed } from 'vue'
import { useCookie, useState } from '#app'
import { COOKIE_EMAIL_LEMBRADO } from '../utils/cookies'
import { useToast } from './useToast'

export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  perfil: string
  /** Senha provisória pendente de troca (capability `primeiro-acesso`). */
  provisoria?: boolean
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

type ErroFetch = { statusCode?: number; status?: number; statusMessage?: string; data?: { statusMessage?: string } }

const statusDe = (erro: unknown): number | undefined => {
  const e = erro as ErroFetch
  return e?.statusCode ?? e?.status
}
const mensagemDe = (erro: unknown): string | undefined => {
  const e = erro as ErroFetch
  return e?.data?.statusMessage ?? e?.statusMessage
}

export const useAuth = () => {
  const usuario = useState<UsuarioLogado | null>('auth-usuario', () => null)
  // Evita refazer GET /api/auth/seguro a cada navegação (D7); `true` também
  // cobre "verificado e sem sessão" (pós-logout ou falha de rede na checagem).
  const sessaoVerificada = useState<boolean>('auth-verificada', () => false)

  const emailLembrado = useCookie<string | null>(COOKIE_EMAIL_LEMBRADO, {
    default: () => null,
    ...opcoesCookie
  })

  const { toast } = useToast()

  const loggedIn = computed(() => usuario.value !== null)

  // POSTs de auth usam $fetch direto (credentials include) — FORA do
  // interceptor de refresh do useApiFetch (evita loop refresh→401→refresh).
  const postAuth = (rota: string, body?: unknown) =>
    $fetch<{ ok?: boolean; usuario?: UsuarioLogado }>(rota, {
      method: 'POST',
      body,
      credentials: 'include'
    })

  /**
   * Autentica via POST /api/auth/login. Em erro: 401 → toast genérico;
   * 403 → o aviso do servidor (inativo / conta bloqueada); 429 → aviso de
   * muitas tentativas; demais → falha de conexão. Devolve `false` em erro.
   */
  const entrar = async (credenciais: CredenciaisLogin): Promise<boolean> => {
    const email = credenciais.email.trim().toLowerCase()
    try {
      const resp = await postAuth('/api/auth/login', { email, senha: credenciais.senha })
      if (!resp.usuario) throw new Error('Resposta sem usuário')
      usuario.value = resp.usuario
      sessaoVerificada.value = true
      emailLembrado.value = credenciais.lembrar ? email : null
      return true
    } catch (erro) {
      const status = statusDe(erro)
      const mensagem = mensagemDe(erro)
      if (status === 401) {
        toast.danger('E-mail ou senha inválidos.')
      } else if (status === 403 && mensagem) {
        toast.warning(mensagem)
      } else if (status === 429) {
        toast.danger(mensagem ?? 'Muitas tentativas. Aguarde um minuto e tente novamente.')
      } else {
        toast.danger('Não foi possível conectar ao servidor. Tente novamente.')
      }
      return false
    }
  }

  /** Revoga a sessão no servidor (best-effort) e limpa o estado local. */
  const sair = async (): Promise<void> => {
    try {
      await postAuth('/api/auth/logout')
    } catch {
      // Sem sessão válida ou servidor fora: o estado local cai de qualquer forma.
    }
    usuario.value = null
    sessaoVerificada.value = true
  }

  /**
   * Restaura/valida a sessão (guarda global): com estado em cache não chama a
   * API; sem ele, GET /api/auth/seguro — no servidor via `useRequestFetch`
   * (encaminha os cookies da requisição SSR), no cliente via $fetch com
   * credentials. O access expirado é renovado pelo próprio servidor (rotação
   * do refresh — D7). Falha/401 → tratado como sem sessão.
   */
  const ensureSessao = async (): Promise<boolean> => {
    if (usuario.value) return true
    if (sessaoVerificada.value) return false

    try {
      const fetchSessao = import.meta.server
        ? useRequestFetch()
        : $fetch as unknown as typeof useRequestFetch
      const resp = await fetchSessao<{ usuario: UsuarioLogado }>('/api/auth/seguro', {
        credentials: 'include'
      })
      usuario.value = resp.usuario
      sessaoVerificada.value = true
      return true
    } catch {
      usuario.value = null
      sessaoVerificada.value = true
      return false
    }
  }

  /**
   * Invalida o estado local sem chamar o servidor — usado pelo auto-refresh do
   * useApiFetch quando o refresh definitivamente falha (o cookie já não vale).
   */
  const sessaoInvalidada = (): void => {
    usuario.value = null
    sessaoVerificada.value = true
  }

  return { usuario, loggedIn, entrar, sair, ensureSessao, sessaoInvalidada }
}
