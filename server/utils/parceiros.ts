// server/utils/parceiros.ts — camada de acesso do cadastro `parceiros`
// (change construir-parceiros). O `id` (UUID) é a chave primária; o `codigo`
// (PAR-XXX) é um identificador SECUNDÁRIO, único, gerado pelo servidor
// (MAX + retry), nunca digitado. A `regiao` é derivada da UF do estado. Escritas
// passam por validação espelhando o cliente; as rotas aplicam RBAC e auditoria.
import { createError } from 'h3'
import { query, getTransaction } from './db'

export type SituacaoParceiro = 'Ativo' | 'Inativo' | 'Bloqueado'
export type RegiaoBR = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

/** Shape da tela (ParceiroModelo) — o frontend nunca vê o shape tabular do banco. */
export interface ParceiroApi {
  id: string
  codigo: string
  razao_social: string
  nome_fantasia: string
  cidade: string
  estado: string
  regiao: RegiaoBR | ''
  logo_url: string
  situacao: SituacaoParceiro
  /** ISO 8601 */
  criado_em: string
  /** ISO 8601 */
  atualizado_em: string
}

export const SITUACOES_PARCEIRO: SituacaoParceiro[] = ['Ativo', 'Inativo', 'Bloqueado']
export const REGIOES: RegiaoBR[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

/** Mapa UF → região (espelho de app/config/brasil.ts — barreira app/ × server/). */
export const REGIAO_POR_UF: Record<string, RegiaoBR> = {
  AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste',
  PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul'
}

const PREFIXO = 'PAR-'
const DIGITOS = 3
const RAZAO_MAX = 255
const NOME_MAX = 150
const CIDADE_MAX = 120
const LOGO_MAX = 500
const LIMITE_IMPORTACAO = 500

/** Região esperada para uma UF ('' quando a UF é vazia/desconhecida). */
export function regiaoDaUf(uf: string): RegiaoBR | '' {
  return REGIAO_POR_UF[uf.trim().toUpperCase()] ?? ''
}

function erro400(mensagem: string): never {
  throw createError({ statusCode: 400, statusMessage: mensagem })
}
function erro404(mensagem = 'Parceiro não encontrado.'): never {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}
function erro409(mensagem: string): never {
  throw createError({ statusCode: 409, statusMessage: mensagem })
}

// ---------------------------------------------------------------------------
// Código (funções puras — cobertas por testes unitários)
// ---------------------------------------------------------------------------

/** Formata o código a partir do número sequencial: 1 -> PAR-001. */
export function formatarCodigoParceiro(numero: number): string {
  const inteiro = Number.isFinite(numero) && numero > 0 ? Math.trunc(numero) : 1
  return `${PREFIXO}${String(inteiro).padStart(DIGITOS, '0')}`
}

/** Extrai o número de um código PAR-XXX; 0 quando não casa. */
export function numeroDoCodigoParceiro(codigo: unknown): number {
  if (typeof codigo !== 'string') return 0
  const match = /^PAR-(\d+)$/.exec(codigo.trim())
  return match ? Number(match[1]) : 0
}

/** Próximo código sequencial a partir dos códigos existentes. */
export function proximoCodigoParceiro(codigos: Iterable<unknown>): string {
  let maior = 0
  for (const codigo of codigos) {
    const numero = numeroDoCodigoParceiro(codigo)
    if (numero > maior) maior = numero
  }
  return formatarCodigoParceiro(maior + 1)
}

// ---------------------------------------------------------------------------
// Validações (espelham as do cliente). Sufixo `Parceiro` para não colidirem com
// os auto-imports de server/utils/perfis.ts no Nitro.
// ---------------------------------------------------------------------------

export function validarRazaoSocialParceiro(valor: unknown): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    erro400('Informe a razão social do parceiro.')
  }
  const texto = valor.trim()
  if (texto.length > RAZAO_MAX) erro400(`A razão social deve ter no máximo ${RAZAO_MAX} caracteres.`)
  return texto
}

