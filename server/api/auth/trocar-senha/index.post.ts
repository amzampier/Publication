// POST /api/auth/trocar-senha — troca da senha do usuário autenticado
// (Meu Perfil > Segurança — change auth-backend-resend, design D10):
// identificação pela sessão (cookie), conferência bcrypt da senha atual,
// gravação do novo hash e limpeza da flag de provisória.
import { hash, compare } from 'bcrypt'
import {
  obterSessaoValida,
  buscarUsuarioPorId,
  emitirSessao,
  revogarSessoesDoUsuario
} from '../../../utils/auth'
import { getTransaction } from '../../../utils/db'
import { exigirRateLimit } from '../../../utils/rateLimit'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  const sessao = await obterSessaoValida(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada ou revogada.' })
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
  if (!usuario) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada ou revogada.' })
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
  // RL05-A-01: trocar a senha revoga TODAS as sessões (access + refresh) e emite
  // um novo par para ESTA sessão — um token roubado deixa de valer na hora.
  const tx = await getTransaction()
  let tokenVersion = sessao.tokenVersion
  try {
    await tx.query(
      'UPDATE usuarios SET hash_senha = ?, senha_provisoria = 0 WHERE id = ?',
      [hashNova, usuario.id]
    )
    await revogarSessoesDoUsuario(usuario.id, (sql, values) => tx.query(sql, values))
    const versao = await tx.query<Array<{ token_version: number }>>(
      'SELECT token_version FROM usuarios WHERE id = ? LIMIT 1',
      [usuario.id]
    )
    tokenVersion = Number(versao[0]?.token_version ?? tokenVersion + 1)
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
  // Novo access + refresh (rotação limpa) já sem a marca de provisória.
  await emitirSessao(event, { ...sessao, provisoria: false, tokenVersion })
  await registrarAuditoria(event, {
    acao: 'Acesso',
    recurso: 'Autenticação',
    entidadeId: sessao.id,
    detalhes: 'Alterou a senha da própria conta',
    sessao: { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil }
  })

  return { ok: true }
})
