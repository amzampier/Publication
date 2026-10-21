import { criarChamada } from '../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../utils/audit'
import { getSessionUser } from '../../utils/auth'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const criada = await criarChamada(body, { id: sessao.id, nome: sessao.nome })
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Lançar as Chamadas',
    entidadeId: criada.id,
    detalhes: `Criou a chamada '${criada.chamada}' (${criada.titulo})`
  })
  return criada
})
