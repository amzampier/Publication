# Proposal

## Why

O projeto passou a carregar um script de provisionamento de usuário de banco (`scripts/db-least-privilege.sql`, que cria `publications_app`) e instruções de "menor privilégio" em `.env.example`/docs, sem que a criação de usuários no MariaDB tenha sido autorizada. Além disso, esse script concede apenas DML + `EVENT`, mas o runner de migrations executa DDL no boot com o mesmo pool — contradição que motivou a ideia de uma conta separada de migração (`DB_MIGRATION_*`). Essa conta não existe no código nem no banco local, e o operador já fornece a conta correta em `DB_USER`/`DB_PASSWORD`.

## What Changes

- Remover `scripts/db-least-privilege.sql` — único artefato do repositório que cria/ajusta usuário e grants no MariaDB.
- Neutralizar `.env.example`: `DB_USER` deixa de sugerir `publications_app` e a seção deixa de orientar a criação de usuário/execução do script.
- Atualizar `docs/02` e `docs/18` para remover o procedimento de menor privilégio e registrar a política: a conta de banco é fornecida pelo operador; a aplicação nunca cria usuários, altera senhas ou concede/revoga privilégios.
- Não introduzir nem ler `DB_MIGRATION_USER`/`DB_MIGRATION_PASSWORD` (ou qualquer conta separada de migração): o pool e o runner continuam usando exclusivamente `DB_*`.
- Deixar explícito que a conta única do `.env` precisa das permissões necessárias para o que o boot executa — inclusive DDL, porque `runMigrations()` roda `CREATE TABLE`/`ALTER TABLE` na inicialização.
- Limpeza operacional (fora do código): remover `DB_MIGRATION_*` de ambientes onde existirem, dropar `publications_migration`/`publications_app` se tiverem sido criados e rotacionar a senha exposta.
- Preservar `docs/RL0x` e `openspec/changes/archive/**` como registro histórico; eles não serão reescritos.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `migracoes-banco`: novo requisito de que o provisionamento de usuário/grants é responsabilidade do operador e a aplicação não cria nem altera contas de banco; esclarecimento de que a conexão e as migrations usam uma única conta `DB_*` e que essa conta deve poder executar as instruções do boot.

## Impact

- Arquivos: `scripts/db-least-privilege.sql` (remoção), `.env.example`, `docs/02 - Guia de Arquitetura e Migrations.md`, `docs/18 - Produção.md`; avaliar menção em `AGENTS.md`.
- Código de runtime: sem alteração. `nuxt.config.ts`, `server/utils/db.ts` e `server/utils/migration-runner.ts` continuam lendo apenas `DB_*`.
- Schema/migrations: nenhuma migration nova.
- Operação: limpeza de variáveis/contas em ambientes já provisionados e rotação de segredo.
- Testes/gates: nenhum teste depende do script; rodar `lint`, `test`, `typecheck` e `build` por segurança.
