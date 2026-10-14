// server/utils/usuarios.ts — camada de acesso da tabela `usuarios` (change
// gestao-usuarios-backend, design D2/D3). Devolve o shape da tela (UsuarioDemo
// com `senha: ''` — senhas NUNCA saem do servidor) com endereço/SMTP como
// objetos do demo; escritas fazem bcrypt (cost 12) e gravam `senha_provisoria`.
import { createError } from 'h3'
import { hash } from 'bcrypt'
import { query, getTransaction } from './db'

export type SituacaoEscrita = 'Ativo' | 'Inativo'
export type SituacaoLida = 'Ativo' | 'Inativo' | 'Bloqueado'

export interface EnderecoApi {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  regiao: string
}

export interface SmtpApi {
  email: string
  senha: string
  provedor: string
  servidor: string
  porta: string
  seguranca: string
}

/** Shape da tela ( UsuarioDemo ); `senha` sempre vazia na saída. */
export interface UsuarioApi {
  id: string
  nome: string
  email: string
  perfil: string
  status: SituacaoLida
  senha: ''
  ultimoAcesso: string | null
  telefone: string
  funcao: string
  departamento: string
  endereco: EnderecoApi
  smtp: SmtpApi
  avatar: string
  dataCadastro: string | null
  atualizadoEm: string | null
}

/** Hash sentinela de importados: bcrypt.compare falha → nunca autenticam (D3). */
export const HASH_SEM_SENHA_IMPORTADO = '!importado-sem-senha'

const BCRYPT_COST = 12
const SITUACOES_ESCRITA: SituacaoEscrita[] = ['Ativo', 'Inativo']
const PROVEDORES = ['gmail', 'outlook', 'yahoo', 'personalizado', '']
const SEGURANCAS = ['nenhuma', 'starttls', 'ssl', '']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const erro400 = (mensagem: string): never => {
  throw createError({ statusCode: 400, statusMessage: mensagem })
}
const erro404 = (mensagem = 'Usuário não encontrado.'): never => {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}
const erro409 = (mensagem: string): never => {
  throw createError({ statusCode: 409, statusMessage: mensagem })
}

// ---------------------------------------------------------------------------
// Normalização banco -> shape da tela
// ---------------------------------------------------------------------------

const dataIso = (valor: unknown): string | null => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const d = new Date(valor)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  return null
}

const texto = (valor: unknown): string => (valor === null || valor === undefined ? '' : String(valor))

const montarUsuario = (row: Record<string, unknown>): UsuarioApi => ({
  id: String(row.id),
  nome: texto(row.nome_completo),
  email: texto(row.email_corporativo),
  perfil: texto(row.nome_perfil),
  status: (texto(row.situacao) || 'Ativo') as SituacaoLida,
  senha: '',
  ultimoAcesso: dataIso(row.ultimo_login),
  telefone: texto(row.telefone),
  funcao: texto(row.funcao),
  departamento: texto(row.departamento_setor),
  endereco: {
    cep: texto(row.cep),
    logradouro: texto(row.endereco),
    numero: texto(row.numero),
    complemento: texto(row.complemento),
    bairro: texto(row.bairro),
    cidade: texto(row.cidade),
    estado: texto(row.estado),
    regiao: texto(row.regiao)
  },
  smtp: {
    email: texto(row.email_smtp),
    senha: texto(row.senha_smtp),
    provedor: texto(row.provedor),
    servidor: texto(row.smtp),
    porta: row.porta === null || row.porta === undefined ? '' : String(row.porta),
    seguranca: texto(row.metodo_seguranca)
  },
  avatar: texto(row.avatar_url),
  dataCadastro: dataIso(row.criado_em),
  atualizadoEm: dataIso(row.atualizado_em)
})

const COLUNAS_LISTA = `u.id, u.nome_completo, u.email_corporativo, u.situacao, u.ultimo_login,
  u.telefone, u.funcao, u.departamento_setor, u.cep, u.endereco, u.numero, u.complemento,
  u.bairro, u.cidade, u.estado, u.regiao, u.provedor, u.smtp, u.porta, u.email_smtp,
  u.senha_smtp, u.metodo_seguranca, u.avatar_url, u.criado_em, u.atualizado_em, p.nome_perfil`

