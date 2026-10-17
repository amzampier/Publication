// POST /api/auth/logout — revoga a sessão no servidor (revogado_em) e limpa
// os cookies HttpOnly (design D1). Sempre responde ok (idempotente).
// Trilha 'Acesso': só registra quando havia sessão identificada (sem cookie,
// o logout idempotente não gera evento com usuário 'Desconhecido').
import { getCookie } from 'h3'
import {
  obterSessaoDoAccess,
  revogarSessaoEAccess,
  limparCookiesAuth
} from '../../../utils/auth'
import { registrarAuditoria } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  // RL05-M-04: resolve a sessão SOMENTE pelo access (não rotaciona o refresh) e
  // revoga refresh + versão da sessão na mesma transação.
  const sessao = await obterSessaoDoAccess(event)
  const refresh = getCookie(event, 'auth-refresh') ?? getCookie(event, '__Host-auth-refresh')
  await revogarSessaoEAccess(refresh, sessao?.id)
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
