// POST /api/uploads — multipart: file + pasta (logomarcas|avatares) → { url }
import {
  UPLOAD_DESTINOS,
  UPLOAD_LIMITE_BYTES,
  UPLOAD_MIMES,
  ehImagemReal,
  gravarUpload,
  sanitizarNomeArquivo,
  type UploadDestino
} from '../../utils/uploads'
import { registrarAuditoria } from '../../utils/audit'
import { requirePermission } from '../../utils/permission'

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

  // Logomarcas alimentam as Configurações Globais (RBAC); avatares são o
  // retrato do próprio perfil (autoatendimento, só sessão — D3 do design).
  if (destinoTexto === 'logomarcas') {
    await requirePermission(event, 'configuracoes-globais', 'alterar')
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

  // Conteúdo real (magic bytes) — RL02 A-02: impede armazenar HTML/SVG
  // disfarçados de imagem e servidos na mesma origem.
  if (!ehImagemReal(campoArquivo.data)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O conteúdo do arquivo não é uma imagem válida (PNG, JPEG, WebP ou GIF).'
    })
  }

  const nome = sanitizarNomeArquivo(campoArquivo.filename ?? 'arquivo')
  const url = await gravarUpload(destinoTexto as UploadDestino, nome, campoArquivo.data)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: destinoTexto === 'logomarcas' ? 'Logomarcas' : 'Avatares',
    detalhes: `Enviou o arquivo '${nome}' para '${destinoTexto}'`
  })
  return { url }
})
