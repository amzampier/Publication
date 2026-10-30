// Leitura anônima do conteúdo editorial publicado para a navegação da Área
// Pública. O DTO não expõe autoria, revisão, descrição, anexos ou auditoria.
import {
  normalizarPagina,
  normalizarPorPagina,
  normalizarSistema,
  normalizarSoftware,
  normalizarTipo,
  ranquearMaisVistas,
  selecionarManuaisDestaque,
  selecionarReleaseDestaque,
  TIPOS_ITEM,
  type PublicoChamadaCritica,
  type PublicoChamadaDestaque,
  type PublicoChamadaEscopo,
  type PublicoEscopoChamadas,
  type PublicoEscopoDetalhe,
  type PublicoEscopoResumo,
  type PublicoEvidencia,
  type PublicoFiltrosPainel,
  type PublicoHistorico,
  type PublicoManualDestaqueResumo,
  type PublicoManualItemDestaque,
  type PublicoManualResumo,
  type PublicoNavegacao,
  type PublicoPainel,
  type PublicoReleaseDestaque,
  type PublicoReleaseResumo,
  type PublicoReleaseResumoPainel,
  type PublicoSistemaResumo
} from '#shared/publico'
import { normalizarTagsChamada } from '#shared/lancar-chamadas'
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

const gateChamada = (alias: string): string =>
  `${alias}.status = 'Publicado' AND ${alias}.publicado_em IS NOT NULL
   AND ${alias}.publicado_em <= NOW(6)`

