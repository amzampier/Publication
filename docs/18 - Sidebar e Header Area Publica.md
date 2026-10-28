# 18 — Sidebar e Header · Área Pública

**Versão:** 1.1.0 · **Data:** 2026-10-28 · **Idioma:** Português do Brasil (pt-BR)
**Status:** Implementado no change `area-publica-shell` — shell visual e leitura pública de
navegação. Páginas de conteúdo, busca e deep links seguem em aberto.
**Escopo:** shell visual da Área Pública — header, sidebar, hierarquia, estados, tema claro/escuro,
responsividade, acessibilidade e tokens.
**Fora de escopo:** páginas de conteúdo, busca server-side, painel de resultados, deep links e a
implementação do conteúdo. O contrato da leitura pública está em
[`19 - API Pública de Navegação.md`](19%20-%20API%20P%C3%BAblica%20de%20Navega%C3%A7%C3%A3o.md).
**Fonte visual:** [`DT01 - Prompt Sidebar Area Publica.md`](DT01%20-%20Prompt%20Sidebar%20Area%20Publica.md)
e a imagem de referência do sidebar (anexo da conversa).
**Documentos relacionados:** [`01 - design_system.md`](01%20-%20design_system.md) ·
[`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) ·
[`app/layouts/default.vue`](../app/layouts/default.vue) ·
[`app/components/layout/AppHeader.vue`](../app/components/layout/AppHeader.vue)
**Autoridade:** este documento é a referência **visual** da Área Pública. A autoridade de
comportamento é a spec `design-system/public-layout` (change `area-publica-shell`), com os deltas de
`design-system/layout-navigation` e `design-system/brand-tokens`.

> Este documento descreve **apenas o shell visual**. Os campos de exibição listados em
> [§5](#5-modelo-de-exibição-mock) servem para a hierarquia visual; o contrato da API está em
> [`19`](19%20-%20API%20P%C3%BAblica%20de%20Navega%C3%A7%C3%A3o.md). Busca, seleção persistente,
> deep links e páginas de conteúdo ficam para documentos próprios. As classes citadas são referência
> de intenção visual; a implementação usa os componentes reais do kit (`Ui*`) e os tokens do design
> system.

---

## Sumário

1. [Papel no shell público](#1-papel-no-shell-público)
2. [Mapa de componentes](#2-mapa-de-componentes)
3. [Header público](#3-header-público)
4. [Sidebar público](#4-sidebar-público)
5. [Modelo de exibição (mock)](#5-modelo-de-exibição-mock)
6. [Tema claro/escuro](#6-tema-claroescuro)
7. [Responsividade](#7-responsividade)
8. [Acessibilidade](#8-acessibilidade)
9. [Tokens e exceção de paleta](#9-tokens-e-exceção-de-paleta)
10. [Processo de criação](#10-processo-de-criação)
11. [Checklist de verificação visual](#11-checklist-de-verificação-visual)
12. [Pendências e governança](#12-pendências-e-governança)

---

## 1. Papel no shell público

Hoje a raiz `/` é apenas um placeholder dentro de `app/layouts/default.vue`, que renderiza
`<slot />` sobre `bg-slate-50`. O shell administrativo (`AppHeader` + `AppSidebar`) vive em
`app/layouts/admin.vue` e vale para `/admin/**`. A Área Pública **não** usa o shell administrativo.

```
HOJE
  /            -> app/layouts/default.vue  -> <slot/> (placeholder)
  /admin/**    -> app/layouts/admin.vue    -> AppHeader + AppSidebar + <main>

ALVO
  /            -> app/layouts/default.vue  -> PublicHeader
                                             + PublicSidebar + <main>
  /admin/**    -> app/layouts/admin.vue    -> AppHeader + AppSidebar + <main>
```

### 1.1 Estrutura do shell

```
<div class="min-h-screen bg-slate-50">
  <PublicHeader />                                  <- h-16 sticky top-0 z-40
  <div class="flex items-start">
    <PublicSidebar />                               <- w-72 sticky top-16
    <main class="flex-1 min-w-0">
      <slot />                                      <- conteúdo público
    </main>
  </div>
</div>
```

Wireframe:

```
+--------------------------------------------------------------------------------+
| [menu] [LOGO] Dicas Teorema          [busca global......] [tema] [Entrar]     | h-16
+----------------------+---------------------------------------------------------+
| + Painel de Destaques|                                                         |
|                      |                                                         |
| v RELEASES WEEK  (4) |                                                         |
|   2026               |                  CONTEÚDO PÚBLICO                       |
|     Setembro         |            (fora do escopo deste documento)             |
|       Semana 39 ...  |                                                         |
| v MANUAIS MENSAIS(7) |                                                         |
| v ESCOPO...      (2) |                                                         |
+----------------------+---------------------------------------------------------+
       w-72 sticky                           flex-1 min-w-0
```

### 1.2 Regras de área

- O header é **branco no tema claro** (`bg-white`), com `border-b border-slate-200`.
- A sidebar é **branca no tema claro**, com `border-r border-slate-200/90`.
- A sidebar **não é retrátil**: não existe rail nem largura `w-[46px]` na Área Pública. Ela é fixa
  em `w-72` no desktop e vira drawer abaixo de `lg` (ver [§7](#7-responsividade)).
- O shell público **não herda** o navy da sidebar administrativa nem o rail; a identidade visual é a
  da imagem/DT01 (indigo, esmeralda e púrpura sobre `slate`), registrada como exceção em
  [§9](#9-tokens-e-exceção-de-paleta).
- O conteúdo principal é livre; este documento não define as páginas de destaque, release, manual,
  escopo ou busca.

---

## 2. Mapa de componentes

Proposta de organização, seguindo o padrão de `app/components/layout/` e o auto-import do Nuxt:

```
app/layouts/default.vue
├── app/components/layout/PublicHeader.vue
│   ├── marca (logo + "Dicas Teorema")             -> inline no header
│   ├── app/components/layout/PublicSearch.vue     -> campo/ícone de busca
│   ├── app/components/layout/PublicThemeToggle.vue
│   └── link "Entrar"                              -> /admin/login
└── app/components/layout/PublicSidebar.vue
    ├── app/components/layout/PublicSidebarSecao.vue
    ├── app/components/layout/PublicSidebarReleases.vue
    ├── app/components/layout/PublicSidebarManuais.vue
    └── app/components/layout/PublicSidebarEscopos.vue
```

Notas:

- `PublicSidebar.vue` é o dono do estado visual de abertura das seções e da seleção ativa; as
  seções recebem os dados e emitem a seleção.
- `PublicSidebarSecao.vue` padroniza o cabeçalho reutilizável (ícone, título, contador, chevron,
  `aria-expanded`/`aria-controls`).
- A marca e o link "Entrar" podem ficar inline no `PublicHeader`; não há necessidade de componentes
  extras para dois elementos.
- Nenhum componente novo deve duplicar `UiInput`, `UiButton`, `UiTooltip` ou `UiBadge`. O shell usa o
  kit real; a sidebar pode usar markup próprio para a árvore, mas os controles devem seguir os
  estados visuais do design system.
- O tema público vive em `app/composables/useTemaPublico.ts` (proposta), sem tocar no estado do
  `/admin`.

---

## 3. Header público

### 3.1 Anatomia

```
+--------------------------------------------------------------------------------+
| [menu] [LOGO] Dicas Teorema          [busca global......] [tema] [Entrar]     |
+--------------------------------------------------------------------------------+
   ^       ^          ^                       ^              ^        ^
   |       |          |                       |              |        |
   |       |          |                       |              |        +-- link /admin/login
   |       |          |                       |              +----------- Lua/Sol
   |       |          |                       +-------------------------- input/ícone
   |       |          +-------------------------------------------------- nome fixo
   |       +------------------------------------------------------------- logo_login_url
   +--------------------------------------------------------------------- só < lg
```

- Container: `h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-40
  bg-white border-b border-slate-200 text-slate-900`.
- O header é **sticky**; a sidebar começa em `top-16` e ocupa `h-[calc(100vh-4rem)]`.
- Não há seletor de empresa/filial. O nome “Dicas Teorema” é fixo e não vem de configuração.

### 3.2 Zona esquerda

| Elemento | Especificação visual |
|---|---|
| Menu mobile | Botão `PanelLeftOpen`/`Menu` com `aria-label="Abrir menu da Área Pública"`, `aria-expanded`, `aria-controls="public-sidebar"`; visível apenas abaixo de `lg`; alvo mínimo 40x40; foco `ring-2 ring-brand-focus/50` |
| Logo | `<img>` com `src` vindo de `logo_login_url` (a mesma logo da tela de login, lida do endpoint público de identidade); `h-8 max-w-[160px] object-contain shrink-0`; `alt="Logomarca Teorema"`; clicável para `/` |
| Fallback | Quando não há logo: badge `p-1.5 rounded-md bg-brand-primary/10 text-brand-primary` com `Building2 h-4 w-4` + texto **“Dicas Teorema”**; nunca exibir “Publications” ao lado do nome público |
| Nome | `text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap`; oculto abaixo de `sm` para preservar a busca e o “Entrar” |
| Agrupamento | Logo + nome com `gap-3`; a marca inteira é um link para `/` com `aria-label="Ir para o início da Área Pública"` |

### 3.3 Zona direita

Ordem fixa, da esquerda para a direita: **busca global -> tema -> Entrar**.

#### Busca global

- Desktop (`>= lg`): input visível com largura `w-64 xl:w-80`; usar `UiInput` (não criar campo
  paralelo) com ícone `Search` à esquerda, placeholder “Pesquisar releases, manuais e chamadas…” e
  `aria-label="Pesquisa global da Área Pública"`.
- Abaixo de `lg`: o input vira um botão de ícone `Search`; ao acionar, abre um painel/overlay com o
  mesmo input, `role="dialog"`, `aria-modal="true"`, foco no campo e fechamento por `Escape`.
- Estados visuais: normal, foco (`brand-focus`), preenchido (botão `X` para limpar), carregando
  (spinner discreto) e sem resultados (estado vazio do painel). O painel de resultados e a busca
  server-side ficam **fora** deste documento.
- O input não deve deslocar o header ao abrir; no mobile, o painel é sobreposto.

#### Tema claro/escuro

- Botão de ícone com alvo mínimo 36x36:
  - tema claro: ícone `Moon`, `aria-label="Ativar tema escuro"`;
  - tema escuro: ícone `Sun`, `aria-label="Ativar tema claro"`.
- `aria-pressed` reflete o estado; hover `bg-slate-100`; foco `ring-2 ring-brand-focus/50`.
- A preferência persiste no navegador, inicia por `prefers-color-scheme` e vale **somente** para a
  Área Pública. O `/admin` não muda (ver [§6](#6-tema-claroescuro)).

#### Entrar

- Link para `/admin/login`, com ícone `LogIn` + rótulo “Entrar” no desktop e apenas o ícone no
  mobile (`aria-label="Entrar na Área Administrativa"`).
- Visual: `inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2
  text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50`.
- No mobile, o rótulo some, mas o nome acessível permanece.

### 3.4 Estados do header

| Estado | Aparência |
|---|---|
| Claro (padrão) | `bg-white`, borda `slate-200`, texto `slate-900` |
| Escuro | `bg-slate-900`, borda `slate-800`, texto `slate-100` |
| Rolagem | O header permanece sticky; a sombra só aparece após rolagem (`shadow-sm`), se desejado |
| Busca focada | Anel/borda `brand-focus`; nenhum outro campo do header recebe foco simultâneo |
| Mobile | Menu, logo, busca em ícone, tema e Entrar em ícone; nome oculto |

---

## 4. Sidebar público

### 4.1 Anatomia e dimensões

```
<aside id="public-sidebar"
  class="w-72 shrink-0 bg-white border-r border-slate-200/90
         sticky top-16 h-[calc(100vh-4rem)] overflow-hidden select-none">
  <div class="flex-1 h-full overflow-y-auto p-4 space-y-6 scrollbar-discreta">
    ...
  </div>
</aside>
```

- Largura fixa `w-72` (18rem / 288px) no desktop.
- Fundo branco no tema claro; `slate-900` no tema escuro.
- `select-none` para não selecionar texto ao arrastar/clicar.
- Rolagem interna com `.scrollbar-discreta` (já existe em `app/assets/css/main.css`).
- Sem rail e sem botão de recolher. A sidebar é sempre expandida no desktop; no mobile vira drawer.
- A ordem dos blocos é fixa: **Home -> Releases Week -> Manuais Mensais -> Escopo de Projetos**.

### 4.2 Bloco 0 — Painel de Destaques & Busca

```
+--------------------------------------+
| [Home] Painel de Destaques & Busca   |
+--------------------------------------+
```

- Botão full width: `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold
  transition-all`.
- **Ativo:** `bg-indigo-600 text-white shadow-sm shadow-indigo-600/30`; `aria-current="page"`.
- **Inativo:** `text-slate-700 hover:bg-slate-100 hover:text-slate-900`.
- Ícone `Home` com `w-4 h-4 shrink-0`.
- Rótulo exato: **“Painel de Destaques & Busca”**.

### 4.3 Cabeçalho de seção (padrão)

```
+--------------------------------------+
| [icon] RELEASES WEEK        (4)  v   |
+--------------------------------------+
```

- Linha: `flex items-center justify-between mb-2 px-1`.
- Gatilho: `flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800`;
  ícone `w-3.5 h-3.5` na cor da seção; chevron `ChevronDown`/`ChevronRight` `w-3.5 h-3.5
  text-slate-400`.
- Contador: `text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded`.
- O gatilho tem `aria-expanded` e `aria-controls`; o conteúdo tem `id` correspondente.
- Seções abertas por padrão. O estado é visual e local; não há deep link neste documento.
- Quando o contador é `0`, a seção continua abrindo e mostra o estado vazio da seção.

### 4.4 Seção 1 — Releases Week

Ícone: `Rocket`, `text-indigo-600`. Contador: quantidade de releases publicadas.

```
v RELEASES WEEK                    (4)
  2026
  |-- Setembro                        3  v
  |   |-- Semana 39  v26.06a       NOVA
  |   |   4 chamadas · Rel: 26.06a10.05a
  |   |-- Semana 38  v26.05b
  |   |   2 chamadas · Rel: 26.05b08.02a
  |   |-- Semana 37  v26.04a
  |       1 chamada  · Rel: 26.04a05.01b
  |-- Agosto                          1  >
```

#### Nível 1 — Ano

- Container com linha guia: `border-l-2 border-slate-200 pl-2 my-1`.
- Botão: `w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-700
  hover:text-indigo-600`.
- Ano em `font-mono`; chevron `w-3 h-3 text-slate-400`.
- Anos em ordem decrescente.

#### Nível 2 — Mês

- Container `pl-2`, botão `w-full flex items-center justify-between py-1 text-[11px] font-medium
  text-slate-600 hover:text-slate-900`.
- Nome do mês com `truncate`; contador `text-[10px] text-slate-400`; chevron `w-2.5 h-2.5`.
- Meses em ordem decrescente dentro do ano.

#### Nível 3 — Card da Release Week

- Botão full width, `text-left px-2 py-1.5 rounded-lg text-xs transition-all flex flex-col`.
- **Ativo:** `bg-indigo-50 text-indigo-900 font-semibold border-l-2 border-indigo-600`.
- **Inativo:** `text-slate-600 hover:bg-slate-50 hover:text-slate-900`.
- Linha 1: `Semana {n}` + chip de versão `font-mono text-[9px] bg-indigo-100 text-indigo-800 px-1
  rounded font-semibold` + selo **“NOVA”** `text-[9px] text-amber-700 font-semibold uppercase`
  quando `destaqueSemana`.
- Linha 2: `{n} chamadas · Rel: {release}` em `text-[10px] text-slate-400 truncate`. Se não houver
  `release`, exibir apenas `{n} chamadas`.
- O clique seleciona a release e a destaca; o conteúdo correspondente fica fora deste documento.
- Estado vazio: “Nenhuma release publicada.” em `text-[11px] text-slate-500 px-2 py-1.5`.

### 4.5 Seção 2 — Manuais Mensais

Ícone: `BookOpen`, `text-emerald-600`. Contador: quantidade de manuais publicados.

```
v MANUAIS MENSAIS                  (7)
  2026  (2 meses)
  |-- [BookOpen] Setembro         (4)
  |-- [BookOpen] Agosto            (2)
  2025  (1 mês)                    >
```

- **Não** aninhar manuais individuais. O terceiro nível não existe; o clique no mês seleciona o mês
  e o conteúdo é exibido na página (fora deste documento).
- Nível 1 (Ano): container `border-l-2 border-emerald-200 pl-2 my-1`; botão com ano em `font-mono` e
  contador `(n meses)` em `text-[10px] text-slate-400 font-normal`; chevron `w-3 h-3`.
- Nível 2 (Mês): cartão `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs
  border transition-all`.
  - **Selecionado:** `bg-emerald-100 text-emerald-950 font-bold border-emerald-400 shadow-sm
    ring-1 ring-emerald-500/30`; ícone `text-emerald-700`; badge `bg-emerald-700 text-white`.
  - **Inativo:** `bg-white hover:bg-emerald-50/70 text-slate-700 border-slate-200/80
    hover:text-slate-900`; ícone `text-emerald-600`; badge `bg-emerald-100 text-emerald-800`.
  - Conteúdo: ícone `BookOpen w-3.5 h-3.5 shrink-0`, nome do mês `truncate font-medium`, contador
    `text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold`.
- Estado vazio: “Nenhum manual publicado.” em `text-[11px] text-slate-500 px-2 py-1.5`.

### 4.6 Seção 3 — Escopo de Projetos

Ícone: `FolderGit2`, `text-purple-600`. Contador: quantidade de escopos publicados.

```
v ESCOPO DE PROJETOS               (2)
+--------------------------------------+
| v [v2026.1] Ano 2026      [Ver Tudo] |
| Escopo de Projeto Anual 2026 - ...   |
| [Monitor] 5 sistemas   4 chamadas    |
+--------------------------------------+
| SISTEMAS CONTEMPLADOS:               |
| [Monitor] ERP Enterprise         (1) |
| [Monitor] PDV Touch              (1) |
| [Monitor] Mobile Força de Vendas (0) |
| [Monitor] WMS Logística          (1) |
| [Monitor] Portal B2B             (1) |
+--------------------------------------+
```

#### Nível 1 — Card do projeto

- Container: `rounded-2xl border transition-all overflow-hidden`.
  - **Ativo:** `border-purple-300 bg-purple-50/20 shadow-sm`.
  - **Inativo:** `border-slate-200/90 bg-white hover:border-slate-300`.
- Área superior `p-2.5`:
  - Linha de cabeçalho: chevron púrpura; chip de versão `font-mono font-bold text-purple-800
    bg-purple-100 px-1.5 py-0.5 rounded text-[10px]`; “Ano {ano}” em `text-[10px] text-slate-500
    font-medium`.
  - Ação **“Ver Tudo”**: `text-[10px] font-semibold text-purple-700 hover:text-purple-900
    bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200`.
  - Nome do projeto: `font-semibold text-slate-800 text-xs line-clamp-1`.
  - Rodapé: `flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]
    text-slate-500`; `Monitor w-3 h-3 text-purple-500` + `{n} sistemas`; `{n} chamadas`.
- O card abre/fecha o nível de sistemas; o chevron gira 180°.

#### Nível 2 — Sistemas contemplados

- Área: `bg-slate-50/80 border-t border-slate-200/90 p-2 space-y-1`.
- Rótulo: **“Sistemas Contemplados:”** em `text-[10px] font-bold text-slate-500 uppercase
  tracking-wider`.
- Item de sistema: botão `w-full flex items-center justify-between p-2 rounded-xl text-xs border
  transition-all`.
  - **Ativo:** `bg-purple-100 text-purple-950 font-bold border-purple-400 shadow-sm
    ring-1 ring-purple-500/30`; ícone `text-purple-700`; badge `bg-purple-600 text-white`.
  - **Inativo:** `bg-white hover:bg-purple-50/70 text-slate-700 border-slate-200/80
    hover:text-slate-900`; ícone `text-purple-500`; badge `bg-slate-100 text-slate-700`.
  - Conteúdo: `Monitor w-3.5 h-3.5 shrink-0`, nome `truncate font-medium`, contador
    `text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold`.
- Estado vazio: “Nenhum escopo publicado.” em `text-[11px] text-slate-500 px-2 py-1.5`.
- “Ver Tudo” é uma ação visual; o destino e o conteúdo ficam fora deste documento.

### 4.7 Estados e comportamento visual

| Estado | Regra |
|---|---|
| Seção aberta/fechada | Controlada pelo cabeçalho; `aria-expanded` reflete; conteúdo desaparece sem animação de altura complexa |
| Home ativo | Pill indigo preenchido; `aria-current="page"` |
| Release ativa | Fundo `indigo-50`, texto `indigo-900`, borda guia `indigo-600` |
| Mês de manual ativo | Fundo `emerald-100`, borda `emerald-400`, badge `emerald-700` |
| Escopo ativo | Borda/fundo púrpura suave; card expandido |
| Sistema ativo | Fundo `purple-100`, borda `purple-400`, badge `purple-600` |
| Hover | Sempre mais claro que o ativo; nunca usar a cor cheia como fundo de hover |
| Contadores | Sempre visíveis no cabeçalho da seção; `0` é permitido |
| “NOVA” | Só quando `destaqueSemana`; texto âmbar, não apenas cor |
| Tema escuro | Superfícies `slate-900/950`; acentos mantêm a família, com contraste ajustado |

---

## 5. Modelo de exibição (mock)

> **Não é contrato de API.** Esta seção lista apenas os campos que a hierarquia visual precisa para
> renderizar a imagem. Os nomes são exemplos; a implementação pode adaptá-los ao modelo real.

### 5.1 Releases Week

| Campo | Uso visual |
|---|---|
| `ano` | Agrupamento de nível 1 |
| `mes` | Agrupamento de nível 2 |
| `semana` | Rótulo “Semana {n}” |
| `versao` | Chip `v{versao}` |
| `release` | Subtítulo “Rel: {release}” |
| `chamadas` | Contagem no subtítulo |
| `destaqueSemana` | Selo “NOVA” |
| `id` | Seleção ativa |

Exemplo da imagem: 2026 -> Setembro -> Semana 39 `v26.06a`, 4 chamadas, `Rel: 26.06a10.05a`,
`NOVA`; Semana 38 `v26.05b`, 2 chamadas; Semana 37 `v26.04a`, 1 chamada; Agosto com 1 release.

### 5.2 Manuais Mensais

| Campo | Uso visual |
|---|---|
| `ano` | Agrupamento de nível 1 |
| `mes` | Nome do mês no cartão |
| `manuais` | Contador do mês e do ano |
| `id` | Seleção do mês |

Exemplo da imagem: 2026 com 2 meses (Setembro 4, Agosto 2); 2025 com 1 mês.

### 5.3 Escopo de Projetos

| Campo | Uso visual |
|---|---|
| `versao` | Chip `v{versao}` |
| `ano` | “Ano {ano}” |
| `nome` | Nome do projeto |
| `sistemas` | Lista de sistemas contemplados |
| `sistemas[].nome` | Nome do sistema |
| `sistemas[].chamadas` | Contador do sistema |
| `chamadas` | Total de chamadas do projeto |
| `id` | Seleção ativa |

Exemplo da imagem: `v2026.1`, Ano 2026, “Escopo de Projeto Anual 2026 - ...”, 5 sistemas e 4
chamadas; sistemas ERP Enterprise (1), PDV Touch (1), Mobile Força de Vendas (0), WMS Logística (1)
e Portal B2B (1).

### 5.4 Regras de exibição

- Contadores usam `font-mono` e `tabular-nums` quando numéricos.
- Nomes longos usam `truncate`/`line-clamp-1`; nunca quebram a largura `w-72`.
- “chamadas” é o termo visual adotado; o DT01 alterna “itens” no código, mas a imagem e o domínio
  público falam “chamadas”.
- O termo “NOVA” é maiúsculo e só aparece no card da release em destaque.
- O nome “Dicas Teorema” é fixo; a logo é a única parte configurável.

---

## 6. Tema claro/escuro

### 6.1 Comportamento

- O botão do header alterna **somente a Área Pública**. O `/admin` permanece no tema atual.
- Preferência inicial: `prefers-color-scheme`; depois, a escolha persistida no navegador.
- A troca não recarrega a página e não pode piscar o tema claro no primeiro paint (o tema deve ser
  resolvido antes da hidratação, por script inline ou cookie — decisão de implementação).
- O estado é anunciado por `aria-pressed` e por rótulo dinâmico (“Ativar tema escuro”/“Ativar tema
  claro”).
- Respeitar `prefers-reduced-motion`: transições de cor de 150 ms podem ser reduzidas/removidas.
- `ESC-TEMAS` continua como fase própria no `/design`; este documento define apenas o
  comportamento visual do shell público.

### 6.2 Tokens do tema claro

| Superfície | Token visual |
|---|---|
| Página | `bg-slate-50` |
| Texto principal | `text-slate-900` |
| Texto secundário | `text-slate-500` |
| Texto discreto | `text-slate-400` |
| Header | `bg-white border-b border-slate-200` |
| Sidebar | `bg-white border-r border-slate-200/90` |
| Cards e dropdowns | `bg-white border-slate-200` |
| Hover neutro | `bg-slate-100` |
| Divisórias | `border-slate-200` / `border-slate-100` |

### 6.3 Tokens do tema escuro

| Superfície | Token visual |
|---|---|
| Página | `bg-slate-950` |
| Texto principal | `text-slate-100` |
| Texto secundário | `text-slate-400` |
| Texto discreto | `text-slate-500` |
| Header | `bg-slate-900 border-b border-slate-800` |
| Sidebar | `bg-slate-900 border-r border-slate-800` |
| Cards e dropdowns | `bg-slate-900 border-slate-700` |
| Hover neutro | `bg-slate-800` |
| Divisórias | `border-slate-800` / `border-slate-700` |
| Acentos | `indigo-400`, `emerald-400`, `purple-400`, `amber-400` para texto/ícones; fundos de seleção com `/{15}` ou `/{20}` |

### 6.4 Regras de contraste

- O header branco é obrigatório **no tema claro**; no escuro ele passa a `slate-900`.
- Nunca usar `#4ed813` puro como texto sobre branco; no shell público, o verde de foco continua
  `brand-focus #1a9e07`.
- “NOVA” em `amber-700` no claro e `amber-400` no escuro, sempre com o texto visível.
- Badges selecionados usam fundo escuro + texto branco (ex.: `emerald-700`/`purple-600`).
- O tema escuro não pode reduzir a legibilidade de contadores e chips; validar com contraste
  mínimo 4.5:1 para texto pequeno.

---

## 7. Responsividade

| Viewport | Header | Sidebar | Conteúdo |
|---|---|---|---|
| `>= 1024px` (`lg`) | Completo: logo + nome + busca + tema + Entrar | `w-72` estática, `sticky top-16` | `flex-1 min-w-0`, sem overflow horizontal |
| `768px`–`1023px` | Menu + logo + busca em ícone + tema + Entrar em ícone | Drawer fechado por padrão | Largura total |
| `< 768px` | Menu + logo + busca em ícone + tema + Entrar em ícone | Drawer fechado; `w-72` sobreposto | Largura total |

### 7.1 Drawer abaixo de `lg`

- Sidebar: `fixed left-0 top-16 bottom-0 z-30 w-72 bg-white border-r border-slate-200/90`, com
  backdrop `fixed inset-0 z-20 bg-slate-900/40`.
- `role="dialog"`, `aria-modal="true"`, nome acessível “Navegação da Área Pública”.
- Fechar por `Escape`, clique no backdrop e botão de fechar; devolver o foco ao gatilho.
- Foco preso dentro do drawer enquanto aberto; a navegação por teclado não escapa para o conteúdo.
- O `main` permanece em largura total; a sidebar não empurra o conteúdo.
- Estados de abertura/fechamento não podem criar overflow horizontal em nenhuma largura.

### 7.2 Regras de conteúdo

- O header nunca quebra em duas linhas; o nome “Dicas Teorema” some abaixo de `sm`.
- O input de busca não encolhe abaixo de um mínimo legível; abaixo de `lg` ele vira ícone.
- A sidebar tem rolagem interna; a página não deve ter duas barras verticais concorrentes no
  desktop.
- Em impressão, header e sidebar podem ser ocultados (`.no-print`/`@media print`), seguindo o
  padrão do doc 01 §3.4.

---

## 8. Acessibilidade

### 8.1 Estrutura e nomes

- `<header>` com `role="banner"` implícito; `<aside id="public-sidebar">` com
  `aria-label="Navegação da Área Pública"`.
- O botão de menu mobile tem `aria-expanded` e `aria-controls="public-sidebar"`.
- Cada seção tem gatilho com `aria-expanded` e `aria-controls`; o conteúdo tem `id`.
- O item ativo da sidebar usa `aria-current="page"`; o sistema selecionado usa
  `aria-current="true"`.
- A busca tem rótulo acessível (`aria-label`) e `type="search"`; o botão de limpar tem
  `aria-label="Limpar pesquisa"`.
- O tema tem `aria-pressed` e rótulo dinâmico.
- “Entrar” tem nome acessível mesmo quando o rótulo visual está oculto no mobile.

### 8.2 Teclado

- Ordem de tabulação: header (menu -> marca -> busca -> tema -> Entrar) e depois sidebar
  (Home -> seções -> itens).
- `Enter`/`Space` acionam botões; setas podem navegar na árvore da sidebar (`role="tree"` /
  `treeitem` ou lista de botões com roving tabindex). `Home`/`End` vão aos extremos.
- `Escape` fecha o drawer e o painel de busca mobile.
- Foco visível sempre `ring-2 ring-brand-focus/50`; nunca remover outline sem substituto.
- Alvos de toque mínimos: 36x36 no desktop e 44x44 no mobile.

### 8.3 Cor e conteúdo

- “NOVA” não depende só de cor: o texto está presente.
- Contadores têm contexto (“4 chamadas”, “2 meses”, “1 sistema”) ou `aria-label` equivalente.
- Não usar `#4ed813` como texto sobre branco; usar `#1a9e07`/`#0f7a06`.
- Erros usam `rose-700`; o shell não introduz vermelho próprio.
- Ícones decorativos recebem `aria-hidden="true"`.

---

## 9. Tokens e exceção de paleta

### 9.1 Paleta editorial da Área Pública

A Área Pública adota a paleta da imagem/DT01 como **identidade editorial própria**, distinta do
navy administrativo. Isso é uma exceção deliberada e deve ser registrada em
`docs/01 - design_system.md` §2.1 quando a implementação começar.

| Token visual | Valor | Uso |
|---|---|---|
| `publico-primary` | `indigo-600` `#4f46e5` | Pill “Painel de Destaques & Busca”, ícone de Releases Week |
| `publico-primary-hover` | `indigo-700` `#4338ca` | Hover de ações primárias |
| `publico-primary-soft` | `indigo-50` `#eef2ff` | Fundo do card de release ativo |
| `publico-primary-chip` | `indigo-100` `#e0e7ff` | Chip de versão |
| `publico-primary-ink` | `indigo-800` `#3730a3` | Texto do chip de versão |
| `publico-primary-active-ink` | `indigo-900` `#312e81` | Texto do card ativo |
| `publico-manuais` | `emerald-600` `#059669` | Ícone de Manuais Mensais |
| `publico-manuais-strong` | `emerald-700` `#047857` | Badge do mês selecionado |
| `publico-manuais-soft` | `emerald-50` `#ecfdf5` | Hover do mês |
| `publico-manuais-selected` | `emerald-100` `#d1fae5` | Fundo do mês selecionado |
| `publico-manuais-ink` | `emerald-950` `#022c22` | Texto do mês selecionado |
| `publico-manuais-border` | `emerald-400` `#34d399` | Borda do mês selecionado |
| `publico-escopos` | `purple-600` `#9333ea` | Ícone de Escopo de Projetos |
| `publico-escopos-soft` | `purple-50` `#faf5ff` | Hover/ação “Ver Tudo” |
| `publico-escopos-selected` | `purple-100` `#f3e8ff` | Fundo do sistema ativo |
| `publico-escopos-ink` | `purple-950` `#3b0764` | Texto do sistema ativo |
| `publico-escopos-border` | `purple-400` `#c084fc` | Borda do sistema ativo |
| `publico-alerta` | `amber-700` `#b45309` | Texto “NOVA” no claro |
| `publico-alerta-escuro` | `amber-400` `#fbbf24` | Texto “NOVA” no escuro |
| Neutros | `slate-50` a `slate-950` | Superfícies, bordas, textos e contadores |
| Foco | `brand-focus` `#1a9e07` | Anéis de foco de todos os controles |
| Erro | `rose-700` `#be123c` | Erros/validações do shell, se existirem |

### 9.2 Regras

- **Não** usar `lime-500` para foco; o foco canônico continua `#1a9e07`.
- **Não** usar degradê no shell público. O degradê permanece restrito ao `UiButton primary`, ao
  header de modal, à trilha do `UiSlider`/`UiLoading` e ao card de resumo do Meu Perfil, conforme o
  doc 01.
- **Não** criar botão/campo/tooltip paralelos. O shell usa `UiInput`, `UiButton`, `UiTooltip` e
  `UiBadge` quando aplicável.
- Ícones: `@lucide/vue` (não `lucide-vue-next`).
- O DT01 usa `shadow-xs` e `py-0.2`; neste repo, usar `shadow-sm` e `py-0.5` (classes válidas do
  Tailwind em uso).
- A exceção de paleta vale **somente** para a Área Pública; a Área Administrativa continua
  navy/verde.

---

## 10. Processo de criação

O shell será construído em fases visuais, sem antecipar API, busca ou páginas de conteúdo.

| Fase | Entrega visual | Critério de saída |
|---|---|---|
| 0. Congelar decisões | Este documento + registro de decisões | Paleta, header, escopo e fallback aprovados |
| 1. Tokens e layout | Tokens da paleta pública + `default.vue` com header/sidebar vazios | Header branco `h-16`, sidebar `w-72`, sem overflow |
| 2. Header | Marca, busca (visual), tema (visual) e “Entrar” | Zonas alinhadas, fallback da logo funcionando, mobile em ícones |
| 3. Sidebar: base | Home + cabeçalhos das 3 seções + contadores | Estados aberto/fechado e `aria-expanded` corretos |
| 4. Releases Week | Ano -> mês -> card, chip de versão, “NOVA”, subtítulo | Hierarquia e estados ativo/hover da imagem |
| 5. Manuais Mensais | Ano -> mês, sem terceiro nível, mês selecionado | Cartões verdes e contadores |
| 6. Escopo de Projetos | Card do projeto + “Ver Tudo” + sistemas | Card púrpura e contadores por sistema |
| 7. Tema | Tokens escuros do shell público | Alternância sem vazar para `/admin` e sem flash |
| 8. Responsividade | Drawer + versões compactas do header | 1440/1024/768/390 sem overflow |
| 9. Acessibilidade e QA | Foco, teclado, contraste, estados vazios | Checklist da §11 completo |

### 10.1 Registro de decisões

| Data | Decisão |
|---|---|
| 2026-10-28 | Adotar a paleta da imagem/DT01 na Área Pública, como exceção editorial documentada |
| 2026-10-28 | Tema claro/escuro funcional apenas na Área Pública; `/admin` intocado |
| 2026-10-28 | Header: logo + “Dicas Teorema” à esquerda; busca, tema e “Entrar” à direita |
| 2026-10-28 | Documento restrito ao shell visual; API, deep links e páginas de conteúdo fora |
| 2026-10-28 | Sem logo configurada, usar o wordmark “Dicas Teorema” com badge `Building2` |
| 2026-10-28 | Sidebar fixa `w-72` no desktop; sem rail; drawer abaixo de `lg` |

### 10.2 Dependências

- `logo_login_url` precisa continuar disponível sem sessão (hoje via
  `GET /api/configuracoes/identidade`).
- Dados de exibição (releases, manuais, escopos e sistemas) precisam existir para a sidebar deixar
  de ser mock; o contrato fica para outro documento.
- A implementação do shell exige um change OpenSpec, porque a spec atual da Área Pública diz que
  ela é renderizada sem sidebar (ver §12).
- A vitrine `/design` deve ganhar uma seção do shell público quando o componente existir, seguindo
  a regra do doc 01 de que todo componente novo é documentado na vitrine.

---

## 11. Checklist de verificação visual

### 11.1 Viewports

- [ ] `1440x900` — sidebar `w-72` fixa, header completo, conteúdo sem overflow.
- [ ] `1280x800` — header completo; busca não comprime o nome.
- [ ] `1024x768` — limite do desktop; sidebar ainda estática.
- [ ] `768x1024` — drawer fechado; header compacto.
- [ ] `390x844` — drawer, busca em ícone, “Entrar” em ícone, sem overflow horizontal.

### 11.2 Estados

- [ ] Header branco no tema claro; `slate-900` no escuro.
- [ ] Logo da tela de login repetida no header.
- [ ] Fallback “Dicas Teorema” com `Building2` quando não há logo.
- [ ] Busca: normal, foco, preenchida, limpar, mobile.
- [ ] Tema: Lua no claro, Sol no escuro, preferência persistida.
- [ ] Home ativo em indigo; releases em indigo; manuais em esmeralda; escopos em púrpura.
- [ ] Todas as seções abrem/fecham; contadores aparecem.
- [ ] “NOVA” só na release em destaque.
- [ ] Mês de manual selecionado e sistema de escopo selecionado.
- [ ] Estados vazios de cada seção.
- [ ] Nomes longos truncados sem quebrar `w-72`.

### 11.3 Acessibilidade e teclado

- [ ] `Tab` percorre header e sidebar na ordem esperada.
- [ ] `Enter`/`Space` acionam os botões.
- [ ] `Escape` fecha drawer/painel de busca e devolve o foco.
- [ ] Foco visível em todos os controles (`brand-focus`).
- [ ] `aria-expanded`, `aria-controls`, `aria-current` e `aria-pressed` corretos.
- [ ] Contraste de texto pequeno >= 4.5:1; “NOVA” legível.
- [ ] Nenhuma informação depende só de cor.

### 11.4 Gates futuros (quando implementar)

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Conferência manual em `/` e em `/design` (nova seção do shell público).

---

## 12. Pendências e governança

### 12.1 Conflito com a spec atual

A spec `openspec/specs/design-system/layout-navigation/spec.md` hoje determina que a Área Pública é
renderizada “como conteúdo sobre o fundo App Canvas, **sem header administrativo, sidebar ou
rail**”. O shell público com header e sidebar é uma mudança deliberada de comportamento. Antes de
implementar:

1. criar um change OpenSpec (sugestão de nome: `area-publica-shell`) via `/opsx-propose`;
2. atualizar a requirement de layout da Área Pública para prever o shell público;
3. manter a Área Administrativa com o shell atual, sem regressão.

Este documento **não** substitui a spec; ele é a referência visual.

### 12.2 Documentos a atualizar na implementação

| Documento | Atualização |
|---|---|
| `docs/01 - design_system.md` §2.1 | Registrar a paleta editorial da Área Pública como exceção |
| `docs/01 - design_system.md` §3 | Descrever o shell público (header branco + sidebar branca) |
| `docs/03 - Header e Sidebar.md` §1 | Deixar de dizer que `default.vue` é “conteúdo puro sem header/sidebar” |
| `app/pages/design.vue` | Nova seção com o shell público (quando implementado) |
| Specs OpenSpec | Nova capability/requirement do shell público |

### 12.3 Fora deste documento

A leitura pública implementada está em
[`19 - API Pública de Navegação.md`](19%20-%20API%20P%C3%BAblica%20de%20Navega%C3%A7%C3%A3o.md).
Continuam fora deste documento:

- Busca global server-side e painel de resultados.
- Deep links (`?release=`, `?manual=`, `?escopo=&sistema=`).
- Páginas de destaques, release, mês de manual, escopo/sistema e resultados de busca.
- Testes automatizados de UI do shell (a leitura, o agrupamento e o tema têm testes puros).

### 12.4 Próximo passo

O shell e a leitura pública foram implementados no change `area-publica-shell`. As próximas
entregas são as páginas de conteúdo (destaques, release, mês de manual, escopo/sistema), a busca
global e os deep links.

---

## Referências

- [`DT01 - Prompt Sidebar Area Publica.md`](DT01%20-%20Prompt%20Sidebar%20Area%20Publica.md) — prompt e
  código de referência visual.
- [`01 - design_system.md`](01%20-%20design_system.md) — tokens, tipografia, foco e layout.
- [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) — shell administrativo de referência.
- [`app/layouts/default.vue`](../app/layouts/default.vue) — layout atual da Área Pública.
- [`app/components/layout/AppHeader.vue`](../app/components/layout/AppHeader.vue) — padrão de header,
  logo e acessibilidade.
- `openspec/specs/design-system/layout-navigation/spec.md` — requisitos atuais de layout.
- [`app/assets/css/main.css`](../app/assets/css/main.css) — `.scrollbar-discreta`, foco e utilitários.
