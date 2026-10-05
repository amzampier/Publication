// Parser da planilha de importação de usuários — modelo oficial em
// docs/modelos/modelo-importacao-usuarios.xlsx (cabeçalho: Nome, E-mail, Perfil,
// Status). Regras do design D4/D5 da change modal-importacao-usuarios:
// exceljs via import() dinâmico (bundle só carrega no uso), cabeçalho com trim e
// sem distinção de maiúsculas, linhas vazias ignoradas, e-mail case-insensitive e
// classificação na ordem inválida -> repetida -> já cadastrada -> pronta.
import { PERFIS, STATUSES } from './useUsuariosDemo'

export type SituacaoImportacao = 'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'

export interface LinhaImportacao {
  nome: string
  email: string
  perfil: string
  status: string
  situacao: SituacaoImportacao
  /** Motivo da situação "invalido" ("" nos demais estados) */
  motivo: string
}

export interface ResultadoPlanilha {
  linhas: LinhaImportacao[]
  /** Mensagem quando o arquivo não pode ser usado (leitura/cabeçalho); null = ok */
  erro: string | null
}

export const COLUNAS_MODELO = ['Nome', 'E-mail', 'Perfil', 'Status']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

export const lerPlanilhaUsuarios = async (
  arquivo: File,
  emailsNaBase: Iterable<string>
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

  const naBase = new Set([...emailsNaBase].map((e) => e.trim().toLowerCase()))
  const vistos = new Set<string>()
  const linhas: LinhaImportacao[] = []

  for (let r = 2; r <= Worksheet.rowCount; r++) {
    const linha = Worksheet.getRow(r)
    const nome = textoCelula(linha.getCell(indices['Nome']))
    const email = textoCelula(linha.getCell(indices['E-mail']))
    const perfil = textoCelula(linha.getCell(indices['Perfil']))
    const status = textoCelula(linha.getCell(indices['Status']))

    // Linha totalmente vazia não conta
    if (!nome && !email && !perfil && !status) continue

    const motivos: string[] = []
    if (!nome) motivos.push('Nome ausente')
    if (!email) motivos.push('E-mail ausente')
    else if (!EMAIL_RE.test(email)) motivos.push('E-mail malformado')
    if (!PERFIS.includes(perfil as any)) motivos.push('Perfil inválido')
    if (!STATUSES.includes(status as any)) motivos.push('Status inválido')

    if (motivos.length) {
      linhas.push({ nome, email, perfil, status, situacao: 'invalido', motivo: motivos.join('; ') })
      continue
    }

    const chave = email.toLowerCase()
    if (vistos.has(chave)) {
      linhas.push({ nome, email, perfil, status, situacao: 'repetido', motivo: '' })
      continue
    }
    vistos.add(chave)
    const situacao = naBase.has(chave) ? 'ja-cadastrado' : 'pronto'
    linhas.push({ nome, email, perfil, status, situacao, motivo: '' })
  }

  if (!linhas.length) {
    return { linhas: [], erro: 'O arquivo não contém nenhuma linha de dados.' }
  }
  return { linhas, erro: null }
}
