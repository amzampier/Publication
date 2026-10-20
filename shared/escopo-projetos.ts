// Regras puras do módulo Escopo de Projetos — compartilhadas entre app, server
// e testes (`#shared/escopo-projetos`). Sem imports de Nuxt/Vue.
// A fonte de verdade dos dados é a API `/api/escopo-projetos`; este arquivo
// concentra validação, código, filtros, KPIs e helpers de apresentação.

export type StatusEscopo = 'Em Andamento' | 'Homologação' | 'Concluído' | 'Publicado'
export type TipoItem = 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
export type ImpactoItem = 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
export type SituacaoItem = 'Desenvolvimento' | 'Homologação' | 'Implantado'
export type StatusItem = 'Revisar' | 'Aprovado' | 'Publicar'

export const STATUS_ESCOPO: StatusEscopo[] = [
  'Em Andamento',
  'Homologação',
  'Concluído',
  'Publicado'
]

export const VARIANTE_POR_STATUS: Record<
  StatusEscopo,
  'aberta' | 'inReview' | 'done' | 'publicado'
> = {
  'Em Andamento': 'aberta',
  Homologação: 'inReview',
  Concluído: 'done',
  Publicado: 'publicado'
}

export interface ProjetoEscopoModelo {
  id: string
  codigo: string
  nome: string
  versao: string
  ano: number
  dataInicio: string
  dataFinal: string
  dataPrevisao: string
  dataPublicacao: string
  status: StatusEscopo
  /** Nomes distintos dos softwares das chamadas; o JSON do banco não é a fonte. */
  softwaresContemplados: string[]
  descricaoGeral: string
  totalVisualizacoes: number
  itensCount: number
  arquivada: boolean
  criadoEm: string
  atualizadoEm: string
}

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

