// Leitura anônima do conteúdo editorial publicado para a navegação da Área
// Pública. O DTO não expõe autoria, revisão, descrição, anexos ou auditoria.
import type {
  PublicoEscopoResumo,
  PublicoManualResumo,
  PublicoNavegacao,
  PublicoReleaseResumo,
  PublicoSistemaResumo
} from '#shared/publico'
import { query } from './db'
import { paraIso } from './datas'

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

const numero = (valor: unknown): number => Number(valor ?? 0)

const iso = (valor: unknown): string => paraIso(valor) ?? ''

const booleano = (valor: unknown): boolean => Number(valor ?? 0) === 1

const gatePai = (alias: string): string =>
  `${alias}.status = 'Publicado' AND ${alias}.arquivada = 0
   AND ${alias}.publicado_em IS NOT NULL AND ${alias}.publicado_em <= NOW(6)`

async function listarReleases(): Promise<PublicoReleaseResumo[]> {
  const linhas = await query<Row[]>(
    `SELECT r.id, r.ano, r.mes, r.semana, r.versao, r.\`release\` AS release_codigo,
            r.destaque_semana, r.publicado_em,
            (SELECT COUNT(*)
               FROM entregas_itens e
              WHERE e.release_id = r.id
                AND e.status = 'Publicado'
                AND e.publicado_em IS NOT NULL
                AND e.publicado_em <= NOW(6)) AS chamadas
       FROM release_week r
      WHERE ${gatePai('r')}
      ORDER BY r.ano DESC, r.semana DESC`
  )

  return linhas.map((linha) => ({
    id: texto(linha.id),
    ano: numero(linha.ano),
    mes: texto(linha.mes),
    semana: numero(linha.semana),
    versao: texto(linha.versao),
    release: texto(linha.release_codigo),
    destaqueSemana: booleano(linha.destaque_semana),
    chamadas: numero(linha.chamadas),
    publicadoEm: iso(linha.publicado_em)
  }))
}

async function listarManuais(): Promise<PublicoManualResumo[]> {
  const linhas = await query<Row[]>(
    `SELECT m.id, m.ano, m.mes, m.mes_numero, m.titulo, m.publicado_em
       FROM manuais_mensal m
      WHERE ${gatePai('m')}
      ORDER BY m.ano DESC, m.mes_numero DESC`
  )

  return linhas.map((linha) => ({
    id: texto(linha.id),
    ano: numero(linha.ano),
    mes: texto(linha.mes),
    mesNumero: numero(linha.mes_numero),
    titulo: texto(linha.titulo),
    publicadoEm: iso(linha.publicado_em)
  }))
}

async function listarEscopos(): Promise<PublicoEscopoResumo[]> {
  const linhas = await query<Row[]>(
    `SELECT p.id, p.codigo, p.nome, p.versao, p.ano, p.publicado_em,
            (SELECT COUNT(*)
               FROM entregas_itens e
              WHERE e.projeto_id = p.id
                AND e.status = 'Publicado'
                AND e.publicado_em IS NOT NULL
                AND e.publicado_em <= NOW(6)) AS chamadas
       FROM projetos_escopo p
      WHERE ${gatePai('p')}
      ORDER BY p.ano DESC, p.nome ASC`
  )

  if (!linhas.length) return []

  const ids = linhas.map((linha) => texto(linha.id)).filter(Boolean)
  const placeholders = ids.map(() => '?').join(', ')
  const sistemas = await query<Row[]>(
    `SELECT projeto_id, nome, SUM(chamadas) AS chamadas
       FROM (
         SELECT e.projeto_id, TRIM(j.software_nome) AS nome, COUNT(DISTINCT e.id) AS chamadas
           FROM entregas_itens e
           JOIN entregas_itens_softwares j ON j.entrega_item_id = e.id
          WHERE e.projeto_id IN (${placeholders})
            AND e.status = 'Publicado'
            AND e.publicado_em IS NOT NULL
            AND e.publicado_em <= NOW(6)
            AND TRIM(j.software_nome) <> ''
          GROUP BY e.projeto_id, TRIM(j.software_nome)

         UNION ALL

         SELECT e.projeto_id,
                COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) AS nome,
                COUNT(DISTINCT e.id) AS chamadas
           FROM entregas_itens e
           LEFT JOIN softwares sw ON sw.codigo = e.software_id
          WHERE e.projeto_id IN (${placeholders})
            AND e.status = 'Publicado'
            AND e.publicado_em IS NOT NULL
            AND e.publicado_em <= NOW(6)
            AND NOT EXISTS (
              SELECT 1 FROM entregas_itens_softwares x WHERE x.entrega_item_id = e.id
            )
            AND COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) IS NOT NULL
          GROUP BY e.projeto_id, nome
       ) AS sistemas
      GROUP BY projeto_id, nome
      ORDER BY projeto_id ASC, nome ASC`,
    [...ids, ...ids]
  )

  const sistemasPorProjeto = new Map<string, PublicoSistemaResumo[]>()
  for (const linha of sistemas) {
    const projetoId = texto(linha.projeto_id)
    const nome = texto(linha.nome)
    if (!projetoId || !nome) continue
    const lista = sistemasPorProjeto.get(projetoId) ?? []
    lista.push({ nome, chamadas: numero(linha.chamadas) })
    sistemasPorProjeto.set(projetoId, lista)
  }

  return linhas.map((linha) => ({
    id: texto(linha.id),
    codigo: texto(linha.codigo),
    nome: texto(linha.nome),
    versao: texto(linha.versao),
    ano: numero(linha.ano),
    chamadas: numero(linha.chamadas),
    sistemas: sistemasPorProjeto.get(texto(linha.id)) ?? [],
    publicadoEm: iso(linha.publicado_em)
  }))
}

export async function listarNavegacaoPublica(): Promise<PublicoNavegacao> {
  const [releases, manuais, escopos] = await Promise.all([
    listarReleases(),
    listarManuais(),
    listarEscopos()
  ])

  return { releases, manuais, escopos }
}
