import { computed, watch } from 'vue'
import { useState } from '#app'
import type { OpcoesCatalogoChamada } from '#shared/lancar-chamadas'
import { useApiFetch } from '../../composables/useApiFetch'
import { useAuth } from '../../composables/useAuth'
import {
  buscarChamadas,
  calcularKpis,
  filtrarChamadas,
  formatarData,
  type CatalogosChamada,
  type ChamadaModelo,
  type EntradaChamada,
  type FiltrosChamada,
  type ImpactoChamada,
  type LinhaImportacaoChamada,
  type OpcaoChamada,
  type OrigemChamada,
  type StatusChamada,
  type TipoCatalogoChamada,
  type TipoChamada,
  IMPACTOS_CHAMADA as CATALOGOS_CHAMADAS_IMPACTOS,
  ORIGENS_CHAMADA as CATALOGOS_CHAMADAS_ORIGENS,
  STATUS_CHAMADA as CATALOGOS_CHAMADAS_STATUS,
  TIPOS_CHAMADA as CATALOGOS_CHAMADAS_TIPOS
} from './validadores'

export * from './validadores'

/** Código (sigla) de um vínculo a partir do catálogo carregado. */
const codigoVinculo = (lista: OpcaoChamada[], id: string): string =>
  lista.find((opcao) => opcao.id === id)?.sigla ?? ''

export interface LinhaChamada {
  id: string
  chamada: string
  titulo: string
  software: string
  softwares: string[]
  vinculo: string
  vinculos: string[]
  modulo: string
  tipo: TipoChamada
  impacto: ImpactoChamada
  status: StatusChamada
  dataLancamento: string
  dataLiberacao: string
  dataLancamentoIso: string
  dataLiberacaoIso: string
  origem: OrigemChamada
}

const FILTROS_VAZIOS: FiltrosChamada = {
  status: '',
  tipo: '',
  impacto: '',
  softwareIds: [],
  parceiroId: '',
  origem: '',
  dataLancamentoDe: '',
  dataLancamentoAte: '',
  dataLiberacaoDe: '',
  dataLiberacaoAte: ''
}

const CATALOGO_VAZIO: CatalogosChamada = {
  releases: [],
  projetos: [],
  manuais: [],
  softwares: [],
  parceiros: []
}

type TipoFiltroRemoto = TipoCatalogoChamada

interface EstadoOpcoesRemotas {
  itens: OpcaoChamada[]
  selecionados: OpcaoChamada[]
  total: number
  hasMore: boolean
  loading: boolean
  error: string
  q: string
  pagina: number
}

const estadoRemotoVazio = (): EstadoOpcoesRemotas => ({
  itens: [],
  selecionados: [],
  total: 0,
  hasMore: false,
  loading: false,
  error: '',
  q: '',
  pagina: 1
})

