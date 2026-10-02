# Proposal

## Why

A Etapa 2 do relatório `docs/RL01 - Relatório de Responsividade.md` reporta três bugs de severidade Média que reprovam o gate de responsividade/UX: (1) as fontes oficiais do design system (Plus Jakarta Sans + JetBrains Mono) não são carregadas — toda a identidade tipográfica cai em fonte de sistema; (2) o shell da Área Administrativa não tem comportamento responsivo (0 classes `sm:/md:/lg:` no layout/sidebar) e fica inoperável a 375px; (3) a mensagem de erro dos campos existe apenas no tooltip de hover, fora da árvore de acessibilidade, violando WCAG 3.3.1/4.1.2.

## What Changes

- **Tipografia:** carregar Plus Jakarta Sans e JetBrains Mono via `app.head.link` (Google Fonts com `preconnect`) em `nuxt.config.ts` e mapear `fontFamily.sans`/`fontFamily.mono` em `tailwind.config.js` — mecanismo que `docs/01:53` já descreve.
- **Shell responsivo:** sidebar vira drawer com backdrop abaixo de `lg` (conteúdo ocupa 100% da largura, sem overflow horizontal em 375px), `useSidebarExpandida` inicia recolhida em telas estreitas preservando a escolha manual do usuário, e o cabeçalho de `Configuracoes/Cabecalho.vue` ganha `flex-wrap`/`min-w-0` real; `UiTabs` da tela de configurações ganha rolagem horizontal em telas estreitas.
- **Erros acessíveis:** `Input`, `Select` e `DatePicker` passam a renderizar a mensagem de erro como texto persistente abaixo do campo (`role="alert"`), mantendo ícone + tooltip como reforço — substituindo o comportamento de tooltip-only.
- **Specs:** nova capability `design-system/typography`; deltas em `design-system/layout-navigation` (requisitos novos de responsividade) e `design-system/form-control-states` (requisito de erro acessível + correção do conflito com o cenário "mensagem de erro continua no tooltip").

## Capabilities

### New Capabilities

- `design-system/typography`: carregamento das fontes oficiais em qualquer rota, resolução das classes `font-sans`/`font-mono` e correspondência da escala tipográfica da vitrine §1.

### Modified Capabilities

- `design-system/layout-navigation`: novos requisitos de adaptação à largura da viewport (drawer abaixo de `lg`, ausência de overflow horizontal, estado inicial da sidebar em telas estreitas preservando preferência manual).
- `design-system/form-control-states`: a mensagem de erro deixa de ser tooltip-only e passa a ser persistente, anunciável e acessível sem mouse em `Input`, `Select` e `DatePicker` (**BREAKING** para o cenário existente "A mensagem de erro continua no tooltip … sem texto de erro renderizado abaixo do campo").

## Impact

- **Código:** `nuxt.config.ts`, `tailwind.config.js`, `app/layouts/admin.vue`, `app/components/layout/AppSidebar.vue`, `app/composables/useSidebarExpandida.ts`, `app/pages/admin/configuracoes-globais.vue`, `app/components/configuracoes/Cabecalho.vue`, `app/components/ui/{Input,Select,DatePicker}.vue`, eventualmente `app/components/ui/Tabs.vue` e `app/assets/css/main.css`.
- **Docs:** `docs/01 - design_system.md` §1/§3 (tipografia) permanece válida com o mecanismo Google Fonts escolhido; `docs/03 - Header e Sidebar.md` e `docs/04 - Configurações Gerais.md` podem precisar de ajuste no comportamento responsivo descrito.
- **Verificação:** `npm run build` + conferência visual em 375/768/1024px em `/admin/configuracoes-globais` e no `/design`; contagem de `jakarta`/`jetbrains` no CSS gerado.
- **Fora de escopo:** Etapa 3 do RL01 (BUG-05…11) e demais melhorias MEL.
