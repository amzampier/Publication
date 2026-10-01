# 03 — Header e Sidebar · Área Administrativa

**Versão:** 1.0.0 · **Data:** 2026-09-30 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** estrutura e comportamento do shell da Área Administrativa (Header Dark + Sidebar retrátil)
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
2. [Header Dark](#2-header-dark)
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
  <LayoutAppHeader :sidebar-open="sidebarOpen" />        ← Header Dark (h-16)
  <div class="fp-shell-body flex flex-1 min-h-0">
    <LayoutAppSidebar :sidebar-open="sidebarOpen" />     ← Sidebar retrátil
    <main class="fp-shell-content">…</main>              ← App Canvas (#f8fafc)
  </div>
</div>
```

- `sidebarOpen` é definido **no layout** e desce por prop para header (toggle) e sidebar (largura) —
  o componente de largura não decide sozinho.
- **Convenção de área:** cada página de `app/pages/admin/**` declara
  `definePageMeta({ layout: 'admin' })` e renderiza dentro do shell. `app/layouts/default.vue` é o
  layout da Área Pública (conteúdo puro sobre `bg-slate-50`, sem header/sidebar) — página sem esse
  meta nunca exibe chrome administrativo. Fronteira conforme
  [`02 - Guia de Arquitetura`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md) §2.1,
  implementada pela change OpenSpec `separate-public-admin-areas`.
- A seção 14 do `/design` usa `definePageMeta({ layout: false })` e reproduz o shell em modo demo.

## 2. Header Dark

`h-16 flex items-center justify-between px-4 shrink-0 relative z-40 bg-brand-primary`
Fundo `#112051` · textos `#f8fafc` · separadores `w-px h-5`.

### 2.1 Zona esquerda: alternância + logo

| Elemento | Detalhe |
|---|---|
| Botão de alternância | `PanelLeftClose` com sidebar aberta / `PanelLeftOpen` recolhida; `aria-label` dinâmico "Recolher sidebar"/"Expandir sidebar", `aria-expanded`, `aria-controls="app-sidebar"`; foco `ring-2 ring-brand-focus/50` |
| Separador | `w-px h-5 bg-white/20` |
| Logotipo | badge `p-1.5 rounded-md bg-lime-500/15 text-brand-accent` + ícone `Building2 h-4 w-4` + nome **`Publications`** (`text-sm font-bold tracking-tight truncate`) |

**Não existe** seletor, texto ou badge de empresa/filial: o sistema tem **escopo único** (docs/02 §2.1) e a
área atual (Pública/Administrativa) é evidente pela rota e pelo layout.

### 2.2 Zona direita: notificações + Account

- **Sino de notificações** (`Bell`): botão `p-1.5 rounded-lg hover:bg-white/5`, ponto `bg-rose-500` quando
  há itens; painel `absolute right-0 top-full mt-1 w-72 bg-brand-primary border border-slate-700 rounded-lg`
  com cabeçalho (contador "n nova(s)"), lista `max-h-64 overflow-y-auto scrollbar-discreta` e ação
  **Limpar tudo** (desabilitada com lista vazia). Clicar em uma notificação a remove (dispensar).
  Abre/fecha o mesmo ciclo do Account: abrir um fecha o outro.
- **Bloco Account** — ver [§3](#3-bloco-account-e-menu-suspenso). Sempre no extremo direito, oposto ao toggle.

## 3. Bloco Account e menu suspenso

**Gatilho**

- Avatar `h-7 w-7 rounded-full overflow-hidden bg-brand-structure` — foto ou iniciais
  (2 primeiras letras do nome, `text-[10px] font-bold text-slate-950`, maiúsculas).
- Nome e perfil em **duas linhas alinhadas à esquerda**: nome `text-xs font-normal`,
  perfil `text-[10px] font-normal`, ambos sem negrito.
- Chevron `h-3.5 w-3.5` rotaciona 180° ao abrir (`transition-transform duration-200`).
- Hover `bg-white/5` · foco `ring-2 ring-brand-focus/50`.

**Menu** — `role="menu"` `aria-label="Menu da conta"`:

```
absolute right-0 top-full mt-1 w-56 bg-brand-primary border border-slate-700
rounded-lg shadow-lg py-1 z-30
```

Itens: `w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-left hover:bg-brand-structure/60 ds-item-hover-dark`
mais `:style="--item-cor"` — no hover o rótulo assume a **cor do item** (mesmo padrão da sidebar,
só que com a variante escura `.ds-item-hover-dark` e fallback `#f8fafc`, nunca slate); ícone
`h-3.5 w-3.5` com **traço 1.5** (`.ds-icon-light` — mesmo peso da sidebar), colorido por
`MenuItem.cor`, divisor `my-1 h-px bg-white/40`. **Meu Perfil** (sem
`cor`) e **Encerrar Sessão** (rótulo já colorido permanentemente) não usam a classe de hover.

Ordem fixa (definida em `config/navigation.ts`):

| # | Item | Ícone | Cor |
|---|---|---|---|
| 1 | Meu Perfil | `User` | — |
| — | *divisor* | | |
| 2 | Configurações Globais | `Settings` | `#50a1ff` |
| 3 | Gestão de Usuários | `Users` | `#b070ef` |
| 4 | Configuração de Perfis (RBAC) | `ShieldCheck` | `#f5b302` |
| 5 | Gestão de Auditoria | `ScrollText` | `#2dd4bf` |
| — | *divisor* | | |
| 6 | Encerrar Sessão | `LogOut` | `#f45f71` (rótulo colorido) |

**Fechamento:** `pointerdown` global fora do bloco e tecla `Escape` (`fecharMenus`).

## 4. Sidebar retrátil

`<aside id="app-sidebar">` — `shrink-0 bg-white border-r border-slate-200 flex flex-col
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

- Cabeçalho da sessão: `text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1`,
  chevron rotaciona 180°, `aria-expanded` — **recolhimento individual**, todas iniciam `aberto: true`.
- Item: `<button>` `flex items-center gap-2.5 rounded-lg px-2.5 py-2 w-full text-left`, ícone `h-4 w-4`
  com **traço 1.5** (`.ds-icon-light` em `main.css` — o traço 2 do Lucide parecia em negrito em 16px;
  com `:style` de `item.cor` quando o item tem cor), rótulo `text-xs font-normal truncate`,
  `aria-label`, `aria-current="page"` quando ativo.
- **Item ativo:** `bg-brand-structure/10 text-lime-700` (derivado do tom estrutural, sem accent sólido);
  o ícone colorido mantém a sua cor. **Inativo:** `text-slate-600 hover:bg-slate-100` +
  `.ds-item-hover` — no hover a opção inteira assume a **cor do próprio item** (`--item-cor` vindo do
  config; item sem `cor` cai no fallback `#0f172a`/slate-900). A classe entra só no ramo inativo, então
  o item ativo não muda com o hover.

### 4.4 Comportamento no rail

- Sem cabeçalhos de sessão; `sessoesVisiveis` mantém apenas sessões **abertas**.
- Divisor entre sessões: `h-px bg-slate-200 mx-1 my-1.5`.
- Cada item é envolto em `<UiTooltip content={label} position="right">` com
  `:disabled="sidebarOpen"` (tooltip só no rail).
- O estado `aberto` de cada sessão **é preservado** ao recolher e reexpandir.

## 5. Árvore de navegação

Definida em [`app/config/navigation.ts`](../app/config/navigation.ts) (fonte única — alterar os dados
muda sidebar, header e vitrine ao mesmo tempo):

```
Painel Executivo                 (item raiz · LayoutDashboard)
PUBLICAÇÕES
├── Manuais                      BookOpen
├── Release Week                 Rocket
└── Escopo de Projetos           ClipboardList
CADASTROS
├── Parceiros                    Handshake
└── Softwares                    Boxes
ADMINISTRAÇÃO
├── Gestão de Usuários           Users
├── Perfis de Acesso (RBAC)      ShieldCheck
├── Auditoria                    ScrollText
└── Configurações Globais        Settings
```

Observações:

- Os três grupos cobrem as três frentes do sistema: **conteúdo publicado** (Área Pública lê Manuais,
  Release Week e Escopo de Projetos), **cadastros de apoio** e **administração/governança**.
- **Cores dos ícones (`SidebarItem.cor`)** — o ícone fica colorido sempre e o hover da opção pinta
  rótulo/ícone com a mesma cor (`.ds-item-hover` + `--item-cor` em
  [`app/assets/css/main.css`](../app/assets/css/main.css)). Cores **cheias**, na mesma
  intensidade do menu suspenso do Account:
  - **Publicações:** Manuais `#f45f71`, Release Week `#1a9e07`, Escopo de Projetos `#50a1ff`
  - **Cadastros:** Parceiros `#047857` (Verde Esmeralda), Softwares `#0364f7` (azul Estrutural)
  - **Administração** (mesmas cores do `accountMenuItens`, mesmo item => mesma cor): Gestão de
    Usuários `#b070ef`, Perfis de Acesso (RBAC) `#f5b302`, Auditoria `#2dd4bf`, Configurações
    Globais `#50a1ff`
  - Sem `cor`: apenas o item raiz **Painel Executivo**. Todas as cores já existem no design
    system ou no menu Account — nenhuma nova foi inventada.
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
hover `.ds-item-hover`.

**Removidos nesta fase:** `empresaAtiva` e o item "Troca de Filial / Empresa" (escopo único, sem
empresas/filiais).

## 7. Estado e persistência

| Estado | Onde vive | Observação |
|---|---|---|
| `sidebarOpen` | `layouts/default.vue` (`ref(true)`) | em memória; **não** persiste entre sessões |
| `sessao.aberto` | `AppSidebar.vue` (cópia de `sessoes`) | individual, preservado ao recolher/reexpandir |
| `itemAtivo` | `AppSidebar.vue` | mock de navegação **sem rotas** (clica e marca) |
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
`accountMenuItens` e `accountEncerrarSessao` de `config/navigation.ts` em vez de manter definição local
dos dados (mantém apenas uma cópia de trabalho para o recolhimento, como o `AppSidebar`), reproduz as
mesmas larguras (`w-52`/`w-[46px]`), os mesmos divisores, o item raiz acima das sessões e o mesmo menu
(`w-56`). Qualquer mudança aqui exige conferir a vitrine — e vice-versa.

## 11. Mudanças desta fase e pendências

**Change OpenSpec `separate-public-admin-areas` (atual):**

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
2. Sem middleware de auth ou RBAC; os itens da sidebar ainda não têm rota própria (item ativo é
   apenas estado visual) — existe apenas a home `/admin`.
3. `Parceiros` e `Softwares` não têm spec de domínio (módulos ainda não construídos).
