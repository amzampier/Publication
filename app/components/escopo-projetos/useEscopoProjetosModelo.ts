// Estado da página de Escopo de Projetos (Área Administrativa) na fase
// frontend. O dataset em memória (`useState`) permite exercitar a grade, o
// formulário, publicar/arquivar, exclusão e os itens sem backend. A fase
// backend substituirá este seed por GET /api/escopo-projetos.
import { computed } from 'vue'
import { useState } from '#app'
import {
  STATUS_ESCOPO,
  SOFTWARES_MOCK,
  buscarEscopos,
  calcularKpis,
  filtrarEscopos,
  hojeIso,
  motivoBloqueioExclusao,
  proximoCodigo,
  softwaresDosItens,
  type FiltrosEscopo,
  type ItemProjeto,
  type KpisEscopo,
  type ProjetoEscopoModelo,
  type StatusEscopo
} from './validadores'

export * from './validadores'

export interface EntradaEscopo {
  nome: string
  versao: string
  ano: number
  dataInicio: string
  dataFinal: string
  dataPrevisao: string
  dataPublicacao: string
  status: StatusEscopo
  descricaoGeral: string
}

export type DadosEscopo = Partial<EntradaEscopo>
export type ModoEscopo = 'novo' | 'editar'

const agoraIso = (): string => new Date().toISOString()

