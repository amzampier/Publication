// server/utils/perfis.ts — acesso às tabelas perfis_acesso / permissoes_perfil
// (docs/02 §3.5). Fonte dos ids de módulo e das 9 ações: app/components/perfis/
// usePerfisModelo.ts + docs/07 — a lista está duplicada de propósito (barreira
// app/ × server/): mantenha os dois lados em sincronia (spec perfis-acesso,
// cenário "Matriz com módulo ou ação desconhecida é recusada").
import { createError } from 'h3'
import { query, getTransaction } from './db'
import { revogarSessoesDoPerfil } from './auth'
import type { Transaction } from './db'
import { invalidarCache } from './cache'

export type SituacaoPerfil = 'Ativo' | 'Inativo' | 'Bloqueado'

/** Shape da tela (PerfilDemo) — o frontend nunca vê o shape tabular do banco. */
export interface PerfilApi {
  id: string
  nome: string
  descricao: string
  situacao: SituacaoPerfil
  /** ISO 8601 */
  criado_em: string
  /** ISO 8601 */
  atualizado_em: string
  /** Usuários vinculados (COUNT da tabela usuarios — D4 do design) */
  usuarios: number
  /** módulo -> ações concedidas (módulo sem linha = []) */
  permissoes: Record<string, string[]>
}

/** Os 11 módulos da sidebar (mesma ordem/ids de usePerfisModelo.MODULOS). */
export const MODULOS_IDS = [
  'manuais',
  'release-week',
  'escopo-projetos',
  'esteira-revisao',
  'lancar-chamadas',
  'parceiros',
  'softwares',
  'gestao-usuarios',
  'perfis-acesso',
  'auditoria',
  'configuracoes-globais'
] as const

/** Funcionalidades fixas (colunas TINYINT de permissoes_perfil). */
export const FUNCIONALIDADES_FIXAS = ['visualizar', 'criar', 'alterar', 'excluir'] as const

/**
 * Catálogo de funcionalidades POR MÓDULO (fonte única da matriz). Espelhado em
 * app/components/perfis/usePerfisModelo.ts (barreira app/ × server/ — mantenha os
 * dois lados em sincronia; teste tests/perfis-funcionalidades.test.ts).
 * As fixas viram colunas; as específicas vão no `extras` JSON.
 */
export const FUNCIONALIDADES_POR_MODULO: Record<string, readonly string[]> = {
  'manuais': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'exportar', 'importar', 'filtrar', 'buscar', 'clonar', 'visualizar_itens'],
  'release-week': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'exportar', 'importar', 'filtrar', 'buscar', 'clonar', 'visualizar_itens'],
  'escopo-projetos': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'exportar', 'importar', 'filtrar', 'buscar'],
  'esteira-revisao': ['visualizar', 'alterar', 'publicar', 'arquivar', 'filtrar'],
  'lancar-chamadas': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'filtrar', 'buscar'],
  'parceiros': ['visualizar', 'criar', 'alterar', 'excluir', 'importar', 'exportar', 'filtrar', 'buscar'],
  'softwares': ['visualizar', 'criar', 'alterar', 'excluir', 'importar', 'exportar', 'filtrar', 'buscar'],
  'gestao-usuarios': ['visualizar', 'criar', 'alterar', 'excluir', 'importar', 'exportar', 'filtrar', 'buscar', 'convite'],
  'perfis-acesso': ['visualizar', 'criar', 'alterar', 'excluir', 'permissoes', 'exportar', 'filtrar', 'buscar'],
  'auditoria': ['visualizar', 'exportar', 'filtrar', 'buscar'],
  'configuracoes-globais': ['visualizar', 'alterar']
}

/** Funcionalidades específicas (não-fixas) — persistidas no `extras` JSON. */
export const FUNCIONALIDADES_EXTRAS = [
  'publicar', 'arquivar', 'download', 'exportar', 'importar', 'filtrar', 'buscar', 'permissoes', 'convite', 'clonar', 'visualizar_itens'
] as const

/** Ações fixas -> colunas TINYINT do permissoes_perfil (docs/02 §3.5). */
export const COLUNA_POR_ACAO: Record<string, string> = {
  visualizar: 'pode_visualizar',
  criar: 'pode_incluir',
  alterar: 'pode_editar',
  excluir: 'pode_excluir'
}

