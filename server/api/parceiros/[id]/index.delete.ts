// DELETE /api/parceiros/:id — exclusão (200 | 404 | 409 com entregas vinculadas)
import { buscarParceiro, excluirParceiro } from '../../../utils/parceiros'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'parceiros', 'excluir')
  const id = (getRouterParam(event, 'id') ?? '').trim()
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Parceiro não encontrado.' })

  const existente = await buscarParceiro(id)
  await excluirParceiro(id)
  if (existente) {
    await registrarAuditoria(event, {
      acao: 'Exclusão',
      recurso: 'Parceiros',
      entidadeId: id,
      detalhes: `Removeu o parceiro '${existente.razao_social}' (${existente.codigo})`
    })
  }
  return { ok: true }
})