export function validarNomeFantasiaParceiro(valor: unknown): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    erro400('Informe o nome fantasia do parceiro.')
  }
  const texto = valor.trim()
  if (texto.length > NOME_MAX) erro400(`O nome fantasia deve ter no máximo ${NOME_MAX} caracteres.`)
  return texto
}

export function validarCidadeParceiro(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor).trim()
  if (texto.length > CIDADE_MAX) erro400(`A cidade deve ter no máximo ${CIDADE_MAX} caracteres.`)
  return texto
}

export function validarEstadoParceiro(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor).trim().toUpperCase()
  if (texto && !UFS.includes(texto)) erro400('Estado inválido: informe uma UF válida.')
  return texto
}

/**
 * Resolve a região a partir do estado. Quando a UF é válida a região é derivada
 * dela; se o cliente enviou uma região divergente, a escrita é recusada.
 */
export function resolverRegiao(estado: string, regiao: unknown): RegiaoBR | '' {
  if (!estado) return ''
  const esperada = regiaoDaUf(estado)
  const enviada = typeof regiao === 'string' ? regiao.trim() : ''
  if (enviada && enviada !== esperada) {
    erro400('A região não corresponde ao estado informado.')
  }
  return esperada
}

/** Valida/normaliza uma região contra o domínio (usada na importação). */
export function validarRegiaoParceiro(valor: unknown): RegiaoBR | '' {
  const texto = valor === null || valor === undefined ? '' : String(valor).trim()
  if (!texto) return ''
  if (!REGIOES.includes(texto as RegiaoBR)) {
    erro400('Região inválida: use Norte, Nordeste, Centro-Oeste, Sudeste ou Sul.')
  }
  return texto as RegiaoBR
}

export function validarSituacaoParceiro(valor: unknown): SituacaoParceiro {
  if (typeof valor !== 'string' || !SITUACOES_PARCEIRO.includes(valor as SituacaoParceiro)) {
    erro400('Situação deve ser Ativo, Inativo ou Bloqueado.')
  }
  return valor as SituacaoParceiro
}

export function validarLogoParceiro(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor).trim()
  if (!texto) return ''
  if (texto.length > LOGO_MAX) erro400(`O caminho da logo deve ter no máximo ${LOGO_MAX} caracteres.`)
  if (!texto.startsWith('/') && !texto.startsWith('http')) {
    erro400('Caminho da logo inválido.')
  }
  return texto
}

export interface LinhaParceiroValidada {
  razao_social: string
  nome_fantasia: string
  cidade: string
  estado: string
  regiao: RegiaoBR | ''
  situacao: SituacaoParceiro
}

/** Valida/normaliza uma linha de importação (lança 400 na primeira falha). */
export function validarLinhaImportacaoParceiro(linha: unknown): LinhaParceiroValidada {
  const r = (linha ?? {}) as Record<string, unknown>
  const estado = validarEstadoParceiro(r.estado)
  const regiaoInformada = validarRegiaoParceiro(r.regiao)
  const regiaoEsperada = regiaoDaUf(estado)
  if (regiaoInformada && estado && regiaoInformada !== regiaoEsperada) {
    erro400('A região não corresponde ao estado informado.')
  }
  return {
    razao_social: validarRazaoSocialParceiro(r.razao_social),
    nome_fantasia: validarNomeFantasiaParceiro(r.nome_fantasia),
    cidade: validarCidadeParceiro(r.cidade),
    estado,
    regiao: regiaoEsperada || regiaoInformada,
    situacao: validarSituacaoParceiro(r.situacao)
  }
}

// ---------------------------------------------------------------------------
// Normalização banco -> shape da tela
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>

const COLUNAS =
  'id, codigo, razao_social, nome_fantasia, cidade, estado, regiao, logo_url, situacao, criado_em, atualizado_em'

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

