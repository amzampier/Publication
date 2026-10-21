// Estado da tela de Lançar as Chamadas (Área Administrativa) na fase frontend.
// Sem API de itens: o conjunto e os catálogos vivem em memória (`useState`) e o
// F5 restaura o dataset de demonstração. Na fase backend, `carregarChamadas`
// troca o seed por `GET /api/lancar-chamadas` e as escritas passam pela API.
import { computed } from 'vue'
import { useState } from '#app'
import { useAuth } from '../../composables/useAuth'
import {
  buscarChamadas,
  calcularKpis,
  derivarOrigem,
  filtrarChamadas,
  formatarData,
  motivoBloqueioAprovacao,
  motivoBloqueioExclusao,
  motivoBloqueioRecusa,
  type CatalogosChamada,
  type ChamadaModelo,
  type EntradaChamada,
  type FiltrosChamada,
  type ImpactoChamada,
  type OrigemChamada,
  type StatusChamada,
  type TipoChamada,
  type OpcaoChamada,
  IMPACTOS_CHAMADA as CATALOGOS_CHAMADAS_IMPACTOS,
  ORIGENS_CHAMADA as CATALOGOS_CHAMADAS_ORIGENS,
  SITUACOES_CHAMADA as CATALOGOS_CHAMADAS_SITUACOES,
  STATUS_CHAMADA as CATALOGOS_CHAMADAS_STATUS,
  TIPOS_CHAMADA as CATALOGOS_CHAMADAS_TIPOS
} from './validadores'

export * from './validadores'

