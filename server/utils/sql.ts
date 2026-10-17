// server/utils/sql.ts — helpers de SQL (RL05-B-02).
/**
 * Escapa `%`, `_` e `\` para uso literal em `LIKE ?` (o MySQL/MariaDB usa `\`
 * como escape padrão). Sem isto, `?busca=%` vira curinga e varre tudo.
 */
export function escaparLike(termo: string): string {
  return termo.replace(/[\\%_]/g, (c) => `\\${c}`)
}