const novoId = (): string => {
  const cripto = globalThis.crypto as Crypto | undefined
  if (cripto && typeof cripto.randomUUID === 'function') return cripto.randomUUID()
  return `esc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const seedEscoposBase: ProjetoEscopoModelo[] = [
  {
    id: 'esc-2026-01',
    codigo: 'PE-2026.01',
    nome: 'Escopo Anual 2026',
    versao: 'v2026.1',
    ano: 2026,
    dataInicio: '2026-01-05',
    dataFinal: '2026-12-31',
    dataPrevisao: '2026-12-20',
    dataPublicacao: '2026-01-02',
    status: 'Em Andamento',
    softwaresContemplados: ['SFT-001', 'SFT-002'],
    descricaoGeral:
      'Modernização dos módulos fiscais e de estoque, com integração ao WMS e revisão das rotinas de fechamento.',
    totalVisualizacoes: 1280,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2026-01-02T09:00:00.000Z',
    atualizadoEm: '2026-10-18T14:20:00.000Z'
  },
  {
    id: 'esc-2026-02',
    codigo: 'PE-2026.02',
    nome: 'Portal de Publicações — Fase 2',
    versao: 'v2026.2',
    ano: 2026,
    dataInicio: '2026-02-02',
    dataFinal: '2026-11-30',
    dataPrevisao: '2026-11-20',
    dataPublicacao: '2026-02-01',
    status: 'Homologação',
    softwaresContemplados: ['SFT-004', 'SFT-001'],
    descricaoGeral:
      'Publicação de releases na home, busca unificada e ajustes de acessibilidade do portal público.',
    totalVisualizacoes: 860,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2026-02-01T08:30:00.000Z',
    atualizadoEm: '2026-10-17T16:10:00.000Z'
  },
  {
    id: 'esc-2026-03',
    codigo: 'PE-2026.03',
    nome: 'Integrações Bancárias',
    versao: 'v2026.3',
    ano: 2026,
    dataInicio: '2026-03-02',
    dataFinal: '2026-10-30',
    dataPrevisao: '2026-10-20',
    dataPublicacao: '2026-03-01',
    status: 'Concluído',
    softwaresContemplados: ['SFT-006', 'SFT-001'],
    descricaoGeral:
      'Conectores bancários, conciliação automática e novos webhooks de faturamento.',
    totalVisualizacoes: 540,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2026-03-01T10:15:00.000Z',
    atualizadoEm: '2026-10-15T11:40:00.000Z'
  },
  {
    id: 'esc-2025-01',
    codigo: 'PE-2025.01',
    nome: 'Escopo Anual 2025',
    versao: 'v2025.1',
    ano: 2025,
    dataInicio: '2025-01-06',
    dataFinal: '2025-12-22',
    dataPrevisao: '2025-12-15',
    dataPublicacao: '2025-01-02',
    status: 'Publicado',
    softwaresContemplados: ['SFT-001', 'SFT-002', 'SFT-003'],
    descricaoGeral:
      'Reestruturação do cadastro de produtos, novo layout do WMS e rotinas de backup.',
    totalVisualizacoes: 2140,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2025-01-02T09:00:00.000Z',
    atualizadoEm: '2025-12-20T17:00:00.000Z'
  },
  {
    id: 'esc-2025-02',
    codigo: 'PE-2025.02',
    nome: 'Modernização do WMS',
    versao: 'v2025.2',
    ano: 2025,
    dataInicio: '2025-02-03',
    dataFinal: '2025-11-28',
    dataPrevisao: '2025-11-20',
    dataPublicacao: '2025-02-01',
    status: 'Concluído',
    softwaresContemplados: ['SFT-002'],
    descricaoGeral: 'Revisão da expedição, ondas de separação e conferência por coletor.',
    totalVisualizacoes: 980,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2025-02-01T08:00:00.000Z',
    atualizadoEm: '2025-11-25T15:30:00.000Z'
  },
  {
    id: 'esc-2025-03',
    codigo: 'PE-2025.03',
    nome: 'Aplicativo Mobile',
    versao: 'v2025.3',
    ano: 2025,
    dataInicio: '2025-03-03',
    dataFinal: '2025-10-31',
    dataPrevisao: '2025-10-24',
    dataPublicacao: '2025-03-01',
    status: 'Publicado',
    softwaresContemplados: ['SFT-005'],
    descricaoGeral: 'Aplicativo de conferência e acompanhamento de entregas em campo.',
    totalVisualizacoes: 760,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2025-03-01T09:30:00.000Z',
    atualizadoEm: '2025-10-28T10:00:00.000Z'
  },
  {
    id: 'esc-2024-01',
    codigo: 'PE-2024.01',
    nome: 'Escopo Anual 2024',
    versao: 'v2024.1',
    ano: 2024,
    dataInicio: '2024-01-08',
    dataFinal: '2024-12-20',
    dataPrevisao: '2024-12-13',
    dataPublicacao: '2024-01-02',
    status: 'Publicado',
    softwaresContemplados: ['SFT-001', 'SFT-003'],
    descricaoGeral: 'Rotina de backup automatizado e auditoria de acessos ao ERP.',
    totalVisualizacoes: 3210,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2024-01-02T08:00:00.000Z',
    atualizadoEm: '2024-12-18T16:00:00.000Z'
  },
  {
    id: 'esc-2024-02',
    codigo: 'PE-2024.02',
    nome: 'Backup e Continuidade',
    versao: 'v2024.2',
    ano: 2024,
    dataInicio: '2024-02-05',
    dataFinal: '2024-11-29',
    dataPrevisao: '2024-11-22',
    dataPublicacao: '2024-02-01',
    status: 'Concluído',
    softwaresContemplados: ['SFT-003'],
    descricaoGeral: 'Plano de continuidade, testes de restauração e cópia off-site.',
    totalVisualizacoes: 430,
    itensCount: 0,
    arquivada: false,
    criadoEm: '2024-02-01T09:00:00.000Z',
    atualizadoEm: '2024-11-26T14:00:00.000Z'
  },
  {
    id: 'esc-2023-01',
    codigo: 'PE-2023.01',
    nome: 'Escopo Anual 2023',
    versao: 'v2023.1',
    ano: 2023,
    dataInicio: '2023-01-02',
    dataFinal: '2023-12-29',
    dataPrevisao: '2023-12-20',
    dataPublicacao: '2023-01-01',
    status: 'Publicado',
    softwaresContemplados: ['SFT-001'],
    descricaoGeral: 'Catálogo histórico de 2023, arquivado para consulta.',
    totalVisualizacoes: 1980,
    itensCount: 0,
    arquivada: true,
    criadoEm: '2023-01-01T08:00:00.000Z',
    atualizadoEm: '2023-12-27T16:00:00.000Z'
  }
]

const seedItens: ItemProjeto[] = [
  {
    id: 'item-esc-1',
    projetoId: 'esc-2026-01',
    chamada: '0000581201',
    titulo: 'Novo painel de indicadores',
    software: 'Teorema ERP',
    modulo: 'Painel Executivo',
    tipo: 'Nova Funcionalidade',
    impacto: 'Alto',
    situacao: 'Desenvolvimento',
    status: 'Revisar',
    dataLiberacao: '2026-03-16'
  },
  {
    id: 'item-esc-2',
    projetoId: 'esc-2026-01',
    chamada: '0000581240',
    titulo: 'Ajuste no fechamento fiscal',
    software: 'Teorema ERP',
    modulo: 'Fiscal',
    tipo: 'Correção',
    impacto: 'Médio',
    situacao: 'Homologação',
    status: 'Aprovado',
    dataLiberacao: '2026-04-06'
  },
  {
    id: 'item-esc-3',
    projetoId: 'esc-2026-01',
    chamada: '0000581301',
    titulo: 'Integração com o WMS',
    software: 'Teorema WMS',
    modulo: 'Integrações',
    tipo: 'Melhoria',
    impacto: 'Alto',
    situacao: 'Desenvolvimento',
    status: 'Revisar',
    dataLiberacao: '2026-05-11'
  },
  {
    id: 'item-esc-4',
    projetoId: 'esc-2026-02',
    chamada: '0000581402',
    titulo: 'Publicação de releases na home',
    software: 'Portal do Cliente',
    modulo: 'Publicações',
    tipo: 'Nova Funcionalidade',
    impacto: 'Médio',
    situacao: 'Homologação',
    status: 'Aprovado',
    dataLiberacao: '2026-06-08'
  },
  {
    id: 'item-esc-5',
    projetoId: 'esc-2026-02',
    chamada: '0000581440',
    titulo: 'Busca unificada do portal',
    software: 'Portal do Cliente',
    modulo: 'Busca',
    tipo: 'Melhoria',
    impacto: 'Médio',
    situacao: 'Desenvolvimento',
    status: 'Revisar',
    dataLiberacao: '2026-07-13'
  },
  {
    id: 'item-esc-6',
    projetoId: 'esc-2026-03',
    chamada: '0000581501',
    titulo: 'Conector bancário PIX',
    software: 'Integrações',
    modulo: 'Financeiro',
    tipo: 'Nova Funcionalidade',
    impacto: 'Alto',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2026-08-10'
  },
  {
    id: 'item-esc-7',
    projetoId: 'esc-2025-01',
    chamada: '0000580101',
    titulo: 'Reestruturação do cadastro de produtos',
    software: 'Teorema ERP',
    modulo: 'Estoque',
    tipo: 'Melhoria',
    impacto: 'Médio',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2025-04-14'
  },
  {
    id: 'item-esc-8',
    projetoId: 'esc-2025-01',
    chamada: '0000580150',
    titulo: 'Novo layout do WMS',
    software: 'Teorema WMS',
    modulo: 'Expedição',
    tipo: 'Nova Funcionalidade',
    impacto: 'Alto',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2025-07-07'
  },
  {
    id: 'item-esc-9',
    projetoId: 'esc-2025-03',
    chamada: '0000580301',
    titulo: 'Aplicativo de conferência',
    software: 'Teorema Mobile',
    modulo: 'Expedição',
    tipo: 'Nova Funcionalidade',
    impacto: 'Alto',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2025-09-15'
  },
  {
    id: 'item-esc-10',
    projetoId: 'esc-2024-01',
    chamada: '0000579001',
    titulo: 'Rotina de backup automatizado',
    software: 'Teorema Backup',
    modulo: 'Infraestrutura',
    tipo: 'Melhoria',
    impacto: 'Médio',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2024-05-13'
  },
  {
    id: 'item-esc-11',
    projetoId: 'esc-2024-01',
    chamada: '0000579050',
    titulo: 'Auditoria de acessos',
    software: 'Teorema ERP',
    modulo: 'Segurança',
    tipo: 'Nova Funcionalidade',
    impacto: 'Alto',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2024-08-12'
  }
]

const agruparItens = (): Record<string, ItemProjeto[]> => {
  const mapa: Record<string, ItemProjeto[]> = {}
  for (const escopo of seedEscoposBase) mapa[escopo.id] = []
  for (const item of seedItens) {
    mapa[item.projetoId] = [...(mapa[item.projetoId] ?? []), item]
  }
  return mapa
}

const seedItensPorProjeto = agruparItens()
const seedEscopos = seedEscoposBase.map((escopo) => ({
  ...escopo,
  // Os softwares contemplados são derivados dos itens (chamadas) do escopo.
  softwaresContemplados: softwaresDosItens(seedItensPorProjeto[escopo.id] ?? []),
  itensCount: seedItensPorProjeto[escopo.id]?.length ?? 0
}))

export const useEscopoProjetosModelo = () => {
  const escopos = useState<ProjetoEscopoModelo[]>('escopo-projetos-base', () =>
    seedEscopos.map((escopo) => ({ ...escopo }))
  )
  const itensPorProjeto = useState<Record<string, ItemProjeto[]>>(
    'escopo-projetos-itens',
    () =>
      Object.fromEntries(
        Object.entries(seedItensPorProjeto).map(([id, itens]) => [
          id,
          itens.map((item) => ({ ...item }))
        ])
      )
  )

  const filtros = useState<FiltrosEscopo>('escopo-projetos-filtros', () => ({
    status: '',
    ano: '',
    versao: '',
    software: ''
  }))
  const busca = useState<string>('escopo-projetos-busca', () => '')

  // A fonte de exibição recalcula softwares/itens a partir das chamadas, de modo
  // que o card/formulário nunca dependam de uma seleção manual de softwares.
  const escoposComSoftwares = computed<ProjetoEscopoModelo[]>(() =>
    escopos.value.map((escopo) => {
      const itens = itensPorProjeto.value[escopo.id] ?? []
      return {
        ...escopo,
        softwaresContemplados: softwaresDosItens(itens),
        itensCount: itens.length
      }
    })
  )

  const escoposFiltrados = computed(() => filtrarEscopos(escoposComSoftwares.value, filtros.value))
  const escoposVisiveis = computed(() => buscarEscopos(escoposFiltrados.value, busca.value))
  const kpis = computed<KpisEscopo>(() => calcularKpis(escoposFiltrados.value))

  const filtrosAtivosCount = computed(
    () =>
      [filtros.value.status, filtros.value.ano, filtros.value.versao, filtros.value.software].filter(
        Boolean
      ).length
  )

  const opcoes = computed(() => {
    const ativos = escoposComSoftwares.value.filter((escopo) => !escopo.arquivada)
    const softwaresPresentes = new Set(ativos.flatMap((escopo) => escopo.softwaresContemplados))
    return {
      status: [...STATUS_ESCOPO],
      anos: [...new Set(ativos.map((escopo) => String(escopo.ano)))].sort((a, b) =>
        b.localeCompare(a)
      ),
      versoes: [...new Set(ativos.map((escopo) => escopo.versao))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
      softwares: SOFTWARES_MOCK.filter((software) => softwaresPresentes.has(software.codigo)).map(
        (software) => ({
          value: software.codigo,
          label: software.descricao
        })
      )
    }
  })

  const limparFiltros = () => {
    filtros.value = { status: '', ano: '', versao: '', software: '' }
  }

  const itensDoProjeto = (projetoId: string): ItemProjeto[] =>
    itensPorProjeto.value[projetoId] ?? []

  /** Códigos dos softwares contemplados, derivados das chamadas do projeto. */
  const softwaresDoEscopo = (projetoId: string): string[] =>
    softwaresDosItens(itensDoProjeto(projetoId))

  // -------------------------------------------------------------------------
  // Escritas — apenas no dataset em memória (fase frontend).
  // -------------------------------------------------------------------------

  const adicionar = (dados: EntradaEscopo): ProjetoEscopoModelo => {
    const agora = agoraIso()
    const escopo: ProjetoEscopoModelo = {
      id: novoId(),
      codigo: proximoCodigo(dados.ano, escopos.value),
      nome: dados.nome.trim(),
      versao: dados.versao.trim(),
      ano: dados.ano,
      dataInicio: dados.dataInicio,
      dataFinal: dados.dataFinal,
      dataPrevisao: dados.dataPrevisao,
      dataPublicacao: dados.dataPublicacao,
      status: dados.status,
      softwaresContemplados: [],
      descricaoGeral: dados.descricaoGeral.trim(),
      totalVisualizacoes: 0,
      itensCount: 0,
      arquivada: false,
      criadoEm: agora,
      atualizadoEm: agora
    }
    escopos.value = [escopo, ...escopos.value]
    itensPorProjeto.value = { ...itensPorProjeto.value, [escopo.id]: [] }
    return escopo
  }

  const atualizar = (id: string, dados: DadosEscopo): ProjetoEscopoModelo | null => {
    const atual = escopos.value.find((escopo) => escopo.id === id)
    if (!atual) return null
    const atualizado: ProjetoEscopoModelo = {
      ...atual,
      ...dados,
      nome: (dados.nome ?? atual.nome).trim(),
      versao: (dados.versao ?? atual.versao).trim(),
      descricaoGeral: (dados.descricaoGeral ?? atual.descricaoGeral).trim(),
      softwaresContemplados: softwaresDosItens(itensPorProjeto.value[id] ?? []),
      atualizadoEm: agoraIso()
    }
    escopos.value = escopos.value.map((escopo) => (escopo.id === id ? atualizado : escopo))
    return atualizado
  }

  const publicar = (id: string): boolean => {
    const atual = escopos.value.find((escopo) => escopo.id === id)
    if (!atual) return false
    escopos.value = escopos.value.map((escopo) =>
      escopo.id === id
        ? {
            ...escopo,
            status: 'Publicado',
            dataPublicacao: hojeIso(),
            atualizadoEm: agoraIso()
          }
        : escopo
    )
    return true
  }

  const arquivar = (id: string): boolean => {
    const atual = escopos.value.find((escopo) => escopo.id === id)
    if (!atual) return false
    escopos.value = escopos.value.map((escopo) =>
      escopo.id === id
        ? { ...escopo, arquivada: true, atualizadoEm: agoraIso() }
        : escopo
    )
    return true
  }

  const excluir = (id: string): { ok: boolean; motivo?: string } => {
    const escopo = escopos.value.find((item) => item.id === id)
    if (!escopo) return { ok: false, motivo: 'Escopo não encontrado.' }
    const motivo = motivoBloqueioExclusao(escopo)
    if (motivo) return { ok: false, motivo }
    escopos.value = escopos.value.filter((item) => item.id !== id)
    const { [id]: _removido, ...resto } = itensPorProjeto.value
    itensPorProjeto.value = resto
    return { ok: true }
  }

  return {
    escopos,
    escoposComSoftwares,
    itensPorProjeto,
    itensDoProjeto,
    softwaresDoEscopo,
    filtros,
    busca,
    escoposFiltrados,
    escoposVisiveis,
    kpis,
    filtrosAtivosCount,
    opcoes,
    limparFiltros,
    adicionar,
    atualizar,
    publicar,
    arquivar,
    excluir
  }
}
