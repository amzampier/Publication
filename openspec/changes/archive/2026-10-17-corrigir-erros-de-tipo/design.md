# Design

## Context

Ver `proposal.md - Why`. Baseline: **208 erros** do `nuxt typecheck` em 30 arquivos (server 148,
app 44, shared 6, nuxt.config 1, e duplicações). As causas dominantes são `unknown` vindo de
`query<T=any>` sem tipo de linha e o rigor `strict` + `noUncheckedIndexedAccess` do Nuxt.

## Goals / Non-Goals

**Goals:** `npm run typecheck` com 0 erros; transformá-lo em gate; **sem mudança de comportamento**.
**Non-Goals:** reescrever a lógica; adotar validação em runtime (Zod); habilitar regras de lint mais
estritas; cobertura de testes ampla.

## Decisions

### D1 — Tipar as linhas das consultas
Onde `query<Row>(...)`/`tx.query<Row>(...)` usam `Record<string, unknown>` ou `any`, declarar a
interface da linha (campos realmente selecionados) e tipar o retorno dos utilitários. Alternativa:
`@ts-expect-error`/`as any` — rejeitada (esconde a causa).

### D2 — Narrowing de `null` após as guardas existentes
Os utilitários já fazem `if (!x) erro404()`; `erro404`/`erro400`/`erro409` são `never`, o que já
estreita. Onde o compilador ainda vê `null`, reordenar/ajustar a guarda ou usar um helper de
"não-nulo após verificação" local — sem alterar o fluxo.

### D3 — Acesso indexado sob `noUncheckedIndexedAccess`
`arr[0]` passa a `T | undefined`; aplicar guardas/`?.` conforme a lógica já assume, ou tipar helpers
de leitura de linha única.

### D4 — `.vue` (props/slots/refs)
Tipar props/emits e refs; casts pontuais apenas onde o runtime já garante o tipo (ex.: slot payload).

### D5 — Verificação
Rodar por área (server → app) mantendo `npm run typecheck` decrescente; ao final, 0 erros, com
`lint`/`test`/`build` também verdes (o `build` transpila, mas garante que nenhuma edição quebre o bundle).

## Risks / Trade-offs

- **Mudança acidental de comportamento** → edições restritas a tipos/guardas; revisar diffs e rodar
  `build`+`lint`+`test` a cada grupo.
- **Asserções excessivas (`as`)** → usar só onde provadamente seguro; preferir interfaces de linha.
- **Grande volume (208 erros/30 arquivos)** → dividir por área em grupos de tarefas.

## Migration Plan

1. `server/utils` (usuarios, perfis, auth, configuracoes, seguranca, rateLimit, mailer, audit…).
2. `server/api/**` e `shared/**`.
3. `app/components/**` e `app/composables/**`.
4. `nuxt.config.ts`.
5. Verificar `typecheck` 0 + `lint`/`test`/`build`; atualizar `AGENTS.md` (typecheck passa a gate) e o `docs/RL04`.
6. **Rollback:** reverter os commits (mudanças de tipo não afetam dados).

## Open Questions

Nenhuma pendente que altere specs, abordagem ou tarefas.