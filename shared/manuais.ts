// Regras puras do catálogo mensal de Manuais — compartilhadas entre app, server
// e testes (`#shared/manuais`). Sem imports de Nuxt/Vue.

export type StatusManual =
  | 'Rascunho'
  | 'Em Revisão'
  | 'Alterações Solicitadas'
  | 'Aprovado'
  | 'Publicado'

export type TipoItem = 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
export type ImpactoItem = 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
export type SituacaoItem = 'Desenvolvimento' | 'Homologação' | 'Implantado'
export type StatusItem = 'Revisar' | 'Aprovado' | 'Publicar'
export type DestaqueFiltro = '' | 'mes' | 'semana'

export const STATUS_MANUAL: StatusManual[] = [
  'Rascunho',
  'Em Revisão',
  'Alterações Solicitadas',
  'Aprovado',
  'Publicado'
]

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
] as const

export interface ManuaisModelo {
  id: string
  codigo: string
  titulo: string
  descricao: string
  ano: number
  mes: string
  mesNumero: number
  status: StatusManual
  destaqueMes: boolean
  destaqueSemana: boolean
  totalVisualizacoes: number
  autorNome: string
  revisorNome: string
  arquivada: boolean
  dataCriacao: string
  dataPublicacao: string
  criadoEm: string
  atualizadoEm: string
  /** Contagem de itens vinculados (entregas_itens) — derivada pelo servidor. */
  itensCount?: number
}

export interface ItemManual {
  id: string
  manualId: string
  chamada: string
  titulo: string
  software: string
  modulo: string
  tipo: TipoItem
  impacto: ImpactoItem
  situacao: SituacaoItem
  status: StatusItem
  dataLiberacao: string
}

export interface FiltrosManuais {
  status: string
  ano: string
  mes: string
  autor: string
  destaque: DestaqueFiltro
}

export interface KpisManuais {
  rascunho: number
  emRevisao: number
  alteracoes: number
  aprovados: number
  publicados: number
}

export type CampoManual = 'titulo' | 'mes' | 'ano'

export interface ResultadoValidacao {
  valido: boolean
  erros: Partial<Record<CampoManual, string>>
  primeiroErro: CampoManual | null
}

export interface LinhaManual {
  id: string
  codigo: string
  titulo: string
  mesAno: string
  status: StatusManual
  autor: string
  dataPublicacao: string
  destaqueMes: boolean
  destaqueSemana: boolean
  itensCount: number
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Formata `yyyy-mm-dd` (ou ISO) em `dd/mm/aaaa`, sem deslocamento de fuso. */
export function formatarData(valor: string): string {
  if (!valor) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR')
}

/** Mês por extenso a partir do numeral (1–12); `null` fora do intervalo. */
export function mesPorNumero(numero: number): string | null {
  if (!Number.isInteger(numero) || numero < 1 || numero > 12) return null
  return MESES[numero - 1] ?? null
}

/** Código canônico do catálogo mensal: `MAN-<mês>/<ano>` (ex.: `MAN-10/2026`). */
export function gerarCodigo(mesNumero: number, ano: number): string {
  return `MAN-${String(mesNumero).padStart(2, '0')}/${ano}`
}

export function formatarMesAno(manual: Pick<ManuaisModelo, 'mes' | 'ano'>): string {
  return `${manual.mes}/${manual.ano}`
}

/** Valida os campos obrigatórios e a unicidade `(ano, mês)` no conjunto existente. */
export function validarManual(
  dados: { titulo?: unknown; mes?: unknown; ano?: unknown },
  existentes: ManuaisModelo[] = [],
  idAtual?: string
): ResultadoValidacao {
  const erros: Partial<Record<CampoManual, string>> = {}

  if (typeof dados.titulo !== 'string' || !dados.titulo.trim()) {
    erros.titulo = 'Informe o título do catálogo mensal.'
  } else if (dados.titulo.trim().length > 255) {
    erros.titulo = 'O título deve ter no máximo 255 caracteres.'
  }

  if (typeof dados.mes !== 'string' || !MESES.includes(dados.mes as (typeof MESES)[number])) {
    erros.mes = 'Selecione o mês.'
  }

  const ano = Number(dados.ano)
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
    erros.ano = 'Informe um ano válido.'
  }

