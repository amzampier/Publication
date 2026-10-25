import { query } from './db'
import { cacheado } from './cache'
import {
  calcularPercentual,
  calcularTaxaRecusa,
  criarSerieMensalVazia,
  hojeIso,
  preencherSerieAnual,
  type PainelExecutivo,
  type PontoSerieAnual,
  type PublicacaoPainel,
  type RankingPainel,
  type ReleasesPorStatusPainel
} from '#shared/painel-executivo'
import { sqlVinculoPublicado } from './visibilidade-publica'

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

const numero = (valor: unknown): number => Number(valor ?? 0)

const dataDia = (valor: unknown): string => {
  if (valor instanceof Date) {
    const ano = valor.getFullYear()
    const mes = String(valor.getMonth() + 1).padStart(2, '0')
    const dia = String(valor.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  return texto(valor).slice(0, 10)
}

const statusDasReleases: Record<string, keyof ReleasesPorStatusPainel> = {
  Aberta: 'aberta',
  'Em Revisão': 'emRevisao',
  Aprovado: 'aprovado',
  Publicado: 'publicado'
}

const montarPublicacao = (row: Row): PublicacaoPainel => {
  const chamadas = numero(row.chamadas)
  const aprovado = numero(row.aprovado)
  const publicar = numero(row.publicar)
  return {
    id: texto(row.id),
    codigo: texto(row.codigo),
    nome: texto(row.nome),
    dataPublicacao: dataDia(row.data_publicacao),
    status: texto(row.status),
    arquivada: numero(row.arquivada) === 1,
    chamadas,
    revisar: numero(row.revisar),
    aprovado,
    recusado: numero(row.recusado),
    publicar,
    percentualFluxo: calcularPercentual(aprovado + publicar, chamadas)
  }
}

const ranking = (linhas: Row[]): RankingPainel[] =>
  linhas.map((linha) => ({
    rotulo: texto(linha.rotulo),
    total: numero(linha.total)
  }))

/**
 * Agrega o ciclo editorial de um ano. As definições de cada métrica estão em
 * `docs/17 - Painel Executivo.md` e nas funções puras de `#shared/painel-executivo`.
 * O fluxo da esteira é global (mesmo ciclo da tela da Esteira), não filtrado pelo ano.
 */
export interface EscopoPainel {
  releases: boolean
  manuais: boolean
  escopos: boolean
  chamadas: boolean
  softwares: boolean
  parceiros: boolean
}

export const ESCOPO_PAINEL_COMPLETO: EscopoPainel = {
  releases: true,
  manuais: true,
  escopos: true,
  chamadas: true,
  softwares: true,
  parceiros: true
}

const anosDasPublicacoes = async (escopo: EscopoPainel): Promise<number[]> => {
  const blocos: string[] = []
  if (escopo.releases) {
    blocos.push(
      'SELECT YEAR(data_publicacao) AS ano FROM release_week WHERE data_publicacao IS NOT NULL'
    )
  }
  if (escopo.manuais) blocos.push('SELECT ano FROM manuais_mensal')
  if (escopo.escopos) blocos.push('SELECT ano FROM projetos_escopo')
  if (!blocos.length) return []
  const linhas = await query<Row[]>(
    `SELECT DISTINCT ano FROM (${blocos.join(' UNION ALL ')}) anos ORDER BY ano DESC`
  )
  return linhas.map((linha) => numero(linha.ano)).filter((ano) => Number.isFinite(ano))
}

/**
 * Agrega o ciclo editorial de um ano respeitando o RBAC por bloco.
 * `escopo` é resolvido na rota a partir da matriz do usuário; os blocos não
 * permitidos são devolvidos vazios/zerados, sem consultar dados do módulo.
 */
export async function obterPainelExecutivo(
  anoParam?: number,
  escopo: EscopoPainel = ESCOPO_PAINEL_COMPLETO
): Promise<PainelExecutivo> {
  const hoje = hojeIso()
  const incluirPublicacoes = escopo.releases || escopo.manuais || escopo.escopos

  const anosDisponiveis = escopo.chamadas
    ? await cacheado('painel-anos', 30_000, async () => {
        const linhas = await query<Row[]>(
          `SELECT DISTINCT YEAR(data_lancamento) AS ano
             FROM entregas_itens
            WHERE data_lancamento IS NOT NULL
            ORDER BY ano DESC`
        )
        return linhas.map((linha) => numero(linha.ano))
      })
    : await anosDasPublicacoes(escopo)

  const anoCorrente = new Date().getFullYear()
  const ano =
    anoParam ??
    (anosDisponiveis.includes(anoCorrente) ? anoCorrente : anosDisponiveis[0] ?? anoCorrente)
  const anoInicial = ano - 4
  const inicioAno = `${ano}-01-01`
  const fimAno = `${ano + 1}-01-01`
  const inicioJanela = `${anoInicial}-01-01`
  const fimJanela = `${ano + 1}-01-01`

  // Grupo 1: publicações (no máximo 2 consultas em paralelo).
  const [releasesMes, serieAnualRows] = escopo.releases
    ? await Promise.all([
        query<Row[]>(
          `SELECT MONTH(data_publicacao) AS mes, status, COUNT(*) AS total
             FROM release_week
            WHERE data_publicacao >= ? AND data_publicacao < ?
            GROUP BY MONTH(data_publicacao), status`,
          [inicioAno, fimAno]
        ),
        query<Row[]>(
          `SELECT YEAR(data_publicacao) AS ano, COUNT(*) AS publicadas
             FROM release_week
            WHERE status = 'Publicado'
              AND data_publicacao >= ? AND data_publicacao < ?
            GROUP BY YEAR(data_publicacao)`,
          [inicioJanela, fimJanela]
        )
      ])
    : [[], []]

  // Grupo 2: chamadas — uma consulta para séries + lead time e outra para o fluxo.
  const [chamadasRows, itensFluxo] = escopo.chamadas
    ? await Promise.all([
        query<Row[]>(
          `SELECT 'lancadas' AS tipo, MONTH(data_lancamento) AS mes, COUNT(*) AS total
             FROM entregas_itens
            WHERE data_lancamento >= ? AND data_lancamento < ?
            GROUP BY MONTH(data_lancamento)
           UNION ALL
           SELECT 'liberadas' AS tipo, MONTH(data_liberacao) AS mes, COUNT(*) AS total
             FROM entregas_itens
            WHERE data_liberacao IS NOT NULL
              AND data_liberacao <= CURDATE()
              AND data_liberacao >= ? AND data_liberacao < ?
            GROUP BY MONTH(data_liberacao)
           UNION ALL
           SELECT 'lead' AS tipo, NULL AS mes,
                  AVG(DATEDIFF(data_liberacao, data_lancamento)) AS total
             FROM entregas_itens
            WHERE data_lancamento IS NOT NULL
              AND data_liberacao IS NOT NULL
              AND data_liberacao <= CURDATE()
              AND data_liberacao >= data_lancamento
              AND data_liberacao >= ? AND data_liberacao < ?`,
          [inicioAno, fimAno, inicioAno, fimAno, inicioAno, fimAno]
        ),
        query<Row[]>(
          `SELECT
             COALESCE(SUM(CASE WHEN e.status = 'Revisar' THEN 1 ELSE 0 END), 0) AS revisar,
             COALESCE(SUM(CASE WHEN e.status = 'Aprovado' THEN 1 ELSE 0 END), 0) AS aprovado,
             COALESCE(SUM(CASE WHEN e.status = 'Recusado' THEN 1 ELSE 0 END), 0) AS recusado,
             COALESCE(SUM(CASE WHEN e.status = 'Publicar' AND NOT e.visivel THEN 1 ELSE 0 END), 0) AS publicar,
             COALESCE(SUM(CASE WHEN e.status = 'Publicado' AND e.visivel THEN 1 ELSE 0 END), 0) AS publicado,
             COALESCE(SUM(CASE WHEN e.status = 'Revisar' AND DATEDIFF(NOW(), COALESCE(e.data_lancamento, e.criado_em)) > 7 THEN 1 ELSE 0 END), 0) AS aging7,
             COALESCE(SUM(CASE WHEN e.status = 'Revisar' AND DATEDIFF(NOW(), COALESCE(e.data_lancamento, e.criado_em)) > 15 THEN 1 ELSE 0 END), 0) AS aging15
           FROM (
             SELECT e.*,
                    (r.id IS NOT NULL OR m.id IS NOT NULL OR p.id IS NOT NULL) AS ativo,
                    (
                      (r.status = 'Publicado' AND r.publicado_em IS NOT NULL AND r.publicado_em <= NOW(6))
                      OR (m.status = 'Publicado' AND m.publicado_em IS NOT NULL AND m.publicado_em <= NOW(6))
                      OR (p.status = 'Publicado' AND p.publicado_em IS NOT NULL AND p.publicado_em <= NOW(6))
                    ) AS visivel
               FROM entregas_itens e
               LEFT JOIN release_week r ON r.id = e.release_id AND r.arquivada = 0
               LEFT JOIN manuais_mensal m ON m.id = e.manual_id AND m.arquivada = 0
               LEFT JOIN projetos_escopo p ON p.id = e.projeto_id AND p.arquivada = 0
           ) e
          WHERE e.ativo`
        )
      ])
    : [[], []]

  // Grupo 3: publicações por aba — um UNION ALL normalizado.
  let publicacoesRows: Row[] = []
  if (incluirPublicacoes) {
    const blocos: string[] = []
    const parametros: unknown[] = []
    if (escopo.releases) {
      blocos.push(
        `SELECT 'release' AS tipo, r.id, r.codigo, r.nome, r.data_publicacao, r.status, r.arquivada,
                COUNT(e.id) AS chamadas,
                COALESCE(SUM(e.status = 'Revisar'), 0) AS revisar,
                COALESCE(SUM(e.status = 'Aprovado'), 0) AS aprovado,
                COALESCE(SUM(e.status = 'Recusado'), 0) AS recusado,
                COALESCE(SUM(e.status IN ('Publicar', 'Publicado')), 0) AS publicar
           FROM release_week r
           LEFT JOIN entregas_itens e ON e.release_id = r.id
          WHERE r.data_publicacao >= ? AND r.data_publicacao < ?
          GROUP BY r.id, r.codigo, r.nome, r.data_publicacao, r.status, r.arquivada`
      )
      parametros.push(inicioAno, fimAno)
    }
    if (escopo.manuais) {
      blocos.push(
        `SELECT 'manual' AS tipo, m.id, m.codigo, m.titulo AS nome, m.data_publicacao, m.status, m.arquivada,
                COUNT(e.id) AS chamadas,
                COALESCE(SUM(e.status = 'Revisar'), 0) AS revisar,
                COALESCE(SUM(e.status = 'Aprovado'), 0) AS aprovado,
                COALESCE(SUM(e.status = 'Recusado'), 0) AS recusado,
                COALESCE(SUM(e.status IN ('Publicar', 'Publicado')), 0) AS publicar
           FROM manuais_mensal m
           LEFT JOIN entregas_itens e ON e.manual_id = m.id
          WHERE m.ano = ?
          GROUP BY m.id, m.codigo, m.titulo, m.data_publicacao, m.status, m.arquivada`
      )
      parametros.push(ano)
    }
    if (escopo.escopos) {
      blocos.push(
        `SELECT 'projeto' AS tipo, p.id, p.codigo, p.nome, p.data_publicacao, p.status, p.arquivada,
                COUNT(e.id) AS chamadas,
                COALESCE(SUM(e.status = 'Revisar'), 0) AS revisar,
                COALESCE(SUM(e.status = 'Aprovado'), 0) AS aprovado,
                COALESCE(SUM(e.status = 'Recusado'), 0) AS recusado,
                COALESCE(SUM(e.status IN ('Publicar', 'Publicado')), 0) AS publicar
           FROM projetos_escopo p
           LEFT JOIN entregas_itens e ON e.projeto_id = p.id
          WHERE p.ano = ?
          GROUP BY p.id, p.codigo, p.nome, p.data_publicacao, p.status, p.arquivada`
      )
      parametros.push(ano)
    }
    publicacoesRows = await query<Row[]>(blocos.join(' UNION ALL '), parametros)
  }

  // Grupo 4: dimensões — softwares (se permitido) e tipo/impacto (se chamadas).
  const [softwaresRows, dimensoesRows] = await Promise.all([
    escopo.softwares
      ? query<Row[]>(
          `SELECT s.descricao AS rotulo, COUNT(DISTINCT e.id) AS total
             FROM entregas_itens_softwares es
             JOIN entregas_itens e ON e.id = es.entrega_item_id
             JOIN softwares s ON s.codigo = es.software_codigo
            WHERE e.data_lancamento >= ? AND e.data_lancamento < ?
            GROUP BY s.codigo, s.descricao
            ORDER BY total DESC, rotulo ASC
            LIMIT 10`,
          [inicioAno, fimAno]
        )
      : Promise.resolve([] as Row[]),
    escopo.chamadas
      ? query<Row[]>(
          `SELECT 'tipo' AS dimensao, tipo AS rotulo, COUNT(*) AS total
             FROM entregas_itens
            WHERE data_lancamento >= ? AND data_lancamento < ?
            GROUP BY tipo
           UNION ALL
           SELECT 'impacto' AS dimensao, impacto AS rotulo, COUNT(*) AS total
             FROM entregas_itens
            WHERE data_lancamento >= ? AND data_lancamento < ?
            GROUP BY impacto`,
          [inicioAno, fimAno, inicioAno, fimAno]
        )
      : Promise.resolve([] as Row[])
  ])

  const serieMensal = criarSerieMensalVazia()
  for (const linha of releasesMes) {
    const mes = numero(linha.mes)
    const ponto = serieMensal[mes - 1]
    const chave = statusDasReleases[texto(linha.status)]
    if (ponto && chave) ponto.releases[chave] = numero(linha.total)
  }
  let leadTimeMedioDias = 0
  for (const linha of chamadasRows) {
    const tipo = texto(linha.tipo)
    if (tipo === 'lead') {
      leadTimeMedioDias = Math.round(numero(linha.total) * 10) / 10
      continue
    }
    const ponto = serieMensal[numero(linha.mes) - 1]
    if (!ponto) continue
    if (tipo === 'lancadas') ponto.chamadasLancadas = numero(linha.total)
    if (tipo === 'liberadas') ponto.chamadasLiberadas = numero(linha.total)
  }

  const serieAnual: PontoSerieAnual[] = preencherSerieAnual(
    escopo.releases
      ? serieAnualRows.map((linha) => ({
          ano: numero(linha.ano),
          publicadas: numero(linha.publicadas)
        }))
      : [],
    ano
  )

  const fluxoRow = itensFluxo[0] ?? {}
  const revisar = numero(fluxoRow.revisar)
  const aprovado = numero(fluxoRow.aprovado)
  const recusado = numero(fluxoRow.recusado)
  const publicar = numero(fluxoRow.publicar)
  const noPortal = numero(fluxoRow.publicado)
  const totalFluxo = revisar + aprovado + recusado + publicar + noPortal
  const fluxo = {
    total: totalFluxo,
    revisar,
    aprovado,
    recusado,
    publicar,
    aguardandoPai: publicar,
    noPortal,
    aging7: numero(fluxoRow.aging7),
    aging15: numero(fluxoRow.aging15),
    percentualFluxo: calcularPercentual(aprovado + publicar + noPortal, totalFluxo)
  }

  const releasesPublicadas = serieMensal.reduce(
    (soma, ponto) => soma + ponto.releases.publicado,
    0
  )
  const chamadasLancadas = serieMensal.reduce(
    (soma, ponto) => soma + ponto.chamadasLancadas,
    0
  )
  const chamadasLiberadas = serieMensal.reduce(
    (soma, ponto) => soma + ponto.chamadasLiberadas,
    0
  )

  const publicacoesPorTipo = (tipo: string) =>
    publicacoesRows.filter((linha) => texto(linha.tipo) === tipo).map(montarPublicacao)

  return {
    periodo: {
      ano,
      inicio: `${ano}-01-01`,
      fim: `${ano}-12-31`,
      hoje,
      rotulo: String(ano)
    },
    anosDisponiveis,
    kpis: {
      releasesPublicadas: escopo.releases ? releasesPublicadas : 0,
      chamadasLancadas: escopo.chamadas ? chamadasLancadas : 0,
      chamadasLiberadas: escopo.chamadas ? chamadasLiberadas : 0,
      percentualFluxo: escopo.chamadas ? fluxo.percentualFluxo : 0,
      leadTimeMedioDias: escopo.chamadas ? leadTimeMedioDias : 0,
      taxaRecusa: escopo.chamadas ? calcularTaxaRecusa(fluxo.recusado, fluxo.total) : 0
    },
    serieMensal,
    serieAnual,
    porPublicacao: {
      releases: escopo.releases ? publicacoesPorTipo('release') : [],
      manuais: escopo.manuais ? publicacoesPorTipo('manual') : [],
      escopos: escopo.escopos ? publicacoesPorTipo('projeto') : []
    },
    porSoftware: escopo.softwares ? ranking(softwaresRows) : [],
    porTipo: escopo.chamadas
      ? ranking(dimensoesRows.filter((linha) => texto(linha.dimensao) === 'tipo'))
      : [],
    porImpacto: escopo.chamadas
      ? ranking(dimensoesRows.filter((linha) => texto(linha.dimensao) === 'impacto'))
      : []
  }
}
