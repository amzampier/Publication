# Proposal

## Why

O I-02 do RL06 ainda tem duas pendências de performance: cada página `/admin` dispara três ou mais chamadas SSR que validam a sessão separadamente (auth, shell, permissões e avatar), e as opções de Lançar as Chamadas são enviadas inteiras ao cliente. A primeira aumenta consultas e latência por página; a segunda cresce com o catálogo. Além disso, o M-07 foi aceito como risco operacional no ambiente de desenvolvimento e precisa ficar registrado junto do fechamento do RL06.

## What Changes

- **SSR (7.2):** criar `GET /api/auth/contexto` (session-only) devolvendo `{ usuario, shell, permissoes, avatar }` e um composable `useBootstrap()` com single-flight por request. `auth.global`, layout admin, `usePermissions`, `carregarShell` e `useAvatarUsuario` passam a reutilizar o mesmo estado, reduzindo a **1 validação de sessão por página**.
- **Opções remotas (7.3):** evoluir `GET /api/lancar-chamadas/opcoes` para busca por catálogo (`tipo`, `q`, `limite`), com campos mínimos, limite e cache apenas da primeira página; adicionar modo remoto opcional ao `UiSelect` e ao `UiMultiSelect`; migrar filtros e formulário de Chamadas para carregar opções sob demanda.
- **M-07 (risco aceito):** registrar no RL06 e em `docs/02` que a conta de banco do ambiente de desenvolvimento é do operador, pode ter privilégios amplos, e o projeto não cria usuários nem altera grants; em produção o operador deve provisionar a conta e o mínimo privilégio.
- Nenhuma alteração de schema, migrations ou dados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `design-system/form-control-states`: novo requisito de busca remota opcional no `UiSelect`, preservando o modo local como padrão.
- `design-system/multi-select`: novo requisito de busca remota opcional no `UiMultiSelect`, preservando chips, seleção e o modo local.

## Impact

- Servidor: `server/api/auth/contexto/index.get.ts` (novo), `server/api/lancar-chamadas/opcoes.get.ts`, `server/utils/lancar-chamadas.ts`, `server/utils/permission.ts`/`configuracoes.ts` (reuso).
- Cliente: `app/composables/useBootstrap.ts` (novo), `useAuth.ts`, `auth.global.ts`, `layouts/admin.vue`, `usePermissions.ts`, `useConfiguracoesGlobais.ts`, `useAvatarUsuario.ts`, `ui/Select.vue`, `ui/MultiSelect.vue`, `lancar-chamadas/Filtros.vue`, `lancar-chamadas/Formulario.vue`, `useLancarChamadasModelo.ts`.
- Docs/design system: `docs/01`, `docs/02`, `app/pages/design.vue`, `docs/RL06 - Relatório Completo Final Area Administrativa.md`.
- Testes: unidade do endpoint bootstrap/opções, componente de busca remota, SSR (1 chamada), E2E de login/provisional/RBAC/filtros.
- Sem mudança de banco/schema.
