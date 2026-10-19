// Estado da página de Release Week (fase frontend) sobre um DATASET EM MEMÓRIA.
// Não há backend/seed nesta fase: `useState` guarda semanas e itens de exemplo,
// as ações mutam somente esse conjunto e recarregar a página restaura o inicial.
// Na fase backend, este modelo passa a consumir `GET /api/release-week` e a
// coluna `arquivada` (prevista aqui como booleano) entra no banco.
import { computed } from 'vue'
import { useState } from '#app'
import { useAuth } from '../../composables/useAuth'
import {
  MESES,
  STATUS_RELEASE,
  calcularKpis,
  filtrarSemanas,
  formatarData,
  formatarPeriodo,
  gerarCodigo,
  motivoBloqueioExclusao,
  podeExcluirRelease,
  prefillClone,
  type FiltrosReleaseWeek,
  type ItemRelease,
  type ReleaseWeekModelo,
  type StatusRelease
} from './validadores'

export * from './validadores'

export interface EntradaReleaseWeek {
  nome: string
  versao: string
  release: string
  semana: number
  ano: number
  mes: string
  dataInicio: string
  dataFinaliza: string
  dataPublicacao: string
  status: StatusRelease
  descricao: string
  destaqueSemana: boolean
}

export type DadosReleaseWeek = Partial<EntradaReleaseWeek> & { arquivada?: boolean }

/** Linha derivada da tabela: datas/identificadores já formatados. */
export interface LinhaReleaseWeek {
  id: string
  codigo: string
  nome: string
  semanaAno: string
  periodo: string
  status: StatusRelease
  autor: string
  dataPublicacao: string
  itensCount: number
}

const DATA_CRIACAO = '2026-10-01T12:00:00.000Z'

