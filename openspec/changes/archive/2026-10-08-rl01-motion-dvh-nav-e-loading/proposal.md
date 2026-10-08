# Proposal

## Why

Restam do `docs/RL01` quatro melhorias não bloqueantes ainda abertas: **MEL-01** (`100vh`
cobre o rodapé em mobile com a barra de endereço), **MEL-02** (= QA-ux **M-05**: só `UiKpi`
respeita `prefers-reduced-motion` — o dot `animate-ping` do badge `blocked`, os toasts, o
dropdown do `Select` e as transições do shell continuam animando para quem pediu menos
movimento), **MEL-03** (itens de navegação sem rota só marcam estado no clique, sem dizer
nada ao usuário) e **MEL-04** (sem indicador de carregamento de rota — necessário assim que
houver listagens assíncronas).

## What Changes

- **MEL-02 / M-05 — movimento reduzido global:** novo bloco
  `@media (prefers-reduced-motion: reduce)` em `app/assets/css/main.css` desligando animações
  e transições no app inteiro (`animation` ~instantânea com 1 iteração, `transition-duration`
  mínima), cobrindo badge `blocked`, toasts, `Select`, modal, sidebar e demais utilities do
  Tailwind. A regra já existente de `.ds-loading` é subsumida pelo bloco. `docs/01` §5.4
  (gotcha do badge) passa a registrar o respeito a `prefers-reduced-motion`.
- **MEL-01 — `dvh` no lugar de `vh`:** `h-screen`/`min-h-screen` → `h-dvh`/`min-h-dvh` em
  `app/layouts/admin.vue`, `app/pages/design.vue` e **também** `app/error.vue` (mesma classe,
  mesmo defeito — escopo extra sinalizado aqui; `RL01` só nomeava os dois primeiros).
- **MEL-03 — aviso nos itens sem rota (sidebar):** clicar num item da sidebar **sem** `to`
  (Painel Executivo, Manuais, Release Week, Escopo de Projetos, Esteira de Revisão, Lançar
  as Chamadas, Parceiros, Softwares) dispara `toast.info` com o rótulo do item e a mensagem
  "Módulo em construção." — **só a sidebar**; o menu da conta ("Meu Perfil", "Encerrar
  Sessão") fica como está (comportamento próprio definido na spec do menu).
- **MEL-04 — indicador de rota:** `app.loadingIndicator` no `nuxt.config.ts` (spinner
  `circle` nas cores da marca: fundo navy `#112051`, traço `#4ed813`).

**Não entra:** modal de permissões · filtros/exportação · backend · MEL de QA completa.

## Capabilities

### New Capabilities

<!-- nenhuma -->

### Modified Capabilities

- `design-system/layout-navigation`: **REMOVED + ADDED** — o requisito "Itens de navegação
  podem declarar rota e o ativo reflete a rota atual" é reescrito: itens **sem** rota passam
  a exibir `toast.info` de "Módulo em construção" no clique (era "apenas o estado visual muda,
  como no comportamento atual"); os cenários de rota, ativo e URL direta permanecem.

## Impact

- **Código:** `app/assets/css/main.css` (bloco de motion), `app/layouts/admin.vue`,
  `app/pages/design.vue`, `app/error.vue` (dvh), `app/components/layout/AppSidebar.vue`
  (toast no clique sem rota), `nuxt.config.ts` (loadingIndicator).
- **Docs:** `docs/01` §5.4 (gotcha do badge + motion), `docs/03` (itens sem rota → toast).
- **Specs:** delta REMOVED+ADDED em `design-system/layout-navigation`.
- **Sem** mudanças de API/server/deps; verificação = `npm run build` +
  `openspec validate --strict` + conferência visual (emulação de movimento reduzido, altura
  em mobile, toast nos itens sem rota).
- **Risco a conferir:** o override global de transições é aplicado com `!important` —
  verificar que `UiLoading`/spinner de `loading` do `UiButton` continuam legíveis (viram
  estáticos) e que nenhum efeito de foco/erro fica "presa" a uma transição morta.