const dataDia = (valor: unknown): string => {
  if (valor instanceof Date) {
    const ano = valor.getFullYear()
    const mes = String(valor.getMonth() + 1).padStart(2, '0')
    const dia = String(valor.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  return texto(valor).slice(0, 10)
}

const tagsJson = (valor: unknown): string[] => {
  if (Array.isArray(valor)) return normalizarTagsChamada(valor)
  if (typeof valor === 'string' && valor) {
    try {
      return normalizarTagsChamada(JSON.parse(valor))
    } catch {
      return []
    }
  }
  return []
}

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

async function listarSistemasPorEscopo(
  ids: string[]
): Promise<Map<string, PublicoSistemaResumo[]>> {
  const sistemasPorProjeto = new Map<string, PublicoSistemaResumo[]>()
  if (!ids.length) return sistemasPorProjeto

  const placeholders = ids.map(() => '?').join(', ')
  const sistemas = await query<Row[]>(
    `SELECT projeto_id, nome, SUM(chamadas) AS chamadas
       FROM (
         SELECT e.projeto_id, TRIM(j.software_nome) AS nome, COUNT(DISTINCT e.id) AS chamadas
           FROM entregas_itens e
           JOIN entregas_itens_softwares j ON j.entrega_item_id = e.id
          WHERE e.projeto_id IN (${placeholders})
            AND ${gateChamada('e')}
            AND TRIM(j.software_nome) <> ''
          GROUP BY e.projeto_id, TRIM(j.software_nome)

         UNION ALL

         SELECT e.projeto_id,
                COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) AS nome,
                COUNT(DISTINCT e.id) AS chamadas
           FROM entregas_itens e
           LEFT JOIN softwares sw ON sw.codigo = e.software_id
          WHERE e.projeto_id IN (${placeholders})
            AND ${gateChamada('e')}
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

  for (const linha of sistemas) {
    const projetoId = texto(linha.projeto_id)
    const nome = texto(linha.nome)
    if (!projetoId || !nome) continue
    const lista = sistemasPorProjeto.get(projetoId) ?? []
    lista.push({ nome, chamadas: numero(linha.chamadas) })
    sistemasPorProjeto.set(projetoId, lista)
  }

  return sistemasPorProjeto
}

async function listarEscopos(): Promise<PublicoEscopoResumo[]> {
  const linhas = await query<Row[]>(
    `SELECT p.id, p.codigo, p.nome, p.versao, p.ano, p.publicado_em,
            (SELECT COUNT(DISTINCT e.id)
               FROM entregas_itens e
              WHERE e.projeto_id = p.id
                AND ${gateChamada('e')}) AS chamadas
       FROM projetos_escopo p
      WHERE ${gatePai('p')}
      ORDER BY p.ano DESC, p.nome ASC`
  )

  if (!linhas.length) return []

  const sistemasPorProjeto = await listarSistemasPorEscopo(
    linhas.map((linha) => texto(linha.id)).filter(Boolean)
  )

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

/** Escopo público por id; `null` quando inexistente, não publicado ou arquivado. */
export async function buscarEscopoPublico(
  id: string
): Promise<PublicoEscopoDetalhe | null> {
  const linhas = await query<Row[]>(
    `SELECT p.id, p.codigo, p.nome, p.versao, p.ano, p.publicado_em,
            (SELECT COUNT(DISTINCT e.id)
               FROM entregas_itens e
              WHERE e.projeto_id = p.id
                AND ${gateChamada('e')}) AS chamadas
       FROM projetos_escopo p
      WHERE p.id = ? AND ${gatePai('p')}
      LIMIT 1`,
    [id]
  )

  const linha = linhas[0]
  if (!linha) return null

  const sistemas = await listarSistemasPorEscopo([id])
  return {
    id: texto(linha.id),
    codigo: texto(linha.codigo),
    nome: texto(linha.nome),
    versao: texto(linha.versao),
    ano: numero(linha.ano),
    chamadas: numero(linha.chamadas),
    sistemas: sistemas.get(id) ?? [],
    publicadoEm: iso(linha.publicado_em)
  }
}

async function carregarSoftwaresPorItem(ids: string[]): Promise<Map<string, string[]>> {
  const mapa = new Map<string, string[]>()
  if (!ids.length) return mapa

  const placeholders = ids.map(() => '?').join(', ')
  const linhas = await query<Row[]>(
    `SELECT j.entrega_item_id, TRIM(j.software_nome) AS nome
       FROM entregas_itens_softwares j
      WHERE j.entrega_item_id IN (${placeholders})
        AND TRIM(j.software_nome) <> ''
     UNION
     SELECT e.id AS entrega_item_id,
            COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) AS nome
       FROM entregas_itens e
       LEFT JOIN softwares sw ON sw.codigo = e.software_id
      WHERE e.id IN (${placeholders})
        AND NOT EXISTS (
          SELECT 1 FROM entregas_itens_softwares x WHERE x.entrega_item_id = e.id
        )
        AND COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) IS NOT NULL
     ORDER BY entrega_item_id ASC, nome ASC`,
    [...ids, ...ids]
  )

  for (const linha of linhas) {
    const itemId = texto(linha.entrega_item_id)
    const nome = texto(linha.nome)
    if (!itemId || !nome) continue
    const lista = mapa.get(itemId) ?? []
    if (!lista.includes(nome)) lista.push(nome)
    mapa.set(itemId, lista)
  }

  return mapa
}

async function carregarEvidenciasPorItem(
  ids: string[]
): Promise<Map<string, PublicoEvidencia[]>> {
  const mapa = new Map<string, PublicoEvidencia[]>()
  if (!ids.length) return mapa

  const placeholders = ids.map(() => '?').join(', ')
  const linhas = await query<Row[]>(
    `SELECT m.id, m.entrega_item_id, m.url_arquivo, m.legenda_alt, m.destaque_capa
       FROM anexos_midias m
      WHERE m.entrega_item_id IN (${placeholders})
        AND m.tipo_mime LIKE 'image/%'
      ORDER BY m.entrega_item_id ASC, m.destaque_capa DESC, m.ordem_exibicao ASC,
               m.criado_em ASC, m.id ASC`,
    ids
  )

  for (const linha of linhas) {
    const itemId = texto(linha.entrega_item_id)
    const url = texto(linha.url_arquivo)
    if (!itemId || !url) continue
    const lista = mapa.get(itemId) ?? []
    lista.push({
      id: texto(linha.id),
      url,
      alt: texto(linha.legenda_alt),
      capa: booleano(linha.destaque_capa)
    })
    mapa.set(itemId, lista)
  }

  return mapa
}

/** Chamadas públicas do escopo, opcionalmente filtradas por sistema. */
export async function listarChamadasEscopoPublico(params: {
  id: string
  sistema?: unknown
  pagina?: unknown
  porPagina?: unknown
}): Promise<PublicoEscopoChamadas> {
  const sistema = normalizarSistema(params.sistema)
  const pagina = normalizarPagina(params.pagina)
  const porPagina = normalizarPorPagina(params.porPagina)
  const offset = (pagina - 1) * porPagina
  const filtros: string[] = []
  const valores: unknown[] = []

  if (sistema) {
    filtros.push(`(
      EXISTS (SELECT 1 FROM entregas_itens_softwares j
               WHERE j.entrega_item_id = e.id AND j.software_nome = ?)
      OR (
        NOT EXISTS (SELECT 1 FROM entregas_itens_softwares j WHERE j.entrega_item_id = e.id)
        AND COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) = ?
      )
    )`)
    valores.push(sistema, sistema)
  }

  const filtroSql = filtros.length ? ` AND ${filtros.join(' AND ')}` : ''
  const [linhas, totais] = await Promise.all([
    query<Row[]>(
      `SELECT e.id, e.chamada, e.titulo, e.descricao_completa, e.solucao, e.tipo,
              e.impacto, e.modulo, e.parceiro, e.manual_titulo, e.data_liberacao,
              e.link_manual, e.link_video, e.tags
         FROM entregas_itens e
         LEFT JOIN softwares sw ON sw.codigo = e.software_id
        WHERE e.projeto_id = ? AND ${gateChamada('e')}${filtroSql}
        ORDER BY e.ordem_apresentacao ASC, e.chamada ASC
        LIMIT ? OFFSET ?`,
      [params.id, ...valores, porPagina, offset]
    ),
    query<Row[]>(
      `SELECT COUNT(DISTINCT e.id) AS total
         FROM entregas_itens e
         LEFT JOIN softwares sw ON sw.codigo = e.software_id
        WHERE e.projeto_id = ? AND ${gateChamada('e')}${filtroSql}`,
      [params.id, ...valores]
    )
  ])

  const ids = linhas.map((linha) => texto(linha.id)).filter(Boolean)
  const [softwares, evidencias] = await Promise.all([
    carregarSoftwaresPorItem(ids),
    carregarEvidenciasPorItem(ids)
  ])

  return {
    itens: linhas.map((linha) => ({
      id: texto(linha.id),
      chamada: texto(linha.chamada),
      titulo: texto(linha.titulo),
      descricao: texto(linha.descricao_completa),
      solucao: texto(linha.solucao),
      tipo: texto(linha.tipo) as PublicoChamadaEscopo['tipo'],
      impacto: texto(linha.impacto) as PublicoChamadaEscopo['impacto'],
      modulo: texto(linha.modulo),
      parceiro: texto(linha.parceiro),
      manualTitulo: texto(linha.manual_titulo),
      softwares: softwares.get(texto(linha.id)) ?? [],
      tags: tagsJson(linha.tags),
      evidencias: evidencias.get(texto(linha.id)) ?? [],
      linkManual: texto(linha.link_manual),
      linkVideo: texto(linha.link_video),
      dataLiberacao: dataDia(linha.data_liberacao)
    })),
    total: numero(totais[0]?.total),
    pagina,
    porPagina,
    sistemaSelecionado: sistema
  }
}

// ---------------------------------------------------------------------------
// Painel de Destaques da Área Pública
// ---------------------------------------------------------------------------

interface ReleasePainelResumo extends PublicoReleaseResumoPainel {
  mes: string
  destaqueSemana: boolean
  revisorNome: string
}

const paraResumoPainel = (row: ReleasePainelResumo): PublicoReleaseResumoPainel => ({
  id: row.id,
  semana: row.semana,
  ano: row.ano,
  versao: row.versao,
  release: row.release,
  nome: row.nome,
  descricao: row.descricao,
  chamadas: row.chamadas,
  contagens: row.contagens,
  publicadoEm: row.publicadoEm,
  totalVisualizacoes: row.totalVisualizacoes
})

async function listarResumosPainel(): Promise<ReleasePainelResumo[]> {
  const linhas = await query<Row[]>(
    `SELECT r.id, r.semana, r.ano, r.mes, r.versao, r.\`release\` AS release_codigo,
            r.nome, r.descricao, r.destaque_semana, r.revisor_nome,
            r.publicado_em, r.total_visualizacoes,
            COALESCE(c.chamadas, 0) AS chamadas,
            COALESCE(c.correcao, 0) AS correcao,
            COALESCE(c.melhoria, 0) AS melhoria,
            COALESCE(c.nova, 0) AS nova
       FROM release_week r
       LEFT JOIN (
         SELECT e.release_id,
                COUNT(*) AS chamadas,
                SUM(CASE WHEN e.tipo = 'Correção' THEN 1 ELSE 0 END) AS correcao,
                SUM(CASE WHEN e.tipo = 'Melhoria' THEN 1 ELSE 0 END) AS melhoria,
                SUM(CASE WHEN e.tipo = 'Nova Funcionalidade' THEN 1 ELSE 0 END) AS nova
           FROM entregas_itens e
          WHERE ${gateChamada('e')}
          GROUP BY e.release_id
       ) c ON c.release_id = r.id
      WHERE ${gatePai('r')}
      ORDER BY r.publicado_em DESC, r.ano DESC, r.semana DESC`
  )

  return linhas.map((linha) => ({
    id: texto(linha.id),
    semana: numero(linha.semana),
    ano: numero(linha.ano),
    mes: texto(linha.mes),
    versao: texto(linha.versao),
    release: texto(linha.release_codigo),
    nome: texto(linha.nome),
    descricao: texto(linha.descricao),
    chamadas: numero(linha.chamadas),
    contagens: {
      correcao: numero(linha.correcao),
      melhoria: numero(linha.melhoria),
      nova: numero(linha.nova)
    },
    publicadoEm: iso(linha.publicado_em),
    totalVisualizacoes: numero(linha.total_visualizacoes),
    destaqueSemana: booleano(linha.destaque_semana),
    revisorNome: texto(linha.revisor_nome)
  }))
}

