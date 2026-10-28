# Design System — Publications (Dicas Teorema)

**Versão:** 1.0.0 · **Data:** 2026-09-28 · **Idioma:** Português do Brasil (pt-BR)
**Stack:** Nuxt 4 · Vue 3 (`<script setup>`) · Tailwind CSS · @lucide/vue · Google Fonts (Plus Jakarta Sans + JetBrains Mono)
**Autoridade de comportamento:** specs em [`openspec/specs/design-system/`](../openspec/specs/design-system) — uma spec por capability (ex.: `upload`, `modais`, `typography`, `form-control-states`); em caso de divergência, a spec prevalece sobre este documento. Quando a capability não tiver spec própria, este documento é a referência oficial do padrão.
**Vitrine:** rota [`/design`](../app/pages/design.vue) (28 seções numeradas)

> Este documento descreve **apenas o que está implementado**: os 39 componentes de `app/components/ui/` (auto-importados, sem import manual), os tokens da página `/design` e as convenções do código. Componentes novos devem ser documentados aqui junto com sua seção no `/design`.

---

## Sumário

**Fundamentos**

1. [Princípios & Tipografia](#1-princípios--tipografia)
2. [Tokens de Cor & Foco Canônico](#2-tokens-de-cor--foco-canônico)
3. [Layout & Navegação](#3-layout--navegação)
4. [Convenções Globais](#4-convenções-globais)

**Componentes** (5.1–5.28)

5. [Componentes](#5-componentes)
   - [5.1 Button](#51-button--seção-3-do-design) (seção 3)
   - [5.2 Badge](#52-badge--seção-4-do-design) (seção 4)
   - [5.3 Input](#53-input--seção-5-do-design) (seção 5)
   - [5.4 UploadFiles & CameraWeb](#54-uploadfiles--cameraweb--seção-6-do-design) (seção 6)
   - [5.5 Tooltip](#55-tooltip--seção-7-do-design) (seção 7)
   - [5.6 Toast & useToast](#56-toast--usetoast--seção-8-do-design) (seção 8)
   - [5.7 Select](#57-select--seção-9-do-design) (seção 9)
   - [5.8 DatePicker & Calendar](#58-datepicker--calendar--seção-10-do-design) (seção 10)
   - [5.9 Família Checkbox](#59-família-checkbox--seção-11-do-design) (seção 11)
   - [5.10 Kpi](#510-kpi--seção-12-do-design) (seção 12)
   - [5.11 DataTable](#511-datatable--seção-13-do-design) (seção 13)
   - [5.12 UiModal & UiModalSection](#512-uimodal--uimodalsection--seção-15-do-design) (seção 15)
   - [5.13 UiTabs](#513-uitabs--seção-16-do-design) (seção 16)
   - [5.14 UiSlider](#514-uislider--seção-16-do-design) (seção 16)
   - [5.15 UiSegmented](#515-uisegmented--seção-9-do-design) (seção 9)
   - [5.16 UiChoiceCard](#516-uichoicecard--seção-17-do-design) (seção 17)
   - [5.17 UiLoading](#517-uiloading--seção-18-do-design) (seção 18)
   - [5.18 UiTextarea](#518-uitextarea--seção-19-do-design) (seção 19)
- [5.19 UiSwitch](#519-uiswitch--seção-20-do-design) (seção 20)
- [5.20 Avatar de Perfil (domínio)](#520-avatar-de-perfil-domínio--tela-meu-perfil)
- [5.21 UiEntityCard](#521-uientitycard--seção-21-do-design) (seção 21)
- [5.22 UiPagination](#522-uipagination--seção-22-do-design) (seção 22)
- [5.23 UiActionMenu](#523-uiactionmenu--seção-23-do-design) (seção 23)
- [5.24 UiTagInput](#524-uitaginput--seção-24-do-design) (seção 24)
- [5.25 UiRichText](#525-uirichtext--seção-25-do-design) (seção 25)
- [5.26 UiMultiSelect](#526-uimultiselect--seção-26-do-design) (seção 26)

## 1. Princípios & Tipografia

*(seção 1 do `/design`)*

### 1.1 Princípios fundamentais

1. **Clareza e Precisão da Informação** — informações críticas (títulos de publicação, datas, versões e códigos como `REL-2026-W39`) têm hierarquia rigorosa; valores numéricos e códigos usam `JetBrains Mono` com `font-variant-numeric: tabular-nums`.
2. **Identidade Visual Navy & Verde Accent** — ação primária e cabeçalhos em Navy (`#112051`) com destaques em Verde Accent (`#4ed813` / `#1a9e07`); sobriedade institucional, sem azuis genéricos de marketing.
3. **Dualidade de Áreas Inconfundível** — o usuário sempre sabe em qual área está: **Área Pública** (leitura das publicações, sem autenticação — hoje apenas o placeholder `/`; a leitura de Releases Week Semanal, Manuais e Escopo de Projetos é roadmap) e **Área Administrativa** (cadastros e publicação de Releases Week Semanal, Manuais e Escopo de Projetos, com autenticação e permissões); identidade visual e navegação deixam a área atual explícita.
4. **Disciplina "Zero-Pill" & Anti-Slop** — metadados, datas e categorias são texto limpo e unboxed com separadores sutis (`·`); badges operacionais usam `rounded-md` (nunca `rounded-full`); filtros são botões de controle segmentado.
5. **Layout Bimodal Retrátil & Sessões Agrupadas** — sidebar retrátil (expandida `w-52`, rail `w-[46px]`) com sessões de menu colapsáveis (ver [seção 3](#3-layout--navegação)).

### 1.2 Tipografia oficial

Fontes carregadas em `nuxt.config.ts` (Google Fonts):

- **Sans-serif:** `Plus Jakarta Sans` — títulos, corpo, labels.
- **Monoespaçada:** `JetBrains Mono` com `tabular-nums` — códigos de publicação, datas, versões, UUIDs.

| Nível | Família | Tamanho / Leading | Peso | Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| **H1** | Plus Jakarta Sans | 24px / 28px | `font-bold` (700) | Títulos de tela (Painel, Publicações) |
| **H2** | Plus Jakarta Sans | 18px / 24px | `font-bold` (700) | Títulos de seção, cabeçalhos de bloco |
| **H3** | Plus Jakarta Sans | 14px / 20px | `font-semibold` (600) | Títulos de cartões, categorias, grupos |
| **Body** | Plus Jakarta Sans | 13px / 20px | `font-normal` (400) | Textos descritivos, históricos |
| **Corpo Pequeno** | Plus Jakarta Sans | 12px / 16px | `font-medium` (500) | Rótulos de formulário, legendas, breadcrumbs |
| **Micro / Badges** | Plus Jakarta Sans | 11px / 14px | `font-bold` (700) | Badges de status (`rounded-md`) |
| **Monospace (Numérico)** | JetBrains Mono | 14px a 24px | `font-bold` (700) | Valores numéricos e métricas, `tabular-nums` |
| **Monospace (Código)** | JetBrains Mono | 12px | `font-medium` (500) | Códigos (`REL-2026-W39`), versões, UUIDs |

A classe utilitária `.tabular-nums` (aplicada em `app/assets/css/main.css` a `font-variant-numeric: tabular-nums`) é obrigatória em qualquer coluna/valor numérico. Demonstração viva na seção 1 do `/design` (quadro "Precisão Numérica").

**Valores de formulário:** o texto digitado/selecionado em `Input`, `Select` e `DatePicker` usa `font-normal` (400) — deliberadamente mais leve que os rótulos/legendas (`font-medium`) para que o conteúdo digitado não dispute atenção com o label. O campo `mono` do `Input` usa `font-medium` (500), coerente com *Monospace (Código)*.

<!-- B1 -->
## 2. Tokens de Cor & Foco Canônico

*(seção 2 do `/design` — lista `colorSwatches` de `app/pages/design.vue`)*

### 2.1 As 8 cores oficiais

| # | Token | HEX | Tailwind | Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Navy (Ação Primária & Sidebar)** | `#112051` | `bg-brand-primary` | Ação máxima em degradê (`Button` `primary` e cabeçalho de modal: da esquerda `#112051` para a direita `#0364f7`; trilha preenchida do `UiSlider` começa em `#112051` e segue para `#0364f7`/`#4ed813` — §5.14; borda em degradê cônico giratório e barra de progresso do `UiLoading` percorrem as mesmas três cores — §5.17); demais superfícies em cor sólida — cabeçalho executivo e sidebar da Área Administrativa (hover `brand.primary-raised` `#1b2e6b` no menu legado, §3.5) |
| 2 | **Verde Accent (Accent & Prestígio)** | `#4ed813` | `bg-brand-accent` | Destaques executivos, ícones e chips sobre chrome escuro; foco de controles em `#1a9e07`; último trecho da trilha do `UiSlider` (§5.14) |
| 3 | **Verde Esmeralda (Status Positivo)** | `#047857` | `bg-emerald-700` | Status "Publicado"/Concluído, confirmações, dia "Hoje" |
| 4 | **Vermelho Rosa (Erro & Alerta)** | `#be123c` | `bg-rose-700` | Erros, validações falhas, alertas críticos |
| 5 | **Índigo (Revisão & Auditoria)** | `#4338ca` | `bg-indigo-700` | Revisão aprovada, trilha de auditoria |
| 6 | **Rate Limit (Bloqueio 15 Minutos)** | `#e11d48` | `bg-rose-600` | Cor semântica de bloqueio de segurança |
| 7 | **Azul Estrutural (Estrutura Dark)** | `#0364f7` | `bg-brand-structure` | Estrutura dark: degradê de cabeçalho de modal/botão (com navy) e header da grid (texto nesses fundos em `#020617`); **card de resumo do Meu Perfil** em degradê vertical diluído `bg-gradient-to-b from-brand-structure/15 to-white` (§5.20, único degradê sobre superfície clara) — o item ativo da sidebar passou a `white/10` (§3.3) |
| 8 | **Slate 50 (App Canvas)** | `#f8fafc` | `bg-slate-50` | Fundo principal das telas e do header de tabela |

Cores semânticas de badge/estado (esmeralda = Concluído, índigo = Reconciliado, laranja = Pendente, azul = Em Análise, rose = Bloqueado) estão especificadas em [5.2 Badge](#52-badge--seção-4-do-design).

> **Regra:** componentes não introduzem hex divergente para estados compartilhados. O cabeçalho da `DataTable` usa o token `brand.primary` (`#112051`) — ver [5.11](#511-datatable--seção-13-do-design). O `Kpi` aceita `cor` livre mas recomenda-se um dos 8 tokens acima.
>
> **Accent em chrome escuro:** `#4ed813` é reservado a fundos escuros (chips e ícones sobre o navy da sidebar). Sobre superfícies claras use `#1a9e07` (foco, bordas e divisórias) e `#0f7a06` (texto) — nunca `#4ed813` puro sobre branco (1,88:1).
>
> **Texto rico (conteúdo):** os campos `UiRichText`/`UiRichTextViewer` (§5.25) usam uma allowlist de cores de **conteúdo** em `shared/rich-text.ts` (sem cor, `#112051`, `#0364f7`, `#0f7a06`, `#047857`, `#dc2626`, `#be123c`, `#92400e`, `#334155`) e tamanhos relativos (`0.9em`, `1em`, `1.15em`, `1.3em`). O **vermelho de conteúdo** `#dc2626` é distinto do vermelho de **erro** `#be123c` (`rose-700`) usado em validação.
>
> **Exceção editorial da Área Pública (change `area-publica-shell`):** o shell e o conteúdo da Área Pública usam indigo (`#4f46e5`), esmeralda (`#059669`) e púrpura (`#9333ea`) sobre `slate` para identificar, respectivamente, navegação principal, Manuais Mensais e Escopo de Projetos. Essa paleta é exclusiva da Área Pública; a Área Administrativa continua nos 8 tokens oficiais. Foco `brand.focus #1a9e07` e erro `rose-700 #be123c` permanecem canônicos. Detalhes em [`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md) §9. O **Painel de Destaques da Área Pública** acrescenta o degradê escuro sutil do hero (`from-brand-primary via-slate-950 to-indigo-950`), delimitado a essa superfície, e os badges de tipo `correcao` (`rose-700`), `melhoria` (`emerald-700`) e `nova` (`indigo-700`), sempre com rótulo textual e ícone; ver [`20 - Painel de Destaque Area Publica.md`](20%20-%20Painel%20de%20Destaque%20Area%20Publica.md).

### 2.2 Foco canônico verde `#1a9e07`

**Todos** os estados de foco de controles de formulário (`Input`, `Select`, `DatePicker`, `Checkbox`, botões) destacam-se exatamente na mesma cor `#1a9e07`:

- **Input / Select:** borda inferior e cantos inferiores via overlay `border-2 border-brand-focus` recortado com a classe utilitária `.ds-bottom-clip` (`clip-path` só nos cantos inferiores, definida em `app/assets/css/main.css`); `Select`/`DatePicker` abertos ou focados aplicam `border-b-brand-focus border-b-2` no gatilho.
- **Checkbox/Chip:** `focus-visible:ring-brand-focus/30` (anel de accent) e `focus-visible:outline-brand-focus` nos cards/câmera/upload.
- **Erro** usa o mesmo recorte em vermelho (overlay `border-2 border-rose-700` com `.ds-bottom-clip`), sempre com precedência sobre o foco.

<!-- B2 -->
## 3. Layout & Navegação

*(seção 14 do `/design` — demonstração interativa do shell)*

### 3.1 Header claro

- Fundo `bg-white` + `border-b border-slate-200`; textos herdados do container em `text-slate-900`
  (demo e real: `h-16 px-4` — nenhum filho declara cor própria de texto).
- **Zona esquerda:** botão de alternância da sidebar (`aria-label` dinâmico "Recolher sidebar"/"Expandir sidebar", `aria-controls="app-sidebar"`, `aria-expanded`) + separador `w-px h-5 bg-slate-200` + logotipo — badge de destaque `bg-brand-primary/10 text-brand-primary` com ícone `Building2` e nome **`Publications`**; **se uma logo personalizada estiver definida** em Configurações Globais → Logomarcas (`useLogomarcaHeader`), o bloco vira `<img>` (`h-8 max-w-[180px] object-contain`) no lugar do ícone + nome, voltando ao padrão quando a logo é limpa. Sem seletor, texto ou badge de empresa/filial — o sistema tem escopo único; o shell identifica a **Área Administrativa pela rota `/admin`** (`/admin/**`, layout `app/layouts/admin.vue`), enquanto a raiz `/` é a Área Pública e renderiza sem ele (`app/layouts/default.vue`).
- **Zona direita:** sino de notificações — painel `w-72 bg-white border-slate-200` com
  **cabeçalho `bg-brand-primary`** (banda navy: título `text-white`, contador `text-slate-300`),
  **lista de mensagens com fundo `#f9feee`** (área creme distintiva do corpo do painel), hover de
  item `bg-slate-100`, estado vazio `text-slate-500` e ação **"Limpar tudo" em verde
  `#0f7a06`** (verde de texto sobre superfície clara, §2.1; hover `bg-slate-100`) — + bloco
  Account no extremo direito, oposto ao botão de alternância. Abrir um fecha o outro.
- Hovers do sino e do botão da conta: `hover:bg-slate-100`.
- **Modelo anterior (header navy):** comparar na seção 14 do `/design` pelo toggle "Antigo" — ver §3.5.

### 3.2 Bloco Account

- Gatilho: avatar `h-7 w-7` circular `bg-slate-600` com iniciais `text-white` (fundo neutro — cor anterior `bg-brand-structure` substituída na revisão), **nome completo** e perfil (ex.: `Administrador`) em **duas linhas alinhadas à esquerda** (`text-left`, perfil abaixo do nome) — nome `text-xs font-normal`, perfil `text-[10px] font-normal`, ambos sem negrito — e chevron rotacionável.
- Menu (`role="menu"`, `w-56`, `bg-white border border-slate-200`, texto `text-slate-700`, hover `bg-slate-100` + pinta o rótulo com a cor do item via `.ds-item-hover-dark`/`--item-cor` (fallback `#0f172a` — superfície branca), ícones `h-3.5` com **traço 1.5** (`.ds-icon-light` — mesmo peso da sidebar), **itens em `text-xs font-light`**), nesta ordem: **Meu Perfil** — divisor `my-1 h-px bg-slate-200` — **Configurações Globais · Gestão de Usuários · Perfis de Acesso (RBAC) · Gestão de Auditoria** — divisor — **Encerrar Sessão** (rótulo em `#f45f71`).
- Fecha com clique fora (`pointerdown` global) e tecla `Escape`.
- Cores dos ícones (`MenuItem.cor`, via `:style`): `#50a1ff`, `#b070ef`, `#f5b302`, `#2dd4bf`; Encerrar Sessão `#f45f71`.

### 3.3 Sidebar retrátil com sessões colapsáveis

- **Modo expandido:** `w-52` — títulos completos; **modo rail:** `w-[46px]` — só ícones centralizados, maximizando a área de conteúdo. Transição `transition-all duration-200`, fundo `bg-brand-primary` (navy `#112051`), borda `border-r border-white/10`.
- **Item raiz:** **"Painel Executivo"** (`LayoutDashboard`), renderizado acima das sessões, sem cabeçalho — no rail vira apenas o ícone com tooltip.
- **Sessões** (`aria-expanded` no cabeçalho, chevron rotaciona 180°): **"Publicações"** (Manuais · Release Week · Escopo de Projetos), **"Movimentos"** (Esteira de Revisão · Lançar as Chamadas), **"Cadastros"** (Parceiros · Softwares) e **"Administração"** (Gestão de Usuários · Perfis de Acesso (RBAC) · Gestão de Auditoria · Configurações Globais) — recolhimento **individual**, todas abertas por padrão (estado inicial configurável em Configurações Globais → Sidebar, via `useSessoesAbertas`). Rótulo em caixa mista no dado, caixa alta no CSS (`uppercase`). Ícones coloridos (`SidebarItem.cor`) aplicam a **tinta D9** de `tinta()` (mistura 60% cor + 40% branco — ver a tabela abaixo; as cores cheias ficam abaixo de 3:1 sobre `#112051`): **Manuais** `#f45f71`, **Release Week** `Rocket` `#1a9e07`, **Escopo de Projetos** `ClipboardList` `#50a1ff`, **Esteira de Revisão** `Workflow` `#8b5cf6`, **Lançar as Chamadas** `Megaphone` `#f59e0b`, **Parceiros** `#047857`, **Softwares** `#0364f7` e, na Administração, as **mesmas cores do menu Account** — Gestão de Usuários `#b070ef`, Perfis de Acesso (RBAC) `#f5b302`, Gestão de Auditoria `#2dd4bf`, Configurações Globais `#50a1ff`. Sem cor: apenas o item raiz Painel Executivo.
- **Cabeçalho de sessão:** `text-[9px] font-bold text-slate-400 uppercase tracking-widest`, com `hover:text-white` e `focus-visible:text-white` ao recolher — recolhimento individual, chevron rotaciona 180°.
- **Tintas dos ícones sobre navy** (mistura 60% cor + 40% branco; aplicadas a ícone **e** a
  `--item-cor` pelo helper `tinta()` de [`app/composables/shellTintas.ts`](../app/composables/shellTintas.ts),
  compartilhado entre o shell real e a demo §14):

| Item | Cor cheia | Tinta (navy) |
|---|---|---|
| Manuais | `#f45f71` | `#f89faa` |
| Release Week | `#1a9e07` | `#76c56a` |
| Escopo de Projetos · Configurações Globais | `#50a1ff` | `#96c7ff` |
| Esteira de Revisão | `#8b5cf6` | `#b99dfa` |
| Lançar as Chamadas | `#f59e0b` | `#f9c56d` |
| Parceiros | `#047857` | `#68ae9a` |
| Softwares | `#0364f7` | `#68a2fa` |
| Gestão de Usuários | `#b070ef` | `#d0a9f5` |
| Perfis de Acesso (RBAC) | `#f5b302` | `#f9d167` |
| Gestão de Auditoria | `#2dd4bf` | `#81e5d9` |

- **No rail:** **todos os itens de todas as sessões** permanecem visíveis como ícones — o recolhimento das sessões (acordeão) vale **apenas no modo expandido** — sem chevrons, com divisor `h-px bg-white/15 mx-1 my-1.5` entre sessões; o estado (`aberto`) é preservado ao reexpandir. Cada item é envolto por `<UiTooltip position="right">` com o seu rótulo (desabilitado enquanto a sidebar está expandida), e a sidebar troca `overflow-hidden` por `overflow-visible` no rail para que o balão não seja cortado.
- **Item ativo:** `bg-white/10 text-lime-300` (Q1 — `lime-700` daria ≈3:1 sobre navy, falha para 12px); o ícone colorido mantém a sua tinta. **Inativo:** `text-slate-300 hover:bg-white/10` + `.ds-item-hover` — no hover a opção inteira assume a **cor do próprio item** via `--item-cor` (tinta D9 para itens com `cor`; item sem `cor` cai no fallback `#f8fafc`); o item ativo não recebe a classe e não muda no hover.
- Cada item é `<button>` com `aria-label` e rótulo `text-xs font-normal` (peso 400 — mais leve
  que o `font-medium` anterior; o item ativo se destaca pela cor/fundo, não pelo negrito).
  Ícone `h-4 w-4` com **traço 1.5** (`.ds-icon-light` — traço padrão do Lucide, 2, parecia em
  negrito em 16px); o menu Account usa o mesmo traço 1.5 (ícones `h-3.5`), chevrons de sessão e
  demais ícones do app seguem o traço 2.
- **Área de conteúdo:** `background-color:#f8fafc` (App Canvas).
- **Modelo anterior (sidebar branca + menu navy):** comparar na seção 14 do `/design` pelo toggle "Antigo" — ver §3.5.

### 3.4 Impressão de documentos (`@media print`)

Definida em [`app/assets/css/main.css`](../app/assets/css/main.css):

- Oculta `header`, `aside`, `nav`, `button:not(.print-visible)` e elementos `.no-print`.
- `body` em branco/preto, `font-size: 11pt`.
- Utilitários: `.print-page-break` (`page-break-before: always`) e `.print-clean` (remove borda/sombra).

### 3.5 Modelo legado (comparação na vitrine §14)

- **Propósito:** a seção 14 do `/design` permite comparar o **modelo atual** (padrão — header claro
  + sidebar navy, idêntico ao shell real, §3.1/§3.3) com o **modelo legado** (header navy + sidebar
  branca + menu navy). O toggle **"Atual | Antigo (comparação)"** aplica a classe `ds-shell-antigo`
  ao container da demo quando "Antigo" está selecionado — **só a vitrine muda**; o shell real
  (`AppHeader`/`AppSidebar`) segue sempre o modelo atual.
- **Mapa de comparação** (colunas "Antigo" × "Atual"; permanecem iguais: área de conteúdo, impressão, larguras
  `w-52`/`w-[46px]`, árvore e ordem da navegação):

| Elemento | Antigo (comparação) | Atual (padrão) |
|---|---|---|
| Header (fundo/texto) | `bg-brand-primary text-[#f8fafc]` | `bg-white border-b border-slate-200 text-slate-900` (cor herdada pelo container) |
| Badge do logo | `bg-lime-500/15 text-brand-accent` | `bg-brand-primary/10 text-brand-primary` |
| Hover do botão da conta | `hover:bg-white/5` | `hover:bg-slate-100` |
| Menu Account (fundo/borda) | `bg-brand-primary border-slate-700` | `bg-white border-slate-200` |
| Menu Account (rótulo/hover) | `text-[#f8fafc] hover:bg-brand-structure/60` | `text-slate-700 hover:bg-slate-100` |
| Menu Account (divisor) | `bg-white/40` | `bg-slate-200` |
| Sidebar (fundo/borda) | `bg-white border-r border-slate-200` | `bg-brand-primary border-r border-white/10` |
| Rótulo inativo | `text-slate-600` | `text-slate-300` |
| Hover do item raiz | `hover:text-slate-900 hover:bg-slate-100` | `hover:text-white hover:bg-white/10` |
| Item colorido (hover) | cor cheia via `--item-cor` (fallback `#0f172a`, regra `.ds-shell-antigo`) | tinta D9 via `--item-cor` (`tinta()`, fallback `#f8fafc`) |
| Item ativo | `bg-brand-structure/10 text-lime-700` | `bg-white/10 text-lime-300` |
| Cabeçalho de sessão | `text-slate-400 hover:text-slate-600` | `text-slate-400 hover:text-white` |
| Divisor no rail | `bg-slate-200` | `bg-white/15` |
| Sino/painel (demonstração) | painel navy integral, sem banda separada | banda `bg-brand-primary`, lista `bg-[#f9feee]`, "Limpar tudo" `text-[#0f7a06]` |

- **Tintas dos ícones sobre navy:** a tabela das 10 tintas D9 migrou para [§3.3](#33-sidebar-retrátil-com-sessões-colapsáveis) —
  tanto o shell real quanto a demo §14 as aplicam pelo mesmo helper `tinta()`
  (`app/composables/shellTintas.ts`).

- **Estados:** o ativo do modelo atual usa `lime-300` porque o `lime-700` do legado daria ≈3:1 sobre navy (falha para 12px); o menu Account é **branco no atual** (§3.2 — ícones com as cores cheias, rótulo `text-slate-700`, hover via `.ds-item-hover-dark` com fallback `#0f172a`) e **navy no legado** (fallback `#f8fafc` pela regra `.ds-shell-antigo .ds-item-hover-dark:hover` em `main.css`); o modo rail usa os mesmos ternários (markup único, sem duplicação).

### 3.6 Shell da Área Pública

- `app/layouts/default.vue` monta `PublicHeader` + `PublicSidebar` + `<main>`; o shell administrativo
  de `/admin/**` não é reutilizado.
- Header: `h-16 bg-white border-b border-slate-200`; à esquerda a logo de `logo_login_url` (a mesma
  da tela de login) + **“Dicas Teorema”**, com fallback `Building2`; à direita busca global, tema e
  “Entrar”. No mobile, menu, busca e “Entrar” em ícone.
- Sidebar: `w-72`, branca, sem rail, `sticky top-16`; blocos Home, Releases Week (ano -> mês ->
  semana), Manuais Mensais (ano -> mês) e Escopo de Projetos (projeto -> sistemas). Abaixo de `lg`
  vira drawer com backdrop, `role="dialog"` e foco controlado.
- Tema claro/escuro exclusivo da Área Pública (`darkMode: 'class'`), aplicado em
  `[data-publico-shell]`; o `/admin` permanece no tema atual. O cookie `publico-tema` e o script
  anti-flash preservam a escolha.
- Paleta: indigo/esmeralda/púrpura sobre `slate` (exceção §2.1); foco `brand-focus`, erro `rose-700`.
- Painel de Destaques: hero da release, manuais em destaque por item, ranking/recentes e histórico filtrável; hero com degradê sutil (exceção §2.1) e badges de tipo `correcao`/`melhoria`/`nova`.
- Vitrine: `/design` §29 (shell público + painel de destaques com dados de demonstração).
- Referência completa: [`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md).

<!-- B3 -->
## 4. Convenções Globais

Regras que valem para **todos** os componentes (derivadas da spec `design-system` e do código).

### 4.1 Uso e auto-import

- Componentes em `app/components/ui/` seguem o auto-import padrão do Nuxt (scan de `~/components` com `pathPrefix: true`): o nome no template deriva da pasta + arquivo, **basta `<UiButton />` no template, sem import manual e sem configuração em `nuxt.config.ts`**. Exceção: composables/utilitários continuam importados normalmente (`import { useToast } from '../composables/useToast'`).
- Ícones: sempre `@lucide/vue` (`import { Save } from '@lucide/vue'`), com `aria-hidden="true"` quando decorativos.

### 4.2 Contrato de eventos

- O evento **`change` emite o valor resultante** da alteração (mesmo tipo do `modelValue` correspondente) — **nunca** um `Event` bruto do DOM. Ex.: `Select` emite `change('1.01.01.02')`, não `change(Event)`.
- Controles com estado usam `v-model` (`modelValue` + `update:modelValue`); `change` é o evento semântico adicional para efeitos colaterais.
- `Input` emite `update:modelValue` sempre como `string`.

### 4.3 Vocabulário de enums e idioma

- **Enums voltados a consumidores em inglês**; texto de exibição em pt-BR. Ex.: `variant="done"` renderiza "Concluído", `BadgeVariant = 'done' | 'reconciled' | 'pending' | 'inReview' | 'blocked' | 'neutral'`.
- Vocabulários de `variant` são semanticamente distintos por componente (status ≠ cor ≠ chrome): nunca misturar significados dentro do mesmo enum.
- **Alias PT do Tooltip** (`topo`, `rodape`, `esquerda`, `direita`) permanecem aceitos, marcados `@deprecated` — prefira `top`, `bottom`, `left`, `right`.

### 4.4 Foco e cores compartilhados

- Foco de controles de formulário: **somente** verde `#1a9e07` (ver [2.2](#22-foco-canonico-verde-1a9e07)); erro: vermelho canônico de componente. Nenhum hex divergente para estados compartilhados — derivar sempre dos tokens da [seção 2](#2-tokens-de-cor--foco-canônico).

### 4.5 Acessibilidade & teclado

- Rótulo associado ao controle (prop `label` + `useId()` para `label[for]`/`aria-labelledby`).
- Papéis e estados ARIA nos compostos: `role="combobox"`/`listbox`/`option` (Select), `role="grid"`/`gridcell` (Calendar), `role="dialog"` (CameraWeb), `role="menu"`/`menuitem`/`menuitemradio` (menus do shell), `aria-expanded`, `aria-checked`, `aria-selected`, `aria-current="date"`.
- Toda ação disponível via mouse tem caminho por teclado (setas, `Enter`, `Space`, `Escape`, `Tab` com `focus-visible`).
- Notificações anunciadas a leitores de tela: container de toasts com `role="status"` `aria-live="polite"`.

### 4.6 Toasts: API do `useToast`

```ts
const { toast } = useToast()

toast.success('Release Publicada', 'Release Week #39 publicada na Área Pública.')   // success | warning | danger | info
toast.danger('Falha no Upload', 'Arquivo muito grande. Tente novamente.', 0)         // duration em ms
```

- Auto-dismiss padrão **5000 ms** com barra de progresso de 2.5 px; `duration <= 0` ⇒ toast **persistente** (sem barra, sem remoção automática).
- `ToastContainer` fica montado globalmente em `app/app.vue` — os toasts funcionam em qualquer rota.

<!-- B4 -->
## 5. Componentes

Ordem = numeração do `/design`. Auto-importados (ver [4.1](#41-uso-e-auto-import)).

### 5.1 Button — seção 3 do `/design`

**Arquivo:** `app/components/ui/Button.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'outline' \| 'danger' \| 'accent'` | `'primary'` | Hierarquia de ação |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | `sm` 11px · `md` 12px · `lg` 14px; **altura uniforme por size** (borda contida no box, idêntica entre variantes): `h-7` 28px · `h-8` 32px · `h-10` 40px |
| `disabled` | `boolean` | `false` | `opacity-50 cursor-not-allowed`, suprime `click` |
| `loading` | `boolean` | `false` | Spinner + `disabled` nativo; suprime `click` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Tipo do `<button>` nativo |

- **Emits:** `click(event: MouseEvent)` — só dispara se `!disabled && !loading`.
- **Slots:** `default`, `leftIcon`, `rightIcon`.
- **Variantes:** `primary` = `bg-gradient-to-r from-brand-primary to-[#0364f7] hover:brightness-110 active:brightness-95 text-white` (ação máxima: "Salvar", "Entrar"; degradê da esquerda `#112051` para a direita `#0364f7`, hover/active só variam o brilho) · `outline` = branco + borda `slate-300` ("Cancelar", "Exportar CSV") · `danger` = rosa `rose-50/200/700` ("Excluir") · `accent` = verde `lime-50/300/900` (ação auxiliar).
- **Gotchas:** classes de base `rounded-lg font-semibold transition-all`; foco `focus-visible` verde do sistema (`brand-focus`, `#1a9e07`).

```vue
<UiButton variant="primary" :loading="salvando" @click="salvar">
  <template #leftIcon><Save class="h-3.5 w-3.5" /></template>
  Salvar Alterações
</UiButton>
```

### 5.2 Badge — seção 4 do `/design`

**Arquivo:** `app/components/ui/Badge.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `variant` | `BadgeVariant` | `'neutral'` | Status semântico (ver tabela) |
| `pulsing` | `boolean` | `false` | Dot com `animate-ping` |
| `showIcon` | `boolean` | `true` | Ícone da variante (se houver) |
| `size` | `'sm' \| 'md'` | `'md'` | `sm` 10px · `md` 11px |

- **Emits:** nenhum · **Slots:** `default` (substitui o rótulo interno).
- **`BadgeVariant` = `'done' | 'reconciled' | 'pending' | 'inReview' | 'blocked' | 'neutral' | 'aberta' | 'publicado' | 'arquivado' | 'alteracoes' | 'correcao' | 'melhoria' | 'nova'`** (enum em inglês, display em pt-BR; `aberta`/`publicado`/`arquivado` são as variantes semânticas do módulo Release Week e `alteracoes` é a do catálogo mensal de Manuais).

| Variant | Rótulo (PT) | Fundo / Borda / Texto | Ícone |
| :--- | :--- | :--- | :--- |
| `done` | Concluído | `bg-emerald-50` / `border-emerald-200` / `text-emerald-800` | `CheckCircle2` |
| `reconciled` | Reconciliado | `bg-indigo-50` / `border-indigo-200` / `text-indigo-800` | `ShieldCheck` |
| `pending` | Pendente | `bg-orange-50` / `border-orange-200` / `text-orange-800` | `Clock` |
| `inReview` | Em Análise | `bg-blue-50` / `border-blue-200` / `text-blue-800` | `Search` |
| `blocked` | Bloqueado | `bg-rose-50` / `border-rose-200` / `text-rose-700` | `AlertTriangle` |
| `neutral` | Neutro | `bg-slate-100` / `border-slate-200` / `text-slate-700` | — |
| `aberta` | Aberta | `bg-sky-50` / `border-sky-200` / `text-sky-800` | `Clock` |
| `publicado` | Publicado | `bg-emerald-50` / `border-emerald-200` / `text-emerald-800` | `Rocket` |
| `arquivado` | Arquivado | `bg-slate-100` / `border-slate-300` / `text-slate-600` | `Archive` |
| `alteracoes` | Alterações Solicitadas | `bg-amber-50` / `border-amber-200` / `text-amber-800` | `MessageSquareWarning` |
| `correcao` | Correção | `bg-rose-50` / `border-rose-200` / `text-rose-700` | `Wrench` |
| `melhoria` | Melhoria | `bg-emerald-50` / `border-emerald-200` / `text-emerald-800` | `Sparkles` |
| `nova` | Nova Funcionalidade | `bg-indigo-50` / `border-indigo-200` / `text-indigo-800` | `PlusCircle` |

- **Badges de tipo no painel público:** `correcao`/`melhoria`/`nova` são exclusivos do conteúdo editorial da Área Pública; o `rose-700` de Correção não substitui o `rose-700` de erro/validação. O rótulo textual e o ícone são obrigatórios.
- **Disciplina Zero-Pill:** `rounded-md` obrigatório (nunca `rounded-full`).
- **Gotchas:** `variant="blocked"` força o dot pulsante mesmo com `pulsing=false`; `neutral` não tem ícone. Com `prefers-reduced-motion: reduce` a pulsão para (regra global de `main.css` — vale para animações e transições de todo o kit).

**Mapeamento de status de publicação → variante** (guia de uso do Publications; as variantes acima são fixas no componente):

| Status da publicação | Variante | Badge exibido |
| :--- | :--- | :--- |
| Publicado | `done` | Publicado (exibido como "Concluído" pelo componente) |
| Agendado | `pending` | Agendado (exibido como "Pendente") |
| Em Revisão | `inReview` | Em Revisão (exibido como "Em Análise") |
| Bloqueado | `blocked` | Bloqueado |
| Rascunho | `neutral` | Rascunho (exibido como "Neutro") |
| — | `reconciled` | **Reservada** — variante legada ("Reconciliado"), sem uso no domínio de publicações |

> Os rótulos exibidos vêm do componente; para rótulos próprios do domínio, use o slot `default` (ex.: `<UiBadge variant="done">Publicado</UiBadge>`).

**Mapeamento do status da Release Week → variante** (módulo `/admin/release-week`):

| Status | Variante | Badge exibido |
| :--- | :--- | :--- |
| Aberta | `aberta` | Aberta |
| Em Revisão | `inReview` | Em Revisão |
| Aprovado | `reconciled` | Aprovado (o rótulo vem do slot `default`) |
| Publicado | `publicado` | Publicado |
| Arquivado | `arquivado` | Arquivado (fora da listagem padrão) |

**Mapeamento do status do catálogo mensal de Manuais → variante** (módulo `/admin/manuais`):

| Status | Variante | Badge exibido |
| :--- | :--- | :--- |
| Rascunho | `neutral` | Rascunho (o rótulo vem do slot `default`) |
| Em Revisão | `inReview` | Em Revisão |
| Alterações Solicitadas | `alteracoes` | Alterações Solicitadas |
| Aprovado | `reconciled` | Aprovado (o rótulo vem do slot `default`) |
| Publicado | `publicado` | Publicado |
| Arquivado | `arquivado` | Arquivado (fora da listagem padrão) |

**Mapeamento do status da chamada → variante** (`/admin/lancar-chamadas` e `/admin/esteira-revisao`):

| Status | Variante | Badge exibido |
| :--- | :--- | :--- |
| Revisar | `pending` | Revisar (o rótulo vem do slot `default`) |
| Aprovado | `reconciled` | Aprovado (o rótulo vem do slot `default`) |
| Recusado | `blocked` | Recusado (o rótulo vem do slot `default`) |
| Publicar | `done` | Publicar (aguardando o pai; o rótulo vem do slot `default`) |
| Publicado | `publicado` | Publicado (no portal) |

```vue
<UiBadge variant="done" />                      <!-- "Concluído" -->
<UiBadge variant="blocked" size="sm" />          <!-- pulsante, sempre -->
<UiBadge variant="pending">{{ statusCustom }}</UiBadge>
```

<!-- C1 -->
### 5.3 Input — seção 5 do `/design`

**Arquivo:** `app/components/ui/Input.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string \| number` | `''` | `v-model` (emitido sempre como `string`) |
| `label` | `string` | `''` | Rótulo associado (`useId()` no `[for]`); fica `text-rose-700` em erro |
| `type` | `string` | `'text'` | Tipo nativo do input |
| `autocomplete` | `string` | `''` | Atributo nativo repassado ao `<input>` (ex.: `username`, `current-password`; sem a prop o atributo de consumidor caía no wrapper por fallthrough) |
| `placeholder` | `string` | `''` | Placeholder (`text-slate-400`) |
| `disabled` | `boolean` | `false` | `bg-slate-200 opacity-60` |
| `error` | `string` | `''` | Erro do campo: **sem texto visível abaixo** — só overlay vermelho + `AlertCircle` à direita com tooltip; a mensagem fica no DOM oculta (`sr-only`, `role="alert"` + `aria-describedby`) para leitores de tela |
| `helperText` | `string` | `''` | Texto auxiliar abaixo (`11px slate-500`) |
| `leftIcon` / `rightIcon` | `Component \| null` | `null` | Ícone interno esquerdo/direito |
| `rightIconLabel` | `string` | `'Ação do campo'` | Nome acessível da ação de ícone à direita (botão focável por teclado) |
| `mono` | `boolean` | `false` | `font-mono tabular-nums font-medium` (códigos/valores) |
| `labelClass` / `inputClass` | `string` | `''` | Classes extras de label/input |
| `forceFocus` | `boolean` | `false` | Simula o destaque de foco sem foco real |
| `mask` | `string` | `''` | Máscara de digitação: `9` = dígito, `A` = alfanumérico, demais = literal fixo (ex.: `99999-999`, `(99) 99999-9999`) |

- **Emits:** `update:modelValue(value: string)` · `rightIconClick()` (sem payload). O `rightIcon` é um botão com `type="button"`, foco visível, `aria-label` (`rightIconLabel`) e acionamento por `Enter`/`Space`.
- **Slots:** `labelRight` (à direita do label), `leftIcon`, `rightIcon` (alternativa à prop).
- **Máscara:** formata durante a digitação (deleção no meio desloca os caracteres seguintes, padrão de máscara) e **o `v-model` recebe sempre a string já formatada** — quem grava o valor leva o texto com os literais; `maxlength` assume o tamanho da máscara.
- **Foco canônico:** overlay `border-2 border-brand-focus` com classe `.ds-bottom-clip` — apenas a borda inferior e os dois cantos arredondados inferiores (`h-[34px]`, `rounded-lg`).
- **Erro:** overlay idêntico em `border-rose-700` + `AlertCircle` interno à direita dentro de `<UiTooltip position="top">` (mensagem no hover); **tem precedência sobre `rightIcon`**; **nenhum texto aparece abaixo do componente** — a mensagem permanece no DOM oculta (`sr-only`) com `role="alert"` e `aria-describedby`, anunciada por leitores de tela.
- **Gotchas:** input nativo com `outline:none` forçado; altura fixa `34px` — mesmo gabarito do `Select`; valor em `text-xs font-normal` (`mono` = `font-medium`, ver §1.2).

```vue
<UiInput
  v-model="senha"
  label="Senha de Acesso"
  type="password"
  :left-icon="Lock"
  :right-icon="show ? EyeOff : Eye"
  @right-icon-click="show = !show"
/>

<UiInput v-model="slug" label="Slug da Publicação" mono :error="erroSlug" helperText="Formato: release-week-2026-w39" />
```

<!-- C2 -->
### 5.4 UploadFiles & CameraWeb — seção 6 do `/design`

#### UploadFiles

**Arquivo:** `app/components/ui/UploadFiles.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `rotulo` | `string` | `'Arraste os arquivos aqui ou clique para adicionar'` | Rótulo do estado vazio |
| `dica` | `string` | `'PNG, JPG, WebP ou GIF'` | Subtítulo de formatos |
| `sugestao` | `string` | `''` | Dica opcional (ex.: dimensão) |
| `aceitar` | `string` | `'*'` | `accept` do input de arquivo |
| `multiple` | `boolean` | `false` | Seleção múltipla + lista de nomes |
| `mostrarCamera` | `boolean` | `true` | Exibe a ação "Tirar foto" |
| `preview` | `string` | `''` | URL de preview externo (sobrepõe a interna) |
| `forma` | `'circular' \| 'retrato' \| 'retangular'` | `'circular'` | Forma do preview |
| `compacto` | `boolean` | `false` | Modo enxuto para colunas estreitas: padding `p-1.5`, ações `size-6` (`bottom-1 right-1 gap-1`) e estado vazio com `px-2 gap-0.5` + nuvem `h-6` |
| `alt` | `string` | `'Pré-visualização do arquivo'` | Texto alternativo da imagem |
| `listaSeparada` | `boolean` | `false` | **Modo lista separada:** os arquivos aparecem em cards **acima** e a caixa tracejada (prompt) fica **abaixo**, sumindo no single-file enquanto houver arquivo selecionado |
| `rotuloLista` | `string` | `'Novos arquivos (serão enviados ao salvar)'` | Rótulo da lista de arquivos no modo `listaSeparada` |
| `acoesNoFoco` | `boolean` | `true` | Ações de canto reaparecem no **foco de teclado** (`group-focus-within`); `false` = aparecem **só no hover do mouse** (ex.: logo do parceiro) |

- **Emits:** `change(arquivos: File[] | null)` — lista selecionada, ou `null` ao excluir · `camera()` (sem payload, para abrir o `CameraWeb`).
- **Slots:** nenhum.
- **Estados visuais** (borda `rounded-xl border-2`): **vazio** = tracejada `slate-300` + fundo `slate-50/50`, círculo com ícone `Cloud`, rótulo verde, dica e sugestão; **arrastando** = tracejada verde `border-brand-accent bg-brand-accent/10` + overlay “Solte os arquivos aqui” com `dropEffect = copy`; **preenchido** = sólida `border-slate-200 bg-white`, altura equivalente (`min-h-28`).
- **Modo `listaSeparada`:** a raiz fica **sem borda** (`grid gap-3`) e renderiza — quando há arquivo — o rótulo `rotuloLista` + um **card `emerald` por arquivo** (`border-emerald-200 bg-emerald-50`, ícone `FileText`, nome truncado e tamanho em pt-BR, remover à direita em `rose-600` no hover). A caixa tracejada abaixo usa ícone `Upload` (não `Cloud`) com `rotulo`/`dica` e **some enquanto houver arquivo no single-file** (fica só o card), **voltando** quando o arquivo é removido; no `multiple` ela permanece para acrescentar mais. Sem nome por dentro da caixa e **sem ações de canto** (remover é só do card).
- **Preview por `forma`:** `circular` 96px `object-cover` (preenche o círculo, corte centralizado — fotos horizontais da câmera não ficam "achadas") · `retrato` 96×72 `object-cover` · `retangular` `max-h-20 contain` (logo integral, sem corte).
- **Ações no canto inferior direito**, ordem **Incluir → Câmera → Excluir**, todas com `<UiTooltip>` do sistema (sem `title` nativo): `size-11` no toque e `sm:size-8` — sempre visíveis em telas pequenas, no desktop aparecem em hover/foco (`sm:opacity-0 group-hover:opacity-100`) — o reveal por foco é controlado por `acoesNoFoco` (default `true`; `false` = só no hover). Excluir desabilitado sem arquivo. No modo `compacto` as ações viram `size-6` com ícones `h-3.5` e recuo `bottom-1 right-1 gap-1` (cabe em colunas de ~88px sem vazar/ser cortado pelo `overflow-hidden`).
- **Gotchas:** aceita clique e drag & drop em **toda a raiz** (`dragover/dragleave/drop`), com overlay “Solte os arquivos aqui” e proteção contra o flicker de `dragleave` ao passar por filhos; expõe `aplicarArquivos(File[])` para consumidores encaminharem drops de áreas externas (ex.: galeria de mídias), sem duplicar o evento interno. No single-file a prévia usa o 1º arquivo `image/*`; `URL.createObjectURL` é liberada com `revokeObjectURL` ao trocar/remover; no modo múltiplo lista os nomes + contagem; no modo `listaSeparada` a prévia de imagem não é montada (o arquivo vira card) e o drop funciona sobre a área da lista.

```vue
<UiUploadFiles
  forma="retrato"
  aceitar="image/*"
  :multiple="false"
  @change="(files) => arquivos = files"
  @camera="cameraAberta = true"
/>
```

#### CameraWeb

**Arquivo:** `app/components/ui/CameraWeb.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `autoIniciar` | `boolean` | `true` | Solicita a câmera ao montar |

- **Emits:** `foto(dataUrl: string)` (JPEG `toDataURL('image/jpeg', 0.9)`) · `fechar()`.
- **Slots:** nenhum.
- **Estados internos:** `'ocioso'` (botão "Iniciar câmera") → `'carregando'` ("Solicitando acesso à câmera...") → `'pronto'` (vídeo) ou `'erro'` (`role="alert"`, mensagens de permissão negada/HTTPS, com ação **"Tentar novamente"**).
- **Comportamento:** renderiza **exatamente via `UiModal`** (`size="xs"`, título "Câmera Web", subtítulo "Captura de imagem", ícone de câmera — com header navy, backdrop `bg-zinc-900/50`, focus-trap e scroll-lock do modal) contendo uma `UiModalSection` "Pré-visualização"; vídeo espelhado por padrão (`scale-x[-1]`, alternável pelo botão **Espelhar** do rodapé, que aplica o mesmo eixo na imagem capturada); seletor de dispositivo **apenas se houver mais de 1 câmera**, usando o **`UiSelect`** do sistema (`label="Câmera"`, `clearable=false`, opções `deviceId`/label com fallback `Câmera N`); fallback para qualquer câmera se o `deviceId` ativo falhar.
- **Gotchas:** ações Fechar (o `X` do próprio `UiModal`, com tooltip), **Espelhar**, Capturar e Sair usam o `<UiTooltip>` do sistema; o rodapé usa largura total — **Espelhar à esquerda** e Capturar/Sair à direita; Espelhar alterna `aria-pressed` e vale para pré-visualização **e** captura (`ctx.translate/scale(-1,1)`); o backdrop **não** fecha a câmera (regra do modal) — fechamento por X, `Escape` ou Sair; ao fechar o modal o `stream` é interrompido e o `fechar` é emitido (o consumidor deve desmontar com `v-if`); capturar desabilitado fora do estado `pronto`; **`stream.getTracks().forEach(stop)`** ao fechar e em `onBeforeUnmount` (libera o dispositivo); requer HTTPS (mensagem de erro própria).

```vue
<UiCameraWeb @foto="(dataUrl) => avatarFoto = dataUrl" @fechar="cameraAberta = false" />
```

<!-- C3 -->
### 5.5 Tooltip — seção 7 do `/design`

**Arquivo:** `app/components/ui/Tooltip.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `content` | `string` | `''` | Texto (alternativa ao slot `content`) |
| `position` | `TooltipPosition \| TooltipPositionLegacy` | `'top'` | `top` \| `bottom` \| `left` \| `right` |
| `theme` | `'dark' \| 'light'` | `'dark'` | `dark` = `bg-brand-primary text-white` |
| `delay` | `number` | `150` | Delay de exibição (ms) |
| `disabled` | `boolean` | `false` | Não exibe |

- **Emits:** nenhum · **Slots:** `default` (gatilho, obrigatório), `content` (fallback: prop `content`).
- **Posições:** 4 direções canônicas em inglês; **alias PT** `topo`/`rodape`/`esquerda`/`direita` aceitos (`TooltipPositionLegacy`, `@deprecated`); default do normalizador: `right`.
- **Micro-seta:** bordas CSS triangulares na cor do tema; `z-50`, `pointer-events-none`, `whitespace-nowrap`.
- **Comportamento:** mostra em `mouseenter` e no foco **de teclado** (`:focus-visible`) após `delay`, oculta em `mouseleave`/`focusout`; foco **programático** (ex.: `UiModal` focando o botão X na abertura) **não** abre o balão; `<Transition>` fade + scale.
- **Auto-ajuste de posição:** ao ficar visível, o balão mede o espaço realmente disponível — viewport e todos os ancestrais com `overflow` que recortam (ex.: painel do `UiModal` com `overflow-hidden`, corpo rolável) — e é deslocado pela propriedade CSS `translate` quando seria cortado, mantendo a `position` pedida (nunca troca de lado). A seta é contra-deslocada (limitada às margens do balão) para continuar apontando ao gatilho. Recalcula em `scroll` (fase de captura) e `resize`. Como `translate` não é propriedade de `transform`, a correção não interfere no `-translate-x-1/2` do centroamento nem na escala da `<Transition>`.
- **Gotchas:** único componente do sistema com **posições PT pré-existentes aceitas como alias** (contrato de enums da spec).

```vue
<UiTooltip content="Exportar em XLS" position="top">
  <UiButton variant="outline"><template #leftIcon><Download class="h-3.5 w-3.5" /></template>Exportar</UiButton>
</UiTooltip>
```

### 5.6 Toast & useToast — seção 8 do `/design`

**Arquivos:** `app/components/ui/ToastContainer.vue` + `app/composables/useToast.ts`

- **Container:** montado globalmente em `app/app.vue`; `fixed top-5 right-5 z-50`, `role="status"` `aria-live="polite"`, `pointer-events-none` no container e `pointer-events-auto` nos cards; entra deslizando da direita (`TransitionGroup`).
- **Tipos (`ToastType`):** `success` (esmeralda, `CheckCircle2`) · `warning` (laranja, `AlertTriangle`) · `danger` (rose, `AlertOctagon`) · `info` (sky, `Info`).
- **Estrutura do card:** header com ícone em badge suave + título em destaque + botão X; corpo com `message`; **barra de progresso de 2.5 px** (`h-[2.5px]`, keyframe global `fp-toast-progress`) indicando o auto-dismiss.
- **Cores do card** (fundo suave + borda fina): `bg-emerald-50/95 border-emerald-200/90 text-emerald-950` (análogas nas demais).
- **API:** ver [4.6](#46-toasts-api-do-usetoast) — auto-dismiss 5000 ms; `duration <= 0` remove a barra e o toast fica persistente; um `setTimeout` por toast (cancelado ao fechar manualmente).
- **Gotchas:** keyframe **fora de `<style scoped>`** de propósito (o Vue renomeia keyframes escopados e quebraria o `:style` dinâmico).

```ts
const { toast } = useToast()
toast.success('Release Publicada', 'A Release Week #39 está disponível na Área Pública.')
toast.warning('Revisão Pendente', 'O Manual de Instalação aguarda aprovação.')
```

<!-- C4 -->
### 5.7 Select — seção 9 do `/design`

**Arquivo:** `app/components/ui/Select.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string \| number` | `''` | `v-model`; `clear` emite `''` |
| `options` | `SelectOption[]` | `[]` | `{ value, label, badge?, description? }` |
| `label` | `string` | `''` | Rótulo (`useId()` ↔ `for`/`aria-labelledby`) |
| `placeholder` | `string` | `'Selecione uma opção...'` | Texto sem seleção |
| `searchPlaceholder` | `string` | `'Digitar para pesquisar...'` | Placeholder da busca |
| `disabled` | `boolean` | `false` | `bg-slate-200 opacity-60`, `aria-disabled` |
| `clearable` | `boolean` | `true` | Botão X (limpa emite `''`) |
| `leftIcon` | `Component \| null` | `null` | Ícone à esquerda do gatilho |
| `helperText` / `error` | `string` | `''` | Ajuda abaixo / erro **sem texto visível** (só overlay + `AlertCircle`; mensagem `sr-only` com `role="alert"`) |
| `labelClass` | `string` | `''` | Classes extras no label |
| `remote` | `boolean` | `false` | Modo de busca remota; o consumidor carrega as opções |
| `loading` | `boolean` | `false` | Indicador de carregamento da busca remota |
| `hasMore` | `boolean` | `false` | Exibe “Carregar mais” no modo remoto |
| `selectedOption` | `SelectOption \| null` | `null` | Mantém o label selecionado fora da página atual |
| `remoteError` | `string` | `''` | Falha da busca remota, com nova tentativa |

- **Emits:** `update:modelValue(value: string | number)` · **`change(value: string | number)`** (valor, nunca `Event`); no modo remoto também `search(termo)`, `loadMore` e `retry`.
- **Slots:** `leftIcon` (com fallback para a prop), `rightIcon`.
- **ARIA:** gatilho `role="combobox"` com `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, **`aria-activedescendant`**; lista `role="listbox"`; itens `role="option"` + `aria-selected`; label clicável foca o gatilho.
- **Teclado:** `Enter`/`Space`/`↓` abrem · `Esc` fecha · `↑`/`↓` navegam · `Enter` seleciona · `Tab` passa adiante. Com o dropdown **aberto** o `Esc` é consumido no próprio select (`stopPropagation`) — **não fecha um `UiModal` aberto por baixo**; o `Esc` seguinte, sem popup, fecha o modal (precedência: popup → modal). Ao fechar por **seleção (mouse ou teclado)**, `Esc` ou toggle, o foco **volta ao gatilho de forma determinística** — sem isso o `mousedown` na opção arrastava o foco para o ancestral focável mais próximo (o painel do `UiModal`, `tabindex="-1"`): o `Tab` seguinte caía no `X` do cabeçalho e o `Enter` fechava o modal, perdendo o formulário.
- **Busca em tempo real:** normalização **NFD insensível a acentos e maiúsculas** sobre `label`, `value`, `description` e `badge`; contador "N opções encontradas"; foco automático no campo de busca ao abrir; vazio ⇒ "Nenhum resultado encontrado para ...".
- **Modo remoto (`remote`):** o componente não filtra localmente; emite `search` ao abrir e ao digitar, mostra `loading`, `remoteError` com “Tentar novamente”, `hasMore` com “Carregar mais” e mantém o label via `selectedOption` quando o valor não está na página. O modo local (sem `remote`) permanece inalterado.
- **Visual:** gatilho `h-[34px]` (mesmo gabarito do `Input`); aberto = `border-b-brand-focus border-b-2` + chevron verde rotacionado; **erro** = overlay `border-2 border-rose-700` com recorte `.ds-bottom-clip` + `AlertCircle` com `<UiTooltip>` (mensagem no hover) e **sem texto abaixo do gatilho** (mensagem `sr-only` com `role="alert"`); item destacado `bg-lime-50/60`, selecionado `font-semibold` + `Check` verde.
- **Gotchas:** fecha com clique fora (listener global `window`); o **X de limpar** tem `aria-label="Limpar seleção"`, responde a `Enter`/`Space` nativamente (o `handleKeyDown` ignora keydown originado em `button`, caso contrário o `preventDefault` de abrir o dropdown cancelaria o `click` gerado pelo `Enter`) e devolve o foco ao gatilho ao limpar (o próprio X é desmontado); **auto-inversão vertical** — se não há espaço abaixo do gatilho para a lista, o dropdown abre **para cima** (`bottom-full mb-1`), medindo o limite do **ancestral rolável mais próximo** (container do formulário/corpo do modal, não só o viewport) × altura da lista, na abertura e a cada `scroll`/`resize` (listener em capture), evitando barra de rolagem no formulário; foco da busca usa `preventScroll` para não induzir scroll ao abrir; badges/contexto por item servem para listas densas (Catálogo de Publicações).

```vue
<UiSelect
  v-model="tipo"
  label="Tipo de Publicação"
  :options="tiposPublicacao"
  search-placeholder="Digitar para localizar..."
  clearable
/>
```

<!-- C5 -->
### 5.8 DatePicker & Calendar — seção 10 do `/design`

**Arquivos:** `app/components/ui/DatePicker.vue` + `app/components/ui/Calendar.vue`

#### DatePicker (popover com máscara)

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `Date \| string \| null` | `null` | `v-model` |
| `label` | `string` | `''` | Rótulo associado (`useId()`) |
| `placeholder` | `string` | `'DD/MM/AAAA'` | Placeholder da máscara |
| `disabled` | `boolean` | `false` | `bg-slate-200 opacity-60` |
| `helperText` / `error` | `string` | `''` | Ajuda abaixo / erro **sem texto visível** (só overlay + `AlertCircle`; mensagem `sr-only` com `role="alert"`) |

- **Emits:** `update:modelValue(date: Date | null)` · `change(date: Date | null)` — **só emite quando a máscara completa (10 chars) ou ao limpar** (valores intermediários não emitem).
- **Máscara:** `DD/MM/AAAA` automática ao digitar (só dígitos, validação de data real no parse).
- **Estados:** aberto/focado = `border-b-brand-focus border-b-2` (foco canônico) · erro = overlay `border-2 border-rose-700` com recorte `.ds-bottom-clip` (sem contorno em toda a volta) + `AlertCircle` em `<UiTooltip>` (mensagem no hover) e **sem texto abaixo do campo** (mensagem `sr-only` com `role="alert"`) · botão X limpa (`change(null)`).
- **Popover:** `<Transition>` com o `Calendar`; fecha ao selecionar, com `Esc` ou clique fora (listener global) — com o popover **aberto** o `Esc` é consumido aqui (`stopPropagation`) e não fecha um `UiModal` por baixo; sem popover, o `Esc` propaga (fecha o modal). Abre também no `focus` do campo. **Posicionamento fixo na viewport** — o popover usa `position: fixed` com coordenadas calculadas a partir do campo, abre para cima quando não há espaço abaixo e é limitado a `calc(100vw - 1rem)`/`calc(100vh - 1rem)`, com `overflow-y: auto`; isso evita o recorte pelo `overflow` do corpo do modal e mantém o calendário inteiro visível. A posição é recalculada em `scroll`/`resize`; se o campo sair da viewport, o popover fecha. O `Calendar` usa `w-72 max-w-full`.

#### Calendar (embutido ou dentro do popover)

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `Date \| string \| null` | *(sem default)* | Data selecionada |

- **Emits:** `update:modelValue(date: Date)` · `change(date: Date)` · `select(date: Date)` — os três disparam juntos na seleção e no atalho "Hoje".
- **Destaque mandatório do dia de hoje (regra da spec):** `border-[1.5px] border-emerald-700 bg-emerald-50/70 text-emerald-700 font-bold` + micro-dot inferior `bg-emerald-700`; selecionado = `bg-brand-primary text-white`, e **se hoje+selecionado** = `bg-emerald-700 text-white`.
- **Estrutura ARIA:** `role="grid"` → `role="row"` → `role="gridcell"`; `aria-selected`, `aria-current="date"`, `aria-label` em pt-BR por extenso; grade fixa de **42 células**; labels Dom–Sáb e meses em pt-BR.
- **Teclado (roving tabindex):** `←/→` ±1 dia, `↑/↓` ±7 dias; `tabindex=0` apenas na célula focável (foco explícito > selecionada > hoje > dia 1); troca de mês automática ao navegar para fora.
- **Rodapé:** "Hoje: dd/mm/aaaa" + botão **Hoje** (emerald-700) que navega e seleciona a data corrente (`getToday()` dinâmico — nunca congelado na instância).

```vue
<UiDatePicker v-model="dataPublicacao" label="Data de Publicação" />
<UiCalendar v-model="dataSelecionada" />
```

### 5.9 Família Checkbox — seção 11 do `/design`

**Arquivos:** `Checkbox.vue`, `BadgeCheckbox.vue`, `CheckChip.vue`, `CheckCard.vue`, `CheckboxGroup.vue` (em `app/components/ui/`)

Tipos compartilhados (exportados de `Checkbox.vue`):

```ts
type CheckboxSize     = 'sm' | 'md' | 'lg'          // 14px / 16px / 20px
type CheckboxVariant  = 'lime' | 'slate' | 'emerald' | 'indigo' | 'rose' | 'sky'
type CheckboxPosition = 'start' | 'end'
```

#### Checkbox (controle base)

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `boolean \| any[]` | `false` | Bool simples **ou** array (modo coleção com `value`) |
| `value` | `any` | `undefined` | Item representado (modo array) |
| `label` / `description` / `error` | `string` | `''` | Rótulo, descrição, erro (label `text-rose-700`) |
| `disabled` / `indeterminate` | `boolean` | `false` | Desabilitado / tri-state (ícone `Minus`) |
| `size` | `CheckboxSize` | `'md'` | Tamanho da caixa |
| `variant` | `CheckboxVariant` | `'lime'` | Cor checada |
| `checkboxPosition` | `CheckboxPosition` | `'start'` | `'end'` inverte a ordem (`flex-row-reverse`) |
| `labelClass` | `string` | `''` | Classes extras no rótulo (adicionadas por último; use `!` para vencer `text-slate-800`, ex.: `!text-slate-500` — caso de uso: rótulo cinza no card de login, `docs/08` §2) |
| `id` / `name` / `required` | `string \| undefined` / `string \| undefined` / `boolean` | `undefined` / `undefined` / `false` | Atributos do input nativo |

- **Emits:** `update:modelValue(boolean | any[])` · **`change(boolean | any[])`** (valor resultante, não `Event`).
- **Slots:** `default` (substitui o `label`).
- **A11y:** input nativo oculto `peer sr-only` + caixa customizada com `peer-focus-visible:ring-2`; `indeterminate` sincronizado na propriedade DOM nativa (`watch` + `onMounted`); id estável via `useId()` quando `id` não é passado.

#### BadgeCheckbox (checkbox + badge de metadados)

- Wrapper do `Checkbox` com badge à direita: props obrigatórias **`label`** e **`badge`**; `badgeVariant?: 'lime' | 'emerald' | 'indigo' | 'rose' | 'sky' | 'slate' | 'purple' | 'default'` (default `'default'`; `slate` = badge sólido escuro). Encaminha todos os props/emits do `Checkbox`.
- **Caso de uso:** `[x] Módulo Escopo de Projetos [Gestão]` — seleção de módulos/permissões.

#### CheckChip (toggle chip com contador)

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `boolean` | `false` | Estado do chip |
| `label` | `string` *(obrigatória)* | — | Rótulo do chip |
| `count` | `number \| string` | `undefined` | Pill com contador (`font-mono tabular-nums`) |
| `variant` | `ChipVariant = lime\|emerald\|indigo\|rose\|sky\|slate` | `'lime'` | Cor ativa |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |
| `disabled` | `boolean` | `false` | Desabilitado |
| `icon` | `Component \| undefined` | `undefined` | Ícone (substituído por `Check` quando ativo) |
| `showCheck` | `boolean` | `true` | `false` suprime o ✓ quando ativo (pill só com rótulo) |

- **Emits:** `update:modelValue(boolean)` · `change(boolean)`. É um `<button type="button">`.
- **Visual:** inativo = branca `border-slate-300`; ativo = tinta clara da variante (`bg-lime-50 border-lime-300 text-lime-900`...), exceto `slate` = sólido `bg-brand-primary border-brand-primary text-white` (contador em `bg-brand-primary-raised text-brand-accent`).
- **Caso de uso:** filtros rápidos no topo da `DataTable` — `[x] Liquidados (42)`.

#### CheckCard (cartão rico de seleção)

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `title` | `string` *(obrigatória)* | — | Título do cartão |
| `description` | `string` | `''` | Subtítulo |
| `badge` / `badgeVariant` | `string` / `'lime' \| 'emerald' \| 'indigo' \| 'slate' \| 'neutral'` | `''` / `'lime'` | Badge do cartão |
| `icon` | `Component \| undefined` | `undefined` | Ícone setorial |
| `variant` | `CheckboxVariant` | `'lime'` | Borda/fundo ao marcar |
| `checkboxPosition` | `'start' \| 'end'` | `'end'` | Posição do checkbox no cartão |
| `disabled` / `value` / `modelValue` / `id` | — | — | Como o `Checkbox` |

- **Emits:** `update:modelValue` · `change` (bool ou array). **Slots:** `default` (conteúdo extra).
- **Comportamento:** o cartão inteiro é clicável (`@click` + `@keydown.enter.prevent`), o checkbox usa `@click.stop`; checked = borda/fundo verde (`border-brand-accent bg-lime-50/30 ring-brand-accent/40`, análogos em indigo/emerald/slate); `aria-labelledby`/`aria-describedby` com ids de `useId()`.
- **Largura apertada:** o cabeçalho é `flex-wrap` — quando ícone + badge + checkbox não cabem, o checkbox quebra para a segunda linha (nunca sai do cartão) e o badge trunca com reticências (`min-w-0 truncate`); em largura folgada o layout é o mesmo de sempre (uma linha, badge completo).
- **Caso de uso:** seleção de filiais, planos, pacotes de permissão.

#### CheckboxGroup (gerenciador de coleções)

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `any[]` | `[]` | Valores selecionados |
| `options` | `CheckboxGroupOption[]` *(obrigatória)* | — | `{ value, label, description?, badge?, badgeVariant?, count?, disabled? }` |
| `label` | `string` | `''` | Rótulo do grupo |
| `showSelectAll` | `boolean` | `false` | Cabeçalho "Selecionar Todos" **tri-state** |
| `selectAllLabel` | `string` | `'Selecionar Todos'` | Texto do select-all |
| `layout` | `'vertical' \| 'horizontal' \| 'grid-2' \| 'grid-3'` | `'vertical'` | Disposição |
| `type` | `'normal' \| 'badge' \| 'chip'` | `'normal'` | Componente interno: `Checkbox` / `BadgeCheckbox` / `CheckChip` |
| `variant` | `CheckboxVariant` | `'lime'` | Cor herdada pelos itens |
| `disabled` | `boolean` | `false` | Desabilita o grupo inteiro |

- **Emits:** `update:modelValue(any[])` · `change(any[])`.
- **Select-all:** tri-state calculado apenas sobre as opções **não desabilitadas**; marcar adiciona todos os `enabledOptions` ausentes, desmarcar remove apenas esses.
- **Gotchas:** opções `disabled` herdam para o item interno; cabeçalho do grupo com divisória `border-b border-slate-100`.

```vue
<UiCheckbox label="Lembrar sessão" v-model="lembrar" />
<UiBadgeCheckbox label="Módulo Escopo de Projetos" badge="Gestão" badge-variant="emerald" v-model="escopo" />
<UiCheckChip label="Publicados" :count="42" v-model="filtro" />
<UiCheckCard title="Release Week #39" description="Semana de 28/09 a 04/10" badge="Publicada" v-model="release" />
<UiCheckboxGroup v-model="tipos" :options="tiposOptions" show-select-all layout="grid-3" type="badge" />
```

### 5.10 Kpi — seção 12 do `/design`

**Arquivo:** `app/components/ui/Kpi.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `titulo` | `string` *(obrigatória)* | — | Rótulo da métrica |
| `valor` | `string` *(obrigatória)* | — | Valor principal (`text-2xl font-bold`) |
| `cor` | `string` | `'#0364f7'` | HEX da borda, do ícone e das ondas |
| `icone` | `Component \| undefined` | `undefined` | Ícone no badge do canto |
| `metrica` | `string` | `''` | Métrica complementar (ex.: `+1,8 p.p.`) |
| `metricaRotulo` | `string` | `''` | Rótulo ao lado da métrica |
| `tendencia` | `'up' \| 'down' \| 'neutral'` | `'neutral'` | `TrendingUp` esmeralda / `TrendingDown` rose / `Minus` slate |

- **Emits:** nenhum · **Slots:** nenhum · raiz é um `<article>`.
- **Estrutura:** título + valor + métrica com indicador de tendência; borda temática `:style="{ borderColor: cor }"`; badge do ícone com fundo `${cor}1a`.
- **Ondas animadas:** duas camadas SVG no rodapé (`fill-opacity` 0.14/0.22) com `kpi-wave-drift` em loop (9s fundo / 6s frente, tile duplicado `translate(400,0)` para loop contínuo).
- **Acessibilidade/motion:** `@media (prefers-reduced-motion: reduce)` desliga a animação das ondas (regra da spec); SVG `aria-hidden`.
- **Gotchas:** o default `cor: '#0364f7'` (token `brand.structure`) pertence à paleta oficial — recomendam-se os 8 tokens da [seção 2](#21-as-8-cores-oficiais) em produção (ex.: `cor="#112051"`). Métrica só renderiza se `metrica || metricaRotulo`.

```vue
<UiKpi titulo="Publicações na Semana" valor="12" cor="#112051" metrica="+3" tendencia="up" />
```

### 5.11 DataTable — seção 13 do `/design`

**Arquivo:** `app/components/ui/DataTable.vue` · **Tipos:** [`app/utils/dataGrid.ts`](../app/utils/dataGrid.ts)

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `data` | `any[]` *(obrigatória)* | — | Registros |
| `columns` | `ColumnDef[]` *(obrigatória)* | — | Definição das colunas |
| `title` / `subtitle` | `string` | `''` | Cabeçalho do topo com ícone `FileSpreadsheet` |
| `initialGroupedColumns` | `string[]` | `[]` | Colunas agrupadas no início (máx. 3) |
| `pageSizeOptions` | `number[]` | `[5, 10, 20, 50]` | Opções de "Linhas por página" |
| `defaultPageSize` | `number` | `5` | Página inicial |
| `showHeaderTop` | `boolean` | `false` | Exibe o campo de busca global (`UiInput` do kit) |
| `showFilters` | `boolean` | `false` | Exibe o botão "Filtros" à direita da busca (emite `open-filters`) |
| `filtersCount` | `number` | `0` | Badge com a quantidade de filtros ativos no botão Filtros |
| `expandable` | `boolean` | `false` | Habilita a expansão de linha (controle `+`/`−` por linha) |
| `expanded` | `string[]` | `[]` | Chaves (`rowKey`) das linhas expandidas (`v-model:expanded`) |
| `rowKey` | `string` | `'id'` | Campo identificador usado na expansão |
| `expandLabel` | `string` | `'Expandir itens'` | Rótulo acessível do controle de expansão |
| `stickyActions` | `boolean` | `false` | Fixa a coluna Ações à direita durante a rolagem horizontal, incluindo cabeçalho, células e rodapé |

`ColumnDef` (de `app/utils/dataGrid.ts`):

```ts
interface ColumnDef<T = any> {
  id: string; header: string; accessorKey: string
  align?: 'left' | 'center' | 'right'; width?: number | string; minWidth?: number
  isNumeric?: boolean   // habilita totalizadores no rodapé
  groupable?: boolean; sortable?: boolean
  format?: (val: any, row: T) => string
}
```

- **Emits:** `open-filters` (somente com `showFilters` ativo — a página responde, ex.: abrindo seu modal de filtros); `update:expanded` (chaves das linhas abertas — `v-model:expanded`); o demais estado é interno.
- **Slots:** `cell(<col.id>)` com escopo `{ row, value }` (fallback: `col.format(value, row)` ou valor cru) — nome dinâmico por coluna; `actions` com escopo `{ row }` (cria a coluna "Ações"); `filtersLeft` **sem escopo**, renderizado imediatamente à esquerda do botão Filtros na toolbar (opt-in — só aparece se o consumidor passar o slot; ex.: botão de ícone "Importar" com tooltip); `expandHeader` (conteúdo do cabeçalho da coluna de expansão — ex.: a flag que liga os controles) e `expanded` com escopo `{ row }` (conteúdo da linha expandida), ambos opt-in.
- **Expansão de linha (opt-in, §5.11):** com `expandable` (ou apenas o slot `expandHeader`), a tabela adiciona uma coluna líder; quando `expandable` está ativo, cada linha exibe um botão `+`/`−` com `aria-expanded` que abre/fecha uma linha de largura total logo abaixo (`slot #expanded`). É independente por linha e **não** participa de ordenação, busca, paginação ou agrupamento. Sem essas props, o componente permanece idêntico ao comportamento anterior.
- **Coluna Ações fixa (opt-in, `stickyActions`):** mantém o cabeçalho, as células e o rodapé da coluna Ações à direita durante a rolagem horizontal, com fundo opaco, largura estável (`w-28`) e sombra sutil à esquerda; o hover da linha acompanha a célula fixa. Desligada por padrão, não altera as tabelas que não usam a prop.
- **Cabeçalho corporativo:** linha `bg-brand-primary` (**`#112051`**, token `brand.primary` de `tailwind.config.js`) com textos e ícones em **`#f8fafc`**, hover de coluna `bg-white/10`, divisórias `divide-slate-700` (`#334155`); colunas redimensionáveis por handle à direita (hover/ativo `brand-accent`); coluna com cursor `pointer` (**sem tooltip na header** — nem `title` nativo nem balão; as dicas vivem na faixa de agrupamento) e seta de ordenação padrão sempre visível (`h-3`, `stroke-[2.5]`, `white/85`, hover `brand-accent`).
- **Agrupamento ("Group By Box"):** arrastar `th` (`draggable`) para a faixa `Agrupamento:`; **até 3 níveis** com chips `bg-brand-primary` + badge verde `1º NÍVEL`/`2º`/`3º`; estado drag-over `bg-brand-accent/10 ring-brand-accent/30`; nó de nível 1 expandido por padrão, níveis 2/3 recolhidos; barra lateral da linha de grupo muda por nível (`border-l-brand-accent` → `sky` → `slate-200`); cada nó exibe contagem de registros.
- **Ordenação multi-coluna:** clique alterna `asc`/`desc` (setas `brand-accent`); **Shift+clique** encadeia regras com badge numérico `bg-brand-accent text-slate-950` (`sortMultiColumn` em `dataGrid.ts`, `localeCompare('pt-BR')` e parsing numérico para `isNumeric`).
- **Totalizadores sob demanda:** **clique direito** em célula do rodapé de coluna `isNumeric` abre menu `<Teleport to="body">` estilo cxGrid: **Soma (SUM) · Média (AVG) · Contagem (COUNT) · Mínimo (MIN) · Máximo (MAX) · Nenhum (Limpar)** — `calculateAggregate` formata `R$ ...` em pt-BR; sem operação mostra `-`.
- **Paginação:** indicador "Mostrando X a Y de Z entradas exibidas" (+ sufixo verde com nº de níveis de agrupamento quando agrupado), seletor de linhas, "Página X de Y" e botões `« ‹ › »` (`title` acessível); no modo agrupado pagina sobre as linhas efetivamente renderizadas.
- **Busca global** (quando `showHeaderTop`): controle `UiInput` do kit — lupa à esquerda, limpar à direita quando há texto, foco `brand-focus` recortado — case-insensitive; estado vazio **"Nenhum dado encontrado com o filtro aplicado."**
- **API exposta (`defineExpose`):** `focarBusca()` move o foco do teclado para o campo de busca (no-op quando `showHeaderTop` está desligado) — uso típico: devolver o foco após o gatilho de uma linha sair do DOM (exclusão em Gestão de Usuários). Encadeie pelo componente consumidor (`ref` no `UiDataTable` + `defineExpose` próprio).
- **Botão Filtros** (quando `showFilters`): `UiButton` outline à direita da busca, com badge do `filtersCount` quando > 0; clique emite `open-filters`. O slot `filtersLeft` (quando presente) ocupa a posição imediatamente à esquerda desse botão. Sem `showFilters` a toolbar permanece como antes (nenhum consumidor existente ativa por padrão).
- **Gotchas (requisitos da spec):** sem conteúdo de demonstração quando usado sem props de conteúdo; **nenhum registro recebe tratamento visual especial por causa do seu valor**.

```vue
<UiDataTable
  title="Releases Week Semanal"
  :data="releases"
  :columns="colunas"
  :initial-grouped-columns="['tipo']"
  show-header-top
  show-filters
  :filters-count="2"
  @open-filters="abrirFiltros"
>
  <template #cell(dataPublicacao)="{ value }">
    <span class="font-mono tabular-nums">{{ value }}</span>
  </template>
  <template #actions="{ row }">
    <UiButton size="sm" variant="outline" @click="ver(row)">Ver</UiButton>
  </template>
</UiDataTable>
```

### 5.12 UiModal & UiModalSection - seção 15 do `/design`

**Arquivo:** `app/components/ui/Modal.vue` · `app/components/ui/ModalSection.vue`

`UiModal` (dialog de cadastro com `v-model`):

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `boolean` *(obrigatória)* | — | Aberto/fechado (`v-model`) |
| `title` | `string` *(obrigatória)* | — | Título do header |
| `subtitle` | `string` | `''` | Subtítulo do header |
| `icon` | component | `null` | Ícone lucide à esquerda do separador |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Larguras 384 / 480 / 640 / 880 / 1120px (`xs` é uso pontual, ex.: modal da câmera; `xl` é o modal de convite — `docs/06` §3.9) |
| `closeOnEsc` | `boolean` | `true` | Permite fechar por `Escape` |

- **Emits:** `update:modelValue` (boolean) e `close` (todos os fechamentos — X, Escape, ações do footer).
- **Slots:** `default` (corpo/sessões) e `footer` (ações; só renderiza se fornecido).
- **Portal/camada:** `<Teleport to="body">` em `z-[60]` — acima dos toasts (`z-50`); backdrop cinza escuro `bg-zinc-900/50` (`#18181b` a 50%) que **não** fecha no clique (protege cadastros longos contra perda acidental).
- **Fechamento:** `Escape` (via `closeOnEsc`), botão `X` e ações do footer; `role="dialog"` + `aria-modal`, focus-trap de Tab preso no dialog, **foco inicial no primeiro controle do corpo/rodapé** (o `X` do header é pulado só na abertura e segue alcançável por `Shift+Tab`), devolução do foco ao gatilho e scroll-lock do `body` enquanto aberto — o lock usa um **contador global em escopo de módulo**: com modais empilhados (filho sobre pai) o `body` só destrava quando o **último** deles fecha.
- **Empilhamento:** os modais abertos formam uma pilha em escopo de módulo e **só o topo recebe `Escape` e `Tab`** — um modal filho (ex.: câmera sobre um formulário) fecha sozinho sem fechar nem roubar o foco do modal subjacente, e ao fechar devolve o foco ao gatilho dentro dele. Com um único modal aberto o comportamento é idêntico ao anterior. Demo na seção 15 do `/design` ("Abrir modal filho").
- **Header:** fundo em degradê **`#112051` → `#0364f7`** (`bg-gradient-to-r from-brand-primary to-[#0364f7]`), `rounded-t-xl` (o filete esquerdo de accent `#4ed813` de **2.5px** acompanha o raio do canto superior esquerdo), ícone, título/subtítulo e `X` em `#f8fafc` (o `X` exibe tooltip "Fechar"), separador vertical branco/20.
- **Altura:** o **painel** é limitado por `max-h-[calc(100vh-2rem)]` (o `p-4` da camada) e o **corpo** ocupa o restante via `flex-1 min-h-0` — a rolagem interna só aparece quando o conteúdo excede `100vh − header − footer − 32px`, eliminando a barra antes inevitável em telas de 768px.
- **Corpo:** `bg-slate-100` com rolagem interna (`overflow-y-auto`); espaçamento lateral/inferior de 20px (`px-5 pb-5`) e **topo de 15px** (`pt-[15px]`) até a primeira sessão; sessões renderizadas como cards brancos; dentro do corpo os **labels dos campos** ficam com peso fraco (`font-light text-slate-500` via seletor `.fp-modal-body`) — **inclusive em erro**, preservando apenas a cor `text-rose-700`.
- **Footer:** filete superior de accent `#1a9e07` de **1px**, ações alinhadas à direita com os `UiButton` existentes (`outline` secundário + `primary` primário; diálogos de confirmação destrutiva também usam a variante `danger` — ex.: modal de exclusão de usuário, `docs/06` §5.6). O slot aceita um **grupo à esquerda** quando o consumidor abre com um elemento `mr-auto` (absorve o espaço livre do `justify-end` e mantém as ações principais à direita — ex.: os ícones de cópia do modal de permissões, `docs/07` §3.7); o kit não muda.

`UiModalSection` (sessão de campos dentro do `default`):

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `title` | `string` *(obrigatória)* | — | Título da sessão (**sem** caixa alta, peso fraco `font-light text-slate-500`) |
| `icon` | component | `null` | Ícone da sessão em `text-lime-700` **sobre fundo branco** à esquerda do título |

- **Slot:** `default` para os campos; card branco com divisória `slate-200` a **2px** do título e **8px** dos campos (`mt-0.5 mb-2`); o grid de campos aplica `min-w-0` nos filhos (`[&>*]:min-w-0`) para conteúdos de largura intrínseca (vídeo, selects) não gerarem scroll horizontal no corpo do modal.
- **Gotchas:** o backdrop nunca fecha no clique — para permitir, use apenas X/footer/Escape; `size` segue a escala `xs`/`sm`/`md`/`lg`/`xl` (384/480/640/880/1120px), sem largura arbitrária.

```vue
<UiModal v-model="aberto" title="Nova Publicação" subtitle="Dados da publicação e distribuição" :icon="Building2">
  <UiModalSection title="Dados da Publicação" :icon="Building2">
    <UiInput v-model="titulo" label="Título" />
    <UiInput v-model="slug" label="Slug" mono />
  </UiModalSection>

  <template #footer>
    <UiButton variant="outline" @click="aberto = false">Cancelar</UiButton>
    <UiButton variant="primary" @click="salvar">Salvar</UiButton>
  </template>
</UiModal>
```

### 5.13 UiTabs — seção 16 do `/design`

**Arquivo:** `app/components/ui/Tabs.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string` *(obrigatória)* | — | Id da aba ativa (`v-model`) |
| `items` | `TabItem[]` *(obrigatória)* | — | `{ id, label, icon?, cor? }` — `cor` pinta o ícone |
| `ariaLabel` | `string` | `'Abas'` | `aria-label` do tablist |
| `idPrefix` | `string` | `useId()` | Prefixo dos ids de tab/painel; **repita o mesmo valor** nos painéis para `aria-controls`/`aria-labelledby` |

- **Emits:** `update:modelValue(string)` · `change(string)` — sempre o **id**, nunca um `Event` (§4.2).
- **Visual:** ativa = pill lime `bg-lime-50 border border-lime-300 text-lime-900 shadow-xs` (mesmo padrão do chip lime ativo, §5.9), com `hover:bg-lime-100`; inativa = `border-transparent text-slate-600 hover:bg-slate-50` (borda transparente evita salto de layout na troca); ícone `h-4 w-4` na `cor` do item (preservada na aba ativa); tablist **centralizada** horizontalmente (`justify-center`, mantida na quebra de linha — pedido do usuário).
- **ARIA:** `role="tablist"` no container, `role="tab"` + `aria-selected` (só a vigente `true`) e `aria-controls` apontando ao painel; roving tabindex (ativa `0`, demais `-1`).
- **Teclado:** `←`/`→` percorrem com wrap, `Home`/`End` vão à primeira/última — a troca seleciona **e** move o foco; foco visível `outline-brand-focus`.
- **Uso:** o componente é só o tablist — os painéis ficam no consumidor com `role="tabpanel"`, `:id="prefixo-panel-<id>"` e `:aria-labelledby="prefixo-tab-<id>"`.

```vue
<UiTabs v-model="aba" :id-prefix="prefixo" :items="abas" aria-label="Configurações" />
<div v-if="aba === 'retencao'" :id="`${prefixo}-panel-retencao`" role="tabpanel" :aria-labelledby="`${prefixo}-tab-retencao`">
  ...
</div>
```

### 5.14 UiSlider — seção 16 do `/design`

**Arquivo:** `app/components/ui/Slider.vue` · estilo: `.ds-slider` em `app/assets/css/main.css`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `number` *(obrigatória)* | — | Valor corrente (`v-model`) |
| `min` | `number` | `30` | Limite inferior |
| `max` | `number` | `730` | Limite superior |
| `step` | `number` | `1` | Passo |
| `marks` | `{ value, label }[]` | `undefined` | Legenda de rótulos sob a track (só informativa; não é clicável) |
| `valueText` | `string` | `'{n} dias'` | Texto acessível do valor (`{n}` = valor corrente) |
| `ariaLabel` | `string` | `undefined` | `aria-label` do controle |

- **Emits:** `update:modelValue(number)` · `change(number)` — sempre **number** (o `<input type="range">` nativo traz string; o componente converte).
- **Visual:** `<input type="range">` nativo + `.ds-slider` — track preenchida em degradê **`#112051` → `#0364f7` → `#4ed813`** esticado da origem até o thumb (a CSS var `--pct` marca onde o degradê termina), resto `slate-200`; thumb navy redondo (webkit + moz); legenda sob a track com `flex-wrap` + `gap-x-2 gap-y-1` e `justify-center sm:justify-between` (em telas estreitas os rótulos quebram para a segunda linha em vez de se sobrepor; nenhum rótulo é abreviado).
- **Foco:** `:focus-visible` em verde canônico `#1a9e07` (§2.2), nunca `lime-500`.
- **Acessibilidade:** `aria-valuetext` com o texto de `valueText` (ex.: "180 dias") — o leitor anuncia unidades, não só o número.

```vue
<UiSlider
  v-model="dias"
  aria-label="Janela de retenção"
  :marks="[
    { value: 30, label: '30 dias (1 mês)' },
    { value: 90, label: '90 dias (Trimestre)' },
    { value: 180, label: '180 dias (Semestre)' },
    { value: 365, label: '365 dias (1 ano)' },
    { value: 730, label: '730 dias (2 anos)' }
  ]"
/>
```

<!-- C10 -->

### 5.15 UiSegmented — seção 9 do `/design`

**Arquivo:** `app/components/ui/Segmented.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string` | `''` | Valor escolhido (`v-model`); `''` = nenhum segmento marcado |
| `options` | `{ value, label, tone? }[]` *(obrigatória)* | — | Segmentos, na ordem exibida; `tone` colore o segmento marcado |
| `label` | `string` | `''` | Rótulo acima (vira `aria-labelledby` do `radiogroup`) |
| `labelClass` | `string` | `''` | Classes extras no rótulo |
| `error` | `string` | `''` | Mensagem de erro (ícone + `sr-only`, sem texto visível abaixo) |
| `disabled` | `boolean` | `false` | Desabilita todos os segmentos — track `bg-slate-200` (sem `opacity`), seleção em pílula `bg-white text-slate-500`, `cursor-not-allowed` |

- **Emits:** `update:modelValue(string)` · `change(string)`.
- **Tom do segmento marcado** (`tone`): `emerald` (`#047857`, Ativo — mesma cor do KPI), `slate`
  (`#64748b`, Inativo), `navy` (`brand-primary`), `rose`, `sky`, `indigo`, `lime`
  (`brand-focus`) — fundo pleno com texto branco; desmarcado transparente sobre a track com hover
  `white/70`.
- **Visual:** track `h-[34px]` (alinha com `Input`/`Select`) em `bg-slate-100 border-slate-200
  rounded-lg p-1`; segmentos `rounded-md text-xs font-medium` `flex-1`; com `error` a track ganha
  `pr-7` para o ícone `AlertCircle` não cobrir o último segmento.
- **Foco:** recorte `brand-focus` com `.ds-bottom-clip` no container quando focado (mesmo canônico do
  `Input`); **erro tem precedência** — recorte `rose-700`, rótulo `rose-700`, ícone `AlertCircle` com
  tooltip e mensagem `sr-only` (`role="alert"`) ligada por `aria-describedby`.
- **Teclado (`radiogroup`):** **um único ponto de parada de `Tab`** (segmento marcado; o primeiro
  quando vazio) · `↑` `↓` `←` `→`, `Home`/`End` movem **e selecionam** (roving tabindex) ·
  `Enter`/`Space` acionam o segmento focado (clique nativo do `<button>`).
- **Gotchas:** o `v-model` pode ficar vazio — a obrigatoriedade fica a cargo do formulário (o Status
  do modal de usuário valida e move o foco ao primeiro campo inválido); `data-campo` cai no root e o
  `focarCampo` do formulário localiza o segmento via `[role="radio"][tabindex="0"]`.

```vue
<UiSegmented
  v-model="status"
  label="Status"
  :options="[
    { value: 'Ativo', label: 'Ativo', tone: 'emerald' },
    { value: 'Inativo', label: 'Inativo', tone: 'slate' }
  ]"
/>
```

### 5.16 UiChoiceCard — seção 17 do `/design`

**Arquivo:** `app/components/ui/ChoiceCard.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string` | `''` | Valor escolhido **no grupo** (`v-model` compartilhado por todos os cartões); `''` = nenhum marcado |
| `value` | `string` *(obrigatória)* | — | Valor deste cartão dentro do grupo |
| `title` | `string` *(obrigatória)* | — | Título do cartão (associado ao cartão via `aria-labelledby`) |
| `description` | `string` | `''` | Texto secundário (associado via `aria-describedby`) |
| `icon` | componente | `undefined` | Ícone renderizado no tile superior esquerdo |
| `badge` | `string` | `''` | Pílula de metadados ao lado do tile (ex.: "Recomendado") |
| `badgeVariant` | `'lime' \| 'emerald' \| 'indigo' \| 'slate' \| 'neutral'` | `'lime'` | Cor da pílula (mesmo vocabulário do `CheckCard`, §5.9) |
| `badgeMono` | `boolean` | `false` | `true` aplica `font-mono` ao badge numérico (ex.: `n/92` — disciplina de numéricos); sem ele a pílula segue em sans (badges de texto) |
| `tone` | `'sky' \| 'emerald' \| 'lime' \| 'indigo' \| 'slate'` | `'slate'` | Tom aplicado ao cartão **selecionado** (borda + anel + fundo + tile do ícone) |
| `disabled` | `boolean` | `false` | Desabilita o cartão (`aria-disabled`, fora de clique e teclado) |
| `disabledHint` | `string` | `''` | Dica exibida no cartão desabilitado, com ícone `AlertCircle` |

- **Emits:** `update:modelValue(string)` · `change(string)` — sempre o `value` do cartão acionado,
  nunca um `Event` (§4.2).
- **Contêiner `radiogroup`:** o componente **é o cartão** (`role="radio"`); o consumidor fornece o
  contêiner `<div role="radiogroup" aria-label="…">` em volta dos cartões e nele aplica o layout
  (a seção 17 do `/design` usa `grid sm:grid-cols-2|3 gap-3`). Cada grupo tem seu próprio
  `v-model`.
- **Seleção:** `aria-checked="true"` somente no cartão selecionado; clique, `Enter` ou `Space`
  marcam o cartão e desmarcam os demais do grupo, emitindo o valor; o grupo pode iniciar vazio.
- **Teclado:** **um único ponto de parada de `Tab`** (cartão selecionado; o primeiro navegável
  quando o grupo está vazio) · `←` `→` `↑` `↓` movem foco **e seleção** em conjunto,
  `Home`/`End` vão ao primeiro/último (navegação com wrap entre os irmãos do mesmo
  `radiogroup`) · `Enter`/`Space` selecionam o cartão focado · cartões `disabled` ficam **fora**
  da navegação e não alteram a seleção vigente.
- **Visual:** selecionado = borda, `ring-1` e fundo tingidos no `tone` + tile do ícone acompanhando
  o tom; neutro = superfície branca com borda `slate-200` e hover `slate-50`; marcador de rádio
  (anel + ponto no tom) no canto superior direito; desabilitado = atenuado (`opacity-60`,
  `bg-slate-50`) com a dica legível no próprio cartão.
- **Foco:** recorte canônico `outline-brand-focus` via `focus-visible:` direto no cartão (§2.2) — nunca
  `lime-500`.
- **Espelhamento:** seção 17 do `/design` — três grupos: vazio (neutro + SMS desabilitado com
  dica), tom `sky` e tom `emerald` pré-selecionados; a seção 17 é a fonte visual deste item.

```vue
<div role="radiogroup" aria-label="Canal de envio" class="grid gap-3">
  <UiChoiceCard
    v-model="canal"
    value="email"
    title="E-mail"
    description="Envio pelo sistema em simulação — nenhum cliente de e-mail é aberto."
    :icon="Mail"
    tone="sky"
  />
  <UiChoiceCard
    v-model="canal"
    value="whatsapp"
    title="WhatsApp"
    description="Abre o aplicativo desktop com a mensagem preenchida."
    :icon="MessageCircle"
    tone="emerald"
  />
</div>
```

### 5.17 UiLoading — seção 18 do `/design`

**Arquivo:** `app/components/ui/Loading.vue` — estilo: `.ds-loading` em `app/assets/css/main.css`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `message` | `string` | `'Carregando…'` | Mensagem exibida ao lado do ícone (região viva) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho do ícone e respiro da caixa |
| `current` | `number` | — | Valor atual da operação; junto com `total` válido ativa a barra de progresso |
| `total` | `number` | — | Total da operação (`> 0` e numérico); sem ambos válidos a caixa fica sem barra |

- **Exibição:** o consumidor monta/desmonta com `v-if` (`<UiLoading v-if="salvando" … />`) — **não
  há fechamento próprio**: clique no backdrop e `Escape` não fecham; o overlay some quando o `v-if`
  fica falso. Sem emits.
- **Visual:** overlay `fixed inset-0` em **`z-[70]`** (acima do `z-[60]` do `UiModal` — a hierarquia
  é header `z-40` < dropdowns/toasts `z-50` < modal `z-60` < loading `z-70`) com backdrop
  `bg-zinc-900/50` (o mesmo do modal) e caixa centralizada: a **borda é um degradê cônico
  giratório `#112051` → `#0364f7` → `#4ed813`** (disco `.ds-loading` recortado pelo
  `overflow:hidden` do wrapper — mesma ordem das demais superfícies de degradê da marca, §2), painel
  branco interno com `LoaderCircle` em `brand-structure` girando à esquerda — `h-5`/`h-6`/`h-8` em
  `sm`/`md`/`lg` — e a mensagem à direita.
- **Progresso (opcional):** com `current`/`total` válidos (`total > 0`, numéricos), um bloco abaixo
  da linha de ícone/mensagem: barra `h-1.5` com trilha `slate-200` e preenchimento no **degradê
  horizontal `#112051` → `#0364f7` → `#4ed813`** (mesmo da trilha do `UiSlider`, §5.14), além da
  linha do contador — `1.240 / 5.000` à esquerda e `25%` (percentual inteiro arredondado) à
  direita, em `font-mono tabular-nums`. A largura transiciona (`transition-[width]`, sem transição
  com movimento reduzido). Sem as props (ou com `total ≤ 0`), a caixa é a mesma de sempre.
- **Interação:** enquanto montado trava a rolagem do documento (`body.overflow`) e o backdrop
  bloqueia os cliques da página subjacente; um toast disparado durante o loading fica **atrás** do
  backdrop até o overlay ser removido.
- **Acessibilidade:** a mensagem é região viva (`role="status"` + `aria-live="polite"`), a barra
  expõe `role="progressbar"` com `aria-valuenow` (arredondado), `aria-valuemin="0"`,
  `aria-valuemax="100"` e `aria-valuetext` com o contador, o backdrop
  é `aria-hidden`, a camada leva `aria-busy`, o foco **não** se move (sem controles focáveis) e o
  overlay tem `no-print` (não vai ao papel). Com `prefers-reduced-motion` a borda e o ícone param
  de girar e a largura da barra atualiza sem transição, mantendo as cores visíveis.
- **Espelhamento:** seção 18 do `/design` — dois botões: "Abrir loading" (sem progresso) e "Abrir
  com progresso" (contador de 0 a 5.000 em ~3,5 s), ambos com `setTimeout` de ~3,5 s que desmonta
  o overlay (a demo usa timer porque o componente não fecha por conta própria; o modo progresso
  também limpa o `setInterval` no unmount).

```vue
<UiLoading v-if="salvando" message="Importando 1.240 registros de usuários…" />
<UiLoading v-if="importando" message="Importando registros…" :current="1240" :total="5000" />
```

### 5.18 UiTextarea — seção 19 do `/design`

**Arquivo:** `app/components/ui/Textarea.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string` | `''` | Valor do campo (`v-model` bidirecional) |
| `label` | `string` | `''` | Rótulo acima do campo (associado via `for`/`id`) |
| `labelClass` | `string` | `''` | Classes extras no label |
| `placeholder` | `string` | `''` | Texto exibido apenas com o valor vazio |
| `disabled` | `boolean` | `false` | Campo não editável (fundo `slate-200`, `opacity-60`, `cursor-not-allowed`) |
| `error` | `string` | `''` | Mensagem de erro — aplica o mesmo recorte `rose-700` da família |
| `rows` | `number` | `3` | Linhas visíveis do campo |
| `textareaClass` | `string` | `''` | Classes extras no `<textarea>` |

- **Visual:** mesmo DNA do `UiInput` (§5.3) adaptado a multilinha — caixa branca,
  `border-slate-200` `rounded-lg`, texto `text-xs`; **sem altura fixa**: cresce pelo `rows`
  e aceita `resize-y`. Foco e erro usam o overlay `absolute -inset-[1px] border-2`
  recortado com `.ds-bottom-clip` (verde `brand-focus` `#1a9e07` no foco; `rose-700`
  `#be123c` no erro, com precedência) — §2.2 e `design-system/form-control-states`.
- **Erro:** ícone `AlertCircle` `rose-700` no canto superior direito com tooltip da
  mensagem (mesmo padrão do `Input`); a mensagem permanece no DOM como texto oculto
  (`sr-only`) com `role="alert"`, associada ao campo por `aria-describedby`.
- **Teclado:** `Enter` insere quebra de linha (comportamento nativo do `<textarea>` — não
  avança campo nem submete formulário) e `Tab` sai do campo para o próximo focável.
- **Sem emits próprios:** apenas `update:modelValue`. Sem slots além de `labelRight`.
- **Texto rico:** para conteúdo com negrito, cor e tamanho de fonte, use `UiRichText` (§5.25), que
  reproduz este mesmo DNA visual e é sanitizado no servidor.
- **Espelhamento:** seção 19 do `/design` — um campo de demonstração com `v-model` e outro
  fixado em erro para conferir o recorte, o ícone e a mensagem acessível.

```vue
<UiTextarea v-model="descricao" label="Descrição" placeholder="Detalhe as responsabilidades…" :rows="4" />
<UiTextarea :model-value="'…'" label="Descrição" error="Informe a descrição." />
```

### 5.19 UiSwitch — seção 20 do `/design`

**Arquivo:** `app/components/ui/Switch.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `boolean` | `false` | Estado do interruptor (`v-model` binário) |
| `label` | `string` | `''` | Rótulo ao lado (associado via `for`/`id`; o clique nele alterna) |
| `ariaLabel` | `string` | `''` | Nome acessível quando não há `label` visível (ex.: célula de matriz) |
| `disabled` | `boolean` | `false` | Sem alternância, fora do Tab, `opacity-50 cursor-not-allowed` |

- **Visual:** trilha `h-5 w-9 rounded-full` — desligada `bg-slate-300`, **ligada
  `bg-brand-focus` `#1a9e07`** (verde canônico, sem novo `lime-*`); knob branco `h-4 w-4`
  desliza 16px (`translate-x-0.5` → `translate-x-4`) com `transition-transform` (morre sob
  `prefers-reduced-motion`, §3.5).
- **Semântica:** `<button role="switch" aria-checked>` — Space/Enter alternam nativamente;
  foco `focus-visible` `brand-focus` (`#1a9e07`). `disabled` usa o `disabled` nativo.
- **Espelhamento:** seção 20 do `/design` — estados ligado, desligado e desabilitado.

```vue
<UiSwitch v-model="notificacoes" label="Notificações" />
<UiSwitch :model-value="true" label="Sempre ativo" />
<UiSwitch :model-value="false" label="Bloqueado" disabled />
```

### 5.20 Avatar de Perfil (domínio) — tela Meu Perfil

**Arquivo:** `app/components/perfil/Avatar.vue` (`PerfilAvatar` — componente de domínio, não do
kit; espelhado em `docs/09`)

- **Visual:** círculo `h-32 w-32 rounded-full` sem anel/borda de destaque; fundo
  `bg-slate-600` (cinza neutro) com **iniciais** (primeiro + último nome,
  `text-3xl font-bold text-white`) quando não há foto, ou a imagem (`object-cover`) quando há.
- **Lápis flutuante:** único ponto de entrada da troca de foto (não há botão "Alterar foto"
  separado): botão **`h-7 w-7 rounded-full`** ancorado no canto inferior direito
  (`absolute bottom-1 right-1`), `bg-brand-primary` com `border-2 border-white`, ícone `Pencil`
  `h-3.5 w-3.5`; hover `bg-brand-primary-raised`, foco `focus-visible:outline-brand-focus`. Emite
  `alterar-foto` — a página abre o fluxo do kit (`UiUploadFiles` circular + `UiCameraWeb`, §5.4).
  **Visibilidade:** sem foto (iniciais) o lápis fica sempre visível; **com foto**, o lápis fica
  oculto (`opacity-0`) e aparece só quando o mouse passa sobre o Avatar
  (`group-hover:opacity-100`, com `group-focus-within` para teclado) — o wrapper do Avatar carrega
  a classe `group`.
- **Foto:** o rascunho usa dataURL; ao **Salvar alterações**, a imagem é enviada como arquivo
  (upload em `avatares`) e o registro guarda a URL (`avatar_url`) — mesmo fluxo do modal de
  Gestão de Usuários.
- **Resumo lateral (`perfil/Resumo.vue`):** card `rounded-xl border border-slate-200 shadow-xs`
  com **fundo em degradê vertical `bg-gradient-to-b from-brand-structure/15 to-white`** (azul
  bem clarinho no topo esmaecendo até o branco — ver §2.1, único degradê sobre superfície clara
  do DS); exibe o Avatar no topo, seguido do nome, dos badges de status/perfil (`UiBadge`) e das
  linhas E-mail · Último acesso · Conta criada em. O mini-card "Sua conta está segura" fica na
  **aba Segurança** (`perfil/AbaSeguranca.vue`).

```vue
<PerfilAvatar :nome="rascunho.nome" :preview="rascunho.avatar" @alterar-foto="abrirFoto" />
```

### 5.21 UiEntityCard — seção 21 do `/design`

**Arquivo:** `app/components/ui/EntityCard.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `codigo` | `string` | `''` | Identificador secundário no topo, em `font-mono` (ex.: `PAR-001`) |
| `badge` | `{ label: string; variant?: BadgeVariant }` | — | Badge de status no topo (`UiBadge`) |
| `icone` | `Component` | — | Ícone da entidade, à esquerda do título (ex.: `Handshake`) |
| `titulo` | `string` | — | Título do card (ex.: razão social) |
| `subtitulo` | `string` | `''` | Subtítulo do card (ex.: nome fantasia) |
| `linhas` | `{ rotulo: string; valor: string; icone?: Component }[]` | `[]` | Linhas rótulo → valor, cada uma com ícone opcional à esquerda |

- **Visual:** card `rounded-xl border border-slate-200 bg-white p-4 shadow-xs` (mesma família de
  `UiKpi`/`perfil/Resumo.vue`); topo com código (`font-mono text-[11px] font-semibold text-slate-500`)
  + badge de status; à esquerda do título, o tile do ícone (`h-7 w-7 rounded-lg bg-emerald-50
  text-emerald-700`); título `text-sm font-bold text-slate-900` e subtítulo `text-xs text-slate-500`;
  bloco de linhas separado do título por **`border-t border-brand-focus`** (divisória verde de 1px,
  com `pt-3`) e, abaixo dela, um **container recuado** (`rounded-lg border border-slate-200 bg-slate-50
  p-3` — cinza claro simulando profundidade) com rótulo `text-[11px] font-medium text-slate-500`
  (ícone opcional `h-3.5 w-3.5 text-slate-400` à esquerda) e valor `text-xs font-semibold
  text-slate-900` à direita.
- **Ações:** slot nomeado `acoes`, no topo à direita; ficam **ocultas** (`opacity-0`) e aparecem no
  hover do card (`group-hover:opacity-100`) e no foco de teclado (`group-focus-within:opacity-100`),
  permanecendo focáveis — mesmo padrão do lápis do Avatar (§5.20).
- **Espelhamento:** seção 21 do `/design` — três cards de exemplo (Ativo/Inativo/Bloqueado).

```vue
<UiEntityCard codigo="PAR-001" :badge="{ label: 'Ativo', variant: 'done' }" :icone="Handshake"
  titulo="Nexus Corp" subtitulo="Nexus Paulista"
  :linhas="[{ rotulo: 'Localização', valor: 'São Paulo - SP', icone: MapPin }, { rotulo: 'Região', valor: 'Sudeste', icone: Map }]">
  <template #acoes>…</template>
</UiEntityCard>
```

### 5.22 UiPagination — seção 22 do `/design`

**Arquivo:** `app/components/ui/Pagination.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `number` | — | Página corrente (1-based, `v-model`) |
| `total` | `number` | — | Total de registros do conjunto |
| `perPage` | `number` | — | Registros por página (`v-model:per-page`) |
| `pageSizeOptions` | `number[]` | `[5, 10, 20, 50]` | Opções do seletor "Linhas por página" |
| `rotulo` | `string` | `'entradas'` | Rótulo do conjunto no resumo (ex.: `parceiros`) |

- **Visual:** barra `rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-xs`; resumo
  "Mostrando X a Y de N … exibidas" à esquerda; à direita o seletor de linhas por página, o
  indicador "Página X de Y" e os quatro botões `h-6 w-6` (`« ‹ › »`) — mesmo padrão de paginação do
  `UiDataTable` (§5.11).
- **Estados:** na primeira página, `«` e `‹` ficam `disabled` (`opacity-40 cursor-not-allowed`); na
  última, `›` e `»`. Trocar o tamanho da página volta para a página 1; quando o total encolhe, a
  página é reajustada ao novo limite.
- **Espelhamento:** seção 22 do `/design` — barra interativa com 23 registros.

```vue
<UiPagination v-model="pagina" v-model:per-page="porPagina" :total="linhas.length" rotulo="parceiros" />
```

### 5.23 UiActionMenu — seção 23 do `/design`

**Arquivo:** `app/components/ui/ActionMenu.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `items` | `ActionMenuItem[]` *(obrigatória)* | — | Ações do menu |
| `label` | `string` | `'Ações'` | Rótulo acessível do gatilho e do `role="menu"` |
| `align` | `'start' \| 'end'` | `'end'` | Alinhamento horizontal do menu em relação ao gatilho |

`ActionMenuItem`: `{ id: string; label: string; icon?: Component; tone?: 'default' | 'danger'; disabled?: boolean; reason?: string; hoverBackground?: string; hoverText?: string }` — `hoverBackground` define o fundo e `hoverText` a cor do texto no hover (hex), sobrepondo ao destaque padrão do menu.

- **Emits:** `select` com o `id` do item acionado.
- **Visual:** gatilho de ícone `MoreVertical` (`h-4 w-4`, `text-slate-500`, hover `bg-slate-100`, foco recortado `brand-focus`); menu `rounded-xl border border-slate-200 bg-white py-1 shadow-xl` em `Teleport`/`fixed` (não é recortado pelo `overflow` da tabela) com `120px`; item `px-3 py-2 text-xs`, ícone `h-3.5 w-3.5`; ação destrutiva em `text-rose-700 hover:bg-rose-200 hover:text-rose-900`; item habilitado com hover `bg-slate-200` e `text-slate-900`; item desabilitado em `text-slate-400 cursor-not-allowed` com o motivo em `title`/`aria-label`.
- **Interação:** abre por clique ou `Enter`/`Space`/`ArrowDown` no gatilho; `ArrowUp`/`ArrowDown` navegam ciclicamente (`Home`/`End` vão ao primeiro/último), `Enter`/`Space` acionam, `Escape` e clique-fora fecham devolvendo o foco ao gatilho (clique-fora mantém o foco onde o usuário clicou); `scroll`/`resize` fecham o menu para não descolar do gatilho.
- **Acessibilidade:** `aria-haspopup="menu"`, `aria-expanded` e `aria-controls` no gatilho; `role="menu"`/`role="menuitem"`; itens desabilitados não recebem foco.
- **Espelhamento:** seção 23 do `/design` — menu de exemplo com ações habilitadas, destrutiva e desabilitada com motivo.

### 5.24 UiTagInput — seção 24 do `/design`

**Arquivo:** `app/components/ui/TagInput.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string[]` | `[]` | Coleção de tags |
| `label` | `string` | `''` | Rótulo associado ao campo (`useId()` → `for`) |
| `placeholder` | `string` | `'Digite uma tag e pressione Enter'` | Texto sem tags |
| `disabled` | `boolean` | `false` | Fundo `slate-200`, opacidade reduzida, sem foco/hover |
| `error` | `string` | `''` | Erro canônico (ícone + tooltip + região viva) |
| `helperText` | `string` | `''` | Texto auxiliar abaixo do campo |
| `max` | `number` | `12` | Quantidade máxima de tags |
| `maxLength` | `number` | `30` | Comprimento máximo de cada tag |

- **Emits:** `update:modelValue(tags: string[])` e `change(tags: string[])`.
- **Adição:** `Enter` ou vírgula confirmam a tag; `trim` é aplicado, valores vazios e duplicados são ignorados. Ao atingir `max` ou `maxLength`, a tag é recusada e um aviso em `text-amber-700` é exibido.
- **Remoção:** botão `X` em cada chip (nome acessível "Remover tag …") ou `Backspace` com o campo vazio remove a última tag; o foco permanece no campo.
- **Visual:** container `min-h-[34px]` com chips `rounded-md border-lime-300 bg-lime-50 text-lime-900`; foco com recorte inferior `brand-focus`; erro com recorte inferior `rose-700` e `AlertCircle`; sem contorno na borda superior/laterais.
- **Acessibilidade:** lista de chips com rótulo, botões de remoção nomeados, mensagem de erro em `role="alert"` e `aria-describedby`; limite comunicado por `role="status"`.
- **Espelhamento:** seção 24 do `/design` — exemplos habilitado, erro, limite e desabilitado.

### 5.25 UiRichText — seção 25 do `/design`

**Arquivos:** `app/components/ui/RichText.client.vue` (editor, auto-import `UiRichText`),
`app/components/ui/RichTextViewer.vue` (leitor, auto-import `UiRichTextViewer`) e
`app/components/rich-text/Toolbar.vue` (toolbar interna, não é componente do kit).
**Allowlist:** `shared/rich-text.ts` — cores e tamanhos permitidos.

| Prop (`UiRichText`) | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string` | `''` | HTML do conteúdo (`v-model`) |
| `label` | `string` | `''` | Rótulo acima do campo (associado por `useId()` → `for`) |
| `placeholder` | `string` | `''` | Texto exibido apenas com o conteúdo vazio |
| `disabled` | `boolean` | `false` | Campo não editável (fundo `slate-200`, `opacity-60`) |
| `error` | `string` | `''` | Erro canônico (ícone + tooltip + `role="alert"`) |
| `minHeight` | `number` | `70` | Altura mínima do conteúdo, em pixels |

- **Emits:** `update:modelValue(html: string)` e `update:text(textoPuro: string)` — o texto puro é a base da validação do formulário.
- **Formatação:** **negrito**, **cor de fonte** e **tamanho de fonte** (`StarterKit` restrito a
  `bold`/`paragraph`/`hardBreak`/`undoRedo` + `TextStyle`/`Color`/`FontSize`). Atalho `Ctrl` + `B`.
- **Toolbar:** aparece acoplada ao campo no hover/foco (sempre visível no toque) e em uma **bubble**
  flutuante sobre a seleção, com nome acessível e `aria-pressed` no negrito.
- **Visual:** mesmo DNA do `UiTextarea` (§5.18) — foco recortado `.ds-bottom-clip` em `brand-focus`,
  erro `rose-700` com `AlertCircle` e mensagem `sr-only`. Conteúdo em `.ds-rich-text` (parágrafos
  compactos), definido em `app/assets/css/main.css`.
- **Segurança:** o HTML é **sanitizado no servidor** (`server/utils/richText.ts`) por allowlist antes
  de persistir; o texto puro é derivado do HTML. O `UiRichTextViewer` renderiza o HTML sanitizado e
  cai no texto puro quando não há HTML.
- **Pendência de fallback:** registros antigos/importados não têm HTML — o viewer usa o texto puro com
  `whitespace-pre-line`.
- **Espelhamento:** seção 25 do `/design` — exemplos habilitado, erro/desabilitado e a leitura.

### 5.26 UiMultiSelect — seção 26 do `/design`

**Arquivo:** `app/components/ui/MultiSelect.vue`

| Prop | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `modelValue` | `(string \| number)[]` | `[]` | Valores selecionados (`v-model`) |
| `options` | `SelectOption[]` | `[]` | Catálogo (`value`, `label`, `badge?`, `description?`) |
| `label` | `string` | `''` | Rótulo acima do campo (`useId()` → `for`) |
| `placeholder` | `string` | `'Selecione uma ou mais opções...'` | Texto sem seleção |
| `searchPlaceholder` | `string` | `'Digitar para pesquisar...'` | Placeholder da busca interna |
| `disabled` | `boolean` | `false` | Fundo `slate-200`, opacidade reduzida, sem foco |
| `leftIcon` | `Component` | `null` | Ícone à esquerda do campo |
| `helperText` | `string` | `''` | Texto auxiliar abaixo do campo |
| `error` | `string` | `''` | Erro canônico (ícone + tooltip + região viva) |
| `ariaLabel` | `string` | `''` | Nome acessível quando não há label visível |
| `remote` | `boolean` | `false` | Modo de busca remota; o consumidor carrega as opções |
| `loading` | `boolean` | `false` | Indicador de carregamento da busca remota |
| `hasMore` | `boolean` | `false` | Exibe “Carregar mais” no modo remoto |
| `selectedOptions` | `SelectOption[]` | `[]` | Mantém chips selecionados fora da página atual |
| `remoteError` | `string` | `''` | Falha da busca remota, com nova tentativa |

- **Emits:** `update:modelValue(valores: Array<string | number>)` e `change(valores)`; no modo remoto também `search(termo)`, `loadMore` e `retry`.
- **Seleção:** os itens escolhidos viram **chips removíveis** dentro do campo; clicar numa opção
  alterna a seleção e mantém a lista aberta.
- **Busca:** filtra as opções por texto, insensível a acentos e maiúsculas; a lista informa quando não
  há correspondência.
- **Modo remoto (`remote`):** não filtra localmente; emite `search` ao abrir/digitar, carrega mais
  páginas via `loadMore`, exibe `loading`/`remoteError` e mantém os chips selecionados via
  `selectedOptions` mesmo quando o item não está na página atual.
- **Teclado:** `Enter`/`Space`/setas abrem; setas navegam; `Enter` alterna; `Escape` fecha;
  `Backspace` com a busca vazia remove o último chip.
- **Acessibilidade:** gatilho `role="combobox"` com `aria-expanded`/`aria-controls`/`aria-activedescendant`;
  lista `role="listbox"` com `aria-multiselectable="true"` e opções `aria-selected`; erro em
  `role="alert"` associado por `aria-describedby`.
- **Visual:** mesmo DNA do `UiSelect` (§5.7) — foco recortado `.ds-bottom-clip` em `brand-focus`, erro
  `rose-700` com `AlertCircle`; altura mínima `34px` com chips.
- **Espelhamento:** seção 26 do `/design` — exemplo habilitado e outro desabilitado em erro.

### 5.27 Painel compacto de Progresso e board da Esteira (domínio) — tela Esteira de Revisão

**Arquivos:** `app/components/esteira/Progresso.vue`, `app/components/esteira/Board.vue` e
`app/components/esteira/ChamadaCard.vue`

Componentes de domínio da tela `/admin/esteira-revisao`. Os KPIs ficam no topo; a barra de
ferramentas concentra busca, **Pacote de Origem** e **Filtros**; na segunda faixa do mesmo card ficam
o filtro **Demandas por origem** e o painel compacto de progresso, lado a lado. O board de três
estágios vem abaixo.

**Topo: KPIs (`Kpis.vue`)**

- Fileira de 4 `UiKpi` do conjunto filtrado — **No filtro**, **Em revisão**, **Aprovadas** e
  **Recusadas** — acima da barra de ferramentas.

**Painel de progresso (`Progresso.vue`) — compacto, junto da origem**

| Prop | Tipo | Descrição |
| :--- | :--- | :--- |
| `progresso` | `ProgressoEsteira` | Total, contagens por status e percentual do fluxo |

- **Layout:** o painel é menor e fica na segunda faixa da barra de ferramentas, ao lado do filtro
  **Demandas por origem** (`lg:grid-cols-[1fr_20rem]`). Em telas estreitas, os dois empilham.
- **Card compacto:** `rounded-lg border border-slate-200 bg-white p-3 shadow-xs`; rótulo
  "Progresso" em versalete; **percentual em `text-lg`** (não é mais o número grande anterior);
  contagens **a revisar**, **aprov.** e **publ.** em linha, com pontos coloridos; barra `h-1.5`;
  rodapé com `revisado/total` e acionador de **recusadas**.
- **Percentual do fluxo:** `(Aprovado + Publicar) / total`; recusadas não entram no numerador
  (aguardam correção).
- **Barra segmentada:** trilha `bg-slate-100` e segmentos com **cores sólidas** — Revisar
  `#f59e0b`, Aprovado `#1a9e07`, Publicar `#0364f7` e Recusado `rose-700` `#be123c`. **Sem degradê**;
  a largura é proporcional ao total.
- **Recusadas:** quando `recusado > 0`, um acionador compacto com ponto rose e `aria-pressed`
  mostra/oculta a faixa de recusadas do board.
- **Acessibilidade:** a trilha expõe `role="progressbar"` com `aria-valuenow` (percentual do fluxo),
  `aria-valuemin="0"`, `aria-valuemax="100"` e `aria-label` textual com as contagens.
- **Escopo:** o painel é **global** (não muda com os filtros do board).

**Barra de ferramentas (`Board.vue`)**

- A barra segue o padrão das demais telas (`UiDataTable`): card branco `rounded-xl border
  border-slate-200 shadow-xs` com título "Chamadas da esteira", subtítulo, ícone
  `FileSpreadsheet` e, à direita, o campo de busca (gate `buscar`), o seletor **Pacote de Origem**
  (releases/manuais/projetos ativos) **à esquerda do botão Filtros** (gate `filtrar`, com badge de
  critérios ativos) e o ícone `X` para limpar.
- **Segunda faixa (onde ficavam os filtros rápidos):** à esquerda, o card **Demandas por origem**
  com o `UiSegmented` compacto (Todas, Releases, Manuais, Escopo) e as contagens globais; à direita,
  o painel compacto de progresso.
- **Software Atendido** e **Parceiro / Cliente** saíram da barra e ficaram **dentro do modal de
  Filtros**, junto de Status, Origem, Tipo, Impacto, vínculos e períodos.

**Board (`Board.vue` + `ChamadaCard.vue`)**

- **Três colunas:** **1. Em Revisão** (amber `#f59e0b`), **2. Aprovado** (verde `#1a9e07`) e
  **3. Publicados** (azul `#0364f7`). Em telas estreitas as colunas empilham.
- **Cabeçalho das colunas:** usa o **mesmo background do header dos modais**
  (`bg-gradient-to-r from-brand-primary to-brand-structure`) com texto branco, borda esquerda de
  `2.5px` na cor do estágio e contagem em pílula `bg-white/15`. É uma exceção visual deliberada
  desta tela ao padrão de superfícies sólidas; a barra de progresso e os cards continuam sólidos.
- **Faixa de recusadas:** seção separada, exibida sob demanda pelo painel, com o mesmo cabeçalho em
  degradê e borda esquerda `rose-700`; contém os cards `Recusado` e a ação Reabrir.
- **Cards:** origem em `UiBadge`, código do vínculo em `font-mono`, chamada, software, parceiro,
  título, resumo da descrição (`line-clamp-3`), tags (até três + `+N`) e contador de imagens de
  evidência. As ações são **somente ícones alinhados à direita**, com tooltip e `aria-label`:
  - Em Revisão: `Eye` (Inspecionar), `ShieldCheck` (Aprovar) e `XCircle` (Recusar);
  - Aprovado: `Undo2` (Voltar p/ Revisão) e `UploadCloud` (Publicar Item);
  - Publicados: `ArchiveRestore` (Suspender p/ Homologado) e `ExternalLink` (No Portal);
  - Recusadas: `Eye` (Inspecionar) e `Undo2` (Reabrir).
- **Degradês:** além do `UiButton variant="primary"`, esta tela usa o degradê do header de modal nos
  cabeçalhos das colunas e da faixa de recusadas (pedido explícito de produto). Nenhuma outra
  superfície usa degradê.
- **Espelhamento:** a referência visual é a própria tela `/admin/esteira-revisao`; a seção 5 do
  `/design` cobre os controles do kit usados nela (Segmented, Select, Input, Modal, Badge, Button).
  O padrão documentado aqui é o contrato para futuras telas de board/progresso.

### 5.28 Gráficos (UiChartBars, UiChartLine, UiChartHorizontalBars) - seção 27 do `/design`

Componentes de visualização do Painel Executivo (`/admin`), sem biblioteca externa. Todos são
somente leitura, usam os tokens do design system e expõem `role="img"` com `aria-label` textual
(lista de séries/valores) além da legenda visível.

**Estrutura comum**

- Card `rounded-xl border border-slate-200 bg-white p-4 shadow-xs`, com título `text-sm font-bold`
  e descrição `text-[11px] text-slate-500`.
- Estado vazio: caixa tracejada `border-dashed` com mensagem centralizada, sem quebrar o layout.
- Cores sólidas; sem degradê (exceção: o `UiButton variant="primary"` e o header de modal já
  documentados).

**UiChartBars**

- Barras verticais empilhadas por categoria (ex.: 12 meses), com `series: { nome, cor, valores }[]`.
- Altura padrão de 220px; cada segmento usa `height: valor / máximo` e `title` com
  `categoria — série: valor`.
- Legenda com pontos coloridos; o cabeçalho aceita o slot `actions` (usado pelo `UiSegmented`
  Mensal/Anual do painel).
- Uso no painel: publicações mensais por status e publicações anuais.

**UiChartLine**

- Linha SVG com pontos por categoria e duas ou mais séries (`series`), eixo X textual abaixo do SVG.
- `viewBox` fixo e `w-full`; `polyline` com `stroke-width="2.5"` e círculos com `title`.
- Uso no painel: chamadas lançadas x liberadas.
- A data de liberação é herdada do conteúdo pai; o texto de descrição do gráfico registra que ela
  pode ser prevista.

**UiChartHorizontalBars**

- Ranking horizontal com rótulo truncado, valor em `font-mono tabular-nums` e trilha `h-1.5`
  preenchida na cor do item (ou na cor padrão `#0364f7`).
- Uso no painel: softwares mais atendidos, tipo, impacto e tempo médio por estágio.

**Acessibilidade**

- Cada gráfico é `role="img"` com `aria-label` contendo o título e os valores das séries; a
  legenda e os rótulos visíveis permanecem no DOM.
- O fluxo da esteira usa `role="progressbar"` com `aria-valuenow`, `aria-valuemin`,
  `aria-valuemax` e `aria-label` com as contagens.
- Controles (`UiSelect`, `UiSegmented`, `UiButton`) mantêm foco/teclado nativos do kit.

**Espelhamento:** seção 27 do `/design` com exemplos reais de barras empilhadas, linha e ranking
horizontal; a tela `/admin` é a referência de composição.

## 28. Componentes de apoio (RL06)

- `UiReportMenu`: menu de relatórios/exportação com teclado, setas, Home/End, Escape e retorno de foco; usado por Softwares, Parceiros, Auditoria e demais listagens.
- `UiErrorState`: estado persistente de erro com mensagem específica (401/403/5xx) e ação "Tentar novamente"; usado nas telas que não têm `UiDataTable`.
- `UiRichTextLazy`: wrapper `defineAsyncComponent` do `UiRichText`, mantendo o editor TipTap fora do bundle inicial da rota.

Contagem atual do kit: **39 componentes** em `app/components/ui/`.