export interface LinhaChamada {
  id: string
  chamada: string
  titulo: string
  software: string
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

export const CATALOGOS_CHAMADAS: CatalogosChamada = {
  releases: [
    {
      id: 'rw-1',
      label: 'Release Week 43/2026',
      sigla: 'RW-43/2026',
      dataPublicacao: '2026-10-26'
    },
    {
      id: 'rw-2',
      label: 'Release Week 42/2026',
      sigla: 'RW-42/2026',
      dataPublicacao: '2026-10-19'
    },
    {
      id: 'rw-3',
      label: 'Release Week 41/2026',
      sigla: 'RW-41/2026',
      dataPublicacao: '2026-10-12'
    }
  ],
  projetos: [
    { id: 'pe-1', label: 'PE-2026.01 — Escopo Anual 2026', sigla: 'PE-2026.01' },
    { id: 'pe-2', label: 'PE-2026.02 — Modernização Fiscal', sigla: 'PE-2026.02' }
  ],
  manuais: [
    { id: 'man-1', label: 'MAN-10/2026 — Manual Fiscal', sigla: 'MAN-10/2026' },
    { id: 'man-2', label: 'MAN-09/2026 — Manual WMS', sigla: 'MAN-09/2026' }
  ],
  softwares: [
    { id: 'SFT-001', label: 'Teorema ERP' },
    { id: 'SFT-002', label: 'Portal do Cliente' },
    { id: 'SFT-003', label: 'WMS Teorema' }
  ],
  parceiros: [
    { id: 'par-1', label: 'Grupo Andrade' },
    { id: 'par-2', label: 'Supermercados Silva' },
    { id: 'par-3', label: 'Distribuidora Norte' }
  ]
}

const FILTROS_VAZIOS: FiltrosChamada = {
  status: '',
  situacao: '',
  tipo: '',
  impacto: '',
  softwareId: '',
  parceiroId: '',
  origem: '',
  dataLancamentoDe: '',
  dataLancamentoAte: '',
  dataLiberacaoDe: '',
  dataLiberacaoAte: ''
}

const encontrar = (lista: OpcaoChamada[], id: string): OpcaoChamada | undefined =>
  lista.find((opcao) => opcao.id === id)

const derivados = (
  entrada: Pick<
    EntradaChamada,
    'releaseId' | 'projetoId' | 'manualId' | 'softwareId' | 'parceiroId'
  >
) => {
  const release = encontrar(CATALOGOS_CHAMADAS.releases, entrada.releaseId)
  const software = encontrar(CATALOGOS_CHAMADAS.softwares, entrada.softwareId)
  const parceiro = encontrar(CATALOGOS_CHAMADAS.parceiros, entrada.parceiroId)
  return {
    origem: derivarOrigem(entrada) ?? 'Release',
    release: release?.sigla ?? release?.label ?? '',
    software: software?.label ?? '',
    parceiro: parceiro?.label ?? ''
  }
}

const novoId = (): string => {
  const gestor = globalThis.crypto as Crypto | undefined
  if (typeof gestor?.randomUUID === 'function') return gestor.randomUUID()
  return `lc-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const agoraIso = (): string => new Date().toISOString()

interface AutorChamada {
  id: string
  nome: string
}

const montarChamada = (
  entrada: EntradaChamada,
  autor: AutorChamada,
  over: Partial<ChamadaModelo> = {}
): ChamadaModelo => {
  const carimbo = agoraIso()
  return {
    id: novoId(),
    ...derivados(entrada),
    ...entrada,
    manualTitulo: entrada.manualTitulo?.trim() ?? '',
    autorId: autor.id,
    autorNome: autor.nome,
    status: 'Revisar',
    temHistorico: false,
    criadoEm: carimbo,
    atualizadoEm: carimbo,
    ...over
  }
}

const criarSeed = (): ChamadaModelo[] => {
  const ana: AutorChamada = { id: 'user-1', nome: 'Ana Carolina Ribeiro' }
  const rafael: AutorChamada = { id: 'user-2', nome: 'Rafael Moreira' }

  return [
    montarChamada(
      {
        chamada: 'CH-2026-8941',
        titulo: 'Ajuste no cálculo de impostos na emissão da NF-e',
        dataLancamento: '2026-10-19',
        dataLiberacao: '2026-10-26',
        releaseId: 'rw-1',
        projetoId: '',
        manualId: '',
        softwareId: 'SFT-001',
        parceiroId: 'par-1',
        modulo: 'Fiscal',
        menuFuncionalidade: 'Notas fiscais',
        tipo: 'Correção',
        impacto: 'Alto',
        situacao: 'Desenvolvimento',
        descricaoCompleta:
          'Correção do cálculo de impostos na emissão da NF-e para operações com substituição tributária.',
        linkManual: 'https://exemplo.com/manuais/fiscal',
        linkVideo: '',
        imagens: [],
        tags: ['fiscal', 'nf-e'],
      },
      ana,
      {
        id: 'lc-1',
        autorNome: ana.nome,
        criadoEm: '2026-10-19T09:00:00.000Z',
        atualizadoEm: '2026-10-19T09:00:00.000Z'
      }
    ),
    montarChamada(
      {
        chamada: 'CH-2026-8942',
        titulo: 'Novo filtro por centro de custo no relatório financeiro',
        dataLancamento: '2026-10-12',
        dataLiberacao: '2026-10-19',
        releaseId: 'rw-2',
        projetoId: '',
        manualId: '',
        softwareId: 'SFT-001',
        parceiroId: 'par-2',
        modulo: 'Financeiro',
        menuFuncionalidade: 'Relatórios',
        tipo: 'Melhoria',
        impacto: 'Médio',
        situacao: 'Homologação',
        descricaoCompleta:
          'Inclusão do filtro por centro de custo no relatório financeiro e no exportador de dados.',
        linkManual: '',
        linkVideo: 'https://exemplo.com/videos/financeiro',
        imagens: [],
        tags: ['financeiro', 'relatório'],
      },
      rafael,
      {
        id: 'lc-2',
        status: 'Aprovado',
        temHistorico: true,
        autorNome: rafael.nome,
        criadoEm: '2026-10-12T11:30:00.000Z',
        atualizadoEm: '2026-10-16T15:10:00.000Z'
      }
    ),
    montarChamada(
      {
        chamada: 'CH-2026-8943',
        titulo: 'Integração do WMS com a transportadora parceira',
        dataLancamento: '2026-10-05',
        dataLiberacao: '2026-10-12',
        releaseId: 'rw-3',
        projetoId: 'pe-1',
        manualId: '',
        softwareId: 'SFT-003',
        parceiroId: 'par-3',
        modulo: 'WMS',
        menuFuncionalidade: 'Expedição',
        tipo: 'Nova Funcionalidade',
        impacto: 'Crítico',
        situacao: 'Implantado',
        descricaoCompleta:
          'Integração de romaneios e eventos de expedição entre o WMS e a transportadora parceira.',
        linkManual: 'https://exemplo.com/manuais/wms-expedicao',
        linkVideo: '',
        imagens: [],
        tags: ['wms', 'integração', 'expedição'],
      },
      ana,
      {
        id: 'lc-3',
        status: 'Aprovado',
        temHistorico: true,
        autorNome: ana.nome,
        criadoEm: '2026-10-05T08:10:00.000Z',
        atualizadoEm: '2026-10-10T17:40:00.000Z'
      }
    ),
    montarChamada(
      {
        chamada: 'CH-2026-8944',
        titulo: 'Revisão do cadastro de produtos no portal',
        dataLancamento: '2026-10-19',
        dataLiberacao: '',
        releaseId: '',
        projetoId: 'pe-2',
        manualId: '',
        softwareId: 'SFT-002',
        parceiroId: 'par-1',
        modulo: 'Cadastros',
        menuFuncionalidade: 'Produtos',
        tipo: 'Melhoria',
        impacto: 'Baixo',
        situacao: 'Desenvolvimento',
        descricaoCompleta:
          'Revisão dos campos obrigatórios e das mensagens do cadastro de produtos no portal do cliente.',
        linkManual: '',
        linkVideo: '',
        imagens: [],
        tags: ['cadastros', 'portal'],
      },
      ana,
      {
        id: 'lc-4',
        status: 'Recusado',
        temHistorico: true,
        criadoEm: '2026-10-19T10:20:00.000Z',
        atualizadoEm: '2026-10-19T10:20:00.000Z'
      }
    ),
    montarChamada(
      {
        chamada: 'CH-2026-8945',
        titulo: 'Procedimento de fechamento contábil mensal',
        dataLancamento: '2026-10-12',
        dataLiberacao: '2026-10-19',
        releaseId: '',
        projetoId: '',
        manualId: 'man-1',
        softwareId: 'SFT-001',
        parceiroId: 'par-2',
        modulo: 'Contábil',
        menuFuncionalidade: 'Fechamento',
        tipo: 'Correção',
        impacto: 'Médio',
        situacao: 'Homologação',
        descricaoCompleta:
          'Atualização do procedimento de fechamento contábil mensal e dos anexos de conferência.',
        manualTitulo: 'Procedimento de fechamento contábil mensal',
        linkManual: 'https://exemplo.com/manuais/contabil',
        linkVideo: '',
        imagens: [],
        tags: ['contábil', 'manual'],
      },
      rafael,
      {
        id: 'lc-5',
        status: 'Aprovado',
        temHistorico: true,
        autorNome: rafael.nome,
        criadoEm: '2026-10-12T14:00:00.000Z',
        atualizadoEm: '2026-10-15T09:25:00.000Z'
      }
    ),
    montarChamada(
      {
        chamada: 'CH-2026-8946',
        titulo: 'Checklist de conferência de estoque',
        dataLancamento: '2026-10-05',
        dataLiberacao: '2026-10-26',
        releaseId: 'rw-1',
        projetoId: '',
        manualId: 'man-2',
        softwareId: 'SFT-003',
        parceiroId: 'par-3',
        modulo: 'Estoque',
        menuFuncionalidade: 'Conferência',
        tipo: 'Nova Funcionalidade',
        impacto: 'Alto',
        situacao: 'Implantado',
        descricaoCompleta:
          'Checklist digital para conferência de estoque com registro de divergências e evidências.',
        manualTitulo: 'Checklist de conferência de estoque',
        linkManual: 'https://exemplo.com/manuais/estoque',
        linkVideo: 'https://exemplo.com/videos/estoque',
        imagens: [],
        tags: ['estoque', 'checklist'],
      },
      ana,
      {
        id: 'lc-6',
        status: 'Aprovado',
        temHistorico: true,
        autorNome: ana.nome,
        criadoEm: '2026-10-05T13:10:00.000Z',
        atualizadoEm: '2026-10-09T16:00:00.000Z'
      }
    ),
    montarChamada(
      {
        chamada: 'CH-2026-8947',
        titulo: 'Padronização das mensagens de erro do portal',
        dataLancamento: '2026-10-19',
        dataLiberacao: '',
        releaseId: '',
        projetoId: 'pe-2',
        manualId: 'man-1',
        softwareId: 'SFT-002',
        parceiroId: 'par-1',
        modulo: 'Cadastros',
        menuFuncionalidade: 'Mensagens',
        tipo: 'Melhoria',
        impacto: 'Baixo',
        situacao: 'Desenvolvimento',
        descricaoCompleta:
          'Padronização das mensagens de erro do portal e revisão dos textos de ajuda exibidos ao usuário.',
        manualTitulo: 'Manual de mensagens do portal',
        linkManual: '',
        linkVideo: '',
        imagens: [],
        tags: ['portal', 'ux'],
      },
      rafael,
      {
        id: 'lc-7',
        criadoEm: '2026-10-19T15:45:00.000Z',
        atualizadoEm: '2026-10-19T15:45:00.000Z'
      }
    ),
    montarChamada(
      {
        chamada: 'CH-2026-8948',
        titulo: 'Ajuste no layout da etiqueta de expedição',
        dataLancamento: '2026-10-19',
        dataLiberacao: '2026-10-19',
        releaseId: 'rw-2',
        projetoId: '',
        manualId: '',
        softwareId: 'SFT-003',
        parceiroId: 'par-3',
        modulo: 'WMS',
        menuFuncionalidade: 'Etiquetas',
        tipo: 'Correção',
        impacto: 'Médio',
        situacao: 'Desenvolvimento',
        descricaoCompleta:
          'Ajuste no layout da etiqueta de expedição para impressão em impressoras térmicas.',
        linkManual: '',
        linkVideo: '',
        imagens: [],
        tags: ['wms', 'etiqueta'],
      },
      ana,
      {
        id: 'lc-8',
        criadoEm: '2026-10-19T16:30:00.000Z',
        atualizadoEm: '2026-10-19T16:30:00.000Z'
      }
    )
  ]
}

export const useLancarChamadasModelo = () => {
  const chamadas = useState<ChamadaModelo[]>('lancar-chamadas-base', () => [])
  const carregando = useState<boolean>('lancar-chamadas-carregando', () => false)
  const carregado = useState<boolean>('lancar-chamadas-carregado', () => false)
  const busca = useState<string>('lancar-chamadas-busca', () => '')
  const filtros = useState<FiltrosChamada>('lancar-chamadas-filtros', () => ({
    ...FILTROS_VAZIOS
  }))
  const { usuario } = useAuth()

  const autorAtual = computed<AutorChamada>(() => ({
    id: usuario.value?.id ?? 'sistema',
    nome: usuario.value?.nome ?? 'Sistema'
  }))

  const carregarChamadas = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      if (forcar || !carregado.value) chamadas.value = criarSeed()
      carregado.value = true
      return true
    } finally {
      carregando.value = false
    }
  }

  const chamadasFiltradas = computed(() =>
    buscarChamadas(filtrarChamadas(chamadas.value, filtros.value), busca.value)
  )

  const linhas = computed<LinhaChamada[]>(() =>
    chamadasFiltradas.value.map((chamada) => ({
      id: chamada.id,
      chamada: chamada.chamada,
      titulo: chamada.titulo,
      software: chamada.software,
      modulo: chamada.modulo,
      tipo: chamada.tipo,
      impacto: chamada.impacto,
      status: chamada.status,
      dataLancamento: formatarData(chamada.dataLancamento),
      dataLiberacao: formatarData(chamada.dataLiberacao),
      dataLancamentoIso: chamada.dataLancamento,
      dataLiberacaoIso: chamada.dataLiberacao,
      origem: chamada.origem
    }))
  )

  const kpis = computed(() => calcularKpis(chamadasFiltradas.value))

  const filtrosAtivosCount = computed(
    () =>
      [
        filtros.value.status,
        filtros.value.situacao,
        filtros.value.tipo,
        filtros.value.impacto,
        filtros.value.softwareId,
        filtros.value.parceiroId,
        filtros.value.origem,
        filtros.value.dataLancamentoDe,
        filtros.value.dataLancamentoAte,
        filtros.value.dataLiberacaoDe,
        filtros.value.dataLiberacaoAte
      ].filter(Boolean).length
  )

  /** Contagem usada pela toolbar: filtros do modal + termo de busca. */
  const criteriosAtivosCount = computed(
    () => filtrosAtivosCount.value + (busca.value.trim() ? 1 : 0)
  )

  const opcoes = computed(() => ({
    status: [...CATALOGOS_CHAMADAS_STATUS],
    situacoes: [...CATALOGOS_CHAMADAS_SITUACOES],
    tipos: [...CATALOGOS_CHAMADAS_TIPOS],
    impactos: [...CATALOGOS_CHAMADAS_IMPACTOS],
    origens: [...CATALOGOS_CHAMADAS_ORIGENS],
    softwares: CATALOGOS_CHAMADAS.softwares,
    parceiros: CATALOGOS_CHAMADAS.parceiros
  }))

  const limparFiltros = () => {
    filtros.value = { ...FILTROS_VAZIOS }
  }

  const resolver = (id: string): ChamadaModelo | null =>
    chamadas.value.find((chamada) => chamada.id === id) ?? null

  const adicionar = (entrada: EntradaChamada): ChamadaModelo => {
    const nova = montarChamada(entrada, autorAtual.value)
    chamadas.value = [nova, ...chamadas.value]
    carregado.value = true
    return nova
  }

  const atualizar = (id: string, entrada: EntradaChamada): ChamadaModelo | null => {
    const atual = resolver(id)
    if (!atual) return null
    const atualizada: ChamadaModelo = {
      ...atual,
      ...entrada,
      ...derivados(entrada),
      status: atual.status,
      autorId: atual.autorId,
      autorNome: atual.autorNome,
      temHistorico: atual.temHistorico,
      criadoEm: atual.criadoEm,
      atualizadoEm: agoraIso()
    }
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? atualizada : chamada))
    return atualizada
  }

  const aprovar = (id: string): { ok: boolean; motivo?: string } => {
    const atual = resolver(id)
    if (!atual) return { ok: false, motivo: 'Chamada não encontrada.' }
    const motivo = motivoBloqueioAprovacao(atual)
    if (motivo) return { ok: false, motivo }
    const aprovada: ChamadaModelo = {
      ...atual,
      status: 'Aprovado',
      atualizadoEm: agoraIso()
    }
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? aprovada : chamada))
    return { ok: true }
  }

  const recusar = (id: string): { ok: boolean; motivo?: string } => {
    const atual = resolver(id)
    if (!atual) return { ok: false, motivo: 'Chamada não encontrada.' }
    const motivo = motivoBloqueioRecusa(atual)
    if (motivo) return { ok: false, motivo }
    const recusada: ChamadaModelo = {
      ...atual,
      status: 'Recusado',
      atualizadoEm: agoraIso()
    }
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? recusada : chamada))
    return { ok: true }
  }

  const excluir = (id: string): { ok: boolean; motivo?: string } => {
    const atual = resolver(id)
    if (!atual) return { ok: false, motivo: 'Chamada não encontrada.' }
    const motivo = motivoBloqueioExclusao(atual)
    if (motivo) return { ok: false, motivo }
    chamadas.value = chamadas.value.filter((chamada) => chamada.id !== id)
    return { ok: true }
  }

  return {
    chamadas,
    carregando,
    carregado,
    busca,
    filtros,
    catalogo: CATALOGOS_CHAMADAS,
    autorAtual,
    carregarChamadas,
    chamadasFiltradas,
    linhas,
    kpis,
    filtrosAtivosCount,
    criteriosAtivosCount,
    opcoes,
    limparFiltros,
    resolver,
    adicionar,
    atualizar,
    aprovar,
    recusar,
    excluir
  }
}
