import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { createError } from 'h3'
import { getTransaction, inserirEmLotes, query } from './db'
import { cacheado, invalidarCache } from './cache'
import { publicadoEmFuturo } from '#shared/publicacao'
import { richTextParaTexto, sanitizarRichText } from './richText'
import { uploadsDir } from './uploads'
import {
  registrarTransicao,
  type AtorTransicao,
  type ExecutorSql,
  type OpcoesTransicao
} from './historico-esteira'
import { reconciliarFilhasPublicacao } from './publicacao-pais'
import { condicaoPrefixo, termoFulltext } from './busca'
import {
  carregarMidiasPorItem,
  sincronizarMidias,
  urlReferenciadaPorOutraChamada
} from './midias'
import {
  statusRevisaoDoPai,
  validarParecer,
  type TipoVinculo
} from '#shared/esteira-revisao'
import {
  LIMITE_IMPORTACAO_CHAMADAS,
  derivarOrigem,
  normalizarImagensChamada,
  normalizarSoftwareIds,
  normalizarTagsChamada,
  validarChamada,
  type CatalogosChamada,
  type ChamadaModelo,
  type EntradaChamada,
  type ImagemChamada,
  type ImpactoChamada,
  type OpcaoChamada,
  type OrigemChamada,
  type StatusChamada,
  type TipoChamada
} from '#shared/lancar-chamadas'

type Row = Record<string, unknown>

export interface AutorChamada {
  id: string
  nome?: string
  perfil?: string
}

