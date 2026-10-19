// PUT /api/release-week/:id/arquivar — arquivamento soft (some da listagem).
import { arquivarReleaseWeek, validarIdRelease } from '../../../../utils/release-week'
import { registrarAuditoria } from '../../../../utils/audit'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'arquivar')
  const id = validarIdRelease(getRouterParam(event, 'id'))
  const arquivada = await arquivarReleaseWeek(id)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Release Week',
    entidadeId: arquivada.codigo,
    detalhes: `Arquivou a Release Week '${arquivada.nome}' (${arquivada.codigo})`
  })
  return arquivada
})
