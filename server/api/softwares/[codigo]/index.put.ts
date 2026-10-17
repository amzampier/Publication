// PUT /api/softwares/:codigo — edição parcial (200 | 400 | 404)
import { atualizarSoftware, validarCodigo } from '../../../utils/softwares'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'softwares', 'alterar')
  const codigo = validarCodigo(getRouterParam(event, 'codigo'))

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  // Atualização parcial: só os campos presentes no corpo entram no patch.
  const patch: { descricao?: unknown; categoria?: unknown; situacao?: unknown } = {}
  if ('descricao' in body) patch.descricao = body.descricao
  if ('categoria' in body) patch.categoria = body.categoria
  if ('situacao' in body) patch.situacao = body.situacao
  const atualizado = await atualizarSoftware(codigo, patch)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Softwares',
    entidadeId: codigo,
    detalhes: `Alterou o software '${atualizado.descricao}' (${codigo})`
  })
  return atualizado
})
