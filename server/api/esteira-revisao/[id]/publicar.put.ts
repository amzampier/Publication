// PUT /api/esteira-revisao/:id/publicar — publica um item homologado (publicar).
import { createError } from 'h3'
import { requirePermission } from '../../../utils/permission'
import { getSessionUser } from '../../../utils/auth'
import { publicarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'esteira-revisao', 'publicar')
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const corpo = (await readBody(event).catch(() => ({}))) as { parecer?: unknown }
  const publicada = await publicarChamada(
    id,
    { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil },
    { parecer: typeof corpo?.parecer === 'string' ? corpo.parecer : undefined }
  )
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Esteira de Revisão',
    entidadeId: publicada.id,
    detalhes: `Publicou a chamada '${publicada.chamada}' (${publicada.titulo}) na esteira`
  })
  return publicada
})