async function listarChamadasDestaque(releaseId: string): Promise<PublicoChamadaDestaque[]> {
  const linhas = await query<Row[]>(
    `SELECT e.id, e.chamada, e.titulo, e.software, e.modulo, e.tipo, e.parceiro,
            e.link_video, e.link_manual, e.ordem_apresentacao,
            (SELECT COUNT(*) FROM anexos_midias m
              WHERE m.entrega_item_id = e.id AND m.tipo_mime LIKE 'image/%') AS fotos
       FROM entregas_itens e
      WHERE e.release_id = ?
        AND ${gateChamada('e')}
      ORDER BY e.ordem_apresentacao ASC, e.chamada ASC
      LIMIT 3`,
    [releaseId]
  )

  return linhas.map((linha) => ({
    id: texto(linha.id),
    chamada: texto(linha.chamada),
    titulo: texto(linha.titulo),
    software: texto(linha.software),
    modulo: texto(linha.modulo),
    tipo: texto(linha.tipo) as PublicoChamadaDestaque['tipo'],
    parceiro: texto(linha.parceiro),
    fotos: numero(linha.fotos),
    linkVideo: texto(linha.link_video),
    linkManual: texto(linha.link_manual)
  }))
}

async function listarManuaisPainel(): Promise<PublicoManualItemDestaque[]> {
  const linhasManuais = await query<Row[]>(
    `SELECT m.id, m.ano, m.mes, m.mes_numero, m.titulo, m.descricao, m.publicado_em
       FROM manuais_mensal m
      WHERE ${gatePai('m')} AND m.destaque_semana = 1
      ORDER BY m.publicado_em DESC, m.ano DESC, m.mes_numero DESC`
  )

  if (!linhasManuais.length) return []

  const manuais: PublicoManualDestaqueResumo[] = linhasManuais.map((linha) => ({
    id: texto(linha.id),
    ano: numero(linha.ano),
    mes: texto(linha.mes),
    mesNumero: numero(linha.mes_numero),
    titulo: texto(linha.titulo),
    descricao: texto(linha.descricao),
    destaqueSemana: true,
    publicadoEm: iso(linha.publicado_em)
  }))

  const ids = manuais.map((manual) => manual.id)
  const placeholders = ids.map(() => '?').join(', ')
  const linhasItens = await query<Row[]>(
    `SELECT e.id, e.manual_id, e.titulo, e.descricao_completa, e.software, e.modulo,
            e.tipo, e.link_video, e.link_manual, e.ordem_apresentacao, e.publicado_em,
            m.ano, m.mes
       FROM entregas_itens e
       JOIN manuais_mensal m ON m.id = e.manual_id
      WHERE e.manual_id IN (${placeholders})
        AND ${gateChamada('e')}
        AND ${gatePai('m')}
      ORDER BY e.manual_id ASC, e.ordem_apresentacao ASC, e.publicado_em DESC`,
    ids
  )

  const itens: PublicoManualItemDestaque[] = linhasItens.map((linha) => ({
    card: 'item',
    id: texto(linha.id),
    manualId: texto(linha.manual_id),
    titulo: texto(linha.titulo),
    descricao: texto(linha.descricao_completa),
    software: texto(linha.software),
    modulo: texto(linha.modulo),
    tipo: texto(linha.tipo) as PublicoManualItemDestaque['tipo'],
    mes: texto(linha.mes),
    ano: numero(linha.ano),
    linkVideo: texto(linha.link_video),
    linkManual: texto(linha.link_manual),
    publicadoEm: iso(linha.publicado_em)
  }))

  return selecionarManuaisDestaque(manuais, itens)
}