const criarSemanasIniciais = (): ReleaseWeekModelo[] => [
  {
    id: 'rw-2026-43',
    codigo: 'RW-43/2026',
    nome: 'Release Week 43 — Outubro',
    versao: '26.10c',
    release: '26.10c10.12a',
    semana: 43,
    ano: 2026,
    mes: 'Outubro',
    dataInicio: '2026-10-19',
    dataFinaliza: '2026-10-23',
    dataPublicacao: '2026-10-26',
    status: 'Aberta',
    descricao: 'Ciclo semanal em preparação.',
    destaqueSemana: true,
    arquivada: false,
    autorNome: 'Ana Carolina Ribeiro',
    revisorNome: 'Carlos Mendes',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  },
  {
    id: 'rw-2026-42',
    codigo: 'RW-42/2026',
    nome: 'Release Week 42 — Outubro',
    versao: '26.10b',
    release: '26.10b10.05a',
    semana: 42,
    ano: 2026,
    mes: 'Outubro',
    dataInicio: '2026-10-12',
    dataFinaliza: '2026-10-16',
    dataPublicacao: '2026-10-19',
    status: 'Em Revisão',
    descricao: 'Ajustes de exibição e correções pontuais.',
    destaqueSemana: false,
    arquivada: false,
    autorNome: 'Rafael Souza',
    revisorNome: 'Mariana Lopes',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  },
  {
    id: 'rw-2026-41',
    codigo: 'RW-41/2026',
    nome: 'Release Week 41 — Outubro',
    versao: '26.10a',
    release: '26.10a09.28a',
    semana: 41,
    ano: 2026,
    mes: 'Outubro',
    dataInicio: '2026-10-05',
    dataFinaliza: '2026-10-09',
    dataPublicacao: '2026-10-12',
    status: 'Aprovado',
    descricao: 'Melhorias de busca e filtros.',
    destaqueSemana: false,
    arquivada: false,
    autorNome: 'Carlos Mendes',
    revisorNome: 'Ana Carolina Ribeiro',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  },
  {
    id: 'rw-2026-40',
    codigo: 'RW-40/2026',
    nome: 'Release Week 40 — Setembro',
    versao: '26.09c',
    release: '26.09c09.21a',
    semana: 40,
    ano: 2026,
    mes: 'Setembro',
    dataInicio: '2026-09-28',
    dataFinaliza: '2026-10-02',
    dataPublicacao: '2026-10-05',
    status: 'Publicado',
    descricao: 'Correções de exibição e melhorias no portal.',
    destaqueSemana: false,
    arquivada: false,
    autorNome: 'Ana Carolina Ribeiro',
    revisorNome: 'Rafael Souza',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  },
  {
    id: 'rw-2026-39',
    codigo: 'RW-39/2026',
    nome: 'Release Week 39 — Setembro',
    versao: '26.09b',
    release: '26.09b09.14a',
    semana: 39,
    ano: 2026,
    mes: 'Setembro',
    dataInicio: '2026-09-21',
    dataFinaliza: '2026-09-25',
    dataPublicacao: '2026-09-28',
    status: 'Publicado',
    descricao: 'Primeira release do trimestre.',
    destaqueSemana: false,
    arquivada: false,
    autorNome: 'Mariana Lopes',
    revisorNome: 'Carlos Mendes',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  },
  {
    id: 'rw-2026-44',
    codigo: 'RW-44/2026',
    nome: 'Release Week 44 — Outubro/Novembro',
    versao: '26.10d',
    release: '26.10d10.19a',
    semana: 44,
    ano: 2026,
    mes: 'Outubro',
    dataInicio: '2026-10-26',
    dataFinaliza: '2026-10-30',
    dataPublicacao: '2026-11-02',
    status: 'Aberta',
    descricao: 'Planejamento inicial do ciclo.',
    destaqueSemana: false,
    arquivada: false,
    autorNome: 'Rafael Souza',
    revisorNome: '',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  },
  {
    id: 'rw-2026-45',
    codigo: 'RW-45/2026',
    nome: 'Release Week 45 — Novembro',
    versao: '26.11a',
    release: '26.11a10.26a',
    semana: 45,
    ano: 2026,
    mes: 'Novembro',
    dataInicio: '2026-11-02',
    dataFinaliza: '2026-11-06',
    dataPublicacao: '2026-11-09',
    status: 'Aprovado',
    descricao: 'Conteúdo homologado aguardando publicação.',
    destaqueSemana: false,
    arquivada: false,
    autorNome: 'Ana Carolina Ribeiro',
    revisorNome: 'Mariana Lopes',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  },
  {
    id: 'rw-2026-38',
    codigo: 'RW-38/2026',
    nome: 'Release Week 38 — Setembro',
    versao: '26.09a',
    release: '26.09a09.07a',
    semana: 38,
    ano: 2026,
    mes: 'Setembro',
    dataInicio: '2026-09-14',
    dataFinaliza: '2026-09-18',
    dataPublicacao: '2026-09-21',
    status: 'Publicado',
    descricao: 'Ciclo encerrado e arquivado.',
    destaqueSemana: false,
    arquivada: true,
    autorNome: 'Carlos Mendes',
    revisorNome: 'Ana Carolina Ribeiro',
    criadoEm: DATA_CRIACAO,
    atualizadoEm: DATA_CRIACAO
  }
]

