// PUT /api/perfis/:id — edição de nome/descricao/situacao (200 | 400 | 404)
import { atualizarPerfil, validarId } from '../../../utils/perfis'

export default defineEventHandler(async (event) => {
  const id = validarId(getRouterParam(event, 'id'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  return await atualizarPerfil(id, {
    nome: body.nome,
    descricao: body.descricao,
    situacao: body.situacao
  })
})
