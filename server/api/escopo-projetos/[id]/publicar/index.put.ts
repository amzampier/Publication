// PUT /api/escopo-projetos/:id/publicar — status Publicado + data atual.
import { publicarEscopo, validarIdEscopo } from '../../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../../utils/audit'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'publicar')
  const id = validarIdEscopo(getRouterParam(event, 'id'))
  const publicado = await publicarEscopo(id)
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Escopo de Projetos',
    entidadeId: publicado.codigo,
    detalhes: `Publicou o escopo '${publicado.nome}' (${publicado.codigo})`
  })
  return publicado
})
