// PUT /api/esteira-revisao/:id/reabrir — devolve para Revisar (alterar).
import { createError } from 'h3'
import { requirePermission } from '../../../utils/permission'
import { getSessionUser } from '../../../utils/auth'
import { desaprovarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'esteira-revisao', 'alterar')
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const corpo = (await readBody(event).catch(() => ({}))) as { parecer?: unknown }
  const reaberta = await desaprovarChamada(
    id,
    { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil },
    { parecer: typeof corpo?.parecer === 'string' ? corpo.parecer : undefined }
  )
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Esteira de Revisão',
    entidadeId: reaberta.id,
    detalhes: `Reabriu a chamada '${reaberta.chamada}' (${reaberta.titulo}) na esteira`
  })
  return reaberta
})