const atorDeAutor = (autor: AutorChamada): AtorTransicao => ({
  id: autor.id,
  nome: autor.nome ?? 'Sistema',
  perfil: autor.perfil
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function erro400(mensagem: string, data?: unknown): never {
  throw createError({ statusCode: 400, statusMessage: mensagem, data })
}

function erro404(mensagem = 'Chamada não encontrada.'): never {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}

function erro409(mensagem: string, data?: unknown): never {
  throw createError({ statusCode: 409, statusMessage: mensagem, data })
}

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor).trim()

const dataDia = (valor: unknown): string => {
  if (valor instanceof Date) {
    const ano = valor.getFullYear()
    const mes = String(valor.getMonth() + 1).padStart(2, '0')
    const dia = String(valor.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  return texto(valor).slice(0, 10)
}

const dataIso = (valor: unknown): string => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? valor : data.toISOString()
  }
  return ''
}

const listaJson = (valor: unknown): unknown[] => {
  if (Array.isArray(valor)) return valor
  if (typeof valor === 'string' && valor) {
    try {
      const parsed = JSON.parse(valor)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const COLUNAS = `e.id, e.origem, e.release_id, e.projeto_id, e.manual_id, e.software_id,
  e.parceiro_id, e.autor_id, e.autor_nome, e.chamada, e.data_lancamento, e.data_liberacao,
  e.release, e.titulo, e.parceiro, e.software, e.modulo, e.menu_funcionalidade, e.tipo,
  e.impacto, e.publicado_em, e.descricao_completa, e.descricao_html, e.solucao, e.solucao_html,
  e.manual_titulo, e.link_manual, e.link_video,
  e.imagens, e.status, e.tags, e.criado_em, e.atualizado_em,
  EXISTS (SELECT 1 FROM historico_esteira_revisao h WHERE h.entrega_item_id = e.id) AS tem_historico`

interface SoftwareItem {
  codigo: string
  nome: string
}

/** Carrega, por chamada, os softwares da junção (ordem de seleção). */
async function carregarSoftwaresPorItem(ids: string[]): Promise<Map<string, SoftwareItem[]>> {
  const mapa = new Map<string, SoftwareItem[]>()
  if (!ids.length) return mapa
  const placeholders = ids.map(() => '?').join(', ')
  const linhas = await query<Row[]>(
    `SELECT entrega_item_id, software_codigo, software_nome
       FROM entregas_itens_softwares
      WHERE entrega_item_id IN (${placeholders})
      ORDER BY ordem ASC, software_nome ASC`,
    ids
  )
  for (const linha of linhas) {
    const itemId = texto(linha.entrega_item_id)
    const lista = mapa.get(itemId) ?? []
    lista.push({ codigo: texto(linha.software_codigo), nome: texto(linha.software_nome) })
    mapa.set(itemId, lista)
  }
  return mapa
}

const montarChamada = (
  row: Row,
  softwares?: SoftwareItem[],
  midias?: ImagemChamada[]
): ChamadaModelo => {
  const status = (texto(row.status) || 'Revisar') as StatusChamada
  const listaSoftwares =
    softwares && softwares.length
      ? softwares
      : texto(row.software_id)
        ? [{ codigo: texto(row.software_id), nome: texto(row.software) }]
        : []
  return {
    id: texto(row.id),
    origem: (texto(row.origem) || 'Release') as OrigemChamada,
    releaseId: texto(row.release_id),
    projetoId: texto(row.projeto_id),
    manualId: texto(row.manual_id),
    softwareIds: listaSoftwares.map((software) => software.codigo),
    parceiroId: texto(row.parceiro_id),
    autorId: texto(row.autor_id),
    autorNome: texto(row.autor_nome),
    chamada: texto(row.chamada),
    dataLancamento: dataDia(row.data_lancamento),
    dataLiberacao: dataDia(row.data_liberacao),
    release: texto(row.release),
    titulo: texto(row.titulo),
    parceiro: texto(row.parceiro),
    softwares: listaSoftwares.map((software) => software.nome),
    modulo: texto(row.modulo),
    menuFuncionalidade: texto(row.menu_funcionalidade),
    tipo: (texto(row.tipo) || 'Correção') as TipoChamada,
    impacto: (texto(row.impacto) || 'Médio') as ImpactoChamada,
    descricaoCompleta: texto(row.descricao_completa),
    descricaoHtml: texto(row.descricao_html),
    solucao: texto(row.solucao),
    solucaoHtml: texto(row.solucao_html),
    manualTitulo: texto(row.manual_titulo),
    linkManual: texto(row.link_manual),
    linkVideo: texto(row.link_video),
    imagens: midias && midias.length
      ? midias.map((midia) => midia.url)
      : normalizarImagensChamada(listaJson(row.imagens)),
    midias: midias ?? [],
    status,
    tags: normalizarTagsChamada(listaJson(row.tags)),
    temHistorico: Number(row.tem_historico ?? 0) === 1 || status !== 'Revisar',
    criadoEm: dataIso(row.criado_em),
    atualizadoEm: dataIso(row.atualizado_em)
  }
}

export function validarIdChamada(id: unknown): string {
  const valor = typeof id === 'string' ? id.trim() : ''
  if (!UUID_RE.test(valor)) erro404()
  return valor
}

export async function listarChamadas(): Promise<ChamadaModelo[]> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS} FROM entregas_itens e ORDER BY e.chamada ASC`
  )
  const ids = linhas.map((linha) => texto(linha.id))
  const [softwares, midias] = await Promise.all([
    carregarSoftwaresPorItem(ids),
    carregarMidiasPorItem(ids)
  ])
  return linhas.map((linha) =>
    montarChamada(linha, softwares.get(texto(linha.id)), midias.get(texto(linha.id)))
  )
}

export interface FiltrosListaChamadas {
  busca?: string
  status?: string
  tipo?: string
  impacto?: string
  origem?: string
  parceiroId?: string
  softwareIds?: string[]
  dataLancamentoDe?: string
  dataLancamentoAte?: string
  dataLiberacaoDe?: string
  dataLiberacaoAte?: string
}

export interface PaginaChamadas {
  itens: ChamadaModelo[]
  total: number
  pagina: number
  porPagina: number
  kpis: { total: number; revisar: number; aprovado: number; recusado: number }
}

const COLUNAS_LISTA = `e.id, e.origem, e.release_id, e.projeto_id, e.manual_id, e.software_id,
  e.parceiro_id, e.autor_id, e.autor_nome, e.chamada, e.data_lancamento, e.data_liberacao,
  e.release, e.titulo, e.parceiro, e.software, e.modulo, e.menu_funcionalidade, e.tipo,
  e.impacto, e.status, e.publicado_em, e.tags, e.criado_em, e.atualizado_em,
  EXISTS (SELECT 1 FROM historico_esteira_revisao h WHERE h.entrega_item_id = e.id) AS tem_historico`

function whereChamadas(filtros: FiltrosListaChamadas): { sql: string; params: unknown[] } {
  const condicoes: string[] = []
  const params: unknown[] = []
  const igual = (coluna: string, valor: unknown) => {
    const textoValor = typeof valor === 'string' ? valor.trim() : ''
    if (!textoValor) return
    condicoes.push(`${coluna} = ?`)
    params.push(textoValor)
  }
  igual('e.status', filtros.status)
  igual('e.tipo', filtros.tipo)
  igual('e.impacto', filtros.impacto)
  igual('e.origem', filtros.origem)
  igual('e.parceiro_id', filtros.parceiroId)
  if (filtros.dataLancamentoDe) {
    condicoes.push('e.data_lancamento >= ?')
    params.push(filtros.dataLancamentoDe)
  }
  if (filtros.dataLancamentoAte) {
    condicoes.push('e.data_lancamento <= ?')
    params.push(filtros.dataLancamentoAte)
  }
  if (filtros.dataLiberacaoDe) {
    condicoes.push('e.data_liberacao >= ?')
    params.push(filtros.dataLiberacaoDe)
  }
  if (filtros.dataLiberacaoAte) {
    condicoes.push('e.data_liberacao <= ?')
    params.push(filtros.dataLiberacaoAte)
  }
  const softwares = (filtros.softwareIds ?? []).filter(Boolean)
  if (softwares.length) {
    condicoes.push(
      `EXISTS (SELECT 1 FROM entregas_itens_softwares es
                WHERE es.entrega_item_id = e.id
                  AND es.software_codigo IN (${softwares.map(() => '?').join(', ')}))`
    )
    params.push(...softwares)
  }
  const busca = (filtros.busca ?? '').trim()
  if (busca) {
    const fulltext = termoFulltext(busca)
    if (fulltext) {
      const prefixo = condicaoPrefixo(
        ['e.software', 'e.parceiro', 'e.tags', 'e.release'],
        busca
      )
      condicoes.push(
        `(MATCH(e.chamada, e.titulo, e.descricao_completa, e.solucao, e.modulo, e.menu_funcionalidade)
            AGAINST (? IN BOOLEAN MODE) OR ${prefixo.sql})`
      )
      params.push(fulltext, ...prefixo.params)
    } else {
      const prefixo = condicaoPrefixo(
        [
          'e.chamada',
          'e.titulo',
          'e.descricao_completa',
          'e.solucao',
          'e.software',
          'e.modulo',
          'e.menu_funcionalidade',
          'e.parceiro',
          'e.tags',
          'e.release'
        ],
        busca
      )
      condicoes.push(prefixo.sql)
      params.push(...prefixo.params)
    }
  }
  return { sql: condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '', params }
}

/** Listagem paginada e filtrada no servidor; sem HTML/mídias (detalhe sob demanda). */
export async function listarChamadasPaginadas(opts: {
  pagina?: number
  porPagina?: number
  filtros?: FiltrosListaChamadas
}): Promise<PaginaChamadas> {
  const pagina = Math.max(1, Math.trunc(opts.pagina ?? 1))
  const porPagina = Math.min(200, Math.max(1, Math.trunc(opts.porPagina ?? 20)))
  const { sql, params } = whereChamadas(opts.filtros ?? {})
  const offset = (pagina - 1) * porPagina
  const [totalRows, kpiRows, linhas] = await Promise.all([
    query<Row[]>(`SELECT COUNT(*) AS total FROM entregas_itens e ${sql}`, params),
    query<Row[]>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(e.status = 'Revisar'), 0) AS revisar,
              COALESCE(SUM(e.status = 'Aprovado'), 0) AS aprovado,
              COALESCE(SUM(e.status = 'Recusado'), 0) AS recusado
         FROM entregas_itens e ${sql}`,
      params
    ),
    query<Row[]>(
      `SELECT ${COLUNAS_LISTA} FROM entregas_itens e ${sql}
        ORDER BY e.chamada ASC LIMIT ? OFFSET ?`,
      [...params, porPagina, offset]
    )
  ])
  const ids = linhas.map((linha) => texto(linha.id))
  const softwares = await carregarSoftwaresPorItem(ids)
  return {
    itens: linhas.map((linha) =>
      montarChamada(linha, softwares.get(texto(linha.id)), undefined)
    ),
    total: Number(totalRows[0]?.total ?? 0),
    pagina,
    porPagina,
    kpis: {
      total: Number(kpiRows[0]?.total ?? 0),
      revisar: Number(kpiRows[0]?.revisar ?? 0),
      aprovado: Number(kpiRows[0]?.aprovado ?? 0),
      recusado: Number(kpiRows[0]?.recusado ?? 0)
    }
  }
}

