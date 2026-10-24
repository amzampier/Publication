import { escaparLike } from './sql'

/** Expressão booleana segura para FULLTEXT (3+ caracteres). */
export function termoFulltext(termo: string): string | null {
  const limpo = termo.trim()
  if (limpo.length < 3) return null
  const tokens = limpo
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}_-]/gu, ''))
    .filter(Boolean)
  if (!tokens.length) return null
  return tokens.map((token) => `+${token}*`).join(' ')
}

/** Condição de prefixo indexável para códigos/e-mails/termos curtos. */
export function condicaoPrefixo(colunas: string[], termo: string): { sql: string; params: string[] } {
  const like = `${escaparLike(termo.trim())}%`
  return {
    sql: `(${colunas.map((coluna) => `${coluna} LIKE ?`).join(' OR ')})`,
    params: colunas.map(() => like)
  }
}