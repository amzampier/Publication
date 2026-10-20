// GET /api/escopo-projetos/:id/itens — itens do projeto, somente leitura.
import { listarItensEscopo, validarIdEscopo } from '../../../../utils/escopo-projetos'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'visualizar')
  const id = validarIdEscopo(getRouterParam(event, 'id'))
  return await listarItensEscopo(id)
})
