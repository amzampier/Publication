// PUT /api/escopo-projetos/:id — edição (200 | 400 | 404 | 409). O código é
// imutável; (ano, versão) é revalidado.
import { atualizarEscopo, buscarEscopo, validarIdEscopo } from '../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'alterar')
  const id = validarIdEscopo(getRouterParam(event, 'id'))
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const antes = await buscarEscopo(id)
  const atualizado = await atualizarEscopo(id, body, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Escopo de Projetos',
    entidadeId: atualizado.codigo,
    detalhes: `Alterou o escopo '${atualizado.nome}' (${antes?.codigo ?? atualizado.codigo})`
  })
  return atualizado
})
