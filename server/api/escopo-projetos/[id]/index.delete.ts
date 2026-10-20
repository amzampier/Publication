// DELETE /api/escopo-projetos/:id — exclusão (200 | 404 | 409 quando arquivado
// ou com itens vinculados).
import { buscarEscopo, excluirEscopo, validarIdEscopo } from '../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'excluir')
  const id = validarIdEscopo(getRouterParam(event, 'id'))
  const existente = await buscarEscopo(id)
  await excluirEscopo(id)
  if (existente) {
    await registrarAuditoria(event, {
      acao: 'Exclusão',
      recurso: 'Escopo de Projetos',
      entidadeId: existente.codigo,
      detalhes: `Removeu o escopo '${existente.nome}' (${existente.codigo})`
    })
  }
  return { ok: true }
})
