# 05 — Gestão de Auditoria · Área Administrativa

**Versão:** 1.0.0 · **Data:** 2026-10-02 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela de Gestão de Auditoria — consulta dos registros de operações (fase 1 em memória)
com KPIs, filtros em modal, tabela, detalhe do registro e exportação CSV/PDF
**Arquivos-fonte:** [`app/pages/admin/auditoria.vue`](../app/pages/admin/auditoria.vue) ·
[`app/components/auditoria/`](../app/components/auditoria) ·
[`app/components/ui/DataTable.vue`](../app/components/ui/DataTable.vue) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — seção **13. DataTable** (busca + botão Filtros)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) §5.11 ·
**Autoridade de comportamento:** specs da change `openspec/changes/gestao-auditoria`
(`auditoria`, `design-system/data-table`, delta `configuracoes-globais`)

> Este documento é a referência da tela `/admin/auditoria` e de tudo o que foi criado para ela:
> componentes de domínio, a evolução da toolbar do `UiDataTable`, navegação e specs. Toda
> alteração aqui deve atualizar também `01 - design_system.md` (§5.11) e a seção 13 do `/design`.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (criados/alterados)](#4-componentes-de-kit-criadosalterados)
5. [Comportamento: filtros, busca e exportação](#5-comportamento-filtros-busca-e-exportação)
6. [Dados de demonstração (fase 1)](#6-dados-de-demonstração-fase-1)
7. [Navegação até a tela](#7-navegação-até-a-tela)
8. [Estilo e CSS dedicado](#8-estilo-e-css-dedicado)
9. [Vitrine `/design` §13](#9-vitrine-design-§13)
10. [Especificações OpenSpec](#10-especificações-openspec)
11. [Verificação](#11-verificação)
12. [Pendências e próximos passos](#12-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A Gestão de Auditoria é a tela de consulta da trilha de operações da Área Administrativa:

- **Rota:** `/admin/auditoria` → `app/pages/admin/auditoria.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`
  (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Modelo de registro:** conforme o `registrarAuditoria` do
  [`02 - Guia de Arquitetura e Migrations.md`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md) §3.6 —
  data/hora, usuário (id + nome), ação, recurso, detalhes e IP.
- **Fase 1:** tudo em memória — sem `server/`, sem chamadas de rede; a recarga restaura a base
  de demonstração (sem persistência de filtros entre sessões, mas `useState` preserva o estado
  durante a navegação do ciclo).

## 2. Estrutura da página (componentização)

A página é fina: só estado de coordenação (modal de filtros, registro em detalhe) e composição.
Cada parte é um componente em `app/components/auditoria/` (auto-import com prefixo `Auditoria*`):

```
admin/auditoria.vue                    (filtrosAbertos, detalheAberto, registroDetalhe)
├── <AuditoriaCabecalho />             ← título + menu "Exportar" (CSV / Download em PDF)
├── <AuditoriaKpis class="mt-6" />     ← 4 UiKpi do conjunto FILTRADO
├── <AuditoriaTabela class="mt-5"
│      @open-filters="filtrosAbertos = true"
│      @open-details="abrirDetalhe" /> ← UiDataTable (busca + Filtros + badges + ações)
├── <AuditoriaFiltros v-model="filtrosAbertos" />   ← UiModal com datas + selects
├── <AuditoriaDetalhe v-model="detalheAberto"
│      :registro="registroDetalhe" />  ← UiModal de detalhe do registro
└── <footer>                           ← nota de retenção + link p/ Configurações Globais
```

- **Sem botão "Salvar":** a página é de consulta (não altera estado persistido); o `Cabecalho`
  só oferece o menu Exportar — o botão **Filtros** vive na toolbar da tabela (decisão 13 do
  `design.md` da change), evitando duplicidade e seguindo o padrão herdados pelas próximas
  páginas de listagem.
- **Largura:** o conteúdo vive num container `mx-auto max-w-7xl` dentro do padding
  `p-4 sm:p-6 lg:p-8` (ampliado de `max-w-6xl` para dar folga à grid e evitar rolagem
  horizontal — ver §3.4).
- **Fluxo dos eventos:** `AuditoriaTabela` emite `open-filters` (vem do `UiDataTable`) e
  `open-details` (clique no olho da coluna Ações); a página coordena os dois `UiModal`.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<AuditoriaCabecalho>`

- Cabeçalho sem container (padrão `ConfiguracoesCabecalho`): tile `bg-brand-primary` com
  `ScrollText` em `#2dd4bf` (cor do item de navegação), título "Gestão de Auditoria" e subtítulo.
- **Menu "Exportar"** (`UiButton` outline + `ChevronDown`, `aria-haspopup="menu"` +
  `aria-expanded`): mini-menu `role="menu"` "Opções de exportação" com **Exportar em CSV** e
  **Download em PDF** — itens em `text-xs font-light text-slate-700` (`px-3 py-2`), **idênticos
  em fonte, tamanho e peso aos do menu suspenso da conta** do `AppHeader` (Plus Jakarta Sans
  herdada do `body`); fecha por `Escape` e por clique fora (mesma mecânica do menu da conta;
  markup de domínio, **não** é componente de kit).
- **Exportar em CSV:** monta o CSV dos `registrosFiltrados` com `Blob` + **BOM UTF-8**
  (`'\uFEFF'`), cabeçalho escapado e linhas entre aspas separadas por `;`, baixado como
  `auditoria.csv`.
- **Download em PDF:** chama `gerarPdfAuditoria` (`./gerarPdfAuditoria.ts`) com
  `registrosFiltrados`, os rótulos dos filtros vigentes e o preview da **logo de login**
  (composable `app/composables/useLogomarcaLogin.ts` — estado compartilhado com Configurações,
  espelho do `useLogomarcaHeader`; o bloco da logo de login em `AbaLogomarcas` passou a usá-lo).
  O gerador monta o `auditoria.pdf` em **A4 paisagem** com `jspdf` + `jspdf-autotable`:
  cabeçalho com a logo à esquerda (rasterizada via canvas — sem logo ou caminho sem arquivo →
  só o título), título "Relatório de Gestão de Auditoria" + "Gerado em …", filtros vigentes,
  linha divisória navy, colunas com o cabeçalho repetido a cada página, rodapé "Página X de Y" e
  `save('auditoria.pdf')` — **`window.print()` não é mais usado nesta tela**.

### 3.2 `Kpis.vue` → `<AuditoriaKpis>`

4 `UiKpi` em `grid sm:grid-cols-2 lg:grid-cols-4`, todos derivados do conjunto **filtrado**:

| KPI | Valor |
| :--- | :--- |
| Registros | contagem de `registrosFiltrados` |
| Período | intervalo de datas vigente em `dd/mm` (ex.: "01/10 – 02/10"); sem datas, "Tudo" |
| Usuários distintos | `Set` de nomes do conjunto filtrado |
| Última atividade | `data/hora` do registro mais recente (`DD/MM/AAAA HH:mm`), `—` se vazio |

### 3.3 `Filtros.vue` → `<AuditoriaFiltros>`

- `UiModal` `size="sm"` ("Filtros de Auditoria") **com `:icon` (`Funnel`)** — o cabeçalho tem
  ícone + separador + título/subtítulo, igual aos demais `UiModal` do kit.
- **Corpo em três sessões `UiModalSection`** sobre o fundo cinza do modal: **"Período"**
  (`CalendarDays`) com os dois `UiDatePicker`, **"Usuário"** (`User`) com um `UiSelect` e
  **"Ação e Recurso"** (`Tags`) com dois `UiSelect`, espaçadas pelo grid nativo da sessão
  (sem wrapper manual de espaçamento).
- **Cinco campos:** `UiDatePicker` **Data Inicial** e **Data Final** (sessão "Período";
  `grid sm:grid-cols-2`, valor `Date` do componente; estado gravado como `yyyy-mm-dd` e filtrado
  por dia local, inclusivo) e os filtros **Usuário**, **Ação** e **Recurso** como **`UiSelect`
  de seleção única** — sessão "Usuário" com um select **sem `label`** (o título da sessão
  identifica o campo, evitando repetição; placeholder "Todos os usuários") e sessão "Ação e
  Recurso" com labels **"Ação"**/"**Recurso**" (placeholders "Todas as ações"/"Todos os
  recursos"). O estado vazio (`''`) equivale a "todos" — o placeholder exibe "Todos/Todas" e o
  `X` do select (`clearable`) devolve o filtro a "todos"; o dropdown do `UiSelect` mede o corpo
  rolável do modal e **abre para cima** quando não há espaço abaixo (auto-inversão do kit), sem
  criar scrollbar no corpo.
- **Rascunho local:** o modal edita uma cópia dos filtros; **Aplicar** grava no composable e
  fecha; **Cancelar** fecha **sem** aplicar (próxima abertura ressincroniza com o vigente);
  **Limpar Filtros** zera composable + rascunho (modal permanece aberto).
- **`Escape` com precedência para o popup:** com o dropdown de um `UiSelect` (ou o calendário
  de um `UiDatePicker`) aberto, o `Escape` fecha apenas o popup e preserva o rascunho — o
  modal fecha no `Escape` seguinte, quando não há popup aberto (consumo no componente via
  `stopPropagation`; ver `docs/01` §4.81/§5.11).
- **Rodapé:** "Limpar Filtros" à esquerda; "Cancelar" (outline) + "Aplicar" (primary) à direita.

### 3.4 `Tabela.vue` → `<AuditoriaTabela>`

- `UiDataTable` com `title="Registros de Auditoria"`, `show-header-top` (busca) e
  `show-filters` + `:filters-count="filtrosAtivosCount"` + `@open-filters` (repassa o evento do
  kit para a página).
- Colunas: Data / Hora (formato pt-BR), Usuário, Ação, Recurso, Detalhes e IP — dados já em
  ordem decrescente (decisão 9).
- **Sem rolagem horizontal nas larguras usuais:** `minWidth` das colunas 130/160/120/140/220/120
  (soma 890px; com a coluna Ações `w-20` o chão da tabela é 970px) combinado ao container
  `max-w-7xl` da página (§2) — as sete colunas cabem sem barra horizontal mesmo quando a
  scrollbar vertical do `main` aparece ao aumentar "Linhas por página" (~15px que antes
  estouravam o chão de 1060px); abaixo de ~1280px de janela a rolagem horizontal permanece
  como fallback. Os `minWidth` só grampeiam o piso — em telas normais a tabela continua
  `w-full` e distribui a largura extra.
- **Ação em `UiBadge`** via slot `cell(acao)`: Inclusão → `done`, Alteração → `inReview`,
  Exclusão → `blocked` (dot pulsante — gotcha conhecida, aceita) e Homologação → `reconciled`.
- **Coluna Ações:** slot `#actions` com `UiTooltip` "Ver detalhes" + botão `Eye` (padrão da aba
  Segurança) → emite `open-details` com o registro.

### 3.5 `Detalhe.vue` → `<AuditoriaDetalhe>`

`UiModal` `size="sm"` ("Detalhe do Registro") **com `:icon` (`Eye`)** no cabeçalho — ícone +
separador + título/subtítulo, igual aos demais `UiModal` do kit — com o corpo dentro de uma
sessão **`UiModalSection` "Dados do Registro"** (`:icon="Eye"`; o `v-if` do registro vive na
sessão, evitando card vazio) contendo um `dl` de duas colunas:
Data/Hora (`mono`), Usuário, Ação (badge), Recurso, IP (`mono`) e Detalhes; rodapé com
"Fechar" como **botão primário** (X/Escape também fecham, pelo `UiModal`).

### 3.6 `useAuditoriaDemo.ts` — composable de estado

- `useState('auditoria-filtros')` com `{ periodo, usuario, acao, recurso }` — sobrevive à
  navegação no mesmo ciclo.
- `REGISTROS`: ~25 registros gerados relativos a "hoje" (`dataAtras(dias, horas)`), ordenados
  decrescentes; `registrosFiltrados` (computed), `filtrosAtivosCount`, `periodoRotulo`,
  `opcoesUsuarios`/`opcoesRecursos`, `limparFiltros` e helpers `formatarDataHora`,
  `VARIANTE_POR_ACAO`, `PERIODO_OPCOES`, `ACOES`.
- Arquivo em `components/auditoria/` (não é auto-importado): consumidores importam
  explicitamente de `./useAuditoriaDemo` (ou `../../components/auditoria/useAuditoriaDemo`
  na página).

## 4. Componentes de kit (criados/alterados)

**Nenhum componente novo de kit.** Apenas o `UiDataTable` foi evoluído (task 2 da change):

- **Busca → `UiInput`:** o `<input>` hand-rolled da toolbar virou o controle do kit (`leftIcon`
  lupa, limpar via `rightIcon` + `rightIconClick`, `v-model="searchQuery"`), com foco
  `brand-focus` recortado (`.ds-bottom-clip`); placeholder, busca case-insensitive e estado
  vazio inalterados.
- **Botão Filtros (opt-in):** props `showFilters` (default `false`) e `filtersCount` (badge com
  a quantidade quando > 0) + emit `open-filters`; `UiButton` outline à direita da busca. Sem
  `showFilters` a toolbar **não muda** (nenhum consumidor existente ativa por padrão).
- **`docs/01` §5.11** atualizado: props novas, linha de emits (`open-filters`), bullet da busca
  e do botão, exemplo com `show-filters`/`:filters-count`/`@open-filters`.

## 5. Comportamento: filtros, busca e exportação

- **Duas superfícies complementares:** a **busca** da `UiDataTable` é texto livre instantâneo
  (foco na digitação, limpar restaura); os **filtros** são estruturais (intervalo de datas +
  selects de usuário/ação/recurso), aplicados pelo modal com **Limpar Filtros / Cancelar /
  Aplicar** e refletidos no badge do botão (`filtersCount` — até 5: data inicial, data final,
  usuário, ação e recurso).
- **KPIs recalculam** a cada mudança de filtro (spec `auditoria`: "Registros" é a contagem do
  filtrado — não da base inteira).
- **Exportação** opera sempre sobre os registros filtrados; o PDF é um **arquivo de relatório
  baixado** (`auditoria.pdf`, folha paisagem) — não é o diálogo de impressão do navegador.
- **Rodapé:** "Registros sujeitos à política de retenção de logs de auditoria — ajustar em
  Configurações Globais" (link para `/admin/configuracoes-globais`).

## 6. Dados de demonstração (fase 1)

- Base de 25 registros: 4 usuários (Ana Carolina Ribeiro, Rafael Souza, Mariana Lopes,
  Carlos Mendes), 6 recursos (Publicações, Usuários, Perfis de Acesso, Configurações Globais,
  Logomarcas, Rate Limits), as 4 ações e 5 IPs distintos, espalhados nos últimos 30 dias.
- **Nenhuma persistência:** recarregar restaura a base; os filtros vivem em `useState` (perdem-se
  ao fechar a aba/sessão).
- **Nomenclatura canônica:** o nome da tabela é **`auditoria`** (a query da aba de Retenção em
  Configurações e a citação do `docs/04` foram corrigidas de `logs_auditoria` nesta change).

## 7. Navegação até a tela

- **Sidebar:** sessão "Administração" → item "Gestão de Auditoria" com `to: '/admin/auditoria'` (rótulo unificado com a página e o menu da conta)
  (`app/config/navigation.ts`) — fica ativo na rota (spec `layout-navigation`).
- **Menu da conta:** item "Gestão de Auditoria" com o mesmo `to`.
- Os demais itens sem rota (Gestão de Usuários, RBAC, Painel Executivo) permanecem como estão
  (MEL-03 do RL01).

## 8. Estilo e CSS dedicado

- **Nenhum CSS dedicado novo** — só tokens e utilitários do DS (`bg-brand-primary`,
  `text-[#2dd4bf]`, `brand-focus`, `mono`/`tabular-nums` em IPs e datas).
- Exportação PDF: `jspdf` + `jspdf-autotable` (dependências novas, aprovadas pelo usuário) — a
  tela **não** usa mais o `@media print` de `main.css` (que continua no projeto para outros
  consumidores).

## 9. Vitrine `/design` §13

- A demo `show-header-top` da seção 13 passou a incluir `show-filters`,
  `:filters-count="filtrosDemo"` e `@open-filters="abrirFiltrosDemo"`: o clique alterna o
  contador 0 ↔ 2 e dispara `toast.info` (demonstra emit + badge sem modal real).
- A busca da §13 é a mesma `UiInput` (prova visual do padrão DS em tabela com agrupamento).

## 10. Especificações OpenSpec

Change `openspec/changes/gestao-auditoria` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `auditoria` | **ADDED** — rota/shell, navegação, KPIs, filtros em modal, tabela, detalhe, exportação, fase 1, rodapé |
| `design-system/data-table` | **ADDED** — busca no controle do DS + botão Filtros opcional (`showFilters`/`filtersCount`/`open-filters`) |
| `configuracoes-globais` | **MODIFIED** — query de expurgo usa a tabela canônica `auditoria` |

As deltas são sincronizadas para `openspec/specs/` via `/opsx-sync` **antes do archive** (fluxo adotado: com o sync prévio, o `openspec archive` puro recusaria um ADDED já aplicado na main — o fluxo de archive reconhece o estado "já sincronizado" e apenas move a change para `archive/`).

Change seguinte, `relatorio-pdf-auditoria` (spec-driven): capability `auditoria` **ADDED**
(recriação da spec principal — o archive anterior foi feito sem sync — com o requirement de
exportação já no formato **download de PDF**).

## 11. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório).
- Checagem CDP (Edge headless) desta change: rota 200 com shell + navegação (sidebar/conta/ativo),
  kit da toolbar (9/9 — foco `ds-bottom-clip`, filtro, limpar, estado vazio, botão/badge/toast,
  regressão sem `showFilters`, 375px), componentes de domínio (14/14 — KPIs, menu Exportar,
  modal de filtros aplicar/limpar, colunas/badges/paginação, detalhe, rodapé), modal de filtros v2 (9/9 — ícone no header, datas com máscara, chips, Cancelar/Limpar, sem scrollbar), exportação (4/4 —
  CSV com BOM + cabeçalho + linhas filtradas, `window.print`, mídia `print`).
- Change `relatorio-pdf-auditoria` (CDP 8/8): logo de login compartilhada (upload → badge +
  campo desabilitado → persiste na troca de aba → segue para a página), blob `%PDF-` salvo como
  `auditoria.pdf`, MediaBox em paisagem (841.89 × 595.28 pt), `window.print` nunca chamado e
  conteúdo extraído do PDF (título, "Gerado em …", filtros, 6 colunas, registros e 2 páginas com
  "de 2", 1 imagem embutida = logo).
- Greps: `logs_auditoria` = 0 em `app/` + `docs/`; `show-filters` presente na vitrine §13.

## 12. Pendências e próximos passos

- **Backend:** `server/utils/audit.ts` + endpoint de consulta (fase 2) — a página troca o
  composable por dados reais sem mudar o contrato visual.
- **Filtros avançados:** o modal foi desenhado para crescer (IP, recurso com busca, faixa de
  datas) — novas opções entram nele sem tocar na toolbar.
- **`UiMenu` no kit:** o mini-menu do Exportar duplica a mecânica Esc/clique-fora do menu da
  conta; extrair para o kit é candidato a próxima evolução.
- **Gotcha do badge `Exclusão`:** a variante `blocked` força o dot pulsante; se poluir em uso
  real, trocar por variante neutra é ajuste de uma linha.
- Itens de navegação sem rota restantes (MEL-03 do `RL01`).