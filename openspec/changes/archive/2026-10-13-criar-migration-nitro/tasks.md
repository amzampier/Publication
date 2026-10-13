# Tasks

## 1. Setup de dependências e ambiente

- [x] 1.1 Instalar `mysql2` e `bcrypt` (+ `@types/bcrypt` em dev) e verificar com `npm ls mysql2 bcrypt` que ambos resolvem sem erro
- [x] 1.2 Criar `.env.example` com `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` (default `publications`) documentados e verificar que o `.gitignore` permite commitá-lo (`!.env.example`) — `git status` mostra o arquivo como rastreável
- [x] 1.3 Criar `.env` local com as credenciais do MariaDB de dev e verificar que NÃO aparece em `git status` (gitignored)
- [x] 1.4 Estender `nuxt.config.ts` com `runtimeConfig` (`dbHost/dbPort/dbUser/dbPassword/dbName` lidos de `DB_*`, default `publications`) e verificar que `npm run build` continua verde com a configuração nova

## 2. Pool de conexões (`server/utils/db.ts`)

- [x] 2.1 Implementar `server/utils/db.ts` conforme docs/02 §3.1 — pool lazy `mysql2/promise` com `charset: 'utf8mb4'`, `connectionLimit: 10`, `queueLimit: 50`, SSL condicional (`DB_SSL`), exports `getDbPool()`, `query()` e `getTransaction()` (commit/rollback/release) — verificar que `npm run build` compila o arquivo do server sem erro

## 3. Arquivos de migration executável

- [x] 3.1 Criar `server/migration/01_create_tables.sql` a partir de `docs/bd/01 - banco_dados_mariadb.sql`: remover o bloco `CREATE DATABASE` (manter `USE publications;`), adicionar cabeçalho com comentário de origem e bloco `-- REVERTER (ROLLBACK)` comentado — verificar que o arquivo tem 18 `CREATE TABLE`, 4 `CREATE VIEW`, zero `CREATE DATABASE` e zero menções a `_migrations`
- [x] 3.2 Criar `server/migration/02_seed.sql` a partir de `docs/bd/02_seed.sql`: remover o `INSERT INTO usuarios` (admin passa a ser bootstrap em TS, design decisão 3), manter perfis/matriz/configs com cabeçalho de origem e rollback comentado — verificar que há 4 INSERT de `perfis_acesso`, 44 de `permissoes_perfil` (2 contando as linhas de perfil: 4+44 = 48 matches do padrão de id), 1 de `configuracoes_globais`, 1 de `configuracoes_limite_requisicao` e zero INSERT em `usuarios`

## 4. Runner de migrations (`server/utils/migration-runner.ts`)

- [x] 4.1 Implementar `runMigrations()` conforme docs/02 §4.3 e design: criação de `_migrations` (IF NOT EXISTS), `resolveMigrationDir()` com caminhos candidatos dev/build, listagem e filtro de pendentes, `splitStatements()` (remove `/* */`, linhas `--`, quebra por `;`), execução de cada arquivo em **uma única conexão**, tolerância aos erros `1050/1060/1061/1062/150/1215/1005`, registro do arquivo no sucesso e log fail-fast (arquivo + statement + errno) no erro fatal — verificar que `npm run build` compila e que o export `runMigrations` existe

## 5. Plugin Nitro e bootstrap do administrador

- [x] 5.1 Implementar `server/plugins/migration.ts` (`defineNitroPlugin` com await de `runMigrations()`) e o bootstrap idempotente do admin em TS: se `ana.carolina@empresa.com.br` não existir, INSERT com perfil Administrador, situação Ativo, `senha_provisoria = 0` e hash `bcrypt` cost 12 de `Public@2026`; se existir, não tocar — verificar `npm run build` verde
- [x] 5.2 Atualizar o gotcha de `.env` em `AGENTS.md` ("no environment variables are read anywhere yet" está obsoleto) para documentar `DB_*` + exigência de MariaDB 11.8 no dev — verificar que o texto novo condiz com o estado do repositório

## 6. Cópia das migrations no build

- [x] 6.1 Adicionar o hook `nitro.hooks.compiled` no `nuxt.config.ts` (docs/02 §4.4) copiando `server/migration/` para `.output/server/migration/` e verificar após `npm run build` que `.output/server/migration/01_create_tables.sql` e `02_seed.sql` existem (se o path do hook divergir no Nuxt 4, ajustar para `nitro.options.serverDir` e revalidar)

## 7. Verificação de integração (MariaDB de dev required)

- [x] 7.1 Subir `npm run dev` com MariaDB acessível e verificar o provisionamento de uma base vazia: `SELECT COUNT(*) FROM _migrations` = 2, ~18 tabelas + 4 views presentes, 4 perfis Ativo, 44 linhas em `permissoes_perfil` com totais 99/45/21/6, exatamente 1 linha `config_default` e 1 `rate_limit_default`
- [x] 7.2 Reiniciar o dev server e verificar a idempotência: nenhum registro novo em `_migrations`, seeds não duplicados, log de boot sem erros
- [x] 7.3 Verificar o hash do admin com `compareSync('Public@2026', hash_senha)` verdadeiro e `senha_provisoria = 0`
- [x] 7.4 Rodar `npm run build`, criar um banco descartável vazio (ex.: `publications_test` via `.env` temporário), subir `node .output/server/index.mjs` e verificar que as migrations rodam do `.output/server/migration/` e provisionam o banco novo; encerrar e restaurar o `.env`
