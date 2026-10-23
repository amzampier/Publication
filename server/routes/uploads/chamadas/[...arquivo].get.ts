// GET /uploads/chamadas/<ano>/<mes>/<arquivo>
// Mídia de chamada NÃO é ativo estático público (RL06-C-01). A rota serve para:
// - sessão com `lancar-chamadas`/`visualizar` (pré-visualização administrativa);
// - anônimo, somente chamada `Publicado` com ao menos um pai Publicado e não arquivado.
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { createError, sendStream, setResponseHeader } from 'h3'
import { getSessionUser } from '../../../utils/auth'
import { query } from '../../../utils/db'
import { pode } from '../../../utils/permission'
import { uploadsDir } from '../../../utils/uploads'
import { sqlVinculoPublicado } from '../../../utils/visibilidade-publica'

const MIME_POR_EXTENSAO: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
}

const NAO_ENCONTRADO = () =>
  createError({ statusCode: 404, statusMessage: 'Mídia não encontrada.' })

export default defineEventHandler(async (event) => {
  const bruto = String(getRouterParam(event, 'arquivo') ?? '')
  const relativo = bruto.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!/^\d{4}\/(0[1-9]|1[0-2])\/[A-Za-z0-9._-]+$/.test(relativo)) {
    throw NAO_ENCONTRADO()
  }

  const raiz = join(uploadsDir(), 'chamadas')
  const caminho = resolve(raiz, relativo)
  if (!caminho.startsWith(raiz + sep)) {
    throw NAO_ENCONTRADO()
  }

  let info: Awaited<ReturnType<typeof stat>>
  try {
    info = await stat(caminho)
  } catch {
    throw NAO_ENCONTRADO()
  }
  if (!info.isFile()) throw NAO_ENCONTRADO()

  const sessao = await getSessionUser(event)
  let autorizado = false
  if (sessao) {
    autorizado = await pode(event, 'lancar-chamadas', 'visualizar')
  }

  if (!autorizado) {
    const url = `/uploads/chamadas/${relativo}`
    const urlBase = relativo.endsWith('-320.webp')
      ? `/uploads/chamadas/${relativo.replace(/-320\.webp$/i, '')}`
      : null
    const linhas = await query<Array<{ ok: number }>>(
      `SELECT 1 AS ok
         FROM anexos_midias a
         JOIN entregas_itens e ON e.id = a.entrega_item_id
        WHERE (${urlBase ? "a.url_arquivo LIKE CONCAT(?, '.%')" : 'a.url_arquivo = ?'})
          AND e.status = 'Publicado'
          AND (e.data_liberacao IS NULL OR e.data_liberacao <= CURDATE())
          AND ${sqlVinculoPublicado('e')}
          AND (
            EXISTS (SELECT 1 FROM release_week r
                     WHERE r.id = e.release_id AND r.status = 'Publicado'
                       AND r.arquivada = 0
                       AND (r.data_publicacao IS NULL OR r.data_publicacao <= CURDATE()))
            OR EXISTS (SELECT 1 FROM manuais_mensal m
                        WHERE m.id = e.manual_id AND m.status = 'Publicado'
                          AND m.arquivada = 0
                          AND (m.data_publicacao IS NULL OR m.data_publicacao <= CURDATE()))
            OR EXISTS (SELECT 1 FROM projetos_escopo p
                        WHERE p.id = e.projeto_id AND p.status = 'Publicado'
                          AND p.arquivada = 0
                          AND (p.data_publicacao IS NULL OR p.data_publicacao <= CURDATE()))
          )
        LIMIT 1`,
      [urlBase ?? url]
    )
    autorizado = linhas.length > 0
  }

  if (!autorizado) throw NAO_ENCONTRADO()

  const extensao = relativo.slice(relativo.lastIndexOf('.')).toLowerCase()
  setResponseHeader(event, 'Content-Type', MIME_POR_EXTENSAO[extensao] ?? 'application/octet-stream')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'Content-Security-Policy', "default-src 'none'; sandbox")
  setResponseHeader(
    event,
    'Cache-Control',
    sessao ? 'private, max-age=0' : 'public, max-age=3600'
  )
  return sendStream(event, createReadStream(caminho))
})