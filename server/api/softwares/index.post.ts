// POST /api/softwares — criação (201) com geração de código (400 na validação)
import { criarSoftware } from '../../utils/softwares'
import { registrarAuditoria } from '../../utils/audit'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'softwares', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const software = await criarSoftware({
    descricao: body.descricao,
    categoria: body.categoria,
    situacao: body.situacao
  })
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Softwares',
    entidadeId: software.codigo,
    detalhes: `Criou o software '${software.descricao}' (${software.codigo})`
  })
  return software
})
