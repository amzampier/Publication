# 03 — Header e Sidebar · Área Administrativa

**Versão:** 1.0.0 · **Data:** 2026-09-30 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** estrutura e comportamento do shell da Área Administrativa (Header + Sidebar retrátil)
**Arquivos-fonte:** [`app/components/layout/AppHeader.vue`](../app/components/layout/AppHeader.vue) ·
[`app/components/layout/AppSidebar.vue`](../app/components/layout/AppSidebar.vue) ·
[`app/layouts/default.vue`](../app/layouts/default.vue) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — seção **14. Arquitetura de Layout Bimodal**
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) §3 · **Autoridade de comportamento:**
spec `openspec/specs/design-system/layout-navigation/spec.md`

> Este documento é a referência única da barra superior e do menu lateral: zonas do header, bloco
> de Account, grupos da sidebar, estados, acessibilidade e o modelo de dados que os alimenta.
> Toda alteração visual aqui deve atualizar também `01 - design_system.md` §3 e a seção 14 do `/design`.

---

## Sumário

1. [Papel no shell](#1-papel-no-shell)
2. [Header claro](#2-header-claro)
   - [2.1 Zona esquerda: alternância + logo](#21-zona-esquerda-alternância--logo)
   - [2.2 Zona direita: notificações + Account](#22-zona-direita-notificações--account)
3. [Bloco Account e menu suspenso](#3-bloco-account-e-menu-suspenso)
4. [Sidebar retrátil](#4-sidebar-retrátil)
   - [4.1 Modos expandida e rail](#41-modos-expandida-e-rail)
   - [4.2 Item raiz](#42-item-raiz)
   - [4.3 Sessões e itens](#43-sessões-e-itens)
   - [4.4 Comportamento no rail](#44-comportamento-no-rail)
5. [Árvore de navegação](#5-árvore-de-navegação)
6. [Modelo de dados (`config/navigation.ts`)](#6-modelo-de-dados-confignavigationts)
7. [Estado e persistência](#7-estado-e-persistência)
8. [Acessibilidade](#8-acessibilidade)
9. [Impressão](#9-impressão)
10. [Vitrine `/design` §14](#10-vitrine-design-§14)
11. [Mudanças desta fase e pendências](#11-mudanças-desta-fase-e-pendências)

---

## 1. Papel no shell

`app/layouts/admin.vue` monta o shell em três peças — é o layout das rotas da Área Administrativa
(`/admin/**`):

```
<div class="fp-shell h-screen flex flex-col overflow-hidden">
  <LayoutAppHeader :sidebar-open="sidebarOpen" />        ← Header claro (h-16)
  <div class="fp-shell-body flex flex-1 min-h-0">
    <LayoutAppSidebar :sidebar-open="sidebarOpen" />     ← Sidebar retrátil
    <main class="fp-shell-content overflow-y-auto scrollbar-discreta">…</main>  ← App Canvas (#f8fafc)
  </div>
</div>
```

- `sidebarOpen` vem da preferência compartilhada `useSidebarExpandida` (`useState`, definida no
  layout `admin.vue`) e desce por prop para header (toggle) e sidebar (largura) — o componente de
  largura não decide sozinho; o cartão "Comportamento Padrão da Barra Lateral" em
  `/admin/configuracoes-globais` escreve na mesma fonte (espelho em tempo real nos dois sentidos).
- **Barra de rolagem vertical discreta:** o `<main>` do canvas usa a classe utilitária
  `.scrollbar-discreta` (`app/assets/css/main.css` — 5px, thumb translúcido `slate-400/30`,
  trilho transparente), então a rolagem do conteúdo administrativo é sutil e não pesa visualmente.
- **Convenção de área:** cada página de `app/pages/admin/**` declara
  `definePageMeta({ layout: 'admin' })` e renderiza dentro do shell. `app/layouts/default.vue` é o
  layout da Área Pública (conteúdo puro sobre `bg-slate-50`, sem header/sidebar) — página sem esse
  meta nunca exibe chrome administrativo. Fronteira conforme
  [`02 - Guia de Arquitetura`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md) §2.1,
  implementada pela change OpenSpec `separate-public-admin-areas`.
- A seção 14 do `/design` usa `definePageMeta({ layout: false })` e reproduz o shell em modo demo.

## 2. Header claro

`h-16 flex items-center justify-between px-4 shrink-0 relative z-40 bg-white border-b border-slate-200 text-slate-900`
Fundo `bg-white` · `border-b border-slate-200` · textos herdados do container em `text-slate-900`
(nenhum filho declara cor própria de texto) · separadores `w-px h-5 bg-slate-200`.

### 2.1 Zona esquerda: alternância + logo

| Elemento | Detalhe |
|---|---|
| Botão de alternância | `PanelLeftClose` com sidebar aberta / `PanelLeftOpen` recolhida; `aria-label` dinâmico "Recolher sidebar"/"Expandir sidebar", `aria-expanded`, `aria-controls="app-sidebar"`; foco `ring-2 ring-brand-focus/50` |
| Separador | `w-px h-5 bg-slate-200` |
| Logotipo | badge `p-1.5 rounded-md bg-brand-primary/10 text-brand-primary` + ícone `Building2 h-4 w-4` + nome **`Publications`** (`text-sm font-bold tracking-tight truncate`) — **quando há logo personalizada** (definida em `/admin/configuracoes-globais` → aba Logomarcas, via `useLogomarcaHeader`), o bloco é substituído por `<img class="h-8 max-w-[180px] object-contain shrink-0">` com a imagem no lugar do ícone + nome; limpar a logo restaura o padrão |

**Não existe** seletor, texto ou badge de empresa/filial: o sistema tem **escopo único** (docs/02 §2.1) e a
área atual (Pública/Administrativa) é evidente pela rota e pelo layout.

### 2.2 Zona direita: notificações + Account

- **Sino de notificações** (`Bell`): botão `p-1.5 rounded-lg hover:bg-slate-100`, ponto `bg-rose-500` quando
  há itens; painel `absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg`
  com **cabeçalho `px-3 py-2 bg-brand-primary`** (banda navy: título `text-white`, contador
  `text-slate-300`), lista `max-h-64 overflow-y-auto scrollbar-discreta bg-[#f9feee]` (título do
  item herda `slate-900`, mensagem `text-slate-600`, tempo `text-slate-500`, hover `bg-slate-100`,
  estado vazio `text-slate-500`) e rodapé `border-t border-slate-200` com ação **Limpar tudo**
  `text-[#0f7a06] hover:bg-slate-100` (verde de texto §2.1, desabilitada com lista vazia). Clicar em
  uma notificação a remove (dispensar). Abre/fecha o mesmo ciclo do Account: abrir um fecha o outro.
- **Bloco Account** — ver [§3](#3-bloco-account-e-menu-suspenso). Sempre no extremo direito, oposto ao toggle.

## 3. Bloco Account e menu suspenso

**Gatilho**

- Avatar `h-7 w-7 rounded-full overflow-hidden bg-brand-structure` — foto ou iniciais
  (2 primeiras letras do nome, `text-[10px] font-bold text-slate-950`, maiúsculas).
- Nome e perfil em **duas linhas alinhadas à esquerda**: nome `text-xs font-normal`,
  perfil `text-[10px] font-normal`, ambos sem negrito.
- Chevron `h-3.5 w-3.5` rotaciona 180° ao abrir (`transition-transform duration-200`).
- Hover `bg-slate-100` · foco `ring-2 ring-brand-focus/50`.

**Menu** — `role="menu"` `aria-label="Menu da conta"`:

```
absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200
rounded-lg shadow-lg py-1 z-30
```

Itens: `w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 text-left hover:bg-slate-100 ds-item-hover-dark`
mais `:style="--item-cor"` — no hover o rótulo assume a **cor do item** (superfície branca: classe
`.ds-item-hover-dark` com fallback `#0f172a`); ícone `h-3.5 w-3.5` com **traço 1.5**
(`.ds-icon-light` — mesmo peso da sidebar), colorido por `MenuItem.cor` (cores cheias — o menu é
branco), divisor `my-1 h-px bg-slate-200`. **Meu Perfil** (sem
`cor`) e **Encerrar Sessão** (rótulo já colorido permanentemente) não usam a classe de hover.

Ordem fixa (definida em `config/navigation.ts`):

| # | Item | Ícone | Cor |
|---|---|---|---|
| 1 | Meu Perfil | `User` | — |
| — | *divisor* | | |
| 2 | Configurações Globais | `Settings` | `#50a1ff` |
| 3 | Gestão de Usuários | `Users` | `#b070ef` |
| 4 | Perfis de Acesso (RBAC) | `ShieldCheck` | `#f5b302` |
| 5 | Gestão de Auditoria | `ScrollText` | `#2dd4bf` |
| — | *divisor* | | |
| 6 | Encerrar Sessão | `LogOut` | `#f45f71` (rótulo colorido) |

**Fechamento:** `pointerdown` global fora do bloco e tecla `Escape` (`fecharMenus`).

## 4. Sidebar retrátil

`<aside id="app-sidebar">` — `shrink-0 bg-brand-primary border-r border-white/10 flex flex-col
transition-all duration-200`; conteúdo `flex flex-col gap-0.5 p-2 flex-1`.

### 4.1 Modos expandida e rail

| Estado | Largura | Overflow | Uso |
|---|---|---|---|
| Expandida | `w-52` | `overflow-hidden` (+ `overflow-y-auto overflow-x-hidden` no container) | títulos completos |
| Rail | `w-[46px]` | **`overflow-visible`** | só ícones; o overflow visível evita cortar o `UiTooltip` |

A troca de overflow é obrigatória: sem ela o balão do rail é recortado.

### 4.2 Item raiz

`itemRaiz` = **Painel Executivo** (`LayoutDashboard`) renderizado **acima** das sessões, sem cabeçalho —
mesmo markup no modo expandido (`justify-center` no rail) e sempre visível.

### 4.3 Sessões e itens

- Cabeçalho da sessão: `text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1
  hover:text-white focus-visible:text-white`,
  chevron rotaciona 180°, `aria-expanded` — **recolhimento individual**; o estado `aberto` de cada
  sessão vem da preferência compartilhada `useSessoesAbertas` (default `aberto: true`, configurável
  em `/admin/configuracoes-globais` → aba Sidebar) e os cliques aqui atualizam essa preferência.
- Item: `<button>` `flex items-center gap-2.5 rounded-lg px-2.5 py-2 w-full text-left`, ícone `h-4 w-4`
  com **traço 1.5** (`.ds-icon-light` em `main.css` — o traço 2 do Lucide parecia em negrito em 16px;
  com `:style` de `tinta(item.cor)` quando o item tem cor), rótulo `text-xs font-normal truncate`,
  `aria-label`, `aria-current="page"` quando ativo.
- **Item ativo:** `bg-white/10 text-lime-300` (Q1 — `lime-700` não alcança 3:1 sobre navy);
  o ícone colorido mantém a sua tinta. **Inativo:** `text-slate-300 hover:bg-white/10` +
  `.ds-item-hover` — no hover a opção inteira assume a **cor do próprio item** (`--item-cor` vindo do
  config e traduzido por `tinta(item.cor)`; item sem `cor` cai no fallback `#f8fafc`). A classe entra só
  no ramo inativo, então o item ativo não muda com o hover.

### 4.4 Comportamento no rail

- Sem cabeçalhos de sessão; **todos os itens de todas as sessões** ficam visíveis como ícones — o
  recolhimento das sessões (acordeão) vale **apenas no modo expandido** (bug corrigido: com "Todas
  Recolhidas" + rail só o item raiz aparecia).
- Divisor entre sessões: `h-px bg-white/15 mx-1 my-1.5`.
- Cada item é envolto em `<UiTooltip content={label} position="right">` com
  `:disabled="sidebarOpen"` (tooltip só no rail).
- O estado `aberto` de cada sessão **é preservado** ao recolher e reexpandir.

### 4.5 Comportamento responsivo (viewport)

- **Abaixo de `lg` (1024px):** com a sidebar expandida ela vira **drawer** — `fixed left-0 top-16
  bottom-0 z-30` (sob o header, que é `z-40`), sobreposto ao conteúdo, acompanhado de **backdrop**
  `fixed inset-0 z-20 bg-slate-900/40 lg:hidden` em `layouts/admin.vue` (clique no backdrop fecha);
  o `main` permanece em largura total — nada é empurrado e não há overflow horizontal. Recolhida, a
  sidebar fica **oculta** (`hidden lg:flex`) — não existe rail em tela estreita.
- **A partir de `lg`:** comportamento original — expandida `w-52` em fluxo deslocando o conteúdo
  (`lg:static lg:z-auto lg:inset-auto` restaura a posição estática) e rail `w-[46px]`.
- **Estado inicial:** na primeira carga, viewport menor que `lg` inicia **recolhida**
  (`aplicarLarguraInicial` no `onMounted` do layout, via `matchMedia('(min-width: 1024px)')`;
  o valor SSR continua `true` porque o servidor não conhece a largura). Qualquer alternância
  manual — toggle do header, clique no backdrop ou cartão de Configurações > Sidebar — marca
  `preferenciaManual` e **prevalece sobre a largura** nos remounts do layout.

## 5. Árvore de navegação

Definida em [`app/config/navigation.ts`](../app/config/navigation.ts) (fonte única — alterar os dados
muda sidebar, header e vitrine ao mesmo tempo):

```
Painel Executivo                 (item raiz · LayoutDashboard)
PUBLICAÇÕES
├── Manuais                      BookOpen
├── Release Week                 Rocket
└── Escopo de Projetos           ClipboardList
MOVIMENTOS
├── Esteira de Revisão           Workflow
└── Lançar as Chamadas           Megaphone
CADASTROS
├── Parceiros                    Handshake
└── Softwares                    Boxes
ADMINISTRAÇÃO
├── Gestão de Usuários           Users
├── Perfis de Acesso (RBAC)      ShieldCheck
├── Gestão de Auditoria          ScrollText
└── Configurações Globais        Settings
```

Observações:

- Os quatro grupos cobrem as frentes do sistema: **conteúdo publicado** (Área Pública lê Manuais,
  Release Week e Escopo de Projetos), **movimentos de negócio** (Esteira de Revisão e Lançar as
  Chamadas — itens ainda sem rota), **cadastros de apoio** e **administração/governança**.
- **Itens sem rota:** o clique não navega — exibe `toast.info` com o rótulo do item e a
  mensagem "Módulo em construção." (spec `design-system/layout-navigation`; **MEL-03 do
  `RL01` resolvido**). O menu da conta fica fora: "Meu Perfil" e "Encerrar Sessão" mantêm
  seu comportamento próprio.
- **Cores dos ícones (`SidebarItem.cor`)** — o ícone fica colorido sempre e o hover da opção pinta
  rótulo/ícone com a mesma cor (`.ds-item-hover` + `--item-cor` em
  [`app/assets/css/main.css`](../app/assets/css/main.css)). As cores no config são **cheias** (mesma
  intensidade do menu suspenso do Account); sobre o navy da sidebar o helper `tinta()`
  (`app/composables/shellTintas.ts`) aplica a tinta D9 correspondente — tabela das 10 tintas em
  [`01 - design_system.md`](01%20-%20design_system.md) §3.3:
  - **Publicações:** Manuais `#f45f71`, Release Week `#1a9e07`, Escopo de Projetos `#50a1ff`
  - **Movimentos:** Esteira de Revisão `#8b5cf6` (roxo), Lançar as Chamadas `#f59e0b` (âmbar) —
    cores novas, criadas para o grupo; as demais continuam sem mudança
  - **Cadastros:** Parceiros `#047857` (Verde Esmeralda), Softwares `#0364f7` (azul Estrutural)
  - **Administração** (mesmas cores do `accountMenuItens`, mesmo item => mesma cor): Gestão de
    Usuários `#b070ef`, Perfis de Acesso (RBAC) `#f5b302`, Gestão de Auditoria `#2dd4bf`, Configurações
    Globais `#50a1ff`
  - Sem `cor`: apenas o item raiz **Painel Executivo**. Antes do grupo Movimentos todas as cores
    já existiam no design system ou no menu Account; `#f59e0b` e `#8b5cf6` são as primeiras
    criadas de propósito para um grupo de navegação.
- `Parceiros` e `Softwares` são módulos de cadastro ainda sem spec de domínio (ver [§11](#11-mudanças-desta-fase-e-pendências)).
- Rótulos das sessões são gravados em caixa mista e renderizados em **caixa alta pelo CSS** (`uppercase`
  no cabeçalho) — não escrever em maiúsculas no dado.

## 6. Modelo de dados (`config/navigation.ts`)

```ts
interface SidebarItem   { id: string; label: string; icon: Component; cor?: string }
interface SidebarSession { label: string; aberto: boolean; items: SidebarItem[] }
interface MenuItem      { label: string; icon: Component; cor?: string }
interface Conta         { nome: string; perfil: string }
```

| Export | Uso |
|---|---|
| `itemRaiz` | item acima das sessões (sidebar) |
| `sessoes` | grupos/itens da sidebar |
| `conta` | nome, perfil e iniciais do Account |
| `accountMeuPerfil` / `accountMenuItens` / `accountEncerrarSessao` | ordem do menu suspenso |
| `notificacoesIniciais` | carga inicial do sino |

`MenuItem.cor` e `SidebarItem.cor` existem porque o Tailwind não resolve cor dinâmica em classe —
sempre via `:style`; no caso da sidebar, a mesma cor alimenta a variável `--item-cor` usada pelo
hover `.ds-item-hover`, traduzida para a tinta D9 por `tinta(item.cor)` (ver §4.3).

**Removidos nesta fase:** `empresaAtiva` e o item "Troca de Filial / Empresa" (escopo único, sem
empresas/filiais).

## 7. Estado e persistência

| Estado | Onde vive | Observação |
|---|---|---|
| `sidebarOpen` | `useSidebarExpandida` (`useState`, lido por `layouts/admin.vue`) | preferência compartilhada com Configurações > Sidebar; default `true` no SSR, espelho com o toggle do header; na primeira carga o cliente aplica `aplicarLarguraInicial` (recolhida abaixo de `lg`) salvo `preferenciaManual` (F5 zera) |
| `preferenciaManual` | `useSidebarExpandida` (`useState`) | marcada por toggle/backdrop/cartão de Configurações — daí em diante a escolha manual prevalece sobre a largura da viewport (F5 zera) |
| `sessao.aberto` | `useSessoesAbertas` (`useState`, lido por `AppSidebar`) | individual, preferência compartilhada com Configurações > Sidebar; default `true` em `navigation.ts`, preservado ao recolher/reexpandir (F5 zera) |
| `itemAtivo` | `AppSidebar.vue` | deriva da rota quando a URL casa com um item que tem `to` (ex.: `/admin/configuracoes-globais`); fallback no ref local para itens sem rota (clica e marca) |
| `contaAberto` / `notificacoesAberto` | `AppHeader.vue` | mútuamente exclusivos |
| `notificacoes` | `AppHeader.vue` (cópia de `notificacoesIniciais`) | dispensar/remove, "Limpar tudo"/esvazia |

## 8. Acessibilidade

- Toggle: `aria-label` dinâmico + `aria-expanded` + `aria-controls="app-sidebar"`.
- Sessões: botão com `aria-expanded`; itens com `aria-label` e `aria-current="page"` quando ativos.
- Menus: `role="menu"`, itens `role="menuitem"`, divisores `role="separator"`.
- Fechamento por `Escape` e por clique fora (`pointerdown` global).
- Foco visível sempre `ring-2 ring-brand-focus/50` (verde canônico `#1a9e07`) — nunca `lime-500`.
- Tooltip do rail: `position="right"`, desabilitado enquanto a sidebar está expandida.

## 9. Impressão

`app/assets/css/main.css` oculta `header`, `aside`, `nav` e `button:not(.print-visible)` e libera a
altura/rolagem de `.fp-shell`, `.fp-shell-body` e `.fp-shell-content` (`height: auto !important`) —
só o conteúdo é impresso. Detalhes em `01 - design_system.md` §3.4.

## 10. Vitrine `/design` §14

A seção 14 **espelha o shell real**: importa `sessoes`, `itemRaiz`, `conta`, `accountMeuPerfil`,
`accountMenuItens`, `accountEncerrarSessao` e `notificacoesIniciais` de `config/navigation.ts` em vez
de manter definição local dos dados (mantém apenas uma cópia de trabalho para o recolhimento, como o
`AppSidebar`), reproduz as mesmas larguras (`w-52`/`w-[46px]`), os mesmos divisores, o item raiz acima
das sessões, o mesmo menu (`w-56`) e a central de notificações. Qualquer mudança aqui exige conferir a
vitrine — e vice-versa.

**Comparação de modelos (toggle "Atual | Antigo (comparação)"):** o cabeçalho da seção alterna o estado
`shellTradicional` (default `false` = modelo atual), aplicando `ds-shell-antigo` ao container da demo
quando "Antigo" — header navy, sidebar branca (ícone/rótulo com as cores cheias, ativo
`bg-brand-structure/10 text-lime-700`, fallback de hover `#0f172a`) e **menu Account navy** (fundo
`bg-brand-primary border-slate-700`, rótulo `text-[#f8fafc]`, hover `bg-brand-structure/60`, divisor
`bg-white/40`). No estado "Atual" (padrão) a demo é idêntica ao shell real: header claro, sidebar navy
com tintas D9 via `tinta()` (ativo `bg-white/10 text-lime-300`, fallback de hover `#f8fafc`), menu
Account branco e **sino/painel de notificações** (dados de `notificacoesIniciais`, dispensar e
"Limpar tudo", exclusão mútua com o menu da conta, clique fora e `Escape`; cabeçalho do painel em navy
com escrita branca, lista `bg-[#f9feee]`, "Limpar tudo" em verde `#0f7a06`). Vale **só para a
vitrine**: os dados importados, larguras, árvore e a estrutura do menu seguem idênticos e o shell real
(`AppHeader`/`AppSidebar`) não recebe a classe — nele o modelo é sempre o atual. Mapa completo em
`01 - design_system.md` §3.5.

## 11. Mudanças desta fase e pendências

**Change OpenSpec `construir-configuracoes-globais` (atual):**

| Arquivo | Mudança |
|---|---|
| `app/config/navigation.ts` | `to?: string` em `SidebarItem`/`MenuItem`; os 2 itens "Configurações Globais" (sidebar + menu Account) apontam para `/admin/configuracoes-globais` |
| `app/components/layout/AppSidebar.vue` | clique navega via `navigateTo(item.to)` quando presente; `itemAtivo` sincroniza com a rota (fallback no ref local) |
| `app/components/layout/AppHeader.vue` | item do menu Account com `to` navega e fecha os menus (`clicarItemMenu`) |

**Change OpenSpec `adotar-shell-claro-escuro` (atual):**

| Arquivo | Mudança |
|---|---|
| `app/components/layout/AppHeader.vue` | header claro (`bg-white border-b border-slate-200 text-slate-900`), badge do logo `brand-primary/10`, menu Account branco e sino/painel (cabeçalho navy com escrita branca, lista `bg-[#f9feee]`, "Limpar tudo" verde `#0f7a06`) |
| `app/components/layout/AppSidebar.vue` | sidebar navy (`bg-brand-primary border-r border-white/10`), ativo `bg-white/10 text-lime-300`, inativo `slate-300`, tintas D9 via `tinta()` |
| `app/composables/shellTintas.ts` (novo) | mapa das 8 tintas D9 + `tinta(hex)` (compartilhado com a demo §14) |
| `app/assets/css/main.css` | semântica de hover invertida: base = modelo novo, `.ds-shell-antigo` só na demo |
| `app/pages/design.vue` §14 | default = modelo atual, toggle "Atual \| Antigo (comparação)", sino/painel na demo |
| `docs/01 - design_system.md` §3 | §3.1/§3.2/§3.3 no modelo novo, tintas em §3.3, §3.5 = modelo legado |

**Change OpenSpec `separate-public-admin-areas` (arquivada):**

| Arquivo | Mudança |
|---|---|
| `app/layouts/admin.vue` (novo) | recebe o shell movido de `default.vue` — layout das rotas `/admin/**` |
| `app/layouts/default.vue` | vira o layout da Área Pública: só `<slot />` sobre `bg-slate-50`, sem header/sidebar |
| `app/pages/admin/index.vue` (novo) | home da Área Administrativa com `definePageMeta({ layout: 'admin' })` e o placeholder "Painel Executivo" |
| `app/pages/index.vue` | passa a ser o placeholder da Área Pública (sem shell) |
| `docs/01 - design_system.md` §3 | o shell identifica-se pela rota `/admin` |

**Change OpenSpec `update-admin-shell-navigation` (arquivada):**

| Arquivo | Mudança |
|---|---|
| `app/app.vue` | envolve `<NuxtPage />` em `<NuxtLayout>` — sem isso (NUXT_E4007) o shell nunca era montado |
| `app/config/navigation.ts` | novos grupos (Publicações/Cadastros/Administração), menu do Account com "Gestão de Auditoria", remoção de `empresaAtiva`/`Troca de Filial / Empresa` |
| `app/components/layout/AppHeader.vue` | logo `Publications`; remoção do bloco "Matriz/Filial" e do separador `#f59e8b` |
| `app/components/layout/AppSidebar.vue` | sem mudança de markup (consome os novos dados) |
| `app/pages/design.vue` §14 | espelha os dados reais (import) + item raiz + menu `w-56` |
| `docs/01 - design_system.md` §3 | sinos, ordem do menu, largura `w-56`, as 3 sessões e o item raiz |

**Pendências declaradas (fora do escopo):**

1. ~~`/` ainda renderiza o shell administrativo~~ — **resolvida** por `separate-public-admin-areas`:
   a raiz `/` usa `app/layouts/default.vue` (Área Pública, sem shell) e o shell vive em
   `app/layouts/admin.vue`, aplicado sob `/admin/**`.
2. Sem middleware de auth ou RBAC; itens com o campo opcional `to` já navegam (sidebar e menu
   Account — na Administração, os quatro itens apontam para `/admin/configuracoes-globais`,
   `/admin/gestao-usuarios`, `/admin/auditoria` e `/admin/perfis-acesso`), e o item
   ativo da sidebar deriva da rota quando a URL casa com um `to`. Os demais itens seguem apenas
   estado visual — existe apenas a home `/admin`.
3. `Parceiros` e `Softwares` não têm spec de domínio (módulos ainda não construídos).