/**
 * Módulos essenciais da administração (change rbac-require-permission, D5): o
 * sistema não pode ficar sem NENHUM usuário ativo com `alterar` nestes três.
 */
const MODULOS_ESSENCIAIS = ['gestao-usuarios', 'perfis-acesso', 'configuracoes-globais'] as const
const SITUACOES: SituacaoPerfil[] = ['Ativo', 'Inativo', 'Bloqueado']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function erro400(mensagem: string): never {
  throw createError({ statusCode: 400, statusMessage: mensagem })
}
function erro404(mensagem = 'Perfil não encontrado.'): never {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}
function erro409(mensagem: string): never {
  throw createError({ statusCode: 409, statusMessage: mensagem })
}

// ---------------------------------------------------------------------------
// Validações de entrada (espelham a do cliente — design D8)
// ---------------------------------------------------------------------------

export function validarId(id: unknown): string {
  const valor = typeof id === 'string' ? id.trim() : ''
  if (!UUID_RE.test(valor)) erro404()
  return valor
}

export function validarNome(nome: unknown): string {
  if (typeof nome !== 'string' || !nome.trim()) erro400('Informe o nome do perfil.')
  const valor = nome.trim()
  if (valor.length > 100) erro400('O nome do perfil deve ter no máximo 100 caracteres.')
  return valor
}

export function validarSituacao(situacao: unknown): SituacaoPerfil {
  if (typeof situacao !== 'string' || !SITUACOES.includes(situacao as SituacaoPerfil)) {
    erro400('Situação deve ser Ativo, Inativo ou Bloqueado.')
  }
  return situacao as SituacaoPerfil
}

export function validarDescricao(descricao: unknown): string {
  if (descricao === undefined || descricao === null) return ''
  if (typeof descricao !== 'string') erro400('Descrição deve ser texto.')
  if (descricao.length > 65535) erro400('Descrição longa demais.')
  return descricao
}

/** Normaliza o corpo da matriz: só ids de módulo/ação conhecidos (senão 400). */
export function validarMatriz(matriz: unknown): Record<string, string[]> {
  if (!matriz || typeof matriz !== 'object' || Array.isArray(matriz)) {
    erro400('permissoes deve ser um objeto módulo -> ações.')
  }
  const resultado: Record<string, string[]> = {}
  for (const [modulo, acoes] of Object.entries(matriz as Record<string, unknown>)) {
    const permitidas = FUNCIONALIDADES_POR_MODULO[modulo]
    if (!permitidas) {
      erro400(`Módulo desconhecido: ${modulo}.`)
    }
    if (!Array.isArray(acoes)) erro400(`Ações de ${modulo} devem ser uma lista.`)
    for (const acao of acoes) {
      if (typeof acao !== 'string' || !permitidas.includes(acao)) {
        erro400(`Funcionalidade desconhecida em ${modulo}: ${String(acao)}.`)
      }
    }
    // dedupe preservando ordem
    resultado[modulo] = [...new Set(acoes as string[])]
  }

  // `clonar` só faz sentido com `criar`: a clonagem grava pela mesma criação.
  for (const modulo of ['release-week', 'manuais'] as const) {
    const acoes = resultado[modulo] ?? []
    if (acoes.includes('clonar') && !acoes.includes('criar')) {
      erro400(`A funcionalidade clonar exige criar no módulo ${modulo}.`)
    }
  }

  return resultado
}

// ---------------------------------------------------------------------------
// Normalização banco -> shape da tela
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>

const dataIso = (valor: unknown): string => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const d = new Date(valor)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
    return valor
  }
  return ''
}

/** Normaliza o campo `extras` (JSON) para a lista de ações extras conhecidas. */
export const parseExtras = (extras: unknown): string[] => {
  let valor: unknown = extras
  if (typeof valor === 'string') {
    try {
      valor = JSON.parse(valor)
    } catch {
      return []
    }
  }
  if (!Array.isArray(valor)) return []
  return valor.filter(
    (a): a is string => typeof a === 'string' && (FUNCIONALIDADES_EXTRAS as readonly string[]).includes(a)
  )
}

