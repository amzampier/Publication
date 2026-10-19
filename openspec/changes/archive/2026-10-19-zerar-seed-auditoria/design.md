# Design: zerar-seed-auditoria

## Context

Ver `proposal.md - Why`. Estado atual relevante:

- A trilha é alimentada exclusivamente por `registrarAuditoria` (`server/utils/audit.ts`), que grava `id = UUID()` — ids reais têm 36 caracteres, sem colisão com o prefixo reservado `log-seed-`.
- As migrations `07_seed_auditoria.sql` e `13_reconciliar_seed_e_indice.sql` inserem 25 linhas `log-seed-001…025` (a `13` existe só para reconciliar drift da `07` no padrão do RL05-M-05).
- O runner (`server/utils/migration-runner.ts`) aplica os arquivos em ordem alfabética, tolera erros idempotentes e registra cada arquivo em `_migrations` (por nome, sem hash de conteúdo).
- Convenção vigente (`docs/qa/03`): **nunca editar migration já executada**. Migrations já aplicadas não são re-executadas pelo runner.
- `GET /api/auditoria` e a página `/admin/auditoria` já tratam o conjunto vazio (tabela vazia + KPIs zerados); nenhum ajuste de UI/API é necessário.

## Goals / Non-Goals

**Goals:**
- Um banco provisionado do zero termina com `auditoria` vazia (0 registros).
- Bancos já provisionados são reconciliados: as 25 linhas `log-seed-%` são removidas sem tocar nenhum registro real.
- Preservar a imutabilidade das migrations já executadas e a idempotência do runner.

**Non-Goals:**
- Alterar `GET /api/auditoria`, componentes ou o estado vazio da página (já corretos).
- Remover/reescrever as migrations `07` e `13` (a `13` continua responsável pelo índice `idx_usuarios_tentativas_falhas`).
- Criar seed de demonstração em qualquer outra forma.

## Decisions

### D1 — Corrigir por migration nova (`18_remover_seed_auditoria.sql`), sem editar `07`/`13`
Uma migration `18` com `DELETE FROM auditoria WHERE id LIKE 'log-seed-%'` roda por último (ordem alfabética) e zera a trilha tanto em banco novo (após o `INSERT` das `07`/`13`) quanto em banco existente (purga o seed já aplicado).

- **Por que não editar `07`/`13`:** violaria a convenção *nunca editar migration já executada* (`docs/qa/03`) e tornaria o histórico inconsistente com `_migrations`; o próprio projeto resolveu um caso análogo adicionando a `13` em vez de editar a `07`.
- **Alternativa descartada:** editar `07`/`13` para remover os `INSERT`. Evita o ciclo insert→delete em banco novo, mas quebra a convenção e não reconciliaria bancos onde a `07` já está registrada (o runner não a reexecuta).
- **Trade-off aceito:** em banco novo as `07`/`13` ainda inserem o seed por um instante durante o boot; a `18` o remove antes da primeira requisição (o plugin é síncrono no boot — `server/plugins/migration.ts`).

### D2 — `DELETE` escopado por prefixo, não `TRUNCATE`
`WHERE id LIKE 'log-seed-%'` é o alvo exato do seed. Preserva operações reais e mantém a idempotência natural (reexecução apaga 0 linhas). `TRUNCATE` apagaria a trilha real — descartado.

### D3 — Sem mudança de schema/spec do formato
A migration é aditiva e não altera tabelas. A spec `migracoes-banco` é ajustada apenas para (a) declarar a `auditoria` sem seed e (b) tornar explícito que uma correção escopada por `DELETE` é permitida, mantendo a proibição de `DROP TABLE`/`VIEW`/`DATABASE`.

## Risks / Trade-offs

- [Em banco novo o seed existe momentaneamente entre a `07` e a `18`] → Inofensivo: as migrations terminam antes de o servidor atender requisições (boot fail-fast síncrono); nenhuma trilha é servida nesse intervalo.
- [`DELETE` remover registro real por engano] → Ids reais são `UUID()` (`audit.ts:146`), sem prefixo `log-seed-`; o filtro é restrito e documentado.
- [Drift de documentação sobre o seed] → Atualizar `docs/05 §7` e a verificação (§12) e conferir referências cruzadas (`docs/02`); o item RL05-M-05 deixa de se aplicar.
- [Migration `13` sem função de dados] → Intencional: ela permanece pelo `CREATE INDEX idx_usuarios_tentativas_falhas`; o `INSERT IGNORE` torna-se inócuo após a `18`.

## Migration Plan

1. Adicionar `server/migration/18_remover_seed_auditoria.sql` (com bloco de rollback comentado conforme `docs/02 §4.5`).
2. Boot de dev: o runner aplica a `18` e registra em `_migrations`.
3. Verificar no banco: `SELECT COUNT(*) FROM auditoria WHERE id LIKE 'log-seed-%'` = `0`; em banco novo, `SELECT COUNT(*) FROM auditoria` = `0`.
4. **Rollback:** reexecutar o seed não é desejado; o bloco de rollback apenas documenta que a limpeza não deve ser revertida (comentar `DELETE FROM _migrations WHERE nome = '18_remover_seed_auditoria.sql'` se necessário reaplicar).
