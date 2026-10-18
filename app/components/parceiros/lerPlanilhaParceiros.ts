// Parser da planilha de importação de parceiros — modelo oficial em
// docs/modelos/modelo-importacao-parceiros.xlsx (cabeçalho: Razão Social, Nome
// Fantasia, Cidade, Estado, Região, Situação). Sem imports de Nuxt:
// `classificarLinhas` é pura e testável em node; o `exceljs` só carrega na
// leitura (import dinâmico). A região é derivada da UF quando o estado existe.
import { UFS, REGIOES, regiaoDaUf } from '../../config/brasil'

export type SituacaoImportacao = 'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'

export interface LinhaImportacao {
  razao_social: string
  nome_fantasia: string
  cidade: string
  estado: string
  regiao: string
  situacao: string
  situacaoImportacao: SituacaoImportacao
  /** Motivo da situação "invalido" ("" nos demais estados) */
  motivo: string
}

export interface ResultadoPlanilha {
  linhas: LinhaImportacao[]
  /** Mensagem quando o arquivo não pode ser usado (leitura/cabeçalho); null = ok */
  erro: string | null
}

export interface LinhaBruta {
  razao_social: string
  nome_fantasia: string
  cidade: string
  estado: string
  regiao: string
  situacao: string
}

export const COLUNAS_MODELO = ['Razão Social', 'Nome Fantasia', 'Cidade', 'Estado', 'Região', 'Situação']

const RAZAO_MAX = 255
const NOME_MAX = 150

const UFS_VALIDAS = new Set(UFS.map((u) => u.value))
const REGIOES_VALIDAS = new Set(REGIOES.map((r) => r.value))
const SITUACOES_VALIDAS = new Set(['Ativo', 'Inativo', 'Bloqueado'])

/**
 * Classifica as linhas cruas na ordem inválida -> repetida -> já cadastrada ->
 * pronta (mesmo critério dos demais parsers). A chave de duplicidade é a razão
 * social (case-insensitive).
 */
export function classificarLinhas(
  linhas: LinhaBruta[],
  existentes: Iterable<string>
): LinhaImportacao[] {
  const naBase = new Set([...existentes].map((d) => d.trim().toLowerCase()))
  const vistos = new Set<string>()
  const saida: LinhaImportacao[] = []

  for (const linha of linhas) {
    const razao = linha.razao_social.trim()
    const nome = linha.nome_fantasia.trim()
    const cidade = linha.cidade.trim()
    const estado = linha.estado.trim().toUpperCase()
    const regiaoInformada = linha.regiao.trim()
    const situacao = linha.situacao.trim()

    // Linha totalmente vazia não conta
    if (!razao && !nome && !cidade && !estado && !regiaoInformada && !situacao) continue

    const motivos: string[] = []
    if (!razao) motivos.push('Razão social ausente')
    else if (razao.length > RAZAO_MAX) motivos.push(`Razão social com mais de ${RAZAO_MAX} caracteres`)
    if (!nome) motivos.push('Nome fantasia ausente')
    else if (nome.length > NOME_MAX) motivos.push(`Nome fantasia com mais de ${NOME_MAX} caracteres`)
    if (estado && !UFS_VALIDAS.has(estado)) motivos.push('Estado inválido')
    if (regiaoInformada && !REGIOES_VALIDAS.has(regiaoInformada)) motivos.push('Região inválida')
    if (!SITUACOES_VALIDAS.has(situacao)) motivos.push('Situação inválida')

    const regiao = estado ? regiaoDaUf(estado) : regiaoInformada

    if (motivos.length) {
      saida.push({ razao_social: razao, nome_fantasia: nome, cidade, estado, regiao, situacao, situacaoImportacao: 'invalido', motivo: motivos.join('; ') })
      continue
    }

    const chave = razao.toLowerCase()
    if (vistos.has(chave)) {
      saida.push({ razao_social: razao, nome_fantasia: nome, cidade, estado, regiao, situacao, situacaoImportacao: 'repetido', motivo: '' })
      continue
    }
    vistos.add(chave)
    saida.push({
      razao_social: razao,
      nome_fantasia: nome,
      cidade,
      estado,
      regiao,
      situacao,
      situacaoImportacao: naBase.has(chave) ? 'ja-cadastrado' : 'pronto',
      motivo: ''
    })
  }
  return saida
}

const textoCelula = (celula: unknown): string => {
  if (celula == null) return ''
  if (typeof celula === 'string') return celula.trim()
  if (typeof celula === 'number' || typeof celula === 'boolean') return String(celula)
  const c = celula as { text?: string; result?: unknown; richText?: { text: string }[] }
  if (typeof c.text === 'string') return c.text.trim()
  if (c.richText) return c.richText.map((t) => t.text).join('').trim()
  if (c.result != null) return String(c.result).trim()
  return ''
}

export const lerPlanilhaParceiros = async (
  arquivo: File,
  existentes: Iterable<string>
): Promise<ResultadoPlanilha> => {
  let Worksheet: any
  try {
    const modulo = (await import('exceljs')) as any
    const ExcelJS = modulo.Workbook ? modulo : modulo.default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await arquivo.arrayBuffer())
    Worksheet = wb.worksheets[0]
    if (!Worksheet) return { linhas: [], erro: 'Não foi possível ler o arquivo.' }
  } catch {
    return { linhas: [], erro: 'Não foi possível ler o arquivo. Use um .xlsx válido.' }
  }

  const indices: Record<string, number> = {}
  const cabecalho = Worksheet.getRow(1)
  cabecalho.eachCell({ includeEmpty: false }, (celula: unknown, numero: number) => {
    const rotulo = textoCelula(celula).toLowerCase()
    const esperado = COLUNAS_MODELO.find((c) => c.toLowerCase() === rotulo)
    if (esperado && indices[esperado] === undefined) indices[esperado] = numero
  })
  const completo = COLUNAS_MODELO.every((c) => indices[c] !== undefined)
  if (!completo) {
    return {
      linhas: [],
      erro: `O arquivo não corresponde ao modelo. Cabeçalho esperado: ${COLUNAS_MODELO.join(', ')}.`
    }
  }

  const brutas: LinhaBruta[] = []
  for (let r = 2; r <= Worksheet.rowCount; r++) {
    const linha = Worksheet.getRow(r)
    brutas.push({
      razao_social: textoCelula(linha.getCell(indices['Razão Social']!)),
      nome_fantasia: textoCelula(linha.getCell(indices['Nome Fantasia']!)),
      cidade: textoCelula(linha.getCell(indices['Cidade']!)),
      estado: textoCelula(linha.getCell(indices['Estado']!)),
      regiao: textoCelula(linha.getCell(indices['Região']!)),
      situacao: textoCelula(linha.getCell(indices['Situação']!))
    })
  }

  const linhas = classificarLinhas(brutas, existentes)
  if (!linhas.length) {
    return { linhas: [], erro: 'O arquivo não contém nenhuma linha de dados.' }
  }
  return { linhas, erro: null }
}
