// DELETE /api/perfis/:id — exclusão (200 | 404 | 409 com usuários vinculados)
import { excluirPerfil, validarId } from '../../../utils/perfis'

export default defineEventHandler(async (event) => {
  const id = validarId(getRouterParam(event, 'id'))
  await excluirPerfil(id)
  return { ok: true }
})