/** Projeção enxuta e filtrada, sem limite, para exportação/board. */
export async function listarChamadasFiltradas(
  filtros: FiltrosListaChamadas = {}
): Promise<ChamadaModelo[]> {
  const { sql, params } = whereChamadas(filtros)
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS_LISTA} FROM entregas_itens e ${sql} ORDER BY e.chamada ASC`,
    params
  )
  const ids = linhas.map((linha) => texto(linha.id))
  const softwares = await carregarSoftwaresPorItem(ids)
  return linhas.map((linha) =>
    montarChamada(linha, softwares.get(texto(linha.id)), undefined)
  )
}

/** Projeção enxuta para o board da Esteira (sem HTML/mídias, todos os itens). */
export async function listarChamadasParaEsteira(): Promise<ChamadaModelo[]> {
  return listarChamadasFiltradas()
}
export async function buscarChamada(id: string): Promise<ChamadaModelo | null> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS} FROM entregas_itens e WHERE e.id = ? LIMIT 1`,
    [id]
  )
  const linha = linhas[0]
  if (!linha) return null
  const [softwares, midias] = await Promise.all([
    carregarSoftwaresPorItem([texto(linha.id)]),
    carregarMidiasPorItem([texto(linha.id)])
  ])
  return montarChamada(
    linha,
    softwares.get(texto(linha.id)),
    midias.get(texto(linha.id))
  )
}

async function consultarOpcoesChamadas(): Promise<CatalogosChamada> {
  const [releases, projetos, manuais, softwares, parceiros] = await Promise.all([
    query<Row[]>(
      `SELECT id, codigo, nome, data_publicacao, status
         FROM release_week
        WHERE arquivada = 0
        ORDER BY data_publicacao DESC, codigo DESC`
    ),
    query<Row[]>(
      `SELECT id, codigo, nome, status
         FROM projetos_escopo
        WHERE arquivada = 0
        ORDER BY ano DESC, versao DESC, codigo ASC`
    ),
    query<Row[]>(
      `SELECT id, codigo, titulo, status
         FROM manuais_mensal
        WHERE arquivada = 0
        ORDER BY ano DESC, mes_numero DESC`
    ),
    query<Row[]>(
      `SELECT codigo, descricao
         FROM softwares
        WHERE situacao = 'Ativo'
        ORDER BY descricao ASC`
    ),
    query<Row[]>(
      `SELECT id, codigo, nome_fantasia
         FROM parceiros
        WHERE situacao = 'Ativo'
        ORDER BY nome_fantasia ASC`
    )
  ])

  const opcao = (id: string, label: string, sigla?: string): OpcaoChamada => ({
    id,
    label,
    ...(sigla ? { sigla } : {})
  })

  return {
    releases: releases.map((row) => ({
      ...opcao(texto(row.id), `${texto(row.codigo)} - ${texto(row.nome)}`, texto(row.codigo)),
      dataPublicacao: dataDia(row.data_publicacao),
      status: texto(row.status)
    })),
    projetos: projetos.map((row) => ({
      ...opcao(texto(row.id), `${texto(row.codigo)} - ${texto(row.nome)}`, texto(row.codigo)),
      status: texto(row.status)
    })),
    manuais: manuais.map((row) => ({
      ...opcao(texto(row.id), `${texto(row.codigo)} - ${texto(row.titulo)}`, texto(row.codigo)),
      status: texto(row.status)
    })),
    softwares: softwares.map((row) =>
      opcao(texto(row.codigo), texto(row.descricao), texto(row.codigo))
    ),
    parceiros: parceiros.map((row) =>
      opcao(texto(row.id), texto(row.nome_fantasia), texto(row.codigo))
    )
  }
}

export function listarOpcoesChamadas(): Promise<CatalogosChamada> {
  return cacheado('chamadas-opcoes', 30_000, consultarOpcoesChamadas)
}

function montarEntrada(dados: Record<string, unknown>): EntradaChamada {
  const descricaoHtml = sanitizarRichText(dados.descricaoHtml)
  const solucaoHtml = sanitizarRichText(dados.solucaoHtml)
  return {
    chamada: texto(dados.chamada),
    titulo: texto(dados.titulo),
    dataLancamento: texto(dados.dataLancamento),
    dataLiberacao: texto(dados.dataLiberacao),
    releaseId: texto(dados.releaseId),
    projetoId: texto(dados.projetoId),
    manualId: texto(dados.manualId),
    softwareIds: normalizarSoftwareIds(dados.softwareIds),
    parceiroId: texto(dados.parceiroId),
    modulo: texto(dados.modulo),
    menuFuncionalidade: texto(dados.menuFuncionalidade),
    tipo: texto(dados.tipo) as TipoChamada,
    impacto: texto(dados.impacto) as ImpactoChamada,
    descricaoCompleta: descricaoHtml
      ? richTextParaTexto(descricaoHtml)
      : texto(dados.descricaoCompleta),
    descricaoHtml,
    solucao: solucaoHtml ? richTextParaTexto(solucaoHtml) : texto(dados.solucao),
    solucaoHtml,
    manualTitulo: texto(dados.manualTitulo),
    linkManual: texto(dados.linkManual),
    linkVideo: texto(dados.linkVideo),
    imagens: normalizarImagensChamada(dados.imagens),
    tags: normalizarTagsChamada(dados.tags)
  }
}

