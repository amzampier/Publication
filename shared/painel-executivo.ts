import type { StatusChamada } from './lancar-chamadas'
import {
  itemNoCicloAtivo,
  itemPublicadoNoPortal,
  type ContextoVinculo
} from './esteira-revisao'

// Regras puras do Painel Executivo — compartilhadas entre servidor, app e testes
// (`#shared/painel-executivo`). Sem imports de Nuxt/Vue. As definições de
// métrica ficam em `docs/17 - Painel Executivo.md`.

export const MESES_PAINEL = [
  { numero: 1, curto: 'jan', longo: 'Janeiro' },
  { numero: 2, curto: 'fev', longo: 'Fevereiro' },
  { numero: 3, curto: 'mar', longo: 'Março' },
  { numero: 4, curto: 'abr', longo: 'Abril' },
  { numero: 5, curto: 'mai', longo: 'Maio' },
  { numero: 6, curto: 'jun', longo: 'Junho' },
  { numero: 7, curto: 'jul', longo: 'Julho' },
  { numero: 8, curto: 'ago', longo: 'Agosto' },
  { numero: 9, curto: 'set', longo: 'Setembro' },
  { numero: 10, curto: 'out', longo: 'Outubro' },
  { numero: 11, curto: 'nov', longo: 'Novembro' },
  { numero: 12, curto: 'dez', longo: 'Dezembro' }
] as const

export interface PeriodoPainel {
  ano: number
  inicio: string
  fim: string
  hoje: string
  rotulo: string
}

export interface KpisPainel {
  releasesPublicadas: number
  chamadasLancadas: number
  chamadasLiberadas: number
  percentualFluxo: number
  leadTimeMedioDias: number
  taxaRecusa: number
}

export interface ReleasesPorStatusPainel {
  aberta: number
  emRevisao: number
  aprovado: number
  publicado: number
}

export interface PontoSerieMensal {
  mes: number
  rotulo: string
  releases: ReleasesPorStatusPainel
  chamadasLancadas: number
  chamadasLiberadas: number
}

export interface PontoSerieAnual {
  ano: number
  publicadas: number
}

export interface PublicacaoPainel {
  id: string
  codigo: string
  nome: string
  dataPublicacao: string
  status: string
  arquivada: boolean
  chamadas: number
  revisar: number
  aprovado: number
  recusado: number
  publicar: number
  percentualFluxo: number
}

export interface RankingPainel {
  rotulo: string
  total: number
}

export interface FluxoPainel {
  total: number
  revisar: number
  aprovado: number
  recusado: number
  publicar: number
  aguardandoPai: number
  noPortal: number
  aging7: number
  aging15: number
  percentualFluxo: number
}

export interface PublicacoesPainel {
  releases: PublicacaoPainel[]
  manuais: PublicacaoPainel[]
  escopos: PublicacaoPainel[]
}

export interface PainelExecutivo {
  periodo: PeriodoPainel
  anosDisponiveis: number[]
  kpis: KpisPainel
  serieMensal: PontoSerieMensal[]
  serieAnual: PontoSerieAnual[]
  porPublicacao: PublicacoesPainel
  porSoftware: RankingPainel[]
  porTipo: RankingPainel[]
  porImpacto: RankingPainel[]
}

/** Item mínimo para as regras de fluxo do painel (mesmas da Esteira). */
export interface ItemFluxoPainel {
  status: StatusChamada
  contexto: {
    release: ContextoVinculo | null
    manual: ContextoVinculo | null
    projeto: ContextoVinculo | null
  }
  /** Data usada para o aging das chamadas em Revisar. */
  dataReferencia?: string
}

export interface IntervaloLiberacao {
  dataLancamento: string
  dataLiberacao: string
}

export interface VinculosChamada {
  releaseId?: string
  manualId?: string
  projetoId?: string
}

