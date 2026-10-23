// Identifica a saturação da fila do pool MySQL/MariaDB. O mysql2 lança
// "Queue limit reached." sem `code`; ER_CON_COUNT_ERROR cobre o limite de
// conexões do servidor. Outros erros continuam 500.
interface ErroPool {
  code?: string
  message?: string
  errno?: number
}

export function ehSaturacaoDePool(erro: unknown): boolean {
  const e = (erro ?? {}) as ErroPool
  const mensagem = String(e.message ?? '')
  return (
    e.code === 'ER_CON_COUNT_ERROR' ||
    e.code === 'ER_TOO_MANY_USER_CONNECTIONS' ||
    /queue limit reached/i.test(mensagem) ||
    /too many connections/i.test(mensagem)
  )
}