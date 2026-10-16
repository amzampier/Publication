// DELETE /api/usuarios/:id — remoção irrestrita (200; 404; sessões caem via CASCADE)
import { buscarUsuarioTelaPorId, excluirUsuario } from '../../../utils/usuarios'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'excluir')
  const id = String(getRouterParam(event, 'id') ?? '')
  const existente = await buscarUsuarioTelaPorId(id)
  await excluirUsuario(id)
  if (existente) {
    await registrarAuditoria(event, {
      acao: 'Exclusão',
      recurso: 'Usuários',
      entidadeId: id,
      detalhes: `Removeu o usuário '${existente.nome}' (${existente.email})`
    })
  }
  return { ok: true }
})
