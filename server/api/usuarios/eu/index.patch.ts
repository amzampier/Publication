// PATCH /api/usuarios/eu — grava dados/endereço/SMTP/avatar do próprio registro
// (sessão do cookie); e-mail, perfil, situação e senha não são editáveis aqui (D7).
import { getSessionUser } from '../../../utils/auth'
import { atualizarProprioRegistro } from '../../../utils/usuarios'
import { registrarAuditoria } from '../../../utils/audit'

const NAO_EDITAVEIS = ['email', 'email_corporativo', 'perfil', 'situacao', 'status', 'senha']

export default defineEventHandler(async (event) => {
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }
  for (const campo of NAO_EDITAVEIS) {
    if (campo in body) {
      throw createError({
        statusCode: 400,
        statusMessage: `Campo não editável por aqui: ${campo}.`
      })
    }
  }

  const atualizado = await atualizarProprioRegistro(sessao.id, {
    nome: body.nome,
    telefone: body.telefone,
    endereco: body.endereco,
    smtp: body.smtp,
    avatar: body.avatar
  })
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Meu Perfil',
    entidadeId: sessao.id,
    detalhes: `'${sessao.nome}' atualizou o próprio perfil`
  })
  return atualizado
})
