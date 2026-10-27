# Tasks

## 1. Remover o provisionamento de usuário do repositório

- [x] 1.1 Excluir `scripts/db-least-privilege.sql` e verificar que o caminho não existe mais e que nenhum script/npm script o referencia
- [x] 1.2 Ajustar `.env.example`: usar placeholder neutro em `DB_USER`, remover a orientação de "menor privilégio" e a menção ao script; verificar que o arquivo não contém `publications_app` nem `db-least-privilege`
- [x] 1.3 Atualizar `docs/02 - Guia de Arquitetura e Migrations.md`: remover a nota de menor privilégio e o parágrafo de grants do script; registrar que a conta é fornecida pelo operador, que a aplicação não cria usuários/grants e que a conta precisa de DDL para migrations pendentes; verificar por busca que as referências antigas sumiram
- [x] 1.4 Atualizar `docs/18 - Produção.md`: substituir a seção "Banco de dados (menor privilégio)" por checklist neutro de conexão/verificação e remover `publications_app`; verificar que a seção não instrui `CREATE USER`/`GRANT`
- [x] 1.5 Revisar `AGENTS.md` e demais documentos vivos por menção ao provisionamento e ajustar se existir; verificar por busca que não restou instrução ativa

## 2. Coerência do contrato de conexão

- [x] 2.1 Confirmar que o runtime lê apenas `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` e que não há leitura de `DB_MIGRATION_*`; verificar com busca em `nuxt.config.ts`, `server/` e `shared/`
- [x] 2.2 Confirmar que pool e runner compartilham a mesma conta (`getDbPool()` em `server/utils/db.ts` e `server/utils/migration-runner.ts`); verificar que não existe criação de segundo pool com credenciais de migração
- [x] 2.3 Buscar referências vivas restantes a `publications_app`, `publications_migration`, `db-least-privilege` e `DB_MIGRATION` fora de `docs/RL0x` e `openspec/changes/archive/**`; verificar que o resultado é vazio

## 3. Limpeza operacional dos ambientes já provisionados

- [x] 3.1 Remover `DB_MIGRATION_USER`/`DB_MIGRATION_PASSWORD` (e equivalentes `NUXT_DB_MIGRATION_*`) do `.env` de cada ambiente; verificar que a busca por `DB_MIGRATION` no ambiente não retorna nada
- [x] 3.2 Dropar `publications_migration` e `publications_app` onde existirem, após backup/confirmação do operador; verificar com `SELECT User, Host FROM mysql.user WHERE User LIKE 'publica%'` que não sobraram contas indesejadas
- [x] 3.3 Rotacionar a senha que foi exposta e confirmar que a credencial antiga não autentica mais (ou que o usuário correspondente não existe)

## 4. Verificação final

- [x] 4.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; verificar que todos terminam sem erro
- [x] 4.2 Revisar os arquivos alterados e confirmar ausência de segredos e de instruções de criação de usuário; verificar o diff/lista final de mudanças
- [x] 4.3 Rodar `openspec validate "remover-provisionamento-usuario-banco" --type change --strict` e `openspec validate --specs`; verificar que ambos passam
