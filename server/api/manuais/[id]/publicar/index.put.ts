// PUT /api/manuais/:id/publicar — status Publicado + data_publicacao.
import { publicarManual, validarIdManual } from '../../../../utils/manuais'
import { registrarAuditoria } from '../../../../utils/audit'
import { getSessionUser } from '../../../../utils/auth'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'publicar')
  const id = validarIdManual(getRouterParam(event, 'id'))
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  const publicado = await publicarManual(id, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Manuais Mensais',
    entidadeId: publicado.id,
    detalhes: `Publicou o manual '${publicado.titulo}' (${publicado.codigo}); ${publicado.chamadasPublicadas} chamada(s) publicada(s) em cascata`
  })
  return publicado
})