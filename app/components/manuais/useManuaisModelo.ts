// Estado da página de Manuais Mensais (Área Administrativa) na fase frontend.
// O dataset em memória (`useState`) permite exercitar todas as ações sem API;
// na fase backend ele é substituído por GET /api/manuais. Nenhum registro é
// gravado no banco e recarregar a página restaura o conjunto inicial.
import { computed } from 'vue'
import { useState } from '#app'
import { useAuth } from '../../composables/useAuth'
import {
  calcularKpis,
  filtrarManuais,
  formatarData,
  formatarMesAno,
  gerarCodigo,
  hojeIso,
  prefillClone,
  motivoBloqueioExclusao,
  MESES,
  STATUS_MANUAL,
  type FiltrosManuais,
  type ItemManual,
  type ManuaisModelo,
  type StatusManual,
  type LinhaManual
} from './validadores'

export * from './validadores'

export interface EntradaManual {
  titulo: string
  descricao: string
  mes: string
  ano: number
  status: StatusManual
  destaqueMes: boolean
  destaqueSemana: boolean
}

export type DadosManual = Partial<EntradaManual>

const agoraIso = (): string => new Date().toISOString()

const novoId = (): string => {
  const cripto = globalThis.crypto as Crypto | undefined
  if (cripto && typeof cripto.randomUUID === 'function') return cripto.randomUUID()
  return `man-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const seedManuais: ManuaisModelo[] = [
  {
    id: 'man-2026-10',
    codigo: 'MAN-10/2026',
    titulo: 'Manual de Integrações — Outubro',
    descricao:
      'APIs, webhooks e conectores do mês, com o passo a passo de configuração e os pré-requisitos de rede.',
    ano: 2026,
    mes: 'Outubro',
    mesNumero: 10,
    status: 'Aprovado',
    destaqueMes: true,
    destaqueSemana: false,
    totalVisualizacoes: 1280,
    autorNome: 'Marina Lopes',
    revisorNome: 'Rafael Souza',
    arquivada: false,
    dataCriacao: '2026-10-01',
    dataPublicacao: '',
    criadoEm: '2026-10-01T09:00:00.000Z',
    atualizadoEm: '2026-10-18T14:20:00.000Z'
  },
  {
    id: 'man-2026-09',
    codigo: 'MAN-09/2026',
    titulo: 'Manual de Operação — Setembro',
    descricao:
      'Rotinas diárias do administrador, fechamento mensal e conferência dos indicadores operacionais.',
    ano: 2026,
    mes: 'Setembro',
    mesNumero: 9,
    status: 'Publicado',
    destaqueMes: false,
    destaqueSemana: true,
    totalVisualizacoes: 2140,
    autorNome: 'Diego Martins',
    revisorNome: 'Marina Lopes',
    arquivada: false,
    dataCriacao: '2026-09-01',
    dataPublicacao: '2026-09-28',
    criadoEm: '2026-09-01T08:30:00.000Z',
    atualizadoEm: '2026-09-28T16:10:00.000Z'
  },
  {
    id: 'man-2026-08',
    codigo: 'MAN-08/2026',
    titulo: 'Manual de Instalação — Agosto',
    descricao:
      'Implantação do ambiente, requisitos de servidor e checklist de instalação assistida.',
    ano: 2026,
    mes: 'Agosto',
    mesNumero: 8,
    status: 'Em Revisão',
    destaqueMes: false,
    destaqueSemana: false,
    totalVisualizacoes: 980,
    autorNome: 'Camila Rocha',
    revisorNome: 'Rafael Souza',
    arquivada: false,
    dataCriacao: '2026-08-03',
    dataPublicacao: '',
    criadoEm: '2026-08-03T10:15:00.000Z',
    atualizadoEm: '2026-10-16T11:40:00.000Z'
  },
  {
    id: 'man-2026-07',
    codigo: 'MAN-07/2026',
    titulo: 'Manual de Configuração — Julho',
    descricao:
      'Parâmetros globais, preferências de e-mail e ajustes de segurança do ambiente.',
    ano: 2026,
    mes: 'Julho',
    mesNumero: 7,
    status: 'Alterações Solicitadas',
    destaqueMes: false,
    destaqueSemana: false,
    totalVisualizacoes: 760,
    autorNome: 'Diego Martins',
    revisorNome: 'Camila Rocha',
    arquivada: false,
    dataCriacao: '2026-07-01',
    dataPublicacao: '',
    criadoEm: '2026-07-01T09:05:00.000Z',
    atualizadoEm: '2026-10-14T15:25:00.000Z'
  },
  {
    id: 'man-2026-06',
    codigo: 'MAN-06/2026',
    titulo: 'Manual de Migração — Junho',
    descricao:
      'Atualização entre versões, compatibilidade e reversão segura do ambiente.',
    ano: 2026,
    mes: 'Junho',
    mesNumero: 6,
    status: 'Rascunho',
    destaqueMes: false,
    destaqueSemana: false,
    totalVisualizacoes: 0,
    autorNome: 'Marina Lopes',
    revisorNome: '',
    arquivada: false,
    dataCriacao: '2026-06-02',
    dataPublicacao: '',
    criadoEm: '2026-06-02T13:00:00.000Z',
    atualizadoEm: '2026-06-02T13:00:00.000Z'
  },
  {
    id: 'man-2026-05',
    codigo: 'MAN-05/2026',
    titulo: 'Manual de Auditoria — Maio',
    descricao: 'Catálogo arquivado — não aparece na listagem nem nos KPIs.',
    ano: 2026,
    mes: 'Maio',
    mesNumero: 5,
    status: 'Publicado',
    destaqueMes: false,
    destaqueSemana: false,
    totalVisualizacoes: 540,
    autorNome: 'Rafael Souza',
    revisorNome: 'Marina Lopes',
    arquivada: true,
    dataCriacao: '2026-05-04',
    dataPublicacao: '2026-05-25',
    criadoEm: '2026-05-04T08:00:00.000Z',
    atualizadoEm: '2026-05-25T17:00:00.000Z'
  }
]

const seedItens: ItemManual[] = [
  {
    id: 'item-man-10-1',
    manualId: 'man-2026-10',
    chamada: '0000578990',
    titulo: 'Configuração do webhook de faturamento',
    software: 'Teorema ERP',
    modulo: 'Integrações',
    tipo: 'Melhoria',
    impacto: 'Médio',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2026-10-12'
  },
  {
    id: 'item-man-10-2',
    manualId: 'man-2026-10',
    chamada: '0000579012',
    titulo: 'Novo conector bancário',
    software: 'Teorema ERP',
    modulo: 'Financeiro',
    tipo: 'Nova Funcionalidade',
    impacto: 'Alto',
    situacao: 'Homologação',
    status: 'Aprovado',
    dataLiberacao: '2026-10-19'
  },
  {
    id: 'item-man-09-1',
    manualId: 'man-2026-09',
    chamada: '0000578450',
    titulo: 'Rotina de fechamento mensal',
    software: 'Teorema ERP',
    modulo: 'Financeiro',
    tipo: 'Melhoria',
    impacto: 'Médio',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2026-09-14'
  },
  {
    id: 'item-man-08-1',
    manualId: 'man-2026-08',
    chamada: '0000578210',
    titulo: 'Instalação do serviço de backup',
    software: 'Teorema Backup',
    modulo: 'Infraestrutura',
    tipo: 'Correção',
    impacto: 'Alto',
    situacao: 'Homologação',
    status: 'Revisar',
    dataLiberacao: '2026-08-17'
  },
  {
    id: 'item-man-07-1',
    manualId: 'man-2026-07',
    chamada: '0000577800',
    titulo: 'Parâmetros de SMTP',
    software: 'Teorema ERP',
    modulo: 'Configurações',
    tipo: 'Correção',
    impacto: 'Baixo',
    situacao: 'Desenvolvimento',
    status: 'Revisar',
    dataLiberacao: '2026-07-20'
  }
]

const seedItensPorManual = (): Record<string, ItemManual[]> => {
  const mapa: Record<string, ItemManual[]> = {}
  for (const manual of seedManuais) mapa[manual.id] = []
  for (const item of seedItens) {
    mapa[item.manualId] = [...(mapa[item.manualId] ?? []), item]
  }
  return mapa
}

export const useManuaisModelo = () => {
  const manuais = useState<ManuaisModelo[]>('manuais-base', () =>
    seedManuais.map((manual) => ({ ...manual }))
  )
  const itensPorManual = useState<Record<string, ItemManual[]>>('manuais-itens', () =>
    seedItensPorManual()
  )
  const itensCarregando = useState<Record<string, boolean>>(
    'manuais-itens-carregando',
    () => ({})
  )
  const itensErro = useState<Record<string, string | null>>('manuais-itens-erro', () => ({}))
  const filtros = useState<FiltrosManuais>('manuais-filtros', () => ({
    status: '',
    ano: '',
    mes: '',
    autor: '',
    destaque: ''
  }))
  const carregado = useState<boolean>('manuais-carregado', () => false)

  const { usuario } = useAuth()

  // O dataset já nasce carregado; a função existe para a página manter o mesmo
  // contrato de montagem dos módulos que leem da API.
  const carregarManuais = async (): Promise<boolean> => {
    carregado.value = true
    return true
  }

  const itensDoManual = (manualId: string): ItemManual[] =>
    itensPorManual.value[manualId] ?? []

  const carregarItens = async (manualId: string): Promise<ItemManual[]> => {
    const atual = itensPorManual.value[manualId]
    if (atual) return atual
    if (itensCarregando.value[manualId]) return []
    itensCarregando.value = { ...itensCarregando.value, [manualId]: true }
    itensErro.value = { ...itensErro.value, [manualId]: null }
    await Promise.resolve()
    itensPorManual.value = { ...itensPorManual.value, [manualId]: [] }
    itensCarregando.value = { ...itensCarregando.value, [manualId]: false }
    return []
  }

  const manuaisFiltrados = computed(() => filtrarManuais(manuais.value, filtros.value))

  const linhas = computed<LinhaManual[]>(() =>
    manuaisFiltrados.value.map((manual) => ({
      id: manual.id,
      codigo: manual.codigo,
      titulo: manual.titulo,
      mesAno: formatarMesAno(manual),
      status: manual.status,
      autor: manual.autorNome || '—',
      dataPublicacao: formatarData(manual.dataPublicacao),
      destaqueMes: manual.destaqueMes,
      destaqueSemana: manual.destaqueSemana,
      itensCount: itensDoManual(manual.id).length
    }))
  )

  const kpis = computed(() => calcularKpis(manuaisFiltrados.value))

  const filtrosAtivosCount = computed(
    () =>
      [filtros.value.status, filtros.value.ano, filtros.value.mes, filtros.value.autor, filtros.value.destaque].filter(
        Boolean
      ).length
  )

  const opcoes = computed(() => {
    const ativos = manuais.value.filter((manual) => !manual.arquivada)
    return {
      status: [...STATUS_MANUAL],
      anos: [...new Set(ativos.map((manual) => String(manual.ano)))].sort((a, b) =>
        b.localeCompare(a)
      ),
      meses: [...MESES],
      autores: [...new Set(ativos.map((manual) => manual.autorNome).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
      destaques: [
        { value: '', label: 'Todos' },
        { value: 'mes', label: 'Destaque do mês' },
        { value: 'semana', label: 'Destaque da semana' }
      ]
    }
  })

  const limparFiltros = () => {
    filtros.value = { status: '', ano: '', mes: '', autor: '', destaque: '' }
  }

  // -------------------------------------------------------------------------
  // Escritas — apenas no dataset em memória (fase frontend).
  // -------------------------------------------------------------------------

  const adicionar = (dados: EntradaManual): ManuaisModelo => {
    const mesNumero = MESES.indexOf(dados.mes as (typeof MESES)[number]) + 1
    const agora = agoraIso()
    const manual: ManuaisModelo = {
      id: novoId(),
      codigo: gerarCodigo(mesNumero, dados.ano),
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
      ano: dados.ano,
      mes: dados.mes,
      mesNumero,
      status: dados.status,
      destaqueMes: dados.destaqueMes,
      destaqueSemana: dados.destaqueSemana,
      totalVisualizacoes: 0,
      autorNome: usuario.value?.nome?.trim() || 'Administrador',
      revisorNome: '',
      arquivada: false,
      dataCriacao: hojeIso(),
      dataPublicacao: '',
      criadoEm: agora,
      atualizadoEm: agora
    }
    manuais.value = [manual, ...manuais.value]
    itensPorManual.value = { ...itensPorManual.value, [manual.id]: [] }
    carregado.value = true
    return manual
  }

  const atualizar = (id: string, dados: DadosManual): ManuaisModelo | null => {
    const atual = manuais.value.find((manual) => manual.id === id)
    if (!atual) return null
    const mes = dados.mes ?? atual.mes
    const ano = dados.ano ?? atual.ano
    const indiceMes = MESES.indexOf(mes as (typeof MESES)[number])
    const mesNumero = indiceMes >= 0 ? indiceMes + 1 : atual.mesNumero
    const atualizado: ManuaisModelo = {
      ...atual,
      ...dados,
      titulo: (dados.titulo ?? atual.titulo).trim(),
      descricao: (dados.descricao ?? atual.descricao).trim(),
      mes,
      ano,
      mesNumero,
      codigo: gerarCodigo(mesNumero, ano),
      atualizadoEm: agoraIso()
    }
    manuais.value = manuais.value.map((manual) => (manual.id === id ? atualizado : manual))
    return atualizado
  }

  const publicar = (id: string): boolean => {
    const atual = manuais.value.find((manual) => manual.id === id)
    if (!atual) return false
    manuais.value = manuais.value.map((manual) =>
      manual.id === id
        ? {
            ...manual,
            status: 'Publicado',
            dataPublicacao: hojeIso(),
            atualizadoEm: agoraIso()
          }
        : manual
    )
    return true
  }

  const arquivar = (id: string): boolean => {
    const atual = manuais.value.find((manual) => manual.id === id)
    if (!atual) return false
    manuais.value = manuais.value.map((manual) =>
      manual.id === id
        ? { ...manual, arquivada: true, atualizadoEm: agoraIso() }
        : manual
    )
    return true
  }

  const excluir = (id: string): { ok: boolean; motivo?: string } => {
    const manual = manuais.value.find((item) => item.id === id)
    if (!manual) return { ok: false, motivo: 'Catálogo não encontrado.' }
    const motivo = motivoBloqueioExclusao(manual, itensDoManual(id))
    if (motivo) return { ok: false, motivo }
    manuais.value = manuais.value.filter((item) => item.id !== id)
    const { [id]: _removido, ...resto } = itensPorManual.value
    itensPorManual.value = resto
    return { ok: true }
  }

  const clonarPreenchimento = (origem: ManuaisModelo) => prefillClone(origem)

  return {
    manuais,
    carregado,
    carregarManuais,
    itensPorManual,
    itensDoManual,
    carregarItens,
    itensCarregando,
    itensErro,
    filtros,
    manuaisFiltrados,
    linhas,
    kpis,
    filtrosAtivosCount,
    opcoes,
    limparFiltros,
    clonarPreenchimento,
    adicionar,
    atualizar,
    publicar,
    arquivar,
    excluir
  }
}
