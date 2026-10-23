// PUT /api/release-week/:id/publicar — status Publicado + data_aprovacao.
import { publicarReleaseWeek, validarIdRelease } from '../../../../utils/release-week'
import { registrarAuditoria } from '../../../../utils/audit'
import { getSessionUser } from '../../../../utils/auth'
import { requirePermission } from '../../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'publicar')
  const id = validarIdRelease(getRouterParam(event, 'id'))
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  const publicado = await publicarReleaseWeek(id, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Release Week',
    entidadeId: publicado.id,
    detalhes: `Publicou a Release Week '${publicado.nome}' (${publicado.codigo}); ${publicado.chamadasPublicadas} chamada(s) publicada(s) em cascata`
  })
  return publicado
})