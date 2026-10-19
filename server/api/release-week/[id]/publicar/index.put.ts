// PUT /api/release-week/:id/publicar — status Publicado + data_aprovacao.
import { publicarReleaseWeek, validarIdRelease } from '../../../../utils/release-week'
import { registrarAuditoria } from '../../../../utils/audit'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'publicar')
  const id = validarIdRelease(getRouterParam(event, 'id'))
  const publicado = await publicarReleaseWeek(id)
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Release Week',
    entidadeId: publicado.codigo,
    detalhes: `Publicou a Release Week '${publicado.nome}' (${publicado.codigo})`
  })
  return publicado
})
