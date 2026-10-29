import {
  IMPACTOS_CHAMADA,
  MAX_TAGS_CHAMADA,
  MAX_TAG_CHAMADA,
  TIPOS_CHAMADA,
  ehDataIso,
  normalizarTagsChamada,
  type CatalogosChamada,
  type ImpactoChamada,
  type LinhaImportacaoChamada,
  type OpcaoChamada,
  type TipoChamada
} from '#shared/lancar-chamadas'

export type SituacaoImportacaoChamada = 'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'

export interface LinhaBrutaChamada {
  chamada: string
  titulo: string
  dataLancamento: string
  dataLiberacao: string
  release: string
  projeto: string
  manual: string
  software: string
  parceiro: string
  modulo: string
  menuFuncionalidade: string
  tipo: string
  impacto: string
  descricaoCompleta: string
  manualTitulo: string
  linkManual: string
  linkVideo: string
  tags: string
}

export interface LinhaImportacaoChamadaPreview extends LinhaImportacaoChamada {
  linha: number
  situacaoImportacao: SituacaoImportacaoChamada
  motivo: string
}

export interface ResultadoPlanilhaChamada {
  linhas: LinhaImportacaoChamadaPreview[]
  erro: string | null
}

export const COLUNAS_MODELO_CHAMADA = [
  'Chamada',
  'Título',
  'Data de Lançamento',
  'Data de Liberação',
  'Release',
  'Projeto',
  'Manual',
  'Software',
  'Parceiro',
  'Módulo',
  'Menu/Funcionalidade',
  'Tipo',
  'Impacto',
  'Descrição Completa',
  'Título do Manual',
  'Link do Manual',
  'Link do Vídeo',
  'Tags'
] as const

const URL_HTTP = /^https?:\/\/\S+$/i

const normalizarData = (valor: string): string => {
  const texto = valor.trim()
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto)
  if (br) {
    return `${br[3]}-${br[2]!.padStart(2, '0')}-${br[1]!.padStart(2, '0')}`
  }
  return texto
}

const canonico = (valor: string, opcoes: readonly string[]): string =>
  opcoes.find((opcao) => opcao.toLowerCase() === valor.trim().toLowerCase()) ?? ''

const mapaOpcoes = (opcoes: OpcaoChamada[]): Map<string, OpcaoChamada> => {
  const mapa = new Map<string, OpcaoChamada>()
  for (const opcao of opcoes) {
    for (const chave of [opcao.id, opcao.sigla, opcao.label]) {
      if (chave) mapa.set(String(chave).trim().toUpperCase(), opcao)
    }
  }
  return mapa
}

const resolverOpcao = (
  mapa: Map<string, OpcaoChamada>,
  codigo: string
): OpcaoChamada | null => {
  const chave = codigo.trim().toUpperCase()
  return chave ? mapa.get(chave) ?? null : null
}

const codigoOpcao = (opcao: OpcaoChamada | null): string =>
  opcao ? String(opcao.sigla ?? opcao.id) : ''

const tagsDaLinha = (valor: string): string[] =>
  normalizarTagsChamada(valor.split(';').map((tag) => tag.trim()).filter(Boolean))

