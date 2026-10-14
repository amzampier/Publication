// DELETE /api/usuarios/:id — remoção irrestrita (200; 404; sessões caem via CASCADE)
import { excluirUsuario } from '../../../utils/usuarios'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  await excluirUsuario(id)
  return { ok: true }
})
