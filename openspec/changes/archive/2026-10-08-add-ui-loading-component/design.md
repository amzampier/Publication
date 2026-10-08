# Design

## Context

O design system não tem componente de carregamento: o único spinner é o SVG inline do `UiButton`
(`app/components/ui/Button.vue`, prop `loading`), que só serve dentro de botões. O `UiModal` já
resolve o problema de "camada sobre a tela" com `Teleport to="body"` + `fixed inset-0` +
backdrop `bg-zinc-900/50` (`app/components/ui/Modal.vue:163-166`) — o loading reaproveita esse
padrão. O Tailwind do projeto é v3 (via `@nuxtjs/tailwindcss` 6.x), sem utilitário de degradê
cônico; o precedente de CSS de marca fora do componente já existe no `.ds-slider`
(`app/assets/css/main.css:56`). Motivação e escopo: ver `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Componente `UiLoading` reutilizável: overlay com backdrop, caixa centralizada com borda em
  degradê giratório, ícone girando à esquerda, mensagem e barra de progresso opcional com
  contador (`current`/`total`) — contrato em
  `specs/design-system/loading/spec.md`.
- Borda animada sem hex de marca dentro de `app/components/` (respeita o req. de
  `brand-tokens` sobre hexes no componente).
- Demonstração funcional na vitrine `/design` (seção 18) e documentação em `docs/01` §5.17.

**Non-Goals:**

- Integrar o componente em telas reais (importação, export etc.) — change seguinte após aceite
  visual.
- Variante inline (sem backdrop) — overlay é a única forma nesta fase.
- Alterar z-index de toasts/modais existentes ou criar composable tipo `useLoading()`.

## Decisions

### D1 — Overlay sempre, exibido pelo consumidor com `v-if`

O componente é montado via `Teleport to="body"` e o consumidor controla a presença com `v-if`
(`v-if="carregando"`). **Alternativas descartadas:** `modelValue` + `v-model` (padrão do `UiModal`),
porque loading não tem estado interno nem fechamento próprio — booleano duplicaria a verdade; composable
imperativo (`useToast`), porque o loading é um estado de tela persistente, não um evento.

### D2 — Camada `z` acima do modal

Overlay em `z-[70]`, um degrau acima do `z-[60]` do `UiModal` — loading aberto *por cima* de um
diálogo (ex.: salvando a partir do modal) é caso real de uso. **Alternativa descartada:** `z-50`
(ficaria escondido sob qualquer modal aberto, tornando o componente inútil no fluxo mais comum).
O backdrop é o mesmo do modal (`bg-zinc-900/50`) para identidade visual única do sistema.

### D3 — Degradê cônico em CSS próprio (`.ds-loading` em `main.css`)

A borda é um `::before` com `conic-gradient(#112051, #0364f7, #4ed813, #112051)` dentro de um
wrapper `overflow-hidden` com `padding` fino; o painel interno branco cobre o centro, deixando só
o anel colorido. A rotação anima `transform: rotate` (composto na GPU). **Alternativas
descartadas:** classes Tailwind arbitrárias com hex (violaría o req. de `brand-tokens` de hex no
componente); `border-image` (não anima rotação); SVG com `linearGradient` (complexidade sem ganho).
Os hexes no CSS próprio são permitidos — a proibição vale para `app/components/`, e o `.ds-slider`
é o precedente exato.

### D4 — Ícone `LoaderCircle` em `brand-structure`, escala maior

`LoaderCircle` (existe no `@lucide/vue` já instalado), `h-6 w-6` no tamanho médio (escala
`h-5`/`h-6`/`h-8` para `sm`/`md`/`lg` — ícone um degrau maior que o especificado originalmente,
para presença visual sobre a caixa), `animate-spin`,
cor `text-brand-structure` (`#0364f7`, a cor do meio do degradê — legível sobre o painel branco).
`motion-reduce:animate-none` desliga o giro. **Alternativa descartada:** ícone com traço em
degradê (SVG `stroke="url(#…)"`) — reforço visual que não paga a complexidade; o degradê vivo já
está na borda.

### D5 — Não-dismissível + trava de rolagem

Backdrop não fecha em clique nem `Escape` (o loading termina quando o consumidor remove o `v-if`)
e `body.overflow` fica travado enquanto montado — mesmo contrato de `lockScroll` do `UiModal`
(`Modal.vue:115`). Foco não é movido (diferente do modal, que foca o primeiro elemento): o
overlay não tem controles focáveis e roubar foco quebraria o contexto da operação.

### D6 — Acessibilidade e impressão

Mensagem em `role="status"` + `aria-live="polite"` (mesma semântica de região viva exigida do
`UiToastContainer`), backdrop `aria-hidden="true"`, overlay com `no-print`. Preferência por
movimento reduzido resolvida com media query `prefers-reduced-motion` em `main.css` (borda) e
`motion-reduce:` (ícone) — as cores continuam visíveis sem rotação.

### D7 — Demo da vitrine fecha sozinha

A seção 18 tem dois botões que montam o overlay: um simples (sem progresso) e um com
progresso (intervalo de ~100 ms incrementando `current` até `total`), ambos com um `setTimeout`
de ~3,5 s que o desmonta (`clearTimeout`/`clearInterval` no `unmount`). **Por quê:** o componente
não tem fechamento próprio (D5) — sem auto-fecho a demo travaria a página da vitrine.

### D8 — Barra de progresso opcional via `current`/`total`

Props opcionais `current?: number` e `total?: number`: o componente calcula o percentual
(`clamp(current/total*100, 0, 100)`), largura da barra e o contador formatado com
`toLocaleString('pt-BR')` (`"1.240 / 5.000"` + rótulo de % inteiro). O painel passa a coluna com
min-width (~280px) quando há progresso; sem as props, o layout linha permanece intacto. A barra é
track `slate-200` (mesma da trilha do `UiSlider`) com fill `bg-gradient-to-r from-brand-primary
via-brand-structure to-brand-accent` — tokens do Tailwind, **zero hex no componente** — e
`transition-[width]` com `motion-reduce:transition-none`. O track carrega `role="progressbar"`
com `aria-valuenow/min/max/valuetext`. **Alternativas descartadas:** `progress` (0–100) +
`progressLabel` livre (formatação de contador espalhada em cada consumidor, fora do padrão);
`v-model` (sem estado interno — mesmo argumento de D1); CSS próprio com hex para o degradê
 desnecessário: os utilitários `from-/via-/to-brand-*` já cobrem a paleta Navy → Estrutural →
Accent.

## Risks / Trade-offs

- **Toast disparado durante o loading fica atrás do backdrop** (z-50 < z-70) → comportamento
  documentado como cenário na spec; mitigação operacional para os próximos usos: disparar o toast
  após remover o loading.
- **Animação de rotação em máquina fraca** → rotação apenas de `transform` no `::before`
  (composto na GPU), sem `filter`/`box-shadow` animados; risco baixo.
- **Constantes de `z` espalhadas** (40/50/60/70) → a camada do loading vive numa única classe
  `.ds-loading`/no root do componente, com comentário apontando a hierarquia.
- **Demo vazando timer ao trocar de rota** → `clearTimeout`/`clearInterval` no hook de
  desmontagem da página.
- **`toLocaleString('pt-BR')` no SSR** → Node 22+ (exigido pelo `engines` do Nuxt) traz ICU
  completo; se algum ambiente reduzido surgir, cair para `Intl.NumberFormat('pt-BR')` explícito —
  risco baixo.

## Migration Plan

Aditivo: componente, CSS, seção da vitrine e docs novos; nenhuma API existente muda. Rollback =
remover `Loading.vue`, a classe `.ds-loading`, a seção 18 e o §5.17.

## Open Questions

Nenhuma bloqueante. O consumo do componente em telas reais (quais funções primeiro) é decisão de
escopo do próximo change, não desta implementação.