const dataLocal = (ano: number, mes: number, dia: number): string =>
  `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

export const hojeIso = (): string => {
  const agora = new Date()
  return dataLocal(agora.getFullYear(), agora.getMonth() + 1, agora.getDate())
}

const paraUtc = (iso: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const ano = Number(m[1])
  const mes = Number(m[2])
  const dia = Number(m[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return Date.UTC(ano, mes - 1, dia)
}

const diasDesde = (inicioIso: string, fimIso: string): number | null => {
  const inicio = paraUtc(inicioIso)
  const fim = paraUtc(fimIso)
  if (inicio === null || fim === null) return null
  return Math.floor((fim - inicio) / 86_400_000)
}

export const formatarPercentual = (valor: number): string => `${Math.round(valor)}%`

export const formatarLeadTime = (valor: number): string => {
  if (!Number.isFinite(valor) || valor <= 0) return '—'
  return `${String(Math.round(valor * 10) / 10).replace('.', ',')} d`
}

export const calcularPercentual = (parte: number, total: number): number => {
  if (!Number.isFinite(parte) || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((parte / total) * 100)
}

export const calcularTaxaRecusa = (recusado: number, total: number): number =>
  calcularPercentual(recusado, total)

const vazioReleases = (): ReleasesPorStatusPainel => ({
  aberta: 0,
  emRevisao: 0,
  aprovado: 0,
  publicado: 0
})

export const criarSerieMensalVazia = (): PontoSerieMensal[] =>
  MESES_PAINEL.map((mes) => ({
    mes: mes.numero,
    rotulo: mes.curto,
    releases: vazioReleases(),
    chamadasLancadas: 0,
    chamadasLiberadas: 0
  }))

export const preencherSerieAnual = (
  dados: PontoSerieAnual[],
  anoFinal: number,
  janela = 5
): PontoSerieAnual[] => {
  const mapa = new Map(dados.map((d) => [Number(d.ano), Number(d.publicadas)]))
  return Array.from({ length: janela }, (_, indice) => {
    const ano = anoFinal - (janela - 1 - indice)
    return { ano, publicadas: mapa.get(ano) ?? 0 }
  })
}

/**
 * Lead time médio (dias) das chamadas liberadas até hoje. Datas futuras ou
 * intervalos negativos são ignorados. Sem itens válidos, retorna 0.
 */
export const calcularLeadTimeMedioDias = (
  itens: IntervaloLiberacao[],
  hoje = hojeIso()
): number => {
  const diffs: number[] = []
  for (const item of itens) {
    if (!item.dataLancamento || !item.dataLiberacao) continue
    if (item.dataLiberacao > hoje) continue
    const dias = diasDesde(item.dataLancamento, item.dataLiberacao)
    if (dias === null || dias < 0) continue
    diffs.push(dias)
  }
  if (!diffs.length) return 0
  const media = diffs.reduce((soma, dias) => soma + dias, 0) / diffs.length
  return Math.round(media * 10) / 10
}

/**
 * Contagem de chamadas por vínculo. Uma chamada com mais de um vínculo conta
 * em cada coluna — por isso a soma das abas pode superar o total de chamadas.
 */
export const contarChamadasPorVinculo = (
  itens: VinculosChamada[]
): { release: number; manual: number; projeto: number } => {
  let release = 0
  let manual = 0
  let projeto = 0
  for (const item of itens) {
    if (item.releaseId) release += 1
    if (item.manualId) manual += 1
    if (item.projetoId) projeto += 1
  }
  return { release, manual, projeto }
}

/**
 * Fluxo do ciclo ativo: as mesmas regras da Esteira (`itemNoCicloAtivo` e
 * `itemPublicadoNoPortal`). Itens em `Publicar` com pai publicado saem do
 * ciclo e entram em `noPortal`; os demais em `Publicar` aguardam o pai.
 */
export const calcularFluxoPainel = (
  itens: ItemFluxoPainel[],
  hoje = hojeIso()
): FluxoPainel => {
  let revisar = 0
  let aprovado = 0
  let recusado = 0
  let publicar = 0
  let aguardandoPai = 0
  let noPortal = 0
  let aging7 = 0
  let aging15 = 0

  for (const item of itens) {
    if (itemPublicadoNoPortal(item)) {
      noPortal += 1
      continue
    }
    if (!itemNoCicloAtivo(item)) continue

    if (item.status === 'Revisar') {
      revisar += 1
      if (item.dataReferencia) {
        const dias = diasDesde(item.dataReferencia, hoje)
        if (dias !== null && dias > 7) aging7 += 1
        if (dias !== null && dias > 15) aging15 += 1
      }
    } else if (item.status === 'Aprovado') {
      aprovado += 1
    } else if (item.status === 'Recusado') {
      recusado += 1
    } else {
      publicar += 1
      aguardandoPai += 1
    }
  }

  const total = revisar + aprovado + recusado + publicar
  return {
    total,
    revisar,
    aprovado,
    recusado,
    publicar,
    aguardandoPai,
    noPortal,
    aging7,
    aging15,
    percentualFluxo: calcularPercentual(aprovado + publicar, total)
  }
}

export const criarPainelVazio = (ano: number, hoje = hojeIso()): PainelExecutivo => ({
  periodo: {
    ano,
    inicio: dataLocal(ano, 1, 1),
    fim: dataLocal(ano, 12, 31),
    hoje,
    rotulo: String(ano)
  },
  kpis: {
    releasesPublicadas: 0,
    chamadasLancadas: 0,
    chamadasLiberadas: 0,
    percentualFluxo: 0,
    leadTimeMedioDias: 0,
    taxaRecusa: 0
  },
  anosDisponiveis: [ano],
  serieMensal: criarSerieMensalVazia(),
  serieAnual: preencherSerieAnual([], ano),
  porPublicacao: { releases: [], manuais: [], escopos: [] },
  porSoftware: [],
  porTipo: [],
  porImpacto: []
})