async function existentesParaValidacao(idAtual?: string): Promise<ChamadaModelo[]> {
  const linhas = await query<Row[]>(
    `SELECT id, chamada FROM entregas_itens ${idAtual ? 'WHERE id <> ?' : ''}`,
    idAtual ? [idAtual] : []
  )
  return linhas.map((row) => ({ id: texto(row.id), chamada: texto(row.chamada) })) as unknown as ChamadaModelo[]
}

async function validarEntrada(
  dados: Record<string, unknown>,
  idAtual?: string
): Promise<EntradaChamada> {
  const entrada = montarEntrada(dados)
  const resultado = validarChamada(entrada, await existentesParaValidacao(idAtual), idAtual)
  if (!resultado.valido) {
    if (resultado.erros.chamada && /já existe/i.test(resultado.erros.chamada)) {
      erro409(resultado.erros.chamada, { erros: resultado.erros })
    }
    const primeiro = resultado.primeiroErro
    erro400(
      (primeiro ? resultado.erros[primeiro] : '') || 'Dados da chamada inválidos.',
      { erros: resultado.erros }
    )
  }
  return entrada
}

interface VinculosResolvidos {
  release: Row | null
  projeto: Row | null
  manual: Row | null
  softwares: Row[]
  parceiro: Row | null
  dataLiberacao: string
  origem: OrigemChamada
}

async function resolverVinculos(entrada: EntradaChamada): Promise<VinculosResolvidos> {
  const release = entrada.releaseId
    ? (await query<Row[]>(
        'SELECT id, codigo, data_publicacao FROM release_week WHERE id = ? LIMIT 1',
        [entrada.releaseId]
      ))[0] ?? null
    : null
  if (entrada.releaseId && !release) {
    erro400('Release não encontrada.', { erros: { vinculo: 'Selecione uma release válida.' } })
  }

  const projeto = entrada.projetoId
    ? (await query<Row[]>(
        'SELECT id, codigo FROM projetos_escopo WHERE id = ? LIMIT 1',
        [entrada.projetoId]
      ))[0] ?? null
    : null
  if (entrada.projetoId && !projeto) {
    erro400('Projeto não encontrado.', { erros: { vinculo: 'Selecione um projeto válido.' } })
  }

  const manual = entrada.manualId
    ? (await query<Row[]>(
        'SELECT id, codigo FROM manuais_mensal WHERE id = ? LIMIT 1',
        [entrada.manualId]
      ))[0] ?? null
    : null
  if (entrada.manualId && !manual) {
    erro400('Manual não encontrado.', { erros: { vinculo: 'Selecione um manual válido.' } })
  }

  const softwares = entrada.softwareIds.length
    ? await query<Row[]>(
        `SELECT codigo, descricao FROM softwares
          WHERE codigo IN (${entrada.softwareIds.map(() => '?').join(', ')})`,
        entrada.softwareIds
      )
    : []
  const porCodigo = new Map(softwares.map((linha) => [texto(linha.codigo), linha]))
  const softwaresOrdenados = entrada.softwareIds
    .map((codigo) => porCodigo.get(codigo))
    .filter((linha): linha is Row => Boolean(linha))
  if (softwaresOrdenados.length !== entrada.softwareIds.length) {
    erro400('Software não encontrado.', {
      erros: { softwareIds: 'Selecione softwares válidos.' }
    })
  }

  const parceiro = entrada.parceiroId
    ? (await query<Row[]>(
        'SELECT id, codigo, nome_fantasia FROM parceiros WHERE id = ? LIMIT 1',
        [entrada.parceiroId]
      ))[0] ?? null
    : null
  if (entrada.parceiroId && !parceiro) {
    erro400('Parceiro não encontrado.', { erros: { parceiroId: 'Selecione um parceiro válido.' } })
  }

  const origem = derivarOrigem({
    releaseId: entrada.releaseId,
    projetoId: entrada.projetoId,
    manualId: entrada.manualId
  })
  if (!origem) {
    erro400('Selecione ao menos uma release, projeto ou manual.', {
      erros: { vinculo: 'Selecione ao menos uma release, projeto ou manual.' }
    })
  }

  return {
    release,
    projeto,
    manual,
    softwares: softwaresOrdenados,
    parceiro,
    dataLiberacao:
      entrada.dataLiberacao ||
      (release?.data_publicacao ? dataDia(release.data_publicacao) : ''),
    origem
  }
}

interface PaiRevisao {
  tipo: TipoVinculo
  id: string
}

const TABELA_PAI: Record<TipoVinculo, string> = {
  release: 'release_week',
  manual: 'manuais_mensal',
  projeto: 'projetos_escopo'
}

function paisDosVinculos(vinculos: VinculosResolvidos): PaiRevisao[] {
  const pais: PaiRevisao[] = []
  if (vinculos.release) pais.push({ tipo: 'release', id: texto(vinculos.release.id) })
  if (vinculos.manual) pais.push({ tipo: 'manual', id: texto(vinculos.manual.id) })
  if (vinculos.projeto) pais.push({ tipo: 'projeto', id: texto(vinculos.projeto.id) })
  return pais
}

/**
 * Move os conteúdos pai vinculados para o status de revisão (Release/Manual:
 * `Em Revisão`; Escopo: `Homologação`). Idempotente: não reescreve quando o pai
 * já está nesse status.
 */
