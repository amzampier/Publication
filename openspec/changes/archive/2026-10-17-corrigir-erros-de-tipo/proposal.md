# Proposal

## Why

O `npm run typecheck` (`nuxt typecheck`, estrito) acusa **208 erros de tipo pré-existentes** em 30 arquivos — nenhum introduzido pelas changes recentes. São majoritariamente `unknown`/`possibly undefined` resultantes do uso de `query<T = any>` (rows sem tipo) e do modo estrito do Nuxt (`strict` + `noUncheckedIndexedAccess`), espalhados por `server/utils/*` (usuarios 72, perfis 34, auth 22…) e alguns `.vue`. Por isso o `typecheck` ainda não serve como gate. Esta change zera esse baseline **sem alterar comportamento**.

## What Changes

- **Tipagem das consultas e linhas**: dar tipos explícitos às linhas de `query()`/`tx.query()` (interfaces por consulta) e aos retornos dos utilitários, eliminando `unknown`.
- **Tratamento de `null`/`undefined`**: após as checagens já existentes (`if (!usuario) erro404()`), garantir ao compilador que o valor é não-nulo (helpers `never`/narrowing ou asserções onde já é provado seguro).
- **Acesso indexado**: ajustar usos de `arr[0]` sob `noUncheckedIndexedAccess` com guardas/typed helpers — sem mudar a lógica.
- **`.vue`**: tipar props/slots/refs e casts pontuais para satisfazer o `vue-tsc`, sem tocar no comportamento da UI.
- **Resultado**: `npm run typecheck` com **0 erros**, tornando-o gate ao lado de `lint`/`test`/`build`.

Sem mudança de comportamento observável (apenas anotações de tipo e guardas que preservam a lógica existente).

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
<!-- Nenhuma: refatoração de tipos, sem mudança de requisito (skip_specs declarado). -->

## Impact

- **Backend:** `server/utils/{usuarios,perfis,auth,configuracoes,seguranca,rateLimit,mailer,audit,...}.ts`, `server/api/**` — anotações/guardas de tipo.
- **Frontend:** `app/components/**` e `app/composables/**` — tipagem de props/slots/refs.
- **Ferramentaria:** nenhuma nova dependência (vue-tsc/typescript já instalados); `typecheck` passa a ser gate.
- **Comportamento:** inalterado (verificado por `build` + `lint` + `test` + E2E das áreas tocadas).