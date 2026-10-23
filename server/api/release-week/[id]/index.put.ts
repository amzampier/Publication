// PUT /api/release-week/:id — edição (200 | 400 | 404 | 409). Semana/ano
// alterados regeneram o código e revalidam a unicidade.
import { atualizarReleaseWeek, buscarReleaseWeek, validarIdRelease } from '../../../utils/release-week'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'alterar')
  const id = validarIdRelease(getRouterParam(event, 'id'))
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const antes = await buscarReleaseWeek(id)
  const atualizada = await atualizarReleaseWeek(id, body, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Release Week',
    entidadeId: atualizada.codigo,
    detalhes: `Alterou a Release Week '${atualizada.nome}' (${antes?.codigo ?? atualizada.codigo} → ${atualizada.codigo})`
  })
  return atualizada
})
