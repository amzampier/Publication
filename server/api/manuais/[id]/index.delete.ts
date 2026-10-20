// DELETE /api/manuais/:id — exclusão (200 | 404 | 409 quando arquivado ou
// com itens/anexos vinculados).
import { buscarManual, excluirManual, validarIdManual } from '../../../utils/manuais'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'excluir')
  const id = validarIdManual(getRouterParam(event, 'id'))
  const existente = await buscarManual(id)
  await excluirManual(id)
  if (existente) {
    await registrarAuditoria(event, {
      acao: 'Exclusão',
      recurso: 'Manuais Mensais',
      entidadeId: existente.codigo,
      detalhes: `Removeu o manual '${existente.titulo}' (${existente.codigo})`
    })
  }
  return { ok: true }
})
