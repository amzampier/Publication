// server/utils/migration-runner.ts — runner idempotente de migrations SQL
// Convenções: docs/02 §4 (§4.3 runner, §4.5 convenções de arquivo).
// Design da change criar-migration-nitro: decisions 1, 4, 5, 6, 9.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PoolConnection } from 'mysql2/promise'
import { getDbPool } from './db'

// Erros idempotentes tolerados (docs/02 §4.3 + 1050 defensivo — design decisão 5)
const TOLERATED_ERRNOS = new Set([1050, 1060, 1061, 1062, 150, 1215, 1005])

const CREATE_TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS _migrations (
    nome VARCHAR(255) NOT NULL PRIMARY KEY,
    aplicado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
`

/**
 * Resolve o diretório de migrations nos cenários suportados:
 * dev (cwd do projeto), produção rodando de .output/server, e bundle
 * aninhado (chunks/ → pai). Lança erro listando os caminhos testados.
 */
export function resolveMigrationDir(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    resolve(process.cwd(), 'server/migration'), // dev (nuxt dev na raiz)
    resolve(process.cwd(), '.output/server/migration'), // node .output/server/index.mjs
    join(here, 'migration'), // chunk solto em .output/server/
    resolve(here, '../migration'), // chunk em .output/server/chunks/
    resolve(here, '../../migration') // chunk aninhado mais fundo
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  throw new Error(
    `[migrations] Diretório server/migration não encontrado. Testados: ${candidates.join(', ')}. ` +
      'Em dev, rode a partir da raiz do projeto; em produção, verifique o hook nitro.hooks.compiled (docs/02 §4.4).'
  )
}

/**
 * Remove blocos /* *\/ e linhas de comentário --; quebra por ";".
 * Convenção docs/02 §4.5: proibido ";" dentro de strings nas migrations.
 */
export function splitStatements(sql: string): string[] {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--')
      return idx === -1 ? line : line.slice(0, idx)
    })
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function isTolerated(err: unknown): boolean {
  return err instanceof Error && 'errno' in err && TOLERATED_ERRNOS.has((err as { errno?: number }).errno ?? -1)
}

async function applyMigrationFile(conn: PoolConnection, fileName: string, filePath: string): Promise<void> {
  const sql = readFileSync(filePath, 'utf8')
  const statements = splitStatements(sql)
  for (const statement of statements) {
    try {
      await conn.query(statement)
    } catch (err) {
      if (isTolerated(err)) continue
      const errno = err instanceof Error && 'errno' in err ? (err as { errno?: number }).errno : undefined
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`[migrations] Falha fatal em "${fileName}" (errno ${errno}): ${message}\nStatement: ${statement.slice(0, 300)}`)
    }
  }
  // Registro resiliente (change endurecer-banco-e-bootstrap, RL02 M-13): numa
  // corrida (duas instâncias subindo), o 2º INSERT viola a PK (1062) — trata
  // como "já registrada" e prossegue em vez de abortar o boot.
  try {
    await conn.query('INSERT INTO _migrations (nome) VALUES (?)', [fileName])
  } catch (err) {
    if (!isTolerated(err)) throw err
  }
}

/**
 * Executa as migrations pendentes de server/migration/*.sql em ordem
 * alfabética. Uma conexão por arquivo (design decisão 1 — USE é de sessão).
 * Idempotente: arquivos já registrados em _migrations são ignorados.
 * Erro fatal = fail-fast com arquivo + statement + errno (decisão 4).
 */
export async function runMigrations(): Promise<void> {
  const pool = getDbPool()

  // Tabela de controle do runner (pertence ao runner, não às migrations).
  await pool.query(CREATE_TRACKING_TABLE)

  const dir = resolveMigrationDir()
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.warn(`[migrations] Nenhum .sql encontrado em ${dir}`)
    return
  }

  const [rows] = await pool.query('SELECT nome FROM _migrations')
  const applied = new Set((rows as Array<{ nome: string }>).map((r) => r.nome))
  const pending = files.filter((f) => !applied.has(f))

  if (pending.length === 0) {
    console.log(`[migrations] Banco atualizado — ${files.length} migration(s), nenhuma pendente.`)
    return
  }

  console.log(`[migrations] Aplicando ${pending.length} migration(s) de ${dir}: ${pending.join(', ')}`)
  for (const fileName of pending) {
    const conn = await pool.getConnection()
    try {
      await applyMigrationFile(conn, fileName, join(dir, fileName))
      console.log(`[migrations] OK: ${fileName}`)
    } finally {
      conn.release()
    }
  }
  console.log('[migrations] Concluído.')
}
