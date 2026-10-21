import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { createError } from 'h3'
import { getTransaction, query } from './db'
import { uploadsDir } from './uploads'
import {
  LIMITE_IMPORTACAO_CHAMADAS,
  derivarOrigem,
  normalizarImagensChamada,
  normalizarTagsChamada,
  validarChamada,
  type CatalogosChamada,
  type ChamadaModelo,
  type EntradaChamada,
  type ImpactoChamada,
  type OpcaoChamada,
  type OrigemChamada,
  type SituacaoChamada,
  type StatusChamada,
  type TipoChamada
} from '#shared/lancar-chamadas'

type Row = Record<string, unknown>

export interface AutorChamada {
  id: string
  nome?: string
}

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
  e.impacto, e.situacao, e.descricao_completa, e.manual_titulo, e.link_manual, e.link_video,
  e.imagens, e.status, e.tags, e.criado_em, e.atualizado_em,
  EXISTS (SELECT 1 FROM historico_esteira_revisao h WHERE h.entrega_item_id = e.id) AS tem_historico`

const montarChamada = (row: Row): ChamadaModelo => {
  const status = (texto(row.status) || 'Revisar') as StatusChamada
  return {
    id: texto(row.id),
    origem: (texto(row.origem) || 'Release') as OrigemChamada,
    releaseId: texto(row.release_id),
    projetoId: texto(row.projeto_id),
    manualId: texto(row.manual_id),
    softwareId: texto(row.software_id),
    parceiroId: texto(row.parceiro_id),
    autorId: texto(row.autor_id),
    autorNome: texto(row.autor_nome),
    chamada: texto(row.chamada),
    dataLancamento: dataDia(row.data_lancamento),
    dataLiberacao: dataDia(row.data_liberacao),
    release: texto(row.release),
    titulo: texto(row.titulo),
    parceiro: texto(row.parceiro),
    software: texto(row.software),
    modulo: texto(row.modulo),
    menuFuncionalidade: texto(row.menu_funcionalidade),
    tipo: (texto(row.tipo) || 'Correção') as TipoChamada,
    impacto: (texto(row.impacto) || 'Médio') as ImpactoChamada,
    situacao: (texto(row.situacao) || 'Desenvolvimento') as SituacaoChamada,
    descricaoCompleta: texto(row.descricao_completa),
    manualTitulo: texto(row.manual_titulo),
    linkManual: texto(row.link_manual),
    linkVideo: texto(row.link_video),
    imagens: normalizarImagensChamada(listaJson(row.imagens)),
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
  return linhas.map(montarChamada)
}

export async function buscarChamada(id: string): Promise<ChamadaModelo | null> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS} FROM entregas_itens e WHERE e.id = ? LIMIT 1`,
    [id]
  )
  const linha = linhas[0]
  return linha ? montarChamada(linha) : null
}

