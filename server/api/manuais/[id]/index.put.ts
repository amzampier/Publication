// PUT /api/manuais/:id — edição (200 | 400 | 404 | 409). Meses/anos
// alterados regeneram o código e revalidam a unicidade. A transição para
// Publicado exige a permissão `publicar`, mesmo pela edição genérica.
import { atualizarManual, buscarManual, validarIdManual } from '../../../utils/manuais'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { exigePermissaoPublicar, pode, requirePermission } from '../../../utils/permission'

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
  if (antes && exigePermissaoPublicar(antes.status, body.status)) {
    if (!(await pode(event, 'manuais', 'publicar'))) {
      throw createError({ statusCode: 403, statusMessage: 'Você não tem permissão para publicar.' })
    }
  }
  const atualizado = await atualizarManual(id, body, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  const homologou = antes?.status !== 'Publicado' && atualizado.status === 'Publicado'
  await registrarAuditoria(event, {
    acao: homologou ? 'Homologação' : 'Alteração',
    recurso: 'Manuais Mensais',
    entidadeId: atualizado.id,
    detalhes: homologou
      ? `Publicou o manual '${atualizado.titulo}' (${antes?.codigo ?? atualizado.codigo} → ${atualizado.codigo}) pela edição`
      : `Alterou o manual '${atualizado.titulo}' (${antes?.codigo ?? atualizado.codigo} → ${atualizado.codigo})`
  })
  return atualizado
})