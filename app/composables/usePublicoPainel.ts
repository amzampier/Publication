// Leitura do Painel de Destaques da Área Pública: uma carga SSR para o painel
// (hero, manuais, ranking e filtros) e outra para o histórico. O histórico é
// paginado no servidor; "Carregar mais" anexa a página seguinte sem duplicar.
import { computed, reactive, ref, watch } from 'vue'
import {
  normalizarPagina,
  normalizarSoftware,
  normalizarTipo,
  type PublicoHistorico,
  type PublicoPainel
} from '#shared/publico'

const POR_PAGINA = 6

const PAINEL_VAZIO: PublicoPainel = {
  releaseDestaque: null,
  manuaisDestaque: [],
  maisVistas: [],
  modoMaisVistas: 'recentes',
  filtros: { softwares: [], tipos: [] }
}

const HISTORICO_VAZIO: PublicoHistorico = {
  itens: [],
  total: 0,
  pagina: 1,
  porPagina: POR_PAGINA
}

export function usePublicoPainel() {
  const rota = useRoute()
  const router = useRouter()

  const filtros = reactive({
    software: normalizarSoftware(rota.query.software),
    tipo: normalizarTipo(rota.query.tipo),
    pagina: normalizarPagina(rota.query.pagina)
  })

  const extras = ref<PublicoHistorico['itens']>([])
  const carregandoMais = ref(false)
  const erroMais = ref(false)

  const montarQuery = (pagina: number): string => {
    const params = new URLSearchParams()
    if (filtros.software) params.set('software', filtros.software)
    if (filtros.tipo) params.set('tipo', filtros.tipo)
    params.set('pagina', String(pagina))
    params.set('porPagina', String(POR_PAGINA))
    return params.toString()
  }

  const atualizarUrl = async () => {
    const query: Record<string, string> = {}
    if (filtros.software) query.software = filtros.software
    if (filtros.tipo) query.tipo = filtros.tipo
    if (filtros.pagina > 1) query.pagina = String(filtros.pagina)
    await router.replace({ query })
  }

  const {
    data: painelData,
    pending: carregandoPainel,
    error: erroPainelRef,
    refresh: recarregarPainel
  } = useAsyncData<PublicoPainel>(
    'publico-painel',
    () => $fetch<PublicoPainel>('/api/publico/painel'),
    {
      default: () => ({
        ...PAINEL_VAZIO,
        filtros: { ...PAINEL_VAZIO.filtros }
      })
    }
  )

  const {
    data: historicoData,
    pending: carregandoPagina,
    error: erroPaginaRef,
    refresh: recarregarPagina
  } = useAsyncData<PublicoHistorico>(
    'publico-historico',
    () => $fetch<PublicoHistorico>(`/api/publico/releases?${montarQuery(filtros.pagina)}`),
    {
      default: () => ({ ...HISTORICO_VAZIO, pagina: filtros.pagina })
    }
  )

  const painel = computed(() => painelData.value ?? PAINEL_VAZIO)
  const carregandoPainelFinal = computed(() => carregandoPainel.value)
  const erroPainel = computed(() =>
    erroPainelRef.value ? 'Não foi possível carregar o painel de destaques.' : ''
  )

  const historico = computed<PublicoHistorico>(() => {
    const base = historicoData.value ?? HISTORICO_VAZIO
    return {
      itens: [...base.itens, ...extras.value],
      total: base.total,
      pagina: filtros.pagina,
      porPagina: base.porPagina || POR_PAGINA
    }
  })

  const carregandoHistorico = computed(
    () => carregandoPagina.value || carregandoMais.value
  )
  const erroHistorico = computed(() => {
    if (erroPaginaRef.value) return 'Não foi possível carregar o histórico de releases.'
    if (erroMais.value) return 'Não foi possível carregar mais releases.'
    return ''
  })
  const temMais = computed(() => historico.value.itens.length < historico.value.total)

  const recarregarHistorico = async () => {
    extras.value = []
    erroMais.value = false
    await recarregarPagina()
  }

  const recarregarComFiltros = async () => {
    filtros.pagina = 1
    extras.value = []
    erroMais.value = false
    await Promise.all([recarregarPagina(), atualizarUrl()])
  }

  watch(
    () => [filtros.software, filtros.tipo],
    () => {
      void recarregarComFiltros()
    }
  )

  const carregarMais = async () => {
    if (carregandoMais.value || carregandoPagina.value || !temMais.value) return
    const proxima = filtros.pagina + 1
    carregandoMais.value = true
    erroMais.value = false
    try {
      const dados = await $fetch<PublicoHistorico>(
        `/api/publico/releases?${montarQuery(proxima)}`
      )
      const ids = new Set(
        [...(historicoData.value?.itens ?? []), ...extras.value].map((item) => item.id)
      )
      extras.value.push(...dados.itens.filter((item) => !ids.has(item.id)))
      filtros.pagina = proxima
      await atualizarUrl()
    } catch {
      erroMais.value = true
    } finally {
      carregandoMais.value = false
    }
  }

  const limparFiltros = async () => {
    const tinhaFiltro = Boolean(filtros.software || filtros.tipo)
    filtros.software = ''
    filtros.tipo = ''
    filtros.pagina = 1
    extras.value = []
    erroMais.value = false
    if (!tinhaFiltro) {
      await Promise.all([recarregarPagina(), atualizarUrl()])
    }
  }

  return {
    painel,
    carregandoPainel: carregandoPainelFinal,
    erroPainel,
    recarregarPainel,
    historico,
    carregandoHistorico,
    carregandoMais,
    erroHistorico,
    erroMais,
    recarregarHistorico,
    carregarMais,
    temMais,
    filtros,
    limparFiltros
  }
}