const montarParceiro = (row: Row): ParceiroApi => ({
  id: texto(row.id),
  codigo: texto(row.codigo),
  razao_social: texto(row.razao_social),
  nome_fantasia: texto(row.nome_fantasia),
  cidade: texto(row.cidade),
  estado: texto(row.estado),
  regiao: texto(row.regiao) as RegiaoBR | '',
  logo_url: texto(row.logo_url),
  situacao: (texto(row.situacao) || 'Ativo') as SituacaoParceiro,
  criado_em: dataIso(row.criado_em),
  atualizado_em: dataIso(row.atualizado_em)
})

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

/** Cadastro completo, ordenado por código (GET /api/parceiros). */
export async function listarParceiros(): Promise<ParceiroApi[]> {
  const linhas = await query<Row[]>(`SELECT ${COLUNAS} FROM parceiros ORDER BY codigo ASC`)
  return linhas.map(montarParceiro)
}

/** Um parceiro pelo id ou null. */
export async function buscarParceiro(id: string): Promise<ParceiroApi | null> {
  const linhas = await query<Row[]>(`SELECT ${COLUNAS} FROM parceiros WHERE id = ? LIMIT 1`, [id])
  const linha = linhas[0]
  return linha ? montarParceiro(linha) : null
}

async function proximoCodigoDoBanco(): Promise<string> {
  const linhas = await query<Array<{ codigo: string }>>('SELECT codigo FROM parceiros')
  return proximoCodigoParceiro(linhas.map((l) => l.codigo))
}

// ---------------------------------------------------------------------------
// Escritas
// ---------------------------------------------------------------------------

