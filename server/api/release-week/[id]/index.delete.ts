// DELETE /api/release-week/:id — exclusão condicionada (arquivada/itens -> 409).
import { buscarReleaseWeek, excluirReleaseWeek, validarIdRelease } from '../../../utils/release-week'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'excluir')
  const id = validarIdRelease(getRouterParam(event, 'id'))
  const existente = await buscarReleaseWeek(id)
  if (!existente) {
    throw createError({ statusCode: 404, statusMessage: 'Release Week não encontrada.' })
  }
  await excluirReleaseWeek(id)
  await registrarAuditoria(event, {
    acao: 'Exclusão',
    recurso: 'Release Week',
    entidadeId: existente.id,
    detalhes: `Excluiu a Release Week '${existente.nome}' (${existente.codigo})`
  })
  return { ok: true }
})