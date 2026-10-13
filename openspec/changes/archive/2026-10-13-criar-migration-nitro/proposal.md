# Proposal

## Why

O schema do banco foi corrigido e congelado em `docs/bd/01 - banco_dados_mariadb.sql` + `docs/bd/02_seed.sql` (alinhamento SQL ↔ app/docs concluído), mas o projeto ainda é **frontend-only**: não existe `server/` — sem pool de conexões, sem runner de migrations e sem provisionamento automático do banco. Sem essa infraestrutura, nenhuma tela sai da fase demo em memória e a base MariaDB nunca é criada de forma reproduzível.

## What Changes

- Novo diretório `server/` com a infraestrutura mínima de banco descrita no `docs/02` §3.1/§4:
  - `server/utils/db.ts` — pool `mysql2/promise` (`utf8mb4`, `connectionLimit: 10`, `queueLimit: 50`) com `query()` e `getTransaction()`.
  - `server/utils/migration-runner.ts` — `runMigrations()`: cria `_migrations`, resolve o diretório de SQL (dev vs build), divide statements por `;` (removendo comentários), executa cada arquivo em **uma única conexão**, ignora erros idempotentes e registra o que foi executado.
  - `server/plugins/migration.ts` — plugin Nitro que executa as migrations na inicialização, antes da primeira requisição.
  - Bootstrap do administrador inicial: após as migrations, garante o usuário admin com **hash bcrypt real (cost 12)** — o SQL sozinho não gera bcrypt, então o INSERT/hash vive em TypeScript e é idempotente.
- Migrações executáveis: `server/migration/01_create_tables.sql` (derivado de `docs/bd/01`, sem `CREATE DATABASE`, mantendo `USE publications;`) e `server/migration/02_seed.sql` (derivado de `docs/bd/02`, sem o hash placeholder do admin).
- `nuxt.config.ts`: `runtimeConfig` com credenciais `DB_*` e hook Nitro `compiled` que copia `server/migration/` para `.output/server/migration/`.
- `.env.example` (commitado) e `.env` local (gitignored) com `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`.
- Dependências novas: `mysql2`, `bcrypt` (+ `@types/bcrypt` em dev).

Fora do escopo (fases seguintes): rotas de API, auth/login, JWT, `requirePermission`, auditoria, Zod e quaisquer endpoints REST.

## Capabilities

### New Capabilities

- `migracoes-banco`: provisionamento automático do banco na inicialização do servidor — execução idempotente de migrations SQL versionadas, tabelas/seed conforme `docs/bd/01`/`02_seed.sql`, pool de conexões configurado e bootstrap do usuário administrador com bcrypt.

### Modified Capabilities

<!-- Nenhuma capability existente muda de requisito nesta change. -->

## Impact

- **Código novo:** `server/utils/db.ts`, `server/utils/migration-runner.ts`, `server/plugins/migration.ts`, `server/migration/01_create_tables.sql`, `server/migration/02_seed.sql`, `.env.example`.
- **Código modificado:** `nuxt.config.ts` (runtimeConfig `db*` + hook de cópia das migrations no build).
- **Dependências:** + `mysql2` (^3.22.3), + `bcrypt`; + `@types/bcrypt` (dev).
- **Dados:** cria ~18 tabelas + 4 views + seeds (4 perfis, matriz 44 permissões, admin, `config_default`, rate-limit) no banco `publications` — exige MariaDB 11.8 acessível na máquina de dev (`.env`).
- **Não afeta:** frontend, design system, telas demo em memória (continuam funcionando sem banco).
