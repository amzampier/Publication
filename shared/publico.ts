// Contrato de exibição do shell da Área Pública. Sem imports de Nuxt/Vue:
// server, app e testes compartilham os mesmos tipos, agrupamentos e rótulos.
import { MESES } from './manuais'

export type TemaPublico = 'claro' | 'escuro'

export const TEMA_PUBLICO_COOKIE = 'publico-tema'

export interface PublicoReleaseResumo {
  id: string
  ano: number
  mes: string
  semana: number
  versao: string
  release: string
  destaqueSemana: boolean
  chamadas: number
  publicadoEm: string
}

export interface PublicoManualResumo {
  id: string
  ano: number
  mes: string
  mesNumero: number
  titulo: string
  publicadoEm: string
}

export interface PublicoSistemaResumo {
  nome: string
  chamadas: number
}

export interface PublicoEscopoResumo {
  id: string
  codigo: string
  nome: string
  versao: string
  ano: number
  chamadas: number
  sistemas: PublicoSistemaResumo[]
  publicadoEm: string
}

export interface PublicoNavegacao {
  releases: PublicoReleaseResumo[]
  manuais: PublicoManualResumo[]
  escopos: PublicoEscopoResumo[]
}

export interface PublicoSelecao {
  tipo: 'release' | 'manual' | 'escopo' | 'sistema'
  titulo: string
  detalhe: string
}

export interface PublicoMesReleases {
  mes: string
  mesNumero: number
  releases: PublicoReleaseResumo[]
}

export interface PublicoAnoReleases {
  ano: number
  meses: PublicoMesReleases[]
}

export interface PublicoMesManuais {
  mes: string
  mesNumero: number
  manuais: PublicoManualResumo[]
}

export interface PublicoAnoManuais {
  ano: number
  meses: PublicoMesManuais[]
}

const numeroDoMes = (mes: string): number => {
  const indice = MESES.indexOf(mes as (typeof MESES)[number])
  return indice >= 0 ? indice + 1 : 99
}

const compararTexto = (a: string, b: string): number =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base', numeric: true })

export function agruparReleases(releases: PublicoReleaseResumo[]): PublicoAnoReleases[] {
  const anos = new Map<number, Map<number, PublicoMesReleases>>()

  for (const release of releases) {
    const mesNumero = numeroDoMes(release.mes)
    const meses = anos.get(release.ano) ?? new Map<number, PublicoMesReleases>()
    const grupo = meses.get(mesNumero) ?? { mes: release.mes, mesNumero, releases: [] }
    grupo.releases.push(release)
    meses.set(mesNumero, grupo)
    anos.set(release.ano, meses)
  }

  return [...anos.entries()]
    .sort(([anoA], [anoB]) => anoB - anoA)
    .map(([ano, meses]) => ({
      ano,
      meses: [...meses.values()]
        .sort((a, b) => b.mesNumero - a.mesNumero)
        .map((grupo) => ({
          ...grupo,
          releases: [...grupo.releases].sort((a, b) => b.semana - a.semana)
        }))
    }))
}

export function agruparManuais(manuais: PublicoManualResumo[]): PublicoAnoManuais[] {
  const anos = new Map<number, Map<number, PublicoMesManuais>>()

  for (const manual of manuais) {
    const mesNumero = manual.mesNumero || numeroDoMes(manual.mes)
    const meses = anos.get(manual.ano) ?? new Map<number, PublicoMesManuais>()
    const grupo = meses.get(mesNumero) ?? { mes: manual.mes, mesNumero, manuais: [] }
    grupo.manuais.push(manual)
    meses.set(mesNumero, grupo)
    anos.set(manual.ano, meses)
  }

  return [...anos.entries()]
    .sort(([anoA], [anoB]) => anoB - anoA)
    .map(([ano, meses]) => ({
      ano,
      meses: [...meses.values()]
        .sort((a, b) => b.mesNumero - a.mesNumero)
        .map((grupo) => ({
          ...grupo,
          manuais: [...grupo.manuais].sort((a, b) => compararTexto(a.titulo, b.titulo))
        }))
    }))
}

export function ordenarEscopos(escopos: PublicoEscopoResumo[]): PublicoEscopoResumo[] {
  return [...escopos]
    .sort(
      (a, b) =>
        b.ano - a.ano ||
        compararTexto(a.nome, b.nome) ||
        compararTexto(b.versao, a.versao)
    )
    .map((escopo) => ({
      ...escopo,
      sistemas: [...escopo.sistemas].sort((a, b) => compararTexto(a.nome, b.nome))
    }))
}

export function contarSistemas(escopo: PublicoEscopoResumo): number {
  return escopo.sistemas.length
}

export function contarChamadasSistemas(escopo: PublicoEscopoResumo): number {
  return escopo.sistemas.reduce((total, sistema) => total + sistema.chamadas, 0)
}

export function rotuloChamadas(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'chamada' : 'chamadas'}`
}

export function rotuloManuais(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'manual' : 'manuais'}`
}

export function rotuloSistemas(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'sistema' : 'sistemas'}`
}

export function normalizarTemaPublico(valor: unknown): TemaPublico | null {
  const texto = typeof valor === 'string' ? valor.trim().toLowerCase() : ''
  return texto === 'claro' || texto === 'escuro' ? texto : null
}

export function resolverTemaInicial(
  cookie: unknown,
  prefereEscuro: boolean
): TemaPublico {
  return normalizarTemaPublico(cookie) ?? (prefereEscuro ? 'escuro' : 'claro')
}

export function alternarTemaPublico(tema: TemaPublico): TemaPublico {
  return tema === 'claro' ? 'escuro' : 'claro'
}

export function rotuloAcaoTema(tema: TemaPublico): string {
  return tema === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'
}