async function listarFiltrosPainel(): Promise<PublicoFiltrosPainel> {
  const [linhasSoftwares, linhasTipos] = await Promise.all([
    query<Row[]>(
      `SELECT DISTINCT nome FROM (
         SELECT TRIM(j.software_nome) AS nome
           FROM entregas_itens e
           JOIN release_week r ON r.id = e.release_id
           JOIN entregas_itens_softwares j ON j.entrega_item_id = e.id
          WHERE ${gatePai('r')} AND ${gateChamada('e')} AND TRIM(j.software_nome) <> ''
         UNION
         SELECT COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) AS nome
           FROM entregas_itens e
           JOIN release_week r ON r.id = e.release_id
           LEFT JOIN softwares sw ON sw.codigo = e.software_id
          WHERE ${gatePai('r')} AND ${gateChamada('e')}
            AND NOT EXISTS (
              SELECT 1 FROM entregas_itens_softwares x WHERE x.entrega_item_id = e.id
            )
            AND COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) IS NOT NULL
       ) AS softwares
      WHERE nome <> ''
      ORDER BY nome ASC`
    ),
    query<Row[]>(
      `SELECT DISTINCT e.tipo
         FROM entregas_itens e
         JOIN release_week r ON r.id = e.release_id
        WHERE ${gatePai('r')} AND ${gateChamada('e')}`
    )
  ])

  const tiposPresentes = new Set(linhasTipos.map((linha) => texto(linha.tipo)))
  return {
    softwares: linhasSoftwares.map((linha) => texto(linha.nome)).filter(Boolean),
    tipos: TIPOS_ITEM.filter((tipo) => tiposPresentes.has(tipo))
  }
}

