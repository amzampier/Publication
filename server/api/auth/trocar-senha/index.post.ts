// POST /api/auth/trocar-senha — troca da senha do usuário autenticado
// (Meu Perfil > Segurança — change auth-backend-resend, design D10):
// identificação pela sessão (cookie), conferência bcrypt da senha atual,
// gravação do novo hash e limpeza da flag de provisória.
import { hash, compare } from 'bcrypt'
import {
  getSessionUser,
  buscarUsuarioPorId
} from '../../../utils/auth'
import { query } from '../../../utils/db'
import { exigirRateLimit } from '../../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }

  const body = await readBody<{ atual?: unknown; nova?: unknown }>(event)
  const atual = typeof body?.atual === 'string' ? body.atual : ''
  const nova = typeof body?.nova === 'string' ? body.nova : ''

  if (!atual) {
    throw createError({ statusCode: 400, statusMessage: 'Informe a senha atual.' })
  }
  if (nova.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A nova senha deve ter pelo menos 8 caracteres.'
    })
  }

  const usuario = await buscarUsuarioPorId(sessao.id)
  if (!usuario || usuario.situacao !== 'Ativo') {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }

  let atualOk = false
  try {
    atualOk = await compare(atual, usuario.hash_senha)
  } catch {
    atualOk = false
  }
  if (!atualOk) {
    throw createError({ statusCode: 400, statusMessage: 'Senha atual incorreta.' })
  }

  const hashNova = await hash(nova, 12)
  await query(
    'UPDATE usuarios SET hash_senha = ?, senha_provisoria = 0 WHERE id = ?',
    [hashNova, usuario.id]
  )

  return { ok: true }
})
