// Regras puras do módulo Release Week — compartilhadas entre app, server e
// testes (`#shared/release-week`). Sem imports de Nuxt/Vue.

import { dataPublicacaoValida } from './feriados'

export { dataPublicacaoValida } from './feriados'

export type StatusRelease = 'Aberta' | 'Em Revisão' | 'Aprovado' | 'Publicado'
export type TipoItem = 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
export type ImpactoItem = 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
export type StatusItem = 'Revisar' | 'Aprovado' | 'Publicar'

export const STATUS_RELEASE: StatusRelease[] = ['Aberta', 'Em Revisão', 'Aprovado', 'Publicado']

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

export interface ReleaseWeekModelo {
  id: string
  codigo: string
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
  arquivada: boolean
  autorNome: string
  revisorNome: string
  criadoEm: string
  atualizadoEm: string
  /** Contagem de itens vinculados (entregas_itens) — derivada pelo servidor. */
  itensCount?: number
}

export interface ItemRelease {
  id: string
  releaseId: string
  chamada: string
  titulo: string
  software: string
  modulo: string
  tipo: TipoItem
  impacto: ImpactoItem
  status: StatusItem
  dataLiberacao: string
}

export interface FiltrosReleaseWeek {
  status: string
  ano: string
  mes: string
  autor: string
}

export interface KpisReleaseWeek {
  abertas: number
  emRevisao: number
  aprovadas: number
  publicadas: number
}

export type CampoReleaseWeek =
  | 'nome'
  | 'semana'
  | 'ano'
  | 'mes'
  | 'dataInicio'
  | 'dataFinaliza'
  | 'dataPublicacao'

export interface ResultadoValidacao {
  valido: boolean
  erros: Partial<Record<CampoReleaseWeek, string>>
  primeiroErro: CampoReleaseWeek | null
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

/** Período legível do ciclo: `dd/mm/aaaa a dd/mm/aaaa`. */
export function formatarPeriodo(inicio: string, fim: string): string {
  return `${formatarData(inicio)} a ${formatarData(fim)}`
}

/** Código canônico da semana: `RW-<semana>/<ano>` (ex.: `RW-40/2026`). */
export function gerarCodigo(semana: number, ano: number): string {
  return `RW-${String(semana).padStart(2, '0')}/${ano}`
}

/**
 * `true` quando `AAAA-MM-DD` cai em uma segunda-feira. A comparação é feita em
 * UTC porque a data é civil (sem hora/fuso).
 */
export function ehSegundaFeira(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false
  const [ano = 0, mes = 0, dia = 0] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  return data.getUTCDay() === 1
}

/** Valida os campos obrigatórios do cabeçalho da semana. */
export function validarReleaseWeek(dados: {
  nome?: unknown
  semana?: unknown
  ano?: unknown
  mes?: unknown
  dataInicio?: unknown
  dataFinaliza?: unknown
  dataPublicacao?: unknown
}): ResultadoValidacao {
  const erros: Partial<Record<CampoReleaseWeek, string>> = {}

  if (typeof dados.nome !== 'string' || !dados.nome.trim()) {
    erros.nome = 'Informe o nome da Release Week.'
  } else if (dados.nome.trim().length > 255) {
    erros.nome = 'O nome deve ter no máximo 255 caracteres.'
  }

  const semana = Number(dados.semana)
  if (!Number.isInteger(semana) || semana < 1 || semana > 52) {
    erros.semana = 'A semana deve ser um número inteiro entre 1 e 52.'
  }

  const ano = Number(dados.ano)
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
    erros.ano = 'Informe um ano válido.'
  }

  if (typeof dados.mes !== 'string' || !MESES.includes(dados.mes as (typeof MESES)[number])) {
    erros.mes = 'Selecione o mês.'
  }

  const validarData = (campo: 'dataInicio' | 'dataFinaliza' | 'dataPublicacao', rotulo: string) => {
    const valor = dados[campo]
    if (typeof valor !== 'string' || !ISO_DATE.test(valor)) {
      erros[campo] = `Informe a ${rotulo}.`
    }
  }
  validarData('dataInicio', 'data de início')
  validarData('dataFinaliza', 'data de finalização')
  validarData('dataPublicacao', 'data de publicação')

  // Regra normativa: publicação em segunda-feira ou no próximo dia útil quando
  // a segunda-feira for feriado nacional.
  if (
    !erros.dataPublicacao &&
    typeof dados.dataPublicacao === 'string' &&
    !dataPublicacaoValida(dados.dataPublicacao)
  ) {
    erros.dataPublicacao =
      'A data de publicação deve ser uma segunda-feira ou o próximo dia útil quando a segunda-feira for feriado.'
  }

  const ordem: CampoReleaseWeek[] = [
    'nome',
    'semana',
    'ano',
    'mes',
    'dataInicio',
    'dataFinaliza',
    'dataPublicacao'
  ]
  const primeiroErro = ordem.find((campo) => erros[campo]) ?? null

  return { valido: primeiroErro === null, erros, primeiroErro }
}

/** Campos copiados na clonagem; todo o resto nasce vazio (status volta a `Aberta`). */
export function prefillClone(origem: ReleaseWeekModelo): {
  versao: string
  release: string
  destaqueSemana: boolean
} {
  return {
    versao: origem.versao,
    release: origem.release,
    destaqueSemana: origem.destaqueSemana
  }
}

/** Motivo pelo qual a exclusão está bloqueada (null quando permitida). */
export function motivoBloqueioExclusao(
  semana: ReleaseWeekModelo,
  itens: ItemRelease[]
): string | null {
  if (semana.arquivada) return 'Release arquivada não pode ser excluída.'
  if (itens.some((item) => item.releaseId === semana.id)) {
    return 'Release com itens vinculados não pode ser excluída.'
  }
  return null
}

/** Exclusão permitida apenas para release não arquivada e sem itens/relacionamentos. */
export function podeExcluirRelease(semana: ReleaseWeekModelo, itens: ItemRelease[]): boolean {
  return motivoBloqueioExclusao(semana, itens) === null
}

/** Filtra o conjunto vigente: arquivadas nunca aparecem; filtros vazios = todos. */
export function filtrarSemanas(
  semanas: ReleaseWeekModelo[],
  filtros: FiltrosReleaseWeek
): ReleaseWeekModelo[] {
  return semanas
    .filter((semana) => !semana.arquivada)
    .filter((semana) => !filtros.status || semana.status === filtros.status)
    .filter((semana) => !filtros.ano || String(semana.ano) === filtros.ano)
    .filter((semana) => !filtros.mes || semana.mes === filtros.mes)
    .filter((semana) => !filtros.autor || semana.autorNome === filtros.autor)
    .sort((a, b) => b.ano - a.ano || b.semana - a.semana)
}

/** KPIs (Abertas, Em Revisão, Aprovadas, Publicadas) do conjunto recebido. */
export function calcularKpis(semanas: ReleaseWeekModelo[]): KpisReleaseWeek {
  return {
    abertas: semanas.filter((s) => s.status === 'Aberta').length,
    emRevisao: semanas.filter((s) => s.status === 'Em Revisão').length,
    aprovadas: semanas.filter((s) => s.status === 'Aprovado').length,
    publicadas: semanas.filter((s) => s.status === 'Publicado').length
  }
}
