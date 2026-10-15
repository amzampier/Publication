// POST /api/auth/logout — revoga a sessão no servidor (revogado_em) e limpa
// os cookies HttpOnly (design D1). Sempre responde ok (idempotente).
// Trilha 'Acesso': só registra quando havia sessão identificada (sem cookie,
// o logout idempotente não gera evento com usuário 'Desconhecido').
import { getCookie } from 'h3'
import { getSessionUser, revogarSessao, limparCookiesAuth } from '../../../utils/auth'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const sessao = await getSessionUser(event)
  const refresh = getCookie(event, 'auth-refresh') ?? getCookie(event, '__Host-auth-refresh')
  await revogarSessao(refresh)
  limparCookiesAuth(event)
  if (sessao) {
    await registrarAuditoria(event, {
      acao: 'Acesso',
      recurso: 'Autenticação',
      entidadeId: sessao.id,
      detalhes: 'Encerrou a sessão (logout)',
      sessao: { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil }
    })
  }
  return { ok: true }
})
