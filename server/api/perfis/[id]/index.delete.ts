// DELETE /api/perfis/:id — exclusão (200 | 404 | 409 com usuários vinculados)
import { buscarPerfil, excluirPerfil, validarId } from '../../../utils/perfis'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'perfis-acesso', 'excluir')
  const id = validarId(getRouterParam(event, 'id'))
  const existente = await buscarPerfil(id)
  await excluirPerfil(id)
  if (existente) {
    await registrarAuditoria(event, {
      acao: 'Exclusão',
      recurso: 'Perfis de Acesso',
      entidadeId: id,
      detalhes: `Removeu o perfil '${existente.nome}'`
    })
  }
  return { ok: true }
})
