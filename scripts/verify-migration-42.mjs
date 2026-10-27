// Verificação read-only da migration 42 (RL06 B-03).
// Uso: node scripts/verify-migration-42.mjs
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
    "SELECT nome FROM _migrations WHERE nome = '42_software_uuid_auditoria.sql'"
  )
  if (mig.length !== 1) throw new Error('migration 42 não registrada')

  const [colunas] = await db.query(
    `SELECT DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'softwares' AND COLUMN_NAME = 'uuid'`
  )
  if (colunas.length !== 1) throw new Error('coluna softwares.uuid ausente')
  if (String(colunas[0].DATA_TYPE).toLowerCase() !== 'uuid') {
    throw new Error(`tipo inesperado para softwares.uuid: ${colunas[0].DATA_TYPE}`)
  }
  if (colunas[0].IS_NULLABLE !== 'NO') throw new Error('softwares.uuid ainda aceita NULL')

  const [indices] = await db.query(
    "SHOW INDEX FROM softwares WHERE Key_name = 'uk_softwares_uuid'"
  )
  if (indices.length === 0) throw new Error('índice uk_softwares_uuid ausente')

  const [totais] = await db.query(
    `SELECT COUNT(*) AS total,
            SUM(uuid IS NULL) AS nulos,
            COUNT(DISTINCT uuid) AS distintos
       FROM softwares`
  )
  const total = Number(totais[0].total)
  const nulos = Number(totais[0].nulos)
  const distintos = Number(totais[0].distintos)
  if (nulos !== 0) throw new Error(`softwares.uuid com ${nulos} registro(s) nulo(s)`)
  if (distintos !== total) throw new Error('softwares.uuid com valores duplicados')

  console.log(`migration 42 OK: ${total} software(s), UUIDs únicos e não nulos`)
} finally {
  await db.end()
}
