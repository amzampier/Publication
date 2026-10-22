import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import { useAuth } from '../../composables/useAuth'
import { usePermissions } from '../../composables/usePermissions'
import {
  FILTROS_ESTEIRA_VAZIOS,
  calcularProgresso,
  contextoAtivo,
  filtrarItensEsteira,
  formatarDataHora,
  itemNoCicloAtivo,
  itemVisivelNoBoard,
  origemDoItem,
  rotuloVinculo,
  type AcaoEsteira,
  type FiltrosEsteira,
  type HistoricoEsteira,
  type ItemEsteira,
  type ProgressoEsteira
} from './validadores'
import type {
  CatalogosChamada,
  ChamadaModelo,
  OpcaoChamada,
  StatusChamada
} from './validadores'

const CATALOGO_VAZIO: CatalogosChamada = {
  releases: [],
  projetos: [],
  manuais: [],
  softwares: [],
  parceiros: []
}

export interface KpisEsteira {
  total: number
  revisar: number
  aprovado: number
  recusado: number
}

export interface LinhaEsteira {
  id: string
  chamada: string
  titulo: string
  origem: string
  vinculo: string
  software: string
  softwares: string[]
  tipo: string
  impacto: string
  situacao: string
  status: StatusChamada
  revisor: string
  atualizadoEm: string
  atualizadoTexto: string
  item: ItemEsteira
}

export interface OpcoesEsteira {
  status: StatusChamada[]
  origens: string[]
  tipos: string[]
  impactos: string[]
  releases: OpcaoChamada[]
  manuais: OpcaoChamada[]
  projetos: OpcaoChamada[]
  softwares: OpcaoChamada[]
  parceiros: OpcaoChamada[]
}

