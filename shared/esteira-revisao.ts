import type { ChamadaModelo, StatusChamada } from './lancar-chamadas'

// Regras puras da Esteira de Revisão — compartilhadas entre app, servidor e
// testes (`#shared/esteira-revisao`). Sem imports de Nuxt/Vue.

export type AbaEsteira = 'revisar' | 'recusado' | 'aprovado' | 'todas'
export type AcaoEsteira = 'aprovar' | 'recusar' | 'reabrir' | 'publicar' | 'suspender'

export const ABAS_ESTEIRA: { id: AbaEsteira; label: string }[] = [
  { id: 'revisar', label: 'Em revisão' },
  { id: 'recusado', label: 'Recusadas' },
  { id: 'aprovado', label: 'Aprovadas' },
  { id: 'todas', label: 'Todas' }
]

export const MAX_PARECER_ESTEIRA = 4000

export interface ContextoVinculo {
  id: string
  codigo: string
  nome: string
  status: string
  arquivada: boolean
}

export interface ItemEsteira extends ChamadaModelo {
  contexto: {
    release: ContextoVinculo | null
    manual: ContextoVinculo | null
    projeto: ContextoVinculo | null
  }
  revisorId: string
  revisorNome: string
  dataDecisao: string
  parecer: string
}

export interface FiltrosEsteira {
  status: string
  origem: string
  releaseId: string
  manualId: string
  projetoId: string
  softwareId: string
  parceiroId: string
  tipo: string
  impacto: string
  dataLancamentoDe: string
  dataLancamentoAte: string
  dataLiberacaoDe: string
  dataLiberacaoAte: string
}

export interface HistoricoEsteira {
  id: string
  statusAnterior: string
  novoStatus: string
  responsavelId: string
  responsavelNome: string
  responsavelPerfil: string
  parecer: string
  criteriosAtendidos: boolean
  tempoNoEstagioMinutos: number | null
  dataTransicao: string
}

export interface ProgressoVinculo {
  total: number
  revisar: number
  aprovado: number
  recusado: number
  publicar: number
  aguardando: number
  publicado: number
  revisado: number
  percentualRevisado: number
  percentualAprovado: number
}

export interface ProgressoEsteira extends ProgressoVinculo {
  porVinculo: {
    release: ProgressoVinculo
    manual: ProgressoVinculo
    projeto: ProgressoVinculo
  }
}

export const FILTROS_ESTEIRA_VAZIOS: FiltrosEsteira = {
  status: '',
  origem: '',
  releaseId: '',
  manualId: '',
  projetoId: '',
  softwareId: '',
  parceiroId: '',
  tipo: '',
  impacto: '',
  dataLancamentoDe: '',
  dataLancamentoAte: '',
  dataLiberacaoDe: '',
  dataLiberacaoAte: ''
}

/**
 * Contexto entra no board/progresso quando não está arquivado. O status
 * `Publicado` não exclui o vínculo por si só; a saída de itens já publicados é
 * decidida por `itemPublicadoNoPortal`.
 */
export function contextoAtivo(contexto: ContextoVinculo | null): boolean {
  return Boolean(contexto && !contexto.arquivada)
}

export type TipoVinculo = 'release' | 'manual' | 'projeto'

/** Status de revisão do conteúdo pai quando uma chamada é vinculada a ele. */
export function statusRevisaoDoPai(tipo: TipoVinculo): string {
  return tipo === 'projeto' ? 'Homologação' : 'Em Revisão'
}

/** O conteúdo pai está publicado no portal? */
export function contextoPublicado(contexto: ContextoVinculo | null): boolean {
  return Boolean(contexto && contexto.status === 'Publicado')
}

/** Ao menos um vínculo ativo aponta para conteúdo pai publicado. */
export function temPaiPublicado(item: Pick<ItemEsteira, 'contexto'>): boolean {
  return [item.contexto.release, item.contexto.manual, item.contexto.projeto].some(
    (contexto) => contextoAtivo(contexto) && contextoPublicado(contexto)
  )
}

/**
 * O item já está publicado no portal quando está em `Publicado` E ao menos um
 * vínculo ativo aponta para conteúdo pai com status `Publicado`.
 */
export function itemPublicadoNoPortal(
  item: Pick<ItemEsteira, 'status' | 'contexto'>
): boolean {
  if (item.status !== 'Publicado') return false
  return temPaiPublicado(item)
}

/** Alias de leitura para a visibilidade pública do item. */
export function itemVisivelNoPortal(item: Pick<ItemEsteira, 'status' | 'contexto'>): boolean {
  return itemPublicadoNoPortal(item)
}

/** O item possui ao menos um vínculo não arquivado. */
export function itemComVinculoAtivo(item: Pick<ItemEsteira, 'contexto'>): boolean {
  return [item.contexto.release, item.contexto.manual, item.contexto.projeto].some(contextoAtivo)
}

