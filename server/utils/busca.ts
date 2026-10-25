import { escaparLike } from './sql'

const TOKEN_INVALIDO = /[^\p{L}\p{N}_]+/gu

/** Tokens textuais seguros (sem operadores booleanos), com 3+ caracteres. */
export function tokensFulltext(termo: string): string[] {
  return termo
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(TOKEN_INVALIDO, '').trim())
    .filter((token) => token.length >= 3)
}

/** Expressão booleana segura para FULLTEXT (3+ caracteres). */
export function termoFulltext(termo: string): string | null {
  const tokens = tokensFulltext(termo)
  if (!tokens.length) return null
  return tokens.map((token) => `+${token}*`).join(' ')
}

/** Código/e-mail/identificador: usa prefixo/igualdade indexável, não MATCH. */
export function pareceCodigo(termo: string): boolean {
  const texto = termo.trim()
  return /[@/\-]/.test(texto) || /^\d+$/.test(texto)
}

/** Condição de prefixo indexável para códigos/e-mails/termos curtos. */
export function condicaoPrefixo(colunas: string[], termo: string): { sql: string; params: string[] } {
  const like = `${escaparLike(termo.trim())}%`
  return {
    sql: `(${colunas.map((coluna) => `${coluna} LIKE ?`).join(' OR ')})`,
    params: colunas.map(() => like)
  }
}
/** Condição de conteúdo literal (para campos sem FULLTEXT, ex.: JSON de tags). */
export function condicaoContem(colunas: string[], termo: string): { sql: string; params: string[] } {
  const like = `%${escaparLike(termo.trim())}%`
  return {
    sql: `(${colunas.map((coluna) => `${coluna} LIKE ?`).join(' OR ')})`,
    params: colunas.map(() => like)
  }
}