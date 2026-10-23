// PUT /api/release-week/:id — edição (200 | 400 | 404 | 409). Semana/ano
// alterados regeneram o código e revalidam a unicidade. A transição para
// Publicado exige a permissão `publicar`, mesmo pela edição genérica.
import { atualizarReleaseWeek, buscarReleaseWeek, validarIdRelease } from '../../../utils/release-week'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { exigePermissaoPublicar, pode, requirePermission } from '../../../utils/permission'

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
  if (antes && exigePermissaoPublicar(antes.status, body.status)) {
    if (!(await pode(event, 'release-week', 'publicar'))) {
      throw createError({ statusCode: 403, statusMessage: 'Você não tem permissão para publicar.' })
    }
  }
  const atualizada = await atualizarReleaseWeek(id, body, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  const homologou = antes?.status !== 'Publicado' && atualizada.status === 'Publicado'
  await registrarAuditoria(event, {
    acao: homologou ? 'Homologação' : 'Alteração',
    recurso: 'Release Week',
    entidadeId: atualizada.id,
    detalhes: homologou
      ? `Publicou a Release Week '${atualizada.nome}' (${antes?.codigo ?? atualizada.codigo} → ${atualizada.codigo}) pela edição`
      : `Alterou a Release Week '${atualizada.nome}' (${antes?.codigo ?? atualizada.codigo} → ${atualizada.codigo})`
  })
  return atualizada
})