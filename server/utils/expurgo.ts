// server/utils/expurgo.ts — apoio da política de retenção de auditoria
// (change correcoes-funcionais-e-ux, RL02 M-03). O expurgo em si é um EVENTO do
// MariaDB criado na migration 10; aqui só garantimos (best-effort) que o Event
// Scheduler está ligado, sem derrubar o boot quando faltar privilégio.
import { query } from './db'

/**
 * Expurgo catch-up (RL04 M-16): roda uma vez no boot, aplicando os mesmos
 * DELETE dos eventos diários da migration 11 — cobre o caso em que o horário
 * agendado passou enquanto o servidor estava fora. Best-effort.
 */
export async function executarExpurgo(): Promise<void> {
  try {
    await query(
      `DELETE FROM sessoes
        WHERE (revogado_em IS NULL AND expira_em < NOW(6))
           OR (revogado_em IS NOT NULL AND revogado_em < DATE_SUB(NOW(6), INTERVAL 1 DAY))`
    )
    await query('DELETE FROM token_blacklist WHERE expira_em < NOW(6)')
    await query(
      'DELETE FROM seguranca_eventos_login WHERE ocorrido_em < DATE_SUB(NOW(6), INTERVAL 90 DAY)'
    )
  } catch (erro) {
    console.warn(
      '[expurgo] catch-up no boot falhou (segue sem derrubar o boot):',
      erro instanceof Error ? erro.message : erro
    )
  }
}

export async function garantirEventScheduler(): Promise<void> {
  try {
    const linhas = await query<Array<{ valor: string }>>(
      "SELECT @@event_scheduler AS valor"
    )
    const estado = String(linhas[0]?.valor ?? '').toUpperCase()
    if (estado === 'ON') return
    await query('SET GLOBAL event_scheduler = ON')
    console.log('[expurgo] Event Scheduler habilitado (event_scheduler = ON).')
  } catch (erro) {
    console.warn(
      '[expurgo] Não foi possível habilitar o Event Scheduler — o expurgo de auditoria não rodará automaticamente. ' +
        'Habilite-o no servidor MariaDB (event_scheduler = ON) ou conceda os privilégios necessários.',
      erro instanceof Error ? erro.message : erro
    )
  }
}
