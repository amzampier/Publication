# 04 — Configurações Gerais · Área Administrativa

**Versão:** 1.1.0 · **Data:** 2026-10-01 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela de Configurações Globais do Sistema — estrutura componentizada, os 4 painéis
(logomarcas, sidebar, retenção de auditoria, segurança), componentes de kit criados e navegação
até a rota
**Arquivos-fonte:** [`app/pages/admin/configuracoes-globais.vue`](../app/pages/admin/configuracoes-globais.vue) ·
[`app/components/configuracoes/`](../app/components/configuracoes) ·
[`app/components/ui/Tabs.vue`](../app/components/ui/Tabs.vue) ·
[`app/components/ui/Slider.vue`](../app/components/ui/Slider.vue)
**Vitrine:** [`/design`](../app/pages/design.vue) — seção **16. Tabs & Slider**
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) §5.13–§5.14 ·
**Autoridade de comportamento:** specs da change `openspec/changes/construir-configuracoes-globais`
(`configuracoes-globais`, `design-system/tabs`, `design-system/slider`, `design-system/layout-navigation`,
delta `brand-tokens`)

> Este documento é a referência da tela `/admin/configuracoes-globais` e de tudo o que foi criado
> para ela: componentes de domínio, componentes de kit (`UiTabs`, `UiSlider`, `CheckChip.showCheck`),
> CSS dedicado, navegação e specs. Toda alteração aqui deve atualizar também `01 - design_system.md`
> (§5.13/§5.14/§5.9) e a seção 16 do `/design`.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (criados/alterados)](#4-componentes-de-kit-criadosalterados)
5. [Comportamento da aba de retenção](#5-comportamento-da-aba-de-retenção)
6. [Salvar e estado](#6-salvar-e-estado)
7. [Navegação até a tela](#7-navegação-até-a-tela)
8. [Estilo e CSS dedicado](#8-estilo-e-css-dedicado)
9. [Vitrine `/design` §16](#9-vitrine-design-§16)
10. [Especificações OpenSpec](#10-especificações-openspec)
11. [Verificação](#11-verificação)
12. [Pendências e próximos passos](#12-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A Configurações Globais é a tela de parâmetros transversais da Área Administrativa:

- **Rota:** `/admin/configuracoes-globais` → `app/pages/admin/configuracoes-globais.vue` com
  `definePageMeta({ layout: 'admin' })` — herda automaticamente o shell (header + sidebar) por
  `/admin/**` (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Aba padrão:** "Logomarcas & Identidade" (`id: 'logomarcas'`) ao carregar (pedido do usuário);
  as outras 3 abas têm painel de conteúdo (mockups enviados pelo usuário).
- **Fase 1:** tudo em memória — sem backend, sem `sistema_config`, sem chamadas de rede.

## 2. Estrutura da página (componentização)

A página é fina: só estado e composição. Cada parte é um componente em
`app/components/configuracoes/` (auto-import com prefixo `Configuracoes*`):

```
configuracoes-globais.vue                       (aba='logomarcas', flag `alterado` p/ o Salvar)
├── <ConfiguracoesCabecalho :desabilitado="!alterado" @salvar>
│     ← header SEM container, botão à direita (desabilitado até haver alteração)
└── <ConfiguracoesAbas v-model="aba">     ← container card: barra de abas + conteúdo
      (margin-top-10 = 40px entre header e container — ajuste do usuário)
      ├── <UiTabs id-prefix="config">     (barra, dentro do container)
      └── slot (área do painel ativo, role="tabpanel")
            ├── <ConfiguracoesAbaLogomarcas @change="alterado = true" />
            ├── <ConfiguracoesAbaSidebar @change="alterado = true" />
            ├── <ConfiguracoesAbaRetencaoAuditoria v-model="dias" @change="alterado = true" />
            └── <ConfiguracoesAbaSeguranca @change="alterado = true" />
```

- **Header sem container:** título/descrição/ação diretos sobre o `bg-slate-50` (sem card branco),
  com o `UiButton` "Salvar Alterações Globais" alinhado à direita — **nasce desabilitado** e só
  habilita quando qualquer painel emite `change` (watch sobre seus refs); `salvar()` reseta.
- **Dois eventos por painel:** `update:modelValue` (retenção) e `change` (qualquer alteração
  de estado — liga o botão Salvar).
- **Container das abas:** um único card (`rounded-xl border border-slate-200 bg-white shadow-xs`)
  com a barra das abas em cima (`border-b border-slate-100`) e o conteúdo do painel ativo dentro
  (`p-6`). Os painéis **não** têm card próprio — evita cards aninhados (os cards internos dos
  painéis são conteúdo, não chrome da página).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<ConfiguracoesCabecalho>`

Cabeçalho da tela, sem container: tile navy com `Settings`, título
"Configurações Globais do Sistema" e descrição com `<code>` à esquerda; `UiButton variant="primary"
size="md"` com ícone `Save` à direita. O cabeçalho é `flex flex-wrap` com `min-w-0` no bloco de
título e o botão usa `w-full sm:w-auto` — abaixo de `sm` ele ocupa a linha inteira e o layout não
gera overflow horizontal a 375px, mesmo com a sidebar em fluxo (RL01 BUG-03).

| Prop | Tipo | Descrição |
| :--- | :--- | :--- |
| `desabilitado` | `boolean` *(default `false`)* | Passa `disabled` ao `UiButton` — a página usa `:desabilitado="!alterado"` |

- **Emits:** `salvar()` — a página converte em `toast.success(...)` e reseta a flag `alterado`.
- Sem slots: é específico desta tela (título/descrição fixos do módulo).

### 3.2 `Abas.vue` → `<ConfiguracoesAbas>`

Container das abas: barra + área do painel ativo.

| Prop | Tipo | Descrição |
| :--- | :--- | :--- |
| `modelValue` | `string` *(obrigatória)* | Id da aba ativa (`v-model`) |

- **Emits:** `update:modelValue(string)` e `change(string)`.
- **Slot:** `default` — conteúdo do painel ativo (a página decide qual componente renderizar com `v-if`).
- **Define as 4 abas do módulo** (ícone + cor): `Logomarcas & Identidade` (`Image`, âmbar
  `#f59e0b`) · `Sidebar & Sessões do Menu` (`PanelLeft`, `#0364f7`) · `Retenção de Auditoria`
  (`Clock`, `#0f7a06`) · `Segurança & Rate Limits (30 Min)` (`ShieldAlert`, `#be123c`).
- **ARIA:** o wrapper do slot é o `role="tabpanel"` com `id="config-panel-<aba>"` e
  `aria-labelledby="config-tab-<aba>"` — o `UiTabs` recebe `id-prefix="config"`, ligando tab ↔ painel.

### 3.3 `AbaRetencaoAuditoria.vue` → `<ConfiguracoesAbaRetencaoAuditoria>`

Conteúdo da aba "Retenção de Auditoria" (puro, sem card — vive dentro do container):

| Prop | Tipo | Descrição |
| :--- | :--- | :--- |
| `modelValue` | `number` *(obrigatória)* | Dias vigentes (`v-model` com a página) |

- Cabeçalho com ícone `Clock` verde (cor da aba, `text-[#0f7a06]`) + título "Política de Retenção
  & Expurgo de Logs de Auditoria" + subtítulo dinâmico
  "Registros com mais de **N dias** são marcados para expurgo".
- Card interno "Janela de Retenção Ativa": número grande `text-[#0f7a06] font-mono tabular-nums`
  (verde de texto, §2.1 do design system), `UiSlider` com `marks` (30/90/180/365/730) e atalhos
  `UiCheckChip variant="slate" show-check` (30/60/90/180/365/730).
- Banner azul "Rotina de Expurgo Automático" (markup de domínio — **não** há `UiAlert` no kit) com a
  query interpolada `DELETE FROM auditoria WHERE registrado_em < NOW() - INTERVAL {{dias}} DAY`.

### 3.4 `AbaLogomarcas.vue` → `<ConfiguracoesAbaLogomarcas>`

Conteúdo da aba "Logomarcas & Identidade" (sem props — guarda caminho e prévia internamente,
sincronizados com o shell):

- Cabeçalho com ícone `Image` âmbar (cor da aba, `text-amber-500`) + título "Identidade Visual &
  Logomarcas do Sistema" + divisor.
- Dois cards lado a lado (`grid lg:grid-cols-2`): **Logo do Header** (`logo_header_url`) e
  **Logo da Tela de Login** (`logo_login_url`), cada um com ícone em tile
  (`bg-brand-structure/10`), badge de status (`done` "Personalizada" / `neutral` "Marca padrão")
  e dois blocos (sem referência de coluna nem texto de ajuda — removidos na revisão):
  1. **`UiUploadFiles`** (`forma="retangular"`, `aceitar="image/*"`, sem câmera) — buscar a
     imagem por clique ou drag & drop; ao enviar, grava o caminho
     `/uploads/logomarcas/<nome>` no campo abaixo e mostra a prévia na própria caixa.
  2. **`UiInput mono` "Caminho da imagem"** — valor gravado no banco; fica **desabilitado** quando
     o valor veio da seleção do arquivo no upload (não editável à mão) e permanece editável apenas
     quando vazio (URL externa digitada também funciona); para limpar um caminho vindo do upload,
     remova o arquivo na caixa acima — o campo volta a ficar habilitado.
- Sem seção de pré-visualização dark e sem botões de modelo — removidos a pedido do usuário
  na revisão da aba.
- **Dois estados por logo:** `preview*` (**dataURL** para a caixa de upload — trocada de
  objectURL quando a logo passou a refletir no header, porque a dataURL sobrevive à troca de
  aba sem revogação) e `logo*` (caminho armazenado); a caixa é remontada por `:key` ao limpar
  para não deixar prévia órfã.
- **Reflexo no shell (pedido do usuário):** o composable `useLogomarcaHeader`
  (`app/composables/useLogomarcaHeader.ts` — `useState` de caminho + preview) liga o painel ao
  `AppHeader`; um `watch` sobre `logoHeader`/`previewHeader` sincroniza o estado global, que o
  header exibe como `<img>` no lugar do ícone + "Publications" (limpar → marca padrão volta).
  Ao montar, o painel lê o estado global — reentrar na aba restaura badge, prévia e caminho.
  O `emit('change')` do watch habilita o botão Salvar.

### 3.5 `AbaSidebar.vue` → `<ConfiguracoesAbaSidebar>`

Conteúdo da aba "Sidebar & Sessões do Menu" (sem props; as duas preferências são estado
compartilhado com o shell — `useSidebarExpandida` e `useSessoesAbertas`):

- Cabeçalho com ícone `PanelLeft` azul (cor da aba, `text-brand-structure`) + título "Preferências
  Iniciais da Barra Lateral (Sidebar) & Sessões do Menu" + divisor.
- **Layout (pedido do usuário):** os dois containers ficam **empilhados em coluna única**
  (`space-y-5`) e o conteúdo de cada um em **duas colunas** (`grid md:grid-cols-2`).
- **Container 1 — Comportamento Padrão da Barra Lateral:** ícone (`PanelLeft` em
  `bg-brand-structure/10`) — sem referência de coluna nem texto descritivo abaixo do título —
  e 2 `UiCheckCard checkbox-position="start"` em **seleção única** — variant padrão `lime`, com o
  cartão marcado exibindo o estado verde do design system (`border-brand-accent bg-lime-50/30`,
  `docs/01` §5.9)
  (`Expandida por padrão` · badge `Recomendado` lime · `PanelLeftOpen` / `Recolhida · Compacta` ·
  `PanelLeftClose`), com a opção não escolhida atenuada (`opacity-60`). O estado vem de
  `useSidebarExpandida` (`useState<boolean>`, default `true` no SSR): marcar recolher **recolhe a
  sidebar real do shell na hora** e o toggle do header atualiza o cartão (espelho duplo); o cartão
  também marca `preferenciaManual`, fazendo a escolha do usuário prevalecer sobre a largura da
  viewport na inicialização responsiva (docs/03 §4.5).
- **Container 2 — Comportamento das Sessões do Menu** (ícone `SlidersHorizontal`), duas colunas:
  - **Coluna 1 — presets globais:** `Todas as Sessões Abertas / Expandidas` (`Recomendado` lime,
    `FolderOpen`) e `Todas as Sessões Recolhidas / Acordeão` (`Folder`) — marcar um aplica em
    todas; o estado misto deixa ambos desmarcados.
  - **Coluna 2 — cartões por sessão (seleção múltipla, sem rótulo visível — removido a pedido
    do usuário):** um `UiCheckCard` por sessão de `navigation.ts`
    (Publicações · Cadastros · Administração) com badge dinâmico (`Aberta` done / `Recolhida`
    neutral), descrição = itens da sessão (`Manuais · Release Week · …`) e ícone semântico
    (`BookOpen`/`Boxes`/`Settings`); cada uma é marcável/desmarcável de forma independente.
- **Reflexo no shell (Q&A com o usuário):** o estado das sessões mora em
  `useSessoesAbertas` (`app/composables/useSessoesAbertas.ts` — `useState<Record<label, boolean>>`
  com default vindo de `navigation.ts`); o `AppSidebar` o lê como fonte única e os cliques no
  shell escrevem de volta — a preferência reflete em tempo real na sidebar real. **No modo rail
  todos os ícones permanecem visíveis** mesmo com as sessões recolhidas (o acordeão vale só no
  modo expandido — docs/03 §4.4).

### 3.6 `AbaSeguranca.vue` → `<ConfiguracoesAbaSeguranca>`

Conteúdo da aba "Segurança & Rate Limits (30 Min)" (sem props — lista em memória):

- Cabeçalho com `ShieldAlert` rose + título + subtítulo com `` `seguranca_rate_limits` `` (sem
  botões à direita — "Simular Bloqueio Teste" e "Limpar Todos" removidos na revisão).
- 3 cards de indicadores (markup de domínio — `UiKpi` tem ondas/borda que não constam no mockup):
  **5** tentativas consecutivas, **30** minutos (`text-rose-700`), chave de rastreio
  "E-mail em Minúsculo + IP de Origem".
- Seção "REGISTROS ATIVOS NA TABELA `SEGURANCA_RATE_LIMITS` (N)" com contagem dinâmica +
  "Atualizar" (link com `RefreshCw` → `toast.info`; hover **verde** `text-emerald-700` — pedido
  do usuário).
- Lista de registros no **`UiDataTable`** do kit (padrão cxGrid: cabeçalho navy, Group By Box,
  ordenação, busca `show-header-top`, paginação; `minWidth: 170` no e-mail para não gerar
  rolagem horizontal) com slots de célula: IP em mono, `UiBadge blocked` "N falha(s)" em
  tentativas e motivo truncado; coluna **Ações** via slot `actions` com `UiTooltip` envolvendo
  **apenas o ícone** `LockOpen` (botão transparente sem moldura, `aria-label="Liberar"` — sem
  `UiButton`, a pedido do usuário). Ação da linha: **liberar** remove o registro (lista vazia
  mostra o estado vazio do próprio `UiDataTable`).

## 4. Componentes de kit (criados/alterados)

Contrato completo em `01 - design_system.md`; aqui o resumo do módulo.

### 4.1 `UiTabs` (novo — §5.13)

- `app/components/ui/Tabs.vue` — `v-model` de id + `items: { id, label, icon?, cor? }`, emits
  `update:modelValue` e `change(id)` (nunca `Event`).
- **Visual:** aba ativa = pill lime `bg-lime-50 border-lime-300 text-lime-900` (`hover:bg-lime-100`);
  inativas slate com `border-transparent` (sem salto de layout); ícone na `cor` do item, preservada
  na aba ativa; tablist **centralizada** (`justify-center`, mantida na quebra de linha — pedido do
  usuário) a partir de `sm`; **abaixo de `sm`** a barra rola horizontalmente
  (`overflow-x-auto justify-start` + `shrink-0` nas abas — os rótulos nunca quebram dentro do
  botão), evitando o empilhamento em ~4 linhas a 375px (RL01 BUG-03).
- **ARIA/teclado:** `role="tablist/tab"`, `aria-selected` só na vigente, `aria-controls`/`
  aria-labelledby` via `id-prefix` + `useId()`, roving `tabindex`, `←`/`→` com wrap, `Home`/`End`,
  foco `outline-brand-focus`.

### 4.2 `UiSlider` (novo — §5.14)

- `app/components/ui/Slider.vue` — `<input type="range">` nativo; `v-model` **number**
  (`min=30`, `max=730`, `step=1`), `marks?: { value, label }[]`, `valueText` (default `"{n} dias"`),
  `aria-valuetext` com o valor + unidade.
- **Visual:** track preenchida em degradê **`#112051` → `#0364f7` → `#4ed813`** esticado da origem
  até o thumb (`.ds-slider` em `main.css`, CSS var `--pct`), resto `slate-200`; thumb navy; foco
  `:focus-visible` `#1a9e07` (nunca `lime-500`).

### 4.3 `UiCheckChip.showCheck` (alterado — §5.9)

- Nova prop `showCheck?: boolean = true` suprime o ícone ✓ quando ativa — os atalhos do mockup são
  pills navy **sem** ✓; usos existentes da vitrine §11 não mudam (default).

## 5. Comportamento da aba de retenção

- **Slider e atalhos sincronizados:** mover o slider atualiza número, subtítulo, query e o chip
  ativo; clicar num atalho move o slider. Sempre **exatamente um** valor vigente — o chip já
  selecionado emite `change(false)` e é ignorado (seleção única no domínio).
- **Textos derivados:** subtítulo e `INTERVAL N DAY` da query vêm sempre do `dias` corrente, sem
  valores fixos.
- **Faixa:** 30 a 730 dias; atalhos de compliance: 30, 60, 90, 180, 365, 730; default **180**.

## 6. Salvar e estado

- **Botão Salvar com dirty flag:** nasce desabilitado (`Cabecalho` com `:desabilitado="!alterado"`);
  cada painel emite `change` via `watch` sobre seus refs (retenção: watch no `v-model`), a página
  marca `alterado = true` e `salvar()` exibe `toast.success('Configurações Globais', …)` e volta a
  desabilitar — sem `fetch`, sem persistência.
- Estado global na página: `aba = ref('logomarcas')` (aba padrão), `diasRetencao = ref(180)` e
  `alterado = ref(false)`. Estado de cada painel vive dentro do componente (seleções da aba
  Sidebar, registros da aba Segurança) — recarregar volta tudo aos defaults (comportamento exigido
  pela spec: "Estado não persiste").
- **Logo do header, sidebar e sessões do menu são exceções:** `useLogomarcaHeader`,
  `useSidebarExpandida` e `useSessoesAbertas` (`useState`) mantêm caminho+preview da logo, o
  expandir/recolher e o mapa de sessões abertas compartilhados com o `AppHeader`/`AppSidebar`/
  layout admin, então essas seleções sobrevivem à troca de aba (o painel restaura ao reentrar) e
  valem em tempo real no shell — mas F5 zera, pois o `useState` não persiste.

## 7. Navegação até a tela

- `app/config/navigation.ts`: `to?: string` em `SidebarItem` e `MenuItem`; os 2 itens
  "Configurações Globais" (sidebar + menu Account) apontam para `/admin/configuracoes-globais`.
- `AppSidebar.vue`: o clique navega via `navigateTo(item.to)`; `itemAtivo` sincroniza com a rota
  (URL direta marca o item), com fallback no ref local para os itens sem `to`.
- `AppHeader.vue`: item do menu Account com `to` navega e fecha os menus (`clicarItemMenu`).
- Detalhes em `03 - Header e Sidebar.md` §7 e §11.

## 8. Estilo e CSS dedicado

- `.ds-slider` em `app/assets/css/main.css` — regras do range (aparência, gradiente da track,
  thumbs webkit/moz, foco). Tailwind não alcança pseudo-elementos; o arquivo é servido graças ao
  `tailwindcss.cssPath` (canário: `.ds-bottom-clip`).
- Cores das abas e do número grande seguem tokens/§2.1: foco `#1a9e07`, texto verde `#0f7a06`,
  erro/ícone rose `#be123c`, accent `#4ed813` nunca puro sobre branco.
- Degradê permanece restrito a `Button primary`, header do modal e trilha do `UiSlider`
  (delta `brand-tokens` da change).

## 9. Vitrine `/design` §16

A seção **16. Tabs & Slider** demonstra os dois componentes do kit (abas interativas com
`id-prefix="demo"` + slider com marcas e readout). Índice de âncoras: entrada `tabs-slider` no array
`secoes`. Qualquer mudança de contrato em `UiTabs`/`UiSlider` deve aparecer aqui e em §5.13/§5.14.

## 10. Especificações OpenSpec

Change ativa: **`construir-configuracoes-globais`** (`openspec/changes/`).

| Capability | Delta | Conteúdo |
| :--- | :--- | :--- |
| `configuracoes-globais` | ADDED | rota+shell, 4 abas com logomarcas ativa e conteúdo nas demais (logomarcas com upload + reflexo no `AppHeader`, sidebar com grupos exclusivos, segurança com indicadores/registros), slider+atalhos seleção única, textos dinâmicos, salvar com botão desabilitado até alterar, toast sem persistência |
| `design-system/tabs` | ADDED | contrato do `UiTabs` (v-model/change, ARIA, teclado, pill lime, vitrine/docs) |
| `design-system/slider` | ADDED | contrato do `UiSlider` (faixa, marcas, degradê da track, foco, valor acessível) |
| `design-system/layout-navigation` | ADDED | `to` opcional, navegação, item ativo por rota |
| `design-system/brand-tokens` | MODIFIED | degradê estende à trilha do `UiSlider` |

## 11. Verificação

Sem lint/test no projeto — o gate é:

1. `npm run build` (exit 0).
2. SSR com dev server no ar: `Invoke-WebRequest` de `/admin/configuracoes-globais`, `/admin` e
   `/design` retornando 200 (a página com `role="tablist"`, `role="tabpanel"` e a query `INTERVAL 180 DAY`).
3. `openspec validate --specs` (3/3) e `openspec validate "construir-configuracoes-globais"`.
4. Conferência visual em `http://localhost:3000` (página + §16 do `/design` + navegação).

## 12. Pendências e próximos passos

1. Persistência real (`sistema_config`), fetch/PUT da API e confirmação de erro — fase 2.
2. Auth/RBAC e permissões da tela — fora do escopo (sem middleware).
3. Conferência visual final com o usuário (fidelidade aos 4 mockups, cores dos ícones das abas,
   navegação na demo §14 do `/design`).