async function sincronizarStatusPais(
  executor: ExecutorSql,
  pais: PaiRevisao[],
  ator: AtorTransicao
): Promise<void> {
  const vistos = new Set<string>()
  for (const pai of pais) {
    const chave = `${pai.tipo}:${pai.id}`
    if (vistos.has(chave)) continue
    vistos.add(chave)
    const status = statusRevisaoDoPai(pai.tipo)
    const resultado = await executor.query<{ affectedRows: number }>(
      `UPDATE ${TABELA_PAI[pai.tipo]} SET status = ? WHERE id = ? AND status <> ?`,
      [status, pai.id, status]
    )
    if (Number(resultado.affectedRows) > 0) {
      await reconciliarFilhasPublicacao(executor, pai.tipo, pai.id, ator)
    }
  }
}

interface ChamadaPreparada {
  id: string
  origem: OrigemChamada
  releaseId: string | null
  projetoId: string | null
  manualId: string | null
  softwareId: string | null
  parceiroId: string | null
  autorId: string
  autorNome: string
  chamada: string
  dataLancamento: string
  dataLiberacao: string | null
  release: string | null
  titulo: string
  parceiro: string
  software: string
  softwares: SoftwareItem[]
  modulo: string
  menuFuncionalidade: string | null
  tipo: TipoChamada
  impacto: ImpactoChamada
  descricaoCompleta: string
  descricaoHtml: string | null
  solucao: string | null
  solucaoHtml: string | null
  manualTitulo: string | null
  linkManual: string | null
  linkVideo: string | null
  imagens: string | null
  status: StatusChamada
  tags: string | null
}

function prepararChamada(
  id: string,
  entrada: EntradaChamada,
  vinculos: VinculosResolvidos,
  autor: AutorChamada,
  status: StatusChamada
): ChamadaPreparada {
  const softwares = vinculos.softwares.map((linha) => ({
    codigo: texto(linha.codigo),
    nome: texto(linha.descricao)
  }))
  return {
    id,
    origem: vinculos.origem,
    releaseId: entrada.releaseId || null,
    projetoId: entrada.projetoId || null,
    manualId: entrada.manualId || null,
    softwareId: softwares[0]?.codigo ?? null,
    parceiroId: entrada.parceiroId || null,
    autorId: autor.id,
    autorNome: (autor.nome ?? '').slice(0, 150),
    chamada: entrada.chamada,
    dataLancamento: entrada.dataLancamento,
    dataLiberacao: vinculos.dataLiberacao || null,
    release: vinculos.release ? texto(vinculos.release.codigo) : null,
    titulo: entrada.titulo,
    parceiro: vinculos.parceiro ? texto(vinculos.parceiro.nome_fantasia) : '',
    software: softwares[0]?.nome ?? '',
    softwares,
    modulo: entrada.modulo,
    menuFuncionalidade: entrada.menuFuncionalidade || null,
    tipo: entrada.tipo,
    impacto: entrada.impacto,
    descricaoCompleta: entrada.descricaoCompleta,
    descricaoHtml: entrada.descricaoHtml || null,
    solucao: entrada.solucao || null,
    solucaoHtml: entrada.solucaoHtml || null,
    manualTitulo: entrada.manualTitulo || null,
    linkManual: entrada.linkManual || null,
    linkVideo: entrada.linkVideo || null,
    imagens: entrada.imagens.length ? JSON.stringify(entrada.imagens) : null,
    status,
    tags: entrada.tags.length ? JSON.stringify(entrada.tags) : null
  }
}

