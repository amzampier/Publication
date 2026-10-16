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
    maxAge: REFRESH_TTL_DIAS * 24 * 3600
  })
}

export function limparCookiesAuth(event: any): void {
  deleteCookie(event, NOME_ACCESS, { path: '/' })
  deleteCookie(event, NOME_REFRESH, { path: '/' })
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
  const expira = new Date(Date.now() + REFRESH_TTL_DIAS * 24 * 3600)
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
  const expira = new Date(Date.now() + REFRESH_TTL_DIAS * 24 * 3600)

  const tx = await getTransaction()
  try {
    const linhas = await tx.query<Array<{ id: string; usuario_id: string }>>(
      `SELECT id, usuario_id FROM sessoes
        WHERE refresh_token_hash = ? AND revogado_em IS NULL AND expira_em > ?
        LIMIT 1`,
      [hash, agora]
    )
    if (linhas.length === 0) {
      await tx.rollback()
      return null
    }
    await tx.query('UPDATE sessoes SET revogado_em = ? WHERE id = ?', [agora, linhas[0].id])
    const novo = gerarRefresh()
    const userAgent = String(getRequestHeader(event, 'user-agent') ?? '').slice(0, 255)
    await tx.query(
      `INSERT INTO sessoes (id, usuario_id, refresh_token_hash, user_agent, ip, expira_em)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [linhas[0].usuario_id, hashRefresh(novo), userAgent, ipDe(event), expira]
    )
    await tx.commit()
    return { refresh: novo, usuarioId: String(linhas[0].usuario_id) }
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
}

/** Revoga a sessão do refresh no logout (revogado_em = agora). */
export async function revogarSessao(refresh: string | undefined): Promise<void> {
  if (!refresh) return
  await query('UPDATE sessoes SET revogado_em = ? WHERE refresh_token_hash = ? AND revogado_em IS NULL', [
    new Date(),
    hashRefresh(refresh)
  ])
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
  if (!usuario || usuario.situacao !== 'Ativo') {
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
export async function getSessionUser(event: any): Promise<UsuarioSessao | null> {
  const access = getCookie(event, NOME_ACCESS)
  const payload = await validarAccessToken(access)
  if (payload) {
    return {
      id: payload.sub,
      nome: payload.nome,
      email: payload.email,
      perfil: payload.perfil,
      provisoria: payload.provisoria,
      tokenVersion: payload.tokenVersion
    }
  }
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
  return linhas.length ? montarLoginRow(linhas[0]) : null
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
  return linhas.length ? montarLoginRow(linhas[0]) : null
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
  const linhas = await query<Array<{ situacao: string; token_version: number }>>(
    'SELECT situacao, token_version FROM usuarios WHERE id = ? LIMIT 1',
    [sessao.id]
  )
  if (linhas.length === 0) return false
  if (String(linhas[0].situacao) !== 'Ativo') return false
  return Number(linhas[0].token_version) === sessao.tokenVersion
}

/** Incrementa a versão da sessão da conta — revoga todos os access vigentes (logout/desativação). */
export async function revogarAccessVigente(usuarioId: string): Promise<void> {
  await query('UPDATE usuarios SET token_version = token_version + 1 WHERE id = ?', [usuarioId])
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
    if (linhas.length === 0) {
      await tx.commit()
      return { bloqueou: false, tentativas: 0 }
    }
    const vigente = bloqueioVigente(linhas[0].bloqueado_ate)
    if (vigente) {
      await tx.commit()
      return { bloqueou: false, tentativas: Number(linhas[0].tentativas_falhas) } // já bloqueado: não incrementa além da janela
    }

    const novas = Number(linhas[0].tentativas_falhas) + 1
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
  return (resultado as { affectedRows?: number }).affectedRows !== 0
}