const criarItensIniciais = (): ItemRelease[] => [
  {
    id: 'item-39-1',
    releaseId: 'rw-2026-39',
    chamada: '0000578990',
    titulo: 'Ajuste na exibição da listagem de publicações',
    software: 'Portal de Publicações',
    modulo: 'Publicações',
    tipo: 'Correção',
    impacto: 'Médio',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2026-09-21'
  },
  {
    id: 'item-39-2',
    releaseId: 'rw-2026-39',
    chamada: '0000579012',
    titulo: 'Melhoria no filtro por status',
    software: 'Painel Administrativo',
    modulo: 'Administração',
    tipo: 'Melhoria',
    impacto: 'Baixo',
    situacao: 'Implantado',
    status: 'Aprovado',
    dataLiberacao: '2026-09-21'
  },
  {
    id: 'item-40-1',
    releaseId: 'rw-2026-40',
    chamada: '0000579101',
    titulo: 'Correção do layout responsivo do header',
    software: 'Portal de Publicações',
    modulo: 'Layout',
    tipo: 'Correção',
    impacto: 'Alto',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2026-09-28'
  },
  {
    id: 'item-40-2',
    releaseId: 'rw-2026-40',
    chamada: '0000579102',
    titulo: 'Nova funcionalidade de busca global',
    software: 'Portal de Publicações',
    modulo: 'Busca',
    tipo: 'Nova Funcionalidade',
    impacto: 'Médio',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2026-09-28'
  },
  {
    id: 'item-40-3',
    releaseId: 'rw-2026-40',
    chamada: '0000579103',
    titulo: 'Ajuste no cálculo de indicadores',
    software: 'Painel Administrativo',
    modulo: 'Indicadores',
    tipo: 'Correção',
    impacto: 'Crítico',
    situacao: 'Implantado',
    status: 'Aprovado',
    dataLiberacao: '2026-09-28'
  },
  {
    id: 'item-41-1',
    releaseId: 'rw-2026-41',
    chamada: '0000579201',
    titulo: 'Filtros combinados na gestão de usuários',
    software: 'Painel Administrativo',
    modulo: 'Gestão de Usuários',
    tipo: 'Melhoria',
    impacto: 'Médio',
    situacao: 'Homologação',
    status: 'Aprovado',
    dataLiberacao: '2026-10-05'
  },
  {
    id: 'item-41-2',
    releaseId: 'rw-2026-41',
    chamada: '0000579202',
    titulo: 'Exportação CSV da trilha de auditoria',
    software: 'Painel Administrativo',
    modulo: 'Auditoria',
    tipo: 'Nova Funcionalidade',
    impacto: 'Baixo',
    situacao: 'Homologação',
    status: 'Revisar',
    dataLiberacao: '2026-10-05'
  },
  {
    id: 'item-42-1',
    releaseId: 'rw-2026-42',
    chamada: '0000579301',
    titulo: 'Correção no comportamento do calendário',
    software: 'Portal de Publicações',
    modulo: 'Calendário',
    tipo: 'Correção',
    impacto: 'Médio',
    situacao: 'Desenvolvimento',
    status: 'Revisar',
    dataLiberacao: '2026-10-12'
  },
  {
    id: 'item-38-1',
    releaseId: 'rw-2026-38',
    chamada: '0000578801',
    titulo: 'Ciclo arquivado — item histórico',
    software: 'Portal de Publicações',
    modulo: 'Publicações',
    tipo: 'Correção',
    impacto: 'Baixo',
    situacao: 'Implantado',
    status: 'Publicar',
    dataLiberacao: '2026-09-14'
  }
]