const SQL_INSERT = `INSERT INTO entregas_itens
  (id, origem, release_id, projeto_id, manual_id, software_id, parceiro_id, autor_id,
   autor_nome, chamada, data_lancamento, data_liberacao, \`release\`, titulo, parceiro, software,
   modulo, menu_funcionalidade, tipo, impacto, descricao_completa, descricao_html,
   solucao, solucao_html, manual_titulo,
   link_manual, link_video, imagens, status, tags)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

const valoresInsert = (p: ChamadaPreparada): unknown[] => [
  p.id,
  p.origem,
  p.releaseId,
  p.projetoId,
  p.manualId,
  p.softwareId,
  p.parceiroId,
  p.autorId,
  p.autorNome,
  p.chamada,
  p.dataLancamento,
  p.dataLiberacao,
  p.release,
  p.titulo,
  p.parceiro,
  p.software,
  p.modulo,
  p.menuFuncionalidade,
  p.tipo,
  p.impacto,
  p.descricaoCompleta,
  p.descricaoHtml,
  p.solucao,
  p.solucaoHtml,
  p.manualTitulo,
  p.linkManual,
  p.linkVideo,
  p.imagens,
  p.status,
  p.tags
]

/** Substitui os softwares da chamada na junção, preservando a ordem de seleção. */
async function gravarSoftwares(
  executor: ExecutorSql,
  id: string,
  softwares: SoftwareItem[]
): Promise<void> {
  await executor.query('DELETE FROM entregas_itens_softwares WHERE entrega_item_id = ?', [id])
  if (!softwares.length) return
  const valores = softwares.map((software, indice) => [id, software.codigo, software.nome, indice])
  await executor.query(
    'INSERT INTO entregas_itens_softwares (entrega_item_id, software_codigo, software_nome, ordem) VALUES ?',
    [valores]
  )
}

export async function criarChamada(
  dados: Record<string, unknown>,
  autor: AutorChamada
): Promise<ChamadaModelo> {
  invalidarCache('chamadas-opcoes')
  const entrada = await validarEntrada(dados)
  const vinculos = await resolverVinculos(entrada)
  const preparada = prepararChamada(randomUUID(), entrada, vinculos, autor, 'Revisar')
  const tx = await getTransaction()
  try {
    await tx.query(SQL_INSERT, valoresInsert(preparada))
    await gravarSoftwares(tx, preparada.id, preparada.softwares)
    await sincronizarMidias(tx, preparada.id, entrada.imagens)
    await sincronizarStatusPais(tx, paisDosVinculos(vinculos), atorDeAutor(autor))
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('Já existe uma chamada com este número.', {
        erros: { chamada: 'Já existe uma chamada com este número.' }
      })
    }
    throw erro
  }
  const criada = await buscarChamada(preparada.id)
  if (!criada) erro404('Falha ao criar a chamada.')
  return criada
}

export async function atualizarChamada(
  id: string,
  dados: Record<string, unknown>,
  autor: AutorChamada
): Promise<ChamadaModelo> {
  invalidarCache('chamadas-opcoes')
  const atual = await buscarChamada(id)
  if (!atual) erro404()

  const mesclado: Record<string, unknown> = {
    chamada: 'chamada' in dados ? dados.chamada : atual.chamada,
    titulo: 'titulo' in dados ? dados.titulo : atual.titulo,
    dataLancamento: 'dataLancamento' in dados ? dados.dataLancamento : atual.dataLancamento,
    dataLiberacao: atual.dataLiberacao,
    releaseId: 'releaseId' in dados ? dados.releaseId : atual.releaseId,
    projetoId: 'projetoId' in dados ? dados.projetoId : atual.projetoId,
    manualId: 'manualId' in dados ? dados.manualId : atual.manualId,
    softwareIds: 'softwareIds' in dados ? dados.softwareIds : atual.softwareIds,
    parceiroId: 'parceiroId' in dados ? dados.parceiroId : atual.parceiroId,
    modulo: 'modulo' in dados ? dados.modulo : atual.modulo,
    menuFuncionalidade:
      'menuFuncionalidade' in dados ? dados.menuFuncionalidade : atual.menuFuncionalidade,
    tipo: 'tipo' in dados ? dados.tipo : atual.tipo,
    impacto: 'impacto' in dados ? dados.impacto : atual.impacto,
    descricaoCompleta:
      'descricaoCompleta' in dados ? dados.descricaoCompleta : atual.descricaoCompleta,
    descricaoHtml: 'descricaoHtml' in dados ? dados.descricaoHtml : atual.descricaoHtml,
    solucao: 'solucao' in dados ? dados.solucao : atual.solucao,
    solucaoHtml: 'solucaoHtml' in dados ? dados.solucaoHtml : atual.solucaoHtml,
    manualTitulo: 'manualTitulo' in dados ? dados.manualTitulo : atual.manualTitulo,
    linkManual: 'linkManual' in dados ? dados.linkManual : atual.linkManual,
    linkVideo: 'linkVideo' in dados ? dados.linkVideo : atual.linkVideo,
    imagens: 'imagens' in dados ? dados.imagens : atual.imagens,
    tags: 'tags' in dados ? dados.tags : atual.tags
  }

  const entrada = await validarEntrada(mesclado, id)
  const vinculos = await resolverVinculos(entrada)
  const mudouVinculos =
    atual.releaseId !== entrada.releaseId ||
    atual.manualId !== entrada.manualId ||
    atual.projetoId !== entrada.projetoId
  const preparada = prepararChamada(id, entrada, vinculos, {
    id: atual.autorId,
    nome: atual.autorNome
  }, atual.status)

  const tx = await getTransaction()
  try {
    await tx.query(
      `UPDATE entregas_itens
          SET origem = ?, release_id = ?, projeto_id = ?, manual_id = ?, software_id = ?,
              parceiro_id = ?, chamada = ?, data_lancamento = ?, data_liberacao = ?,
              \`release\` = ?, titulo = ?, parceiro = ?, software = ?, modulo = ?,
              menu_funcionalidade = ?, tipo = ?, impacto = ?,
              descricao_completa = ?, descricao_html = ?, solucao = ?, solucao_html = ?,
              manual_titulo = ?, link_manual = ?, link_video = ?,
              imagens = ?, tags = ?
        WHERE id = ?`,
      [
        preparada.origem,
        preparada.releaseId,
        preparada.projetoId,
        preparada.manualId,
        preparada.softwareId,
        preparada.parceiroId,
        preparada.chamada,
        preparada.dataLancamento,
        preparada.dataLiberacao,
        preparada.release,
        preparada.titulo,
        preparada.parceiro,
        preparada.software,
        preparada.modulo,
        preparada.menuFuncionalidade,
        preparada.tipo,
        preparada.impacto,
        preparada.descricaoCompleta,
        preparada.descricaoHtml,
        preparada.solucao,
        preparada.solucaoHtml,
        preparada.manualTitulo,
        preparada.linkManual,
        preparada.linkVideo,
        preparada.imagens,
        preparada.tags,
        id
      ]
    )
    await gravarSoftwares(tx, id, preparada.softwares)
    await sincronizarMidias(tx, id, entrada.imagens)
    if (mudouVinculos) {
      await sincronizarStatusPais(tx, paisDosVinculos(vinculos), atorDeAutor(autor))
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('Já existe uma chamada com este número.', {
        erros: { chamada: 'Já existe uma chamada com este número.' }
      })
    }
    throw erro
  }

  const atualizada = await buscarChamada(id)
  if (!atualizada) erro404()
  return atualizada
}

/**
 * Executa a transição de status e grava o histórico na mesma transação, com
 * update condicionado ao status lido (evita dupla aprovação concorrente).
 */
