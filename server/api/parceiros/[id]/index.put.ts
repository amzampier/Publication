// PUT /api/parceiros/:id — edição parcial (200 | 400 | 404)
import { atualizarParceiro } from '../../../utils/parceiros'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'parceiros', 'alterar')
  const id = (getRouterParam(event, 'id') ?? '').trim()
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Parceiro não encontrado.' })

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  // Atualização parcial: só os campos presentes no corpo entram no patch.
  const patch: Record<string, unknown> = {}
  for (const campo of ['razao_social', 'nome_fantasia', 'cidade', 'estado', 'regiao', 'logo_url', 'situacao']) {
    if (campo in body) patch[campo] = body[campo]
  }
  const atualizado = await atualizarParceiro(id, patch)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Parceiros',
    entidadeId: id,
    detalhes: `Alterou o parceiro '${atualizado.razao_social}' (${atualizado.codigo})`
  })
  return atualizado
})
