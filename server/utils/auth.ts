// server/utils/auth.ts — núcleo de autenticação (change auth-backend-resend,
// design D1/D5/D7): access JWT (jose HS256, ~15min) em cookie HttpOnly +
// refresh opaco rotativo gravado (hash SHA-256) em `sessoes`, lockout de
// tentativas em `usuarios` e helpers de sessão para as rotas /api/auth/*.
// Os nomes de cookie ganham prefixo `__Host-` (+ Secure) só em produção:
// navegador não persiste `__Host-` sem Secure e dev roda em http.
import { SignJWT, jwtVerify } from 'jose'
import { createHash, randomBytes } from 'node:crypto'
import { query, getTransaction } from './db'

export interface UsuarioSessao {
  id: string
  nome: string
  email: string
  perfil: string
  /** Senha provisória pendente de troca (capability `primeiro-acesso`). */
  provisoria: boolean
  /** Versão da sessão da conta — revogada ao incrementar (capability `revogacao-sessao`). */
  tokenVersion: number
}

/** DTO público da sessão — nunca expõe `tokenVersion` (RL05-B-04). */
export type SessaoPublica = Omit<UsuarioSessao, 'tokenVersion'>
export const sessaoPublica = (sessao: UsuarioSessao): SessaoPublica => ({
  id: sessao.id,
  nome: sessao.nome,
  email: sessao.email,
  perfil: sessao.perfil,
  provisoria: sessao.provisoria
})

export interface UsuarioLoginRow {
  id: string
  nome: string
  email: string
  hash_senha: string
  situacao: string
  perfil: string
  /** Situação do PERFIL (Ativo/Inativo/Bloqueado) — login recusa perfil não-Ativo (M-05). */
  perfil_situacao: string
  /** 1 = senha provisória pendente de troca. */
  provisoria: number
  /** Versão da sessão vigente da conta. */
  token_version: number
  /** Bloqueio de brute-force vigente (null = livre) — usado pelo login. */
  bloqueado_ate: Date | string | null
}

/** TTL do access token em segundos (AUTH_ACCESS_TTL cobre testes de expiração). */
export const ACCESS_TTL_SEG = Number(process.env.AUTH_ACCESS_TTL || 0) > 0
  ? Number(process.env.AUTH_ACCESS_TTL)
  : 900
const REFRESH_TTL_DIAS = 7
/** TTL do refresh em SEGUNDOS — fonte única do prazo (cookie e registro de sessão). */
const REFRESH_TTL_SEG = REFRESH_TTL_DIAS * 24 * 60 * 60
export const TENTATIVAS_MAX = 5
export const JANELA_BLOQUEIO_MIN = 15

// ---------------------------------------------------------------------------
// Cookies (D1)
// ---------------------------------------------------------------------------

const ehProducao = process.env.NODE_ENV === 'production'
const NOME_ACCESS = ehProducao ? '__Host-auth-token' : 'auth-token'
const NOME_REFRESH = ehProducao ? '__Host-auth-refresh' : 'auth-refresh'

const opcoesBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: ehProducao
}

function segredo(): Uint8Array {
  const valor = useRuntimeConfig().authJwtSecret as string
  if (!valor || valor.length < 32) {
    throw new Error('[auth] AUTH_JWT_SECRET ausente ou fraco — veja .env.example.')
  }
  return new TextEncoder().encode(valor)
}

function gravarCookies(event: any, access: string, refresh: string): void {
  setCookie(event, NOME_ACCESS, access, { ...opcoesBase, maxAge: ACCESS_TTL_SEG })
  setCookie(event, NOME_REFRESH, refresh, {
    ...opcoesBase,
    maxAge: REFRESH_TTL_SEG
  })
}

export function limparCookiesAuth(event: any): void {
  // RL05-M-03: o prefixo __Host- exige `Secure` também no Set-Cookie de remoção.
  // Sem ele o navegador ignora a remoção e o cookie permanece no cliente.
  const remocao = { path: '/', secure: ehProducao, sameSite: 'lax' as const }
  deleteCookie(event, NOME_ACCESS, remocao)
  deleteCookie(event, NOME_REFRESH, remocao)
}