const gerarId = (): string => {
  const cripto = globalThis.crypto
  if (cripto && typeof cripto.randomUUID === 'function') return cripto.randomUUID()
  return `rw-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useReleaseWeekModelo = () => {
  const { usuario } = useAuth()

  // Dataset em memória (rascunho da fase frontend).
  const semanas = useState<ReleaseWeekModelo[]>('release-week-base', criarSemanasIniciais)
  const itens = useState<ItemRelease[]>('release-week-itens', criarItensIniciais)
  const filtros = useState<FiltrosReleaseWeek>('release-week-filtros', () => ({
    status: '',
    ano: '',
    mes: '',
    autor: ''
  }))

  const itensDaRelease = (releaseId: string): ItemRelease[] =>
    itens.value.filter((item) => item.releaseId === releaseId)

  const semanasFiltradas = computed(() => filtrarSemanas(semanas.value, filtros.value))

  const linhas = computed<LinhaReleaseWeek[]>(() =>
    semanasFiltradas.value.map((semana) => ({
      id: semana.id,
      codigo: semana.codigo,
      nome: semana.nome,
      semanaAno: `${semana.semana}ª semana / ${semana.ano}`,
      periodo: formatarPeriodo(semana.dataInicio, semana.dataFinaliza),
      status: semana.status,
      autor: semana.autorNome || '—',
      dataPublicacao: formatarData(semana.dataPublicacao),
      itensCount: itensDaRelease(semana.id).length
    }))
  )

  const kpis = computed(() => calcularKpis(semanasFiltradas.value))

  const filtrosAtivosCount = computed(
    () =>
      [filtros.value.status, filtros.value.ano, filtros.value.mes, filtros.value.autor].filter(
        Boolean
      ).length
  )

  const opcoes = computed(() => {
    const ativas = semanas.value.filter((semana) => !semana.arquivada)
    return {
      status: [...STATUS_RELEASE],
      anos: [...new Set(ativas.map((semana) => String(semana.ano)))].sort((a, b) => b.localeCompare(a)),
      meses: [...MESES],
      autores: [...new Set(ativas.map((semana) => semana.autorNome).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      )
    }
  })

  const limparFiltros = () => {
    filtros.value = { status: '', ano: '', mes: '', autor: '' }
  }

  const adicionar = (dados: EntradaReleaseWeek): ReleaseWeekModelo => {
    const agora = new Date().toISOString()
    const nova: ReleaseWeekModelo = {
      ...dados,
      id: gerarId(),
      codigo: gerarCodigo(dados.semana, dados.ano),
      arquivada: false,
      autorNome: usuario.value?.nome ?? 'Ana Carolina Ribeiro',
      revisorNome: '',
      criadoEm: agora,
      atualizadoEm: agora
    }
    semanas.value = [...semanas.value, nova]
    return nova
  }

  const atualizar = (id: string, dados: DadosReleaseWeek): ReleaseWeekModelo | null => {
    const atual = semanas.value.find((semana) => semana.id === id)
    if (!atual) return null
    const atualizada: ReleaseWeekModelo = {
      ...atual,
      ...dados,
      atualizadoEm: new Date().toISOString()
    }
    semanas.value = semanas.value.map((semana) => (semana.id === id ? atualizada : semana))
    return atualizada
  }

  const publicar = (id: string): boolean => {
    const existe = semanas.value.some((semana) => semana.id === id)
    if (!existe) return false
    atualizar(id, { status: 'Publicado' })
    return true
  }

  const arquivar = (id: string): boolean => {
    const existe = semanas.value.some((semana) => semana.id === id)
    if (!existe) return false
    atualizar(id, { arquivada: true })
    return true
  }

  const excluir = (id: string): { ok: boolean; motivo?: string } => {
    const alvo = semanas.value.find((semana) => semana.id === id)
    if (!alvo) return { ok: false, motivo: 'Release Week não encontrada.' }
    const motivo = motivoBloqueioExclusao(alvo, itens.value)
    if (motivo) return { ok: false, motivo }
    semanas.value = semanas.value.filter((semana) => semana.id !== id)
    return { ok: true }
  }

  const clonarPreenchimento = (origem: ReleaseWeekModelo) => prefillClone(origem)

  return {
    semanas,
    itens,
    filtros,
    semanasFiltradas,
    linhas,
    kpis,
    filtrosAtivosCount,
    opcoes,
    limparFiltros,
    itensDaRelease,
    podeExcluirRelease: (semana: ReleaseWeekModelo) => podeExcluirRelease(semana, itens.value),
    motivoBloqueioExclusao: (semana: ReleaseWeekModelo) =>
      motivoBloqueioExclusao(semana, itens.value),
    clonarPreenchimento,
    adicionar,
    atualizar,
    publicar,
    arquivar,
    excluir
  }
}
