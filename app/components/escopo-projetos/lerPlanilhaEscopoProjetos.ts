// Parser da planilha de importação histórica de Escopo de Projetos — modelo
// oficial em docs/modelos/modelo-importacao-escopo-projetos.xlsx. Sem imports
// de Nuxt: `classificarLinhasEscopoProjetos` é pura/testável; o `exceljs` só
// carrega na leitura (import dinâmico).
import {
  STATUS_ESCOPO,
  chaveAnoVersao,
  ehDataIso,
  validarEscopo
} from '#shared/escopo-projetos'

export type SituacaoImportacao = 'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'

export interface LinhaBrutaEscopo {
  nome: string
  versao: string
  ano: string
  dataInicio: string
  dataFinal: string
  dataPrevisao: string
  dataPublicacao: string
  status: string
  descricaoGeral: string
}

export interface LinhaImportacaoEscopo extends LinhaBrutaEscopo {
  situacaoImportacao: SituacaoImportacao
  /** Motivo da situação "invalido" ("" nos demais estados) */
  motivo: string
}

export interface ResultadoPlanilhaEscopo {
  linhas: LinhaImportacaoEscopo[]
  /** Mensagem quando o arquivo não pode ser usado; null = ok */
  erro: string | null
}

export const COLUNAS_MODELO = [
  'Nome',
  'Versão',
  'Ano',
  'Data de Início',
  'Data Final',
  'Data de Previsão',
  'Data de Publicação',
  'Status',
  'Descrição Geral'
]

const pad2 = (valor: string): string => valor.padStart(2, '0')

/** Normaliza `dd/mm/aaaa` (1 ou 2 dígitos) para `AAAA-MM-DD`. */
const normalizarData = (valor: string): string => {
  const texto = valor.trim()
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto)
  if (br) return `${br[3]}-${pad2(br[2]!)}-${pad2(br[1]!)}`
  return texto
}

const dataValida = (valor: string): boolean => !valor || ehDataIso(valor)

/**
 * Classifica as linhas cruas na ordem inválida -> repetida -> já cadastrada ->
 * pronta. A chave de unicidade é `(ano, versao)`; o código é gerado no servidor.
 */
export function classificarLinhasEscopoProjetos(
  linhas: LinhaBrutaEscopo[],
  existentes: Iterable<string>
): LinhaImportacaoEscopo[] {
  const naBase = new Set([...existentes])
  const vistos = new Set<string>()
  const saida: LinhaImportacaoEscopo[] = []

  for (const linha of linhas) {
    const nome = linha.nome.trim()
    const versao = linha.versao.trim()
    const ano = linha.ano.trim()
    const dataInicio = normalizarData(linha.dataInicio)
    const dataFinal = normalizarData(linha.dataFinal)
    const dataPrevisao = normalizarData(linha.dataPrevisao)
    const dataPublicacao = normalizarData(linha.dataPublicacao)
    const statusBruto = linha.status.trim()
    const status = statusBruto || 'Em Andamento'
    const descricaoGeral = linha.descricaoGeral.trim()

    if (
      !nome &&
      !versao &&
      !ano &&
      !dataInicio &&
      !dataFinal &&
      !dataPrevisao &&
      !dataPublicacao &&
      !statusBruto &&
      !descricaoGeral
    ) {
      continue
    }

    const validacao = validarEscopo({
      nome,
      versao,
      ano: Number(ano),
      dataInicio,
      dataFinal,
      dataPrevisao,
      dataPublicacao,
      status
    })
    const motivos = Object.values(validacao.erros).filter(Boolean) as string[]

    if (!STATUS_ESCOPO.includes(status as (typeof STATUS_ESCOPO)[number])) {
      motivos.push('Status inválido')
    }
    if (!dataValida(dataInicio)) motivos.push('Data de início inválida')
    if (!dataValida(dataFinal)) motivos.push('Data final inválida')
    if (!dataValida(dataPrevisao)) motivos.push('Data de previsão inválida')
    if (!dataValida(dataPublicacao)) motivos.push('Data de publicação inválida')

    const base: LinhaBrutaEscopo = {
      nome,
      versao,
      ano,
      dataInicio,
      dataFinal,
      dataPrevisao,
      dataPublicacao,
      status,
      descricaoGeral
    }

    if (motivos.length) {
      saida.push({
        ...base,
        situacaoImportacao: 'invalido',
        motivo: [...new Set(motivos)].join('; ')
      })
      continue
    }

    const chave = chaveAnoVersao(Number(ano), versao)
    if (vistos.has(chave)) {
      saida.push({ ...base, situacaoImportacao: 'repetido', motivo: '' })
      continue
    }
    vistos.add(chave)
    saida.push({
      ...base,
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

const isoData = (data: Date): string => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Normaliza uma célula de data (Date do Excel, dd/mm/aaaa ou AAAA-MM-DD). */
const dataCelula = (celula: unknown): string => {
  const valor = (celula as { value?: unknown } | null)?.value
  if (valor instanceof Date) return isoData(valor)
  return normalizarData(textoCelula(celula))
}

export const lerPlanilhaEscopoProjetos = async (
  arquivo: File,
  existentes: Iterable<string>
): Promise<ResultadoPlanilhaEscopo> => {
  let worksheet: any
  try {
    const modulo = (await import('exceljs')) as any
    const ExcelJS = modulo.Workbook ? modulo : modulo.default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await arquivo.arrayBuffer())
    worksheet = wb.worksheets[0]
    if (!worksheet) return { linhas: [], erro: 'Não foi possível ler o arquivo.' }
  } catch {
    return { linhas: [], erro: 'Não foi possível ler o arquivo. Use um .xlsx válido.' }
  }

  const indices: Record<string, number> = {}
  worksheet.getRow(1).eachCell(
    { includeEmpty: false },
    (celula: unknown, numero: number) => {
      const rotulo = textoCelula(celula).toLowerCase()
      const esperado = COLUNAS_MODELO.find((coluna) => coluna.toLowerCase() === rotulo)
      if (esperado && indices[esperado] === undefined) indices[esperado] = numero
    }
  )
  const completo = COLUNAS_MODELO.every((coluna) => indices[coluna] !== undefined)
  if (!completo) {
    return {
      linhas: [],
      erro: `O arquivo não corresponde ao modelo. Cabeçalho esperado: ${COLUNAS_MODELO.join(', ')}.`
    }
  }

  const brutas: LinhaBrutaEscopo[] = []
  for (let r = 2; r <= worksheet.rowCount; r += 1) {
    const linha = worksheet.getRow(r)
    const cel = (coluna: string) => linha.getCell(indices[coluna]!)
    brutas.push({
      nome: textoCelula(cel('Nome')),
      versao: textoCelula(cel('Versão')),
      ano: textoCelula(cel('Ano')),
      dataInicio: dataCelula(cel('Data de Início')),
      dataFinal: dataCelula(cel('Data Final')),
      dataPrevisao: dataCelula(cel('Data de Previsão')),
      dataPublicacao: dataCelula(cel('Data de Publicação')),
      status: textoCelula(cel('Status')),
      descricaoGeral: textoCelula(cel('Descrição Geral'))
    })
  }

  const linhas = classificarLinhasEscopoProjetos(brutas, existentes)
  if (!linhas.length) {
    return { linhas: [], erro: 'O arquivo não contém nenhuma linha de dados.' }
  }
  return { linhas, erro: null }
}
