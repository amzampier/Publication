# Tasks

> Change `skip_specs` (refatoração de tipos, sem mudança de comportamento). Verificação por
> `npm run typecheck` (alvo 0), `npm run lint`, `npm run test` e `npm run build`.

## 1. server/utils — núcleo

- [x] 1.1 `server/utils/usuarios.ts` (72 erros): tipar as linhas de `query`/`tx.query` e os retornos; narrowing de `null`; ajustar índice (`arr[0]`). Verificar redução no `typecheck` sem alterar comportamento.
- [x] 1.2 `server/utils/perfis.ts` (34): idem (linhas de `permissoes_perfil`/`perfis_acesso`, matrizes).
- [x] 1.3 `server/utils/auth.ts` (22): tipar payload JWT/linhas de `sessoes`/`usuarios`.
- [x] 1.4 Demais `server/utils/*` (`configuracoes`, `seguranca`, `rateLimit`, `mailer`, `audit`, `expurgo`, `crypto`, `uploads`, `migration-runner`, `db`, `bootstrap-admin`) — zerar os erros restantes.

## 2. server/api e shared

- [x] 2.1 `server/api/**` (ex.: `convite`, `usuarios`, `perfis`, `auth`, `configuracoes`, `seguranca`, `uploads`) — tipar bodies/retornos.
- [x] 2.2 `shared/utils/emails.ts` (~6) — tipar parâmetros/retornos.

## 3. app (frontend)

- [x] 3.1 `app/components/**` (`configuracoes/AbaSidebar`, `perfil/Avatar`, `usuarios/Formulario`, `usuarios/Importar`, etc.) — tipar props/slots/refs e casts seguros.
- [x] 3.2 `app/composables/**` e `app/pages/**` — zerar erros restantes.
- [x] 3.3 `nuxt.config.ts` (ex.: `loadingIndicator`) — ajustar a tipagem da configuração.

## 4. Integração e fechamento

- [x] 4.1 Confirmar `npm run typecheck` **0 erros**; `npm run lint` e `npm run test` verdes; `npm run build` OK.
- [x] 4.2 Atualizar `AGENTS.md` (typecheck passa a **gate**) e `docs/RL04` (dívida de tipos zerada).
- [x] 4.3 Confirmar `openspec validate corrigir-erros-de-tipo` (skip_specs) e `openspec validate --specs` (30/30).