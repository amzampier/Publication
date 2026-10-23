// PUT /api/manuais/:id/arquivar — arquivamento soft (some da listagem).
import { arquivarManual, validarIdManual } from '../../../../utils/manuais'
import { registrarAuditoria } from '../../../../utils/audit'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'arquivar')
  const id = validarIdManual(getRouterParam(event, 'id'))
  const arquivado = await arquivarManual(id)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Manuais Mensais',
    entidadeId: arquivado.id,
    detalhes: `Arquivou o manual '${arquivado.titulo}' (${arquivado.codigo})`
  })
  return arquivado
})