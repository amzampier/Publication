// Camada da Esteira de Revisão: as chamadas com vínculo não arquivado (o board
// oculta por padrão os itens em `Publicar` já visíveis no portal, mas os devolve
// para consulta quando o vínculo é filtrado), com o contexto, a última decisão e
// o progresso do ciclo ativo. A transição em si vem de `lancar-chamadas.ts`.
import { query } from './db'
import { cacheado } from './cache'
import { paraIso } from './datas'
import {
  buscarChamada,
  contarProgressoEsteira,
  listarChamadasParaEsteira,
  listarOpcoesChamadas
} from './lancar-chamadas'
import { listarHistoricoItem } from './historico-esteira'
import {
  contextoAtivo,
  itemComVinculoAtivo,
  type ContextoVinculo,
  type HistoricoEsteira,
  type ItemEsteira,
  type ProgressoEsteira,
  type ProgressoVinculo
} from '#shared/esteira-revisao'
import type { CatalogosChamada } from '#shared/lancar-chamadas'
import type { ChamadaModelo } from '#shared/lancar-chamadas'

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

const dataIso = (valor: unknown): string => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? valor : data.toISOString()
  }
  return ''
}

interface MapasPais {
  releases: Map<string, ContextoVinculo>
  manuais: Map<string, ContextoVinculo>
  projetos: Map<string, ContextoVinculo>
}

interface Decisao {
  responsavelId: string
  responsavelNome: string
  parecer: string
  dataTransicao: string
}

const montarContexto = (row: Row): ContextoVinculo => ({
  id: texto(row.id),
  codigo: texto(row.codigo),
  nome: texto(row.nome),
  status: texto(row.status),
  arquivada: Number(row.arquivada ?? 0) === 1,
  publicadoEm: paraIso(row.publicado_em)
})

async function carregarPais(): Promise<MapasPais> {
  const [releases, manuais, projetos] = await Promise.all([
    query<Row[]>('SELECT id, codigo, nome, status, arquivada, publicado_em FROM release_week'),
    query<Row[]>('SELECT id, codigo, titulo AS nome, status, arquivada, publicado_em FROM manuais_mensal'),
    query<Row[]>('SELECT id, codigo, nome, status, arquivada, publicado_em FROM projetos_escopo')
  ])
  const mapa = (linhas: Row[]): Map<string, ContextoVinculo> =>
    new Map(linhas.map((linha) => [texto(linha.id), montarContexto(linha)]))
  return {
    releases: mapa(releases),
    manuais: mapa(manuais),
    projetos: mapa(projetos)
  }
}

/** Última decisão (data + revisor + parecer) por item, em uma única query. */
async function listarUltimasDecisoes(ids: string[]): Promise<Map<string, Decisao>> {
  const decisoes = new Map<string, Decisao>()
  if (!ids.length) return decisoes
  const placeholders = ids.map(() => '?').join(', ')
  const linhas = await query<Row[]>(
    `SELECT entrega_item_id, responsavel_id, responsavel_nome, parecer_tecnico, data_transicao
       FROM historico_esteira_revisao
      WHERE entrega_item_id IN (${placeholders})
      ORDER BY data_transicao DESC, id DESC`,
    ids
  )
  for (const linha of linhas) {
    const itemId = texto(linha.entrega_item_id)
    if (decisoes.has(itemId)) continue
    decisoes.set(itemId, {
      responsavelId: texto(linha.responsavel_id),
      responsavelNome: texto(linha.responsavel_nome),
      parecer: texto(linha.parecer_tecnico),
      dataTransicao: dataIso(linha.data_transicao)
    })
  }
  return decisoes
}

function montarItem(
  chamada: ChamadaModelo,
  mapas: MapasPais,
  decisoes: Map<string, Decisao>
): ItemEsteira {
  const decisao = decisoes.get(chamada.id)
  return {
    ...chamada,
    contexto: {
      release: chamada.releaseId ? mapas.releases.get(chamada.releaseId) ?? null : null,
      manual: chamada.manualId ? mapas.manuais.get(chamada.manualId) ?? null : null,
      projeto: chamada.projetoId ? mapas.projetos.get(chamada.projetoId) ?? null : null
    },
    revisorId: decisao?.responsavelId ?? '',
    revisorNome: decisao?.responsavelNome ?? '',
    dataDecisao: decisao?.dataTransicao ?? '',
    parecer: decisao?.parecer ?? ''
  }
}

