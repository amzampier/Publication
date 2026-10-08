# Design

## Context

Ver `proposal.md` — Why. Estado atual relevante:

- `main.css` tem um bloco `@media (prefers-reduced-motion: reduce)` **só** para
  `.ds-loading::before`; `UiKpi` tem o seu scoped para as ondas. Badge (`animate-ping` do
  `blocked`), `ToastContainer` (`TransitionGroup duration-300/200`), `Select` (dropdown
  `duration-150/100`, chevron `duration-200`), transições `transition-*` espalhadas: nada
  disso respeita a preferência.
- Alturas: `admin.vue:19` `h-screen`, `design.vue:671` `min-h-screen`, `error.vue:27`
  `h-screen` (todos fora do `vh` que cola o rodapé em mobile). Tailwind do repo: `^6.14.0`
  (utilities `h-dvh`/`min-h-dvh` existem desde a v3.4).
- Itens sem rota na sidebar: Painel Executivo, Manuais, Release Week, Escopo de Projetos,
  Esteira de Revisão, Lançar as Chamadas, Parceiros, Softwares (os 4 da Administração têm
  `to`). Spec atual: clique "apenas marca estado". Menu da conta: "Meu Perfil" e "Encerrar
  Sessão" sem `to`, com comportamento próprio já especificado.
- `nuxt.config.ts` é mínimo (`compatibilityDate`, devtools, módulo tailwind) — sem
  `app.loadingIndicator`.

## Goals / Non-Goals

**Goals:**
- Uma **única** regra global de movimento reduzido em `main.css` que cubra animações do kit,
  Vue `Transition`/`TransitionGroup` e utilities do Tailwind.
- Alturas de viewport em `dvh` nos 3 pontos com `h-screen`/`min-h-screen`.
- Feedback de "Módulo em construção" nos itens sem rota da sidebar (spec alinhada).
- `loadingIndicator` de marca no `nuxt.config.ts`.

**Non-Goals:**
- Reescrever animações individualmente com `motion-reduce:` (alternativa descartada —
  depende de lembrar de cada componente para sempre).
- Tocar no menu da conta, no comportamento de rota dos itens com `to`, ou em animações da
  Área Pública além do que o bloco global cubra.
- Indicador customizado em HTML (só o spinner built-in colorido).

## Decisions

1. **MEL-02: override global com `!important` em `main.css`.**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
   `!important` vence as utilities `duration-300` (especificidade não importa nesse caso) e
   cobre `animate-ping`/`animate-spin`/`transition-*` de qualquer componente, incluindo os
   `Transition` do Vue (que aplicam classes de utility). O `transition-colors` de badges e
   botões morre junto — é o comportamento pedido por quem ativa a preferência.
   *Trade-off aceito:* o spinner de `loading` do `UiButton` e o `animate-spin` param na 1ª
   volta (ícone estático ainda comunica "carregando"); `UiLoading`/ondas do KPI já tinham
   regra própria — mantidas (subsumidas, sem conflito). Alternativa descartada: classes
   `motion-reduce:*` componente a componente (frágil, esquecível).

2. **MEL-01: `h-dvh`/`min-h-dvh` nos 3 pontos.** Escopo do `RL01` eram `admin.vue` e
   `design.vue`; `error.vue` tem o mesmo `h-screen` e entrou (sinalizado na proposal — mesma
   classe, mesma correção, 1 linha). Sem `max-h`/`calc(vh)` tocados (modal usa
   `max-h-[calc(100vh-2rem)]` — fora do escopo do MEL).

3. **MEL-03: `toast.info(item.label, 'Módulo em construção.')` no handler de clique da
   sidebar quando `!item.to`.** Mesmo padrão de aviso de pendência do app (título = rótulo do
   item, mensagem curta). Guard: só sidebar (`AppSidebar`), menu da conta intocado (spec do
   menu manda ordem/comportamento próprio; "Encerrar Sessão" é ação real).
   *Alternativa descartada:* tooltip permanente (polui o hover de itens navegáveis vizinhos);
   item desabilitado (quebra a marcação visual de ativo permitida pela spec).

4. **MEL-04: `app.loadingIndicator` built-in `circle`** com `background: '#112051'` e
   `color: '#4ed813'` (cores da marca) — 3 linhas de config, sem asset. Só aparece em
   navegações lentas (hoje quase nunca — páginas em memória), mas prepara o terreno para
   listagens assíncronas.

## Risks / Trade-offs

- [Override global com `!important` pega **todas** as transições, inclusive as de hover de
  texto] → É a semântica de reduced-motion; conferir na QA que foco/erro/abertura de modal
  continuam **funcionais** (só sem animação).
- [`transition-duration` mínima pode "esticar" algum `Transition` do Vue para fora do
  timing] → `leave`/`enter` do Vue resolvem por classe; com duração ~0 o `afterEnter`/`afterLeave`
  dispara quase imediato — conferir toasts abrindo/fechando com a preferência ligada.
- [`dvh` em navegador antigo cai para unidade inválida (altura automática)] → Navegadores alvo
  (Chromium/Edge modernos) suportam desde 2022; fallback nativo é `height: auto`, aceitável.
- [Toast no clique de item sem rota some com a navegação de "Painel Executivo" (que também é
  sem `to`)] → Comportamento desejado: ele vira feedback em vez de clique mudo.
- [`loadingIndicator` sem rotas lentas nunca aparece] → Inofensivo; documentado como
  preparação.

## Migration Plan

Sem migração: frontend/config puro. Rollback = reverter `main.css`, os 3 `h-*`, o handler da
sidebar e o `nuxt.config.ts`; o delta da spec volta pelo archive.

## Open Questions

<!-- nenhum — forma do feedback (toast), escopo (só sidebar) e inclusão de error.vue/
     loadingIndicator decididos com o usuário na rodada -->