export const useLancarChamadasModelo = () => {
  const chamadas = useState<ChamadaModelo[]>('lancar-chamadas-base', () => [])
  const catalogo = useState<CatalogosChamada>('lancar-chamadas-catalogo', () => ({
    ...CATALOGO_VAZIO
  }))
  const carregando = useState<boolean>('lancar-chamadas-carregando', () => false)
  const pagina = useState<number>('lancar-chamadas-pagina', () => 1)
  const porPagina = useState<number>('lancar-chamadas-por-pagina', () => 20)
  const total = useState<number>('lancar-chamadas-total', () => 0)
  const ordenar = useState<string>('lancar-chamadas-ordenar', () => '')
  const direcao = useState<'asc' | 'desc'>('lancar-chamadas-direcao', () => 'asc')
  const kpisServidor = useState('lancar-chamadas-kpis', () => ({ total: 0, revisar: 0, aprovado: 0, recusado: 0 }))
  const erro = useState<string | null>('lancar-chamadas-erro', () => null)
  const carregado = useState<boolean>('lancar-chamadas-carregado', () => false)
  const busca = useState<string>('lancar-chamadas-busca', () => '')
  const filtros = useState<FiltrosChamada>('lancar-chamadas-filtros', () => ({
    ...FILTROS_VAZIOS
  }))
  const opcoesRemotas = useState<Record<TipoFiltroRemoto, EstadoOpcoesRemotas>>(
    'lancar-chamadas-opcoes-remotas',
    () => ({
      releases: estadoRemotoVazio(),
      projetos: estadoRemotoVazio(),
      manuais: estadoRemotoVazio(),
      softwares: estadoRemotoVazio(),
      parceiros: estadoRemotoVazio()
    })
  )
  const catalogoCarregado = useState<boolean>('lancar-chamadas-catalogo-carregado', () => false)
  const catalogoCarregando = useState<boolean>('lancar-chamadas-catalogo-carregando', () => false)
  const { usuario } = useAuth()

  const autorAtual = computed(() => ({
    id: usuario.value?.id ?? 'sistema',
    nome: usuario.value?.nome ?? 'Sistema'
  }))

  const parametrosLista = (): string => {
    const params = new URLSearchParams()
    params.set('pagina', String(pagina.value))
    params.set('porPagina', String(porPagina.value))
    if (ordenar.value) {
      params.set('ordenar', ordenar.value)
      params.set('direcao', direcao.value)
    }
    if (busca.value.trim()) params.set('busca', busca.value.trim())
    const f = filtros.value
    for (const chave of [
      'status',
      'tipo',
      'impacto',
      'origem',
      'parceiroId',
      'dataLancamentoDe',
      'dataLancamentoAte',
      'dataLiberacaoDe',
      'dataLiberacaoAte'
    ] as const) {
      if (f[chave]) params.set(chave, String(f[chave]))
    }
    if (f.softwareIds.length) params.set('softwareIds', f.softwareIds.join(','))
    return params.toString()
  }

  const carregarChamadas = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    erro.value = null
    try {
      const lista = await useApiFetch<{
        itens: ChamadaModelo[]
        chamadas?: ChamadaModelo[]
        total: number
        pagina: number
        porPagina: number
        kpis: { total: number; revisar: number; aprovado: number; recusado: number }
      }>(`/api/lancar-chamadas?${parametrosLista()}`)
      chamadas.value = lista.itens ?? lista.chamadas ?? []
      total.value = lista.total ?? chamadas.value.length
      pagina.value = lista.pagina ?? pagina.value
      porPagina.value = lista.porPagina ?? porPagina.value
      kpisServidor.value = lista.kpis ?? {
        total: total.value,
        revisar: 0,
        aprovado: 0,
        recusado: 0
      }
      carregado.value = true
      return true
    } catch (falha) {
      const e = falha as { statusMessage?: string; data?: { statusMessage?: string } }
      erro.value =
        e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível carregar as chamadas.'
      chamadas.value = []
      total.value = 0
      kpisServidor.value = { total: 0, revisar: 0, aprovado: 0, recusado: 0 }
      carregado.value = false
      return false
    } finally {
      carregando.value = false
    }
  }

  const mesclarOpcoes = (
    itens: OpcaoChamada[],
    selecionados: OpcaoChamada[]
  ): OpcaoChamada[] => {
    const mapa = new Map<string, OpcaoChamada>()
    for (const opcao of [...selecionados, ...itens]) {
      if (!mapa.has(opcao.id)) mapa.set(opcao.id, opcao)
    }
    return [...mapa.values()]
  }

  const debounces: Record<TipoFiltroRemoto, ReturnType<typeof setTimeout> | null> = {
    releases: null,
    projetos: null,
    manuais: null,
    softwares: null,
    parceiros: null
  }

  const consultarOpcoesRemotas = async (
    tipo: TipoFiltroRemoto,
    termo: string,
    numeroPagina: number
  ): Promise<void> => {
    const estado = opcoesRemotas.value[tipo]
    estado.loading = true
    estado.error = ''
    try {
      const params = new URLSearchParams({
        tipo,
        q: termo,
        pagina: String(numeroPagina),
        limite: '20'
      })
      const resposta = await useApiFetch<OpcoesCatalogoChamada>(
        `/api/lancar-chamadas/opcoes?${params.toString()}`
      )
      const itens = numeroPagina === 1 ? resposta.itens : [...estado.itens, ...resposta.itens]
      estado.itens = mesclarOpcoes(itens, estado.selecionados)
      estado.total = resposta.total
      estado.hasMore = resposta.hasMore
      estado.q = termo
      estado.pagina = numeroPagina
    } catch {
      estado.error = 'Não foi possível carregar as opções.'
    } finally {
      estado.loading = false
    }
  }

  /** Carrega a primeira página sem debounce (retry e abertura do select). */
  const buscarOpcoesAgora = (tipo: TipoFiltroRemoto, termo: string): Promise<void> =>
    consultarOpcoesRemotas(tipo, termo, 1)

  /** Busca remota com debounce (300 ms); a primeira página da abertura é imediata. */
  const buscarOpcoes = (tipo: TipoFiltroRemoto, termo: string): void => {
    if (debounces[tipo]) clearTimeout(debounces[tipo] as ReturnType<typeof setTimeout>)
    if (!termo.trim()) {
      void consultarOpcoesRemotas(tipo, termo, 1)
      return
    }
    debounces[tipo] = setTimeout(() => {
      void consultarOpcoesRemotas(tipo, termo, 1)
    }, 300)
  }

  const carregarMaisOpcoes = (tipo: TipoFiltroRemoto): void => {
    const estado = opcoesRemotas.value[tipo]
    if (estado.hasMore && !estado.loading) {
      void consultarOpcoesRemotas(tipo, estado.q, estado.pagina + 1)
    }
  }

  const registrarSelecao = (tipo: TipoFiltroRemoto, ids: Array<string | number>): void => {
    const estado = opcoesRemotas.value[tipo]
    const mapa = new Map(
      [...estado.itens, ...estado.selecionados].map((opcao) => [opcao.id, opcao])
    )
    estado.selecionados = ids
      .map((id) => mapa.get(String(id)))
      .filter((opcao): opcao is OpcaoChamada => Boolean(opcao))
    estado.itens = mesclarOpcoes(estado.itens, estado.selecionados)
  }

  const carregarCatalogo = async (forcar = false): Promise<CatalogosChamada> => {
    if (catalogoCarregado.value && !forcar) return catalogo.value
    if (catalogoCarregando.value) return catalogo.value
    catalogoCarregando.value = true
    try {
      catalogo.value = await useApiFetch<CatalogosChamada>('/api/lancar-chamadas/opcoes')
      catalogoCarregado.value = true
    } finally {
      catalogoCarregando.value = false
    }
    return catalogo.value
  }

  const definirPagina = async (valor: number) => {
    pagina.value = Math.max(1, valor)
    await carregarChamadas(true)
  }

  const definirOrdenacao = async (regras: Array<{ columnId: string; direction: 'asc' | 'desc' }>) => {
    const regra = regras[0]
    ordenar.value = regra?.columnId ?? ''
    direcao.value = regra?.direction ?? 'asc'
    pagina.value = 1
    await carregarChamadas(true)
  }

  const definirPorPagina = async (valor: number) => {
    porPagina.value = Math.max(1, valor)
    pagina.value = 1
    await carregarChamadas(true)
  }

  const chamadasFiltradas = computed(() =>
    chamadas.value
  )

  const mapearLinha = (chamada: ChamadaModelo): LinhaChamada => {
    const vinculos = [
      chamada.release || codigoVinculo(catalogo.value.releases, chamada.releaseId),
      chamada.manualCodigo || codigoVinculo(catalogo.value.manuais, chamada.manualId),
      chamada.projetoCodigo || codigoVinculo(catalogo.value.projetos, chamada.projetoId)
    ].filter(Boolean)
    return {
      id: chamada.id,
      chamada: chamada.chamada,
      titulo: chamada.titulo,
      software: chamada.softwares.join(', '),
      softwares: [...chamada.softwares],
      vinculo: vinculos.join(' · '),
      vinculos,
      modulo: chamada.modulo,
      tipo: chamada.tipo,
      impacto: chamada.impacto,
      status: chamada.status,
      dataLancamento: formatarData(chamada.dataLancamento),
      dataLiberacao: formatarData(chamada.dataLiberacao),
      dataLancamentoIso: chamada.dataLancamento,
      dataLiberacaoIso: chamada.dataLiberacao,
      origem: chamada.origem
    }
  }

  const linhas = computed<LinhaChamada[]>(() => chamadasFiltradas.value.map(mapearLinha))
  const kpis = computed(() => kpisServidor.value ?? calcularKpis(chamadasFiltradas.value))

  const filtrosAtivosCount = computed(
    () =>
      [
        filtros.value.status,
        filtros.value.tipo,
        filtros.value.impacto,
        filtros.value.softwareIds.length,
        filtros.value.parceiroId,
        filtros.value.origem,
        filtros.value.dataLancamentoDe,
        filtros.value.dataLancamentoAte,
        filtros.value.dataLiberacaoDe,
        filtros.value.dataLiberacaoAte
      ].filter(Boolean).length
  )

  const criteriosAtivosCount = computed(
    () => filtrosAtivosCount.value + (busca.value.trim() ? 1 : 0)
  )

  const opcoes = computed(() => ({
    status: [...CATALOGOS_CHAMADAS_STATUS],
    tipos: [...CATALOGOS_CHAMADAS_TIPOS],
    impactos: [...CATALOGOS_CHAMADAS_IMPACTOS],
    origens: [...CATALOGOS_CHAMADAS_ORIGENS],
    softwares: opcoesRemotas.value.softwares.itens,
    parceiros: opcoesRemotas.value.parceiros.itens
  }))

  const limparFiltros = () => {
    filtros.value = { ...FILTROS_VAZIOS }
  }

  const resolver = (id: string): ChamadaModelo | null =>
    chamadas.value.find((chamada) => chamada.id === id) ?? null

  const adicionar = async (entrada: EntradaChamada): Promise<ChamadaModelo> => {
    const criada = await useApiFetch<ChamadaModelo>('/api/lancar-chamadas', {
      method: 'POST',
      body: entrada
    })
    chamadas.value = [criada, ...chamadas.value]
    carregado.value = true
    return criada
  }

  const atualizar = async (id: string, entrada: EntradaChamada): Promise<ChamadaModelo> => {
    const atualizada = await useApiFetch<ChamadaModelo>(`/api/lancar-chamadas/${id}`, {
      method: 'PUT',
      body: entrada
    })
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? atualizada : chamada))
    return atualizada
  }

  const aprovar = async (
    id: string,
    opcoes: { parecer?: string; criterios?: boolean } = {}
  ): Promise<ChamadaModelo> => {
    const aprovada = await useApiFetch<ChamadaModelo>(`/api/lancar-chamadas/${id}/aprovar`, {
      method: 'PUT',
      body: opcoes
    })
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? aprovada : chamada))
    return aprovada
  }

  const desaprovar = async (
    id: string,
    opcoes: { parecer?: string } = {}
  ): Promise<ChamadaModelo> => {
    const desaprovada = await useApiFetch<ChamadaModelo>(
      `/api/lancar-chamadas/${id}/desaprovar`,
      { method: 'PUT', body: opcoes }
    )
    chamadas.value = chamadas.value.map((chamada) =>
      chamada.id === id ? desaprovada : chamada
    )
    return desaprovada
  }

  const recusar = async (
    id: string,
    opcoes: { parecer: string; criterios?: boolean }
  ): Promise<ChamadaModelo> => {
    const recusada = await useApiFetch<ChamadaModelo>(`/api/lancar-chamadas/${id}/recusar`, {
      method: 'PUT',
      body: opcoes
    })
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? recusada : chamada))
    return recusada
  }

  const excluir = async (id: string): Promise<void> => {
    await useApiFetch(`/api/lancar-chamadas/${id}`, { method: 'DELETE' })
    chamadas.value = chamadas.value.filter((chamada) => chamada.id !== id)
  }

  const importar = async (
    linhasImportadas: LinhaImportacaoChamada[]
  ): Promise<{ importados: number }> => {
    const resultado = await useApiFetch<{ importados: number }>(
      '/api/lancar-chamadas/importar',
      { method: 'POST', body: { linhas: linhasImportadas } }
    )
    await carregarChamadas(true)
    return resultado
  }

  const buscarDetalhe = (id: string): Promise<ChamadaModelo> =>
    useApiFetch<ChamadaModelo>(`/api/lancar-chamadas/${id}`)

  const urlExportacaoCsv = (): string =>
    `/api/lancar-chamadas?download=1&formato=csv&${parametrosLista()}`

  const exportarLinhas = async (): Promise<{
    linhas: LinhaChamada[]
    excedeu: boolean
  }> => {
    const resposta = await useApiFetch<{
      chamadas: ChamadaModelo[]
      excedeu?: boolean
    }>(`/api/lancar-chamadas?download=1&limite=5000&${parametrosLista()}`)
    return {
      linhas: (resposta.chamadas ?? []).map(mapearLinha),
      excedeu: Boolean(resposta.excedeu)
    }
  }

  let debounceBusca: ReturnType<typeof setTimeout> | null = null
  watch(
    [busca, filtros],
    () => {
      if (debounceBusca) clearTimeout(debounceBusca)
      debounceBusca = setTimeout(() => {
        pagina.value = 1
        void carregarChamadas(true)
      }, 300)
    },
    { deep: true }
  )
  return {
    chamadas,
    catalogo,
    carregando,
    carregado,
    erro,
    pagina,
    porPagina,
    total,
    busca,
    filtros,
    autorAtual,
    carregarChamadas,
    definirPagina,
    definirOrdenacao,
    ordenar,
    direcao,
    definirPorPagina,
    buscarDetalhe,
    exportarLinhas,
    urlExportacaoCsv,
    chamadasFiltradas,
    linhas,
    kpis,
    filtrosAtivosCount,
    criteriosAtivosCount,
    opcoes,
    opcoesRemotas,
    buscarOpcoes,
    buscarOpcoesAgora,
    carregarMaisOpcoes,
    registrarSelecao,
    carregarCatalogo,
    catalogoCarregando,
    limparFiltros,
    resolver,
    adicionar,
    atualizar,
    aprovar,
    desaprovar,
    recusar,
    excluir,
    importar
  }
}