async function transicionarChamada(
  atual: ChamadaModelo,
  novoStatus: StatusChamada,
  dataLiberacao: string | null,
  ator: AtorTransicao,
  opcoes: OpcoesTransicao
): Promise<ChamadaModelo> {
  invalidarCache('chamadas-opcoes')
  const tx = await getTransaction()
  try {
    const resultado = await tx.query<{ affectedRows: number }>(
      `UPDATE entregas_itens
          SET status = ?, data_liberacao = ?,
              publicado_em = CASE
                WHEN ? = 'Publicado' THEN COALESCE(?, CURRENT_TIMESTAMP(6))
                ELSE NULL
              END
        WHERE id = ? AND status = ?`,
      [
        novoStatus,
        dataLiberacao,
        novoStatus,
        publicadoEmFuturo(dataLiberacao),
        atual.id,
        atual.status
      ]
    )
    if (Number(resultado.affectedRows) !== 1) {
      erro409('A chamada já avançou na esteira. Recarregue a lista.')
    }
    await registrarTransicao(tx, {
      itemId: atual.id,
      chamada: atual.chamada,
      statusAnterior: atual.status,
      novoStatus,
      ator,
      parecer: opcoes.parecer,
      criterios: opcoes.criterios
    })
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
  const atualizada = await buscarChamada(atual.id)
  if (!atualizada) erro404()
  return atualizada
}

export async function aprovarChamada(
  id: string,
  ator: AtorTransicao,
  opcoes: OpcoesTransicao = {}
): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Revisar') {
    erro409('Somente chamadas em Revisar podem ser aprovadas.')
  }

  let dataLiberacao = atual.dataLiberacao || null
  if (!dataLiberacao && (atual.releaseId || atual.manualId || atual.projetoId)) {
    const pais = await query<Row[]>(
      `SELECT COALESCE(
         (SELECT data_publicacao FROM release_week WHERE id = ?),
         (SELECT data_publicacao FROM manuais_mensal WHERE id = ?),
         (SELECT data_publicacao FROM projetos_escopo WHERE id = ?)
       ) AS data_publicacao`,
      [atual.releaseId || null, atual.manualId || null, atual.projetoId || null]
    )
    dataLiberacao = pais[0] ? dataDia(pais[0].data_publicacao) || null : null
  }

  return transicionarChamada(atual, 'Aprovado', dataLiberacao, ator, {
    ...opcoes,
    criterios: opcoes.criterios ?? true
  })
}

export async function desaprovarChamada(
  id: string,
  ator: AtorTransicao,
  opcoes: OpcoesTransicao = {}
): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Aprovado' && atual.status !== 'Recusado') {
    erro409('Somente chamadas aprovadas ou recusadas podem voltar para Revisar.')
  }

  return transicionarChamada(atual, 'Revisar', null, ator, {
    ...opcoes,
    criterios: false
  })
}

export async function recusarChamada(
  id: string,
  ator: AtorTransicao,
  opcoes: OpcoesTransicao = {}
): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Revisar') {
    erro409('Somente chamadas em Revisar podem ser recusadas.')
  }

  const erroParecer = validarParecer('recusar', opcoes.parecer ?? '')
  if (erroParecer) {
    erro400(erroParecer, { erros: { parecer: erroParecer } })
  }

  return transicionarChamada(atual, 'Recusado', atual.dataLiberacao || null, ator, {
    ...opcoes,
    criterios: false
  })
}

async function temVinculoPublicado(chamada: ChamadaModelo): Promise<boolean> {
  const linhas = await query<Row[]>(
    `SELECT (
        EXISTS (
          SELECT 1 FROM release_week r
           WHERE r.id = ? AND r.status = 'Publicado' AND r.arquivada = 0
        )
        OR EXISTS (
          SELECT 1 FROM manuais_mensal m
           WHERE m.id = ? AND m.status = 'Publicado' AND m.arquivada = 0
        )
        OR EXISTS (
          SELECT 1 FROM projetos_escopo p
           WHERE p.id = ? AND p.status = 'Publicado' AND p.arquivada = 0
        )
      ) AS publicado`,
    [chamada.releaseId || null, chamada.manualId || null, chamada.projetoId || null]
  )
  return Number(linhas[0]?.publicado ?? 0) === 1
}

export async function publicarChamada(
  id: string,
  ator: AtorTransicao,
  opcoes: OpcoesTransicao = {}
): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Aprovado') {
    erro409('Somente chamadas aprovadas podem ser publicadas.')
  }

  const novoStatus: StatusChamada = (await temVinculoPublicado(atual))
    ? 'Publicado'
    : 'Publicar'

  return transicionarChamada(atual, novoStatus, atual.dataLiberacao || null, ator, {
    ...opcoes,
    criterios: true
  })
}

export async function suspenderChamada(
  id: string,
  ator: AtorTransicao,
  opcoes: OpcoesTransicao = {}
): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Publicar' && atual.status !== 'Publicado') {
    erro409('Somente chamadas aguardando publicação ou publicadas podem ser suspensas.')
  }

  return transicionarChamada(atual, 'Aprovado', atual.dataLiberacao || null, ator, {
    ...opcoes,
    criterios: true
  })
}

export async function excluirChamada(id: string): Promise<ChamadaModelo> {
  invalidarCache('chamadas-opcoes')
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Revisar') {
    erro409('Chamada já avançou na esteira e não pode ser excluída.')
  }
  if (atual.temHistorico) {
    erro409('Chamada com histórico na esteira não pode ser excluída.')
  }
  await query('DELETE FROM entregas_itens WHERE id = ?', [id])
  return atual
}

export async function removerImagensChamadas(urls: string[], idAtual: string): Promise<void> {
  const raiz = resolve(uploadsDir(), 'chamadas')
  for (const url of urls) {
    if (!url.startsWith('/uploads/chamadas/')) continue
    const relativo = url.slice('/uploads/'.length)
    const caminho = resolve(uploadsDir(), relativo)
    if (!caminho.startsWith(`${raiz}${sep}`)) continue

    try {
      const referenciada = await urlReferenciadaPorOutraChamada(url, idAtual)
      if (referenciada) continue
      await unlink(caminho)
    } catch (erro) {
      if ((erro as { code?: string } | null)?.code !== 'ENOENT') {
        console.error('[lancar-chamadas] Falha ao remover imagem:', caminho, erro)
      }
    }
  }
}

const mapaPorCodigo = (linhas: Row[], campo = 'codigo'): Map<string, Row> =>
  new Map(linhas.map((row) => [texto(row[campo]).toUpperCase(), row]))

