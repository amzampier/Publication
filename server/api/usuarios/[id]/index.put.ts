// PUT /api/usuarios/:id — edição (200; 404; 409 e-mail duplicado; 400 validações)
import { atualizarUsuario, buscarUsuarioTelaPorId } from '../../../utils/usuarios'
import { registrarAuditoria } from '../../../utils/audit'
import { validarHierarquiaPerfil } from '../../../utils/hierarquia'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'alterar')
  const id = String(getRouterParam(event, 'id') ?? '')
  const alvo = await buscarUsuarioTelaPorId(id)
  if (!alvo) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  await validarHierarquiaPerfil(event, body.perfil, alvo.perfil)

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
    smtp: body.smtp,
    avatar: body.avatar
  })
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Usuários',
    entidadeId: id,
    detalhes: `Alterou o usuário '${atualizado.nome}' (${atualizado.email})`
  })
  return atualizado
})
