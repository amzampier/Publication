// PUT /api/perfis/:id — edição de nome/descricao/situacao (200 | 400 | 404)
import { atualizarPerfil, validarId } from '../../../utils/perfis'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = validarId(getRouterParam(event, 'id'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const atualizado = await atualizarPerfil(id, {
    nome: body.nome,
    descricao: body.descricao,
    situacao: body.situacao
  })
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Perfis de Acesso',
    entidadeId: id,
    detalhes: `Alterou o perfil '${atualizado.nome}'`
  })
  return atualizado
})
