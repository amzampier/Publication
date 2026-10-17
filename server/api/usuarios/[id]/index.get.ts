// GET /api/usuarios/:id — detalhe completo de um usuário (RL04 B-23): a listagem
// projeta só as colunas exibidas e o modal de edição busca o registro por id.
import { buscarUsuarioTelaPorId } from '../../../utils/usuarios'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'visualizar')
  const id = String(getRouterParam(event, 'id') ?? '')
  const usuario = await buscarUsuarioTelaPorId(id)
  if (!usuario) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
  }
  return usuario
})