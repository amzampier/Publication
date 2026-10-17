// Parser da planilha de importação de softwares — modelo oficial em
// docs/modelos/modelo-importacao-softwares.xlsx (cabeçalho: Descrição,
// Categoria, Situação). Sem imports de Nuxt: `classificarLinhas` é pura e
// testável em node; o `exceljs` só carrega na leitura (import dinâmico).
export type SituacaoImportacao = 'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'

export interface LinhaImportacao {
  descricao: string
  categoria: string
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
  descricao: string
  categoria: string
  situacao: string
}

export const COLUNAS_MODELO = ['Descrição', 'Categoria', 'Situação']
const DESCRICAO_MAX = 200

/**
 * Classifica as linhas cruas na ordem inválida -> repetida -> já cadastrada ->
 * pronta (mesmo critério do parser de usuários).
 */
export function classificarLinhas(
  linhas: LinhaBruta[],
  existentes: Iterable<string>,
  categorias: Iterable<string>,
  situacoes: Iterable<string>
): LinhaImportacao[] {
  const naBase = new Set([...existentes].map((d) => d.trim().toLowerCase()))
  const categoriasSet = new Set([...categorias].map((c) => c.trim()))
  const situacoesSet = new Set([...situacoes].map((s) => s.trim()))
  const vistos = new Set<string>()
  const saida: LinhaImportacao[] = []

  for (const linha of linhas) {
    const descricao = linha.descricao.trim()
    const categoria = linha.categoria.trim()
    const situacao = linha.situacao.trim()

    // Linha totalmente vazia não conta
    if (!descricao && !categoria && !situacao) continue

    const motivos: string[] = []
    if (!descricao) motivos.push('Descrição ausente')
    else if (descricao.length > DESCRICAO_MAX) {
      motivos.push(`Descrição com mais de ${DESCRICAO_MAX} caracteres`)
    }
    if (!categoriasSet.has(categoria)) motivos.push('Categoria inválida')
    if (!situacoesSet.has(situacao)) motivos.push('Situação inválida')

    if (motivos.length) {
      saida.push({ descricao, categoria, situacao, situacaoImportacao: 'invalido', motivo: motivos.join('; ') })
      continue
    }

    const chave = descricao.toLowerCase()
    if (vistos.has(chave)) {
      saida.push({ descricao, categoria, situacao, situacaoImportacao: 'repetido', motivo: '' })
      continue
    }
    vistos.add(chave)
    saida.push({
      descricao,
      categoria,
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

export const lerPlanilhaSoftwares = async (
  arquivo: File,
  existentes: Iterable<string>,
  categorias: Iterable<string>,
  situacoes: Iterable<string>
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

  // Cabeçalho: 1ª linha, trim + case-insensitive, mapeado por nome de coluna
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
      descricao: textoCelula(linha.getCell(indices['Descrição']!)),
      categoria: textoCelula(linha.getCell(indices['Categoria']!)),
      situacao: textoCelula(linha.getCell(indices['Situação']!))
    })
  }

  const linhas = classificarLinhas(brutas, existentes, categorias, situacoes)
  if (!linhas.length) {
    return { linhas: [], erro: 'O arquivo não contém nenhuma linha de dados.' }
  }
  return { linhas, erro: null }
}
