// server/utils/db.ts — Connection Pool MariaDB (docs/02 §3.1)
import mysql from 'mysql2/promise'

export interface Transaction {
  query: <T = any>(sql: string, values?: any[]) => Promise<T>
  commit: () => Promise<void>
  rollback: () => Promise<void>
  release: () => void
}

let pool: mysql.Pool | null = null

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = mysql.createPool({
      host: config.dbHost as string,
      port: Number(config.dbPort) || 3306,
      user: config.dbUser as string,
      password: config.dbPassword as string,
      database: config.dbName as string,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: Number(config.dbPoolLimit) || 20,
      queueLimit: Number(config.dbPoolQueueLimit) || 100,
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,
      // Fuso explícito (RL04 OBS-05): default 'local' preserva o comportamento
      // atual; produção pode fixar DB_TIMEZONE (ex.: '-03:00').
      timezone: process.env.DB_TIMEZONE || 'local',
      ...(process.env.DB_SSL === 'true'
        ? {
            ssl: {
              rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
              ca: process.env.DB_SSL_CA || undefined
            }
          }
        : {})
    })
  }
  return pool
}

// Execução rápida de queries
export async function query<T = any>(sql: string, values?: any[]): Promise<T> {
  const p = getDbPool()
  const [rows] = await p.query(sql, values)
  return rows as T
}

// Gerenciamento seguro de Transações ACID
export async function getTransaction(): Promise<Transaction> {
  const p = getDbPool()
  const conn = await p.getConnection()
  await conn.beginTransaction()

  const txQuery = async <T = any>(sql: string, values?: any[]): Promise<T> => {
    const [rows] = await conn.query(sql, values)
    return rows as T
  }

  const commit = async () => {
    try {
      await conn.commit()
    } finally {
      conn.release()
    }
  }

  const rollback = async () => {
    try {
      await conn.rollback()
    } finally {
      conn.release()
    }
  }

  return { query: txQuery, commit, rollback, release: () => conn.release() }
}

/**
 * Insere linhas em blocos multi-row. `sqlBase` deve terminar em `VALUES`
 * (ex.: "INSERT INTO tabela (a, b) VALUES"); `colunas` é a quantidade de
 * placeholders por linha. Mantém a ordem e reduz round-trips sem abrir uma
 * transação por linha.
 */
export async function inserirEmLotes(
  executor: Pick<Transaction, 'query'>,
  sqlBase: string,
  colunas: number,
  linhas: unknown[][],
  lote = 150
): Promise<void> {
  if (!linhas.length) return
  const modelo = `(${Array(colunas).fill('?').join(', ')})`
  for (let i = 0; i < linhas.length; i += lote) {
    const bloco = linhas.slice(i, i + lote)
    await executor.query(
      `${sqlBase} ${bloco.map(() => modelo).join(', ')}`,
      bloco.flat()
    )
  }
}