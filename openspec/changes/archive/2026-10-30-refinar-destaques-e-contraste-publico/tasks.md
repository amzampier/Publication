# Tasks

## 1. Escopo público

- [x] 1.1 Adicionar a variante `alto` ao `UiBadge` (orange-700, `Gauge`, tema escuro) e mapear `Alto` em `varianteImpacto`; verificado com o badge “Impacto: Alto”.
- [x] 1.2 Aplicar ao card do Escopo a moldura/barra laranja, anel/sombra e badge `alto` para impacto `Alto`, mantendo o rose para `Crítico`; verificado nos cards reais e na vitrine.
- [x] 1.3 Adicionar `id="chamada-{id}"` e `scroll-mt-24` aos cards e cobrir o novo mapeamento em `tests/publico-escopo.test.ts`; `npm run test` passou.

## 2. Painel de Destaques

- [x] 2.1 Incluir `Alto` na consulta de destaques (`impacto IN ('Crítico','Alto')`), com críticas antes das altas e limite de três; `GET /api/publico/painel` retornou 1 crítico + 2 altos.
- [x] 2.2 Atualizar `PainelEscopoDestaque` para “Chamadas em destaque”, badge por impacto (rose/laranja) e link `/escopos/{id}#chamada-{id}`; verificado no painel real.
- [x] 2.3 Ajustar `app/pages/escopos/[id].vue` e `app/router.options.ts` para rolar o `<main>` até a âncora imediatamente e após 300 ms, sem borda extra; verificado com Chrome headless na navegação SPA (scrollTop 329 no 1º e 3855 no 3º destaque).

## 3. Tema escuro e documentação

- [x] 3.1 Aplicar `bg-slate-800` na página, `bg-slate-900` nas superfícies e `slate-700`/tints `/20` nos hovers do shell público; verificado por SSR no tema escuro.
- [x] 3.2 Atualizar `docs/01`, `docs/18`, `docs/19`, `docs/20`, `docs/21` e as specs principais; `openspec validate --specs --strict` passou.
- [x] 3.3 Atualizar a vitrine `/design` (seção 29) com um destaque `Alto`; `/design` respondeu 200.

## 4. Verificação integrada

- [x] 4.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; todos passaram (352 testes).
- [x] 4.2 Conferir no navegador o clique em chamada em destaque, a lista combinada do painel e o contraste do tema escuro; sem overflow ou borda verde.
