import { recusarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'alterar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const recusada = await recusarChamada(id)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Lançar as Chamadas',
    entidadeId: recusada.id,
    detalhes: `Recusou a chamada '${recusada.chamada}' (${recusada.titulo})`
  })
  return recusada
})
