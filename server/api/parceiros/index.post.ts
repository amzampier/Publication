// POST /api/parceiros — criação (201) com geração de código PAR-XXX (400 na validação)
import { criarParceiro } from '../../utils/parceiros'
import { registrarAuditoria } from '../../utils/audit'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'parceiros', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const parceiro = await criarParceiro({
    razao_social: body.razao_social,
    nome_fantasia: body.nome_fantasia,
    cidade: body.cidade,
    estado: body.estado,
    regiao: body.regiao,
    logo_url: body.logo_url,
    situacao: body.situacao
  })
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Parceiros',
    entidadeId: parceiro.id,
    detalhes: `Criou o parceiro '${parceiro.razao_social}' (${parceiro.codigo})`
  })
  return parceiro
})
