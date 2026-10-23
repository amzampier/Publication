// server/utils/permission.ts — autorização por módulo/ação (RBAC dinâmico;
// change rbac-require-permission). `requirePermission` carrega a matriz do
// perfil do usuário da sessão em UMA query e nega com 403 o que não estiver
// concedido; o 401 (sem sessão) continua no middleware auth-api.ts.
// A sessão resolvida pelo middleware é reaproveitada via event.context para
// não reautenticar no mesmo request.
import { createError } from 'h3'
import { getSessionUser, type UsuarioSessao } from './auth'
import { query } from './db'
import { COLUNA_POR_ACAO, parseExtras } from './perfis'

type Row = Record<string, unknown>

/** Matriz da sessão: módulo -> conjunto de ações concedidas. */
export type PermissoesSessao = Map<string, Set<string>>

interface ContextoRbac {
  sessaoUsuario?: UsuarioSessao | null
  __permissoes?: PermissoesSessao
}

const contexto = (event: any): ContextoRbac => event.context as ContextoRbac

/** Linhas de permissoes_perfil -> Map<módulo, Set<ação>>. */
const montarPermissoes = (linhas: Row[]): PermissoesSessao => {
  const mapa: PermissoesSessao = new Map()
  for (const linha of linhas) {
    const acoes = new Set<string>()
    for (const [acao, coluna] of Object.entries(COLUNA_POR_ACAO)) {
      if (Number(linha[coluna]) === 1) acoes.add(acao)
    }
    for (const extra of parseExtras(linha.extras)) acoes.add(extra)
    mapa.set(String(linha.modulo), acoes)
  }
  return mapa
}

/** Sessão do request (reaproveita a resolvida pelo middleware). null = sem sessão. */
async function resolverSessao(event: any): Promise<UsuarioSessao | null> {
  const ctx = contexto(event)
  if (ctx.sessaoUsuario !== undefined) return ctx.sessaoUsuario
  const sessao = await getSessionUser(event)
  ctx.sessaoUsuario = sessao
  return sessao
}

/**
 * Matriz de permissões do perfil do usuário da sessão (uma query, memoizada por
 * request). Sem sessão válida -> 401 (mesma semântica do middleware).
 */
export async function carregarPermissoesDaSessao(event: any): Promise<PermissoesSessao> {
  const ctx = contexto(event)
  if (ctx.__permissoes) return ctx.__permissoes

  const sessao = await resolverSessao(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }

  const linhas = await query<Row[]>(
    `SELECT pp.modulo, pp.pode_visualizar, pp.pode_incluir, pp.pode_editar, pp.pode_excluir, pp.extras
       FROM usuarios u JOIN permissoes_perfil pp ON pp.perfil_id = u.perfil_id
      WHERE u.id = ?`,
    [sessao.id]
  )
  const permissoes = montarPermissoes(linhas)
  ctx.__permissoes = permissoes
  return permissoes
}

/** true quando o perfil da sessão concede a ação no módulo (módulo/ação ausente = false). */
export async function pode(event: any, modulo: string, acao: string): Promise<boolean> {
  const permissoes = await carregarPermissoesDaSessao(event)
  return permissoes.get(modulo)?.has(acao) ?? false
}

/** Exige a permissão do módulo/ação; nega com 403 quando ausente. */
export async function requirePermission(event: any, modulo: string, acao: string): Promise<void> {
  if (!(await pode(event, modulo, acao))) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Você não tem permissão para executar esta ação.'
    })
  }
}

/**
 * Funcionalidades exigidas por uma consulta de listagem de módulo (change
 * rbac-funcionalidades-por-modulo): exportação tem precedência e exige apenas
 * `exportar`; a listagem base exige `visualizar`; busca e filtros acrescentam
 * `buscar`/`filtrar`. O importador aplica cada uma via `requirePermission`.
 */
export function funcionalidadesDeConsulta(consulta: {
  exportar?: boolean
  busca?: boolean
  filtros?: boolean
}): string[] {
  if (consulta.exportar) return ['exportar']
  const acoes = ['visualizar']
  if (consulta.busca) acoes.push('buscar')
  if (consulta.filtros) acoes.push('filtrar')
  return acoes
}

/**
 * A transição para `Publicado` exige a funcionalidade `publicar`, mesmo quando
 * a rota genérica já exigiu `criar`/`alterar`. Permanecer em `Publicado` ao
 * editar outros campos não conta como nova publicação.
 */
export function exigePermissaoPublicar(statusAtual: unknown, statusNovo: unknown): boolean {
  return statusNovo === 'Publicado' && statusAtual !== 'Publicado'
}
