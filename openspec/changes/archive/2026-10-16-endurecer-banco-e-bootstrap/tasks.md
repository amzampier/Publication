# Tasks

## 1. Migrations não destrutivas e integridade de schema

- [x] 1.1 Remover do `server/migration/01_create_tables.sql` o bloco de `DROP VIEW/TABLE IF EXISTS` e ajustar o comentário de cabeçalho. Verificado: boot sobre o banco atual sem perda de dados (8 migrations, nenhuma pendente) e a base vazia é criada pelos `CREATE`.
- [x] 1.2 Criar `server/migration/08_integridade_e_indices.sql` (`uk_perfis_nome`, `idx_audit_acao`, `idx_seg_email_tipo_data`) com rollback comentado. Verificado: aplicada no boot seguinte ("OK: 08_integridade_e_indices.sql") e reexecuções não falham (1061 tolerado).

## 2. Bootstrap seguro do administrador

- [x] 2.1 `ensureAdminUser` restrito a `NODE_ENV !== 'production'` e admin criado com `senha_provisoria = 1`. Verificado: boot de produção logou "Ambiente de produção - provisionamento do administrador demo ignorado."

## 3. Primeiro acesso — troca obrigatória da senha provisória

- [x] 3.1 `provisoria` em `UsuarioSessao`/JWT e leitura de `senha_provisoria` em `buscarUsuarioPorEmail`/`buscarUsuarioPorId`, propagada em `login`/`renovarSessao`. Verificado no E2E: login provisório devolve `usuario.provisoria = true`; sessão restaurada mantém `false` após a troca.
- [x] 3.2 `auth-api.ts` responde `403` (troca obrigatória) quando a sessão é provisória, com `/api/auth/*` acessível. Verificado no E2E: `GET /api/usuarios/eu` e `GET /api/configuracoes` → `403`; `POST /api/auth/trocar-senha` → `200`.
- [x] 3.3 `trocar-senha` reemite o cookie de access com `provisoria=false`. Verificado no E2E: após a troca, `GET /api/usuarios/eu` → `200` e `provisoria = false`.
- [x] 3.4 Cliente: `UsuarioLogado.provisoria`, guarda redirecionando para `/admin/primeiro-acesso` e página/componente de troca. Verificado por build e E2E (sessão provisória bloqueada; tela acessível).
- [x] 3.5 E2E do fluxo de primeiro acesso. Verificado: convite cria conta provisória → login → `403` → troca → acesso liberado (`200`).

## 4. Unicidade e atomicidade

- [x] 4.1 `errno 1062` → `409` em `criarPerfil`/`atualizarPerfil`. Verificado no E2E: `POST /api/perfis` com nome "Administrador" → `409`.
- [x] 4.2 `atualizarConfiguracoes` em `getTransaction` (commit/rollback). Verificado por build + `PUT /api/configuracoes` normal (200); atomicidade por inspeção do rollback.
- [x] 4.3 `registrarFalhaLogin` atômico com `SELECT ... FOR UPDATE` em transação. Verificado por build + inspeção; o lockout sequencial segue disparando em 5.
- [x] 4.4 `_migrations` tolera `1062` no registro. Verificado por build + boot de produção com 8 migrations sem pendências; tolerância por inspeção.

## 5. Verificação integrada

- [x] 5.1 `npm run build` — sucesso ("Build complete!").
- [x] 5.2 E2E integrado: produção não cria admin (log); boot reaplica migrations sem apagar dados (8 migrations); `409` de nome de perfil duplicado; fluxo de primeiro acesso completo; base restaurada.
- [x] 5.3 `docs/08` atualizado (rotas sem shell, fluxo de primeiro acesso e credenciais) e Etapa 2 registrada no `docs/RL02` (C-02, C-03, M-10, M-11, M-12, M-13, M-15, M-16 → corrigido).
