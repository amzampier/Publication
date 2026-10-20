// PUT /api/manuais/:id/publicar — status Publicado + data_publicacao
// (preserva a data histórica quando já existir).
import { publicarManual, validarIdManual } from '../../../../utils/manuais'
import { registrarAuditoria } from '../../../../utils/audit'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'publicar')
  const id = validarIdManual(getRouterParam(event, 'id'))
  const publicado = await publicarManual(id)
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Manuais Mensais',
    entidadeId: publicado.codigo,
    detalhes: `Publicou o manual '${publicado.titulo}' (${publicado.codigo})`
  })
  return publicado
})
