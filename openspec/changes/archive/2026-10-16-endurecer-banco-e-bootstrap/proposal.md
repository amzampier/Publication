# Proposal

## Why

A auditoria RL02 (Etapa 2) apontou riscos de integridade e de provisionamento no banco/bootstrap: a migration `01` executa `DROP TABLE` de todo o schema antes de recriar (Crítico **C-02**), o administrador demo é criado automaticamente em **qualquer** ambiente com senha fixa e sem troca obrigatória (Crítico **C-03**), e há falhas de atomicidade/robustez (unicidade de nome de perfil, update de configurações em duas tabelas, lockout não atômico, registro em `_migrations` não resiliente) além de índices ausentes que degradam filtros. Corrigir isso é pré-requisito para qualquer implantação que não seja destrutiva nem deixe uma credencial conhecida ativa.

## What Changes

- **Migrations não destrutivas (C-02):** remover os `DROP VIEW/TABLE IF EXISTS` do `server/migration/01_create_tables.sql`; a base vazia passa a ser criada apenas por `CREATE TABLE` (o arquivo começará a usar `CREATE TABLE IF NOT EXISTS` onde necessário).
- **Bootstrap seguro e troca no 1º acesso (C-03):** o provisionamento automático do administrador demo passa a ocorrer **somente em ambiente de demonstração/desenvolvimento** (`NODE_ENV !== 'production'`) e o admin nasce com `senha_provisoria = 1`; ao logar com a senha provisória, o usuário fica **obrigado a definir uma nova senha** antes de usar a Área Administrativa — as APIs administrativas respondem `403` (com motivo próprio) até a troca, e o cliente redireciona para uma tela dedicada `/admin/primeiro-acesso`.
- **Unicidade de nome de perfil (M-10):** nova migration adiciona `UNIQUE` em `perfis_acesso.nome_perfil`; criar/renomear para um nome existente responde `409`.
- **Atomicidade e robustez:** `PUT /api/configuracoes` passa a gravar as duas tabelas em transação (M-11); o lockout incrementa falhas de forma atômica com `FOR UPDATE` (M-12); o registro em `_migrations` tolera a corrida de `1062` em vez de abortar o boot (M-13).
- **Índices (M-15/M-16):** nova migration adiciona `auditoria(acao)` e `seguranca_eventos_login(email_alvo, tipo, ocorrido_em)`.
- **BREAKING:** a credencial demo `Public@2026` deixa de conceder acesso pleno — o primeiro login exige a troca da senha provisória; e o administrador **não** é criado automaticamente em produção.

## Capabilities

### New Capabilities
- `primeiro-acesso`: fluxo de troca obrigatória da senha provisória no primeiro login — sinalização pela sessão, bloqueio das APIs administrativas com `403` até a troca, tela dedicada de definição da nova senha e liberação do acesso após a troca.

### Modified Capabilities
- `migracoes-banco`: migrations não destrutivas; bootstrap do administrador restrito a ambiente de demonstração e criado com senha provisória; registro de `_migrations` resiliente a corrida.
- `perfis-acesso`: o nome do perfil passa a ser único (criação/edição com nome já existente responde `409`).
- `configuracoes-globais`: a gravação das configurações passa a ser atômica entre as tabelas (sem estado parcial em caso de falha).

## Impact

- **Arquivos de migration:** `01_create_tables.sql` (remoção dos `DROP`); nova `08_*.sql` (UNIQUE de perfil, índices de auditoria/segurança).
- **Backend:** `server/utils/bootstrap-admin.ts`, `server/plugins/migration.ts`, `server/utils/migration-runner.ts`, `server/utils/auth.ts` (claim `provisoria` na sessão/token), `server/middleware/auth-api.ts` (bloqueio `403` do acesso provisório), `server/api/auth/login` + `esqueci-senha`/`convite` (senha provisória), `server/api/auth/trocar-senha` (limpa a flag e reemite o token), `server/utils/configuracoes.ts` (transação), `server/utils/usuarios.ts`/`perfis.ts` (409 de unicidade).
- **Frontend:** `app/composables/useAuth.ts` (estado `provisoria`), `app/middleware/auth.global.ts` (redireciono forçado), nova página `app/pages/admin/primeiro-acesso.vue` (layout de autenticação), `app/components/auth/*`.
- **Contratos HTTP:** novo `409` em criação/edição de perfil com nome duplicado; novo `403` com motivo de troca obrigatória nas APIs administrativas enquanto a senha for provisória.
- **Documentação:** `docs/08` (credencial demo e fluxo de primeiro acesso) e `docs/RL02` (Etapa 2).
- **Dependências:** nenhuma nova.
