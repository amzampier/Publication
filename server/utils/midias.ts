// Persistencia e leitura das imagens da chamada em `anexos_midias`.
// A tabela e a fonte de verdade; `entregas_itens.imagens` permanece como
// snapshot legado por compatibilidade e nao e lida quando ha linhas relacionais.
import { query } from './db'
import type { ExecutorSql } from './historico-esteira'
import {
  mimeDaUrl,
  nomeArquivoDaUrl,
  normalizarImagensChamada,
  type ImagemChamada
} from '#shared/lancar-chamadas'

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor).trim()

const numero = (valor: unknown): number => {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

const COLUNAS = `m.id, m.entrega_item_id, m.url_arquivo, m.legenda_alt,
  m.ordem_exibicao, m.destaque_capa, m.tipo_mime, m.tamanho_bytes`

const montarMidia = (row: Row): ImagemChamada => {
  const url = texto(row.url_arquivo)
  return {
    id: texto(row.id),
    url,
    alt: texto(row.legenda_alt),
    ordem: numero(row.ordem_exibicao),
    capa: numero(row.destaque_capa) === 1,
    mime: texto(row.tipo_mime) || mimeDaUrl(url),
    bytes: row.tamanho_bytes == null ? null : numero(row.tamanho_bytes)
  }
}

/** Carrega as midias de varias chamadas em uma unica consulta, ja ordenadas. */
export async function carregarMidiasPorItem(
  ids: string[]
): Promise<Map<string, ImagemChamada[]>> {
  const mapa = new Map<string, ImagemChamada[]>()
  if (!ids.length) return mapa
  const placeholders = ids.map(() => '?').join(', ')
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS}
       FROM anexos_midias m
      WHERE m.entrega_item_id IN (${placeholders})
      ORDER BY m.entrega_item_id ASC, m.ordem_exibicao ASC, m.criado_em ASC, m.id ASC`,
    ids
  )
  for (const linha of linhas) {
    const itemId = texto(linha.entrega_item_id)
    const lista = mapa.get(itemId) ?? []
    lista.push(montarMidia(linha))
    mapa.set(itemId, lista)
  }
  return mapa
}

/**
 * Sincroniza as linhas da chamada com a lista de URLs na ordem recebida.
 * Remove as ausentes e faz upsert por (entrega_item_id, url_arquivo),
 * preservando `legenda_alt` de linhas ja existentes.
 */
export async function sincronizarMidias(
  executor: ExecutorSql,
  itemId: string,
  urls: string[]
): Promise<void> {
  const normalizadas = normalizarImagensChamada(urls)
  if (!normalizadas.length) {
    await executor.query('DELETE FROM anexos_midias WHERE entrega_item_id = ?', [itemId])
    return
  }

  const placeholders = normalizadas.map(() => '?').join(', ')
  await executor.query(
    `DELETE FROM anexos_midias
      WHERE entrega_item_id = ? AND url_arquivo NOT IN (${placeholders})`,
    [itemId, ...normalizadas]
  )

  for (const [indice, url] of normalizadas.entries()) {
    await executor.query(
      `INSERT INTO anexos_midias
        (entrega_item_id, url_arquivo, nome_arquivo, tipo_mime,
         ordem_exibicao, destaque_capa)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nome_arquivo = VALUES(nome_arquivo),
         tipo_mime = VALUES(tipo_mime),
         ordem_exibicao = VALUES(ordem_exibicao),
         destaque_capa = VALUES(destaque_capa)`,
      [
        itemId,
        url,
        nomeArquivoDaUrl(url),
        mimeDaUrl(url),
        indice,
        indice === 0 ? 1 : 0
      ]
    )
  }
}

/** Outra chamada ainda referencia a URL? (checagem indexada por url_arquivo). */
export async function urlReferenciadaPorOutraChamada(
  url: string,
  itemId: string
): Promise<boolean> {
  const linhas = await query<Row[]>(
    `SELECT id FROM anexos_midias
      WHERE entrega_item_id <> ? AND url_arquivo = ?
      LIMIT 1`,
    [itemId, url]
  )
  return linhas.length > 0
}