// ---------------------------------------------------------------------------
// Validações
// ---------------------------------------------------------------------------

function validarNome(nome: unknown): string {
  if (typeof nome !== 'string' || !nome.trim()) erro400('Informe o nome do usuário.')
  const valor = nome.trim()
  if (valor.length > 150) erro400('O nome deve ter no máximo 150 caracteres.')
  return valor
}

export function validarEmail(email: unknown): string {
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    erro400('Informe um e-mail válido.')
  }
  return email.trim().toLowerCase()
}

function validarSituacao(situacao: unknown): SituacaoEscrita {
  if (typeof situacao !== 'string' || !SITUACOES_ESCRITA.includes(situacao as SituacaoEscrita)) {
    erro400('Situação deve ser Ativo ou Inativo.')
  }
  return situacao as SituacaoEscrita
}

export function validarSenhaNova(senha: unknown): string {
  if (typeof senha !== 'string' || senha.length < 8) {
    erro400('A senha deve ter pelo menos 8 caracteres.')
  }
  return senha
}

interface PerfilIdRow {
  id: string
}

async function resolverPerfilId(perfil: unknown): Promise<string> {
  if (typeof perfil !== 'string' || !perfil.trim()) erro400('Informe o perfil.')
  const linhas = await query<PerfilIdRow[]>(
    'SELECT id FROM perfis_acesso WHERE nome_perfil = ? LIMIT 1',
    [perfil.trim()]
  )
  if (linhas.length === 0) erro400(`Perfil inválido: ${perfil}.`)
  return String(linhas[0].id)
}

async function emailJaCadastrado(email: string, excetoId?: string): Promise<void> {
  const linhas = await query<Array<{ id: string }>>(
    'SELECT id FROM usuarios WHERE email_corporativo = ? LIMIT 1',
    [email]
  )
  if (linhas.length > 0 && String(linhas[0].id) !== excetoId) {
    erro409('Este e-mail já está cadastrado no sistema.')
  }
}

function normalizarAvatar(avatar: unknown): string | null {
  if (avatar === undefined || avatar === null || avatar === '') return null
  if (typeof avatar === 'string' && avatar.length <= 500 && !avatar.startsWith('data:')) return avatar
  erro400('Avatar inválido (esperada a URL de um arquivo enviado).')
}

function normalizarEndereco(endereco: unknown): EnderecoApi {
  const e = (endereco ?? {}) as Partial<EnderecoApi>
  const campo = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  return {
    cep: campo(e.cep, 10),
    logradouro: campo(e.logradouro, 255),
    numero: campo(e.numero, 20),
    complemento: campo(e.complemento, 100),
    bairro: campo(e.bairro, 100),
    cidade: campo(e.cidade, 100),
    estado: campo(e.estado, 2),
    regiao: campo(e.regiao, 20)
  }
}

function normalizarSmtp(smtp: unknown): SmtpApi & { portaInt: number | null } {
  const s = (smtp ?? {}) as Partial<SmtpApi>
  const campo = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const provedor = campo(s.provedor, 20)
  const seguranca = campo(s.seguranca, 20)
  if (!PROVEDORES.includes(provedor)) erro400('Provedor SMTP inválido.')
  if (!SEGURANCAS.includes(seguranca)) erro400('Segurança SMTP inválida.')
  const portaTexto = campo(s.porta, 5)
  let portaInt: number | null = null
  if (portaTexto) {
    if (!/^\d{1,5}$/.test(portaTexto)) erro400('Porta SMTP inválida.')
    portaInt = Number(portaTexto)
    if (portaInt < 1 || portaInt > 65535) erro400('Porta SMTP inválida.')
  }
  return {
    email: campo(s.email, 255),
    senha: campo(s.senha, 255),
    provedor,
    servidor: campo(s.servidor, 255),
    porta: portaTexto,
    seguranca,
    portaInt
  }
}

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

/** Lista completa sem senha (GET /api/usuarios). */
export async function listarUsuarios(): Promise<UsuarioApi[]> {
  const linhas = await query<Record<string, unknown>[]>(
    `SELECT ${COLUNAS_LISTA} FROM usuarios u JOIN perfis_acesso p ON p.id = u.perfil_id
      ORDER BY u.nome_completo ASC`
  )
  return linhas.map(montarUsuario)
}

