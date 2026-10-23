// POST /api/convite — envio real de convite (change auth-backend-resend,
// design D9/D12): sessão obrigatória + rate limit; find-or-create da conta por
// e-mail (bcrypt da provisória; perfil resolvido por nome_perfil nos seeds);
// canal "email" dispara o Resend (falha → 502 com a conta já gravada — o
// admin repete e regrava/reenvia); canal "whatsapp" só grava (o cliente abre
// o app).
import { hash } from 'bcrypt'
import {
  gerarSenhaProvisoria,
  renderHtmlConvite,
  renderTextoConvite,
  ASSUNTO_CONVITE
} from '#shared/utils/emails'
import { getSessionUser, revogarSessoesDoUsuario } from '../../utils/auth'
import { query, getTransaction } from '../../utils/db'
import { enviarEmail } from '../../utils/mailer'
import { exigirRateLimit } from '../../utils/rateLimit'
import { registrarAuditoria } from '../../utils/audit'
import { validarHierarquiaPerfil } from '../../utils/hierarquia'
import { requirePermission } from '../../utils/permission'
import { invalidarCache } from '../../utils/cache'

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

  await requirePermission(event, 'gestao-usuarios', 'convite')

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

  const perfis = await query<Array<{ id: string; situacao: string }>>(
    'SELECT id, situacao FROM perfis_acesso WHERE nome_perfil = ? LIMIT 1',
    [perfil]
  )
  const perfilRow = perfis[0]
  if (!perfilRow) {
    throw createError({ statusCode: 400, statusMessage: `Perfil desconhecido: ${perfil}.` })
  }
  if (String(perfilRow.situacao) !== 'Ativo') {
    throw createError({ statusCode: 400, statusMessage: `O perfil "${perfil}" não está ativo e não pode ser atribuído.` })
  }
  const perfilId = String(perfilRow.id)
  // Convite entrega credenciais: exige usuário Ativo (RL04 B-18) — um usuário
  // Inativo/Bloqueado não conseguiria autenticar com elas.
  if (situacao !== 'Ativo') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Só é possível convidar um usuário Ativo — um usuário Inativo/Bloqueado não conseguiria autenticar.'
    })
  }

  // RL05-M-01: reenviar convite a uma conta existente REDEFINE a credencial dela.
  // Exige `alterar` (não basta `criar`) e recusa conta não-Ativa, validando a
  // situação real no banco — não apenas o payload.
  const existentesPre = await query<Array<{ id: string; situacao: string }>>(
    'SELECT id, situacao FROM usuarios WHERE email_corporativo = ? LIMIT 1',
    [email]
  )
  const existentePre = existentesPre[0]
  if (existentePre) {
    await requirePermission(event, 'gestao-usuarios', 'alterar')
    if (String(existentePre.situacao) !== 'Ativo') {
      throw createError({
        statusCode: 400,
        statusMessage:
          'A conta já existe e não está Ativa — reative-a antes de reenviar o convite.'
      })
    }
  }

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
    const existente = existentes[0]
    if (existente) {
      await tx.query(
        'UPDATE usuarios SET hash_senha = ?, senha_provisoria = 1, tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?',
        [hashSenha, String(existente.id)]
      )
      // A credencial mudou: derruba as sessões antigas da conta-alvo (RL05-A-01).
      await revogarSessoesDoUsuario(String(existente.id), (sql, values) => tx.query(sql, values))
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
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Este e-mail foi cadastrado por outra operação. Tente novamente.'
      })
    }
    throw erro
  }
  invalidarCache('usuarios-opcoes')

  // Conta gravada (mesmo se o e-mail abaixo falhar) — a trilha registra a gravação.
  await registrarAuditoria(event, {
    acao: criado ? 'Inclusão' : 'Alteração',
    recurso: 'Usuários',
    detalhes: criado
      ? `Convidou '${nome}' (${email}) com perfil ${perfil} via ${canal}`
      : `Reenviou convite para '${nome}' (${email}) com perfil ${perfil} via ${canal} — senha provisória redefinida`
  })

  if (canal === 'email') {
    try {
      const base = String(useRuntimeConfig().appUrl || '').replace(/\/+$/, '')
      if (!base) {
        throw new Error('APP_URL não configurada — não é possível montar o link do convite.')
      }
      const link = `${base}/admin/login`
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
