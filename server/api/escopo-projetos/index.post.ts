// POST /api/escopo-projetos — criação (201) com código PE-<ano>.<seq> gerado no
// servidor; 400 na validação, 409 em (ano, versão) duplicado.
import { criarEscopo } from '../../utils/escopo-projetos'
import { registrarAuditoria } from '../../utils/audit'
import { getSessionUser } from '../../utils/auth'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const criado = await criarEscopo(body, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Escopo de Projetos',
    entidadeId: criado.codigo,
    detalhes: `Criou o escopo '${criado.nome}' (${criado.codigo})`
  })
  return criado
})
