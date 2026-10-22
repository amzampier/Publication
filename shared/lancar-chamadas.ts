import { MAX_TEXTO_RICO } from './rich-text'

// Regras puras do módulo Lançar as Chamadas — compartilhadas entre app e testes
// (`#shared/lancar-chamadas`). Sem imports de Nuxt/Vue. A fonte de verdade dos
// dados será a API `/api/lancar-chamadas` na fase backend; nesta fase o modelo
// roda em memória e este arquivo concentra tipos, validação, origem, filtros,
// KPIs, guardas e formatação.

export type OrigemChamada = 'Release' | 'Projeto' | 'Manual' | 'Ambos'
export type TipoChamada = 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
export type ImpactoChamada = 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
export type SituacaoChamada = 'Desenvolvimento' | 'Homologação' | 'Implantado'
export type StatusChamada = 'Revisar' | 'Aprovado' | 'Recusado' | 'Publicar'

export const ORIGENS_CHAMADA: OrigemChamada[] = ['Release', 'Projeto', 'Manual', 'Ambos']
export const TIPOS_CHAMADA: TipoChamada[] = ['Correção', 'Melhoria', 'Nova Funcionalidade']
export const IMPACTOS_CHAMADA: ImpactoChamada[] = ['Baixo', 'Médio', 'Alto', 'Crítico']
export const SITUACOES_CHAMADA: SituacaoChamada[] = [
  'Desenvolvimento',
  'Homologação',
  'Implantado'
]
export const STATUS_CHAMADA: StatusChamada[] = [
  'Revisar',
  'Aprovado',
  'Recusado',
  'Publicar'
]

export const VARIANTE_STATUS_CHAMADA: Record<
  StatusChamada,
  'pending' | 'reconciled' | 'done' | 'blocked'
> = {
  Revisar: 'pending',
  Aprovado: 'reconciled',
  Recusado: 'blocked',
  Publicar: 'done'
}

export const MAX_TAGS_CHAMADA = 12
export const MAX_TAG_CHAMADA = 30
export const MAX_IMAGENS_CHAMADA = 20
export const LIMITE_IMPORTACAO_CHAMADAS = 500

export interface OpcaoChamada {
  id: string
  label: string
  /** Código exibido/derivado (ex.: código da release). */
  sigla?: string
  description?: string
  /** Data de publicação da release (usada para preencher a liberação da chamada). */
  dataPublicacao?: string
}

export interface CatalogosChamada {
  releases: OpcaoChamada[]
  projetos: OpcaoChamada[]
  manuais: OpcaoChamada[]
  softwares: OpcaoChamada[]
  parceiros: OpcaoChamada[]
}

