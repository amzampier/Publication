# 06 — Gestão de Usuários · Área Administrativa

**Versão:** 1.0.0 · **Data:** 2026-10-03 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal de Gestão de Usuários — listagem de usuários (fase 1 em memória)
com cabeçalho (Relatórios + Novo Usuário), KPIs e tabela; **sem modais** (cadastro, importação,
detalhe e filtros ficam para a fase 2)
**Arquivos-fonte:** [`app/pages/admin/gestao-usuarios.vue`](../app/pages/admin/gestao-usuarios.vue) ·
[`app/components/usuarios/`](../app/components/usuarios) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — **inalterada** (nenhum componente de kit novo)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) — componentes do kit usados
(`UiButton`, `UiBadge`, `UiKpi`, `UiDataTable`, `UiTooltip`)
**Autoridade de comportamento:** specs da change `openspec/changes/gestao-usuarios`
(`gestao-usuarios`)

> Este documento é a referência da tela `/admin/gestao-usuarios` e de tudo o que foi criado para
> ela: componentes de domínio, ações de fase 1 com toast, navegação e specs. Toda alteração aqui
> deve manter a spec `gestao-usuarios` e a implementação coerentes; na fase 2 (modais), este
> documento e a spec crescem juntos.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (criados/alterados)](#4-componentes-de-kit-criadosalterados)
5. [Comportamento: ações de fase 1, busca e exportação](#5-comportamento-ações-de-fase-1-busca-e-exportação)
6. [Dados de demonstração (fase 1)](#6-dados-de-demonstração-fase-1)
7. [Navegação até a tela](#7-navegação-até-a-tela)
8. [Estilo e CSS dedicado](#8-estilo-e-css-dedicado)
9. [Vitrine `/design` — inalterada](#9-vitrine-design--inalterada)
10. [Especificações OpenSpec](#10-especificações-openspec)
11. [Verificação](#11-verificação)
12. [Pendências e próximos passos (fase 2)](#12-pendências-e-próximos-passos-fase-2)

---

## 1. Visão geral e rota

A Gestão de Usuários é a tela de administração de usuários da Área Administrativa:

- **Rota:** `/admin/gestao-usuarios` → `app/pages/admin/gestao-usuarios.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`
  (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Modelo de dados:** conforme o `docs/02` §3.5 (tabelas `usuarios`/`perfis`) restrito ao escopo
  da fase: nome, e-mail, perfil, status e último acesso — senha hash, bloqueio e tentativas ficam
  para o backend.
- **Fase 1:** tudo em memória — sem `server/`, sem chamadas de rede; a recarga restaura a base de
  demonstração (`useState` preserva o estado durante a navegação do ciclo).
- **Sem modais:** nenhum `UiModal` existe nesta tela; os controles que abririam um modal exibem
  toast (§5).

## 2. Estrutura da página (componentização)

A página é fina — **sem estado de coordenação** (não há modal para coordenar na fase 1), só
composição. Cada parte é um componente em `app/components/usuarios/` (auto-import com prefixo
`Usuarios*`):

```
admin/gestao-usuarios.vue            (page fina — só definePageMeta + composição)
├── <UsuariosCabecalho />            ← título + menu "Relatórios" (CSV / PDF) + "Novo Usuário"
├── <UsuariosKpis class="mt-6" />    ← 4 UiKpi do conjunto VIGENTE
└── <UsuariosTabela class="mt-5" />  ← UiDataTable (busca + Importar + Filtros + badges + ações)
```

- **Sem botão "Salvar":** a página não altera estado persistido na fase 1.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8` (mesmo
  padrão da Auditoria).
- **Fase 2:** cada ação que hoje dispara toast ganha seu `UiModal` aqui (o toast é o contrato de
  transição — ver `design.md` D3).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<UsuariosCabecalho>`

- Cabeçalho sem container (padrão `AuditoriaCabecalho`): tile `bg-brand-primary` com `Users` em
  `#b070ef` (cor do item de navegação), título "Gestão de Usuários" e subtítulo.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, `aria-haspopup="menu"` +
  `aria-expanded`), posicionado **à esquerda do botão "Novo Usuário"**: mini-menu `role="menu"`
  "Opções de relatórios" com **Ficha Cadastral**, **Relação Completa**, **divisor** e
  **Exportar em CSV** — itens em `text-xs font-light text-slate-700` (`px-3 py-2`), idênticos ao
  menu suspenso da conta do `AppHeader`; fecha por `Escape` e por clique fora (markup de domínio,
  **não** é componente de kit).
- **Botão "Novo Usuário"** (`UiButton` primary + `Plus`), à direita do menu: fase 1 →
  `toast.info` "Cadastro de usuário: funcionalidade disponível na próxima etapa." (nenhum modal).
- **Exportar em CSV:** monta o CSV de `usuariosFiltrados` com `Blob` + **BOM UTF-8**
  (`'\uFEFF'`), cabeçalho escapado e linhas entre aspas separadas por `;`, baixado como
  `usuarios.csv` com as colunas **Nome, E-mail, Perfil, Status, Último acesso**.
- **Relação Completa:** chama `gerarPdfUsuarios` (`./gerarPdfUsuarios.ts`) com
  `usuariosFiltrados` e o preview da **logo de login** (composable
  `app/composables/useLogomarcaLogin.ts` — mesmo estado compartilhado usado pela Auditoria e por
  Configurações). O gerador monta o `usuarios.pdf` em **A4 paisagem** com `jspdf` +
  `jspdf-autotable`: cabeçalho com a logo à esquerda (rasterizada via canvas — sem logo ou caminho
  sem arquivo → só o título), título "Relatório de Gestão de Usuários" + "Gerado em …", linha
  "`N` usuário(s) · fase 1 em memória", linha divisória navy, colunas com o cabeçalho repetido a
  cada página, rodapé "Página X de Y" e `save('usuarios.pdf')` — **`window.print()` não é
  usado**.
- **Ficha Cadastral:** chama `gerarPdfFichaCadastral` (`./gerarPdfFichaCadastral.ts`) com o
  mesmo conjunto e a mesma logo; o gerador monta `ficha-cadastral.pdf` em **A4 retrato** com
  **1 página por usuário** (faixas navy "Dados Cadastrais" — identificador, nome, e-mail — e
  "Acesso ao Sistema" — perfil, status, último acesso), mesmo rodapé e também sem
  `window.print()`.

### 3.2 `Kpis.vue` → `<UsuariosKpis>`

4 `UiKpi` em `grid sm:grid-cols-2 lg:grid-cols-4`, todos derivados de `usuariosFiltrados`
(conjunto vigente — recalculam quando o conjunto muda, spec `gestao-usuarios`):

| KPI | Valor | Cor (`cor` do `UiKpi`) | Ícone |
| :--- | :--- | :--- | :--- |
| Total de usuários | contagem de `usuariosFiltrados` | `#112051` (navy) | `Users` |
| Ativos | contagem de `status === 'Ativo'` | `#047857` (esmeralda) | `UserCheck` |
| Inativos | contagem de `status === 'Inativo'` | `#64748b` (slate) | `UserX` |
| Perfis distintos | `Set` de perfis do conjunto | `#f5b302` (cor RBAC) | `ShieldCheck` |

### 3.3 `Tabela.vue` → `<UsuariosTabela>`

- `UiDataTable` com `title="Users"`, `show-header-top` (busca), `show-filters` +
  `:filters-count="filtrosAtivosCount"` (0 na fase 1) + `@open-filters` → toast, e slot
  **`#filtersLeft`** com o **ícone `Import` solto** (plain `<button>`, sem `UiButton` — repouso
  `text-slate-500`, **hover muda a cor** para `text-brand-primary` + `bg-slate-100`) + `UiTooltip`
  **"Importar Novos Usuários"** → toast de fase 1 (§5) — o slot renderiza imediatamente à
  esquerda do botão Filtros.
- **Colunas** (`minWidth` entre parênteses): Nome (170), E-mail (220), Perfil (110), Status (95),
  Último acesso (135, `format` → `formatarUltimoAcesso`, `null` vira `-`) + coluna Ações.
  **Sem rolagem horizontal** nas larguras usuais: soma dos `minWidth` 730px + Ações ≈ 100px
  (4 ícones pequenos) ≈ 830px de chão, dentro do container `max-w-7xl` (1280px); abaixo de
  ~1280px de janela a rolagem horizontal permanece como fallback.
- **Badges via slot `#cell`:**
  - **Perfil:** Administrador → `reconciled` (índigo), Editor → `inReview` (azul),
    Revisor → `pending` (laranja), Leitor → `neutral` (slate) — mapeamento
    `VARIANTE_POR_PERFIL`.
  - **Status:** Ativo → `done` (esmeralda, destaque positivo), Inativo → `neutral` (tom neutro) —
    mapeamento `VARIANTE_POR_STATUS`. Ambos em `size="sm"` para a tabela ficar compacta.
- **Coluna Ações:** slot `#actions` com 4 ações compactas (ícone `h-3.5 w-3.5` + `p-0.5`,
  `gap-[7px]` — +3px sobre o `gap-1` original), cada uma com `UiTooltip` + `aria-label`
  próprios e **cor semântica permanente** → `toast.info` de fase 1 (§5):

  | Ação | Ícone | Cor |
  | :--- | :--- | :--- |
  | Enviar o Convite | `MailCheck` | `text-sky-600` (hover `bg-sky-50`) |
  | Bloquear usuário | `Lock` (cadeado) | `text-amber-600` (hover `bg-amber-50`) |
  | Editar usuário | `Pencil` | `text-brand-focus` `#1a9e07` (hover `bg-lime-50`) |
  | Excluir usuário | `Trash2` | `text-rose-700` (hover `bg-rose-50`) |

### 3.4 `useUsuariosDemo.ts` — composable de estado

- Tipos `UsuarioDemo` (id, nome, email, perfil, status, ultimoAcesso `string | null`),
  `PerfilUsuario` (`Administrador | Editor | Revisor | Leitor`), `StatusUsuario`
  (`Ativo | Inativo`) e `FiltrosUsuarios` (`{ perfil, status }` — `''` = todos).
- Constantes: `PERFIS`, `STATUSES`, `VARIANTE_POR_PERFIL`, `VARIANTE_POR_STATUS`.
- `USUARIOS`: 16 usuários gerados com último acesso relativo a "hoje" (`dataAtras(dias, horas)`),
  cobrindo os 4 perfis e os 2 status; 1 usuário **sem último acesso** (`null` → `-`).
- `useState('usuarios-filtros')` com `filtros` — sobrevive à navegação no mesmo ciclo;
  `usuariosFiltrados` (computed), `filtrosAtivosCount`, `limparFiltros` e o formatador
  `formatarUltimoAcesso`. A **estrutura de filtros já existe**, mas a UI só chega na fase 2
  (o botão Filtros avisa por toast).
- Arquivo em `components/usuarios/` (não é auto-importado): consumidores importam
  explicitamente de `./useUsuariosDemo`.

### 3.5 `gerarPdfUsuarios.ts` e `gerarPdfFichaCadastral.ts` — geradores de relatório

Espelho do `gerarPdfAuditoria.ts` (mesmo helper `rasterizarLogo`, estilos navy da
`UiDataTable`, rodapé "Página X de Y"):

- `gerarPdfUsuarios.ts` — **Relação Completa**: `jspdf` + `jspdf-autotable`, as 5 colunas de
  usuários, `save('usuarios.pdf')` em A4 paisagem.
- `gerarPdfFichaCadastral.ts` — **Ficha Cadastral**: `jspdf` puro (sem autotable), A4 retrato
  com 1 página por usuário, faixas navy de seção e `save('ficha-cadastral.pdf')`.

**Dependências já existentes** (`jspdf` + `jspdf-autotable`) — nenhuma nova.

## 4. Componentes de kit (criados/alterados)

**Nenhum componente novo; um alterado:** `UiDataTable` ganhou o slot opt-in `#filtersLeft`
(imediatamente à esquerda do botão Filtros) — consumidores que não passam o slot continuam
idênticos (nenhum outro consumidor muda; a vitrine `/design` não o usa). Os demais `Ui*`
(`UiButton`, `UiBadge`, `UiKpi`, `UiTooltip`) são apenas compostos (decisão D7 do `design.md`,
ajustada para registrar o slot).

## 5. Comportamento: ações de fase 1, busca e exportação

- **Sete gatilhos com toast (spec "As ações da fase 1 que dependem de modal avisam..."):**
  todos exibem `toast.info('Gestão de Usuários', '<ação>: funcionalidade disponível na próxima
  etapa.')` e **nenhum `UiModal` abre**:

  | Gatilho | Onde |
  | :--- | :--- |
  | Novo Usuário | `Cabecalho` (UiButton primary) |
  | Importar novos usuários (`Import`) | toolbar da `Tabela` (ícone solto no slot `#filtersLeft`, tooltip "Importar Novos Usuários") |
  | Filtros | toolbar da `Tabela` (botão do `UiDataTable`) |
  | Enviar o Convite (`MailCheck`) | coluna Ações da `Tabela` |
  | Bloquear usuário (`Lock`) | coluna Ações da `Tabela` |
  | Editar usuário (`Pencil`) | coluna Ações da `Tabela` |
  | Excluir usuário (`Trash2`) | coluna Ações da `Tabela` |

- **Duas superfícies complementares:** a **busca** da `UiDataTable` é texto livre instantâneo e
  **filtra só as linhas da tabela** (é interna ao kit); KPIs e exportação usam
  `usuariosFiltrados` do composable — mesmo desacoplamento da Auditoria (decisão D6). Se a fase 2
  quiser busca que afete KPIs, é mudança de requisito consciente.
- **Filtros estruturais:** o composable já filtra por `perfil`/`status` e o badge do botão
  reflete `filtrosAtivosCount`, mas **não há UI de filtro na fase 1** (contador permanentemente
  0 até o modal da fase 2).
- **Exportação** opera sempre sobre o conjunto vigente, pelo menu **"Relatórios"**; os PDFs são
  **arquivos de relatório baixados** (`usuarios.pdf` paisagem e `ficha-cadastral.pdf` retrato) —
  não é o diálogo de impressão do navegador.

## 6. Dados de demonstração (fase 1)

- Base de **16 usuários**: 2 Administradores, 5 Editores, 4 Revisores e 5 Leitores;
  **13 Ativos** e **3 Inativos**; 1 usuário nunca acessou (`null` → `-`).
  KPIs da base completa: **Total 16 · Ativos 13 · Inativos 3 · Perfis distintos 4**.
- **Nenhuma persistência:** recarregar restaura a base; os filtros vivem em `useState`
  (perdem-se ao fechar a aba/sessão).
- **Escopo do modelo:** campos visíveis na tela (nome, e-mail, perfil, status, último acesso) —
  `senha` (hash bcrypt), `tentativas_falhas`/`bloqueado_ate` e demais campos do `docs/02` §3.5
  ficam para o backend (fora de escopo da fase 1).

## 7. Navegação até a tela

- **Sidebar:** sessão "Administração" → item "Gestão de Usuários" com
  `to: '/admin/gestao-usuarios'` (`app/config/navigation.ts`) — fica ativo na rota
  (spec `design-system/layout-navigation`: itens com `to` refletem a rota corrente).
- **Menu da conta:** item "Gestão de Usuários" com o mesmo `to`.
- **A partir desta change**, os itens de Administração com rota são Configurações Globais,
  Gestão de Auditoria e Gestão de Usuários; permanecem sem rota **Perfis de Acesso (RBAC)** e os
  itens das demais sessões (MEL-03 do `RL01`).

## 8. Estilo e CSS dedicado

- **Nenhum CSS dedicado novo** — só tokens e utilitários do DS (`bg-brand-primary`,
  `text-[#b070ef]`, `brand-focus` nos focos dos botões de ação, variantes do `UiBadge`).
- **Nenhuma dependência nova:** `jspdf` + `jspdf-autotable` já eram usados pela Auditoria.

## 9. Vitrine `/design` — inalterada

Nenhuma seção nova ou modificada em
[`app/pages/design.vue`](../app/pages/design.vue): o único ponto de kit tocado nesta change é o
slot opt-in `#filtersLeft` do `UiDataTable`, que a demonstração da vitrine não usa. A seção
**13. DataTable** continua sendo a referência da toolbar (busca + Filtros) usada por esta tela.

## 10. Especificações OpenSpec

Change `openspec/changes/gestao-usuarios` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `gestao-usuarios` | **ADDED** — rota/shell, navegação, KPIs, tabela com badges, ações de fase 1 (toast), relatórios (Ficha Cadastral, Relação Completa, CSV), fase 1 sem persistência |

`design-system/layout-navigation` **não sofre delta**: o requirement "Itens de navegação podem
declarar rota e o ativo reflete a rota atual" já prevê o `to` opcional — declarar a rota desta
tela é uso do requisito existente.

Após o archive, a delta é sincronizada para `openspec/specs/gestao-usuarios/`.

## 11. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório).
- Smoke SSR da rota: `/admin/gestao-usuarios` responde 200 com shell (logo Publications), título
  "Gestão de Usuários", KPIs, coluna "Último acesso" e **sem** marcação de modal.
- Checagem visual/CDP no dev server (`http://localhost:3000/admin/gestao-usuarios`): item da
  sidebar ativo, navegação pelos 2 atalhos (sidebar e menu da conta), KPIs 16/13/3/4,
  **"Relatórios" antes de "Novo Usuário"** (ícone `NotebookText`), menu com **3 opções + divisor**
  (Ficha Cadastral, Relação Completa, Exportar em CSV), ícone Importar **solto com hover que muda
  a cor** + tooltip "Importar Novos Usuários", 4 ações de linha com **cores semânticas**
  (sky/amber/focus/rose) e **gap 7px**, busca/badges/paginação, os **7 toasts de fase 1**
  (Novo Usuário, Importar, Filtros e as 4 ações de linha), download de `usuarios.csv`
  (BOM UTF-8, 5 colunas), `usuarios.pdf` (paisagem, 16 usuários) e `ficha-cadastral.pdf`
  (retrato, 16 páginas), ausência de `UiModal` e ausência de rolagem horizontal ≥ ~1280px.

## 12. Pendências e próximos passos (fase 2)

- **Modais (o coração da fase 2):** cadastro/edição (hoje "Novo Usuário"), importação em lote
  (hoje "Importar") e filtros de perfil/status (hoje botão "Filtros") — cada toast vira a
  abertura do modal correspondente, sem mudar a composição da página.
- **Ações de linha:** enviar o convite, bloquear, editar e excluir já disparam toast (a fase 2
  transforma cada um na confirmação/modal correspondente); **pendentes:** reativar usuário e
  redefinir senha (hoje não existem).
- **Backend:** `server/` com endpoints de CRUD de `usuarios`, autenticação JWT e RBAC real
  (`requirePermission`, `docs/02` §3.5/§7) — a página troca o composable por dados reais sem
  mudar o contrato visual.
- **Módulo Perfis (RBAC):** tela própria (item de navegação já reservado, ainda sem rota).
- **`UiMenu` no kit:** o mini-menu dos Relatórios duplica a mecânica Esc/clique-fora do menu da
  conta (mesma pendência do [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md) §12).
