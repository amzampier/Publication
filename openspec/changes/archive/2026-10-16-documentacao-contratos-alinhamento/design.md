# Design

## Context

Ver `proposal.md` para a motivação (RL03 Etapa 5).

Estado atual relevante (leitura somente):

- `app/config/navigation.ts:98,123` — rótulo da sidebar e do menu da conta = **"Gestão de Auditoria"**.
- `openspec/specs/design-system/layout-navigation/spec.md:70` — sessão Administração = "Auditoria".
- `docs/01 - design_system.md:141` — sessão Administração = "Auditoria"; `docs/01:133` (menu da conta) já
  diz "Gestão de Auditoria".
- `server/api/auth/esqueci-senha/index.post.ts:52` e `server/api/convite/index.post.ts:131` —
  `String(useRuntimeConfig().appUrl || '') || getRequestURL(event).origin`.
- `docs/02` §6 (Passos 2/3 com `jwtSecret`/`jwtRefreshSecret`/`public.baseUrl` e `.env` com
  `JWT_SECRET`/`JWT_REFRESH_SECRET`), §Passo 4 marca `permission.ts` como `[roadmap]`, §2 omite
  `bootstrap-admin.ts`.
- `docs/qa/00` §Arquitetura descreve `requirePermission`/RBAC como roadmap e cita `lucide-vue-next`.
- `docs/01` §5.10 (default `#2161ef`), Sumário ("5.1–5.17"), §4.1 (`lucide-vue-next`).
- Nomes `usePerfisDemo`/`useAuditoriaDemo` em `docs/05`, `docs/07`, `docs/bd/02_seed.sql`,
  `server/migration/02_seed.sql` e comentários de `server/utils/perfis.ts`.

## Goals / Non-Goals

**Goals:**
- Alinhar o rótulo "Gestão de Auditoria" na spec `layout-navigation` e no `docs/01`.
- Remover o fallback `Host` dos links de e-mail (M-03).
- Corrigir os documentos/contratos obsoletos (M-04/M-05/DOC-01…08).

**Non-Goals:**
- Não alterar o rótulo do código (que já é "Gestão de Auditoria").
- Não alterar as specs `auditoria` e `login` (já corretas).
- Não tratar as Etapas 6/7 do RL03.

## Decisions

### D1 — Rótulo canônico: "Gestão de Auditoria"
O código (`navigation.ts`) e a spec `auditoria` usam "Gestão de Auditoria"; a divergência está na spec
`layout-navigation` (linha 70) e no `docs/01` (linha 141), que usam "Auditoria". Ajustamos esses dois
artefatos para "Gestão de Auditoria" — sem tocar no código nem na spec `auditoria`.

### D2 — Origem dos links: falhar explicitamente sem `APP_URL`
Em `esqueci-senha` e `convite`, substituir
`String(useRuntimeConfig().appUrl || '') || getRequestURL(event).origin` por leitura única de
`appUrl` e **erro explícito** quando vazio/ausente (não enviar e-mail com link derivado do `Host`). O
fluxo de recuperação já preserva a senha anterior em falha de envio; a falha por `APP_URL` ausente
segue esse mesmo caminho (sem alterar a senha). Documentar `APP_URL` como obrigatória em `.env.example`.

- **Por que não** manter o fallback com `Host`: reintroduz o risco de phishing que a spec `login` veda.

### D3 — Correções de documentação pontuais
Sem mudança de comportamento: ajustar os arquivos de doc/contrato listados (config de boot real,
`permission.ts = [existe]`, árvore com `bootstrap-admin.ts`, `docs/qa/00` RBAC implementado + pacote
`@lucide/vue`, `docs/01` default do `Kpi` `#0364f7` + sumário 5.1–5.20 + `@lucide/vue`, nomes `*Modelo`
e comentário de contrato do endpoint de auditoria).

## Risks / Trade-offs

- **[Falha quando `APP_URL` ausente]** → em ambiente sem `APP_URL`, recuperação/convite por e-mail
  falham; é o comportamento exigido pela spec e `.env.example` já define `APP_URL`. Documentado.
- **[Mudança de rótulo em spec/doc]** → cosmética; sem efeito no código.

## Migration Plan

- Sem migration. Deploy de código (M-03) + docs.
- Verificação: `npm run build` + revisão dos arquivos de doc + validação `openspec validate --specs`.

## Open Questions

(nenhuma)