async function listarEscopoDestaquePainel(): Promise<PublicoEscopoResumo | null> {
  const linhas = await query<Row[]>(
    `SELECT p.id, p.codigo, p.nome, p.versao, p.ano, p.publicado_em,
            (SELECT COUNT(DISTINCT e.id)
               FROM entregas_itens e
              WHERE e.projeto_id = p.id
                AND ${gateChamada('e')}) AS chamadas
       FROM projetos_escopo p
      WHERE ${gatePai('p')}
      ORDER BY p.publicado_em DESC, p.ano DESC, p.versao DESC
      LIMIT 1`
  )

  const linha = linhas[0]
  if (!linha) return null

  const id = texto(linha.id)
  const sistemas = await listarSistemasPorEscopo([id])
  return {
    id,
    codigo: texto(linha.codigo),
    nome: texto(linha.nome),
    versao: texto(linha.versao),
    ano: numero(linha.ano),
    chamadas: numero(linha.chamadas),
    sistemas: sistemas.get(id) ?? [],
    publicadoEm: iso(linha.publicado_em)
  }
}

async function listarChamadasCriticasPainel(
  escopoId: string
): Promise<PublicoChamadaCritica[]> {
  const linhas = await query<Row[]>(
    `SELECT e.id, e.chamada, e.titulo, e.parceiro, e.tipo, e.impacto,
            e.ordem_apresentacao
       FROM entregas_itens e
      WHERE e.projeto_id = ?
        AND e.impacto IN ('Crítico', 'Alto')
        AND ${gateChamada('e')}
      ORDER BY CASE WHEN e.impacto = 'Crítico' THEN 0 ELSE 1 END,
               e.ordem_apresentacao ASC, e.chamada ASC
      LIMIT 3`,
    [escopoId]
  )

  if (!linhas.length) return []
  const ids = linhas.map((linha) => texto(linha.id)).filter(Boolean)
  const softwares = await carregarSoftwaresPorItem(ids)

  return linhas.map((linha) => {
    const id = texto(linha.id)
    return {
      id,
      chamada: texto(linha.chamada),
      titulo: texto(linha.titulo),
      softwares: softwares.get(id) ?? [],
      parceiro: texto(linha.parceiro),
      tipo: texto(linha.tipo) as PublicoChamadaCritica['tipo'],
      impacto: texto(linha.impacto) as PublicoChamadaCritica['impacto']
    }
  })
}

