# Proposal

## Why

A auditoria RL03 (`docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, Etapa 5 — achados
`RL03-M-03`, `RL03-M-04`, `RL03-M-05`, `RL03-M-06` e `RL03-DOC-01…08`) encontrou divergências de
documentação/contrato e uma falha pontual de origem de link: o guia de replicação do `docs/02` usa
`runtimeConfig`/`.env` obsoletos (o app não sobe com eles); o `docs/qa/00` descreve o RBAC como
roadmap; o `docs/01` cita `lucide-vue-next` e um default de `Kpi` inexistente; comentários citam
nomes `*Demo` renomeados; e o rótulo da sidebar **Auditoria** diverge entre o código/spec `auditoria`
("Gestão de Auditoria") e a spec `layout-navigation`/`docs/01` ("Auditoria"). Além disso, os links de
e-mail usam `getRequestURL(event).origin` como fallback quando `APP_URL` está ausente, contrariando a
spec `login` ("os links usam a origem configurada, nunca o Host").

## What Changes

- **Alinhamento do rótulo da sidebar (M-06):** a sessão **Administração** da sidebar passa a exibir o
  item **"Gestão de Auditoria"** (em vez de "Auditoria"), alinhando a spec `design-system/layout-navigation`
  e o `docs/01` ao código real (`app/config/navigation.ts`) e à spec `auditoria`.
- **Origem fixa dos links de e-mail (M-03):** em `/api/auth/esqueci-senha` e `/api/convite`, remover o
  fallback `getRequestURL(event).origin` e **falhar explicitamente** quando `APP_URL` não estiver
  configurada (sem montar link a partir do `Host`).
- **Correções de documentação (M-04/M-05/DOC-01…08):** `docs/02` (§Passo 2/3 com as chaves reais de
  boot `AUTH_JWT_SECRET`/`SMTP_ENC_KEY`/`APP_URL`; §Passo 4 `permission.ts` = `[existe]`; árvore com
  `bootstrap-admin.ts`), `docs/qa/00` (RBAC implementado; `@lucide/vue`), `docs/01` (default do `Kpi`
  `#0364f7`, sumário 5.1–5.20, `@lucide/vue`), nomes `usePerfisModelo`/`useAuditoriaModelo` (em
  `docs/05`, `docs/07`, `docs/bd/02_seed.sql`, `server/migration/02_seed.sql`, comentários) e o
  comentário de contrato de `server/api/auditoria/index.get.ts`.
- **Sem `BREAKING`:** nenhuma mudança de comportamento para o usuário final além da correção de link
  (que hoje já falha corretamente na configuração padrão com `APP_URL` definida).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `design-system/layout-navigation`: o requisito "A sidebar apresenta o item raiz e as sessões com os
  itens canônicos" passa a nomear o item da sessão Administração como **"Gestão de Auditoria"** (em vez
  de "Auditoria").

## Impact

- **Backend:** `server/api/auth/esqueci-senha/index.post.ts` e `server/api/convite/index.post.ts`
  (falha explícita sem `APP_URL`); comentário de contrato em `server/api/auditoria/index.get.ts`.
- **Documentação:** `docs/02`, `docs/qa/00`, `docs/01`, `docs/05`, `docs/07`, `docs/bd/02_seed.sql`,
  `server/migration/02_seed.sql`, comentários de `server/utils/perfis.ts`.
- **Spec:** delta em `design-system/layout-navigation`.
- **Banco:** nenhuma migration.
- **Fora de escopo:** Etapas 6 (funcional/UX) e 7 (dados/ambiente) do RL03.

> Nota: o RL03 descrevia o M-06 como "alinhar a spec `auditoria` ao rótulo 'Auditoria'"; a
> reverificação do código (`app/config/navigation.ts`) e da spec `auditoria` mostra que o rótulo
> canônico é **"Gestão de Auditoria"**, e que a divergência está na spec `layout-navigation` e no
> `docs/01` — por isso a correção é feita nesses artefatos (não na spec `auditoria`).