  if (!erros.mes && !erros.ano) {
    const mes = dados.mes as string
    const duplicado = existentes.some(
      (manual) => manual.id !== idAtual && manual.ano === ano && manual.mes === mes
    )
    if (duplicado) {
      erros.mes = 'Já existe um catálogo para este mês/ano.'
    }
  }

  const ordem: CampoManual[] = ['titulo', 'mes', 'ano']
  const primeiroErro = ordem.find((campo) => erros[campo]) ?? null

  return { valido: primeiroErro === null, erros, primeiroErro }
}

/** Campos copiados na clonagem; identidade, datas e status nascem vazios. */
export function prefillClone(origem: ManuaisModelo): {
  titulo: string
  descricao: string
  destaqueMes: boolean
  destaqueSemana: boolean
} {
  return {
    titulo: origem.titulo,
    descricao: origem.descricao,
    destaqueMes: origem.destaqueMes,
    destaqueSemana: origem.destaqueSemana
  }
}

/** Motivo pelo qual a exclusão está bloqueada (null quando permitida). */
export function motivoBloqueioExclusao(
  manual: ManuaisModelo,
  itens: ItemManual[],
  anexosCount = 0
): string | null {
  if (manual.arquivada) return 'Catálogo arquivado não pode ser excluído.'
  if (itens.some((item) => item.manualId === manual.id)) {
    return 'Catálogo com itens vinculados não pode ser excluído.'
  }
  if (anexosCount > 0) {
    return 'Catálogo com anexos vinculados não pode ser excluído.'
  }
  return null
}

/** Exclusão permitida apenas para catálogo não arquivado e sem itens/anexos. */
export function podeExcluirManual(
  manual: ManuaisModelo,
  itens: ItemManual[],
  anexosCount = 0
): boolean {
  return motivoBloqueioExclusao(manual, itens, anexosCount) === null
}

/** Filtra o conjunto vigente: arquivados nunca aparecem; filtros vazios = todos. */
export function filtrarManuais(
  manuais: ManuaisModelo[],
  filtros: FiltrosManuais
): ManuaisModelo[] {
  return manuais
    .filter((manual) => !manual.arquivada)
    .filter((manual) => !filtros.status || manual.status === filtros.status)
    .filter((manual) => !filtros.ano || String(manual.ano) === filtros.ano)
    .filter((manual) => !filtros.mes || manual.mes === filtros.mes)
    .filter((manual) => !filtros.autor || manual.autorNome === filtros.autor)
    .filter((manual) => {
      if (filtros.destaque === 'mes') return manual.destaqueMes
      if (filtros.destaque === 'semana') return manual.destaqueSemana
      return true
    })
    .sort((a, b) => b.ano - a.ano || b.mesNumero - a.mesNumero)
}

/** KPIs (Rascunho, Em Revisão, Alterações, Aprovado, Publicado) do conjunto recebido. */
export function calcularKpis(manuais: ManuaisModelo[]): KpisManuais {
  return {
    rascunho: manuais.filter((m) => m.status === 'Rascunho').length,
    emRevisao: manuais.filter((m) => m.status === 'Em Revisão').length,
    alteracoes: manuais.filter((m) => m.status === 'Alterações Solicitadas').length,
    aprovados: manuais.filter((m) => m.status === 'Aprovado').length,
    publicados: manuais.filter((m) => m.status === 'Publicado').length
  }
}

/** Data local de hoje em `AAAA-MM-DD` (usada ao publicar no dataset em memória). */
export function hojeIso(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Data efetiva ao publicar: preserva a data histórica; se vazia, usa hoje. */
export function dataPublicacaoAoPublicar(dataAtual: string): string {
  return dataAtual || hojeIso()
}

/** `true` quando a string é uma data civil `AAAA-MM-DD` válida. */
export function ehDataIso(valor: string): boolean {
  if (!ISO_DATE.test(valor)) return false
  const [ano = 0, mes = 0, dia = 0] = valor.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  )
}
