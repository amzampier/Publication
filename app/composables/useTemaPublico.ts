// Tema claro/escuro exclusivo da Área Pública. O cookie permite SSR correto
// nas visitas seguintes; na primeira, o script anti-flash aplica o tema antes
// da hidratação e o composable sincroniza o estado com o cookie/prefers.
import { computed } from 'vue'
import {
  TEMA_PUBLICO_COOKIE,
  alternarTemaPublico,
  normalizarTemaPublico,
  resolverTemaInicial,
  rotuloAcaoTema,
  type TemaPublico
} from '#shared/publico'

export function useTemaPublico() {
  const cookie = useCookie<TemaPublico | null>(TEMA_PUBLICO_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  const cookieInicial = normalizarTemaPublico(cookie.value)
  const tema = useState<TemaPublico>('publico-tema', () =>
    resolverTemaInicial(cookieInicial, false)
  )

  if (import.meta.client) {
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches
    tema.value = resolverTemaInicial(cookieInicial, prefereEscuro)
  }

  const escuro = computed(() => tema.value === 'escuro')
  const rotulo = computed(() => rotuloAcaoTema(tema.value))

  const definir = (novo: TemaPublico) => {
    tema.value = novo
    cookie.value = novo
  }

  const alternar = () => definir(alternarTemaPublico(tema.value))

  return { tema, escuro, rotulo, definir, alternar }
}
