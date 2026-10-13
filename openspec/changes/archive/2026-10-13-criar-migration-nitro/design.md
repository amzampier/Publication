# Design

## Context

O projeto é Nuxt 4.5.2 frontend-only: não existe `server/`, nem `mysql2` no `package.json`, nem `.env`. O schema alvo está congelado em `docs/bd/01 - banco_dados_mariadb.sql` (18 tabelas + 4 views) e `docs/bd/02_seed.sql` (4 perfis, matriz 44 permissões, admin, configs), com as convenções de runner descritas no `docs/02` §4 e o pool exemplificado no §3.1. O Nuxt 4 já usa `app/` como srcDir por padrão; `server/` será o serverDir padrão ao criar a pasta. Ver proposal.md para motivação e specs/migracoes-banco para os requisitos.

## Goals / Non-Goals

**Goals:**
- Boot do servidor provisiona o banco vazio até o estado do `docs/bd/01` + seeds, de forma idempotente e versionada.
- Pool `mysql2/promise` utf8mb4 com `query()` e `getTransaction()` prontos para as próximas changes (API/auth).
- Build de produção carrega os `.sql` junto do bundle Nitro.

**Non-Goals:**
- Rotas de API, auth/login, JWT, `requirePermission`, Zod, auditoria, rate-limit middleware (changes futuras).
- Gerenciamento de schema evolutivo além do runner (ex.: `migrate:down` automático — rollback permanece manual/comentado, convenção docs/02 §4.5).
- Sincronizar automaticamente `docs/bd/*` ↔ `server/migration/*` (cópias com comentário de origem; tooling futuro se valer a pena).
- Alterar requisitos de capabilities existentes (ex.: referências de nomes em `openspec/specs/perfis-acesso` — fica para sync futuro).

## Decisions

1. **Um arquivo de migration = uma única conexão.** O runner adquire uma conexão do pool e executa todos os statements do arquivo nela. Rationale: estado de sessão permanece consistente durante o arquivo inteiro. O pool já conecta no banco selecionado por `DB_NAME`; por isso os `.sql` executáveis **não contêm `USE`** — um `USE publications` hardcoded ignoraria a configuração de outro banco (cenário da spec de `DB_*`) e apontaria as migrations para o banco errado (bug encontrado na integração 7.4 e corrigido). `docs/bd/*` mantém o `USE` para execução manual via cliente SQL (convenção docs/02 §4.5).

2. **`server/migration/` é a cópia executável; `docs/bd/` é a referência humana.** `01_create_tables.sql` deriva de `docs/bd/01` **sem o bloco `CREATE DATABASE` e sem o `USE`** (o usuário app em produção não deve ter privilégio de criar bancos; o banco é selecionado pelo pool via `DB_NAME`). `02_seed.sql` deriva de `docs/bd/02` **sem o INSERT do admin e sem o `USE`** (ver decisão 3). Ambos os arquivos carregam comentário de origem apontando `docs/bd/`.

3. **Bootstrap do admin em TypeScript, não em SQL.** MariaDB não gera bcrypt; o runner/plugin (Node) tem `bcrypt` disponível. Após as migrations, um passo idempotente verifica `ana.carolina@empresa.com.br` e, se ausente, insere com `hash(SENHA_DEMO, cost 12)`. Alternativas descartadas: placeholder no SQL (login real falharia); trigger/UDF de hash (complexidade e porta de segurança desnecessária). Idempotência: `SELECT` antes de `INSERT` — admin existente (mesmo com hash trocado pelo usuário) nunca é sobrescrito.

4. **Erro fatal = fail-fast.** Erro fora da lista de tolerância aborta o arquivo, loga arquivo + statement + código MariaDB e o plugin propaga (o boot falha). Alternativa descartada: logar e continuar servindo — geraria 500s confusos em toda chamada de banco, mascarando a causa raiz. Em dev, a mensagem orienta a subir o MariaDB/ajustar o `.env`.

