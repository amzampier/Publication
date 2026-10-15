// POST /api/perfis/:id/permissoes/copiar — grava no destino a matriz SALVA da
// origem em transação (200 | 400 sem destino | 404 origem/destino inexistente)
import { buscarPerfil, copiarMatriz, validarId } from '../../../../../utils/perfis'
import { registrarAuditoria } from '../../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const origemId = validarId(getRouterParam(event, 'id'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object' || typeof body.destino_id !== 'string' || !body.destino_id.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Corpo sem o campo destino_id.' })
  }
  const destinoId = validarId(body.destino_id)

  const destino = await copiarMatriz(origemId, destinoId)
  const origem = await buscarPerfil(origemId)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Perfis de Acesso',
    entidadeId: destinoId,
    detalhes: `Copiou a matriz salva do perfil '${origem?.nome ?? origemId}' para '${destino.nome}'`
  })
  return destino
})
