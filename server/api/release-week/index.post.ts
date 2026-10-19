// POST /api/release-week — criação (201) com código RW-XX/AAAA gerado no
// servidor; 400 na validação, 409 em semana/ano duplicado.
import { criarReleaseWeek } from '../../utils/release-week'
import { registrarAuditoria } from '../../utils/audit'
import { getSessionUser } from '../../utils/auth'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const criada = await criarReleaseWeek(body, { id: sessao.id, nome: sessao.nome })
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Release Week',
    entidadeId: criada.codigo,
    detalhes: `Criou a Release Week '${criada.nome}' (${criada.codigo})`
  })
  return criada
})
