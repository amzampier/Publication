import { query } from './db'
import {
  calcularFluxoPainel,
  calcularPercentual,
  calcularTaxaRecusa,
  criarSerieMensalVazia,
  hojeIso,
  preencherSerieAnual,
  type ItemFluxoPainel,
  type PainelExecutivo,
  type PontoSerieAnual,
  type PublicacaoPainel,
  type RankingPainel,
  type ReleasesPorStatusPainel
} from '#shared/painel-executivo'
import type { ContextoVinculo } from '#shared/esteira-revisao'
import type { StatusChamada } from '#shared/lancar-chamadas'

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

const montarContexto = (
  id: unknown,
  codigo: unknown,
  nome: unknown,
  status: unknown,
  arquivada: unknown
): ContextoVinculo | null => {
  if (!texto(id)) return null
  return {
    id: texto(id),
    codigo: texto(codigo),
    nome: texto(nome),
    status: texto(status),
    arquivada: numero(arquivada) === 1
  }
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
export async function obterPainelExecutivo(anoParam?: number): Promise<PainelExecutivo> {
  const hoje = hojeIso()
  const anosDisponiveis = (
    await query<Row[]>(
      `SELECT DISTINCT YEAR(data_lancamento) AS ano
         FROM entregas_itens
        WHERE data_lancamento IS NOT NULL
        ORDER BY ano DESC`
    )
  ).map((linha) => numero(linha.ano))
  const anoCorrente = new Date().getFullYear()
  const ano =
    anoParam ??
    (anosDisponiveis.includes(anoCorrente) ? anoCorrente : anosDisponiveis[0] ?? anoCorrente)
  const anoInicial = ano - 4
  const inicioAno = `${ano}-01-01`
  const fimAno = `${ano + 1}-01-01`
  const inicioJanela = `${anoInicial}-01-01`
  const fimJanela = `${ano + 1}-01-01`

  const [
    releasesMes,
    chamadasLancadasMes,
    chamadasLiberadasMes,
    serieAnualRows,
    leadTimeRows,
    releasesPublicacao,
    manuaisPublicacao,
    escoposPublicacao,
    softwaresRows,
    tiposRows,
    impactosRows,
    itensFluxo
  ] = await Promise.all([
    query<Row[]>(
      `SELECT MONTH(data_publicacao) AS mes, status, COUNT(*) AS total
         FROM release_week
        WHERE data_publicacao >= ? AND data_publicacao < ?
        GROUP BY MONTH(data_publicacao), status`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT MONTH(data_lancamento) AS mes, COUNT(*) AS total
         FROM entregas_itens
        WHERE data_lancamento >= ? AND data_lancamento < ?
        GROUP BY MONTH(data_lancamento)`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT MONTH(data_liberacao) AS mes, COUNT(*) AS total
         FROM entregas_itens
        WHERE data_liberacao IS NOT NULL
          AND data_liberacao <= CURDATE()
          AND data_liberacao >= ? AND data_liberacao < ?
        GROUP BY MONTH(data_liberacao)`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT YEAR(data_publicacao) AS ano, COUNT(*) AS publicadas
         FROM release_week
        WHERE status = 'Publicado'
          AND data_publicacao >= ? AND data_publicacao < ?
        GROUP BY YEAR(data_publicacao)`,
      [inicioJanela, fimJanela]
    ),
    query<Row[]>(
      `SELECT AVG(DATEDIFF(data_liberacao, data_lancamento)) AS media
         FROM entregas_itens
        WHERE data_lancamento IS NOT NULL
          AND data_liberacao IS NOT NULL
          AND data_liberacao <= CURDATE()
          AND data_liberacao >= data_lancamento
          AND data_liberacao >= ? AND data_liberacao < ?`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT r.id, r.codigo, r.nome, r.data_publicacao, r.status, r.arquivada,
              COUNT(e.id) AS chamadas,
              COALESCE(SUM(e.status = 'Revisar'), 0) AS revisar,
              COALESCE(SUM(e.status = 'Aprovado'), 0) AS aprovado,
              COALESCE(SUM(e.status = 'Recusado'), 0) AS recusado,
              COALESCE(SUM(e.status = 'Publicar'), 0) AS publicar
         FROM release_week r
         LEFT JOIN entregas_itens e ON e.release_id = r.id
        WHERE r.data_publicacao >= ? AND r.data_publicacao < ?
        GROUP BY r.id, r.codigo, r.nome, r.data_publicacao, r.status, r.arquivada
        ORDER BY r.data_publicacao DESC, r.codigo DESC`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT m.id, m.codigo, m.titulo AS nome, m.data_publicacao, m.status, m.arquivada,
              COUNT(e.id) AS chamadas,
              COALESCE(SUM(e.status = 'Revisar'), 0) AS revisar,
              COALESCE(SUM(e.status = 'Aprovado'), 0) AS aprovado,
              COALESCE(SUM(e.status = 'Recusado'), 0) AS recusado,
              COALESCE(SUM(e.status = 'Publicar'), 0) AS publicar
         FROM manuais_mensal m
         LEFT JOIN entregas_itens e ON e.manual_id = m.id
        WHERE m.ano = ?
        GROUP BY m.id, m.codigo, m.titulo, m.data_publicacao, m.status, m.arquivada
        ORDER BY m.mes_numero DESC, m.codigo DESC`,
      [ano]
    ),
    query<Row[]>(
      `SELECT p.id, p.codigo, p.nome, p.data_publicacao, p.status, p.arquivada,
              COUNT(e.id) AS chamadas,
              COALESCE(SUM(e.status = 'Revisar'), 0) AS revisar,
              COALESCE(SUM(e.status = 'Aprovado'), 0) AS aprovado,
              COALESCE(SUM(e.status = 'Recusado'), 0) AS recusado,
              COALESCE(SUM(e.status = 'Publicar'), 0) AS publicar
         FROM projetos_escopo p
         LEFT JOIN entregas_itens e ON e.projeto_id = p.id
        WHERE p.ano = ?
        GROUP BY p.id, p.codigo, p.nome, p.data_publicacao, p.status, p.arquivada
        ORDER BY p.data_publicacao DESC, p.codigo DESC`,
      [ano]
    ),
    query<Row[]>(
      `SELECT s.descricao AS rotulo, COUNT(DISTINCT e.id) AS total
         FROM entregas_itens_softwares es
         JOIN entregas_itens e ON e.id = es.entrega_item_id
         JOIN softwares s ON s.codigo = es.software_codigo
        WHERE e.data_lancamento >= ? AND e.data_lancamento < ?
        GROUP BY s.codigo, s.descricao
        ORDER BY total DESC, rotulo ASC
        LIMIT 10`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT tipo AS rotulo, COUNT(*) AS total
         FROM entregas_itens
        WHERE data_lancamento >= ? AND data_lancamento < ?
        GROUP BY tipo
        ORDER BY total DESC, rotulo ASC`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT impacto AS rotulo, COUNT(*) AS total
         FROM entregas_itens
        WHERE data_lancamento >= ? AND data_lancamento < ?
        GROUP BY impacto
        ORDER BY total DESC, rotulo ASC`,
      [inicioAno, fimAno]
    ),
    query<Row[]>(
      `SELECT e.id, e.status, e.data_lancamento, e.criado_em,
              r.id AS r_id, r.codigo AS r_codigo, r.nome AS r_nome,
              r.status AS r_status, r.arquivada AS r_arquivada,
              m.id AS m_id, m.codigo AS m_codigo, m.titulo AS m_nome,
              m.status AS m_status, m.arquivada AS m_arquivada,
              p.id AS p_id, p.codigo AS p_codigo, p.nome AS p_nome,
              p.status AS p_status, p.arquivada AS p_arquivada
         FROM entregas_itens e
         LEFT JOIN release_week r ON r.id = e.release_id
         LEFT JOIN manuais_mensal m ON m.id = e.manual_id
         LEFT JOIN projetos_escopo p ON p.id = e.projeto_id`
    ),
  ])

  const serieMensal = criarSerieMensalVazia()

  for (const linha of releasesMes) {
    const mes = numero(linha.mes)
    const ponto = serieMensal[mes - 1]
    const chave = statusDasReleases[texto(linha.status)]
    if (ponto && chave) ponto.releases[chave] = numero(linha.total)
  }
  for (const linha of chamadasLancadasMes) {
    const ponto = serieMensal[numero(linha.mes) - 1]
    if (ponto) ponto.chamadasLancadas = numero(linha.total)
  }
  for (const linha of chamadasLiberadasMes) {
    const ponto = serieMensal[numero(linha.mes) - 1]
    if (ponto) ponto.chamadasLiberadas = numero(linha.total)
  }

  const serieAnual: PontoSerieAnual[] = preencherSerieAnual(
    serieAnualRows.map((linha) => ({
      ano: numero(linha.ano),
      publicadas: numero(linha.publicadas)
    })),
    ano
  )

  const itensParaFluxo: ItemFluxoPainel[] = itensFluxo.map((linha) => ({
    status: texto(linha.status) as StatusChamada,
    contexto: {
      release: montarContexto(
        linha.r_id,
        linha.r_codigo,
        linha.r_nome,
        linha.r_status,
        linha.r_arquivada
      ),
      manual: montarContexto(
        linha.m_id,
        linha.m_codigo,
        linha.m_nome,
        linha.m_status,
        linha.m_arquivada
      ),
      projeto: montarContexto(
        linha.p_id,
        linha.p_codigo,
        linha.p_nome,
        linha.p_status,
        linha.p_arquivada
      )
    },
    dataReferencia: dataDia(linha.data_lancamento) || dataDia(linha.criado_em)
  }))

  const fluxo = calcularFluxoPainel(itensParaFluxo, hoje)

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
  const leadTimeMedioDias = Math.round(numero(leadTimeRows[0]?.media) * 10) / 10

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
      releasesPublicadas,
      chamadasLancadas,
      chamadasLiberadas,
      percentualFluxo: fluxo.percentualFluxo,
      leadTimeMedioDias,
      taxaRecusa: calcularTaxaRecusa(fluxo.recusado, fluxo.total)
    },
    serieMensal,
    serieAnual,
    porPublicacao: {
      releases: releasesPublicacao.map(montarPublicacao),
      manuais: manuaisPublicacao.map(montarPublicacao),
      escopos: escoposPublicacao.map(montarPublicacao)
    },
    porSoftware: ranking(softwaresRows),
    porTipo: ranking(tiposRows),
    porImpacto: ranking(impactosRows)
  }
}