export async function listarPainelPublico(): Promise<PublicoPainel> {
  const [resumos, manuaisDestaque, filtros, escopoDestaque] = await Promise.all([
    listarResumosPainel(),
    listarManuaisPainel(),
    listarFiltrosPainel(),
    listarEscopoDestaquePainel()
  ])
  const chamadasCriticas = escopoDestaque
    ? await listarChamadasCriticasPainel(escopoDestaque.id)
    : []

  const selecionada = selecionarReleaseDestaque(resumos)
  const ranking = ranquearMaisVistas(
    resumos.map(paraResumoPainel),
    selecionada.release?.id ?? null
  )

  let releaseDestaque: PublicoReleaseDestaque | null = null
  if (selecionada.release) {
    releaseDestaque = {
      id: selecionada.release.id,
      semana: selecionada.release.semana,
      ano: selecionada.release.ano,
      mes: selecionada.release.mes,
      versao: selecionada.release.versao,
      release: selecionada.release.release,
      nome: selecionada.release.nome,
      descricao: selecionada.release.descricao,
      publicadoEm: selecionada.release.publicadoEm,
      totalVisualizacoes: selecionada.release.totalVisualizacoes,
      destaqueSemana: selecionada.release.destaqueSemana,
      revisorNome: selecionada.release.revisorNome,
      chamadas: await listarChamadasDestaque(selecionada.release.id)
    }
  }

  return {
    releaseDestaque,
    manuaisDestaque,
    maisVistas: ranking.itens,
    modoMaisVistas: ranking.modo,
    filtros,
    escopoDestaque,
    chamadasCriticas
  }
}

