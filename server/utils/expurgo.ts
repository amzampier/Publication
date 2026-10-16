// server/utils/expurgo.ts — apoio da política de retenção de auditoria
// (change correcoes-funcionais-e-ux, RL02 M-03). O expurgo em si é um EVENTO do
// MariaDB criado na migration 10; aqui só garantimos (best-effort) que o Event
// Scheduler está ligado, sem derrubar o boot quando faltar privilégio.
import { query } from './db'

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
