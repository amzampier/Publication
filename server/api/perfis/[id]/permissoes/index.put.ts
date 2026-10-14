// PUT /api/perfis/:id/permissoes — substitui a matriz inteira em transação
// (200 | 400 módulo/ação desconhecido | 404 perfil inexistente)
import { salvarMatriz, validarId } from '../../../../utils/perfis'

export default defineEventHandler(async (event) => {
  const id = validarId(getRouterParam(event, 'id'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object' || !('permissoes' in body)) {
    throw createError({ statusCode: 400, statusMessage: 'Corpo sem o campo permissoes.' })
  }

  return await salvarMatriz(id, body.permissoes)
})
