// Leitura da página pública do Escopo de Projetos: o cabeçalho vem de
// `/api/publico/escopos/:id` e a lista paginada de `/chamadas`. A rota é a
// fonte da verdade de `sistema` e `pagina`; a sidebar apenas reflete a URL.
import { computed } from 'vue'
import {
  normalizarPagina,
  normalizarPorPagina,
  normalizarSistema,
  resumirEscopo,
  type PublicoEscopoChamadas,
  type PublicoEscopoDetalhe
} from '#shared/publico'

const POR_PAGINA = 6

/** Opções do seletor de linhas por página do `UiPagination` (mesmo padrão das grades). */
export const OPCOES_POR_PAGINA = [6, 12, 18, 24]

const CHAMADAS_VAZIAS: PublicoEscopoChamadas = {
  itens: [],
  total: 0,
  pagina: 1,
  porPagina: POR_PAGINA,
  sistemaSelecionado: ''
}

const statusDoErro = (erro: unknown): number | null => {
  if (!erro || typeof erro !== 'object') return null
  const status = Number((erro as { statusCode?: unknown }).statusCode)
  return Number.isFinite(status) ? status : null
}

export async function usePublicoEscopo() {
  const rota = useRoute()
  const router = useRouter()

  const id = computed(() => String(rota.params.id ?? ''))
  const sistema = computed(() => normalizarSistema(rota.query.sistema))
  const pagina = computed(() => normalizarPagina(rota.query.pagina))
  const porPaginaQuery = computed(() => normalizarPorPagina(rota.query.porPagina))

  const escopoAsync = useAsyncData<PublicoEscopoDetalhe | null>(
    'publico-escopo',
    () => $fetch<PublicoEscopoDetalhe>(`/api/publico/escopos/${encodeURIComponent(id.value)}`),
    {
      default: () => null,
      watch: [id]
    }
  )

  const chamadasAsync = useAsyncData<PublicoEscopoChamadas>(
    'publico-escopo-chamadas',
    () =>
      $fetch<PublicoEscopoChamadas>(
        `/api/publico/escopos/${encodeURIComponent(id.value)}/chamadas`,
        {
          query: {
            ...(sistema.value ? { sistema: sistema.value } : {}),
            pagina: pagina.value,
            porPagina: porPaginaQuery.value
          }
        }
      ),
    {
      default: () => ({
        ...CHAMADAS_VAZIAS,
        pagina: pagina.value,
        porPagina: porPaginaQuery.value,
        sistemaSelecionado: sistema.value
      }),
      watch: [id, sistema, pagina, porPaginaQuery]
    }
  )

  await Promise.all([escopoAsync, chamadasAsync])

  const {
    data: escopoData,
    pending: carregandoEscopo,
    error: erroEscopoRef,
    refresh: recarregarEscopo
  } = escopoAsync

  const {
    data: chamadasData,
    pending: carregandoChamadas,
    error: erroChamadasRef,
    refresh: recarregarChamadas
  } = chamadasAsync

  if (statusDoErro(erroEscopoRef.value) === 404) {
    throw createError({ statusCode: 404, statusMessage: 'Escopo público não encontrado.' })
  }

  const escopo = computed(() => escopoData.value ?? null)
  const chamadas = computed(() => chamadasData.value?.itens ?? [])
  const total = computed(() => chamadasData.value?.total ?? 0)
  const paginaAtual = computed(() => chamadasData.value?.pagina ?? pagina.value)
  const porPagina = computed(
    () => chamadasData.value?.porPagina || porPaginaQuery.value
  )
  const sistemaSelecionado = computed(
    () => chamadasData.value?.sistemaSelecionado ?? sistema.value
  )
  const resumo = computed(() =>
    escopo.value ? resumirEscopo(escopo.value, sistema.value) : null
  )

  const carregando = computed(
    () => carregandoEscopo.value || carregandoChamadas.value
  )

  const erro = computed(() => {
    if (erroEscopoRef.value) return 'Não foi possível carregar o escopo.'
    if (erroChamadasRef.value) return 'Não foi possível carregar as chamadas.'
    return ''
  })

  const recarregar = async () => {
    await Promise.all([recarregarEscopo(), recarregarChamadas()])
  }

  // O `UiPagination` emite `update:perPage` e `update:modelValue(1)` na mesma troca de
  // tamanho; serializar as navegações evita que a segunda sobrescreva a query da primeira.
  let navegacaoPendente: Promise<unknown> = Promise.resolve()

  const navegar = (
    montar: (query: Record<string, string | string[]>) => void
  ) => {
    navegacaoPendente = navegacaoPendente.then(async () => {
      const query = { ...rota.query } as Record<string, string | string[]>
      montar(query)
      await router.replace({ query })
    })
    return navegacaoPendente
  }

  const irParaPagina = async (valor: number) => {
    const alvo = Math.max(1, Math.trunc(Number(valor) || 1))
    if (alvo === paginaAtual.value) return
    await navegar((query) => {
      if (alvo > 1) query.pagina = String(alvo)
      else delete query.pagina
    })
  }

  const irParaTamanhoPagina = async (valor: number) => {
    const alvo = normalizarPorPagina(valor)
    if (alvo === porPagina.value) return
    await navegar((query) => {
      if (alvo === POR_PAGINA) delete query.porPagina
      else query.porPagina = String(alvo)
      delete query.pagina
    })
  }

  const verTodas = async () => {
    const query = { ...rota.query }
    delete query.sistema
    delete query.pagina
    await router.replace({ query })
  }

  return {
    escopo,
    chamadas,
    total,
    pagina: paginaAtual,
    porPagina,
    opcoesPorPagina: OPCOES_POR_PAGINA,
    sistemaSelecionado,
    resumo,
    carregando,
    erro,
    recarregar,
    irParaPagina,
    irParaTamanhoPagina,
    verTodas
  }
}
