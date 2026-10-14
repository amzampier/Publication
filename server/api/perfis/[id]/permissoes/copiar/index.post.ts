// POST /api/perfis/:id/permissoes/copiar — grava no destino a matriz SALVA da
// origem em transação (200 | 400 sem destino | 404 origem/destino inexistente)
import { copiarMatriz, validarId } from '../../../../../utils/perfis'

export default defineEventHandler(async (event) => {
  const origemId = validarId(getRouterParam(event, 'id'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object' || typeof body.destino_id !== 'string' || !body.destino_id.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Corpo sem o campo destino_id.' })
  }
  const destinoId = validarId(body.destino_id)

  return await copiarMatriz(origemId, destinoId)
})
