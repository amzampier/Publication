# Proposal

## Why

O boot de produção (`.output/server/index.mjs`) emite repetidamente o aviso
`Ignoring invalid configuration option passed to Connection: acquireTimeout`. O **mysql2 v3** (3.24.6)
não aceita `acquireTimeout` como opção de conexão — apenas `connectTimeout` existe nos tipos
(`node_modules/mysql2/typings/mysql/lib/Connection.d.ts`). A opção foi adicionada ao `createPool` na
change `desempenho-indices-expurgo-bundle` (RL03 Etapa 4), **não tem efeito hoje** (a espera por
conexão do pool é limitada pelo `queueLimit`), polui o log e, em versões futuras do mysql2, pode
passar a lançar erro. É um resíduo de configuração que precisa ser removido.

## What Changes

- **Remover `acquireTimeout`** do `createPool` em `server/utils/db.ts` (e a leitura de
  `DB_ACQUIRE_TIMEOUT`), mantendo `connectTimeout` (opção válida).
- **Documentar `DB_CONNECT_TIMEOUT`** no `.env.example` (opção real hoje não documentada).
- **Sem `BREAKING`** e **sem migration**: a remoção não altera comportamento observável (a opção era
  ignorada); apenas elimina o aviso e a configuração enganosa.
- **`skip_specs`:** nenhuma capability tem requisito alterado (ajuste de configuração/infra).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

(nenhuma) — a change opta por `skip_specs: true` (configuração de infraestrutura, sem mudança de
comportamento especificado).

## Impact

- **Backend:** `server/utils/db.ts` (pool mysql2).
- **Config:** `.env.example` (documentar `DB_CONNECT_TIMEOUT`).
- **Sem banco/schema:** nenhuma migration.
