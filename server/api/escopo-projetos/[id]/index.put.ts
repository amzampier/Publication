// PUT /api/escopo-projetos/:id — edição (200 | 400 | 404 | 409). O código é
// imutável; (ano, versão) é revalidado. A transição para Publicado exige a
// permissão `publicar`, mesmo pela edição genérica.
import { atualizarEscopo, buscarEscopo, validarIdEscopo } from '../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { exigePermissaoPublicar, pode, requirePermission } from '../../../utils/permission'

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
  if (antes && exigePermissaoPublicar(antes.status, body.status)) {
    if (!(await pode(event, 'escopo-projetos', 'publicar'))) {
      throw createError({ statusCode: 403, statusMessage: 'Você não tem permissão para publicar.' })
    }
  }
  const atualizado = await atualizarEscopo(id, body, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  const homologou = antes?.status !== 'Publicado' && atualizado.status === 'Publicado'
  await registrarAuditoria(event, {
    acao: homologou ? 'Homologação' : 'Alteração',
    recurso: 'Escopo de Projetos',
    entidadeId: atualizado.id,
    detalhes: homologou
      ? `Publicou o escopo '${atualizado.nome}' (${antes?.codigo ?? atualizado.codigo} → ${atualizado.codigo}) pela edição`
      : `Alterou o escopo '${atualizado.nome}' (${antes?.codigo ?? atualizado.codigo} → ${atualizado.codigo})`
  })
  return atualizado
})