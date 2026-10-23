// POST /api/manuais — criação (201) com código MAN-XX/AAAA gerado no
// servidor; 400 na validação, 409 em mês/ano duplicado. Publicar exige
// a permissão própria também na criação.
import { criarManual } from '../../utils/manuais'
import { registrarAuditoria } from '../../utils/audit'
import { getSessionUser } from '../../utils/auth'
import { exigePermissaoPublicar, pode, requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  if (exigePermissaoPublicar(undefined, body.status) && !(await pode(event, 'manuais', 'publicar'))) {
    throw createError({ statusCode: 403, statusMessage: 'Você não tem permissão para publicar.' })
  }
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const criado = await criarManual(body, { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil })
  setResponseStatus(event, 201)
  const homologou = criado.status === 'Publicado'
  await registrarAuditoria(event, {
    acao: homologou ? 'Homologação' : 'Inclusão',
    recurso: 'Manuais Mensais',
    entidadeId: criado.id,
    detalhes: homologou
      ? `Criou e publicou o manual '${criado.titulo}' (${criado.codigo})`
      : `Criou o manual '${criado.titulo}' (${criado.codigo})`
  })
  return criado
})