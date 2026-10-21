import {
  atualizarChamada,
  buscarChamada,
  removerImagensChamadas,
  validarIdChamada
} from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'alterar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const antes = await buscarChamada(id)
  if (!antes) throw createError({ statusCode: 404, statusMessage: 'Chamada não encontrada.' })

  const atualizada = await atualizarChamada(id, body)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Lançar as Chamadas',
    entidadeId: atualizada.id,
    detalhes: `Alterou a chamada '${atualizada.chamada}' (${atualizada.titulo})`
  })

  const removidas = antes.imagens.filter((url) => !atualizada.imagens.includes(url))
  await removerImagensChamadas(removidas, id)
  return atualizada
})
