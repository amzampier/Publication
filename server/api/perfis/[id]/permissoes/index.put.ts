// PUT /api/perfis/:id/permissoes — substitui a matriz inteira em transação
// (200 | 400 módulo/ação desconhecido | 404 perfil inexistente)
import { buscarPerfil, salvarMatriz, validarId } from '../../../../utils/perfis'
import { registrarAuditoria } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = validarId(getRouterParam(event, 'id'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object' || !('permissoes' in body)) {
    throw createError({ statusCode: 400, statusMessage: 'Corpo sem o campo permissoes.' })
  }

  const atualizado = await salvarMatriz(id, body.permissoes)
  const perfil = await buscarPerfil(id)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Perfis de Acesso',
    entidadeId: id,
    detalhes: `Gravou a matriz de permissões do perfil '${perfil?.nome ?? id}'`
  })
  return atualizado
})
