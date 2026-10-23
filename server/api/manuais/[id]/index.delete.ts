// DELETE /api/manuais/:id — exclusão condicionada (arquivado/itens/anexos -> 409).
import { buscarManual, excluirManual, validarIdManual } from '../../../utils/manuais'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'excluir')
  const id = validarIdManual(getRouterParam(event, 'id'))
  const existente = await buscarManual(id)
  if (!existente) {
    throw createError({ statusCode: 404, statusMessage: 'Manual não encontrado.' })
  }
  await excluirManual(id)
  await registrarAuditoria(event, {
    acao: 'Exclusão',
    recurso: 'Manuais Mensais',
    entidadeId: existente.id,
    detalhes: `Excluiu o manual '${existente.titulo}' (${existente.codigo})`
  })
  return { ok: true }
})