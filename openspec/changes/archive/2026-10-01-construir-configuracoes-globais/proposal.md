# Proposal

## Why

A sidebar já exibe "Configurações Globais" (sessão Administração) e o menu Account repete o item, mas nenhum dos dois navega para lugar algum: a tela não existe e a ausência de rota é uma pendência declarada (`docs/03 - Header e Sidebar.md` §11.2). O mockup aprovado da página define a primeira tela de parâmetros institucionais do produto (retenção de auditoria como primeira aba), e montá-la exige dois controles que o kit `app/components/ui/` ainda não possui: navegação segmentada em abas e um slider de intervalo — hoje inexistentes, com força de reuso em todas as próximas telas administrativas.

## What Changes

- **Kit — 2 componentes novos + 1 prop:**
  - `UiTabs` (`app/components/ui/Tabs.vue`): tablist segmentado **centralizado** (`justify-center`), com `v-model`, itens `{ id, label, icon, cor }`, pill ativa lime `bg-lime-50 border-lime-300 text-lime-900`, ícone na cor do item, `role="tablist/tab"` + `aria-selected`, teclado ←/→/Home/End.
  - `UiSlider` (`app/components/ui/Slider.vue`): `input[type=range]` estilizado (`min=30`, `max=730`, `step=1`), legenda de marcas (`marks`), foco no verde canônico `#1a9e07`, `aria-valuetext` em dias.
  - `UiCheckChip` ganha prop `showCheck?: boolean = true` (back-compatível) — os atalhos de compliance do mockup são pills navy **sem** o ✓.
  - Estilo `.ds-slider` em `app/assets/css/main.css` (track preenchida em degradê `#112051` → `#0364f7` → `#4ed813` via `--pct`, thumb navy).
- **Página nova — rota `/admin/configuracoes-globais`:** `app/pages/admin/configuracoes-globais.vue` (layout `admin`) + domínio `app/components/configuracoes/` (`Cabecalho.vue`, `Abas.vue`, `AbaLogomarcas.vue`, `AbaSidebar.vue`, `AbaRetencaoAuditoria.vue`, `AbaSeguranca.vue` — página fina, só estado/composição):
  - Cabeçalho **sem container** (título + descrição + `UiButton size="md"` "Salvar Alterações Globais" à direita → `toast.success` mock, estado em memória — **frontend-first, sem backend**; o botão nasce desabilitado e habilita quando qualquer painel altera estado).
  - Container card com as 4 abas: **Logomarcas & Identidade (ativa por padrão)**, Sidebar & Sessões do Menu, Retenção de Auditoria, Segurança & Rate Limits — todas com painel de conteúdo (mockups enviados pelo usuário), sem placeholders; **cada painel tem ícone + título no cabeçalho** (mesmo padrão da Segurança — pedido do usuário).
  - Aba Retenção fiel ao mockup: valor grande dinâmico, slider, atalhos 30/60/90/180/365/730 (seleção única), banner "Rotina de Expurgo Automático" com query `DELETE … INTERVAL {{dias}} DAY` dinâmica.
  - Aba Logomarcas fiel ao mockup: `UiUploadFiles` para buscar a imagem (grava o caminho `/uploads/logomarcas/<nome>`) e campo de caminho editável, sem pré-visualização extra nem botões de modelo (removidos na revisão); a logo do header escolhida reflete no `AppHeader` do shell (estado compartilhado `useLogomarcaHeader`).
  - Aba Sidebar fiel ao mockup: comportamento da barra lateral e sessões do menu em `UiCheckCard` (decisão do usuário: reusar o kit em vez de criar rádio), sessões com **presets globais + escolha múltipla por sessão** (Publicações/Cadastros/Administração) — as duas preferências valem em tempo real para o shell (`AppSidebar` + layout admin) via composables `useSessoesAbertas` e `useSidebarExpandida`.
  - Aba Segurança fiel ao mockup: indicadores fixos (5 tentativas / 30 minutos / chave de rastreio) e lista `seguranca_rate_limits` em memória no `UiDataTable` padrão do kit, com ação liberar (ícone + tooltip) e atualizar (link com hover verde `text-emerald-700` — pedido do usuário).
- **Navegação ganha rota:** campo opcional `to` em `SidebarItem`/`MenuItem` (`app/config/navigation.ts`); clique em item com `to` navega (`AppSidebar` + menu Account do `AppHeader`); `itemAtivo` passa a refletir a rota atual. Itens sem `to` continuam apenas visuais.
- **Espelhamento (regra AGENTS: docs no mesmo change):** vitrine `/design` ganha seção 16 (Tabs & Slider); `docs/01` ganha §5.13/§5.14 e nota do `showCheck` (e o parágrafo do rail em §3 + tablist centralizada em §5.13); `docs/03` §11 atualiza a pendência de rota e §4.4 o comportamento do rail; `docs/04` (nova) documenta a página inteira.