/** Reemite SÓ o cookie de access (ex.: após limpar a provisória) — preserva o refresh. */
export async function reemitirAccesso(event: any, usuario: UsuarioSessao): Promise<void> {
  const access = await emitirAccessToken(usuario)
  setCookie(event, NOME_ACCESS, access, { ...opcoesBase, maxAge: ACCESS_TTL_SEG })
}

// ---------------------------------------------------------------------------
// Access JWT
// ---------------------------------------------------------------------------

export async function emitirAccessToken(usuario: UsuarioSessao): Promise<string> {
  return await new SignJWT({
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    provisoria: usuario.provisoria,
    tv: usuario.tokenVersion
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuario.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEG}s`)
    .sign(segredo())
}

export async function validarAccessToken(
  token: string | undefined
): Promise<{ sub: string; nome: string; email: string; perfil: string; provisoria: boolean; tokenVersion: number } | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, segredo(), { algorithms: ['HS256'] })
    if (!payload.sub) return null
    return {
      sub: String(payload.sub),
      nome: String(payload.nome ?? ''),
      email: String(payload.email ?? ''),
      perfil: String(payload.perfil ?? ''),
      provisoria: payload.provisoria === true,
      tokenVersion: Number(payload.tv ?? 0)
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Refresh em sessoes (hash SHA-256, rotação, revogação — D1)
// ---------------------------------------------------------------------------

const hashRefresh = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

const gerarRefresh = (): string => randomBytes(32).toString('base64url')

const ipDe = (event: any): string => {
  try {
    // RL02 A-03: só confia no X-Forwarded-For quando há proxies confiáveis.
    const confiaveis = String(useRuntimeConfig().trustedProxies || '').trim()
    return getRequestIP(event, { xForwardedFor: confiaveis.length > 0 }) ?? '0.0.0.0'
  } catch {
    return '0.0.0.0'
  }
}

/** Cria a sessão (INSERT do hash do refresh) e devolve o refresh em claro. */
export async function criarSessao(event: any, usuarioId: string): Promise<string> {
  const refresh = gerarRefresh()
  const userAgent = String(getRequestHeader(event, 'user-agent') ?? '').slice(0, 255)
  const expira = new Date(Date.now() + REFRESH_TTL_SEG * 1000)
  await query(
    `INSERT INTO sessoes (id, usuario_id, refresh_token_hash, user_agent, ip, expira_em)
     VALUES (UUID(), ?, ?, ?, ?, ?)`,
    [usuarioId, hashRefresh(refresh), userAgent, ipDe(event), expira]
  )
  return refresh
}

/**
 * Rotaciona o refresh (transação): valida a sessão ativa/não expirada com o
 * hash antigo, revoga a linha antiga e insere o novo hash — o token anterior
 * deixa de valer imediatamente. Devolve o novo refresh + dono da sessão, ou
 * null quando o refresh é inválido/revogado/expirado.
 */
export async function rotacionarSessao(
  event: any,
  refreshAntigo: string
): Promise<{ refresh: string; usuarioId: string } | null> {
  const hash = hashRefresh(refreshAntigo)
  const agora = new Date()
  const expira = new Date(Date.now() + REFRESH_TTL_SEG * 1000)

  const tx = await getTransaction()
  try {
    const linhas = await tx.query<Array<{ id: string; usuario_id: string }>>(
      `SELECT id, usuario_id FROM sessoes
        WHERE refresh_token_hash = ? AND revogado_em IS NULL AND expira_em > ?
        LIMIT 1 FOR UPDATE`,
      [hash, agora]
    )
    const linha = linhas[0]
    if (!linha) {
      await tx.rollback()
      return null
    }
    await tx.query('UPDATE sessoes SET revogado_em = ? WHERE id = ?', [agora, linha.id])
    const novo = gerarRefresh()
    const userAgent = String(getRequestHeader(event, 'user-agent') ?? '').slice(0, 255)
    await tx.query(
      `INSERT INTO sessoes (id, usuario_id, refresh_token_hash, user_agent, ip, expira_em)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [linha.usuario_id, hashRefresh(novo), userAgent, ipDe(event), expira]
    )
    await tx.commit()
    return { refresh: novo, usuarioId: String(linha.usuario_id) }
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
}