/** Linhas de permissoes_perfil -> Map<perfil_id, matriz normalizada>. */
const carregarMatrizes = async (perfilIds: string[]): Promise<Map<string, Record<string, string[]>>> => {
  const mapa = new Map<string, Record<string, string[]>>()
  if (perfilIds.length === 0) return mapa
  const placeholders = perfilIds.map(() => '?').join(', ')
  const linhas = await query<Row[]>(
    `SELECT perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras
       FROM permissoes_perfil WHERE perfil_id IN (${placeholders})`,
    perfilIds
  )
  for (const perfilId of perfilIds) mapa.set(perfilId, matrizVazia())
  for (const linha of linhas) {
    const matriz = mapa.get(String(linha.perfil_id))
    if (!matriz) continue
    const modulo = String(linha.modulo)
    if (!(MODULOS_IDS as readonly string[]).includes(modulo)) continue
    const acoes: string[] = []
    for (const [acao, coluna] of Object.entries(COLUNA_POR_ACAO)) {
      if (Number(linha[coluna]) === 1) acoes.push(acao)
    }
    acoes.push(...parseExtras(linha.extras))
    matriz[modulo] = acoes
  }
  return mapa
}

/** Map<perfil_id, total de usuários vinculados> (GROUP BY — D4). */
const carregarVinculos = async (): Promise<Map<string, number>> => {
  const linhas = await query<{ perfil_id: string; total: number }[]>(
    'SELECT perfil_id, COUNT(*) AS total FROM usuarios GROUP BY perfil_id'
  )
  return new Map(linhas.map((l) => [String(l.perfil_id), Number(l.total)]))
}

const matrizVazia = (): Record<string, string[]> =>
  Object.fromEntries(MODULOS_IDS.map((m) => [m, [] as string[]]))

const montarPerfil = (
  row: Row,
  matriz: Record<string, string[]>,
  usuarios: number
): PerfilApi => ({
  id: String(row.id),
  nome: String(row.nome_perfil ?? ''),
  descricao: row.descricao === null || row.descricao === undefined ? '' : String(row.descricao),
  situacao: String(row.situacao) as SituacaoPerfil,
  criado_em: dataIso(row.criado_em),
  atualizado_em: dataIso(row.atualizado_em),
  usuarios,
  permissoes: matriz
})

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

/** Lista completa: perfis + matrizes + contagem de vínculos (GET /api/perfis). */
export async function listarPerfis(): Promise<PerfilApi[]> {
  const linhas = await query<Row[]>(
    'SELECT id, nome_perfil, descricao, situacao, criado_em, atualizado_em FROM perfis_acesso ORDER BY nome_perfil ASC'
  )
  const ids = linhas.map((l) => String(l.id))
  const [matrizes, vinculos] = await Promise.all([carregarMatrizes(ids), carregarVinculos()])
  return linhas.map((l) => {
    const id = String(l.id)
    return montarPerfil(l, matrizes.get(id) ?? matrizVazia(), vinculos.get(id) ?? 0)
  })
}

/** Um perfil pelo id ou null (sem lances de cast: id já validado pelo chamador). */
export async function buscarPerfil(id: string): Promise<PerfilApi | null> {
  const linhas = await query<Row[]>(
    'SELECT id, nome_perfil, descricao, situacao, criado_em, atualizado_em FROM perfis_acesso WHERE id = ? LIMIT 1',
    [id]
  )
  const linha = linhas[0]
  if (!linha) return null
  const [matrizes, vinculos] = await Promise.all([carregarMatrizes([id]), contarVinculos(id)])
  return montarPerfil(linha, matrizes.get(id) ?? matrizVazia(), vinculos)
}

/** Contagem de usuários vinculados (guarda da exclusão — spec 409). */
export async function contarVinculos(perfilId: string): Promise<number> {
  const linhas = await query<{ total: number }[]>(
    'SELECT COUNT(*) AS total FROM usuarios WHERE perfil_id = ?',
    [perfilId]
  )
  return Number(linhas[0]?.total ?? 0)
}

// ---------------------------------------------------------------------------
// Escritas
// ---------------------------------------------------------------------------

