// POST /api/uploads — multipart: file + pasta (logomarcas|avatares) → { url }
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
import { requirePermission } from '../../utils/permission'
import { exigirRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)
  // RL05-M-02: recusa antes de bufferizar o multipart. O limite de 5 MB é do
  // arquivo; a folga abaixo cobre o overhead do envelope multipart.
  const tamanhoDeclarado = Number(getRequestHeader(event, 'content-length') || 0)
  if (tamanhoDeclarado > UPLOAD_LIMITE_BYTES + 1024 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Requisição acima do limite de upload (5 MB).'
    })
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

  if (!UPLOAD_MIMES.includes(campoArquivo.type ?? '')) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tipo de arquivo não permitido (${campoArquivo.type}). Aceitos: ${UPLOAD_MIMES.join(', ')}.`
    })
  }

  if (campoArquivo.data.length > UPLOAD_LIMITE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Arquivo acima do limite de 5 MB.' })
  }

  // Conteúdo real (magic bytes) — RL04-C-01: o tipo canônico detectado governa a
  // extensão final do arquivo (nunca a extensão enviada pelo cliente), de modo que
  // HTML/JS disfarçados de imagem nunca sejam gravados/servidos como documento.
  const tipo = detectarTipoImagem(campoArquivo.data)
  if (!tipo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O conteúdo do arquivo não é uma imagem válida (PNG, JPEG, WebP ou GIF).'
    })
  }

  const nome = sanitizarNomeArquivo(campoArquivo.filename ?? 'arquivo')
  const url = await gravarUpload(destinoTexto as UploadDestino, nome, campoArquivo.data, tipo)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: destinoTexto === 'logomarcas' ? 'Logomarcas' : 'Avatares',
    detalhes: `Enviou o arquivo '${nome}' para '${destinoTexto}'`
  })
  return { url }
})