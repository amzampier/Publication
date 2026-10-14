// POST /api/usuarios — criação (201; 400 validações; 409 e-mail duplicado)
import { criarUsuario } from '../../utils/usuarios'

export default defineEventHandler(async (event) => {
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
    smtp: body.smtp
  })
  setResponseStatus(event, 201)
  return usuario
})
