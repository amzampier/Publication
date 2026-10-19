// DELETE /api/release-week/:id — exclusão (200 | 404 | 409 quando arquivada
// ou com itens vinculados).
import { buscarReleaseWeek, excluirReleaseWeek, validarIdRelease } from '../../../utils/release-week'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'excluir')
  const id = validarIdRelease(getRouterParam(event, 'id'))
  const existente = await buscarReleaseWeek(id)
  await excluirReleaseWeek(id)
  if (existente) {
    await registrarAuditoria(event, {
      acao: 'Exclusão',
      recurso: 'Release Week',
      entidadeId: existente.codigo,
      detalhes: `Removeu a Release Week '${existente.nome}' (${existente.codigo})`
    })
  }
  return { ok: true }
})
