// server/plugins/migration.ts — provisiona o banco no boot (docs/02 §4.2)
// Síncrono no boot: migrations + bootstrap do admin terminam antes da
// primeira requisição (design decisão 8). Erro aqui derruba o boot
// propositalmente (fail-fast, design decisão 4; terminação EXPLÍCITA desde a
// change auditoria-backend-integracao, design D9): antes, a rejeição virava
// `[unhandledRejection]` no log e o processo seguia ouvindo — contradizendo
// o "fails fast by design" do AGENTS.md. Agora: mensagem + exit != 0.
export default defineNitroPlugin(async () => {
  try {
    await runMigrations()
    await ensureAdminUser()
    await migrarSenhasSmtp()
    await garantirEventScheduler()
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
