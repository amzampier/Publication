// DELETE /api/escopo-projetos/:id — exclusão condicionada (itens -> 409).
import { buscarEscopo, excluirEscopo, validarIdEscopo } from '../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'excluir')
  const id = validarIdEscopo(getRouterParam(event, 'id'))
  const existente = await buscarEscopo(id)
  if (!existente) {
    throw createError({ statusCode: 404, statusMessage: 'Escopo não encontrado.' })
  }
  await excluirEscopo(id)
  await registrarAuditoria(event, {
    acao: 'Exclusão',
    recurso: 'Escopo de Projetos',
    entidadeId: existente.id,
    detalhes: `Excluiu o escopo '${existente.nome}' (${existente.codigo})`
  })
  return { ok: true }
})