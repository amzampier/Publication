// Parser da planilha de importação de Release Weeks — modelo oficial em
// docs/modelos/modelo-importacao-release-week.xlsx. Sem imports de Nuxt:
// `classificarLinhasReleaseWeek` é pura/testável; o `exceljs` só carrega na
// leitura (import dinâmico).
import {
  MESES,
  STATUS_RELEASE,
  validarReleaseWeek
} from '#shared/utils/release-week'

export type SituacaoImportacao = 'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'

export interface LinhaBrutaReleaseWeek {
  nome: string
  versao: string
  release: string
  semana: string
  ano: string
  mes: string
  dataInicio: string
  dataFinaliza: string
  dataPublicacao: string
  status: string
  descricao: string
  destaque: string
}

export interface LinhaImportacaoReleaseWeek extends LinhaBrutaReleaseWeek {
  situacaoImportacao: SituacaoImportacao
  /** Motivo da situação "invalido" ("" nos demais estados) */
  motivo: string
}

export interface ResultadoPlanilhaReleaseWeek {
  linhas: LinhaImportacaoReleaseWeek[]
  /** Mensagem quando o arquivo não pode ser usado; null = ok */
  erro: string | null
}

export const COLUNAS_MODELO = [
  'Nome',
  'Semana',
  'Ano',
  'Mês',
  'Data Início',
  'Data Finaliza',
  'Data Publicação',
  'Status',
  'Versão',
  'Release',
  'Descrição',
  'Destaque'
]

const parseDestaque = (valor: string): boolean => {
  const v = valor.trim().toLowerCase()
  return v === 'sim' || v === 's' || v === 'true' || v === '1' || v === 'x'
}

/**
 * Classifica as linhas cruas na ordem inválida -> repetida -> já cadastrada ->
 * pronta. A chave de unicidade é `(ano, semana)`; `data_publicacao` precisa ser
 * segunda-feira (regra compartilhada).
 */
export function classificarLinhasReleaseWeek(
  linhas: LinhaBrutaReleaseWeek[],
  existentes: Iterable<string>
): LinhaImportacaoReleaseWeek[] {
  const naBase = new Set([...existentes])
  const vistos = new Set<string>()
  const saida: LinhaImportacaoReleaseWeek[] = []

  for (const linha of linhas) {
    const nome = linha.nome.trim()
    const versao = linha.versao.trim()
    const release = linha.release.trim()
    const semana = linha.semana.trim()
    const ano = linha.ano.trim()
    const mes = linha.mes.trim()
    const dataInicio = linha.dataInicio.trim()
    const dataFinaliza = linha.dataFinaliza.trim()
    const dataPublicacao = linha.dataPublicacao.trim()
    const statusBruto = linha.status.trim()
    const status = statusBruto || 'Aberta'
    const descricao = linha.descricao.trim()
    const destaque = parseDestaque(linha.destaque)

    // Linha totalmente vazia não conta
    if (
      !nome &&
      !semana &&
      !ano &&
      !mes &&
      !dataInicio &&
      !dataFinaliza &&
      !dataPublicacao &&
      !statusBruto &&
      !descricao
    ) {
      continue
    }

    const validacao = validarReleaseWeek({
      nome,
      semana: Number(semana),
      ano: Number(ano),
      mes,
      dataInicio,
      dataFinaliza,
      dataPublicacao
    })
    const motivos = Object.values(validacao.erros).filter(Boolean) as string[]
    if (!STATUS_RELEASE.includes(status as (typeof STATUS_RELEASE)[number])) {
      motivos.push('Status inválido')
    }

    const base: LinhaBrutaReleaseWeek = {
      nome,
      versao,
      release,
      semana,
      ano,
      mes,
      dataInicio,
      dataFinaliza,
      dataPublicacao,
      status,
      descricao,
      destaque: destaque ? 'Sim' : 'Não'
    }

    if (motivos.length) {
      saida.push({
        ...base,
        situacaoImportacao: 'invalido',
        motivo: [...new Set(motivos)].join('; ')
      })
      continue
    }

    const chave = `${Number(ano)}-${Number(semana)}`
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
  const texto = textoCelula(celula)
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  return texto
}

export const lerPlanilhaReleaseWeek = async (
  arquivo: File,
  existentes: Iterable<string>
): Promise<ResultadoPlanilhaReleaseWeek> => {
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
  Worksheet.getRow(1).eachCell(
    { includeEmpty: false },
    (celula: unknown, numero: number) => {
      const rotulo = textoCelula(celula).toLowerCase()
      const esperado = COLUNAS_MODELO.find((c) => c.toLowerCase() === rotulo)
      if (esperado && indices[esperado] === undefined) indices[esperado] = numero
    }
  )
  const completo = COLUNAS_MODELO.every((c) => indices[c] !== undefined)
  if (!completo) {
    return {
      linhas: [],
      erro: `O arquivo não corresponde ao modelo. Cabeçalho esperado: ${COLUNAS_MODELO.join(', ')}.`
    }
  }

  const brutas: LinhaBrutaReleaseWeek[] = []
  for (let r = 2; r <= Worksheet.rowCount; r += 1) {
    const linha = Worksheet.getRow(r)
    const cel = (coluna: string) => linha.getCell(indices[coluna]!)
    brutas.push({
      nome: textoCelula(cel('Nome')),
      versao: textoCelula(cel('Versão')),
      release: textoCelula(cel('Release')),
      semana: textoCelula(cel('Semana')),
      ano: textoCelula(cel('Ano')),
      mes: textoCelula(cel('Mês')),
      dataInicio: dataCelula(cel('Data Início')),
      dataFinaliza: dataCelula(cel('Data Finaliza')),
      dataPublicacao: dataCelula(cel('Data Publicação')),
      status: textoCelula(cel('Status')),
      descricao: textoCelula(cel('Descrição')),
      destaque: textoCelula(cel('Destaque'))
    })
  }

  const linhas = classificarLinhasReleaseWeek(brutas, existentes)
  if (!linhas.length) {
    return { linhas: [], erro: 'O arquivo não contém nenhuma linha de dados.' }
  }
  return { linhas, erro: null }
}

/** Meses/status exportados para o modal (rótulos do modelo). */
export const MESES_MODELO = [...MESES]
export const STATUS_MODELO = [...STATUS_RELEASE]
