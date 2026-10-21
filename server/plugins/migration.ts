// server/plugins/migration.ts — provisiona o banco no boot (docs/02 §4.2)
// Síncrono no boot: migrations + bootstrap do admin terminam antes da
// primeira requisição (design decisão 8). Erro aqui derruba o boot
// propositalmente (fail-fast, design decisão 4; terminação EXPLÍCITA desde a
// change auditoria-backend-integracao, design D9): antes, a rejeição virava
// `[unhandledRejection]` no log e o processo seguia ouvindo — contradizendo
// o "fails fast by design" do AGENTS.md. Agora: mensagem + exit != 0.
import { getDbPool } from '../utils/db'

/**
 * O runner tolera `errno 1062` (chave duplicada). Sem esta pré-checagem, o
 * `ADD UNIQUE KEY` da migration 24 poderia ser ignorado e o app subiria sem
 * unicidade de `chamada`. Só roda quando a tabela já existe (primeiro boot
 * ainda não tem `entregas_itens`).
 */
async function verificarDuplicatasChamadas(): Promise<void> {
  const pool = getDbPool()
  const [tabelas] = (await pool.query(
    `SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'entregas_itens' LIMIT 1`
  )) as unknown as [Array<Record<string, unknown>>, unknown]
  if (tabelas.length === 0) return

  const [linhas] = (await pool.query(
    `SELECT chamada, COUNT(*) AS total
       FROM entregas_itens
      GROUP BY chamada
     HAVING COUNT(*) > 1
      LIMIT 5`
  )) as unknown as [Array<{ chamada: string; total: number }>, unknown]

  if (linhas.length > 0) {
    const exemplos = linhas.map((l) => `${l.chamada} (${l.total})`).join(', ')
    throw new Error(
      `[migrations] Existem chamadas duplicadas em entregas_itens: ${exemplos}. ` +
      'Corrija os números repetidos antes de subir a aplicação (a migration 24 não pode criar o índice único).'
    )
  }
}

/** Confirma que o UNIQUE realmente foi criado, mesmo com o `1062` tolerado. */
async function verificarIndiceUnicoChamada(): Promise<void> {
  const pool = getDbPool()
  const [tabelas] = (await pool.query(
    `SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'entregas_itens' LIMIT 1`
  )) as unknown as [Array<Record<string, unknown>>, unknown]
  if (tabelas.length === 0) return

  const [indices] = (await pool.query(
    `SHOW INDEX FROM entregas_itens WHERE Key_name = 'uk_entregas_chamada'`
  )) as unknown as [Array<Record<string, unknown>>, unknown]
  if (indices.length === 0) {
    throw new Error(
      "[migrations] O índice único 'uk_entregas_chamada' não foi criado em entregas_itens. " +
      'Verifique duplicatas de chamada e reaplique a migration 24.'
    )
  }
}

export default defineNitroPlugin(async () => {
  try {
    await verificarDuplicatasChamadas()
    await runMigrations()
    await verificarIndiceUnicoChamada()
    await ensureAdminUser()
    await migrarSenhasSmtp()
    await garantirEventScheduler()
    await executarExpurgo()
  } catch (erro: any) {
    process.exitCode = 1
    // Escrita ÚNICA (uma operação de I/O) + espera curta antes de encerrar:
    // no Windows stderr para arquivo/pipe é assíncrono via libuv e um
    // kill/exit imediato derruba as linhas ainda enfileiradas (obs.: a
    // mensagem sumia após a 1ª linha). O delay deixa o flush completar.
    const texto =
      `${'─'.repeat(72)}\n` +
      '[migrations] BOOT ABORTADO (fail-fast) — banco indisponível ou\n' +
      '[migrations] provisionamento falhou. Corrija DB_*/.env e reinicie o\n' +
      '[migrations] servidor (AGENTS.md: MariaDB 11.8+ é obrigatório em dev\n' +
      '[migrations] e produção).\n' +
      `${String(erro?.stack ?? erro)}\n` +
      `${'─'.repeat(72)}\n`
    try {
      process.stderr.write(texto)
    } catch {
      /* segue a terminação mesmo sem log */
    }
    setTimeout(() => {
      // Em `nuxt dev` o plugin roda numa worker thread: process.exit() mata
      // só a thread e o nuxi continua ouvindo — o sinal no pid (compartilhado
      // pelas threads do mesmo processo) derruba o processo inteiro.
      if (process.env.NODE_ENV === 'development') {
        try {
          process.kill(process.pid, 'SIGTERM')
        } catch {
          /* segue o exit abaixo */
        }
      }
      process.exit(1)
    }, 400)
  }
})