export interface ChamadaModelo {
  id: string
  origem: OrigemChamada
  releaseId: string
  projetoId: string
  manualId: string
  softwareIds: string[]
  parceiroId: string
  autorId: string
  autorNome: string
  chamada: string
  dataLancamento: string
  dataLiberacao: string
  release: string
  titulo: string
  parceiro: string
  softwares: string[]
  modulo: string
  menuFuncionalidade: string
  tipo: TipoChamada
  impacto: ImpactoChamada
  situacao: SituacaoChamada
  descricaoCompleta: string
  descricaoHtml: string
  solucao: string
  solucaoHtml: string
  manualTitulo: string
  linkManual: string
  linkVideo: string
  imagens: string[]
  status: StatusChamada
  tags: string[]
  temHistorico: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface EntradaChamada {
  chamada: string
  titulo: string
  dataLancamento: string
  dataLiberacao: string
  releaseId: string
  projetoId: string
  manualId: string
  softwareIds: string[]
  parceiroId: string
  modulo: string
  menuFuncionalidade: string
  tipo: TipoChamada
  impacto: ImpactoChamada
  situacao: SituacaoChamada
  descricaoCompleta: string
  descricaoHtml: string
  solucao: string
  solucaoHtml: string
  manualTitulo?: string
  linkManual: string
  linkVideo: string
  imagens: string[]
  tags: string[]
}

export interface LinhaImportacaoChamada {
  chamada: string
  titulo: string
  dataLancamento: string
  dataLiberacao: string
  releaseCodigo: string
  projetoCodigo: string
  manualCodigo: string
  softwareCodigos: string[]
  parceiroCodigo: string
  modulo: string
  menuFuncionalidade: string
  tipo: TipoChamada
  impacto: ImpactoChamada
  descricaoCompleta: string
  manualTitulo: string
  linkManual: string
  linkVideo: string
  tags: string[]
}

export interface FiltrosChamada {
  status: string
  situacao: string
  tipo: string
  impacto: string
  softwareIds: string[]
  parceiroId: string
  origem: string
  dataLancamentoDe: string
  dataLancamentoAte: string
  dataLiberacaoDe: string
  dataLiberacaoAte: string
}

export interface KpisChamada {
  total: number
  revisar: number
  aprovado: number
  recusado: number
}

export type CampoChamada =
  | 'chamada'
  | 'titulo'
  | 'vinculo'
  | 'softwareIds'
  | 'parceiroId'
  | 'modulo'
  | 'descricaoCompleta'
  | 'solucao'
  | 'manualTitulo'
  | 'dataLancamento'
  | 'dataLiberacao'
  | 'tipo'
  | 'impacto'
  | 'situacao'
  | 'linkManual'
  | 'linkVideo'
  | 'imagens'
  | 'tags'

export interface ResultadoValidacaoChamada {
  valido: boolean
  erros: Partial<Record<CampoChamada, string>>
  primeiroErro: CampoChamada | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const URL_HTTP = /^https?:\/\/\S+$/i

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor.trim() : '')

/** Normaliza tags: trim, remove vazias e deduplica sem diferenciar maiúsculas. */
export function normalizarTagsChamada(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  const vistos = new Set<string>()
  const tags: string[] = []
  for (const item of valor) {
    const tag = texto(item)
    if (!tag) continue
    const chave = tag.toLowerCase()
    if (vistos.has(chave)) continue
    vistos.add(chave)
    tags.push(tag)
  }
  return tags
}

/** Normaliza URLs de imagem: trim, remove vazias e deduplica. */
export function normalizarImagensChamada(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  const vistos = new Set<string>()
  const imagens: string[] = []
  for (const item of valor) {
    const url = texto(item)
    if (!url || vistos.has(url)) continue
    vistos.add(url)
    imagens.push(url)
  }
  return imagens
}

/** Normaliza códigos de software: trim, remove vazios e deduplica. */
export function normalizarSoftwareIds(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  const vistos = new Set<string>()
  const codigos: string[] = []
  for (const item of valor) {
    const codigo = texto(item)
    if (!codigo || vistos.has(codigo)) continue
    vistos.add(codigo)
    codigos.push(codigo)
  }
  return codigos
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

/** `true` quando a data civil é segunda-feira (UTC, sem deslocamento de fuso). */
export function ehSegundaFeira(valor: string): boolean {
  if (!ehDataIso(valor)) return false
  const [ano = 0, mes = 0, dia = 0] = valor.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay() === 1
}

/** Data local de hoje em `AAAA-MM-DD`. */
export function hojeIso(): string {
  return isoDeData(new Date())
}

/** Data local em `AAAA-MM-DD` (sem deslocamento de fuso). */
export function isoDeData(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Próxima segunda-feira a partir de `base` (inclui o próprio dia). */
export function proximaSegunda(base: Date = new Date()): string {
  const data = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  while (data.getDay() !== 1) data.setDate(data.getDate() + 1)
  return isoDeData(data)
}

/** Formata `AAAA-MM-DD` (ou ISO) em `dd/mm/aaaa`, sem deslocamento de fuso. */
export function formatarData(valor: string): string {
  if (!valor) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR')
}

/** Formata um timestamp ISO em `dd/mm/aaaa hh:mm`; vazio vira `—`. */
export function formatarDataHora(iso: string): string {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** Número no padrão pt-BR. */
export function formatarNumero(valor: number): string {
  return Number(valor || 0).toLocaleString('pt-BR')
}

/** Deriva a origem a partir dos vínculos; `null` quando não há nenhum. */
export function derivarOrigem(vinculos: {
  releaseId?: string | null
  projetoId?: string | null
  manualId?: string | null
}): OrigemChamada | null {
  const total = [vinculos.releaseId, vinculos.projetoId, vinculos.manualId].filter(Boolean).length
  if (total === 0) return null
  if (total > 1) return 'Ambos'
  if (vinculos.releaseId) return 'Release'
  if (vinculos.projetoId) return 'Projeto'
  return 'Manual'
}

/**
 * Valida os campos da chamada. `existentes`/`idAtual` cobrem a duplicidade de
 * `chamada` no conjunto carregado; a origem é derivada e não entra na validação.
 */
export function validarChamada(
  dados: {
    chamada?: unknown
    titulo?: unknown
    dataLancamento?: unknown
    dataLiberacao?: unknown
    releaseId?: unknown
    projetoId?: unknown
    manualId?: unknown
    softwareIds?: unknown
    parceiroId?: unknown
    modulo?: unknown
    menuFuncionalidade?: unknown
    tipo?: unknown
    impacto?: unknown
    situacao?: unknown
    descricaoCompleta?: unknown
    descricaoHtml?: unknown
    solucao?: unknown
    solucaoHtml?: unknown
    manualTitulo?: unknown
    linkManual?: unknown
    linkVideo?: unknown
    imagens?: unknown
    tags?: unknown
  },
  existentes: ChamadaModelo[] = [],
  idAtual?: string
): ResultadoValidacaoChamada {
  const erros: Partial<Record<CampoChamada, string>> = {}

  const chamada = texto(dados.chamada)
  if (!chamada) erros.chamada = 'Informe o número da chamada.'
  else if (chamada.length > 60) erros.chamada = 'A chamada deve ter no máximo 60 caracteres.'
  else {
    const chave = chamada.toLowerCase()
    const duplicada = existentes.some(
      (item) => item.id !== idAtual && item.chamada.trim().toLowerCase() === chave
    )
    if (duplicada) erros.chamada = 'Já existe uma chamada com este número.'
  }

  const titulo = texto(dados.titulo)
  if (!titulo) erros.titulo = 'Informe o título da chamada.'
  else if (titulo.length > 255) erros.titulo = 'O título deve ter no máximo 255 caracteres.'

  const releaseId = texto(dados.releaseId)
  const projetoId = texto(dados.projetoId)
  const manualId = texto(dados.manualId)
  if (!derivarOrigem({ releaseId, projetoId, manualId })) {
    erros.vinculo = 'Selecione ao menos uma release, projeto ou manual.'
  }

  if (!normalizarSoftwareIds(dados.softwareIds).length) {
    erros.softwareIds = 'Selecione ao menos um software.'
  }
  if (!texto(dados.parceiroId)) erros.parceiroId = 'Selecione o parceiro.'

  const modulo = texto(dados.modulo)
  if (!modulo) erros.modulo = 'Informe o menu.'
  else if (modulo.length > 100) erros.modulo = 'O menu deve ter no máximo 100 caracteres.'

  const descricaoCompleta = texto(dados.descricaoCompleta)
  if (!descricaoCompleta) {
    erros.descricaoCompleta = 'Informe a descrição completa da chamada.'
  } else if (descricaoCompleta.length > MAX_TEXTO_RICO) {
    erros.descricaoCompleta = `A descrição completa deve ter no máximo ${MAX_TEXTO_RICO} caracteres.`
  }

  const solucao = texto(dados.solucao)
  if (solucao.length > MAX_TEXTO_RICO) {
    erros.solucao = `A solução deve ter no máximo ${MAX_TEXTO_RICO} caracteres.`
  }

  const manualTitulo = texto(dados.manualTitulo)
  if (manualTitulo.length > 255) {
    erros.manualTitulo = 'O título do manual deve ter no máximo 255 caracteres.'
  }

  const dataLancamento = texto(dados.dataLancamento)
  if (!dataLancamento) erros.dataLancamento = 'Informe a data de lançamento.'
  else if (!ehDataIso(dataLancamento)) erros.dataLancamento = 'A data de lançamento é inválida.'

  const dataLiberacao = texto(dados.dataLiberacao)
  if (dataLiberacao && !ehDataIso(dataLiberacao)) {
    erros.dataLiberacao = 'A data de liberação é inválida.'
  }

  const tipo = texto(dados.tipo)
  if (!TIPOS_CHAMADA.includes(tipo as TipoChamada)) erros.tipo = 'Selecione um tipo válido.'

  const impacto = texto(dados.impacto)
  if (!IMPACTOS_CHAMADA.includes(impacto as ImpactoChamada)) {
    erros.impacto = 'Selecione um impacto válido.'
  }

  const situacao = texto(dados.situacao)
  if (!SITUACOES_CHAMADA.includes(situacao as SituacaoChamada)) {
    erros.situacao = 'Selecione uma situação válida.'
  }

  const linkManual = texto(dados.linkManual)
  if (linkManual && !URL_HTTP.test(linkManual)) {
    erros.linkManual = 'Informe uma URL http(s) válida.'
  }

  const linkVideo = texto(dados.linkVideo)
  if (linkVideo && !URL_HTTP.test(linkVideo)) {
    erros.linkVideo = 'Informe uma URL http(s) válida.'
  }

  const imagens = normalizarImagensChamada(dados.imagens)
  if (imagens.length > MAX_IMAGENS_CHAMADA) {
    erros.imagens = `Informe no máximo ${MAX_IMAGENS_CHAMADA} imagens.`
  }

  const tags = normalizarTagsChamada(dados.tags)
  if (tags.length > MAX_TAGS_CHAMADA) {
    erros.tags = `Informe no máximo ${MAX_TAGS_CHAMADA} tags.`
  } else if (tags.some((tag) => tag.length > MAX_TAG_CHAMADA)) {
    erros.tags = `Cada tag deve ter no máximo ${MAX_TAG_CHAMADA} caracteres.`
  }

  const prioridade: CampoChamada[] = [
    'chamada',
    'titulo',
    'vinculo',
    'softwareIds',
    'parceiroId',
    'modulo',
    'descricaoCompleta',
    'solucao',
    'manualTitulo',
    'dataLancamento',
    'dataLiberacao',
    'tipo',
    'impacto',
    'situacao',
    'linkManual',
    'linkVideo',
    'imagens',
    'tags'
  ]
  const primeiroErro = prioridade.find((campo) => erros[campo]) ?? null
  return { valido: primeiroErro === null, erros, primeiroErro }
}

/** Filtra o conjunto vigente; filtros vazios = todos. */
export function filtrarChamadas(
  chamadas: ChamadaModelo[],
  filtros: FiltrosChamada
): ChamadaModelo[] {
  return chamadas
    .filter((chamada) => !filtros.status || chamada.status === filtros.status)
    .filter((chamada) => !filtros.situacao || chamada.situacao === filtros.situacao)
    .filter((chamada) => !filtros.tipo || chamada.tipo === filtros.tipo)
    .filter((chamada) => !filtros.impacto || chamada.impacto === filtros.impacto)
    .filter(
      (chamada) =>
        !filtros.softwareIds.length ||
        chamada.softwareIds.some((id) => filtros.softwareIds.includes(id))
    )
    .filter((chamada) => !filtros.parceiroId || chamada.parceiroId === filtros.parceiroId)
    .filter((chamada) => !filtros.origem || chamada.origem === filtros.origem)
    .filter(
      (chamada) =>
        !filtros.dataLancamentoDe || chamada.dataLancamento >= filtros.dataLancamentoDe
    )
    .filter(
      (chamada) => !filtros.dataLancamentoAte || chamada.dataLancamento <= filtros.dataLancamentoAte
    )
    .filter(
      (chamada) =>
        !filtros.dataLiberacaoDe ||
        (Boolean(chamada.dataLiberacao) && chamada.dataLiberacao >= filtros.dataLiberacaoDe)
    )
    .filter(
      (chamada) =>
        !filtros.dataLiberacaoAte ||
        (Boolean(chamada.dataLiberacao) && chamada.dataLiberacao <= filtros.dataLiberacaoAte)
    )
    .sort((a, b) => a.chamada.localeCompare(b.chamada, 'pt-BR', { numeric: true }))
}

/** Busca textual sobre o conjunto filtrado. */
export function buscarChamadas(chamadas: ChamadaModelo[], termo: string): ChamadaModelo[] {
  const busca = termo.trim().toLowerCase()
  if (!busca) return chamadas
  return chamadas.filter((chamada) =>
    [
      chamada.chamada,
      chamada.titulo,
      chamada.descricaoCompleta,
      chamada.solucao,
      chamada.softwares.join(' '),
      chamada.modulo,
      chamada.menuFuncionalidade,
      chamada.parceiro,
      chamada.release,
      chamada.tags.join(' ')
    ]
      .join(' ')
      .toLowerCase()
      .includes(busca)
  )
}

/** KPIs do conjunto recebido. */
export function calcularKpis(chamadas: ChamadaModelo[]): KpisChamada {
  return {
    total: chamadas.length,
    revisar: chamadas.filter((chamada) => chamada.status === 'Revisar').length,
    aprovado: chamadas.filter((chamada) => chamada.status === 'Aprovado').length,
    recusado: chamadas.filter((chamada) => chamada.status === 'Recusado').length
  }
}

/** Motivo pelo qual a exclusão está bloqueada (null quando permitida). */
export function motivoBloqueioExclusao(chamada: ChamadaModelo): string | null {
  if (chamada.status !== 'Revisar') {
    return 'Chamada já avançou na esteira e não pode ser excluída.'
  }
  if (chamada.temHistorico) {
    return 'Chamada com histórico na esteira não pode ser excluída.'
  }
  return null
}

/** Exclusão permitida apenas em `Revisar` e sem histórico. */
export function podeExcluir(chamada: ChamadaModelo): boolean {
  return motivoBloqueioExclusao(chamada) === null
}

/** Motivo pelo qual a aprovação está bloqueada (null quando permitida). */
export function motivoBloqueioAprovacao(chamada: ChamadaModelo): string | null {
  if (chamada.status === 'Aprovado') return 'Chamada já aprovada.'
  if (chamada.status === 'Recusado') return 'Chamada já recusada.'
  if (chamada.status === 'Publicar') return 'Chamada já publicada.'
  return null
}

/** Aprovação permitida apenas a partir de `Revisar`. */
export function podeAprovar(chamada: ChamadaModelo): boolean {
  return motivoBloqueioAprovacao(chamada) === null
}

/** Motivo pelo qual a desaprovação está bloqueada (null quando permitida). */
export function motivoBloqueioDesaprovacao(chamada: ChamadaModelo): string | null {
  if (chamada.status !== 'Aprovado') return 'Somente chamadas aprovadas podem voltar para Revisar.'
  return null
}

/** Desaprovação permitida apenas a partir de `Aprovado`. */
export function podeDesaprovar(chamada: ChamadaModelo): boolean {
  return motivoBloqueioDesaprovacao(chamada) === null
}

/** Motivo pelo qual a recusa está bloqueada (null quando permitida). */
export function motivoBloqueioRecusa(chamada: ChamadaModelo): string | null {
  if (chamada.status === 'Recusado') return 'Chamada já recusada.'
  if (chamada.status === 'Aprovado') return 'Chamada já aprovada.'
  if (chamada.status === 'Publicar') return 'Chamada já publicada.'
  return null
}

/** Recusa permitida apenas a partir de `Revisar`. */
export function podeRecusar(chamada: ChamadaModelo): boolean {
  return motivoBloqueioRecusa(chamada) === null
}