## Capabilities

### New Capabilities

- `configuracoes-globais`: comportamento observável da página — rota sob `/admin/**` com shell, estrutura de 4 abas com a de logomarcas ativa por padrão e painéis de conteúdo nas demais (logomarcas com upload e reflexo no `AppHeader`, sidebar com grupos exclusivos, segurança com indicadores e registros), painel de retenção (slider + atalhos de seleção única + textos dinâmicos por `dias`), salvar com botão desabilitado até haver alteração, feedback e ausência de persistência nesta fase.
- `design-system/tabs`: contrato do componente de abas — `v-model`/`change`, papéis ARIA `tablist`/`tab` com `aria-selected`, navegação por teclado, pill ativa lime, ícone na cor declarada do item, e espelhamento na vitrine/docs.
- `design-system/slider`: contrato do componente de intervalo — faixa configurável com default 30–730, passo, marcas rotuladas sob a track, emite o valor numérico, foco visível no verde canônico, leitura acessível do valor em dias, e espelhamento na vitrine/docs.

### Modified Capabilities

- `design-system/layout-navigation`: **ADDED** requirement — itens de navegação podem declarar rota (`to`) e, quando declarada, o clique navega e o item ativo reflete a rota atual (hoje nenhum item navega; a árvore, ordem, rail e demais behaviors permanecem intactos).
- `design-system/layout-navigation`: **REMOVED + ADDED** requirement — o requisito de rail foi substituído (título novo: "A sidebar alterna entre modo expandido e rail exibindo todos os ícones e preservando o estado"): o modo rail passa a exibir **todos** os ícones de todas as sessões, independentemente do recolhimento das sessões (bug reportado pelo usuário: com "Todas Recolhidas" + rail só o item raiz aparecia); o acordeão passa a valer apenas no modo expandido, preservando o estado ao reexpandir. A substituição (em vez de `MODIFIED`) se deve ao rename do cenário "Rail mostra apenas ícones de sessões abertas", que o OpenSpec não aceita dentro de `MODIFIED`.

## Impact

- **Código novo:** `app/components/ui/Tabs.vue`, `app/components/ui/Slider.vue`, `app/pages/admin/configuracoes-globais.vue`, `app/components/configuracoes/` (`Cabecalho.vue`, `Abas.vue`, `AbaLogomarcas.vue`, `AbaSidebar.vue`, `AbaRetencaoAuditoria.vue`, `AbaSeguranca.vue`), `app/composables/useLogomarcaHeader.ts` (logo do header compartilhada com o shell), `app/composables/useSessoesAbertas.ts` (sessões do menu compartilhadas com o shell), `app/composables/useSidebarExpandida.ts` (expandir/recolher da sidebar compartilhado com o shell).
- **Código modificado:** `app/config/navigation.ts` (`to` nos 2 itens de Configurações Globais), `app/components/layout/AppSidebar.vue` (clique navega + `itemAtivo` por rota + sessões lidas da preferência compartilhada), `app/components/layout/AppHeader.vue` (menu Account navega + exibe a logo personalizada quando definida em Configurações), `app/components/ui/CheckChip.vue` (`showCheck`), `app/assets/css/main.css` (`.ds-slider`), `app/pages/design.vue` (seção 16), `app/layouts/admin.vue` (`.scrollbar-discreta` no `main`).
- **Documentação:** `docs/01 - design_system.md` (§5.13 UiTabs com tablist centralizada, §5.14 UiSlider, sumário, nota em §5.9, parágrafo do rail em §3), `docs/03 - Header e Sidebar.md` (§4.4 rail e §11 navegação/pendências), `docs/04 - Configurações Gerais.md` (nova — referência do módulo: abas, cabeçalhos com ícone, hover do Atualizar, reflexo no shell).
- **Specs:** 3 capabilities novas + 2 deltas (ADDED e REMOVED) em `design-system/layout-navigation`; `brand-tokens` e `form-control-states` intactos (slider foca com `#1a9e07` já coberto pela requirement genérica de foco).
- **Fora de escopo:** backend/API/persistência (`sistema_config`), auth/RBAC/middleware, rotas dos demais itens da sidebar, efeitos colaterais do job de expurgo (é texto ilustrativo).
- **Verificação:** `npm run build` (gate único) + SSR de `/admin/configuracoes-globais`, `/admin` e `/design` + conferência visual + `openspec validate --specs`.
