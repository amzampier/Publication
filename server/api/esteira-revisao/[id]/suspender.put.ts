// PUT /api/esteira-revisao/:id/suspender — volta o item publicado para Aprovado (publicar).
import { createError } from 'h3'
import { requirePermission } from '../../../utils/permission'
import { getSessionUser } from '../../../utils/auth'
import { suspenderChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'esteira-revisao', 'publicar')
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const corpo = (await readBody(event).catch(() => ({}))) as { parecer?: unknown }
  const suspensa = await suspenderChamada(
    id,
    { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil },
    { parecer: typeof corpo?.parecer === 'string' ? corpo.parecer : undefined }
  )
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Esteira de Revisão',
    entidadeId: suspensa.id,
    detalhes: `Suspendeu a chamada '${suspensa.chamada}' (${suspensa.titulo}) para homologação na esteira`
  })
  return suspensa
})
