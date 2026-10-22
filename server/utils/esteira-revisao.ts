// Camada da Esteira de Revisão: o ciclo ativo de `entregas_itens` (conteúdo pai
// não arquivado e não publicado), com o contexto dos vínculos, a última decisão
// e o progresso global. A transição em si vem de `lancar-chamadas.ts`.
import { query } from './db'
import {
  buscarChamada,
  listarChamadas,
  listarOpcoesChamadas
} from './lancar-chamadas'
import { listarHistoricoItem } from './historico-esteira'
import {
  calcularProgresso,
  contextoAtivo,
  type ContextoVinculo,
  type HistoricoEsteira,
  type ItemEsteira,
  type ProgressoEsteira
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
  arquivada: Number(row.arquivada ?? 0) === 1
})

async function carregarPais(): Promise<MapasPais> {
  const [releases, manuais, projetos] = await Promise.all([
    query<Row[]>('SELECT id, codigo, nome, status, arquivada FROM release_week'),
    query<Row[]>('SELECT id, codigo, titulo AS nome, status, arquivada FROM manuais_mensal'),
    query<Row[]>('SELECT id, codigo, nome, status, arquivada FROM projetos_escopo')
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

function itemDoCicloAtivo(item: ItemEsteira): boolean {
  return (
    contextoAtivo(item.contexto.release) ||
    contextoAtivo(item.contexto.manual) ||
    contextoAtivo(item.contexto.projeto)
  )
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
  opcoes: CatalogosChamada
  progresso: ProgressoEsteira
}

/** Fila do ciclo ativo + opções de filtro + progresso global. */
export async function listarEsteira(): Promise<RespostaEsteira> {
  const [chamadas, mapas, opcoesBase] = await Promise.all([
    listarChamadas(),
    carregarPais(),
    listarOpcoesChamadas()
  ])
  const decisoes = await listarUltimasDecisoes(chamadas.map((chamada) => chamada.id))
  const itens = chamadas
    .map((chamada) => montarItem(chamada, mapas, decisoes))
    .filter(itemDoCicloAtivo)

  return {
    itens,
    opcoes: filtrarOpcoesAtivas(opcoesBase, mapas),
    progresso: calcularProgresso(itens)
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