export async function listarOpcoesChamadas(): Promise<CatalogosChamada> {
  const [releases, projetos, manuais, softwares, parceiros] = await Promise.all([
    query<Row[]>(
      `SELECT id, codigo, nome, data_publicacao
         FROM release_week
        WHERE arquivada = 0
        ORDER BY data_publicacao DESC, codigo DESC`
    ),
    query<Row[]>(
      `SELECT id, codigo, nome
         FROM projetos_escopo
        WHERE arquivada = 0
        ORDER BY ano DESC, versao DESC, codigo ASC`
    ),
    query<Row[]>(
      `SELECT id, codigo, titulo
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
      dataPublicacao: dataDia(row.data_publicacao)
    })),
    projetos: projetos.map((row) =>
      opcao(texto(row.id), `${texto(row.codigo)} - ${texto(row.nome)}`, texto(row.codigo))
    ),
    manuais: manuais.map((row) =>
      opcao(texto(row.id), `${texto(row.codigo)} - ${texto(row.titulo)}`, texto(row.codigo))
    ),
    softwares: softwares.map((row) =>
      opcao(texto(row.codigo), texto(row.descricao), texto(row.codigo))
    ),
    parceiros: parceiros.map((row) =>
      opcao(texto(row.id), texto(row.nome_fantasia), texto(row.codigo))
    )
  }
}

function montarEntrada(dados: Record<string, unknown>): EntradaChamada {
  return {
    chamada: texto(dados.chamada),
    titulo: texto(dados.titulo),
    dataLancamento: texto(dados.dataLancamento),
    dataLiberacao: texto(dados.dataLiberacao),
    releaseId: texto(dados.releaseId),
    projetoId: texto(dados.projetoId),
    manualId: texto(dados.manualId),
    softwareId: texto(dados.softwareId),
    parceiroId: texto(dados.parceiroId),
    modulo: texto(dados.modulo),
    menuFuncionalidade: texto(dados.menuFuncionalidade),
    tipo: texto(dados.tipo) as TipoChamada,
    impacto: texto(dados.impacto) as ImpactoChamada,
    situacao: texto(dados.situacao) as SituacaoChamada,
    descricaoCompleta: texto(dados.descricaoCompleta),
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
  software: Row | null
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

  const software = entrada.softwareId
    ? (await query<Row[]>(
        'SELECT codigo, descricao FROM softwares WHERE codigo = ? LIMIT 1',
        [entrada.softwareId]
      ))[0] ?? null
    : null
  if (entrada.softwareId && !software) {
    erro400('Software não encontrado.', { erros: { softwareId: 'Selecione um software válido.' } })
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
    software,
    parceiro,
    dataLiberacao: entrada.dataLiberacao,
    origem
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
  modulo: string
  menuFuncionalidade: string | null
  tipo: TipoChamada
  impacto: ImpactoChamada
  situacao: SituacaoChamada
  descricaoCompleta: string
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
  return {
    id,
    origem: vinculos.origem,
    releaseId: entrada.releaseId || null,
    projetoId: entrada.projetoId || null,
    manualId: entrada.manualId || null,
    softwareId: entrada.softwareId || null,
    parceiroId: entrada.parceiroId || null,
    autorId: autor.id,
    autorNome: (autor.nome ?? '').slice(0, 150),
    chamada: entrada.chamada,
    dataLancamento: entrada.dataLancamento,
    dataLiberacao: vinculos.dataLiberacao || null,
    release: vinculos.release ? texto(vinculos.release.codigo) : null,
    titulo: entrada.titulo,
    parceiro: vinculos.parceiro ? texto(vinculos.parceiro.nome_fantasia) : '',
    software: vinculos.software ? texto(vinculos.software.descricao) : '',
    modulo: entrada.modulo,
    menuFuncionalidade: entrada.menuFuncionalidade || null,
    tipo: entrada.tipo,
    impacto: entrada.impacto,
    situacao: entrada.situacao,
    descricaoCompleta: entrada.descricaoCompleta,
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
   modulo, menu_funcionalidade, tipo, impacto, situacao, descricao_completa, manual_titulo,
   link_manual, link_video, imagens, status, tags)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

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
  p.situacao,
  p.descricaoCompleta,
  p.manualTitulo,
  p.linkManual,
  p.linkVideo,
  p.imagens,
  p.status,
  p.tags
]

export async function criarChamada(
  dados: Record<string, unknown>,
  autor: AutorChamada
): Promise<ChamadaModelo> {
  const entrada = await validarEntrada(dados)
  entrada.dataLiberacao = ''
  const vinculos = await resolverVinculos(entrada)
  const preparada = prepararChamada(randomUUID(), entrada, vinculos, autor, 'Revisar')
  try {
    await query(SQL_INSERT, valoresInsert(preparada))
  } catch (erro) {
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
  dados: Record<string, unknown>
): Promise<ChamadaModelo> {
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
    softwareId: 'softwareId' in dados ? dados.softwareId : atual.softwareId,
    parceiroId: 'parceiroId' in dados ? dados.parceiroId : atual.parceiroId,
    modulo: 'modulo' in dados ? dados.modulo : atual.modulo,
    menuFuncionalidade:
      'menuFuncionalidade' in dados ? dados.menuFuncionalidade : atual.menuFuncionalidade,
    tipo: 'tipo' in dados ? dados.tipo : atual.tipo,
    impacto: 'impacto' in dados ? dados.impacto : atual.impacto,
    situacao: 'situacao' in dados ? dados.situacao : atual.situacao,
    descricaoCompleta:
      'descricaoCompleta' in dados ? dados.descricaoCompleta : atual.descricaoCompleta,
    manualTitulo: 'manualTitulo' in dados ? dados.manualTitulo : atual.manualTitulo,
    linkManual: 'linkManual' in dados ? dados.linkManual : atual.linkManual,
    linkVideo: 'linkVideo' in dados ? dados.linkVideo : atual.linkVideo,
    imagens: 'imagens' in dados ? dados.imagens : atual.imagens,
    tags: 'tags' in dados ? dados.tags : atual.tags
  }

  const entrada = await validarEntrada(mesclado, id)
  const vinculos = await resolverVinculos(entrada)
  const preparada = prepararChamada(id, entrada, vinculos, {
    id: atual.autorId,
    nome: atual.autorNome
  }, atual.status)

  try {
    await query(
      `UPDATE entregas_itens
          SET origem = ?, release_id = ?, projeto_id = ?, manual_id = ?, software_id = ?,
              parceiro_id = ?, chamada = ?, data_lancamento = ?, data_liberacao = ?,
              \`release\` = ?, titulo = ?, parceiro = ?, software = ?, modulo = ?,
              menu_funcionalidade = ?, tipo = ?, impacto = ?, situacao = ?,
              descricao_completa = ?, manual_titulo = ?, link_manual = ?, link_video = ?,
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
        preparada.situacao,
        preparada.descricaoCompleta,
        preparada.manualTitulo,
        preparada.linkManual,
        preparada.linkVideo,
        preparada.imagens,
        preparada.tags,
        id
      ]
    )
  } catch (erro) {
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

export async function aprovarChamada(id: string): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Revisar') {
    erro409('Somente chamadas em Revisar podem ser aprovadas.')
  }

  let dataLiberacao: string | null = null
  if (atual.releaseId) {
    const releases = await query<Row[]>(
      'SELECT data_publicacao FROM release_week WHERE id = ? LIMIT 1',
      [atual.releaseId]
    )
    dataLiberacao = releases[0] ? dataDia(releases[0].data_publicacao) || null : null
  }

  await query(
    "UPDATE entregas_itens SET status = 'Aprovado', data_liberacao = ? WHERE id = ?",
    [dataLiberacao, id]
  )
  const aprovada = await buscarChamada(id)
  if (!aprovada) erro404()
  return aprovada
}

export async function desaprovarChamada(id: string): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Aprovado') {
    erro409('Somente chamadas aprovadas podem voltar para Revisar.')
  }

  await query(
    "UPDATE entregas_itens SET status = 'Revisar', data_liberacao = NULL WHERE id = ?",
    [id]
  )
  const desaprovada = await buscarChamada(id)
  if (!desaprovada) erro404()
  return desaprovada
}

export async function recusarChamada(id: string): Promise<ChamadaModelo> {
  const atual = await buscarChamada(id)
  if (!atual) erro404()
  if (atual.status !== 'Revisar') {
    erro409('Somente chamadas em Revisar podem ser recusadas.')
  }
  await query("UPDATE entregas_itens SET status = 'Recusado' WHERE id = ?", [id])
  const recusada = await buscarChamada(id)
  if (!recusada) erro404()
  return recusada
}

export async function excluirChamada(id: string): Promise<ChamadaModelo> {
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
      const referencias = await query<Row[]>(
        `SELECT id FROM entregas_itens
          WHERE id <> ? AND imagens IS NOT NULL
            AND JSON_CONTAINS(imagens, JSON_QUOTE(?))
          LIMIT 1`,
        [idAtual, url]
      )
      if (referencias.length > 0) continue
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
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > LIMITE_IMPORTACAO_CHAMADAS) {
    erro400(`Limite de ${LIMITE_IMPORTACAO_CHAMADAS} linhas por importação.`)
  }

  const [releases, projetos, manuais, softwares, parceiros, existentes] = await Promise.all([
    query<Row[]>('SELECT id, codigo, data_publicacao FROM release_week'),
    query<Row[]>('SELECT id, codigo FROM projetos_escopo'),
    query<Row[]>('SELECT id, codigo FROM manuais_mensal'),
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

  for (const [indice, item] of linhas.entries()) {
    const linha = (item ?? {}) as Record<string, unknown>
    const numeroLinha = indice + 1
    const chamada = texto(linha.chamada)
    const release = mapaReleases.get(texto(linha.releaseCodigo).toUpperCase())
    const projeto = mapaProjetos.get(texto(linha.projetoCodigo).toUpperCase())
    const manual = mapaManuais.get(texto(linha.manualCodigo).toUpperCase())
    const software = mapaSoftwares.get(texto(linha.softwareCodigo).toUpperCase())
    const parceiro = mapaParceiros.get(texto(linha.parceiroCodigo).toUpperCase())

    const erroCodigo = (campo: string, codigo: string): void => {
      if (codigo.trim()) motivos.push(`Linha ${numeroLinha}: código de ${campo} não encontrado (${codigo}).`)
    }
    if (texto(linha.releaseCodigo) && !release) erroCodigo('release', texto(linha.releaseCodigo))
    if (texto(linha.projetoCodigo) && !projeto) erroCodigo('projeto', texto(linha.projetoCodigo))
    if (texto(linha.manualCodigo) && !manual) erroCodigo('manual', texto(linha.manualCodigo))
    if (texto(linha.softwareCodigo) && !software) erroCodigo('software', texto(linha.softwareCodigo))
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
      softwareId: software ? texto(software.codigo) : '',
      parceiroId: parceiro ? texto(parceiro.id) : '',
      modulo: texto(linha.modulo),
      menuFuncionalidade: texto(linha.menuFuncionalidade),
      tipo: texto(linha.tipo) as TipoChamada,
      impacto: texto(linha.impacto) as ImpactoChamada,
      situacao: 'Desenvolvimento',
      descricaoCompleta: texto(linha.descricaoCompleta),
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
      software: software ?? null,
      parceiro: parceiro ?? null,
      dataLiberacao,
      origem: derivarOrigem({
        releaseId: entrada.releaseId,
        projetoId: entrada.projetoId,
        manualId: entrada.manualId
      }) ?? 'Release'
    }

    preparadas.push(prepararChamada(randomUUID(), entrada, vinculos, autor, 'Revisar'))
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
    }
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
