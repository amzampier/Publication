// PUT /api/perfis/:id — edição de nome/descricao/situacao (200 | 400 | 404)
import { atualizarPerfil, validarId } from '../../../utils/perfis'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'perfis-acesso', 'alterar')
  const id = validarId(getRouterParam(event, 'id'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  // Atualização parcial (RL02 M-21): só os campos presentes no corpo entram no
  // patch — omitir `descricao` preserva o valor vigente.
  const patch: { nome?: unknown; descricao?: unknown; situacao?: unknown } = {}
  if ('nome' in body) patch.nome = body.nome
  if ('descricao' in body) patch.descricao = body.descricao
  if ('situacao' in body) patch.situacao = body.situacao
  const atualizado = await atualizarPerfil(id, patch)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Perfis de Acesso',
    entidadeId: id,
    detalhes: `Alterou o perfil '${atualizado.nome}'`
  })
  return atualizado
})
