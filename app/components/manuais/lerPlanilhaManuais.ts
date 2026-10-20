// Parser da planilha de importação histórica de Manuais Mensais — modelo
// oficial em docs/modelos/modelo-importacao-manuais.xlsx. Sem imports de Nuxt:
// `classificarLinhasManuais` é pura/testável; o `exceljs` só carrega na leitura
// (import dinâmico).
import {
  MESES,
  STATUS_MANUAL,
  ehDataIso,
  validarManual
} from '#shared/manuais'

export type SituacaoImportacao = 'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'

export interface LinhaBrutaManual {
  titulo: string
  mes: string
  ano: string
  descricao: string
  status: string
  dataCriacao: string
  dataPublicacao: string
  destaqueMes: string
  destaqueSemana: string
}

export interface LinhaImportacaoManual extends LinhaBrutaManual {
  situacaoImportacao: SituacaoImportacao
  /** Motivo da situação "invalido" ("" nos demais estados) */
  motivo: string
}

export interface ResultadoPlanilhaManual {
  linhas: LinhaImportacaoManual[]
  /** Mensagem quando o arquivo não pode ser usado; null = ok */
  erro: string | null
}

export const COLUNAS_MODELO = [
  'Título',
  'Mês',
  'Ano',
  'Descrição',
  'Status',
  'Data de Criação',
  'Data de Publicação',
  'Destaque do mês',
  'Destaque da semana'
]

const parseDestaque = (valor: string): boolean => {
  const v = valor.trim().toLowerCase()
  return v === 'sim' || v === 's' || v === 'true' || v === '1' || v === 'x'
}

const pad2 = (valor: string): string => valor.padStart(2, '0')

/** Normaliza `dd/mm/aaaa` (com 1 ou 2 dígitos) para `AAAA-MM-DD`. */
const normalizarData = (valor: string): string => {
  const texto = valor.trim()
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto)
  if (br) return `${br[3]}-${pad2(br[2]!)}-${pad2(br[1]!)}`
  return texto
}

/**
 * Classifica as linhas cruas na ordem inválida -> repetida -> já cadastrada ->
 * pronta. A chave de unicidade é `(ano, mês)`; `data_publicacao` é obrigatória
 * quando o status é `Publicado`.
 */
export function classificarLinhasManuais(
  linhas: LinhaBrutaManual[],
  existentes: Iterable<string>
): LinhaImportacaoManual[] {
  const naBase = new Set([...existentes])
  const vistos = new Set<string>()
  const saida: LinhaImportacaoManual[] = []

  for (const linha of linhas) {
    const titulo = linha.titulo.trim()
    const mes = linha.mes.trim()
    const ano = linha.ano.trim()
    const descricao = linha.descricao.trim()
    const statusBruto = linha.status.trim()
    const status = statusBruto || 'Rascunho'
    const dataCriacao = normalizarData(linha.dataCriacao)
    const dataPublicacao = normalizarData(linha.dataPublicacao)
    const destaqueMesBruto = linha.destaqueMes.trim()
    const destaqueSemanaBruto = linha.destaqueSemana.trim()
    const destaqueMes = parseDestaque(destaqueMesBruto)
    const destaqueSemana = parseDestaque(destaqueSemanaBruto)

    // Linha totalmente vazia não conta
    if (
      !titulo &&
      !mes &&
      !ano &&
      !descricao &&
      !statusBruto &&
      !dataCriacao &&
      !dataPublicacao &&
      !destaqueMesBruto &&
      !destaqueSemanaBruto
    ) {
      continue
    }

    const validacao = validarManual({ titulo, mes, ano: Number(ano) })
    const motivos = Object.values(validacao.erros).filter(Boolean) as string[]

    if (!STATUS_MANUAL.includes(status as (typeof STATUS_MANUAL)[number])) {
      motivos.push('Status inválido')
    }
    if (dataCriacao && !ehDataIso(dataCriacao)) {
      motivos.push('Data de criação inválida')
    }
    if (dataPublicacao && !ehDataIso(dataPublicacao)) {
      motivos.push('Data de publicação inválida')
    }
    if (status === 'Publicado' && !dataPublicacao) {
      motivos.push('Informe a data de publicação para o status Publicado')
    }

    const base: LinhaBrutaManual = {
      titulo,
      mes,
      ano,
      descricao,
      status,
      dataCriacao,
      dataPublicacao,
      destaqueMes: destaqueMes ? 'Sim' : 'Não',
      destaqueSemana: destaqueSemana ? 'Sim' : 'Não'
    }

    if (motivos.length) {
      saida.push({
        ...base,
        situacaoImportacao: 'invalido',
        motivo: [...new Set(motivos)].join('; ')
      })
      continue
    }

    const mesNumero = MESES.indexOf(mes as (typeof MESES)[number]) + 1
    const chave = `${Number(ano)}-${mesNumero}`
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

export const lerPlanilhaManuais = async (
  arquivo: File,
  existentes: Iterable<string>
): Promise<ResultadoPlanilhaManual> => {
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

  const brutas: LinhaBrutaManual[] = []
  for (let r = 2; r <= Worksheet.rowCount; r += 1) {
    const linha = Worksheet.getRow(r)
    const cel = (coluna: string) => linha.getCell(indices[coluna]!)
    brutas.push({
      titulo: textoCelula(cel('Título')),
      mes: textoCelula(cel('Mês')),
      ano: textoCelula(cel('Ano')),
      descricao: textoCelula(cel('Descrição')),
      status: textoCelula(cel('Status')),
      dataCriacao: dataCelula(cel('Data de Criação')),
      dataPublicacao: dataCelula(cel('Data de Publicação')),
      destaqueMes: textoCelula(cel('Destaque do mês')),
      destaqueSemana: textoCelula(cel('Destaque da semana'))
    })
  }

  const linhas = classificarLinhasManuais(brutas, existentes)
  if (!linhas.length) {
    return { linhas: [], erro: 'O arquivo não contém nenhuma linha de dados.' }
  }
  return { linhas, erro: null }
}
