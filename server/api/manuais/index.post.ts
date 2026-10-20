// POST /api/manuais — criação (201) com código MAN-XX/AAAA gerado no
// servidor; 400 na validação, 409 em mês/ano duplicado.
import { criarManual } from '../../utils/manuais'
import { registrarAuditoria } from '../../utils/audit'
import { getSessionUser } from '../../utils/auth'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const criado = await criarManual(body, { id: sessao.id, nome: sessao.nome })
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Manuais Mensais',
    entidadeId: criado.codigo,
    detalhes: `Criou o manual '${criado.titulo}' (${criado.codigo})`
  })
  return criado
})
