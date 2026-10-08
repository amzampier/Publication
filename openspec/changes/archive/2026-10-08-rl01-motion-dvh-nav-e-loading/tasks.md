# Tasks

## 1. Código e docs (MEL-01, MEL-02, MEL-03, MEL-04)

- [x] 1.1 MEL-02: em `app/assets/css/main.css`, adicionar o bloco global
      `@media (prefers-reduced-motion: reduce)` com `*`/`::before`/`::after` →
      `animation-duration: 0.01ms !important`, `animation-iteration-count: 1 !important`,
      `transition-duration: 0.01ms !important` (a regra existente de `.ds-loading` fica
      subsumida, sem conflito) — **verificar:** `npm run build` e, com a preferência de
      movimento reduzido emulada no DevTools, o dot do badge `blocked` não pinga, toasts
      entram/saem sem transição e o dropdown do `Select` abre sem animação, mantendo
      conteúdo e foco funcionais
- [x] 1.2 MEL-02 docs: em `docs/01 - design_system.md` §5.4, no gotcha do badge `blocked`
      (linha ~307), registrar que a pulsão é desligada por `prefers-reduced-motion` (regra
      global de `main.css`) — **verificar:** o texto reflete o comportamento da task 1.1
- [x] 1.3 MEL-01: trocar `h-screen`/`min-h-screen` por `h-dvh`/`min-h-dvh` em
      `app/layouts/admin.vue` (`h-screen`), `app/pages/design.vue` (`min-h-screen`) e
      `app/error.vue` (`h-screen` — escopo extra sinalizado na proposal) — **verificar:**
      `npm run build` e o shell da área administrativa sem barra de rodapé colada em
      viewport mobile com emulação de barra de endereço
- [x] 1.4 MEL-03: em `app/components/layout/AppSidebar.vue`, no clique de item **sem** `to`,
      disparar `toast.info(item.label, 'Módulo em construção.')` (menu da conta intocado) —
      **verificar:** `npm run build` e clicar em "Manuais" exibe o toast sem navegar; item
      com `to` navega normalmente; spec delta em `specs/design-system/layout-navigation`
      casada com o comportamento
- [x] 1.5 MEL-03 docs: em `docs/03 - Header e Sidebar.md`, documentar o aviso de construção
      nos itens sem rota (e atualizar a referência "MEL-03" do `docs/07` §8 como resolvida)
      — **verificar:** os trechos descrevem o toast implementado na task 1.4
- [x] 1.6 MEL-04: em `nuxt.config.ts`, adicionar `app.loadingIndicator` (spinner `circle`,
      `background: '#112051'`, `color: '#4ed813'`) — **verificar:** `npm run build` sem
      erros e a config válida (o indicador só aparece em navegação lenta)

## 2. Verificação final (integração)

- [x] 2.1 `npm run build` completa sem erros — **verificar:** exit code 0
- [x] 2.2 `openspec validate "rl01-motion-dvh-nav-e-loading" --strict` passa —
      **verificar:** exit code 0 sem erros
- [x] 2.3 Conferência visual em `http://localhost:3000`: DevTools com `prefers-reduced-motion`
      reduzido (badge `blocked` sem ping, toasts/dropdown sem transição, hover/foco/erros
      funcionais), `/admin` em 375px sem rodapé colado, sidebar clicando em item sem rota →
      toast "Módulo em construção." e itens com rota navegando, regressão do menu da conta
      (sem toast) e `/design` íntegro — **verificar:** checklist sem divergência das specs