/** Cria o perfil (UUID gerado pelo banco via SELECT UUID()). Matriz fica 0/99. */
export async function criarPerfil(dados: {
  nome: unknown
  descricao?: unknown
  situacao: unknown
}): Promise<PerfilApi> {
  const nome = validarNome(dados.nome)
  const descricao = validarDescricao(dados.descricao)
  const situacao = validarSituacao(dados.situacao)

  const idRows = await query<{ id: string }[]>('SELECT UUID() AS id')
  const id = String(idRows[0]?.id ?? '')
  try {
    await query(
      'INSERT INTO perfis_acesso (id, nome_perfil, descricao, situacao) VALUES (?, ?, ?, ?)',
      [id, nome, descricao, situacao]
    )
  } catch (erro: unknown) {
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409(`Já existe um perfil com o nome "${nome}".`)
    }
    throw erro
  }
  invalidarCache('usuarios-opcoes')
  const perfil = await buscarPerfil(id)
  if (!perfil) erro404('Falha ao criar o perfil.')
  return perfil
}

/** Atualiza nome/descricao/situacao (criado_em preservado; atualizado_em pelo banco). */
export async function atualizarPerfil(
  id: string,
  dados: { nome?: unknown; descricao?: unknown; situacao?: unknown }
): Promise<PerfilApi> {
  const existente = await buscarPerfil(id)
  if (!existente) erro404()

  const nome = 'nome' in dados ? validarNome(dados.nome) : existente.nome
  const descricao = 'descricao' in dados ? validarDescricao(dados.descricao) : existente.descricao
  const situacao = 'situacao' in dados ? validarSituacao(dados.situacao) : existente.situacao

  const tx = await getTransaction()
  try {
    await tx.query(
      'UPDATE perfis_acesso SET nome_perfil = ?, descricao = ?, situacao = ? WHERE id = ?',
      [nome, descricao, situacao, id]
    )
    // Inativar/bloquear o perfil derruba as sessões dos usuários vinculados
    // (change endurecer-revogacao-e-autorizacao, D2.3) — defesa em profundidade
    // sobre a checagem de sessão por requisição.
    if (situacao !== 'Ativo' && existente.situacao === 'Ativo') {
      await revogarSessoesDoPerfil(id, (sql, values) => tx.query(sql, values))
    }
    // RL05-A-02: inativar/bloquear o perfil não pode zerar a administração essencial.
    await garantirAdministracaoApos(tx)
    await tx.commit()
  } catch (erro: unknown) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409(`Já existe um perfil com o nome "${nome}".`)
    }
    throw erro
  }
  invalidarCache('usuarios-opcoes')
  const perfil = await buscarPerfil(id)
  if (!perfil) erro404()
  return perfil
}

/**
 * Exclui o perfil (permissoes_perfil vai em CASCADE). Guarda de vínculo no
 * servidor: 409 quando há usuários; a FK RESTRICT (errno 1451) é o backstop.
 */
export async function excluirPerfil(id: string): Promise<void> {
  const existente = await buscarPerfil(id)
  if (!existente) erro404()

  const vinculos = await contarVinculos(id)
  if (vinculos > 0) {
    erro409(
      `O perfil "${existente.nome}" não pode ser excluído: existem usuários vinculados a ele.`
    )
  }

  try {
    await query('DELETE FROM perfis_acesso WHERE id = ?', [id])
  } catch (erro: unknown) {
    const errno = (erro as { errno?: number } | null)?.errno
    if (errno === 1451) {
      erro409(
        `O perfil "${existente.nome}" não pode ser excluído: existem usuários vinculados a ele.`
      )
    }
    throw erro
  }
  invalidarCache('usuarios-opcoes')
}

/**
 * Conta usuários ATIVOS cujo perfil concede `alterar` (pode_editar) nos três
 * módulos essenciais, DENTRO da transação — enxerga a matriz recém-gravada, de
 * modo que 0 significa lockout pós-alteração.
 */