export async function listarHistoricoPublico(params: {
  software?: unknown
  tipo?: unknown
  pagina?: unknown
  porPagina?: unknown
}): Promise<PublicoHistorico> {
  const software = normalizarSoftware(params.software)
  const tipo = normalizarTipo(params.tipo)
  const pagina = normalizarPagina(params.pagina)
  const porPagina = normalizarPorPagina(params.porPagina)
  const filtros: string[] = []
  const valores: unknown[] = []

  if (software) {
    filtros.push(`EXISTS (
      SELECT 1 FROM entregas_itens e2
       WHERE e2.release_id = r.id
         AND ${gateChamada('e2')}
         AND (
           e2.software = ?
           OR EXISTS (
             SELECT 1 FROM entregas_itens_softwares j2
              WHERE j2.entrega_item_id = e2.id AND j2.software_nome = ?
           )
         )
    )`)
    valores.push(software, software)
  }

  if (tipo) {
    filtros.push(`EXISTS (
      SELECT 1 FROM entregas_itens e3
       WHERE e3.release_id = r.id
         AND ${gateChamada('e3')}
         AND e3.tipo = ?
    )`)
    valores.push(tipo)
  }

  const filtroSql = filtros.length ? ` AND ${filtros.join(' AND ')}` : ''
  const offset = (pagina - 1) * porPagina

  const [linhas, totais] = await Promise.all([
    query<Row[]>(
      `SELECT r.id, r.semana, r.ano, r.versao, r.\`release\` AS release_codigo,
              r.nome, r.descricao, r.publicado_em, r.total_visualizacoes,
              COALESCE(c.chamadas, 0) AS chamadas,
              COALESCE(c.correcao, 0) AS correcao,
              COALESCE(c.melhoria, 0) AS melhoria,
              COALESCE(c.nova, 0) AS nova
         FROM release_week r
         LEFT JOIN (
           SELECT e.release_id,
                  COUNT(*) AS chamadas,
                  SUM(CASE WHEN e.tipo = 'Correção' THEN 1 ELSE 0 END) AS correcao,
                  SUM(CASE WHEN e.tipo = 'Melhoria' THEN 1 ELSE 0 END) AS melhoria,
                  SUM(CASE WHEN e.tipo = 'Nova Funcionalidade' THEN 1 ELSE 0 END) AS nova
             FROM entregas_itens e
            WHERE ${gateChamada('e')}
            GROUP BY e.release_id
         ) c ON c.release_id = r.id
        WHERE ${gatePai('r')}${filtroSql}
        ORDER BY r.publicado_em DESC, r.ano DESC, r.semana DESC
        LIMIT ? OFFSET ?`,
      [...valores, porPagina, offset]
    ),
    query<Row[]>(
      `SELECT COUNT(*) AS total
         FROM release_week r
        WHERE ${gatePai('r')}${filtroSql}`,
      valores
    )
  ])

  const itens: PublicoReleaseResumoPainel[] = linhas.map((linha) => ({
    id: texto(linha.id),
    semana: numero(linha.semana),
    ano: numero(linha.ano),
    versao: texto(linha.versao),
    release: texto(linha.release_codigo),
    nome: texto(linha.nome),
    descricao: texto(linha.descricao),
    chamadas: numero(linha.chamadas),
    contagens: {
      correcao: numero(linha.correcao),
      melhoria: numero(linha.melhoria),
      nova: numero(linha.nova)
    },
    publicadoEm: iso(linha.publicado_em),
    totalVisualizacoes: numero(linha.total_visualizacoes)
  }))

  return {
    itens,
    total: numero(totais[0]?.total),
    pagina,
    porPagina
  }
}

export async function listarNavegacaoPublica(): Promise<PublicoNavegacao> {
  const [releases, manuais, escopos] = await Promise.all([
    listarReleases(),
    listarManuais(),
    listarEscopos()
  ])

  return { releases, manuais, escopos }
}
