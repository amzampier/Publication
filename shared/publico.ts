// Contrato de exibição do shell da Área Pública. Sem imports de Nuxt/Vue:
// server, app e testes compartilham os mesmos tipos, agrupamentos e rótulos.
import { MESES, type TipoItem } from './manuais'

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

// ---------------------------------------------------------------------------
// Painel de Destaques da Área Pública
// ---------------------------------------------------------------------------

export type PublicoModoRanking = 'vistas' | 'recentes'

export const TIPOS_ITEM: TipoItem[] = ['Correção', 'Melhoria', 'Nova Funcionalidade']

export interface PublicoContagensTipo {
  correcao: number
  melhoria: number
  nova: number
}

export interface PublicoChamadaDestaque {
  id: string
  chamada: string
  titulo: string
  software: string
  modulo: string
  tipo: TipoItem
  parceiro: string
  fotos: number
  linkVideo: string
  linkManual: string
  ordemApresentacao?: number
}

export interface PublicoReleaseDestaque {
  id: string
  semana: number
  ano: number
  mes: string
  versao: string
  release: string
  nome: string
  descricao: string
  publicadoEm: string
  totalVisualizacoes: number
  destaqueSemana: boolean
  revisorNome: string
  chamadas: PublicoChamadaDestaque[]
}

export interface PublicoManualDestaqueResumo {
  id: string
  ano: number
  mes: string
  mesNumero: number
  titulo: string
  descricao: string
  destaqueSemana: boolean
  publicadoEm: string
}

export interface PublicoManualItemDestaque {
  card: 'item' | 'catalogo'
  id: string
  manualId: string
  titulo: string
  descricao: string
  software: string
  modulo: string
  tipo: TipoItem | null
  mes: string
  ano: number
  linkVideo: string
  linkManual: string
  publicadoEm: string
  ordemApresentacao?: number
}

export interface PublicoReleaseResumoPainel {
  id: string
  semana: number
  ano: number
  versao: string
  release: string
  nome: string
  descricao: string
  chamadas: number
  contagens: PublicoContagensTipo
  publicadoEm: string
  totalVisualizacoes: number
}

export interface PublicoReleaseFiltravel extends PublicoReleaseResumoPainel {
  softwares: string[]
}

export interface PublicoFiltrosPainel {
  softwares: string[]
  tipos: TipoItem[]
}

export interface PublicoPainel {
  releaseDestaque: PublicoReleaseDestaque | null
  manuaisDestaque: PublicoManualItemDestaque[]
  maisVistas: PublicoReleaseResumoPainel[]
  modoMaisVistas: PublicoModoRanking
  filtros: PublicoFiltrosPainel
}

export interface PublicoHistorico {
  itens: PublicoReleaseResumoPainel[]
  total: number
  pagina: number
  porPagina: number
}

export interface PublicoReleaseSelecionada<T> {
  release: T | null
  rotulo: string
}

const compararDataDesc = (a: { publicadoEm: string }, b: { publicadoEm: string }): number =>
  b.publicadoEm.localeCompare(a.publicadoEm)

export function selecionarReleaseDestaque<
  T extends { destaqueSemana: boolean; publicadoEm: string }
>(releases: T[]): PublicoReleaseSelecionada<T> {
  const ordenadas = [...releases].sort(compararDataDesc)
  const destaque = ordenadas.find((release) => release.destaqueSemana) ?? null
  if (destaque) {
    return { release: destaque, rotulo: 'Última Release Liberada da Semana' }
  }
  return {
    release: ordenadas[0] ?? null,
    rotulo: 'Última Release Publicada'
  }
}

export function selecionarItensDestaque<
  T extends { ordemApresentacao?: number; chamada?: string; id?: string }
>(chamadas: T[], limite = 3): T[] {
  const maximo = Math.max(0, limite)
  return [...chamadas]
    .sort((a, b) => {
      const ordemA = a.ordemApresentacao ?? 0
      const ordemB = b.ordemApresentacao ?? 0
      if (ordemA !== ordemB) return ordemA - ordemB
      const chaveA = `${a.chamada ?? ''}${a.id ?? ''}`
      const chaveB = `${b.chamada ?? ''}${b.id ?? ''}`
      return chaveA.localeCompare(chaveB, 'pt-BR', { numeric: true })
    })
    .slice(0, maximo)
}

const compararManualDestaque = (
  a: PublicoManualDestaqueResumo,
  b: PublicoManualDestaqueResumo
): number =>
  b.publicadoEm.localeCompare(a.publicadoEm) ||
  b.ano - a.ano ||
  b.mesNumero - a.mesNumero

const compararItemManual = (
  a: PublicoManualItemDestaque,
  b: PublicoManualItemDestaque
): number =>
  (a.ordemApresentacao ?? 0) - (b.ordemApresentacao ?? 0) ||
  b.publicadoEm.localeCompare(a.publicadoEm) ||
  a.titulo.localeCompare(b.titulo, 'pt-BR')