export async function importarChamadas(
  linhas: unknown,
  autor: AutorChamada
): Promise<{ importados: number }> {
  invalidarCache('chamadas-opcoes')
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > LIMITE_IMPORTACAO_CHAMADAS) {
    erro400(`Limite de ${LIMITE_IMPORTACAO_CHAMADAS} linhas por importação.`)
  }

  const [releases, projetos, manuais, softwares, parceiros, existentes] = await Promise.all([
    query<Row[]>(
      "SELECT id, codigo, data_publicacao FROM release_week WHERE status IN ('Aberta', 'Em Revisão')"
    ),
    query<Row[]>(
      "SELECT id, codigo FROM projetos_escopo WHERE status IN ('Em Andamento', 'Homologação')"
    ),
    query<Row[]>(
      "SELECT id, codigo FROM manuais_mensal WHERE status IN ('Rascunho', 'Em Revisão')"
    ),
    query<Row[]>('SELECT codigo, descricao FROM softwares'),
    query<Row[]>('SELECT id, codigo, nome_fantasia FROM parceiros'),
    query<Row[]>('SELECT chamada FROM entregas_itens')
  ])

  const mapaReleases = mapaPorCodigo(releases)
  const mapaProjetos = mapaPorCodigo(projetos)
  const mapaManuais = mapaPorCodigo(manuais)
  const mapaSoftwares = mapaPorCodigo(softwares)
  const mapaParceiros = mapaPorCodigo(parceiros)
  const naBase = new Set(existentes.map((row) => texto(row.chamada).toLowerCase()))
  const vistos = new Set<string>()
  const motivos: string[] = []
  const conflitos: string[] = []
  const preparadas: ChamadaPreparada[] = []
  const paisParaRevisao: PaiRevisao[] = []

  for (const [indice, item] of linhas.entries()) {
    const linha = (item ?? {}) as Record<string, unknown>
    const numeroLinha = indice + 1
    const chamada = texto(linha.chamada)
    const release = mapaReleases.get(texto(linha.releaseCodigo).toUpperCase())
    const projeto = mapaProjetos.get(texto(linha.projetoCodigo).toUpperCase())
    const manual = mapaManuais.get(texto(linha.manualCodigo).toUpperCase())
    const softwareCodigos = normalizarSoftwareIds(linha.softwareCodigos)
    const softwaresLinha = softwareCodigos
      .map((codigo) => mapaSoftwares.get(codigo.toUpperCase()))
      .filter((row): row is Row => Boolean(row))
    const parceiro = mapaParceiros.get(texto(linha.parceiroCodigo).toUpperCase())

    const erroCodigo = (campo: string, codigo: string): void => {
      if (codigo.trim()) motivos.push(`Linha ${numeroLinha}: código de ${campo} não encontrado (${codigo}).`)
    }
    if (texto(linha.releaseCodigo) && !release) erroCodigo('release', texto(linha.releaseCodigo))
    if (texto(linha.projetoCodigo) && !projeto) erroCodigo('projeto', texto(linha.projetoCodigo))
    if (texto(linha.manualCodigo) && !manual) erroCodigo('manual', texto(linha.manualCodigo))
    if (softwareCodigos.length && softwaresLinha.length !== softwareCodigos.length) {
      erroCodigo('software', softwareCodigos.join('; '))
    }
    if (texto(linha.parceiroCodigo) && !parceiro) erroCodigo('parceiro', texto(linha.parceiroCodigo))

    const dataLiberacao =
      texto(linha.dataLiberacao) ||
      (release ? dataDia(release.data_publicacao) : '')

    const entrada: EntradaChamada = {
      chamada,
      titulo: texto(linha.titulo),
      dataLancamento: texto(linha.dataLancamento),
      dataLiberacao,
      releaseId: release ? texto(release.id) : '',
      projetoId: projeto ? texto(projeto.id) : '',
      manualId: manual ? texto(manual.id) : '',
      softwareIds: softwareCodigos,
      parceiroId: parceiro ? texto(parceiro.id) : '',
      modulo: texto(linha.modulo),
      menuFuncionalidade: texto(linha.menuFuncionalidade),
      tipo: texto(linha.tipo) as TipoChamada,
      impacto: texto(linha.impacto) as ImpactoChamada,
      descricaoCompleta: texto(linha.descricaoCompleta),
      descricaoHtml: '',
      solucao: '',
      solucaoHtml: '',
      manualTitulo: texto(linha.manualTitulo),
      linkManual: texto(linha.linkManual),
      linkVideo: texto(linha.linkVideo),
      imagens: [],
      tags: normalizarTagsChamada(linha.tags)
    }

    const resultado = validarChamada(entrada)
    if (!resultado.valido) {
      const primeiro = resultado.primeiroErro
      motivos.push(
        `Linha ${numeroLinha}: ${(primeiro ? resultado.erros[primeiro] : '') || 'dados inválidos.'}`
      )
      continue
    }

    const chave = chamada.toLowerCase()
    if (vistos.has(chave)) {
      motivos.push(`Linha ${numeroLinha}: chamada repetida no arquivo (${chamada}).`)
      continue
    }
    vistos.add(chave)

    if (naBase.has(chave)) {
      conflitos.push(`Linha ${numeroLinha}: chamada já cadastrada (${chamada}).`)
      continue
    }

    const vinculos: VinculosResolvidos = {
      release: release ?? null,
      projeto: projeto ?? null,
      manual: manual ?? null,
      softwares: softwaresLinha,
      parceiro: parceiro ?? null,
      dataLiberacao,
      origem: derivarOrigem({
        releaseId: entrada.releaseId,
        projetoId: entrada.projetoId,
        manualId: entrada.manualId
      }) ?? 'Release'
    }

    preparadas.push(prepararChamada(randomUUID(), entrada, vinculos, autor, 'Revisar'))
    paisParaRevisao.push(...paisDosVinculos(vinculos))
  }

  if (motivos.length > 0 || conflitos.length > 0) {
    throw createError({
      statusCode: conflitos.length > 0 && motivos.length === 0 ? 409 : 400,
      statusMessage: 'A importação contém linhas inválidas - nada foi gravado.',
      data: { motivos, conflitos }
    })
  }

  const tx = await getTransaction()
  try {
    for (const preparada of preparadas) {
      await tx.query(SQL_INSERT, valoresInsert(preparada))
      await gravarSoftwares(tx, preparada.id, preparada.softwares)
    }
    await sincronizarStatusPais(tx, paisParaRevisao, atorDeAutor(autor))
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('A importação encontrou chamadas em conflito - nada foi gravado.')
    }
    throw erro
  }

  return { importados: preparadas.length }
}