function filtrarOpcoesAtivas(
  opcoes: CatalogosChamada,
  mapas: MapasPais
): CatalogosChamada {
  const ativa = (id: string, mapa: Map<string, ContextoVinculo>): boolean => {
    const contexto = mapa.get(id)
    return Boolean(contexto && contextoAtivo(contexto))
  }
  return {
    ...opcoes,
    releases: opcoes.releases.filter((opcao) => ativa(opcao.id, mapas.releases)),
    manuais: opcoes.manuais.filter((opcao) => ativa(opcao.id, mapas.manuais)),
    projetos: opcoes.projetos.filter((opcao) => ativa(opcao.id, mapas.projetos))
  }
}

export interface RespostaEsteira {
  itens: ItemEsteira[]
  total: number
  pagina: number
  porPagina: number
  opcoes: CatalogosChamada
  progresso: ProgressoEsteira
}

const progressoVinculo = (c: Record<string, number>, prefixo = ''): ProgressoVinculo => {
  const revisar = c[`${prefixo}revisar`] ?? 0
  const aprovado = c[`${prefixo}aprovado`] ?? 0
  const recusado = c[`${prefixo}recusado`] ?? 0
  const publicar = c[`${prefixo}publicar`] ?? 0
  const publicado = c[`${prefixo}publicado`] ?? 0
  const total = revisar + aprovado + recusado + publicar
  const revisado = aprovado + publicar
  return {
    total,
    revisar,
    aprovado,
    recusado,
    publicar,
    aguardando: publicar,
    publicado,
    revisado,
    percentualRevisado: total ? Math.round((revisado / total) * 100) : 0,
    percentualAprovado: total ? Math.round((aprovado / total) * 100) : 0
  }
}

const montarProgresso = (c: Record<string, number>): ProgressoEsteira => ({
  ...progressoVinculo(c),
  porVinculo: {
    release: progressoVinculo(c, 'release_'),
    manual: progressoVinculo(c, 'manual_'),
    projeto: progressoVinculo(c, 'projeto_')
  }
})

/** Progresso global do ciclo ativo, usado pela sincronização após transições. */
export async function obterProgressoEsteira(): Promise<ProgressoEsteira> {
  return montarProgresso(await contarProgressoEsteira())
}

/** Fila do ciclo ativo + opções de filtro + progresso global. */
export async function listarEsteira(
  pagina = 1,
  porPagina = 200,
  status = ''
): Promise<RespostaEsteira> {
  const page = Math.max(1, Math.trunc(pagina))
  const size = Math.min(500, Math.max(1, Math.trunc(porPagina)))
  const [{ chamadas, total }, mapas, progresso] = await Promise.all([
    listarChamadasParaEsteira(page, size, status),
    carregarPais(),
    contarProgressoEsteira()
  ])
  // Os catálogos de filtro mudam pouco e são caros (5 consultas). O TTL curto
  // absorve picos do board; as escritas de chamadas invalidam a chave.
  const opcoesBase = await cacheado('chamadas-opcoes', 10_000, listarOpcoesChamadas)
  const decisoes = await listarUltimasDecisoes(chamadas.map((chamada) => chamada.id))
  const itens = chamadas
    .map((chamada) => montarItem(chamada, mapas, decisoes))
    .filter(itemComVinculoAtivo)

  return {
    itens,
    total,
    pagina: page,
    porPagina: size,
    opcoes: filtrarOpcoesAtivas(opcoesBase, mapas),
    progresso: montarProgresso(progresso)
  }
}

/** Detalhe de um item com o contexto dos vínculos (independente do ciclo ativo). */
export async function buscarItemEsteira(id: string): Promise<ItemEsteira | null> {
  const chamada = await buscarChamada(id)
  if (!chamada) return null
  const mapas = await carregarPais()
  const decisoes = await listarUltimasDecisoes([id])
  return montarItem(chamada, mapas, decisoes)
}

export async function buscarHistoricoEsteira(id: string): Promise<HistoricoEsteira[]> {
  return listarHistoricoItem(id)
}
