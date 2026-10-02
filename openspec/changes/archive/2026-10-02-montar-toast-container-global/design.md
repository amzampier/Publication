# Design

## Context

`app/components/ui/ToastContainer.vue` e `app/composables/useToast.ts` existem, estão corretos (variantes, auto-dismiss com timer por toast, `role="status"` + `aria-live="polite"`) e são consumidos por `pages/admin/configuracoes-globais.vue`, `components/configuracoes/AbaSeguranca.vue` e `pages/design.vue` — mas **nenhum lugar os monta**. `app/app.vue` tem apenas `<NuxtRouteAnnouncer /> + <NuxtLayout> + <NuxtPage />`; `app/plugins/` está vazio; nenhum layout referencia o componente. Verificação por SSR (relatório `docs/RL01`, BUG-01): `aria-live` = 0 nas quatro rotas. A fonte da verdade (`docs/01` §4.6) determina que o container seja global em `app/app.vue`. Motivação detalhada em `proposal.md`.

Restrições que moldam a abordagem:

- O estado dos toasts vive em um `ref` de escopo de módulo em `useToast.ts`; qualquer consumidor importa `app/composables/useToast.ts` (auto-import) — **o container precisa ler o mesmo módulo**, não uma cópia (existe uma duplicata byte a byte idêntica em `app/components/composables/useToast.ts`, tratada como BUG-10/etapa 3 desta mesma auditoria).
- Existem rotas com `layout: false` (`/design`, que é justamente onde vive a demonstração §8) e rotas com layouts distintos (`default`, `admin`).
- A spec exige que a região viva exista **no HTML renderizado**, não só após hidratação.

## Goals / Non-Goals

**Goals:**
- Toast disparado por qualquer consumidor ser visível em todas as rotas, sem configuração por página.
- Região viva (`aria-live`) presente no HTML SSR das rotas.
- Zero mudança de API/visual do componente e dos consumidores.

**Non-Goals:**
- Alterar `useToast()` (assinatura, variantes, durações) ou o markup/estilo do `ToastContainer`.
- Corrigir a duplicata `app/components/composables/useToast.ts` (BUG-10, etapa 3 do RL01).
- Ordem de empilhamento, limite máximo de toasts ou posicionamento sobre modais (comportamento não coberto pela spec desta change).
- Demais achados do RL01 (BUG-02…BUG-11) — cada um em sua própria change.

## Decisions

### D1 — Montar em `app/app.vue`, como irmão de `<NuxtLayout>`, e não dentro dos layouts
**Escolha:** adicionar `<UiToastContainer />` no `<div>` raiz de `app/app.vue`, antes ou depois do `<NuxtLayout>` (fora dele).

**Por quê:** é o único ponto que cobre *todas* as rotas de uma vez — incluindo `/design`, que declara `layout: false` e portanto nunca passaria por `layouts/default.vue` nem `layouts/admin.vue`. Também é exatamente o que `docs/01` §4.6 descreve, então documentação e código passam a coincidir sem editar o doc.

**Alternativas descartadas:**
- *Montar em `layouts/default.vue` e `layouts/admin.vue`*: duas edições, cobre as rotas atuais, mas **quebra silenciosamente** qualquer rota futura com `layout: false` — e deixa a demonstração da vitrine §8 sem feedback, que é um dos sintomas relatados.
- *Plugin de cliente que monta via `createApp`/`teleport` programático*: complexidade desnecessária e faz a região viva existir só após a hidratação, violando o cenário "Região viva presente no HTML".
- *`<ClientOnly>`*: mesmo problema do SSR + flash; além disso o componente não usa `window`/`document` no render (só no `watch` de timers, que não executa em SSR), logo o render normal é seguro.

### D2 — Render normal (sem `ClientOnly`), mantendo a hierarquia de z-index atual
**Escolha:** montar o container com o markup atual (`fixed top-5 right-5 z-50 … pointer-events-none`).

**Por quê:** a região viva entra no HTML de qualquer rota (cenário da spec) e, sem toasts ativos, o `div` com `pointer-events-none` é invisível e não intercepta cliques.

**Consequência conhecida:** `z-50` fica **abaixo** do overlay do `UiModal` (`z-[60]`). Se um modal disparar um toast, o toast fica atrás do véu. Hoje nenhum modal dispara toast (modais existem só na vitrine §15 e na `CameraWeb`), então o comportamento observável da spec não é afetado — registrado como risco, não como escopo.

### D3 — Uma linha, sem dependências novas
**Escolha:** apenas o componente auto-importado (`UiToastContainer` — o prefixo `Ui` é resolvido pelo auto-import do Nuxt para `app/components/ui/ToastContainer.vue`); sem import explícito, sem nova entrada de `modules` em `nuxt.config.ts`, sem pacote novo.

**Por quê:** o bug é de montagem, não de capacidade; a menor mudança possível minimiza risco de regressão visual.

## Risks / Trade-offs

- [**Estado dividido pelo duplicata de `useToast.ts`**] → Se alguém importar `app/components/composables/useToast.ts`, o container (que importa o módulo canônico) não vê os toasts. *Mitigação:* consumidores atuais já importam `app/composables/useToast.ts`; remoção da duplicata é BUG-10/etapa 3 — manter o vínculo no tasks.
- [**Container re-renderiza a lista a cada toast**] → Custo desprezível (poucos itens, `TransitionGroup`); sem ação.
- [**Mudança de comportamento perceptível de repente**] → Toasts deixam de ser invisíveis e passam a aparecer em telas onde antes "não acontecia nada"; é o comportamento especificado, mas pode parecer regressão a quem se acostumou com o bug. *Mitigação:* validação visual nas 4 rotas antes do merge (tasks).
- [**Toast atrás do overlay de modal (D2)**] → Fora do escopo desta change; se surgir modal que dispara toast, tratar em change própria com spec nova.

## Migration Plan

1. Editar `app/app.vue` (adição do componente).
2. `npm run dev` + verificação das 4 rotas (região viva no HTML + disparo manual).
3. `npm run build` como gate estrutural do repositório (não há lint/test).
4. **Rollback:** remover a linha de `app/app.vue` — nenhuma outra alteração no repositório.

## Open Questions

Nenhuma. As decisões acima não alteram escopo, specs nem o desmembramento das etapas do RL01.