5. **Tolerância a erros idempotentes.** Códigos aceitos conforme docs/02 §4.3: `1060` (coluna existe), `1061` (índice existe), `1062` (registro duplicado), `150`/`1215`/`1005` (FK), **mais `1050` (tabela existe)** — acréscimo defensivo à lista do docs/02, já que re-execução parcial pode encontrar tabela criada sem registro em `_migrations`. Qualquer outro código aborta (decisão 4).

6. **Parser de SQL simples e convenção rígida.** `splitStatements` remove blocos `/* */`, remove linhas `--` e quebra por `;`. Os arquivos atuais não têm `;` em literais; a convenção (docs/02 §4.5) passa a proibir `;` dentro de strings em migrations deste projeto. Alternativa descartada para agora: parser SQL completo (overkill; reavaliar se surgir trigger/procedimento).

7. **Pool conforme docs/02 §3.1, charset `utf8mb4` explícito.** `mysql2` default é `latin1` — o charset no createPool é obrigatório para os acentos do PT-BR. `connectionLimit: 10`, `queueLimit: 50`, `waitForConnections: true`. SSL condicional via `DB_SSL` (produção). Runtime config só com `DB_*` agora; `jwtSecret`/`jwtRefreshSecret` entram na change de auth (evita config fantasma sem consumo).

8. **Plugin Nitro síncrono no boot.** `defineNitroPlugin` chama `runMigrations()` (await) — migrations terminam antes da primeira requisição. Mesmo padrão do docs/02 §4.2.

9. **Cópia dos `.sql` no build via hook `nitro:hooks:compiled`** (docs/02 §4.4): `server/migration/` → `.output/server/migration/`. O `resolveMigrationDir()` testa caminhos candidatos (dev: relativo ao cwd; produção: relativo a `.output/server/`) — cobre Windows/Linux/Docker.

10. **bcrypt nativo, com fallback documentado.** Docs/02 manda `bcrypt` (nativo, cost 12). Risco de build nativo no Windows (node-gyp) → se `npm i bcrypt` falhar na máquina, trocar por `bcryptjs` (API praticamente idempotente: `hashSync`/`compareSync`) sem mudar requisitos. A spec fixa o custo 12, não a biblioteca.

## Risks / Trade-offs

- **MariaDB indisponível no dev** → boot falha com mensagem clara (fail-fast); `.env.example` documenta os passos (subir MariaDB 11.8, criar `.env`). Mitigação de UX: mensagem citar `docs/02` §Passo 3.
- **Build nativo do `bcrypt` falha no Windows** → fallback `bcryptjs` (decisão 10); API de hash idempotente para o custo 12.
- **Hook `compiled` pode apontar path errado no Nuxt 4** (`nitro.options.srcDir` vs `serverDir`) → task de verificação pós-build confere `.output/server/migration/*.sql`; se o path divergir, usar `nitro.options.serverDir`.
- **Duplicação `docs/bd/*` ↔ `server/migration/*`** → comentários de origem em ambos os cabeçalhos; mudança de schema no futuro deve editar `docs/bd` e republicar em `server/migration` (ou extrair tooling quando valer).
- **Splitter `;` ingênuo** → convenção proíbe `;` em literais (decisão 6); se um dia precisar de triggers, trocar por split comentando strings.
- **Senha provisória `Public@2026` no repo** → é a senha demo documentada (docs/08/qa); o primeiro login real (change de auth) deverá exigir troca — `senha_provisoria` já existe no schema para isso.

## Migration Plan

1. Deploy = subir a aplicação com `.env` apontando ao MariaDB alvo (dev local ou produção). O boot aplica tudo automaticamente — sem passo manual de SQL.
2. Verificação: `SELECT COUNT(*) FROM _migrations` (= 2), tabelas/views presentes, `config_default` única, login bcrypt do admin conferido via `compareSync`.
3. Rollback: manual, usando os blocos `-- REVERTER (ROLLBACK)` comentados ao final de cada `.sql` + `DELETE FROM _migrations WHERE nome = '...'` (convenção docs/02 §4.5). Não há downgrade automático nesta fase.
4. Rollforward seguro: correções entram como `03_*.sql` nova — nunca editar `01`/`02` já executadas (docs/qa/03).