/**
 * Item do ciclo ativo: possui vínculo não arquivado e ainda não está publicado
 * no portal. `Publicado` sai do ciclo; `Publicar` com pai já publicado também
 * (estado transitório da cascata). `Revisar`, `Aprovado` e `Recusado`
 * permanecem mesmo com o pai publicado.
 */
export function itemNoCicloAtivo(item: Pick<ItemEsteira, 'status' | 'contexto'>): boolean {
  if (!itemComVinculoAtivo(item)) return false
  if (item.status === 'Publicado') return false
  if (item.status === 'Publicar' && temPaiPublicado(item)) return false
  return true
}

/**
 * Item exibido no board: o ciclo ativo por padrão. Quando um vínculo
 * específico (Release Week, Manual ou Escopo) está filtrado, inclui também os
 * itens em `Publicar` já visíveis no portal para consulta.
 */
export function itemVisivelNoBoard(
  item: Pick<ItemEsteira, 'status' | 'contexto'>,
  filtros: Pick<FiltrosEsteira, 'releaseId' | 'manualId' | 'projetoId'>
): boolean {
  if (!itemComVinculoAtivo(item)) return false
  if (itemNoCicloAtivo(item)) return true
  return Boolean(filtros.releaseId || filtros.manualId || filtros.projetoId)
}

/** Origem efetiva de um item a partir dos vínculos ATIVOS. */
export function origemDoItem(item: Pick<ItemEsteira, 'contexto'>): string {
  const release = contextoAtivo(item.contexto.release)
  const manual = contextoAtivo(item.contexto.manual)
  const projeto = contextoAtivo(item.contexto.projeto)
  const total = [release, manual, projeto].filter(Boolean).length
  if (total === 0) return 'Sem vínculo ativo'
  if (total > 1) return 'Ambos'
  if (release) return 'Release'
  if (manual) return 'Manual'
  return 'Projeto'
}

/** Rótulo curto com os códigos dos vínculos (ex.: RW-39/2026 · MAN-10/2026). */
export function rotuloVinculo(item: Pick<ItemEsteira, 'contexto'>): string {
  return (
    [item.contexto.release?.codigo, item.contexto.manual?.codigo, item.contexto.projeto?.codigo]
      .filter(Boolean)
      .join(' · ') || '—'
  )
}

const vazio = (): ProgressoVinculo => ({
  total: 0,
  revisar: 0,
  aprovado: 0,
  recusado: 0,
  publicar: 0,
  aguardando: 0,
  publicado: 0,
  revisado: 0,
  percentualRevisado: 0,
  percentualAprovado: 0
})

const somarStatus = (alvo: ProgressoVinculo, status: StatusChamada): void => {
  // `Publicado` é contagem informativa (no portal) e não entra no ciclo ativo
  // usado pelo percentual do fluxo.
  if (status === 'Publicado') {
    alvo.publicado += 1
    return
  }
  alvo.total += 1
  if (status === 'Revisar') alvo.revisar += 1
  else if (status === 'Aprovado') alvo.aprovado += 1
  else if (status === 'Recusado') alvo.recusado += 1
  else {
    alvo.publicar += 1
    alvo.aguardando += 1
  }
}

const fecharPercentuais = (alvo: ProgressoVinculo): void => {
  // "Revisado" aqui é o que avançou no fluxo: aprovado + aguardando o pai.
  // Recusadas continuam pendentes de correção e não contam no percentual.
  alvo.revisado = alvo.aprovado + alvo.publicar
  alvo.percentualRevisado = alvo.total ? Math.round((alvo.revisado / alvo.total) * 100) : 0
  alvo.percentualAprovado = alvo.total ? Math.round((alvo.aprovado / alvo.total) * 100) : 0
}

/**
 * Progresso global e por vínculo. Um item com mais de um vínculo ativo conta
 * uma vez no total geral e uma vez em cada origem correspondente.
 */
export function calcularProgresso(itens: ItemEsteira[]): ProgressoEsteira {
  const global = vazio()
  const porVinculo = { release: vazio(), manual: vazio(), projeto: vazio() }

  for (const item of itens) {
    somarStatus(global, item.status)
    if (contextoAtivo(item.contexto.release)) somarStatus(porVinculo.release, item.status)
    if (contextoAtivo(item.contexto.manual)) somarStatus(porVinculo.manual, item.status)
    if (contextoAtivo(item.contexto.projeto)) somarStatus(porVinculo.projeto, item.status)
  }

  fecharPercentuais(global)
  fecharPercentuais(porVinculo.release)
  fecharPercentuais(porVinculo.manual)
  fecharPercentuais(porVinculo.projeto)

  return { ...global, porVinculo }
}

const statusDaAba = (aba: AbaEsteira): StatusChamada | null => {
  if (aba === 'revisar') return 'Revisar'
  if (aba === 'recusado') return 'Recusado'
  if (aba === 'aprovado') return 'Aprovado'
  return null
}