/** Revoga a sessão do refresh no logout (revogado_em = agora). */
export async function revogarSessao(
  refresh: string | undefined,
  exec: ExecutorQuery = query
): Promise<void> {
  if (!refresh) return
  await exec('UPDATE sessoes SET revogado_em = ? WHERE refresh_token_hash = ? AND revogado_em IS NULL', [
    new Date(),
    hashRefresh(refresh)
  ])
}

/**
 * Logout atômico (RL05-M-04): revoga o refresh e incrementa a versão da sessão
 * na MESMA transação, sem rotacionar o refresh (evita a sessão órfã quando o
 * access já expirou). `usuarioId` ausente = só revoga o refresh.
 */
export async function revogarSessaoEAccess(
  refresh: string | undefined,
  usuarioId: string | undefined
): Promise<void> {
  const tx = await getTransaction()
  try {
    await revogarSessao(refresh, (sql, values) => tx.query(sql, values))
    if (usuarioId) {
      await revogarAccessVigente(usuarioId, (sql, values) => tx.query(sql, values))
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
}

// ---------------------------------------------------------------------------
// Sessão completa (emitir / restaurar / identificar — D7)
// ---------------------------------------------------------------------------

/** Login: access + refresh (sessão criada) gravados nos cookies HttpOnly. */
export async function emitirSessao(event: any, usuario: UsuarioSessao): Promise<void> {
  const [access, refresh] = await Promise.all([
    emitirAccessToken(usuario),
    criarSessao(event, usuario.id)
  ])
  gravarCookies(event, access, refresh)
}

/**
 * Renova a sessão a partir do cookie de refresh: rotaciona (transação),
 * recarrega a conta (cai se inativa/removida), emite novo access e grava os
 * dois cookies. Devolve a sessão ou null (sem cookies válidos).
 */
export async function renovarSessao(event: any): Promise<UsuarioSessao | null> {
  const refresh = getCookie(event, NOME_REFRESH)
  if (!refresh) return null

  const rotacao = await rotacionarSessao(event, refresh)
  if (!rotacao) {
    limparCookiesAuth(event)
    return null
  }

  const usuario = await buscarUsuarioPorId(rotacao.usuarioId)
  // Conta e PERFIL precisam estar ativos (D2): inativar o perfil impede renovar a sessão.
  if (!usuario || usuario.situacao !== 'Ativo' || usuario.perfil_situacao !== 'Ativo') {
    limparCookiesAuth(event)
    return null
  }
  const sessao: UsuarioSessao = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    provisoria: usuario.provisoria === 1,
    tokenVersion: usuario.token_version
  }
  const accessNovo = await emitirAccessToken(sessao)
  gravarCookies(event, accessNovo, rotacao.refresh)
  return sessao
}

/**
 * Restaura a sessão a partir dos cookies (F5/SSR — D7): access válido →
 * payload; expirado → `renovarSessao` (rotaciona o refresh no servidor).
 * Retorna null quando não há como autenticar.
 */
/** Sessão a partir APENAS do access (não rotaciona o refresh — usado no logout). */
export async function obterSessaoDoAccess(event: any): Promise<UsuarioSessao | null> {
  const access = getCookie(event, NOME_ACCESS)
  const payload = await validarAccessToken(access)
  if (!payload) return null
  return {
    id: payload.sub,
    nome: payload.nome,
    email: payload.email,
    perfil: payload.perfil,
    provisoria: payload.provisoria,
    tokenVersion: payload.tokenVersion
  }
}

export async function getSessionUser(event: any): Promise<UsuarioSessao | null> {
  const sessao = await obterSessaoDoAccess(event)
  if (sessao) return sessao
  return await renovarSessao(event)
}

// ---------------------------------------------------------------------------
// Consultas de login/cadastro
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>

const montarLoginRow = (row: Row): UsuarioLoginRow => ({
  id: String(row.id),
  nome: String(row.nome_completo ?? ''),
  email: String(row.email_corporativo ?? ''),
  hash_senha: String(row.hash_senha ?? ''),
  situacao: String(row.situacao ?? ''),
  perfil: String(row.nome_perfil ?? ''),
  perfil_situacao: String(row.perfil_situacao ?? ''),
  provisoria: Number(row.senha_provisoria ?? 0),
  token_version: Number(row.token_version ?? 0),
  bloqueado_ate: (row.bloqueado_ate as Date | string | null) ?? null
})

/** Conta completa por e-mail (login, esqueci-senha, convite). */
export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioLoginRow | null> {
  const linhas = await query<Row[]>(
    `SELECT u.id, u.nome_completo, u.email_corporativo, u.hash_senha, u.situacao,
            u.senha_provisoria, u.token_version, u.bloqueado_ate, p.nome_perfil, p.situacao AS perfil_situacao
       FROM usuarios u JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE u.email_corporativo = ? LIMIT 1`,
    [email]
  )
  const linha = linhas[0]
  return linha ? montarLoginRow(linha) : null
}

/** Conta por id (sessão, troca de senha). */
export async function buscarUsuarioPorId(id: string): Promise<UsuarioLoginRow | null> {
  const linhas = await query<Row[]>(
    `SELECT u.id, u.nome_completo, u.email_corporativo, u.hash_senha, u.situacao,
            u.senha_provisoria, u.token_version, p.nome_perfil, p.situacao AS perfil_situacao
       FROM usuarios u JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE u.id = ? LIMIT 1`,
    [id]
  )
  const linha = linhas[0]
  return linha ? montarLoginRow(linha) : null
}

/**
 * A sessão ainda é válida no servidor? (capability `revogacao-sessao`): conta
 * existe, está Ativa e a versão do token confere com a da conta. Usada pelo
 * middleware a cada requisição autenticada.
 */
export async function sessaoAtivaNoServidor(sessao: {
  id: string
  tokenVersion: number
}): Promise<boolean> {
  // A conta E o PERFIL precisam estar ativos (change endurecer-revogacao-e-autorizacao, D2):
  // inativar o perfil derruba as sessões vigentes, não apenas o login.
  const linhas = await query<Array<{ situacao: string; perfil_situacao: string; token_version: number }>>(
    `SELECT u.situacao, p.situacao AS perfil_situacao, u.token_version
       FROM usuarios u JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE u.id = ? LIMIT 1`,
    [sessao.id]
  )
  const linha = linhas[0]
  if (!linha) return false
  if (String(linha.situacao) !== 'Ativo') return false
  if (String(linha.perfil_situacao) !== 'Ativo') return false
  return Number(linha.token_version) === sessao.tokenVersion
}

/**
 * Sessão válida no servidor para as rotas autenticadas isentas do middleware
 * (portal de autenticação — change endurecer-revogacao-sessao, design D1):
 * resolve a sessão pelos cookies e confirma a revogação (`sessaoAtivaNoServidor`).
 * Devolve `null` (limpando os cookies) quando a sessão foi revogada/inativada.
 */
export async function obterSessaoValida(event: any): Promise<UsuarioSessao | null> {
  const sessao = await getSessionUser(event)
  if (!sessao) return null
  if (!(await sessaoAtivaNoServidor(sessao))) {
    limparCookiesAuth(event)
    return null
  }
  return sessao
}

/** Executor de query — o pool (`query`) ou a transação (`tx.query`). */
type ExecutorQuery = (sql: string, values?: any[]) => Promise<any>

/** Incrementa a versão da sessão da conta — invalida todos os access vigentes (logout/desativação). */
export async function revogarAccessVigente(usuarioId: string, exec: ExecutorQuery = query): Promise<void> {
  await exec('UPDATE usuarios SET token_version = token_version + 1 WHERE id = ?', [usuarioId])
}

/**
 * Revoga TODAS as sessões do usuário (change endurecer-revogacao-e-autorizacao, D1):
 * incrementa a versão da sessão (invalida os access vigentes) e marca `revogado_em`
 * nas linhas de `sessoes` abertas (invalida também os refresh tokens). Aceita o
 * executor para rodar dentro de transação (desativação de usuário / inativação de perfil).
 */
export async function revogarSessoesDoUsuario(
  usuarioId: string,
  exec: ExecutorQuery = query
): Promise<void> {
  await revogarAccessVigente(usuarioId, exec)
  await exec('UPDATE sessoes SET revogado_em = ? WHERE usuario_id = ? AND revogado_em IS NULL', [
    new Date(),
    usuarioId
  ])
}

/**
 * Revoga as sessões de TODOS os usuários de um perfil (inativação de perfil —
 * change endurecer-revogacao-e-autorizacao, D2.3). Mesma lógica do D1, aplicada
 * em lote; aceita o executor para rodar na transação da atualização do perfil.
 */
export async function revogarSessoesDoPerfil(
  perfilId: string,
  exec: ExecutorQuery = query
): Promise<void> {
  await exec('UPDATE usuarios SET token_version = token_version + 1 WHERE perfil_id = ?', [perfilId])
  await exec(
    `UPDATE sessoes s JOIN usuarios u ON u.id = s.usuario_id
        SET s.revogado_em = ? WHERE u.perfil_id = ? AND s.revogado_em IS NULL`,
    [new Date(), perfilId]
  )
}

// ---------------------------------------------------------------------------
// Lockout (D5)
// ---------------------------------------------------------------------------

/** Bloqueio vigente? (chamar ANTES do bcrypt — sem custo para contas bloqueadas) */
export function bloqueioVigente(bloqueadoAte: Date | string | null | undefined): number | null {
  if (!bloqueadoAte) return null
  const ate = new Date(bloqueadoAte as any)
  const agora = new Date()
  if (ate.getTime() <= agora.getTime()) return null
  return Math.max(1, Math.ceil((ate.getTime() - agora.getTime()) / 60000))
}

/**
 * Registra falha de senha; ao alcançar TENTATIVAS_MAX, bloqueia 15min.
 * Devolve se o bloqueio foi disparado e as falhas consecutivas vigentes
 * (TENTATIVAS_MAX quando bloqueou) — usado para tipar o evento de log.
 */
export async function registrarFalhaLogin(
  usuarioId: string
): Promise<{ bloqueou: boolean; tentativas: number }> {
  // Atômico (change endurecer-banco-e-bootstrap, RL02 M-12): o SELECT ... FOR
  // UPDATE serializa tentativas concorrentes — sem ele, o read-modify-write
  // subcontava falhas e o bloqueio podia não disparar em 5.
  const tx = await getTransaction()
  try {
    const linhas = await tx.query<Array<{ tentativas_falhas: number; bloqueado_ate: Date | null }>>(
      'SELECT tentativas_falhas, bloqueado_ate FROM usuarios WHERE id = ? FOR UPDATE',
      [usuarioId]
    )
    const linha = linhas[0]
    if (!linha) {
      await tx.commit()
      return { bloqueou: false, tentativas: 0 }
    }
    const vigente = bloqueioVigente(linha.bloqueado_ate)
    if (vigente) {
      await tx.commit()
      return { bloqueou: false, tentativas: Number(linha.tentativas_falhas) } // já bloqueado: não incrementa além da janela
    }

    const novas = Number(linha.tentativas_falhas) + 1
    if (novas >= TENTATIVAS_MAX) {
      const ate = new Date(Date.now() + JANELA_BLOQUEIO_MIN * 60000)
      await tx.query('UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = ? WHERE id = ?', [
        ate,
        usuarioId
      ])
      await tx.commit()
      return { bloqueou: true, tentativas: TENTATIVAS_MAX }
    }
    await tx.query('UPDATE usuarios SET tentativas_falhas = ? WHERE id = ?', [novas, usuarioId])
    await tx.commit()
    return { bloqueou: false, tentativas: novas }
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
}

/**
 * Zera falhas/bloqueio no login bem-sucedido (ou pela liberação manual da
 * aba de Segurança). Devolve false quando a conta não existe.
 */
export async function limparFalhasLogin(usuarioId: string): Promise<boolean> {
  const resultado = await query(
    'UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?',
    [usuarioId]
  )
  if ((resultado as { affectedRows?: number }).affectedRows !== 0) return true
  // affectedRows === 0 pode ser conta inexistente OU conta já limpa (UPDATE sem
  // mudança) — confirma a existência para a liberação ser idempotente.
  const linhas = await query<Array<{ id: string }>>(
    'SELECT id FROM usuarios WHERE id = ? LIMIT 1',
    [usuarioId]
  )
  return linhas.length > 0
}