export function selecionarManuaisDestaque(
  manuais: PublicoManualDestaqueResumo[],
  itens: PublicoManualItemDestaque[],
  limite = 2
): PublicoManualItemDestaque[] {
  const maximo = Math.max(0, limite)
  const destacados = manuais
    .filter((manual) => manual.destaqueSemana)
    .sort(compararManualDestaque)
  const selecionados: PublicoManualItemDestaque[] = []

  for (const manual of destacados) {
    if (selecionados.length >= maximo) break
    const doManual = itens
      .filter((item) => item.card === 'item' && item.manualId === manual.id)
      .sort(compararItemManual)
    const item = doManual.find((candidato) => candidato.linkVideo || candidato.linkManual) ?? doManual[0]
    if (item) {
      selecionados.push({ ...item, card: 'item' })
      continue
    }
    selecionados.push({
      card: 'catalogo',
      id: manual.id,
      manualId: manual.id,
      titulo: manual.titulo,
      descricao: manual.descricao,
      software: '',
      modulo: '',
      tipo: null,
      mes: manual.mes,
      ano: manual.ano,
      linkVideo: '',
      linkManual: '',
      publicadoEm: manual.publicadoEm
    })
  }

  return selecionados
}

export function ranquearMaisVistas(
  releases: PublicoReleaseResumoPainel[],
  heroId: string | null,
  limite = 3
): { itens: PublicoReleaseResumoPainel[]; modo: PublicoModoRanking } {
  const maximo = Math.max(0, limite)
  const candidatas = releases.filter((release) => release.id !== heroId)
  const temViews = candidatas.some((release) => release.totalVisualizacoes > 0)

  if (!temViews) {
    return {
      itens: [...candidatas].sort(compararDataDesc).slice(0, maximo),
      modo: 'recentes'
    }
  }

  const porViews = [...candidatas].sort(
    (a, b) =>
      b.totalVisualizacoes - a.totalVisualizacoes ||
      compararDataDesc(a, b)
  )
  const selecionadas = porViews.slice(0, maximo)

  if (selecionadas.length < maximo) {
    const ids = new Set(selecionadas.map((release) => release.id))
    const restantes = candidatas
      .filter((release) => !ids.has(release.id))
      .sort(compararDataDesc)
    selecionadas.push(...restantes.slice(0, maximo - selecionadas.length))
  }

  return { itens: selecionadas, modo: 'vistas' }
}

export function contarTipos(itens: { tipo: TipoItem | string }[]): PublicoContagensTipo {
  const contagens: PublicoContagensTipo = { correcao: 0, melhoria: 0, nova: 0 }
  for (const item of itens) {
    if (item.tipo === 'Correção') contagens.correcao += 1
    else if (item.tipo === 'Melhoria') contagens.melhoria += 1
    else if (item.tipo === 'Nova Funcionalidade') contagens.nova += 1
  }
  return contagens
}

export function filtrarHistorico(
  releases: PublicoReleaseFiltravel[],
  filtros: { software?: string; tipo?: TipoItem | '' }
): PublicoReleaseFiltravel[] {
  const software = filtros.software?.trim() ?? ''
  const tipo = filtros.tipo ?? ''

  return releases.filter((release) => {
    if (software && !release.softwares.includes(software)) return false
    if (tipo === 'Correção' && release.contagens.correcao === 0) return false
    if (tipo === 'Melhoria' && release.contagens.melhoria === 0) return false
    if (tipo === 'Nova Funcionalidade' && release.contagens.nova === 0) return false
    return true
  })
}

export function rotuloFotos(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'foto' : 'fotos'}`
}

export function rotuloVisualizacoes(quantidade: number): string {
  const numero = quantidade.toLocaleString('pt-BR')
  return `${numero} ${quantidade === 1 ? 'visualização' : 'visualizações'}`
}

export function rotuloTipo(tipo: TipoItem, quantidade: number): string {
  if (tipo === 'Correção') {
    return `${quantidade} ${quantidade === 1 ? 'correção' : 'correções'}`
  }
  if (tipo === 'Melhoria') {
    return `${quantidade} ${quantidade === 1 ? 'melhoria' : 'melhorias'}`
  }
  return `${quantidade} ${quantidade === 1 ? 'nova funcionalidade' : 'novas funcionalidades'}`
}

export function varianteTipoItem(
  tipo: TipoItem | null
): 'correcao' | 'melhoria' | 'nova' | 'neutral' {
  if (tipo === 'Correção') return 'correcao'
  if (tipo === 'Melhoria') return 'melhoria'
  if (tipo === 'Nova Funcionalidade') return 'nova'
  return 'neutral'
}

export function normalizarPagina(valor: unknown): number {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 1) return 1
  return numero
}

export function normalizarPorPagina(valor: unknown, padrao = 6, maximo = 50): number {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 1) return padrao
  return Math.min(numero, maximo)
}

export function normalizarTipo(valor: unknown): TipoItem | '' {
  return TIPOS_ITEM.find((tipo) => tipo === valor) ?? ''
}

export function normalizarSoftware(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}
