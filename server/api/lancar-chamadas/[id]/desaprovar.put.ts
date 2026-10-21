import { desaprovarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'alterar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const desaprovada = await desaprovarChamada(id)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Lançar as Chamadas',
    entidadeId: desaprovada.id,
    detalhes: `Desaprovou a chamada '${desaprovada.chamada}' (${desaprovada.titulo})`
  })
  return desaprovada
})