export const useEsteiraRevisaoModelo = () => {
  const itens = useState<ItemEsteira[]>('esteira-itens', () => [])
  const opcoes = useState<CatalogosChamada>('esteira-opcoes', () => ({ ...CATALOGO_VAZIO }))
  const carregando = useState<boolean>('esteira-carregando', () => false)
  const carregado = useState<boolean>('esteira-carregado', () => false)
  const busca = useState<string>('esteira-busca', () => '')
  const filtros = useState<FiltrosEsteira>('esteira-filtros', () => ({
    ...FILTROS_ESTEIRA_VAZIOS
  }))
  const mostrarRecusadas = useState<boolean>('esteira-mostrar-recusadas', () => false)
  const historico = useState<Record<string, HistoricoEsteira[]>>(
    'esteira-historico',
    () => ({})
  )
  const historicoCarregando = useState<Record<string, boolean>>(
    'esteira-historico-carregando',
    () => ({})
  )

  const { usuario } = useAuth()
  const { can } = usePermissions()

  const filtrosAtivosCount = computed(
    () =>
      [
        filtros.value.status,
        filtros.value.origem,
        filtros.value.releaseId,
        filtros.value.manualId,
        filtros.value.projetoId,
        filtros.value.softwareId,
        filtros.value.parceiroId,
        filtros.value.tipo,
        filtros.value.impacto,
        filtros.value.dataLancamentoDe,
        filtros.value.dataLancamentoAte,
        filtros.value.dataLiberacaoDe,
        filtros.value.dataLiberacaoAte
      ].filter(Boolean).length
  )

  const criteriosAtivosCount = computed(
    () => filtrosAtivosCount.value + (busca.value.trim() ? 1 : 0)
  )

  const carregar = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false

    if (!can('esteira-revisao', 'filtrar')) filtros.value = { ...FILTROS_ESTEIRA_VAZIOS }
    if (!can('esteira-revisao', 'buscar')) busca.value = ''

    carregando.value = true
    try {
      const query: Record<string, string> = {}
      if (busca.value.trim()) query.busca = '1'
      if (filtrosAtivosCount.value > 0) query.filtros = '1'
      const resposta = await useApiFetch<{
        itens: ItemEsteira[]
        opcoes: CatalogosChamada
        progresso: ProgressoEsteira
      }>('/api/esteira-revisao', { query })
      itens.value = resposta.itens
      opcoes.value = resposta.opcoes ?? { ...CATALOGO_VAZIO }
      carregado.value = true
      return true
    } catch {
      itens.value = []
      opcoes.value = { ...CATALOGO_VAZIO }
      carregado.value = false
      return false
    } finally {
      carregando.value = false
    }
  }

  const itensCiclo = computed(() => itens.value.filter(itemNoCicloAtivo))

  const itensFiltrados = computed(() =>
    filtrarItensEsteira(
      itens.value.filter((item) => itemVisivelNoBoard(item, filtros.value)),
      filtros.value,
      busca.value,
      'todas'
    )
  )

  const progresso = computed(() => calcularProgresso(itensCiclo.value))

  const kpis = computed<KpisEsteira>(() => {
    const conjunto = itensFiltrados.value
    return {
      total: conjunto.length,
      revisar: conjunto.filter((item) => item.status === 'Revisar').length,
      aprovado: conjunto.filter((item) => item.status === 'Aprovado').length,
      recusado: conjunto.filter((item) => item.status === 'Recusado').length
    }
  })

  const linhas = computed<LinhaEsteira[]>(() =>
    itensFiltrados.value.map((item) => ({
      id: item.id,
      chamada: item.chamada,
      titulo: item.titulo,
      origem: origemDoItem(item),
      vinculo: rotuloVinculo(item),
      software: item.softwares.join(', '),
      softwares: [...item.softwares],
      tipo: item.tipo,
      impacto: item.impacto,
      situacao: item.situacao,
      status: item.status,
      revisor: item.revisorNome || '—',
      atualizadoEm: item.atualizadoEm,
      atualizadoTexto: formatarDataHora(item.atualizadoEm),
      item
    }))
  )

  const contagemPorOrigem = computed<Record<string, number>>(() => ({
    '': itensCiclo.value.length,
    Release: itensCiclo.value.filter((item) => contextoAtivo(item.contexto.release)).length,
    Manual: itensCiclo.value.filter((item) => contextoAtivo(item.contexto.manual)).length,
    Projeto: itensCiclo.value.filter((item) => contextoAtivo(item.contexto.projeto)).length
  }))

  const contagemPorStatus = computed<Record<StatusChamada, number>>(() => ({
    Revisar: itensCiclo.value.filter((item) => item.status === 'Revisar').length,
    Aprovado: itensCiclo.value.filter((item) => item.status === 'Aprovado').length,
    Recusado: itensCiclo.value.filter((item) => item.status === 'Recusado').length,
    Publicar: itensCiclo.value.filter((item) => item.status === 'Publicar').length
  }))

  const opcoesFiltro = computed<OpcoesEsteira>(() => ({
    status: ['Revisar', 'Aprovado', 'Recusado', 'Publicar'],
    origens: ['Release', 'Manual', 'Projeto', 'Ambos'],
    tipos: ['Correção', 'Melhoria', 'Nova Funcionalidade'],
    impactos: ['Baixo', 'Médio', 'Alto', 'Crítico'],
    releases: opcoes.value.releases,
    manuais: opcoes.value.manuais,
    projetos: opcoes.value.projetos,
    softwares: opcoes.value.softwares,
    parceiros: opcoes.value.parceiros
  }))

  const opcoesPacotes = computed<OpcaoChamada[]>(() => [
    ...opcoes.value.releases.map((opcao) => ({
      id: `release:${opcao.id}`,
      label: `Release · ${opcao.label}`
    })),
    ...opcoes.value.manuais.map((opcao) => ({
      id: `manual:${opcao.id}`,
      label: `Manual · ${opcao.label}`
    })),
    ...opcoes.value.projetos.map((opcao) => ({
      id: `projeto:${opcao.id}`,
      label: `Escopo · ${opcao.label}`
    }))
  ])

  const pacoteSelecionado = computed(() => {
    if (filtros.value.releaseId) return `release:${filtros.value.releaseId}`
    if (filtros.value.manualId) return `manual:${filtros.value.manualId}`
    if (filtros.value.projetoId) return `projeto:${filtros.value.projetoId}`
    return ''
  })

  const aplicarPacote = (valor: string) => {
    const [tipo = '', id = ''] = valor.split(':')
    filtros.value = {
      ...filtros.value,
      releaseId: tipo === 'release' ? id : '',
      manualId: tipo === 'manual' ? id : '',
      projetoId: tipo === 'projeto' ? id : ''
    }
  }

  const limparFiltros = () => {
    filtros.value = { ...FILTROS_ESTEIRA_VAZIOS }
  }

  const filtrarPorOrigem = (origem: string) => {
    filtros.value = { ...filtros.value, origem }
  }

  const alternarRecusadas = () => {
    mostrarRecusadas.value = !mostrarRecusadas.value
  }

  const resolver = (id: string): ItemEsteira | null =>
    itens.value.find((item) => item.id === id) ?? null

  const carregarHistorico = async (
    id: string,
    forcar = false
  ): Promise<HistoricoEsteira[]> => {
    if (!forcar && historico.value[id]) return historico.value[id]
    if (historicoCarregando.value[id]) return historico.value[id] ?? []
    historicoCarregando.value = { ...historicoCarregando.value, [id]: true }
    try {
      const lista = await useApiFetch<HistoricoEsteira[]>(
        `/api/esteira-revisao/${id}/historico`
      )
      historico.value = { ...historico.value, [id]: lista }
      return lista
    } catch {
      return []
    } finally {
      historicoCarregando.value = { ...historicoCarregando.value, [id]: false }
    }
  }

  const atualizarNaLista = (atualizado: ChamadaModelo, opcoesAcao: { parecer?: string }) => {
    const agora = new Date().toISOString()
    itens.value = itens.value.map((item) =>
      item.id === atualizado.id
        ? {
            ...item,
            ...atualizado,
            revisorId: usuario.value?.id ?? item.revisorId,
            revisorNome: usuario.value?.nome ?? item.revisorNome,
            dataDecisao: agora,
            parecer: opcoesAcao.parecer ?? item.parecer
          }
        : item
    )
    const cache = { ...historico.value }
    delete cache[atualizado.id]
    historico.value = cache
  }

  const decidir = async (
    id: string,
    acao: AcaoEsteira,
    opcoesAcao: { parecer?: string; criterios?: boolean } = {}
  ): Promise<ChamadaModelo> => {
    const atualizado = await useApiFetch<ChamadaModelo>(`/api/esteira-revisao/${id}/${acao}`, {
      method: 'PUT',
      body: opcoesAcao
    })
    atualizarNaLista(atualizado, opcoesAcao)
    return atualizado
  }

  const aprovar = (id: string, opcoesAcao: { parecer?: string; criterios?: boolean } = {}) =>
    decidir(id, 'aprovar', opcoesAcao)

  const recusar = (id: string, opcoesAcao: { parecer: string; criterios?: boolean }) =>
    decidir(id, 'recusar', opcoesAcao)

  const reabrir = (id: string, opcoesAcao: { parecer?: string } = {}) =>
    decidir(id, 'reabrir', opcoesAcao)

  const publicar = (id: string, opcoesAcao: { parecer?: string } = {}) =>
    decidir(id, 'publicar', opcoesAcao)

  const suspender = (id: string, opcoesAcao: { parecer?: string } = {}) =>
    decidir(id, 'suspender', opcoesAcao)

  return {
    itens,
    opcoes,
    carregando,
    carregado,
    busca,
    filtros,
    mostrarRecusadas,
    filtrosAtivosCount,
    criteriosAtivosCount,
    carregar,
    itensFiltrados,
    linhas,
    progresso,
    kpis,
    contagemPorOrigem,
    contagemPorStatus,
    opcoesFiltro,
    opcoesPacotes,
    pacoteSelecionado,
    aplicarPacote,
    limparFiltros,
    filtrarPorOrigem,
    alternarRecusadas,
    resolver,
    historico,
    historicoCarregando,
    carregarHistorico,
    aprovar,
    recusar,
    reabrir,
    publicar,
    suspender
  }
}
