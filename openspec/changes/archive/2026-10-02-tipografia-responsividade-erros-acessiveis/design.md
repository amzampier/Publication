# Design

## Context

A mudança cobre os bugs BUG-02, BUG-03 e BUG-04 da Etapa 2 do `docs/RL01`. Estado atual relevante:

- `nuxt.config.ts` só declara `compatibilityDate`, `devtools` e o módulo Tailwind (`cssPath: ~/assets/css/main.css`); nenhuma fonte é carregada e `tailwind.config.js` não tem `theme.extend.fontFamily` — apesar de `docs/01:53` já prometer "Fontes carregadas em `nuxt.config.ts` (Google Fonts)".
- `app/layouts/admin.vue` (0 classes responsivas), `AppSidebar.vue` (0) e `AppHeader.vue` (1) não têm breakpoints; `useSidebarExpandida.ts` inicia `true` (`useState`) em qualquer largura; não há `matchMedia`/`useMediaQuery` em `app/`.
- `Input.vue:117-130` (e o par em `Select`/`DatePicker`) só põe a mensagem no `UiTooltip`, cujo conteúdo usa `v-if="isVisible"` e é acionado por botão `aria-hidden` + `tabindex="-1"` — fora da árvore de acessibilidade.
- Conflito de spec: `design-system/form-control-states` tem o cenário "A mensagem de erro continua no tooltip … **sem texto de erro renderizado abaixo do campo**", que a correção do BUG-04 inverte — resolvido via `MODIFIED Requirements` na delta desta change.

## Goals / Non-Goals

**Goals:**

- CSS de saída com `Plus Jakarta Sans` e `JetBrains Mono`; corpo renderizando na sans oficial, em qualquer rota, com SSR.
- `/admin/configuracoes-globais` utilizável a 375px (sem overflow horizontal), íntegra a 768px e 1024px, com sidebar se comportando como drawer abaixo de `lg`.
- Mensagem de erro no DOM, anunciada (`role="alert"`) e alcançável sem mouse, idêntica nos três controles.

**Non-Goals:**

- Etapa 3 do RL01 (BUG-05…11) e melhorias MEL-01…04.
- Mudar a escala tipográfica, os tokens de cor ou a identidade visual do kit.
- Persistir a preferência da sidebar em `localStorage` (continua `useState` em memória, como já é).
- Revisar as telas administrativas além de `configuracoes-globais` (a responsividade é do shell; páginas são responsáveis pelo próprio conteúdo).

## Decisions

1. **Fontes via `app.head.link` (Google Fonts) em `nuxt.config.ts`, sem módulo novo.**
   - Racional: `docs/01:53` já descreve exatamente esse mecanismo — implementá-lo não exige mudar a documentação (critério de aceite do BUG-02) e evita dependência (`@nuxtjs/google-fonts`) ou self-host (`public/fonts/` + `@font-face`).
   - Alternativa descartada: self-host resolve offline, mas divergiria do texto de `docs/01:53` (exigindo mudança de docs) e adiciona binários ao repo.
   - Detalhe: `preconnect` para `fonts.googleapis.com` e `fonts.gstatic.com` + `<link>` com `family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap` (pesos usados na escala de `docs/01:60-67`).
   - Mapeamento em `tailwind.config.js` → `theme.extend.fontFamily`: `sans: ['"Plus Jakarta Sans"', 'sans-serif']`, `mono: ['"JetBrains Mono"', 'monospace']` — o preflight do Tailwind aplica `font-sans` no `html`, então o corpo herda a sans oficial.

2. **Sidebar: drawer com backdrop abaixo de `lg` (CSS + `matchMedia` no composable), mantendo `lg+` idêntico ao atual.**
   - Em `admin.vue`/`AppSidebar.vue`: abaixo de `lg`, a sidebar expandida vira `fixed` sobre o conteúdo com backdrop clicável para fechar; o `main` não é deslocado (largura total). A partir de `lg`, comportamento atual (`w-52`/rail deslocando o conteúdo).
   - Estado inicial: `useSidebarExpandida` mantém `true` como valor SSR (evita mismatch de hidratação) e aplica `matchMedia('(min-width: 1024px)')` no cliente **na primeira carga apenas**, gravando flag `preferenciaManual` que passa a prevalecer assim que o usuário usa o toggle.
   - Alternativa descartada: CSS puro (esconder via `lg:hidden`) não respeitaria a preferência manual nem o `aria-expanded` do toggle; framework de breakpoints (`useMediaQuery` de VueUse) traria dependência nova para um único uso — `matchMedia` nativo basta.
   - `Cabecalho.vue`: `flex-wrap` real com `min-w-0` no bloco de título e `w-full sm:w-auto` no botão Salvar (independente do estado da sidebar).
   - `UiTabs` em `configuracoes-globais`: container da barra de abas com `overflow-x-auto` abaixo de `sm` (rolagem horizontal — alternativa aceitável pelo RL01).

3. **Erro acessível: texto persistente `role="alert"` abaixo do campo, padronizado; ícone + tooltip mantidos como reforço.**
   - Em `Input`, `Select` e `DatePicker`: `<p v-if="error" :id="errorId" role="alert" class="text-[11px] text-rose-700 …">` + `aria-describedby` no controle apontando para `errorId` quando `error` existir.
   - Conflito de spec resolvido no `form-control-states` delta: o cenário tooltip-only vira "mensagem persistente abaixo do campo + tooltip como reforço" (`MODIFIED`), e a acessibilidade vira requisito próprio (`ADDED`).
   - Alternativa descartada (RL01 "alternativa mínima"): só `aria-describedby` apontando para o nó do tooltip deixa a mensagem invisível visualmente sem mouse — não atende ao cenário "acessível sem mouse".

## Risks / Trade-offs

- [Google Fonts exige rede] → aceito: é o mecanismo que `docs/01` já documenta; em ambiente offline cai em fonte de sistema sem quebrar layout (`display=swap`). Se um dia exigir offline, troca-se por self-host com atualização de `docs/01:53`.
- [Drawer abaixo de `lg` pode sobrepor tooltips do rail] → backdrop fecha ao redimensionar; tooltips do rail verificados visualmente a 375px (cenário da spec).
- [Aplicar `matchMedia` após hidratação pode mostrar a sidebar expandida por um frame em telas estreitas] → aceito como flash mínimo; evitar mismatch de SSR é prioritário (servidor não conhece a largura).
- [Cenário modificado de `form-control-states` altera contrato já archiveado] → é exatamente o fluxo OpenSpec: delta `MODIFIED` sincroniza o main spec no archive; consumidores que esperavam tooltip-only passam a ver texto abaixo do campo (melhoria de acessibilidade intencional).
- [`aria-describedby` + `role="alert"` juntos podem duplicar anúncio em alguns leitores] → comportamento aceitável (anúncio é o objetivo); se duplicação incomodar em QA manual, remover `aria-describedby` sem afetar o critério `role="alert"`.

## Migration Plan

Sem migração de dados ou estados. Deploy único; rollback = reverter os commits da change (nenhuma dependência externa além do link de fontes, que é aditivo).

## Open Questions

Nenhuma — o mecanismo de fontes, o comportamento responsivo da sidebar e o padrão de mensagem de erro estão definidos nas specs desta change.
