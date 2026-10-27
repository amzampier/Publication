// Verificação read-only da migration 41 (RL06-2).
// Uso: node scripts/verify-migration-41.mjs
import mysql from 'mysql2/promise'
import fs from 'node:fs'

const env = fs.readFileSync('.env', 'utf8')
const g = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]

const db = await mysql.createConnection({
  host: g('DB_HOST') || 'localhost',
  port: Number(g('DB_PORT') || 3306),
  user: g('DB_USER'),
  password: g('DB_PASSWORD'),
  database: g('DB_NAME')
})

try {
  const [mig] = await db.query(
    "SELECT nome FROM _migrations WHERE nome = '41_reconciliar_views_e_contratos.sql'"
  )
  if (mig.length !== 1) throw new Error('migration 41 não registrada')

  const esperadas = new Map([
    ['v_release_itens', ['publicado_em', 'tags_texto']],
    ['v_projeto_itens', ['publicado_em', 'tags_texto']],
    ['v_manual_itens', ['publicado_em', 'tags_texto']],
    ['manuais', ['arquivada', 'publicado_em', 'chave_ativa']]
  ])

  for (const [view, colunas] of esperadas) {
    await db.query('SELECT 1 FROM `' + view + '` LIMIT 1')
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [view]
    )
    const presentes = new Set(rows.map((row) => row.COLUMN_NAME))
    const faltando = colunas.filter((coluna) => !presentes.has(coluna))
    if (faltando.length > 0) {
      throw new Error(`${view} sem coluna(s): ${faltando.join(', ')}`)
    }
  }

  const [comentarios] = await db.query(
    `SELECT COLUMN_NAME, COLUMN_COMMENT FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'entregas_itens'
        AND COLUMN_NAME IN ('data_lancamento', 'data_liberacao')`
  )
  const porColuna = new Map(comentarios.map((row) => [row.COLUMN_NAME, row.COLUMN_COMMENT]))
  if (!String(porColuna.get('data_lancamento') || '').includes('qualquer data')) {
    throw new Error('comentário de data_lancamento não foi atualizado')
  }

  console.log('migration 41 OK: views, colunas-chave e comentários de data')
} finally {
  await db.end()
}
