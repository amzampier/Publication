// PUT /api/manuais/:id — edição (200 | 400 | 404 | 409). Meses/anos
// alterados regeneram o código e revalidam a unicidade.
import { atualizarManual, buscarManual, validarIdManual } from '../../../utils/manuais'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'alterar')
  const id = validarIdManual(getRouterParam(event, 'id'))
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const antes = await buscarManual(id)
  const atualizado = await atualizarManual(id, body, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Manuais Mensais',
    entidadeId: atualizado.codigo,
    detalhes: `Alterou o manual '${atualizado.titulo}' (${antes?.codigo ?? atualizado.codigo} → ${atualizado.codigo})`
  })
  return atualizado
})
