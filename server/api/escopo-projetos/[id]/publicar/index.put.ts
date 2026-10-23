// PUT /api/escopo-projetos/:id/publicar — status Publicado + data atual.
import { publicarEscopo, validarIdEscopo } from '../../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../../utils/audit'
import { getSessionUser } from '../../../../utils/auth'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'publicar')
  const id = validarIdEscopo(getRouterParam(event, 'id'))
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  const publicado = await publicarEscopo(id, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Escopo de Projetos',
    entidadeId: publicado.codigo,
    detalhes: `Publicou o escopo '${publicado.nome}' (${publicado.codigo}); ${publicado.chamadasPublicadas} chamada(s) publicada(s) em cascata`
  })
  return publicado
})
