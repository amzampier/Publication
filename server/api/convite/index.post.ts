// POST /api/convite — envio real de convite (change auth-backend-resend,
// design D9/D12): sessão obrigatória + rate limit; find-or-create da conta por
// e-mail (bcrypt da provisória; perfil resolvido por nome_perfil nos seeds);
// canal "email" dispara o Resend (falha → 502 com a conta já gravada — o
// admin repete e regrava/reenvia); canal "whatsapp" só grava (o cliente abre
// o app). A listagem de /admin/gestao-usuarios continua a base demo.
import { hash } from 'bcrypt'
import { getRequestURL } from 'h3'
import {
  gerarSenhaProvisoria,
  renderHtmlConvite,
  renderTextoConvite,
  ASSUNTO_CONVITE
} from '#shared/utils/emails'
import { getSessionUser } from '../../utils/auth'
import { query, getTransaction } from '../../utils/db'
import { enviarEmail } from '../../utils/mailer'
import { exigirRateLimit } from '../../utils/rateLimit'

interface BodyConvite {
  email?: unknown
  senha?: unknown
  nome?: unknown
  perfil?: unknown
  situacao?: unknown
  telefone?: unknown
  departamento?: unknown
  funcao?: unknown
  canal?: unknown
}

const SITUACOES = ['Ativo', 'Inativo', 'Bloqueado']

export default defineEventHandler(async (event) => {
  await exigirRateLimit(event)

  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }

  const body = (await readBody<BodyConvite>(event)) ?? {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const senha = typeof body.senha === 'string' ? body.senha : ''
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  const perfil = typeof body.perfil === 'string' ? body.perfil.trim() : ''
  const canal = typeof body.canal === 'string' ? body.canal : 'email'
  const situacao =
    typeof body.situacao === 'string' && SITUACOES.includes(body.situacao)
      ? body.situacao
      : 'Ativo'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail válido.' })
  }
  if (!nome) {
    throw createError({ statusCode: 400, statusMessage: 'Informe o nome do destinatário.' })
  }
  if (senha.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A senha provisória deve ter no mínimo 8 caracteres.'
    })
  }
  if (canal !== 'email' && canal !== 'whatsapp') {
    throw createError({ statusCode: 400, statusMessage: 'Canal de envio inválido.' })
  }

  const perfis = await query<Array<{ id: string }>>(
    'SELECT id FROM perfis_acesso WHERE nome_perfil = ? LIMIT 1',
    [perfil]
  )
  if (perfis.length === 0) {
    throw createError({ statusCode: 400, statusMessage: `Perfil desconhecido: ${perfil}.` })
  }
  const perfilId = String(perfis[0].id)

  const hashSenha = await hash(senha, 12)
  const telefone = typeof body.telefone === 'string' ? body.telefone : ''
  const departamento =
    typeof body.departamento === 'string' && body.departamento ? body.departamento : 'Geral'
  const funcao = typeof body.funcao === 'string' ? body.funcao : ''

  // Find-or-create em transação (a conta é gravada MESMO se o e-mail falhar).
  const tx = await getTransaction()
  let criado = false
  try {
    const existentes = await tx.query<Array<{ id: string }>>(
      'SELECT id FROM usuarios WHERE email_corporativo = ? LIMIT 1',
      [email]
    )
    if (existentes.length > 0) {
      await tx.query(
        'UPDATE usuarios SET hash_senha = ?, senha_provisoria = 1, tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?',
        [hashSenha, String(existentes[0].id)]
      )
    } else {
      await tx.query(
        `INSERT INTO usuarios (id, nome_completo, email_corporativo, hash_senha, perfil_id,
                               departamento_setor, funcao, telefone, situacao, senha_provisoria,
                               tentativas_falhas)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
        [nome, email, hashSenha, perfilId, departamento, funcao, telefone, situacao]
      )
      criado = true
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }

  if (canal === 'email') {
    try {
      const link = `${getRequestURL(event).origin}/admin/login`
      const dados = { nome, email, perfil, senha, telefone }
      await enviarEmail({
        para: email,
        assunto: ASSUNTO_CONVITE,
        html: renderHtmlConvite(dados, link),
        text: renderTextoConvite(dados, link)
      })
    } catch (erro) {
      console.error('[convite] falha no envio via Resend:', erro)
      throw createError({
        statusCode: 502,
        statusMessage:
          'Conta gravada, mas o envio do e-mail falhou. Tente enviar o convite novamente.'
      })
    }
  }

  return { ok: true, criado }
})