export interface ItemProjeto {
  id: string
  projetoId: string
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

export interface FiltrosEscopo {
  status: string
  ano: string
  versao: string
  software: string
}

export interface KpisEscopo {
  emAndamento: number
  homologacao: number
  concluidos: number
  publicados: number
}

export type CampoEscopo =
  | 'nome'
  | 'versao'
  | 'ano'
  | 'dataInicio'
  | 'dataFinal'
  | 'dataPrevisao'
  | 'dataPublicacao'
  | 'status'

export interface ResultadoValidacao {
  valido: boolean
  erros: Partial<Record<CampoEscopo, string>>
  primeiroErro: CampoEscopo | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Chave normalizada de identidade `(ano, versao)` (case-insensitive). */
export function chaveAnoVersao(ano: number | string, versao: string): string {
  return `${Number(ano)}-${String(versao).trim().toLowerCase()}`
}

/** Formata `yyyy-mm-dd` (ou ISO) em `dd/mm/aaaa`, sem deslocamento de fuso. */
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

/** Período legível: `dd/mm/aaaa a dd/mm/aaaa`. */
export function formatarPeriodo(inicio: string, fim: string): string {
  return `${formatarData(inicio)} a ${formatarData(fim)}`
}

/** Número no padrão pt-BR (ex.: 1.280). */
export function formatarNumero(valor: number): string {
  return Number(valor || 0).toLocaleString('pt-BR')
}

/** Nomes dos softwares; a API já devolve os nomes distintos dos itens. */
export function softwaresTexto(nomes: string[]): string {
  if (!nomes.length) return '—'
  return nomes.join(', ')
}

/** Código canônico do escopo: `PE-<ano>.<sequencial>` (ex.: `PE-2026.01`). */
export function gerarCodigo(ano: number, sequencia: number): string {
  return `PE-${ano}.${String(sequencia).padStart(2, '0')}`
}

/** Próximo código livre do ano, olhando os códigos já existentes. */
export function proximoCodigo(ano: number, existentes: ProjetoEscopoModelo[]): string {
  let maior = 0
  for (const escopo of existentes) {
    const m = /^PE-(\d{4})\.(\d+)$/.exec(escopo.codigo)
    if (!m || Number(m[1]) !== ano) continue
    maior = Math.max(maior, Number(m[2]))
  }
  return gerarCodigo(ano, maior + 1)
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

/** Data local de hoje em `AAAA-MM-DD`. */
export function hojeIso(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Valida os campos do escopo. `existentes`/`idAtual` cobrem a unicidade de
 * `(ano, versao)`; o código é gerado pelo servidor e não entra na validação.
 */
export function validarEscopo(
  dados: {
    nome?: unknown
    versao?: unknown
    ano?: unknown
    dataInicio?: unknown
    dataFinal?: unknown
    dataPrevisao?: unknown
    dataPublicacao?: unknown
    status?: unknown
  },
  existentes: ProjetoEscopoModelo[] = [],
  idAtual?: string
): ResultadoValidacao {
  const erros: Partial<Record<CampoEscopo, string>> = {}

  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : ''
  if (!nome) erros.nome = 'Informe o nome do escopo.'
  else if (nome.length > 255) erros.nome = 'O nome deve ter no máximo 255 caracteres.'

  const versao = typeof dados.versao === 'string' ? dados.versao.trim() : ''
  if (!versao) erros.versao = 'Informe a versão do escopo.'
  else if (versao.length > 50) erros.versao = 'A versão deve ter no máximo 50 caracteres.'

  const ano = Number(dados.ano)
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
    erros.ano = 'Informe um ano válido.'
  }

  const datas: Array<
    ['dataInicio' | 'dataFinal' | 'dataPrevisao' | 'dataPublicacao', string, string]
  > = [
    ['dataInicio', 'Informe a data de início.', 'A data de início é inválida.'],
    ['dataFinal', 'Informe a data final.', 'A data final é inválida.'],
    ['dataPrevisao', 'Informe a data de previsão.', 'A data de previsão é inválida.'],
    ['dataPublicacao', 'Informe a data de publicação.', 'A data de publicação é inválida.']
  ]
  for (const [campo, obrigatorio, invalido] of datas) {
    const valor = typeof dados[campo] === 'string' ? (dados[campo] as string) : ''
    if (!valor) erros[campo] = obrigatorio
    else if (!ehDataIso(valor)) erros[campo] = invalido
  }

  if (
    !erros.dataInicio &&
    !erros.dataFinal &&
    typeof dados.dataInicio === 'string' &&
    typeof dados.dataFinal === 'string' &&
    dados.dataFinal < dados.dataInicio
  ) {
    erros.dataFinal = 'A data final não pode ser anterior à data de início.'
  }

  const status = (typeof dados.status === 'string' && dados.status) || 'Em Andamento'
  if (!STATUS_ESCOPO.includes(status as StatusEscopo)) {
    erros.status = 'Selecione um status válido.'
  }

  if (!erros.ano && !erros.versao) {
    const chave = chaveAnoVersao(ano, versao)
    const duplicado = existentes.some(
      (escopo) =>
        escopo.id !== idAtual && chaveAnoVersao(escopo.ano, escopo.versao) === chave
    )
    if (duplicado) erros.versao = 'Já existe um escopo para este ano e versão.'
  }

  const ordem: CampoEscopo[] = [
    'nome',
    'versao',
    'ano',
    'dataInicio',
    'dataFinal',
    'dataPrevisao',
    'dataPublicacao',
    'status'
  ]
  const primeiroErro = ordem.find((campo) => erros[campo]) ?? null
  return { valido: primeiroErro === null, erros, primeiroErro }
}

/** Motivo pelo qual a exclusão está bloqueada (null quando permitida). */
export function motivoBloqueioExclusao(escopo: ProjetoEscopoModelo): string | null {
  if (escopo.arquivada) return 'Escopo arquivado não pode ser excluído.'
  if (escopo.itensCount > 0) return 'Escopo com itens vinculados não pode ser excluído.'
  return null
}

/** Exclusão permitida apenas para escopo não arquivado e sem itens. */
export function podeExcluir(escopo: ProjetoEscopoModelo): boolean {
  return motivoBloqueioExclusao(escopo) === null
}

/** Filtra o conjunto vigente: arquivados nunca aparecem; filtros vazios = todos. */
export function filtrarEscopos(
  escopos: ProjetoEscopoModelo[],
  filtros: FiltrosEscopo
): ProjetoEscopoModelo[] {
  return escopos
    .filter((escopo) => !escopo.arquivada)
    .filter((escopo) => !filtros.status || escopo.status === filtros.status)
    .filter((escopo) => !filtros.ano || String(escopo.ano) === filtros.ano)
    .filter((escopo) => !filtros.versao || escopo.versao === filtros.versao)
    .filter(
      (escopo) => !filtros.software || escopo.softwaresContemplados.includes(filtros.software)
    )
    .sort((a, b) => b.ano - a.ano || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Busca textual sobre o conjunto filtrado. */
export function buscarEscopos(
  escopos: ProjetoEscopoModelo[],
  termo: string
): ProjetoEscopoModelo[] {
  const texto = termo.trim().toLowerCase()
  if (!texto) return escopos
  return escopos.filter((escopo) =>
    [
      escopo.codigo,
      escopo.nome,
      escopo.versao,
      String(escopo.ano),
      escopo.descricaoGeral,
      softwaresTexto(escopo.softwaresContemplados)
    ]
      .join(' ')
      .toLowerCase()
      .includes(texto)
  )
}

/** KPIs (Em Andamento, Homologação, Concluídos, Publicados) do conjunto recebido. */
export function calcularKpis(escopos: ProjetoEscopoModelo[]): KpisEscopo {
  return {
    emAndamento: escopos.filter((escopo) => escopo.status === 'Em Andamento').length,
    homologacao: escopos.filter((escopo) => escopo.status === 'Homologação').length,
    concluidos: escopos.filter((escopo) => escopo.status === 'Concluído').length,
    publicados: escopos.filter((escopo) => escopo.status === 'Publicado').length
  }
}