async function contarAdministradoresEssenciais(tx: Transaction): Promise<number> {
  const joins = MODULOS_ESSENCIAIS.map(
    (_m, i) =>
      `JOIN permissoes_perfil p${i} ON p${i}.perfil_id = u.perfil_id AND p${i}.modulo = ? AND p${i}.pode_editar = 1`
  ).join('\n       ')
  const linhas = await tx.query<Array<{ total: number }>>(
    `SELECT COUNT(*) AS total
       FROM usuarios u
       JOIN perfis_acesso pa ON pa.id = u.perfil_id AND pa.situacao = 'Ativo'
       ${joins}
      WHERE u.situacao = 'Ativo'`,
    [...MODULOS_ESSENCIAIS]
  )
  return Number(linhas[0]?.total ?? 0)
}

/**
 * 409 quando a alteração deixaria o sistema sem administração essencial.
 * Exportada para reuso na gestão de usuários (desativar/excluir o último
 * administrador — change endurecer-revogacao-e-autorizacao, D4).
 */
export async function garantirAdministracaoApos(tx: Transaction): Promise<void> {
  if ((await contarAdministradoresEssenciais(tx)) === 0) {
    erro409(
      'Esta alteração deixaria o sistema sem nenhum usuário ativo com permissão de alterar em Gestão de Usuários, Perfis de Acesso e Configurações Globais.'
    )
  }
}

/**
 * Substitui a matriz inteira do perfil em transação (DELETE + INSERT das 11
 * linhas — D3). Módulo ausente do corpo vira matriz vazia; ações extras vazias
 * gravam `extras = NULL` (mesmo padrão do seed).
 */
export async function salvarMatriz(
  id: string,
  matriz: unknown
): Promise<PerfilApi> {
  const corpo = validarMatriz(matriz)
  const existente = await buscarPerfil(id)
  if (!existente) erro404()

  const tx = await getTransaction()
  try {
    await tx.query('DELETE FROM permissoes_perfil WHERE perfil_id = ?', [id])
    const linhas = MODULOS_IDS.map((modulo) => {
      const acoes = corpo[modulo] ?? []
      const extras = acoes.filter((a) => (FUNCIONALIDADES_EXTRAS as readonly string[]).includes(a))
      return [
        id,
        modulo,
        acoes.includes('visualizar') ? 1 : 0,
        acoes.includes('criar') ? 1 : 0,
        acoes.includes('alterar') ? 1 : 0,
        acoes.includes('excluir') ? 1 : 0,
        extras.length > 0 ? JSON.stringify(extras) : null
      ]
    })
    const grupos = linhas.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')
    await tx.query(
      `INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras)
       VALUES ${grupos}`,
      linhas.flat()
    )
    await garantirAdministracaoApos(tx)
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }

  invalidarCache('usuarios-opcoes')
  const perfil = await buscarPerfil(id)
  if (!perfil) erro404()
  return perfil
}

/**
 * Copia a matriz SALVA da origem para o destino em uma transação (spec:
 * "copiar para" grava imediatamente a matriz persistida, nunca o rascunho —
 * que só existe no cliente). Devolve o perfil destino atualizado.
 */
export async function copiarMatriz(origemId: string, destinoId: string): Promise<PerfilApi> {
  const origem = await buscarPerfil(origemId)
  if (!origem) erro404('Perfil de origem não encontrado.')
  const destino = await buscarPerfil(destinoId)
  if (!destino) erro404('Perfil de destino não encontrado.')

  const tx = await getTransaction()
  try {
    await tx.query('DELETE FROM permissoes_perfil WHERE perfil_id = ?', [destinoId])
    const linhas = MODULOS_IDS.map((modulo) => {
      const acoes = origem.permissoes[modulo] ?? []
      const extras = acoes.filter((a) => (FUNCIONALIDADES_EXTRAS as readonly string[]).includes(a))
      return [
        destinoId,
        modulo,
        acoes.includes('visualizar') ? 1 : 0,
        acoes.includes('criar') ? 1 : 0,
        acoes.includes('alterar') ? 1 : 0,
        acoes.includes('excluir') ? 1 : 0,
        extras.length > 0 ? JSON.stringify(extras) : null
      ]
    })
    const grupos = linhas.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')
    await tx.query(
      `INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras)
       VALUES ${grupos}`,
      linhas.flat()
    )
    await garantirAdministracaoApos(tx)
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }

  invalidarCache('usuarios-opcoes')
  const atualizado = await buscarPerfil(destinoId)
  if (!atualizado) erro404()
  return atualizado
}
