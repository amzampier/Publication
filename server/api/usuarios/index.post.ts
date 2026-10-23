// POST /api/usuarios — criação (201; 400 validações; 409 e-mail duplicado)
import { criarUsuario } from '../../utils/usuarios'
import { registrarAuditoria } from '../../utils/audit'
import { validarHierarquiaPerfil } from '../../utils/hierarquia'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'criar')
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const usuario = await criarUsuario({
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
  setResponseStatus(event, 201)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Usuários',
    entidadeId: usuario.id,
    detalhes: `Criou o usuário '${usuario.nome}' (${usuario.email}) com perfil ${usuario.perfil}`
  })
  return usuario
})
