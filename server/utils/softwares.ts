// server/utils/softwares.ts — camada de acesso do catálogo `softwares`
// (change softwares-backend-e-importacao). O `codigo` (SFT-XXX) é a identidade
// e a chave primária do software: é gerado pelo servidor (MAX + retry), nunca
// digitado. Escritas passam por validação espelhando o cliente; as rotas
// aplicam RBAC e auditoria.
import { createError } from 'h3'
import { query, getTransaction } from './db'

export type CategoriaSoftware = 'Delphi' | 'Web' | 'Delphi e Web'
export type SituacaoSoftware = 'Ativo' | 'Inativo'

/** Shape da tela (SoftwareModelo) — o frontend nunca vê o shape tabular do banco. */
export interface SoftwareApi {
  codigo: string
  uuid: string
  descricao: string
  categoria: CategoriaSoftware
  situacao: SituacaoSoftware
  /** ISO 8601 */
  criado_em: string
  /** ISO 8601 */
  atualizado_em: string
}

export const CATEGORIAS: CategoriaSoftware[] = ['Delphi', 'Web', 'Delphi e Web']
export const SITUACOES: SituacaoSoftware[] = ['Ativo', 'Inativo']

const PREFIXO = 'SFT-'
const DIGITOS = 3
const DESCRICAO_MAX = 200
const LIMITE_IMPORTACAO = 500

function erro400(mensagem: string): never {
  throw createError({ statusCode: 400, statusMessage: mensagem })
}
function erro404(mensagem = 'Software não encontrado.'): never {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}
function erro409(mensagem: string): never {
  throw createError({ statusCode: 409, statusMessage: mensagem })
}

// ---------------------------------------------------------------------------
// Código (funções puras — cobertas por testes unitários)
// ---------------------------------------------------------------------------

/** Formata o código a partir do número sequencial: 1 -> SFT-001. */
export function formatarCodigo(numero: number): string {
  const inteiro = Number.isFinite(numero) && numero > 0 ? Math.trunc(numero) : 1
  return `${PREFIXO}${String(inteiro).padStart(DIGITOS, '0')}`
}

/** Extrai o número de um código SFT-XXX; 0 quando não casa. */
export function numeroDoCodigo(codigo: unknown): number {
  if (typeof codigo !== 'string') return 0
  const match = /^SFT-(\d+)$/.exec(codigo.trim())
  return match ? Number(match[1]) : 0
}

/** Próximo código sequencial a partir dos códigos existentes. */
export function proximoCodigo(codigos: Iterable<unknown>): string {
  let maior = 0
  for (const codigo of codigos) {
    const numero = numeroDoCodigo(codigo)
    if (numero > maior) maior = numero
  }
  return formatarCodigo(maior + 1)
}

/** Valida o código do path (SFT-NNN+); inválido -> 404. */
export function validarCodigo(codigo: unknown): string {
  const valor = typeof codigo === 'string' ? codigo.trim() : ''
  if (!/^SFT-\d{3,}$/.test(valor)) erro404()
  return valor
}

// ---------------------------------------------------------------------------
// Validações (espelham as do cliente). Nomes com sufixo `Software` para não
// colidirem com os auto-imports de server/utils/perfis.ts no Nitro.
// ---------------------------------------------------------------------------

export function validarDescricaoSoftware(descricao: unknown): string {
  if (typeof descricao !== 'string' || !descricao.trim()) {
    erro400('Informe a descrição do software.')
  }
  const valor = descricao.trim()
  if (valor.length > DESCRICAO_MAX) {
    erro400(`A descrição deve ter no máximo ${DESCRICAO_MAX} caracteres.`)
  }
  return valor
}

export function validarCategoriaSoftware(categoria: unknown): CategoriaSoftware {
  if (typeof categoria !== 'string' || !CATEGORIAS.includes(categoria as CategoriaSoftware)) {
    erro400('Categoria deve ser Delphi, Web ou Delphi e Web.')
  }
  return categoria as CategoriaSoftware
}

export function validarSituacaoSoftware(situacao: unknown): SituacaoSoftware {
  if (typeof situacao !== 'string' || !SITUACOES.includes(situacao as SituacaoSoftware)) {
    erro400('Situação deve ser Ativo ou Inativo.')
  }
  return situacao as SituacaoSoftware
}

export interface LinhaSoftwareValidada {
  descricao: string
  categoria: CategoriaSoftware
  situacao: SituacaoSoftware
}

/** Valida/normaliza uma linha de importação (lança 400 na primeira falha). */
export function validarLinhaImportacao(linha: unknown): LinhaSoftwareValidada {
  const r = (linha ?? {}) as Record<string, unknown>
  return {
    descricao: validarDescricaoSoftware(r.descricao),
    categoria: validarCategoriaSoftware(r.categoria),
    situacao: validarSituacaoSoftware(r.situacao)
  }
}

// ---------------------------------------------------------------------------
// Normalização banco -> shape da tela
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>

const COLUNAS = 'codigo, uuid, descricao, categoria, situacao, criado_em, atualizado_em'

const dataIso = (valor: unknown): string => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const d = new Date(valor)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
    return valor
  }
  return ''
}

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

const montarSoftware = (row: Row): SoftwareApi => ({
  codigo: texto(row.codigo),
  uuid: texto(row.uuid),
  descricao: texto(row.descricao),
  categoria: (texto(row.categoria) || 'Delphi') as CategoriaSoftware,
  situacao: (texto(row.situacao) || 'Ativo') as SituacaoSoftware,
  criado_em: dataIso(row.criado_em),
  atualizado_em: dataIso(row.atualizado_em)
})

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

