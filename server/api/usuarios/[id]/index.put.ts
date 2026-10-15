// PUT /api/usuarios/:id — edição (200; 404; 409 e-mail duplicado; 400 validações)
import { atualizarUsuario, buscarUsuarioTelaPorId } from '../../../utils/usuarios'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  if (!(await buscarUsuarioTelaPorId(id))) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const atualizado = await atualizarUsuario(id, {
    nome: body.nome,
    email: body.email,
    perfil: body.perfil,
    situacao: body.situacao,
    senha: body.senha,
    telefone: body.telefone,
    funcao: body.funcao,
    departamento: body.departamento,
    endereco: body.endereco,
    smtp: body.smtp
  })
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Usuários',
    entidadeId: id,
    detalhes: `Alterou o usuário '${atualizado.nome}' (${atualizado.email})`
  })
  return atualizado
})
