// POST /api/uploads — multipart: file + pasta (logomarcas|avatares) → { url }
import {
  UPLOAD_DESTINOS,
  UPLOAD_LIMITE_BYTES,
  UPLOAD_MIMES,
  gravarUpload,
  sanitizarNomeArquivo,
  type UploadDestino
} from '../../utils/uploads'

export default defineEventHandler(async (event) => {
  const partes = await readMultipartFormData(event)
  if (!partes || partes.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Requisição sem dados multipart.' })
  }

  const campoPasta = partes.find((p) => p.name === 'pasta' && !p.filename)
  const campoArquivo = partes.find((p) => p.name === 'file' && p.filename && p.data)
  if (!campoArquivo || !campoArquivo.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Campo de arquivo ausente ou vazio.' })
  }

  const destinoTexto = campoPasta ? Buffer.from(campoPasta.data).toString('utf8').trim() : ''
  if (!(UPLOAD_DESTINOS as readonly string[]).includes(destinoTexto)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Destino inválido. Permitidos: ${UPLOAD_DESTINOS.join(', ')}.`
    })
  }

  if (!UPLOAD_MIMES.includes(campoArquivo.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tipo de arquivo não permitido (${campoArquivo.type}). Aceitos: ${UPLOAD_MIMES.join(', ')}.`
    })
  }

  if (campoArquivo.data.length > UPLOAD_LIMITE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Arquivo acima do limite de 5 MB.' })
  }

  const nome = sanitizarNomeArquivo(campoArquivo.filename ?? 'arquivo')
  const url = gravarUpload(destinoTexto as UploadDestino, nome, campoArquivo.data)
  return { url }
})
