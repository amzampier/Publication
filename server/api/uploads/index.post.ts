// POST /api/uploads — multipart: file + pasta (logomarcas|avatares|logos|chamadas) → { url }
import {
  UPLOAD_DESTINOS,
  UPLOAD_LIMITE_BYTES,
  UPLOAD_MIMES,
  detectarTipoImagem,
  gravarUpload,
  sanitizarNomeArquivo,
  type UploadDestino
} from '../../utils/uploads'
import { registrarAuditoria } from '../../utils/audit'
import { pode, requirePermission } from '../../utils/permission'
import { exigirRateLimit } from '../../utils/rateLimit'

const ehDestino = (valor: string): valor is UploadDestino =>
  (UPLOAD_DESTINOS as readonly string[]).includes(valor)

const autorizarDestino = async (event: any, destino: UploadDestino): Promise<void> => {
  if (destino === 'chamadas') {
    const podeCriar = await pode(event, 'lancar-chamadas', 'criar')
    const podeAlterar = await pode(event, 'lancar-chamadas', 'alterar')
    if (!podeCriar && !podeAlterar) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Você não tem permissão para enviar imagens de chamadas.'
      })
    }
    return
  }
  if (destino === 'logomarcas') {
    await requirePermission(event, 'configuracoes-globais', 'alterar')
  }
  if (destino === 'logos') {
    await requirePermission(event, 'parceiros', 'alterar')
  }
}

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  // Limite de corpo antes do parse (RL05-M-02/RL06-M-06). O limite de 5 MB é do
  // arquivo; a folga abaixo cobre o overhead do envelope multipart. Requisições
  // chunked sem Content-Length são recusadas para não bufferizar sem teto.
  const transferEncoding = String(getRequestHeader(event, 'transfer-encoding') || '').toLowerCase()
  const tamanhoDeclarado = Number(getRequestHeader(event, 'content-length') || 0)
  if (!tamanhoDeclarado && transferEncoding.includes('chunked')) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Envie o upload com Content-Length; o limite de 5 MB não pode ser aplicado a chunked.'
    })
  }
  if (tamanhoDeclarado > UPLOAD_LIMITE_BYTES + 1024 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Requisição acima do limite de upload (5 MB).'
    })
  }

  // A aplicação envia `pasta` (e ano/mês de chamadas) na query para que a
  // autorização ocorra ANTES de consumir o multipart. O campo no corpo continua
  // aceito para compatibilidade, mas a checagem prévia é obrigatória na query.
  const consulta = getQuery(event)
  const destinoQuery = String(consulta.pasta ?? '').trim()
  if (destinoQuery && !ehDestino(destinoQuery)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Destino inválido. Permitidos: ${UPLOAD_DESTINOS.join(', ')}.`
    })
  }
  if (destinoQuery && ehDestino(destinoQuery)) {
    await autorizarDestino(event, destinoQuery)
  }

  const partes = await readMultipartFormData(event)
  if (!partes || partes.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Requisição sem dados multipart.' })
  }

  const campoPasta = partes.find((p) => p.name === 'pasta' && !p.filename)
  const campoArquivo = partes.find((p) => p.name === 'file' && p.filename && p.data)
  if (!campoArquivo || !campoArquivo.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Campo de arquivo ausente ou vazio.' })
  }

  const destinoTexto = destinoQuery || (campoPasta ? Buffer.from(campoPasta.data).toString('utf8').trim() : '')
  if (!ehDestino(destinoTexto)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Destino inválido. Permitidos: ${UPLOAD_DESTINOS.join(', ')}.`
    })
  }

  if (!destinoQuery) {
    await autorizarDestino(event, destinoTexto)
  }

  const campoTexto = (nome: string): string => {
    const campo = partes.find((p) => p.name === nome && !p.filename)
    return campo ? Buffer.from(campo.data).toString('utf8').trim() : ''
  }

  let subpastas: string[] = []
  if (destinoTexto === 'chamadas') {
    const ano = String(consulta.ano ?? campoTexto('ano'))
    const mes = String(consulta.mes ?? campoTexto('mes'))
    if (!/^\d{4}$/.test(ano) || !/^(0[1-9]|1[0-2])$/.test(mes)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Informe ano (AAAA) e mês (01-12) válidos para o upload de chamadas.'
      })
    }
    subpastas = [ano, mes]
  }

  if (!UPLOAD_MIMES.includes(campoArquivo.type ?? '')) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tipo de arquivo não permitido (${campoArquivo.type}). Aceitos: ${UPLOAD_MIMES.join(', ')}.`
    })
  }

  if (campoArquivo.data.length > UPLOAD_LIMITE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Arquivo acima do limite de 5 MB.' })
  }

  const tipo = detectarTipoImagem(campoArquivo.data)
  if (!tipo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O conteúdo do arquivo não é uma imagem válida (PNG, JPEG, WebP ou GIF).'
    })
  }

  const nome = sanitizarNomeArquivo(campoArquivo.filename ?? 'arquivo')
  const url = await gravarUpload(
    destinoTexto,
    nome,
    campoArquivo.data,
    tipo,
    subpastas
  )
  const recursoUpload: Record<string, string> = {
    logomarcas: 'Logomarcas',
    avatares: 'Avatares',
    logos: 'Parceiros',
    chamadas: 'Lançar as Chamadas'
  }
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: recursoUpload[destinoTexto] ?? destinoTexto,
    detalhes: `Enviou o arquivo '${nome}' para '${destinoTexto}'`
  })
  return { url }
})