/** Catálogo completo, ordenado por código (GET /api/softwares). */
export async function listarSoftwares(): Promise<SoftwareApi[]> {
  const linhas = await query<Row[]>(`SELECT ${COLUNAS} FROM softwares ORDER BY codigo ASC`)
  return linhas.map(montarSoftware)
}

/** Um software pelo código ou null. */
export async function buscarSoftware(codigo: string): Promise<SoftwareApi | null> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS} FROM softwares WHERE codigo = ? LIMIT 1`,
    [codigo]
  )
  const linha = linhas[0]
  return linha ? montarSoftware(linha) : null
}

async function proximoCodigoDoBanco(): Promise<string> {
  const linhas = await query<Array<{ codigo: string }>>('SELECT codigo FROM softwares')
  return proximoCodigo(linhas.map((l) => l.codigo))
}

// ---------------------------------------------------------------------------
// Escritas
// ---------------------------------------------------------------------------

/** Cria o software gerando o próximo código (MAX + 1 retry em corrida). */
export async function criarSoftware(dados: {
  descricao: unknown
  categoria?: unknown
  situacao?: unknown
}): Promise<SoftwareApi> {
  const descricao = validarDescricaoSoftware(dados.descricao)
  const categoria =
    dados.categoria === undefined ? 'Delphi' : validarCategoriaSoftware(dados.categoria)
  const situacao =
    dados.situacao === undefined ? 'Ativo' : validarSituacaoSoftware(dados.situacao)

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const codigo = await proximoCodigoDoBanco()
    try {
      await query(
        'INSERT INTO softwares (codigo, descricao, categoria, situacao) VALUES (?, ?, ?, ?)',
        [codigo, descricao, categoria, situacao]
      )
      const criado = await buscarSoftware(codigo)
      if (!criado) erro404('Falha ao criar o software.')
      return criado
    } catch (erro) {
      // Corrida na geração do código: recomputa e tenta mais uma vez.
      if ((erro as { errno?: number } | null)?.errno === 1062 && tentativa === 0) continue
      throw erro
    }
  }
  erro409('Não foi possível gerar um código único para o software. Tente novamente.')
}

/** Atualiza descrição/categoria/situação (código e timestamps preservados). */
export async function atualizarSoftware(
  codigo: string,
  dados: { descricao?: unknown; categoria?: unknown; situacao?: unknown }
): Promise<SoftwareApi> {
  const existente = await buscarSoftware(codigo)
  if (!existente) erro404()

  const descricao =
    'descricao' in dados ? validarDescricaoSoftware(dados.descricao) : existente.descricao
  const categoria =
    'categoria' in dados ? validarCategoriaSoftware(dados.categoria) : existente.categoria
  const situacao =
    'situacao' in dados ? validarSituacaoSoftware(dados.situacao) : existente.situacao

  await query(
    'UPDATE softwares SET descricao = ?, categoria = ?, situacao = ? WHERE codigo = ?',
    [descricao, categoria, situacao, codigo]
  )
  const atualizado = await buscarSoftware(codigo)
  if (!atualizado) erro404()
  return atualizado
}

/** Exclui o software (FK RESTRICT de entregas -> 409). */
export async function excluirSoftware(codigo: string): Promise<void> {
  const existente = await buscarSoftware(codigo)
  if (!existente) erro404()
  try {
    await query('DELETE FROM softwares WHERE codigo = ?', [codigo])
  } catch (erro) {
    if ((erro as { errno?: number } | null)?.errno === 1451) {
      erro409('O software não pode ser excluído: existem entregas vinculadas a ele.')
    }
    throw erro
  }
}

/**
 * Importação (POST /api/softwares/importar): revalida as linhas, recusa tudo
 * quando há linha inválida (400 com motivos) ou descrição já cadastrada
 * (case-insensitive), e grava em transação atribuindo os códigos sequenciais.
 */
export async function importarSoftwares(linhas: unknown): Promise<{ importados: number }> {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > LIMITE_IMPORTACAO) {
    erro400(`Limite de ${LIMITE_IMPORTACAO} linhas por importação.`)
  }

  const motivos: string[] = []
  const preparados: LinhaSoftwareValidada[] = []
  const vistos = new Set<string>()

  for (const [indice, linha] of linhas.entries()) {
    try {
      const validada = validarLinhaImportacao(linha)
      const chave = validada.descricao.toLowerCase()
      if (vistos.has(chave)) erro400('descrição repetida no arquivo.')
      vistos.add(chave)
      preparados.push(validada)
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

  // Unicidade por descrição contra o banco (case-insensitive).
  const existentes = await query<Array<{ descricao: string }>>('SELECT descricao FROM softwares')
  const naBase = new Set(existentes.map((e) => String(e.descricao).toLowerCase()))
  const duplicados = preparados
    .filter((p) => naBase.has(p.descricao.toLowerCase()))
    .map((p) => p.descricao)
  if (duplicados.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém softwares já cadastrados — nada foi gravado.',
      data: {
        motivos: duplicados.map((d) => `Descrição já cadastrada: ${d}.`),
        conflitos: duplicados
      }
    })
  }

  const tx = await getTransaction()
  try {
    const atuais = await tx.query<Array<{ codigo: string }>>(
      'SELECT codigo FROM softwares FOR UPDATE'
    )
    let numero = numeroDoCodigo(proximoCodigo(atuais.map((a) => a.codigo))) - 1
    for (const p of preparados) {
      numero += 1
      await tx.query(
        'INSERT INTO softwares (codigo, descricao, categoria, situacao) VALUES (?, ?, ?, ?)',
        [formatarCodigo(numero), p.descricao, p.categoria, p.situacao]
      )
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('A importação encontrou códigos em conflito — nada foi gravado.')
    }
    throw erro
  }
  return { importados: preparados.length }
}