/** Cria o parceiro gerando o próximo código PAR-XXX (MAX + 1 retry em corrida). */
export async function criarParceiro(dados: {
  razao_social: unknown
  nome_fantasia: unknown
  cidade?: unknown
  estado?: unknown
  regiao?: unknown
  logo_url?: unknown
  situacao?: unknown
}): Promise<ParceiroApi> {
  const razaoSocial = validarRazaoSocialParceiro(dados.razao_social)
  const nomeFantasia = validarNomeFantasiaParceiro(dados.nome_fantasia)
  const cidade = validarCidadeParceiro(dados.cidade)
  const estado = validarEstadoParceiro(dados.estado)
  const regiao = resolverRegiao(estado, dados.regiao)
  const logo = validarLogoParceiro(dados.logo_url)
  const situacao = dados.situacao === undefined ? 'Ativo' : validarSituacaoParceiro(dados.situacao)

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const codigo = await proximoCodigoDoBanco()
    try {
      await query(
        `INSERT INTO parceiros (id, codigo, razao_social, nome_fantasia, cidade, estado, regiao, logo_url, situacao)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [codigo, razaoSocial, nomeFantasia, cidade, estado, regiao, logo || null, situacao]
      )
      const criado = await buscarParceiroPorCodigo(codigo)
      if (!criado) erro404('Falha ao criar o parceiro.')
      return criado
    } catch (erro) {
      // Corrida na geração do código: recomputa e tenta mais uma vez.
      if ((erro as { errno?: number } | null)?.errno === 1062 && tentativa === 0) continue
      throw erro
    }
  }
  erro409('Não foi possível gerar um código único para o parceiro. Tente novamente.')
}

async function buscarParceiroPorCodigo(codigo: string): Promise<ParceiroApi | null> {
  const linhas = await query<Row[]>(`SELECT ${COLUNAS} FROM parceiros WHERE codigo = ? LIMIT 1`, [codigo])
  const linha = linhas[0]
  return linha ? montarParceiro(linha) : null
}

/** Atualiza os campos editáveis (id, codigo e timestamps preservados). */
export async function atualizarParceiro(
  id: string,
  dados: {
    razao_social?: unknown
    nome_fantasia?: unknown
    cidade?: unknown
    estado?: unknown
    regiao?: unknown
    logo_url?: unknown
    situacao?: unknown
  }
): Promise<ParceiroApi> {
  const existente = await buscarParceiro(id)
  if (!existente) erro404()

  const razaoSocial =
    'razao_social' in dados ? validarRazaoSocialParceiro(dados.razao_social) : existente.razao_social
  const nomeFantasia =
    'nome_fantasia' in dados ? validarNomeFantasiaParceiro(dados.nome_fantasia) : existente.nome_fantasia
  const cidade = 'cidade' in dados ? validarCidadeParceiro(dados.cidade) : existente.cidade
  const estado = 'estado' in dados ? validarEstadoParceiro(dados.estado) : existente.estado
  const regiao =
    'estado' in dados || 'regiao' in dados ? resolverRegiao(estado, dados.regiao) : existente.regiao
  const logo = 'logo_url' in dados ? validarLogoParceiro(dados.logo_url) : existente.logo_url
  const situacao =
    'situacao' in dados ? validarSituacaoParceiro(dados.situacao) : existente.situacao

  await query(
    `UPDATE parceiros
        SET razao_social = ?, nome_fantasia = ?, cidade = ?, estado = ?, regiao = ?, logo_url = ?, situacao = ?
      WHERE id = ?`,
    [razaoSocial, nomeFantasia, cidade, estado, regiao, logo || null, situacao, id]
  )
  const atualizado = await buscarParceiro(id)
  if (!atualizado) erro404()
  return atualizado
}

/** Exclui o parceiro (FK RESTRICT de entregas -> 409). */
export async function excluirParceiro(id: string): Promise<void> {
  const existente = await buscarParceiro(id)
  if (!existente) erro404()
  try {
    await query('DELETE FROM parceiros WHERE id = ?', [id])
  } catch (erro) {
    if ((erro as { errno?: number } | null)?.errno === 1451) {
      erro409('O parceiro não pode ser excluído: existem entregas vinculadas a ele.')
    }
    throw erro
  }
}

/**
 * Importação (POST /api/parceiros/importar): revalida as linhas, recusa tudo
 * quando há linha inválida (400 com motivos) ou razão social já cadastrada
 * (case-insensitive), e grava em transação atribuindo os códigos sequenciais.
 * A logo não faz parte da importação.
 */
export async function importarParceiros(linhas: unknown): Promise<{ importados: number }> {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > LIMITE_IMPORTACAO) {
    erro400(`Limite de ${LIMITE_IMPORTACAO} linhas por importação.`)
  }

  const motivos: string[] = []
  const preparados: LinhaParceiroValidada[] = []
  const vistos = new Set<string>()

  for (const [indice, linha] of linhas.entries()) {
    try {
      const validada = validarLinhaImportacaoParceiro(linha)
      const chave = validada.razao_social.toLowerCase()
      if (vistos.has(chave)) erro400('razão social repetida no arquivo.')
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

  // Unicidade por razão social contra o banco (case-insensitive).
  const existentes = await query<Array<{ razao_social: string }>>('SELECT razao_social FROM parceiros')
  const naBase = new Set(existentes.map((e) => String(e.razao_social).toLowerCase()))
  const duplicados = preparados
    .filter((p) => naBase.has(p.razao_social.toLowerCase()))
    .map((p) => p.razao_social)
  if (duplicados.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém parceiros já cadastrados — nada foi gravado.',
      data: {
        motivos: duplicados.map((d) => `Razão social já cadastrada: ${d}.`),
        conflitos: duplicados
      }
    })
  }

  const tx = await getTransaction()
  try {
    const atuais = await tx.query<Array<{ codigo: string }>>(
      'SELECT codigo FROM parceiros FOR UPDATE'
    )
    let numero = numeroDoCodigoParceiro(proximoCodigoParceiro(atuais.map((a) => a.codigo))) - 1
    for (const p of preparados) {
      numero += 1
      await tx.query(
        `INSERT INTO parceiros (id, codigo, razao_social, nome_fantasia, cidade, estado, regiao, situacao)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [formatarCodigoParceiro(numero), p.razao_social, p.nome_fantasia, p.cidade, p.estado, p.regiao, p.situacao]
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
