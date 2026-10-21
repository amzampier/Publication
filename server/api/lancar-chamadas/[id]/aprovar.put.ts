import { aprovarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'publicar')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const aprovada = await aprovarChamada(id)
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Lançar as Chamadas',
    entidadeId: aprovada.id,
    detalhes: `Aprovou a chamada '${aprovada.chamada}' (${aprovada.titulo})`
  })
  return aprovada
})
