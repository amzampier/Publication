import { excluirChamada, removerImagensChamadas, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'excluir')
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const excluida = await excluirChamada(id)
  await registrarAuditoria(event, {
    acao: 'Exclusão',
    recurso: 'Lançar as Chamadas',
    entidadeId: excluida.id,
    detalhes: `Removeu a chamada '${excluida.chamada}' (${excluida.titulo})`
  })
  await removerImagensChamadas(excluida.imagens, id)
  return { ok: true }
})
