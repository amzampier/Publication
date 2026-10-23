// Verificação da migration 31 (RL06-2). Uso: node scripts/verify-migration-31.mjs
import mysql from 'mysql2/promise'
import fs from 'node:fs'
const env = fs.readFileSync('.env', 'utf8')
const g = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]
const db = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: g('DB_USER'),
  password: g('DB_PASSWORD'),
  database: g('DB_NAME')
})
try {
  const [mig] = await db.query("SELECT nome FROM _migrations WHERE nome = '31_rl06_2_reconciliacao.sql'")
  if (mig.length !== 1) throw new Error('migration 31 não registrada')
  for (const view of ['v_release_itens', 'v_projeto_itens', 'v_manual_itens', 'manuais']) {
    await db.query('SELECT 1 FROM ' + view + ' LIMIT 1')
  }
  const [idx] = await db.query(
    "SELECT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'entregas_itens' AND index_name LIKE 'idx_entregas_data_%'"
  )
  if (new Set(idx.map((r) => r.index_name)).size < 2) throw new Error('índices de data ausentes')
  const [cols] = await db.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND column_name = 'chave_ativa'"
  )
  if (new Set(cols.map((r) => r.table_name)).size < 3) throw new Error('colunas chave_ativa ausentes')

  await db.beginTransaction()
  try {
    // Um ciclo ativo + um arquivado com a mesma chave; recriar ativo deve funcionar.
    await db.query(
      "INSERT INTO release_week (id, codigo, nome, semana, ano, mes, data_inicio, data_finaliza, data_publicacao, status, arquivada) VALUES ('rl062-ativo', 'RW-99/2099', 'Ativo', 99, 2099, 'Dezembro', '2099-12-01', '2099-12-05', '2099-12-07', 'Aberta', 0)"
    )
    await db.query("UPDATE release_week SET arquivada = 1 WHERE id = 'rl062-ativo'")
    await db.query(
      "INSERT INTO release_week (id, codigo, nome, semana, ano, mes, data_inicio, data_finaliza, data_publicacao, status, arquivada) VALUES ('rl062-novo', 'RW-99/2099', 'Novo', 99, 2099, 'Dezembro', '2099-12-01', '2099-12-05', '2099-12-07', 'Aberta', 0)"
    )
    await db.rollback()
  } catch (erro) {
    await db.rollback()
    throw erro
  }
  console.log('migration 31 OK: views, índices e recriação após arquivamento')
} finally {
  await db.end()
}