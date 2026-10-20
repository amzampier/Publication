// PUT /api/escopo-projetos/:id/arquivar — arquivamento soft (arquivada = 1).
import { arquivarEscopo, validarIdEscopo } from '../../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../../utils/audit'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'arquivar')
  const id = validarIdEscopo(getRouterParam(event, 'id'))
  const arquivado = await arquivarEscopo(id)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Escopo de Projetos',
    entidadeId: arquivado.codigo,
    detalhes: `Arquivou o escopo '${arquivado.nome}' (${arquivado.codigo})`
  })
  return arquivado
})
