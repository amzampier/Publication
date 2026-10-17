# Tasks

> Não há runner de testes no repositório; verificação por `npm run build`, `EXPLAIN` no MariaDB e E2E
> no dev server. Escopo comportamento-preservante (skip_specs): nenhuma spec muda.

## 1. Migration e índices (D1/D2)

- [x] 1.1 Criar `server/migration/12_indices_seguranca.sql` (aditiva e idempotente) com `idx_usuarios_bloqueado_ate` em `usuarios (bloqueado_ate)` e, se ausente, `idx_audit_usuario` em `auditoria (usuario_nome)`; incluir o bloco de rollback documentado. Verificar que o boot aplica a migration e que `EXPLAIN` da aba Segurança passa a usar índice.
- [x] 1.2 Confirmar por `EXPLAIN` que o agregado de auditoria (`COUNT(DISTINCT usuario_nome)`) usa índice.

## 2. Consultas (D2/D3/D4)

- [x] 2.1 Em `server/utils/audit.ts`, separar o agregado em `COUNT(*)` + `COUNT(DISTINCT usuario_nome)` (KPIs idênticos). Verificar E2E: KPIs da auditoria inalterados.
- [x] 2.2 Introduzir cache em memória de TTL curto para as `opcoes` (Usuários e Auditoria) e usá-lo em `listarUsuarios`/`listarAuditoria`. Verificar que a listagem não dispara os 2 `DISTINCT` a cada chamada.
- [x] 2.3 Reduzir o paralelismo por listagem (limitar conexões simultâneas) em `listarUsuarios`/`listarAuditoria`. Verificar que os resultados/KPIs permanecem idênticos.

## 3. Escritas e infra (D6/D7/D8/D9)

- [x] 3.1 Em `server/utils/audit.ts`, agendar o INSERT de `registrarAuditoria` via `event.waitUntil` (fallback: aguardar), mantendo o `try/catch`. Verificar E2E: escritas continuam gerando trilha e a resposta não regride.
- [x] 3.2 Em `server/utils/mailer.ts`, adicionar `signal: AbortSignal.timeout(...)` ao `$fetch` (env `MAIL_TIMEOUT_MS`, default 10 s). Verificar por inspeção.
- [x] 3.3 Em `server/utils/db.ts`, adicionar `timezone: process.env.DB_TIMEZONE || 'local'` e documentar a env. Verificar que os horários permanecem inalterados com o default.
- [x] 3.4 Em `server/utils/expurgo.ts`, criar `executarExpurgo()` (mesmos `DELETE` dos eventos) e chamá-la uma vez no boot após `garantirEventScheduler`. Verificar que sessões expiradas são removidas no boot.

## 4. Listagem enxuta + detalhe por id (D5)

- [x] 4.1 Em `server/utils/usuarios.ts`, projetar na listagem apenas as colunas exibidas (`id`, `nome`, `email`, `perfil`, `situacao`, `ultimo_login`). Verificar o payload.
- [x] 4.2 Criar `server/api/usuarios/[id]/index.get.ts` (`gestao-usuarios/visualizar`) devolvendo o registro completo (`buscarUsuarioTelaPorId`). Verificar E2E: `GET /api/usuarios/:id` → `200` (admin) / `403` (sem permissão) / `404` (inexistente).
- [x] 4.3 Em `app/components/usuarios/useUsuarios.ts`/`Formulario.vue`, buscar o detalhe por id ao abrir a edição (o modal exibe os mesmos campos). Verificar E2E/inspeção.

## 5. Integração, regressão e documentação

- [x] 5.1 Rodar `npm run build` e confirmar sucesso.
- [x] 5.2 Regressão: listagem/KPIs/opções de Usuários e Auditoria idênticos; exportação e busca inalteradas; edição de usuário abre com endereço/SMTP/avatar; aba Segurança exibe as contas corretas.
- [x] 5.3 Documentar em `docs/02` (índice, timezone, expurgo catch-up) e `docs/RL04` (Etapa 4 — itens M-10/M-11/M-14/M-15/M-16/B-23/B-25/B-26 e OBS-05) o status; registrar as observações OBS-02/03/06/07.
- [x] 5.4 Confirmar que a change é comportamento-preservante (`skip_specs`), que `docs/RL04` reflete o escopo e que `openspec validate otimizar-desempenho-e-banco` passa.