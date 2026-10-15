// POST /api/perfis — criação (201) com validação nome/situação (400)
import { criarPerfil } from '../../utils/perfis'
import { registrarAuditoria } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const perfil = await criarPerfil({
    nome: body.nome,
    descricao: body.descricao,
    situacao: body.situacao
  })
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Perfis de Acesso',
    entidadeId: perfil.id,
    detalhes: `Criou o perfil '${perfil.nome}'`
  })
  return perfil
})