export function classificarLinhasChamadas(
  linhas: LinhaBrutaChamada[],
  existentes: Iterable<string>,
  catalogos: CatalogosChamada
): LinhaImportacaoChamadaPreview[] {
  const naBase = new Set([...existentes].map((chamada) => chamada.trim().toLowerCase()))
  const vistos = new Set<string>()
  const mapaReleases = mapaOpcoes(catalogos.releases)
  const mapaProjetos = mapaOpcoes(catalogos.projetos)
  const mapaManuais = mapaOpcoes(catalogos.manuais)
  const mapaSoftwares = mapaOpcoes(catalogos.softwares)
  const mapaParceiros = mapaOpcoes(catalogos.parceiros)
  const saida: LinhaImportacaoChamadaPreview[] = []

  for (const [indice, bruta] of linhas.entries()) {
    const chamada = bruta.chamada.trim()
    const titulo = bruta.titulo.trim()
    const dataLancamento = normalizarData(bruta.dataLancamento)
    const dataLiberacaoBruta = normalizarData(bruta.dataLiberacao)
    const release = resolverOpcao(mapaReleases, bruta.release)
    const projeto = resolverOpcao(mapaProjetos, bruta.projeto)
    const manual = resolverOpcao(mapaManuais, bruta.manual)
    const codigosSoftware = bruta.software
      .split(';')
      .map((codigo) => codigo.trim())
      .filter(Boolean)
    const softwaresResolvidos = codigosSoftware.map((codigo) =>
      resolverOpcao(mapaSoftwares, codigo)
    )
    const parceiro = resolverOpcao(mapaParceiros, bruta.parceiro)
    const tipo = canonico(bruta.tipo, TIPOS_CHAMADA) as TipoChamada
    const impacto = canonico(bruta.impacto, IMPACTOS_CHAMADA) as ImpactoChamada
    const descricaoCompleta = bruta.descricaoCompleta.trim()
    const manualTitulo = bruta.manualTitulo.trim()
    const linkManual = bruta.linkManual.trim()
    const linkVideo = bruta.linkVideo.trim()
    const tags = tagsDaLinha(bruta.tags)
    const dataLiberacao =
      dataLiberacaoBruta ||
      (release?.dataPublicacao ? normalizarData(release.dataPublicacao) : '') ||
      (manual?.dataPublicacao ? normalizarData(manual.dataPublicacao) : '') ||
      (projeto?.dataPublicacao ? normalizarData(projeto.dataPublicacao) : '')
    const motivos: string[] = []

    if (!chamada) motivos.push('Informe a chamada.')
    else if (chamada.length > 60) motivos.push('A chamada deve ter no máximo 60 caracteres.')
    if (!titulo) motivos.push('Informe o título.')
    else if (titulo.length > 255) motivos.push('O título deve ter no máximo 255 caracteres.')
    if (!dataLancamento) motivos.push('Informe a data de lançamento.')
    else if (!ehDataIso(dataLancamento)) motivos.push('Data de lançamento inválida.')
    if (dataLiberacao && !ehDataIso(dataLiberacao)) motivos.push('Data de liberação inválida.')

    if (!release && bruta.release.trim()) motivos.push('Release não encontrada.')
    if (!projeto && bruta.projeto.trim()) motivos.push('Projeto não encontrado.')
    if (!manual && bruta.manual.trim()) motivos.push('Manual não encontrado.')
    if (codigosSoftware.length && softwaresResolvidos.some((opcao) => !opcao)) {
      motivos.push('Software não encontrado.')
    }
    if (!parceiro && bruta.parceiro.trim()) motivos.push('Parceiro não encontrado.')
    if (!release && !projeto && !manual) motivos.push('Selecione ao menos uma release, projeto ou manual.')
    if (!codigosSoftware.length) motivos.push('Selecione o software.')
    if (!parceiro) motivos.push('Selecione o parceiro.')
    if (!bruta.modulo.trim()) motivos.push('Informe o menu.')
    else if (bruta.modulo.trim().length > 100) motivos.push('O menu deve ter no máximo 100 caracteres.')
    if (!descricaoCompleta) motivos.push('Informe a descrição completa.')
    if (!tipo) motivos.push('Tipo inválido.')
    if (!impacto) motivos.push('Impacto inválido.')
    if (manualTitulo.length > 255) motivos.push('O título do manual deve ter no máximo 255 caracteres.')
    if (linkManual && !URL_HTTP.test(linkManual)) motivos.push('Link do manual inválido.')
    if (linkVideo && !URL_HTTP.test(linkVideo)) motivos.push('Link do vídeo inválido.')
    if (tags.length > MAX_TAGS_CHAMADA) motivos.push(`Informe no máximo ${MAX_TAGS_CHAMADA} tags.`)
    else if (tags.some((tag) => tag.length > MAX_TAG_CHAMADA)) {
      motivos.push(`Cada tag deve ter no máximo ${MAX_TAG_CHAMADA} caracteres.`)
    }

    const base: LinhaImportacaoChamada = {
      chamada,
      titulo,
      dataLancamento,
      dataLiberacao,
      releaseCodigo: codigoOpcao(release),
      projetoCodigo: codigoOpcao(projeto),
      manualCodigo: codigoOpcao(manual),
      softwareCodigos: softwaresResolvidos
        .map((opcao) => codigoOpcao(opcao))
        .filter(Boolean),
      parceiroCodigo: codigoOpcao(parceiro),
      modulo: bruta.modulo.trim(),
      menuFuncionalidade: bruta.menuFuncionalidade.trim(),
      tipo,
      impacto,
      descricaoCompleta,
      manualTitulo,
      linkManual,
      linkVideo,
      tags
    }
    const linha = indice + 2

    if (motivos.length > 0) {
      saida.push({
        ...base,
        linha,
        situacaoImportacao: 'invalido',
        motivo: [...new Set(motivos)].join(' ')
      })
      continue
    }

    const chave = chamada.toLowerCase()
    if (vistos.has(chave)) {
      saida.push({ ...base, linha, situacaoImportacao: 'repetido', motivo: '' })
      continue
    }
    vistos.add(chave)

    saida.push({
      ...base,
      linha,
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

const dataCelula = (celula: unknown): string => {
  const valor = (celula as { value?: unknown } | null)?.value
  if (valor instanceof Date) return isoData(valor)
  return normalizarData(textoCelula(celula))
}

const linhaVazia = (linha: LinhaBrutaChamada): boolean =>
  Object.values(linha).every((valor) => !String(valor).trim())

export const lerPlanilhaLancarChamadas = async (
  arquivo: File,
  existentes: Iterable<string>,
  catalogos: CatalogosChamada
): Promise<ResultadoPlanilhaChamada> => {
  let worksheet: any
  try {
    const modulo = (await import('exceljs')) as any
    const ExcelJS = modulo.Workbook ? modulo : modulo.default
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await arquivo.arrayBuffer())
    worksheet = workbook.worksheets[0]
    if (!worksheet) return { linhas: [], erro: 'Não foi possível ler o arquivo.' }
  } catch {
    return { linhas: [], erro: 'Não foi possível ler o arquivo. Use um .xlsx válido.' }
  }

  const indices: Record<string, number> = {}
  worksheet.getRow(1).eachCell(
    { includeEmpty: false },
    (celula: unknown, numero: number) => {
      const rotulo = textoCelula(celula).toLowerCase()
      const esperado = COLUNAS_MODELO_CHAMADA.find((coluna) => coluna.toLowerCase() === rotulo)
      if (esperado && indices[esperado] === undefined) indices[esperado] = numero
    }
  )
  const faltando = COLUNAS_MODELO_CHAMADA.filter((coluna) => indices[coluna] === undefined)
  if (faltando.length > 0) {
    return {
      linhas: [],
      erro: `O arquivo não corresponde ao modelo. Colunas ausentes: ${faltando.join(', ')}.`
    }
  }

  const brutas: LinhaBrutaChamada[] = []
  for (let numero = 2; numero <= worksheet.rowCount; numero += 1) {
    const row = worksheet.getRow(numero)
    const cel = (coluna: string) => row.getCell(indices[coluna]!)
    const bruta: LinhaBrutaChamada = {
      chamada: textoCelula(cel('Chamada')),
      titulo: textoCelula(cel('Título')),
      dataLancamento: dataCelula(cel('Data de Lançamento')),
      dataLiberacao: dataCelula(cel('Data de Liberação')),
      release: textoCelula(cel('Release')),
      projeto: textoCelula(cel('Projeto')),
      manual: textoCelula(cel('Manual')),
      software: textoCelula(cel('Software')),
      parceiro: textoCelula(cel('Parceiro')),
      modulo: textoCelula(cel('Módulo')),
      menuFuncionalidade: textoCelula(cel('Menu/Funcionalidade')),
      tipo: textoCelula(cel('Tipo')),
      impacto: textoCelula(cel('Impacto')),
      descricaoCompleta: textoCelula(cel('Descrição Completa')),
      manualTitulo: textoCelula(cel('Título do Manual')),
      linkManual: textoCelula(cel('Link do Manual')),
      linkVideo: textoCelula(cel('Link do Vídeo')),
      tags: textoCelula(cel('Tags'))
    }
    if (!linhaVazia(bruta)) brutas.push(bruta)
  }

  if (brutas.length === 0) {
    return { linhas: [], erro: 'O arquivo não contém nenhuma linha de dados.' }
  }

  return { linhas: classificarLinhasChamadas(brutas, existentes, catalogos), erro: null }
}
