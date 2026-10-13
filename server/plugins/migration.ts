// server/plugins/migration.ts — provisiona o banco no boot (docs/02 §4.2)
// Síncrono no boot: migrations + bootstrap do admin terminam antes da
// primeira requisição (design decisão 8). Erro aqui derruba o boot
// propositalmente (fail-fast, design decisão 4).
export default defineNitroPlugin(async () => {
  await runMigrations()
  await ensureAdminUser()
})