/**
 * Vínculos específicos do filtro combinam por união: a chamada entra quando
 * corresponde a qualquer Release Week, Manual ou Escopo selecionado.
 */
const correspondeVinculo = (item: ItemEsteira, filtros: FiltrosEsteira): boolean => {
  if (!filtros.releaseId && !filtros.manualId && !filtros.projetoId) return true
  return (
    (Boolean(filtros.releaseId) && item.contexto.release?.id === filtros.releaseId) ||
    (Boolean(filtros.manualId) && item.contexto.manual?.id === filtros.manualId) ||
    (Boolean(filtros.projetoId) && item.contexto.projeto?.id === filtros.projetoId)
  )
}

const temVinculo = (item: ItemEsteira, origem: string): boolean => {
  const release = contextoAtivo(item.contexto.release)
  const manual = contextoAtivo(item.contexto.manual)
  const projeto = contextoAtivo(item.contexto.projeto)
  const ativos = [release, manual, projeto].filter(Boolean).length
  if (!origem) return true
  if (origem === 'Ambos') return ativos > 1
  if (origem === 'Release') return release
  if (origem === 'Manual') return manual
  if (origem === 'Projeto') return projeto
  return true
}

const normalizar = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const correspondeBusca = (item: ItemEsteira, termo: string): boolean => {
  const busca = normalizar(termo.trim())
  if (!busca) return true
  const texto = [
    item.chamada,
    item.titulo,
    item.descricaoCompleta,
    item.solucao,
    item.softwares.join(' '),
    item.modulo,
    item.menuFuncionalidade,
    item.parceiro,
    item.tags.join(' '),
    item.release,
    item.contexto.release?.codigo,
    item.contexto.release?.nome,
    item.contexto.manual?.codigo,
    item.contexto.manual?.nome,
    item.contexto.projeto?.codigo,
    item.contexto.projeto?.nome
  ]
    .filter(Boolean)
    .join(' ')
  return normalizar(texto).includes(busca)
}

/** Aplica aba, filtros e busca; ordena por chamada (numérica natural). */
export function filtrarItensEsteira(
  itens: ItemEsteira[],
  filtros: FiltrosEsteira,
  busca: string,
  aba: AbaEsteira = 'todas'
): ItemEsteira[] {
  const statusAba = statusDaAba(aba)
  return itens
    .filter((item) => !statusAba || item.status === statusAba)
    .filter((item) => !filtros.status || item.status === filtros.status)
    .filter((item) => temVinculo(item, filtros.origem))
    .filter((item) => correspondeVinculo(item, filtros))
    .filter(
      (item) => !filtros.softwareId || item.softwareIds.includes(filtros.softwareId)
    )
    .filter((item) => !filtros.parceiroId || item.parceiroId === filtros.parceiroId)
    .filter((item) => !filtros.tipo || item.tipo === filtros.tipo)
    .filter((item) => !filtros.impacto || item.impacto === filtros.impacto)
    .filter(
      (item) =>
        !filtros.dataLancamentoDe || item.dataLancamento >= filtros.dataLancamentoDe
    )
    .filter(
      (item) =>
        !filtros.dataLancamentoAte || item.dataLancamento <= filtros.dataLancamentoAte
    )
    .filter(
      (item) =>
        !filtros.dataLiberacaoDe ||
        (Boolean(item.dataLiberacao) && item.dataLiberacao >= filtros.dataLiberacaoDe)
    )
    .filter(
      (item) =>
        !filtros.dataLiberacaoAte ||
        (Boolean(item.dataLiberacao) && item.dataLiberacao <= filtros.dataLiberacaoAte)
    )
    .filter((item) => correspondeBusca(item, busca))
    .sort((a, b) => a.chamada.localeCompare(b.chamada, 'pt-BR', { numeric: true }))
}

/** Transições permitidas pela máquina de estados da esteira. */
export function podeTransicionar(status: StatusChamada, acao: AcaoEsteira): boolean {
  if (acao === 'aprovar' || acao === 'recusar') return status === 'Revisar'
  if (acao === 'reabrir') return status === 'Aprovado' || status === 'Recusado'
  if (acao === 'publicar') return status === 'Aprovado'
  return status === 'Publicar' || status === 'Publicado'
}

/** Parecer é obrigatório na recusa; demais ações aceitam vazio. */
export function validarParecer(acao: AcaoEsteira, parecer: string): string | null {
  const texto = String(parecer ?? '').trim()
  if (acao === 'recusar' && !texto) return 'Informe o parecer da recusa.'
  if (texto.length > MAX_PARECER_ESTEIRA) {
    return `O parecer deve ter no máximo ${MAX_PARECER_ESTEIRA} caracteres.`
  }
  return null
}
