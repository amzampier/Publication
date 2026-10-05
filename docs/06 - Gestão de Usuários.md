# 06 — Gestão de Usuários · Área Administrativa

**Versão:** 2.0.0 · **Data:** 2026-10-04 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal de Gestão de Usuários — listagem (base em memória) com cabeçalho
(Relatórios + Novo Usuário), KPIs, tabela e **modal único de cadastro/edição com os quatro
blocos (três na criação)**
**Arquivos-fonte:** [`app/pages/admin/gestao-usuarios.vue`](../app/pages/admin/gestao-usuarios.vue) ·
[`app/components/usuarios/`](../app/components/usuarios) ·
[`app/config/brasil.ts`](../app/config/brasil.ts) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — seção 5 (máscara) e seção 15 (modal filho)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) — componentes do kit usados
(`UiModal`, `UiModalSection`, `UiInput`, `UiSelect`, `UiButton`, `UiBadge`, `UiKpi`,
`UiDataTable`, `UiTooltip`, `UiUploadFiles`, `UiCheckbox`, `UiCameraWeb`)
**Autoridade de comportamento:** specs da capability `gestao-usuarios`
(`openspec/specs/gestao-usuarios`) + deltas da change vigente `openspec/changes/modal-importacao-usuarios`

> Este documento é a referência da tela `/admin/gestao-usuarios` e de tudo o que foi criado para
> ela: componentes de domínio, o modal de usuário, a gravação em memória e os gatilhos remanescentes
> com toast. Toda alteração aqui deve manter as specs da change e a implementação coerentes.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (alterados)](#4-componentes-de-kit-alterados)
5. [Comportamento: modal, validação, SMTP e gravação](#5-comportamento-modal-validação-smtp-e-gravação)
6. [Dados de demonstração](#6-dados-de-demonstração)
7. [Navegação até a tela](#7-navegação-até-a-tela)
8. [Estilo e CSS dedicado](#8-estilo-e-css-dedicado)
9. [Vitrine `/design`](#9-vitrine-design)
10. [Especificações OpenSpec](#10-especificações-openspec)
11. [Verificação](#11-verificação)
12. [Pendências e próximos passos](#12-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A Gestão de Usuários é a tela de administração de usuários da Área Administrativa:

- **Rota:** `/admin/gestao-usuarios` → `app/pages/admin/gestao-usuarios.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`
  (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Modelo de dados:** núcleo conforme o `docs/02` §3.5 (tabelas `usuarios`/`perfis`) — nome,
  e-mail, perfil, status, último acesso —, **estendido no modal** por telefone, função,
  departamento, endereço, configurações de e-mail, avatar e datas (`docs/02` permanece intocado;
  a extensão vive só no `UsuarioDemo`, ver §3.5).
- **Fase 2:** CRUD **inteiramente em memória** — sem `server/`, sem chamadas de rede. A base vive
  em `useState('usuarios-base')`: as alterações sobrevivem à navegação interna e são descartadas
  na recarga.
- **Modal único:** "Novo Usuário" e o lápis da linha abrem o **mesmo** `UsuariosFormulario`, em
  modo de criação ou de edição (§3.4); o `Trash2` da linha abre o `UsuariosExclusao`, modal de
  confirmação da exclusão (§5.6); o botão "Filtros" da tabela abre o `UsuariosFiltros`, modal de
  filtros estruturais (§3.7); o ícone "Importar" da tabela abre o `UsuariosImportar`, modal de
  importação de planilha (§3.8). Os demais gatilhos (Convite, Bloquear e o
  ícone do CEP) seguem com toast de transição (§5.5).

## 2. Estrutura da página (componentização)

A página é fina e é **dona do estado de coordenação do modal** (decisão D1 do `design.md` da
change). Cada parte é um componente em `app/components/usuarios/` (auto-import com prefixo
`Usuarios*`):

```
admin/gestao-usuarios.vue            (page — definePageMeta + composição + estado dos modais)
├── <UsuariosCabecalho @novo />       ← título + menu "Relatórios" + "Novo Usuário"
├── <UsuariosKpis class="mt-6" />     ← 4 UiKpi do conjunto VIGENTE
├── <UsuariosTabela ref @filtros @editar @excluir @importar class="mt-5" />  ← UiDataTable (busca + badges + ações)
├── <UsuariosFormulario v-model :modo :usuario />  ← modal único (4 blocos: 3 na criação)
├── <UsuariosExclusao v-model :usuario @confirmar />  ← modal de exclusão (§5.6)
├── <UsuariosFiltros v-model />       ← modal de filtros (§3.7)
└── <UsuariosImportar v-model />      ← modal de importação (§3.8)
```

- **Estado de coordenação na página:** `modalAberto: ref(false)`, `modo: ref<'novo' | 'editar'>`
  e `usuarioAlvo: ref<UsuarioDemo | null>`; `abrirNovo()` preenche `modo`/`usuarioAlvo` e abre,
  `abrirEdicao(usuario)` idem com o registro da linha. Para a exclusão: `exclusaoAberta:
  ref(false)`, `usuarioExcluir: ref<UsuarioDemo | null>` e `tabelaRef` (encadeia o
  `focarBusca()` da tabela, §5.6) — `abrirExclusao(usuario)` guarda o alvo e abre;
  `confirmarExclusao()` remove, avisa por toast, fecha e devolve o foco à busca. Para os filtros:
  `filtrosAbertos: ref(false)` — o `@filtros` da tabela simplesmente o liga
  (`filtrosAbertos = true`), sem alvo a guardar. Para a importação:
  `importarAberto: ref(false)` — o `@importar` da tabela simplesmente o liga
  (`importarAberto = true`), sem alvo a guardar. Nada fora da
  página abre os diálogos.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8` (mesmo padrão
  da Auditoria).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<UsuariosCabecalho>`

- Cabeçalho sem container (padrão `AuditoriaCabecalho`): tile `bg-brand-primary` com `Users` em
  `#b070ef`, título "Gestão de Usuários" e subtítulo.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, `aria-haspopup="menu"`
  + `aria-expanded`), à esquerda do "Novo Usuário": mini-menu `role="menu"` "Opções de relatórios"
  com **Ficha Cadastral**, **Relação Completa**, **divisor** e **Exportar em CSV** — itens em
  `text-xs font-light text-slate-700`, fecha por `Escape` e clique fora (markup de domínio,
  **não** é componente de kit).
- **Botão "Novo Usuário"** (`UiButton` primary + `Plus`): **emite `@novo`** para a página, que
  abre o modal em modo de criação (não há mais toast aqui).
- **Exportar em CSV:** monta o CSV de `usuariosFiltrados` com `Blob` + **BOM UTF-8** (`'\uFEFF'`),
  cabeçalho escapado e linhas entre aspas separadas por `;`, baixado como `usuarios.csv` com as
  colunas **Nome, E-mail, Perfil, Status, Último acesso**.
- **Relação Completa:** `gerarPdfUsuarios` (`./gerarPdfUsuarios.ts`) — `usuarios.pdf` em **A4
  paisagem** (`jspdf` + `jspdf-autotable`), cabeçalho com a logo de login rasterizada via canvas,
  título + "Gerado em …", linha "`N` usuário(s)", cabeçalho repetido a cada página e rodapé
  "Página X de Y"; **`window.print()` não é usado**.
- **Ficha Cadastral:** `gerarPdfFichaCadastral` (`./gerarPdfFichaCadastral.ts`) —
  `ficha-cadastral.pdf` em **A4 retrato**, **1 página por usuário** com faixas navy "Dados
  Cadastrais" e "Acesso ao Sistema".

### 3.2 `Kpis.vue` → `<UsuariosKpis>`

4 `UiKpi` em `grid sm:grid-cols-2 lg:grid-cols-4`, todos derivados de `usuariosFiltrados`
(conjunto vigente — recalculam quando o conjunto muda, inclusive após criar/editar):

| KPI | Valor | Cor (`cor` do `UiKpi`) | Ícone |
| :--- | :--- | :--- | :--- |
| Total de usuários | contagem de `usuariosFiltrados` | `#112051` (navy) | `Users` |
| Ativos | contagem de `status === 'Ativo'` | `#047857` (esmeralda) | `UserCheck` |
| Inativos | contagem de `status === 'Inativo'` | `#64748b` (slate) | `UserX` |
| Perfis distintos | `Set` de perfis do conjunto | `#f5b302` (cor RBAC) | `ShieldCheck` |

### 3.3 `Tabela.vue` → `<UsuariosTabela>`

- `UiDataTable` com `show-header-top` (busca), `show-filters` + `:filters-count="filtrosAtivosCount"`
  + `@open-filters` → **emite `@filtros` para a página, que abre o modal de filtros (§3.7)**, e
  slot **`#filtersLeft`** com o **ícone `Import` solto** (plain
  `<button>`) + `UiTooltip` **"Importar Novos Usuários"** → **emite `@importar` para a página,
  que abre o modal de importação (§3.8)** — sem toast.
- **Colunas** (`minWidth`): Nome (170), E-mail (220), Perfil (110), Status (95), Último acesso
  (135, `format` → `formatarUltimoAcesso`, `null` vira `-`) + coluna Ações. **Sem rolagem
  horizontal** ≥ ~1280px (soma ≈ 830px dentro do `max-w-7xl`).
- **Badges via slot `#cell`:** perfil → `reconciled`/`inReview`/`pending`/`neutral`
  (`VARIANTE_POR_PERFIL`); status → `done`/`neutral` (`VARIANTE_POR_STATUS`), ambos `size="sm"`.
- **Coluna Ações:** slot `#actions` com `UiTooltip` + `aria-label` por ícone; **ícone em
  cinza claro (`text-slate-400`) por padrão, ganhando a cor semântica só no hover** (fundo
  tinta correspondente; foco `brand-focus` recortado):

  | Ação | Ícone | Cor no hover | Comportamento |
  | :--- | :--- | :--- | :--- |
  | Enviar o Convite | `MailCheck` | `hover:text-sky-600 hover:bg-sky-50` | toast de transição (§5) |
  | Bloquear usuário | `Lock` | `hover:text-amber-600 hover:bg-amber-50` | toast de transição (§5) |
  | Editar usuário | `Pencil` | `hover:text-brand-focus hover:bg-lime-50` | **emite `@editar(usuario)` → abre o modal** |
  | Excluir usuário | `Trash2` | `hover:text-rose-700 hover:bg-rose-50` | **emite `@excluir(usuario)` → abre o modal de exclusão (§5.6)** |

### 3.4 `Formulario.vue` → `<UsuariosFormulario>` (modal único)

Recebe `v-model` (aberto), `modo: 'novo' | 'editar'` e `usuario: UsuarioDemo | null`; mantém um
**rascunho** (`Rascunho` = `UsuarioDemo` sem perfil/situação obrigatórios + `senha` +
`confirmarSenha`) e devolve a gravação para o composable.

- **`UiModal size="lg"`** com título `Novo Usuário` / `Editar Usuário`, subtítulo "Dados, acesso
  ao sistema e preferências do usuário", ícone `User`, `X` do cabeçalho e rodapé
  **Cancelar** (`outline`) + **Salvar** (`primary`).
- **Quatro `UiModalSection`** (a seção 4 só é renderizada em modo de edição):

  | # | Seção (ícone) | Campos |
  | :--- | :--- | :--- |
  | 1 | Dados do Usuário (`User`) | avatar (`UiUploadFiles forma="circular" compacto` em coluna de 200px + `UiCameraWeb`), Nome\|E-mail na mesma linha; Telefone\|Função\|Departamento na mesma linha; **linha seguinte de largura total começando abaixo do avatar** (`sm:grid-cols-4`): **Status** em `UiSegmented` (controle segmentado Ativo\|Inativo, sem dropdown; rótulo trocado de "Situação"), Perfil, Senha, Confirmar Senha (olho `Eye`/`EyeOff` no `rightIcon`) — **sem seção/cabeçalho próprio "Acesso ao Sistema"** (removido) |
  | 2 | Endereço (`MapPin`) | `grid-cols-12` em 2 linhas — **1ª:** CEP (3, com ícone de busca **fora do input**, à direita), Endereço (**5**, maior), Número (**2**, menor), Complemento (2) · **2ª:** Bairro (3), Cidade (**4**, maior), Estado (**2**, menor, 27 `UFS`), Região (3, 5 `REGIOES`) |
  | 3 | Configurações de E-mail (`Mail`) | E-mail SMTP, Senha SMTP (1ª linha, 6+6); Provedor (3), Servidor SMTP (3), **Segurança (4, antes da Porta)**, Porta (**2**, menor) + ações de teste + badge de Status |
  | 4 | Informações de Cadastro (`Clock`) | **somente na edição** — Data Cadastro e Última Atualização (`UiInput disabled`, datas formatadas); **a criação não exibe esta seção** (modal abre com os blocos 1 a 3) |

- **Máscaras (`UiInput mask`, §4):** CEP `99999-999`, Telefone `(99) 99999-9999` e Porta `9999` —
  o valor gravado é a **string formatada**.
- **Ícone do CEP:** **somente o ícone** `MapPinCheck` (sem caixa de botão) logo à direita do input,
  com `role="button"` + `tabindex="0"` + `aria-label` e `UiTooltip` "Buscar CEP (ViaCEP)" → clique
  ou `Enter` dispara `toast.info` de transição, **nenhum campo de endereço é preenchido**.
- **Navegação por teclado:** `Enter` em qualquer `UiInput` move o foco para o próximo campo focável
  (mesma ordem do `Tab`: gatilhos dos `UiSelect`, ícone do CEP, botões do avatar), com a **caret
  reposicionada no fim** — o cursor fica dentro do próximo input. A busca interna do `UiSelect`
  (`data-busca`) fica de fora: lá `Enter` continua escolhendo a opção destacada.
- **Avatar:** `UiUploadFiles forma="circular" compacto` — **foto redonda 96px centralizada** em
  caixa larga de 200px (borda tracejada só no vazio; ações `size-6` no canto inferior direito);
  converte a imagem em dataURL no `change`; o botão de câmera emite `@camera` e abre `UiCameraWeb` —
  captura atualiza a pré-visualização e fecha só a câmera (empilhamento, §4).
- **Informações de Cadastro:** exibida **somente na edição**, com as datas em `dd/mm/aaaa HH:mm`
  (`formatarDataHora`) — **a criação não exibe a seção** (o modal de criação tem os blocos
  "Dados do Usuário", "Endereço" e "Configurações de E-mail").

### 3.5 `useUsuariosDemo.ts` — composable de estado (base reativa)

- Tipos: `UsuarioDemo` (**núcleo** id, nome, email, perfil, status, ultimoAcesso + **estendido**
  telefone, funcao, departamento, `endereco: EnderecoUsuario`, `smtp: ConfigSmtpUsuario`, avatar,
  dataCadastro, atualizadoEm), `PerfilUsuario`, `StatusUsuario`, `ModoUsuario`
  (`'novo' | 'editar'`), `StatusSmtp` (`'nao-testado' | 'testando' | 'conectado' | 'falha'`) e
  `FiltrosUsuarios` (`{ usuario, perfil, status }` — `''` = todos em cada campo; `usuario`
  guarda o **nome** do usuário, comparado por igualdade exata) e `RegistroImportacao`
  (`{ nome, email, perfil, status }` — linha válida selecionada na importação, §3.8).
- Constantes e helpers: `PERFIS`, `STATUSES`, `VARIANTE_POR_PERFIL`, `VARIANTE_POR_STATUS`,
  `enderecoVazio()`, `smtpVazio()`.
- **Semente:** `USUARIOS` — os 16 usuários (2 Administradores, 5 Editores, 4 Revisores, 5
  Leitores; 13 Ativos, 3 Inativos, 1 sem acesso) com os campos estendidos vazios/`null`.
- **Base reativa:** `useState('usuarios-base')` semeada com **clone profundo** da semente (a
  constante nunca é mutada); `usuariosFiltrados` aplica os três predicados de
  `useState('usuarios-filtros')`, junto com `filtrosAtivosCount` (0–3), `opcoesUsuarios`
  (**nomes distintos da base** — não do conjunto filtrado, para um filtro de Status não
  esconder opções do select de Usuário —, ordenados com `localeCompare(…, 'pt-BR')`) e
  `limparFiltros` (zera os três campos).
- **Gravação pura:** `salvarUsuario(base, rascunho, modo)` devolve `{ base, usuario }` — cria com
  id novo, `ultimoAcesso: null` e `dataCadastro`/`atualizadoEm` iguais ao instante; edita
  preservando `dataCadastro` e `ultimoAcesso`, atualizando `atualizadoEm`.
  `importarUsuarios(base, registros: RegistroImportacao[])` devolve `{ base }` e adiciona os
  registros selecionados na importação (§3.8): ids `u-00N` na sequência da base,
  `ultimoAcesso: null`, endereço/SMTP/avatar vazios, datas = instante e **sem senha**.
- **Formatadores:** `formatarUltimoAcesso(iso)` e `formatarDataHora(iso)` (`dd/mm/aaaa HH:mm`;
  `null` → `-`).
- Arquivo em `components/usuarios/` (não é auto-importado): consumidores importam explicitamente.

### 3.6 `gerarPdfUsuarios.ts` e `gerarPdfFichaCadastral.ts` — geradores de relatório

Espelho do `gerarPdfAuditoria.ts` (mesmo helper `rasterizarLogo`, estilos navy da `UiDataTable`,
rodapé "Página X de Y"): `gerarPdfUsuarios.ts` (A4 paisagem, autotable) e
`gerarPdfFichaCadastral.ts` (A4 retrato, 1 página por usuário). **Nenhuma dependência nova**
(`jspdf` + `jspdf-autotable` já existiam).

### 3.7 `Filtros.vue` → `<UsuariosFiltros>` (modal de filtros)

Espelho do `app/components/auditoria/Filtros.vue` (design D2 — os dois módulos de filtro são
irmãos visuais e de contrato):

- **Abertura:** `UiDataTable` da `Tabela` emite `@open-filters` → a tabela repassa como
  `@filtros` → a página liga `filtrosAbertos` (§2). **Sem toast.**
- **`UiModal size="sm"`** com título "Filtros de Usuários", subtítulo "Usuário, perfil e
  status", ícone `Funnel` no cabeçalho (padrão dos `UiModal` do kit).
- **Corpo em duas `UiModalSection`:**

  | Seção (ícone) | Controle | Placeholder |
  | :--- | :--- | :--- |
  | Usuário (`User`) | `UiSelect` único — opções de `opcoesUsuarios` (nomes da **base**, sort `pt-BR`) | "Todos os usuários" |
  | Perfil e Status (`ShieldCheck`) | dois `UiSelect` com `label` — `PERFIS` e `STATUSES` | "Todos os perfis" / "Todos os status" |

  Em todos, `''` = "todos" e o **X** do select (`clearable`, default do kit) devolve o critério a
  "todos".
- **Rascunho local:** o modal edita uma cópia dos filtros (`watch` do `modelValue` ressincroniza
  ao abrir); **Aplicar** grava no composable e fecha; **Cancelar**/`Escape`/`X` do cabeçalho
  só fecham, descartando o rascunho; **Limpar Filtros** zera rascunho **e** composable
  (o badge cai a 0 e a base completa volta) mantendo o modal aberto.
- **Rodapé:** "Limpar Filtros" à esquerda; "Cancelar" (`outline`) + "Aplicar" (`primary`) à
  direita — mesmo layout do irmão.
- **Recálculo sem toque extra:** `filtros.value` é lido por `usuariosFiltrados`, então tabela,
  KPIs (§3.2) e exportações (§3.1) recalculam sozinhos; o badge `filtersCount` da toolbar
  reflete `filtrosAtivosCount` (0–3) **somente do estado aplicado** — o rascunho não o altera
  (design D6).

### 3.8 `Importar.vue` → `<UsuariosImportar>` (modal de importação)

Espelho do contrato dos irmãos Filtros/Exclusão (design D1–D9 da change
`modal-importacao-usuarios`):

- **Abertura:** o ícone `Import` da `Tabela` (slot `#filtersLeft`, tooltip "Importar Novos
  Usuários") emite `@importar` → a página liga `importarAberto` (§2). **Sem toast** — o gatilho
  deixou de avisar e passou a abrir o modal (spec).
- **`UiModal size="lg"`** com título "Importar Usuários", subtítulo "Planilha modelo (.xlsx)" e
  ícone `Import` no cabeçalho.
- **Modelo oficial:** [`docs/modelos/modelo-importacao-usuarios.xlsx`](../docs/modelos/modelo-importacao-usuarios.xlsx)
  — planilha única "Usuários" com **somente o cabeçalho** `Nome | E-mail | Perfil | Status`
  (sem linhas de exemplo). Não há botão "Baixar modelo" no modal: o arquivo vive no repositório
  para consulta da equipe.
- **Seção 1 — Planilha modelo (`Import`):** `UiUploadFiles` em **modo lista separada**
  (`lista-separada`, `aceitar=".xlsx"`, `multiple=false`, `mostrarCamera=false`,
  `rotuloLista="Arquivo selecionado"`, `docs/01` §5.4): com um arquivo selecionado **só o
  card verde** fica visível (ícone, nome, tamanho e remover) — a caixa tracejada "Clique para
  selecionar arquivos / Formatos aceitos: .xlsx" **some**; remover no ícone de lixeira
  **devolve a caixa** e limpa o parse. `processando` exibe
  "Lendo planilha…"; arquivo ilegível, `.xls` legado ou cabeçalho
  divergente → **alerta `role="alert"` em `rose-700` com o motivo, sem montar a tabela**.
- **Parser (`lerPlanilhaUsuarios.ts`):** `exceljs` via `import()` dinâmico (o chunk só carrega
  no uso); cabeçalho validado com `trim` e sem distinção de maiúsculas, em qualquer ordem de
  colunas; linhas totalmente vazias ignoradas; células com `trim`; e-mail comparado
  **case-insensitive** contra a base vigente. Classificação de cada linha (nesta ordem):
  **inválida** (nome/e-mail ausentes, e-mail malformado, `Perfil`/`Status` fora de
  `PERFIS`/`STATUSES`, com o motivo) → **repetida** (segunda ocorrência do mesmo e-mail no
  arquivo) → **já cadastrada** (e-mail presente na base) → **pronta**.
- **Seção 2 — Pré-visualização da importação (`BetweenHorizontalEnd`)** (renderizada só com
  linhas): `UiDataTable` (`showFilters=false`, `showHeaderTop` com busca, `default-page-size=10`):

  | Coluna | Slot | Conteúdo |
  | :--- | :--- | :--- |
  | (seleção) | `cell(selecao)` | `UiCheckbox size="sm"` — habilitado **só** em `pronto` |
  | Nome, E-mail | — | texto puro |
  | Perfil, Status | `cell(perfil)`/`cell(status)` | `UiBadge` `VARIANTE_POR_PERFIL`/`VARIANTE_POR_STATUS` |
  | Situação | `cell(situacao)` | badge do kit + motivo (`text-[10px]` `rose-700`) quando inválida |

  | Situação | Badge kit | Seleção |
  | :--- | :--- | :--- |
  | "Pronto para importar" | `done` (emerald) | habilitada, **pré-marcada no parse** |
  | "E-mail já cadastrado" | `pending` (laranja) | desabilitada |
  | "Repetido no arquivo" | `neutral` (slate) | desabilitada |
  | "Linha inválida" | `blocked` (rose-700) | desabilitada, motivo visível |

  Toolbar: **"Selecionar todos os prontos"** no slot `filtersLeft` (`UiCheckbox` com
  `indeterminate` quando marcado parcialmente; desabilitado sem linhas prontas).
- **Rodapé:** contador "n de N linha(s) selecionada(s)" à esquerda; **Cancelar** (`outline`) +
  **Importar (n)** (`primary`, **desabilitado em 0**).
- **Gravação:** `importarUsuarios` (§3.5) grava somente as linhas selecionadas →
  `usuarios.value` atualiza, KPIs recalculam, `toast.success('Gestão de Usuários', 'N
  usuário(s) importado(s) com sucesso.')` e o modal fecha.
- **Descarte:** o `watch` do `modelValue` zera linhas/erro/processando **na abertura**;
  Cancelar, `Escape` ou o `X` do cabeçalho só fecham — a base fica idêntica e nenhum toast é
  exibido. Reabrir sempre recomeça do zero (reimportar o mesmo arquivo marca tudo como
  "E-mail já cadastrado").
- **Filtros intactos:** a importação não toca `useState('usuarios-filtros')` — registros fora do
  filtro vigente só passam a aparecer na tabela e nos KPIs quando o filtro for limpo.
- **Sem rede:** parse e gravação 100% locais; nada persiste além do `useState` (a recarga
  restaura a semente, como o resto do CRUD em memória).

## 4. Componentes de kit (alterados)

Nenhum componente novo; **três itens de kit alterados** para esta tela — **nesta change apenas
o `UiUploadFiles`** (`UiInput` com `mask` e `UiModal` com pilha de modais vieram das changes
anteriores):

| Kit | Alteração | Contrato |
| :--- | :--- | :--- |
| `UiInput` | **prop `mask`** (sintaxe `9` dígito, `A` alfanumérico, demais literais) | formata no `@input`, `update:modelValue` emite a **string formatada**, `maxlength` segue o tamanho da máscara, `backspace` apaga o literal junto; recorte de erro continua `rose-700` — ver `docs/01` §5.3 |
| `UiModal` | **pilha de modais** (`pilhaModais` no escopo do módulo) | `Escape`/`Tab` só processados quando a instância é o **topo** da pilha; fechar o topo restaura o foco no subjacente — ver `docs/01` §5.12 |
| `UiUploadFiles` | **modo opt-in `listaSeparada`** (+ prop `rotuloLista`) | cards `emerald` com ícone/nome/tamanho/remover **acima**; caixa de prompt **some** no single-file enquanto houver arquivo e **volta** ao remover (no `multiple` permanece); default clássico intacto — ver `docs/01` §5.4 e o delta `design-system/upload` |

- Continua valendo o registro da fase anterior: `UiDataTable` ganhou o slot opt-in `#filtersLeft`.
- Os demais `Ui*` (`UiSelect`, `UiButton`, `UiBadge`, `UiKpi`, `UiTooltip`, `UiUploadFiles`,
  `UiCameraWeb`, `UiModalSection`) são apenas compostos — o único componente de kit novo criado
  para esta tela é o **`UiSegmented`** (campo Status, docs/01 §5.15).

## 5. Comportamento: modal, validação, SMTP e gravação

### 5.1 Abertura do modal (dois modos)

- **Criação:** "Novo Usuário" (`Cabecalho` emite `@novo`) → modal vazio com os **três blocos**
  (Dados do Usuário, Endereço, Configurações de E-mail — **sem** "Informações de Cadastro"),
  Perfil e Situação sem seleção, Status da Configuração "Não testado" e senhas vazias.
- **Edição:** lápis da linha (`Tabela` emite `@editar(usuario)`) → modal preenchido com o
  registro (datas formatadas, `smtp.status` reiniciado para "Não testado") e **campos de senha
  vazios**.
- Fechar por `Cancelar`, `Escape` ou `X` descarta o rascunho sem tocar na base e **sem toast de
  sucesso**.

### 5.2 Validação antes de gravar

`validar(rascunho, modo, base)` é função pura e devolve `Record<campo, string>`; o componente
pinta `:error` (label e recorte em `rose-700` + `AlertCircle` interno à direita + borda vermelha —
**sem mensagem visível abaixo**, que fica no DOM oculta com `role="alert"`), limpa o
erro quando a regra volta a passar e, na tentativa inválida, **foca o primeiro campo** via
`data-campo` no wrapper (fallthrough attrs). Ordem de foco: Nome → E-mail →
Status → Perfil → Senha → Confirmar Senha.

| Regra | Quando |
| :--- | :--- |
| Nome, E-mail, Perfil, Situação obrigatórios | sempre |
| E-mail em formato válido e **único** na base | sempre |
| Senha obrigatória, **mín. 8 caracteres** e confirmação igual | **criação** |
| Senha e confirmação **ou ambas vazias ou ambas preenchidas e iguais** | **edição** |

Os cenários da spec: e-mail duplicado (erro no E-mail + foco), senha curta/divergente na criação
(erros nos dois campos + foco no 1º) e senha parcial na edição (erro no campo **vazio**), com o
modal permanecendo aberto e os demais dados preservados.

### 5.3 Configurações de E-mail (simulada, sem rede)

- Status da Configuração inicia em **"Não testado"**; badge `UiBadge` com
  `neutral`/`pending`/`done`/`blocked` → Não testado / Testando / Conectado / Falha.
- **Testar conexão** habilitado só com Servidor + Porta + E-mail SMTP preenchidos; percorre
  **"Testando" por ~1.200 ms** (botões desabilitados) e termina em **"Conectado"** com porta
  `25`/`465`/`587` (`PORTAS_SMTP_VALIDAS`) ou **"Falha"** nos demais (ex.: `250`).
- **Enviar teste** habilitado só com Status "Conectado" → `toast.info` de envio em simulação.
- **Trocar a Segurança** sugere a Porta (`Nenhuma`→25, `STARTTLS`→587, `SSL/TLS`→465), a menos
  que a porta tenha sido digitada à mão depois da sugestão (flag simples); a porta continua
  editável.
- **Editar qualquer campo do bloco** devolve o Status a "Não testado" e cancela um teste em
  andamento; o timer também é limpo no fechamento do modal e no unmount.
- `Salvar` **não** exige o teste; nenhuma requisição de rede é emitida.

### 5.4 Gravação em memória

- **Criar:** `salvarUsuario` adiciona o registro (id novo `u-00N`, `ultimoAcesso: null`,
  `dataCadastro`/`atualizadoEm` = instante) → modal fecha + `toast.success('Gestão de Usuários',
  'Usuário criado com sucesso.')`; a linha nova aparece com `-` no Último acesso e os KPIs
  recalculam (Total 17).
- **Editar:** atualiza o registro preservando `dataCadastro` e `ultimoAcesso`, com
  `atualizadoEm` = instante → modal fecha + `toast.success` de atualização.
- As alterações sobrevivem à navegação interna (`useState`) e **são descartadas na recarga**.

### 5.5 Gatilhos remanescentes com toast (contrato de transição)

Dois controles de linha + o ícone do CEP continuam exibindo
`toast.info('Gestão de Usuários', '<ação>: funcionalidade disponível na próxima etapa.')` com
**nenhum `UiModal`** aberto — **três toasts remanescentes** no total:

| Gatilho | Onde |
| :--- | :--- |
| Enviar o Convite (`MailCheck`) | coluna Ações da `Tabela` |
| Bloquear usuário (`Lock`) | coluna Ações da `Tabela` |
| Buscar CEP (ViaCEP) | `rightIcon` do campo CEP no modal |

**Superfícies complementares:** a busca da `UiDataTable` é texto livre instantâneo e filtra só
as linhas da tabela; KPIs e exportação usam `usuariosFiltrados` do composable. **Filtros
estruturais** (usuário/perfil/status) têm UI desde o modal de filtros (§3.7) — o badge do botão
reflete `filtrosAtivosCount` (0–3, só do estado aplicado). **Exportação** opera sempre sobre o
conjunto vigente — filtrado, quando há filtros aplicados —, pelo menu "Relatórios".

### 5.6 Modal de exclusão (confirmação destrutiva)

- **Gatilho:** o `Trash2` da coluna Ações **não** exibe toast — `UsuariosTabela` emite
  `@excluir(usuario)` e a página abre o `UsuariosExclusao` (`v-model` + `usuario`), guardando o
  alvo em `usuarioExcluir`.
- **Componente:** `app/components/usuarios/Exclusao.vue` — **apresentação pura** (sem escrita).
  `UiModal size="sm"` com título "Excluir Usuário" e ícone `Trash2` (sem subtítulo); corpo em
  `UiModalSection` ("Este usuário será excluído") com **nome** e **e-mail** do alvo em destaque
  (nome `font-semibold`, e-mail abaixo em `font-mono`) e o aviso em `rose-700` de que a ação não
  pode ser desfeita; rodapé **Cancelar** (`UiButton outline`) + **Excluir** (`UiButton danger`
  com `Trash2`).
- **Confirmação:** `confirmarExclusao()` na página → `excluirUsuario(base, id)` (função pura,
  §3.5) → `usuarios.value` atualiza → a linha sai, os KPIs recalculam, `toast.success('Gestão de
  Usuários', 'Usuário excluído com sucesso.')` e o modal fecha.
- **Foco na busca:** com a linha fora do DOM o gatilho `Trash2` não existe mais, então a página
  agenda `nextTick(() => tabelaRef.value?.focarBusca())` — o `UiDataTable` expõe `focarBusca()`
  (encadeado pela `UsuariosTabela`; `docs/01` §5.11) e o foco do teclado cai no campo de busca;
  a devolução de foco do `UiModal` ao nó detachado é no-op silencioso.
- **Descarte:** "Cancelar", `Escape` ou o `X` do cabeçalho só fecham — a base não muda e nenhum
  toast é exibido.
- **Sem guarda e sem rede:** a exclusão é irrestrita (qualquer perfil, inclusive Administrador),
  não tem "desfazer" e não emite nenhuma requisição; a recarga restaura a semente, como o resto
  do CRUD em memória. A tabela não precisa de tratamento especial: o `UiDataTable` colapsa a
  página atual quando o total de linhas cai.

## 6. Dados de demonstração

- Base de **16 usuários**: 2 Administradores, 5 Editores, 4 Revisores e 5 Leitores;
  **13 Ativos** e **3 Inativos**; 1 usuário nunca acessou (`null` → `-`).
  KPIs da base completa: **Total 16 · Ativos 13 · Inativos 3 · Perfis distintos 4**.
- A semente traz endereço/SMTP/avatar/datas vazios (`null`/`''`) — **editar um usuário antigo
  mostra os blocos vazios**, que é o comportamento esperado (sem fake pre-fill).
- **Nenhuma persistência:** a recarga restaura a semente; a base reativa e os filtros vivem em
  `useState` (perdem-se ao fechar a aba/sessão).
- **Escopo do modelo:** `senha` (hash bcrypt), `tentativas_falhas`/`bloqueado_ate` e os demais
  campos do `docs/02` §3.5 seguem para o backend (fora de escopo).

## 7. Navegação até a tela

- **Sidebar:** sessão "Administração" → item "Gestão de Usuários" com
  `to: '/admin/gestao-usuarios'` (`app/config/navigation.ts`) — fica ativo na rota
  (spec `design-system/layout-navigation`).
- **Menu da conta:** item "Gestão de Usuários" com o mesmo `to`.
- Os itens de Administração com rota são Configurações Globais, Gestão de Auditoria e Gestão de
  Usuários; permanecem sem rota **Perfis de Acesso (RBAC)** e os itens das demais sessões (MEL-03
  do `RL01`).

## 8. Estilo e CSS dedicado

- **Nenhum CSS dedicado novo** — só tokens e utilitários do DS (`bg-brand-primary`,
  `text-[#b070ef]`, `brand-focus` nos focos, `rose-700` nos erros, variantes do `UiBadge`).
- **Dependências:** `jspdf` + `jspdf-autotable` já eram usados pela Auditoria; a importação de
  planilha soma o **`exceljs`** (parse local com `import()` dinâmico, §3.8).
- Layout do modal: corpo em `UiModalSection` (cards brancos) com grids `sm:grid-cols-2` e coluna
  fixa de avatar `md:grid-cols-[140px_1fr]`; altura controlada pelo `max-h-[75vh]` com rolagem
  interna do `UiModal`.

## 9. Vitrine `/design`

Quatro demonstrações novas acompanharam o kit alterado:

- **Seção 5 (Input):** card "MÁSCARA DE DIGITAÇÃO (MASK)" com campo CEP (`99999-999`) e telefone
  `((99) 99999-9999)`.
- **Seção 15 (Modal):** botão "Abrir modal filho" dentro do modal de cadastro → `UiModal xs` filho
  — `Escape` fecha só o filho, `Tab` circula só no filho e o pai mantém os campos intactos.
- **Seção 15 (Modal):** botão **"Abrir Modal de Confirmação"** → `UiModal sm` com
  `UiModalSection` e rodapé **Cancelar (`outline`) + Excluir (`danger`)** — o mesmo padrão do
  modal de exclusão de usuário (§5.6); confirmar fecha e mostra um `toast.success` de demo.
- **Seção 6 (Upload):** demo **"Lista separada"** do `UiUploadFiles` (modo `listaSeparada`) —
  cards `emerald` acima da caixa, que **some** no single-file enquanto houver arquivo e
  **volta** ao remover (§3.8 e `docs/01` §5.4).

A seção **13. DataTable** continua sendo a referência da toolbar (busca + Filtros).

## 10. Especificações OpenSpec

Change `openspec/changes/gestao-usuarios-modal-cadastro` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `gestao-usuarios` | **MODIFIED** — gatilhos que antes avisavam por toast (Novo Usuário e Editar agora abrem o modal) e KPIs recalculando ao criar/editar; **ADDED** — os cinco blocos do modal, validação antes de gravar, gravação em memória/cancelar descarta e SMTP simulado |
| `design-system/modais` | **ADDED** — `Escape` fecha só o topo, armadilha de `Tab` restrita ao topo, fechar o topo restaura o foco no subjacente |

`design-system/layout-navigation` **não sofre delta** — declarar a rota desta tela é uso do
requisito existente. As deltas são sincronizadas para `openspec/specs/` via `/opsx-sync`
**antes do archive** (fluxo adotado: com o sync prévio, o `openspec archive` puro recusaria um
ADDED já aplicado na main — o fluxo de archive reconhece o estado "já sincronizado" e apenas
move a change para `archive/`).

Change `openspec/changes/gestao-usuarios-modal-exclusao` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `gestao-usuarios` | **MODIFIED** — o "Excluir" sai da lista de gatilhos com toast e passa a abrir o modal de confirmação (à época:
Convite, Bloquear, Importar, Filtros e CEP seguiam com toast); **ADDED** — requirement do modal de exclusão (conteúdo do diálogo, confirmação remove do conjunto com KPIs + `toast.success`, descarte por Cancelar/`Escape`/`X`, foco devolvido à busca, operação só em memória) |

`design-system/modais` e `vitrine` **não sofrem delta**: o diálogo abre em nível único (o
empilhamento já existe) e a demo da vitrine obedece aos requisitos já vigentes.

Change `openspec/changes/gestao-usuarios-modal-filtros` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `gestao-usuarios` | **MODIFIED** — o botão "Filtros" sai da lista de gatilhos com toast e passa a abrir o modal de filtros (à época: Importar, Convite, Bloquear e CEP seguiam com toast); **ADDED** — requirement do modal de filtros (duas `UiModalSection` — Usuário e Perfil e Status —, três `UiSelect` com `''` = todos, rodapé Limpar/Cancelar/Aplicar, rascunho sincronizado na abertura, badge 0–3 só do estado aplicado, tabela/KPIs/exportação sobre o conjunto filtrado, operação só em memória) |

`design-system/*` e `vitrine` **não sofrem delta**: nenhum componente de kit é criado ou
alterado (o modal recompõe `UiModal`, `UiModalSection` e `UiSelect` já vigentes), o diálogo
abre em nível único e a vitrine não muda.

Change `openspec/changes/modal-importacao-usuarios` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `gestao-usuarios` | **MODIFIED** — o ícone "Importar" sai da lista de gatilhos com toast e passa a abrir o modal de importação (Convite, Bloquear e CEP seguem com toast); **ADDED** — requirement do modal de importação (modelo `.xlsx` em `docs/modelos/` com as 4 colunas, erro de arquivo sem montar a tabela, pré-visualização com os quatro estados de Situação, linhas prontas pré-selecionadas, `Importar (n)` desabilitado em 0, gravação em memória sem senha e com datas do instante, descarte por Cancelar/`Escape`/`X`, filtros preservados, operação sem HTTP e descartada na recarga) |
| `design-system/upload` | **ADDED (capability nova)** — modo lista separada do `UiUploadFiles`: cards com ícone/nome/tamanho/remover, caixa de prompt sumindo no single-file enquanto houver arquivo e voltando ao remover, `multiple` mantendo a caixa e modo clássico (default) inalterado |

Nenhuma capability `design-system/*` **existente** muda (a nova `design-system/upload` cobre o
modo lista) e a vitrine `/design` ganha a demo **"Lista separada"** na seção 6.

## 11. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório).
- Smoke SSR da rota: `/admin/gestao-usuarios` responde 200 com shell, título "Gestão de Usuários",
  KPIs, coluna "Último acesso" e **sem** marcação de modal (ele só existe com `v-model` aberto).
- Checagem visual/CDP no dev server (`http://localhost:3000`):
  - **`/admin/gestao-usuarios`:** KPIs 16/13/3/4; "Relatórios" antes de "Novo Usuário"; 4 ações
    de linha; **"Novo Usuário" abre o modal vazio sem toast**, o **lápis abre preenchido**;
    validação (e-mail duplicado, senha curta, confirmação divergente, senha parcial na edição);
    estados do SMTP com porta `250` (Falha) e `587` (Conectado) + "Enviar teste" com toast;
    avatar com câmera empilhada (`Escape` fecha só a câmera); CEP com ícone → toast sem preencher;
    criar → Total 17, `Último acesso` `-`, toast de sucesso; editar → linha e "Última
    Atualização" novos; recarga → base de 16 restaurada; **3 toasts remanescentes** (Convite,
    Bloquear, CEP) sem modal;     ações de linha **em cinza claro (`text-slate-400`) e com a cor
    semântica só no hover**; sem rolagem horizontal ≥1280px.
  - **Filtros (§3.7):** botão "Filtros" → modal `sm` com ícone `Funnel`, seções "Usuário" e
    "Perfil e Status" e **nenhum toast**; escolher perfil + Aplicar → modal fecha, tabela/KPIs
    filtram, badge = 1 e CSV/PDF saem sobre o conjunto filtrado; rascunho alterado +
    Cancelar/`Escape`/`X` → tudo idêntico ao anterior; "Limpar Filtros" com 2 aplicados →
    selects zerados, badge some, base completa volta e **modal segue aberto**; X de um select +
    Aplicar → critério volta a "todos"; combinação sem correspondência → estado vazio da
    `DataTable` sem erro; recarga → filtros zerados.
  - **Importação (§3.8):** ícone `Import` → tooltip "Importar Novos Usuários" e modal `lg`
    **sem toast**, vazio e **sem tabela**; modelo `docs/modelos/` (4 colunas) →
    pré-visualização com os **quatro estados de Situação** e linhas "Pronto para importar"
    **pré-marcadas** (+ "Selecionar todos os prontos" marcando/desmarcando todas as prontas,
    desabilitado sem linhas prontas); linha com e-mail da base, e-mail repetido no arquivo e
    Perfil fora de `PERFIS` → "E-mail já cadastrado"/"Repetido no arquivo"/"Linha inválida" com
    motivo e **checkbox desabilitado**; cabeçalho divergente/ilegível → alerta `rose-700`
    **sem tabela** (idem cabeçalho válido sem linhas de dados: "O arquivo não contém nenhuma
    linha de dados."); desmarcar tudo → `Importar (0)` desabilitado; importar n → base cresce
    (KPIs recalculam),
    toast com a contagem e modal fecha; reimportar o mesmo arquivo → linhas com e-mail já na
    base (inclusive as recém-importadas) "E-mail já cadastrado" e nada selecionado; Cancelar/`Escape`/`X` → base idêntica e sem toast; filtros
    aplicados permanecem após importar registros fora do filtro (só aparecem ao limpar);
    recarga → base de 16 restaurada.
  - **Exclusão (§5.6):** `Trash2` → modal `sm` com nome + e-mail em destaque no corpo, aviso em
    `rose-700` e **nenhum toast**; **Excluir** → linha sai, KPIs recalculam (Total 15),
    `toast.success` e o **foco cai no campo de busca** (Tab a partir dele percorre a tabela);
    Cancelar/`Escape`/`X` → base intacta sem toast; última linha da última página → tabela colapsa
    para página válida; recarga → base de 16 com o usuário de volta; qualquer perfil (inclusive
    Administrador) excluível.
  - **`/design`:** máscara na seção 5, modal filho na seção 15 (`Escape`/`Tab` só no filho) e
    **modal de confirmação** da seção 15 (rodapé `outline` + `danger`, fecha por `Escape`).
  - **Regressão do kit empilhado:** Auditoria com Filtros e Detalhe intactos (modais de 1 nível).

## 12. Pendências e próximos passos

- **Ações de linha:** bloquear e enviar o convite seguem com toast (confirmação/modal próprio —
  o **excluir** já tem o modal de confirmação, §5.6); reativar usuário e redefinir senha ainda
  não existem.
- **ViaCEP:** busca real de CEP no modal (hoje toast + preenchimento manual).
- **Modelo de importação:** botão "Baixar modelo" no modal (hoje o `.xlsx` vive só em
  `docs/modelos/`) e suporte a `.xls` legado (o `exceljs` não lê o formato binário antigo).
- **SMTP real:** trocar a simulação por conexão efetiva (hoje `setTimeout` + portas fixas).
- **Backend:** `server/` com endpoints de CRUD de `usuarios`, autenticação JWT e RBAC real
  (`requirePermission`, `docs/02` §3.5/§7) — a página troca o composable por dados reais sem
  mudar o contrato visual; modelar em `docs/02` os campos hoje só no `UsuarioDemo`.
- **Módulo Perfis (RBAC):** tela própria (item de navegação já reservado, ainda sem rota).
- **`UiMenu` no kit:** o mini-menu dos Relatórios duplica a mecânica Esc/clique-fora do menu da
  conta (mesma pendência do [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md) §12).
