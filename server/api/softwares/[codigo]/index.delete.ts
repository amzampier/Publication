// DELETE /api/softwares/:codigo — exclusão (200 | 404 | 409 com entregas vinculadas)
import { buscarSoftware, excluirSoftware, validarCodigo } from '../../../utils/softwares'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'softwares', 'excluir')
  const codigo = validarCodigo(getRouterParam(event, 'codigo'))
  const existente = await buscarSoftware(codigo)
  await excluirSoftware(codigo)
  if (existente) {
    await registrarAuditoria(event, {
      acao: 'Exclusão',
      recurso: 'Softwares',
      entidadeId: codigo,
      detalhes: `Removeu o software '${existente.descricao}' (${codigo})`
    })
  }
  return { ok: true }
})
