// GET /api/usuarios/eu — registro completo do próprio usuário (sessão do cookie)
import { getSessionUser } from '../../../utils/auth'
import { buscarUsuarioTelaPorId } from '../../../utils/usuarios'

export default defineEventHandler(async (event) => {
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  const usuario = await buscarUsuarioTelaPorId(sessao.id)
  if (!usuario) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
  }
  return usuario
})