/** Um registro pelo id (sem senha) ou null. */
export async function buscarUsuarioTelaPorId(id: string): Promise<UsuarioApi | null> {
  const linhas = await query<Record<string, unknown>[]>(
    `SELECT ${COLUNAS_LISTA} FROM usuarios u JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE u.id = ? LIMIT 1`,
    [id]
  )
  return linhas.length ? montarUsuario(linhas[0]) : null
}

// ---------------------------------------------------------------------------
// Escritas
// ---------------------------------------------------------------------------

/** Cria o usuário (bcrypt + senha_provisoria=1). Devolve o registro criado. */
export async function criarUsuario(dados: {
  nome: unknown
  email: unknown
  perfil: unknown
  situacao: unknown
  senha: unknown
  telefone?: unknown
  funcao?: unknown
  departamento?: unknown
  endereco?: unknown
  smtp?: unknown
}): Promise<UsuarioApi> {
  const nome = validarNome(dados.nome)
  const email = validarEmail(dados.email)
  const senha = validarSenhaNova(dados.senha)
  const situacao = validarSituacao(dados.situacao)
  const perfilId = await resolverPerfilId(dados.perfil)
  await emailJaCadastrado(email)

  const hashSenha = await hash(senha, BCRYPT_COST)
  const end = normalizarEndereco(dados.endereco)
  const smtp = normalizarSmtp(dados.smtp)
  const avatarUrl = normalizarAvatar(dados.avatar)
  const telefone = typeof dados.telefone === 'string' ? dados.telefone.trim().slice(0, 30) : ''
  const funcao = typeof dados.funcao === 'string' ? dados.funcao.trim().slice(0, 100) : ''
  const departamento =
    typeof dados.departamento === 'string' && dados.departamento.trim()
      ? dados.departamento.trim().slice(0, 100)
      : 'Geral'

  const [u] = await query<{ id: string }[]>('SELECT UUID() AS id')
  const id = String(u.id)
  await query(
    `INSERT INTO usuarios (id, nome_completo, email_corporativo, hash_senha, perfil_id,
        situacao, telefone, funcao, departamento_setor,
        cep, endereco, numero, complemento, bairro, cidade, estado, regiao,
        provedor, smtp, porta, email_smtp, senha_smtp, metodo_seguranca, avatar_url,
        senha_provisoria, tentativas_falhas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id, nome, email, hashSenha, perfilId, situacao, telefone, funcao, departamento,
      end.cep, end.logradouro, end.numero, end.complemento, end.bairro, end.cidade, end.estado, end.regiao,
      smtp.provedor || null, smtp.servidor || null, smtp.portaInt, smtp.email || null,
      smtp.senha || null, smtp.seguranca || null, avatarUrl
    ]
  )
  const perfil = await buscarUsuarioTelaPorId(id)
  if (!perfil) erro404('Falha ao criar o usuário.')
  return perfil
}

/**
 * Atualiza o usuário (PUT /api/usuarios/:id). `senha` (opcional): string não
 * vazia substitui o hash (bcrypt + senha_provisoria=1); ausente/vazia mantém.
 */
export async function atualizarUsuario(
  id: string,
  dados: {
    nome?: unknown
    email?: unknown
    perfil?: unknown
    situacao?: unknown
    senha?: unknown
    telefone?: unknown
    funcao?: unknown
    departamento?: unknown
    endereco?: unknown
    smtp?: unknown
  }
): Promise<UsuarioApi> {
  const existente = await buscarUsuarioTelaPorId(id)
  if (!existente) erro404()

  const nome = dados.nome !== undefined ? validarNome(dados.nome) : existente.nome
  const email = dados.email !== undefined ? validarEmail(dados.email) : existente.email
  const situacao = dados.situacao !== undefined ? validarSituacao(dados.situacao) : (existente.status as SituacaoEscrita)
  const perfilId = dados.perfil !== undefined ? await resolverPerfilId(dados.perfil) : undefined
  await emailJaCadastrado(email, id)

  const end = dados.endereco !== undefined ? normalizarEndereco(dados.endereco) : existente.endereco
  const smtpBase = dados.smtp !== undefined ? normalizarSmtp(dados.smtp) : { ...existente.smtp, portaInt: existente.smtp.porta ? Number(existente.smtp.porta) : null }
  const telefone = dados.telefone !== undefined && typeof dados.telefone === 'string' ? dados.telefone.trim().slice(0, 30) : existente.telefone
  const funcao = dados.funcao !== undefined && typeof dados.funcao === 'string' ? dados.funcao.trim().slice(0, 100) : existente.funcao
  const departamento = dados.departamento !== undefined && typeof dados.departamento === 'string' && dados.departamento.trim()
    ? dados.departamento.trim().slice(0, 100)
    : existente.departamento

  const trocarSenha = typeof dados.senha === 'string' && dados.senha.length > 0
  const hashSenha = trocarSenha ? await hash(validarSenhaNova(dados.senha), BCRYPT_COST) : null
  const avatarUrl = normalizarAvatar(dados.avatar)

  await query(
    `UPDATE usuarios SET nome_completo = ?, email_corporativo = ?, situacao = ?,
        telefone = ?, funcao = ?, departamento_setor = ?,
        cep = ?, endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, regiao = ?,
        provedor = ?, smtp = ?, porta = ?, email_smtp = ?, senha_smtp = ?, metodo_seguranca = ?
        ${dados.avatar !== undefined ? ', avatar_url = ?' : ''}
        ${perfilId ? ', perfil_id = ?' : ''}
        ${hashSenha ? ', hash_senha = ?, senha_provisoria = 1' : ''}
      WHERE id = ?`,
    [
      nome, email, situacao, telefone, funcao, departamento,
      end.cep, end.logradouro, end.numero, end.complemento, end.bairro, end.cidade, end.estado, end.regiao,
      smtpBase.provedor || null, smtpBase.servidor || null, smtpBase.portaInt,
      smtpBase.email || null, smtpBase.senha || null, smtpBase.seguranca || null,
      ...(dados.avatar !== undefined ? [avatarUrl] : []),
      ...(perfilId ? [perfilId] : []),
      ...(hashSenha ? [hashSenha] : []),
      id
    ]
  )
  const atualizado = await buscarUsuarioTelaPorId(id)
  if (!atualizado) erro404()
  return atualizado
}

/** Remove o usuário (DELETE — sessões caem com a FK CASCADE). */
export async function excluirUsuario(id: string): Promise<void> {
  const existente = await buscarUsuarioTelaPorId(id)
  if (!existente) erro404()
  await query('DELETE FROM usuarios WHERE id = ?', [id])
}

/** Bloquear/desbloquear (PUT /api/usuarios/:id/situacao — Ativo/Inativo). */
export async function alterarSituacaoUsuario(
  id: string,
  situacao: unknown
): Promise<UsuarioApi> {
  const existente = await buscarUsuarioTelaPorId(id)
  if (!existente) erro404()
  const valor = validarSituacao(situacao)
  await query('UPDATE usuarios SET situacao = ? WHERE id = ?', [valor, id])
  const atualizado = await buscarUsuarioTelaPorId(id)
  if (!atualizado) erro404()
  return atualizado
}

/**
 * PATCH do próprio registro (GET/PATCH /api/usuarios/eu): dados cadastrais,
 * endereço, SMTP e avatar — nunca e-mail, perfil, situação nem senha (D7).
 */
export async function atualizarProprioRegistro(
  id: string,
  dados: {
    nome?: unknown
    telefone?: unknown
    endereco?: unknown
    smtp?: unknown
    avatar?: unknown
  }
): Promise<UsuarioApi> {
  const existente = await buscarUsuarioTelaPorId(id)
  if (!existente) erro404()

  const nome = dados.nome !== undefined ? validarNome(dados.nome) : existente.nome
  const telefone = dados.telefone !== undefined && typeof dados.telefone === 'string' ? dados.telefone.trim().slice(0, 30) : existente.telefone
  const end = dados.endereco !== undefined ? normalizarEndereco(dados.endereco) : existente.endereco
  const smtp = dados.smtp !== undefined ? normalizarSmtp(dados.smtp) : { ...existente.smtp, portaInt: existente.smtp.porta ? Number(existente.smtp.porta) : null }
  let avatarUrl: string | null = existente.avatar || null
  if (dados.avatar !== undefined) {
    if (dados.avatar === null || dados.avatar === '') avatarUrl = null
    else if (typeof dados.avatar === 'string' && dados.avatar.length <= 500) avatarUrl = dados.avatar
    else erro400('Avatar inválido.')
  }

  await query(
    `UPDATE usuarios SET nome_completo = ?, telefone = ?,
        cep = ?, endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, regiao = ?,
        provedor = ?, smtp = ?, porta = ?, email_smtp = ?, senha_smtp = ?, metodo_seguranca = ?,
        avatar_url = ?
      WHERE id = ?`,
    [
      nome, telefone,
      end.cep, end.logradouro, end.numero, end.complemento, end.bairro, end.cidade, end.estado, end.regiao,
      smtp.provedor || null, smtp.servidor || null, smtp.portaInt, smtp.email || null,
      smtp.senha || null, smtp.seguranca || null, avatarUrl,
      id
    ]
  )
  const atualizado = await buscarUsuarioTelaPorId(id)
  if (!atualizado) erro404()
  return atualizado
}

export interface LinhaImportacaoApi {
  nome?: unknown
  email?: unknown
  perfil?: unknown
  situacao?: unknown
}

/**
 * Importação (POST /api/usuarios/importar): revalida as linhas contra o banco
 * e grava em transação com o hash sentinela (importados nunca autenticam até o
 * convite — D3/D4). Recusa tudo quando houver linha inválida (400 com motivos).
 */
export async function importarUsuarios(linhas: unknown): Promise<{ importados: number }> {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > 500) erro400('Limite de 500 linhas por importação.')

  const motivos: string[] = []
  const preparados: Array<{ nome: string; email: string; perfilId: string; situacao: SituacaoEscrita }> = []
  const emailsNoArquivo = new Set<string>()

  for (const [indice, linha] of linhas.entries()) {
    const r = (linha ?? {}) as LinhaImportacaoApi
    try {
      const nome = validarNome(r.nome)
      const email = validarEmail(r.email)
      const situacao = validarSituacao(r.situacao)
      const perfilId = await resolverPerfilId(r.perfil)
      if (emailsNoArquivo.has(email)) {
        erro400(`Linha ${indice + 1}: e-mail repetido no arquivo.`)
      }
      emailsNoArquivo.add(email)
      preparados.push({ nome, email, perfilId, situacao })
    } catch (erro) {
      const mensagem = (erro as { statusMessage?: string }).statusMessage ?? 'Linha inválida.'
      motivos.push(`Linha ${indice + 1}: ${mensagem}`)
    }
  }

  if (preparados.length === 0 || motivos.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém linhas inválidas — nada foi gravado.',
      data: { motivos: motivos.length ? motivos : ['Nenhuma linha válida para importar.'] }
    })
  }

  // Unicidade contra o banco (case-insensitive — coluna já é unicidade).
  const emails = preparados.map((p) => p.email)
  const placeholders = emails.map(() => '?').join(', ')
  const existentes = await query<Array<{ email_corporativo: string }>>(
    `SELECT email_corporativo FROM usuarios WHERE email_corporativo IN (${placeholders})`,
    emails
  )
  if (existentes.length > 0) {
    const mapa = new Set(existentes.map((e) => String(e.email_corporativo).toLowerCase()))
    const duplicados = preparados.filter((p) => mapa.has(p.email)).map((p) => p.email)
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém e-mails já cadastrados — nada foi gravado.',
      data: { motivos: duplicados.map((e) => `E-mail já cadastrado: ${e}.`) }
    })
  }

  const tx = await getTransaction()
  try {
    for (const p of preparados) {
      await tx.query(
        `INSERT INTO usuarios (id, nome_completo, email_corporativo, hash_senha, perfil_id,
            situacao, senha_provisoria, tentativas_falhas)
         VALUES (UUID(), ?, ?, ?, ?, ?, 1, 0)`,
        [p.nome, p.email, HASH_SEM_SENHA_IMPORTADO, p.perfilId, p.situacao]
      )
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
  return { importados: preparados.length }
}
