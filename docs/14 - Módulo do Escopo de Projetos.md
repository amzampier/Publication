# 14 - Módulo do Escopo de Projetos — Área Administrativa

**Versão:** 1.0.0 — **Data:** 2026-10-20 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela **frontend** do módulo **Escopo de Projetos** — cabeçalho, quatro KPIs, cards
de escopo (código, status, nome, versão, ano, período, quantidade de itens vinculados e
visualizações), busca,
filtros, paginação, formulário de cadastro/edição, itens em modal somente leitura,
publicar/arquivar, exclusão condicionada e exportações PDF/CSV. O dataset vive **em memória**
(`useState`) e a API ainda **não existe**.
**Arquivos-fonte:** [`app/pages/admin/escopo-projetos.vue`](../app/pages/admin/escopo-projetos.vue) ·
[`app/components/escopo-projetos/`](../app/components/escopo-projetos) ·
[`tests/escopo-projetos-validadores.test.ts`](../tests/escopo-projetos-validadores.test.ts) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Design system:** [`/design`](../app/pages/design.vue) — `UiEntityCard`, `UiKpi`, `UiBadge`,
`UiActionMenu`, `UiModal`, `UiModalSection`, `UiInput`, `UiSelect`, `UiDatePicker`,
`UiSegmented`, `UiTextarea`, `UiPagination`, `UiDataTable`, `UiTooltip`, `UiButton`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md)
**Autoridade de comportamento:** `openspec/changes/construir-escopo-projetos-frontend`
(delta `escopo-projetos`)

> Este documento é a referência da tela `/admin/escopo-projetos` na fase frontend. Em caso de
> divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados mock](#4-contrato-de-dados-mock)
5. [Fluxos](#5-fluxos)
6. [Navegação e RBAC](#6-navegação-e-rbac)
7. [Dataset em memória](#7-dataset-em-memória)
8. [Itens do projeto e importação](#8-itens-do-projeto-e-importação)
9. [Documentação relacionada](#9-documentação-relacionada)
10. [Verificação](#10-verificação)
11. [Pendências e próximos passos](#11-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A tela de Escopo de Projetos é o **catálogo de escopos anuais** da Área Administrativa:

- **Rota:** `/admin/escopo-projetos` → `app/pages/admin/escopo-projetos.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Modelo de referência:** `projetos_escopo` em
  [`docs/bd/01`](bd/01%20-%20banco_dados_mariadb.sql) — `id`, `codigo`, `nome`, `versao`, `ano`,
  `data_inicio`, `data_final`, `data_previsao`, `data_publicacao`, `status` (`Em Andamento` |
  `Homologação` | `Concluído` | `Publicado`), `softwares_contemplados` (JSON), `descricao_geral`,
  `total_visualizacoes` e timestamps. Os itens pertencem a `entregas_itens` (via `projeto_id`).
- **Softwares contemplados:** não são digitados no escopo. São **derivados dos itens/chamadas**
  (cada software distinto vira um código do catálogo) e só aparecem quando há itens.
- **Fase atual:** **frontend com mocks**. Não há `GET/POST/PUT/DELETE /api/escopo-projetos`; o
  modelo em `useEscopoProjetosModelo.ts` mantém o dataset em `useState` (reset no F5).
- **Status x arquivamento:** `status` é o fluxo editorial de quatro valores; o arquivamento é
  **somente mock** (`arquivada: boolean` no modelo em memória — a coluna não existe no schema).
  Arquivar remove o escopo da listagem/KPIs sem apagar dados ou itens.
- **Componentização:** a página é fina e dona da coordenação; cada parte é um componente em
  `app/components/escopo-projetos/` (auto-import com prefixo `EscopoProjetos*`).

## 2. Estrutura da página (componentização)

```
admin/escopo-projetos.vue                            (page - definePageMeta + composição + coordenação)
├── <EscopoProjetosCabecalho @novo />                → tile ClipboardList #50a1ff + título + "Relatórios" + "Novo Escopo"
├── <EscopoProjetosKpis class="mt-6" />              → 4 UiKpi do conjunto VIGENTE
├── <EscopoProjetosGrade
│       @editar @excluir @publicar @arquivar
│       @ver-itens @open-filters />                  → busca + Import inerte + Filtros + grade de cards + UiPagination
├── <EscopoProjetosFiltros v-model="filtrosAbertos" /> → modal (Status, Ano, Versão, Software)
├── <EscopoProjetosFormulario v-model :modo :escopo /> → cadastro/edição
├── <EscopoProjetosItens v-model :escopo />          → itens em modal xl com UiDataTable somente leitura
├── <EscopoProjetosExclusao v-model :escopo @confirmar /> → confirmação de exclusão (condicionada)
├── <EscopoProjetosPublicar v-model :escopo @confirmar /> → confirmação de publicação
└── <EscopoProjetosArquivar v-model :escopo @confirmar /> → confirmação de arquivamento
```

- **Estado de coordenação:** `filtrosAbertos`, `modalAberto`/`modo`/`escopoEditar`,
  `itensAberto`/`escopoItens`, `exclusaoAberta`/`escopoExcluir`, `publicarAberto`/`escopoPublicar`
  e `arquivarAberto`/`escopoArquivar`.
- **Sem loading de rede:** na fase frontend não há `onMounted`/`UiLoading`; o seed é síncrono.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8`.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<EscopoProjetosCabecalho>`

- Cabeçalho sem container: tile `bg-brand-primary` com `ClipboardList` em `#50a1ff`, título
  "Escopo de Projetos" e subtítulo "Catálogo de escopos anuais — versão, período, softwares e
  situação."
- **Botão "Novo Escopo"** (`UiButton` primary + `Plus`): emite `@novo`; gated por
  `escopo-projetos`/`criar`.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`): "Listagem em PDF"
  (`gerarPdfEscopoProjetos`) e "Exportar em CSV" (Código, Nome, Versão, Ano, Status, Período,
  Softwares, Visualizações), gated por `exportar`. Lista vazia → aviso; erro no PDF → toast.
- **CSV:** separador `;`, BOM UTF-8 e neutralização de fórmulas (`=`, `+`, `-`, `@`, tab, CR).

### 3.2 `Kpis.vue` → `<EscopoProjetosKpis>`

- Quatro `UiKpi` do **conjunto vigente** (filtrado, quando houver filtro): **Em Andamento**
  (`#0364f7`, `Clock`), **Homologação** (`#7c3aed`, `Search`), **Concluído** (`#1a9e07`,
  `CheckCircle2`) e **Publicado** (`#112051`, `Rocket`).
- Arquivados não entram na contagem (o filtro base os remove).

### 3.3 `Card.vue` → `<EscopoProjetosCard>`

- `UiEntityCard` com **código**, **status** (`UiBadge`), **nome**, **versão** (subtítulo) e as
  linhas **Ano**, **Período** (`dd/mm/aaaa a dd/mm/aaaa`), **Itens vinculados** (`itensCount`,
  pt-BR) e **Visualizações** (pt-BR). O card não exibe mais softwares; o `UiEntityCard` mantém o
  fundo branco padrão do kit.
- **Badge por status:** `Em Andamento`→`aberta`, `Homologação`→`inReview`, `Concluído`→`done`,
  `Publicado`→`publicado`.
- **Ações no hover/foco:**
  - **Itens** (`ListChecks`): gated por `visualizar`; abre o modal somente leitura; tooltip
    "Itens do projeto (N)".
  - **Editar** (`Pencil`): gated por `alterar`.
  - **Excluir** (`Trash2`): gated por `excluir`; **desabilitado** com motivo quando há itens
    vinculados (`itensCount > 0`) — a mesma guarda é reaplicada na página/modelo.
  - **`UiActionMenu`**: **Publicar** (`Send`, gated por `publicar`; desabilitado quando o status
    já é `Publicado`, com motivo) e **Arquivar** (`Archive`, gated por `arquivar`).

### 3.4 `Itens.vue` → `<EscopoProjetosItens>`

- `UiModal size="xl"` (**mais largo**), **somente leitura**, aberto pelo ícone do card — **não
  existe rota nem página própria** de itens (o CRUD pertence ao módulo "Lançar as Chamadas").
- A grade usa o **`UiDataTable`** do kit: **busca**, **agrupamento** por até três colunas
  (arrastando cabeçalhos para a faixa "Agrupamento"), **ordenação multi-coluna** (Shift), **busca**,
  **redimensionamento de colunas**, **paginação** (10/20/50) e **totalizadores no rodapé** (botão
  direito).
- Colunas: **Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status e Data de
  liberação**. Status do item em `UiBadge`: `Revisar`→`pending`, `Aprovado`→`reconciled`,
  `Publicar`→`done`; Chamada em `font-mono` e data em `dd/mm/aaaa`.
- Estado vazio: "Nenhum item vinculado a este projeto." (fora do `UiDataTable`, para preservar a
  mensagem do módulo). Os itens vêm de `itensDoProjeto(escopo.id)` no dataset em memória.

### 3.5 `Grade.vue` → `<EscopoProjetosGrade>`

- Painel branco com tile `ClipboardList`, título "Escopo de Projetos" e subtítulo "Catálogo de
  escopos anuais, versões e softwares contemplados".
- **Busca** client-side (`buscar`) sobre código, nome, versão, ano, descrição e softwares;
  gated por `buscar`.
- **Import** (`Import`): ícone **inerte** — sem `@click`, requisição ou modal. Fica visível com
  `importar` e o tooltip informa "Importar escopos (fase backend)".
- **Filtros** (`Funnel`): abre o modal; o badge mostra a quantidade de filtros ativos; gated por
  `filtrar`.
- **Grade responsiva** `sm:grid-cols-2 xl:grid-cols-3` de `Card`; estado vazio diferencia
  "nenhum resultado para o filtro" de "nenhum escopo cadastrado".
- **Paginação** (`UiPagination`, 6/12/18/24 por página, padrão 6) sobre o conjunto filtrado;
  volta à primeira página quando busca/filtros mudam.

### 3.6 `Filtros.vue` → `<EscopoProjetosFiltros>`

- `UiModal size="md"` com **Status, Ano, Versão e Software** (`UiSelect`; vazio = todos) e os
  botões "Limpar Filtros", "Cancelar" e "Aplicar".
- Rascunho isolado que espelha o estado vigente ao abrir; "Aplicar" grava em `filtros` (reflete
  na grade e nos KPIs); "Limpar Filtros" zera rascunho e estado, mantendo o modal aberto.

### 3.7 `Formulario.vue` → `<EscopoProjetosFormulario>` (novo/edição)

- `UiModal size="lg"`, um componente para os dois modos:
  - **Novo:** nome, versão, ano atual, status `Em Andamento`, datas vazias e descrição vazia. O
    **código não é digitado** — o modelo gera `PE-<ano>.<seq>` ao salvar. Sem itens, não há lista
    de softwares contemplados.
  - **Editar:** preenchido, com **Código** somente leitura (`mono`) e a seção **Informações de
    Cadastro** (Criado em/Atualizado em desabilitados).
- Seções: **Dados do Escopo** (Nome; Versão; Ano; Status em `UiSegmented` com tons sky/indigo/
  emerald/navy), **Cronograma** (Data de Início, Data Final, Data de Previsão e Data de
  Publicação em `UiDatePicker`) e **Descrição** (`UiTextarea`). A seção vira **Softwares e
  Descrição** quando há itens: os softwares contemplados aparecem como `UiBadge` somente leitura,
  derivados das chamadas; sem itens, a lista não é exibida (só a nota de preenchimento
  automático). Em seguida, **Informações de Cadastro** (só na edição).
- **Sem seleção manual de softwares:** o formulário não tem `UiCheckboxGroup`; os softwares são
  preenchidos quando os itens são lançados em "Lançar as Chamadas".
- **Validação** (cliente, regras puras `validarEscopo`): nome obrigatório (≤255), versão
  obrigatória (≤50), ano inteiro 1900–2100, quatro datas civis válidas, `dataFinal >= dataInicio`
  e status do domínio. Softwares não entram na validação porque não são digitados. Erro no campo e
  **foco no primeiro erro**.
- Salvar chama `adicionar` (novo) ou `atualizar` (edição) do modelo em memória, fecha com
  `toast.success`; o código é preservado na edição.

### 3.8 `Publicar.vue` / `Arquivar.vue` / `Exclusao.vue`

- `UiModal size="sm"` de apresentação pura; emitem `confirmar` e a página chama o modelo.
- **Publicar:** define `status = 'Publicado'` e `dataPublicacao = hoje` (ISO local).
- **Arquivar:** define `arquivada = true` (mock); avisa que o escopo sai da listagem/KPIs, que
  nenhum dado é apagado e que escopos arquivados não podem ser excluídos.
- **Exclusao:** mostra código, nome, versão/ano, `itensCount` e os softwares **quando houver**;
  avisa que é irreversível. Só é aberta quando não há itens; o cartão também desabilita o ícone com
  o motivo.

### 3.9 `gerarPdfEscopoProjetos.ts`

- jsPDF A4 paisagem + autotable sobre o conjunto filtrado: cabeçalho com a logomarca de login
  (quando houver), título "Relatório de Escopo de Projetos", data de geração, contagem, colunas
  Código, Nome, Versão, Ano, Status, Período, Softwares e Visualizações, e rodapé "Página X de Y"
  · "Publications · Escopo de Projetos". Arquivo: `escopo-projetos.pdf`.

### 3.10 `validadores.ts` e `useEscopoProjetosModelo.ts`

- **`validadores.ts`** (puro, sem Nuxt/Vue): tipos (`ProjetoEscopoModelo`, `ItemProjeto`,
  `StatusEscopo`, `FiltrosEscopo`, `KpisEscopo`, `CampoEscopo`), `STATUS_ESCOPO`,
  `SOFTWARES_MOCK`, `VARIANTE_POR_STATUS`, `formatarData`, `formatarDataHora`,
  `formatarPeriodo`, `formatarNumero`, `softwaresTexto`, `gerarCodigo`, `proximoCodigo`,
  `ehDataIso`, `hojeIso`, `validarEscopo`, `motivoBloqueioExclusao`, `podeExcluir`,
  `filtrarEscopos`, `buscarEscopos`, `calcularKpis`, `codigoDoSoftware` e `softwaresDosItens`.
- **`useEscopoProjetosModelo.ts`:** estado `useState` (`escopos`, `itensPorProjeto`, `filtros`,
  `busca`), derivados (`escoposComSoftwares`, `escoposFiltrados`, `escoposVisiveis`, `kpis`,
  `filtrosAtivosCount`, `opcoes`) e ações síncronas (`adicionar`, `atualizar`, `publicar`,
  `arquivar`, `excluir`, `itensDoProjeto`, `softwaresDoEscopo`). Reexporta os tipos e helpers de
  `validadores.ts`.
- **Kit:** nenhum componente novo do design system foi necessário — o kit existente cobre a
  tela (registrado conforme a tarefa 3.5).

## 4. Contrato de dados mock

O shape espelha o que a futura API deve devolver (nomes de campo em camelCase no frontend):

```ts
interface ProjetoEscopoModelo {
  id: string
  codigo: string                  // PE-2026.01 (gerado no mock)
  nome: string
  versao: string                  // v2026.1
  ano: number
  dataInicio: string              // AAAA-MM-DD
  dataFinal: string               // AAAA-MM-DD
  dataPrevisao: string            // AAAA-MM-DD
  dataPublicacao: string          // AAAA-MM-DD
  status: 'Em Andamento' | 'Homologação' | 'Concluído' | 'Publicado'
  softwaresContemplados: string[] // DERIVADO dos itens (códigos SFT-001..SFT-006)
  descricaoGeral: string
  totalVisualizacoes: number
  itensCount: number              // derivado dos itens em memória
  arquivada: boolean              // SOMENTE mock (não existe no schema)
  criadoEm: string                // ISO 8601
  atualizadoEm: string            // ISO 8601
}
```

- **Código:** `PE-<ano>.<sequencial>` com dois dígitos (`PE-2026.01`). `proximoCodigo` varre os
  códigos existentes do mesmo ano ao incluir.
- **Softwares:** catálogo mock `SOFTWARES_MOCK` (`SFT-001` Teorema ERP, `SFT-002` Teorema WMS,
  `SFT-003` Teorema Backup, `SFT-004` Portal do Cliente, `SFT-005` Teorema Mobile, `SFT-006`
  Integrações). O formulário **não** grava softwares: `softwaresDosItens` mapeia o nome de cada
  chamada para o código e devolve os distintos; o card, o PDF e a edição exibem as descrições.
- **Datas:** strings civis `AAAA-MM-DD`; o `UiDatePicker` recebe `Date` e o formulário converte
  sem deslocamento de fuso.
- **Filtros:** `status`, `ano` (string), `versao` e `software`; vazio = todos. A base sempre
  exclui `arquivada`.
- **KPIs:** contam o conjunto **filtrado** (`filtrarEscopos`, antes da busca textual).
- **Validação:** `validarEscopo` devolve `{ valido, erros, primeiroErro }`; o formulário usa
  `erros` por campo e foca o primeiro. Softwares não são validados (não há seleção manual).
- **Softwares contemplados:** derivados por `softwaresDosItens(itens)` no modelo; a lista é
  recalculada em `escoposComSoftwares` e só é exibida quando o escopo tem itens.
- **Guarda de exclusão:** `motivoBloqueioExclusao` bloqueia arquivado e `itensCount > 0`.

### Rotas e permissões previstas (API futura)

| Ação | Método e rota | Permissão |
|---|---|---|
| Listar | `GET /api/escopo-projetos` | `escopo-projetos`/`visualizar` |
| Incluir | `POST /api/escopo-projetos` | `escopo-projetos`/`criar` |
| Editar | `PUT /api/escopo-projetos/:id` | `escopo-projetos`/`alterar` |
| Publicar | `PUT /api/escopo-projetos/:id/publicar` | `escopo-projetos`/`publicar` |
| Arquivar | `PUT /api/escopo-projetos/:id/arquivar` | `escopo-projetos`/`arquivar` |
| Excluir | `DELETE /api/escopo-projetos/:id` | `escopo-projetos`/`excluir` |
| Itens | `GET /api/escopo-projetos/:id/itens` | `escopo-projetos`/`visualizar` |
| Exportar | `GET /api/escopo-projetos?exportar=1` | `escopo-projetos`/`exportar` |
| Importar | `POST /api/escopo-projetos/importar` | `escopo-projetos`/`importar` |

> Hoje **nenhuma** dessas rotas existe: a UI é local e o ícone de importação é inerte.

## 5. Fluxos

- **Listagem:** seed síncrono; cards ordenados por ano (desc) e nome; busca/filtros/paginação
  no cliente.
- **Filtros:** o modal refina o conjunto vigente (Status, Ano, Versão, Software); "Aplicar"
  recalcula grade e KPIs; "Limpar Filtros" restaura; o badge conta os filtros ativos.
- **Novo:** abre com status `Em Andamento`; salvar gera o código `PE-<ano>.<seq>`, inclui no topo
  e emite `toast.success`.
- **Editar:** resolve o registro por `id`, abre preenchido (Código e carimbos somente leitura) e
  preserva o código ao salvar.
- **Itens:** ícone do card abre o modal somente leitura com os itens do projeto (ou o estado
  vazio).
- **Publicar:** confirmação → status `Publicado` + `dataPublicacao` de hoje.
- **Arquivar:** confirmação → `arquivada = true`; some da grade e dos KPIs; os itens continuam
  no dataset e o escopo não pode ser excluído.
- **Excluir:** habilitado só sem itens; confirmação → remove o escopo e o mapa de itens.
- **Exportações:** menu "Relatórios" gera CSV (`;`, BOM, neutralização) e PDF do conjunto
  filtrado.
- **Recarga:** o `useState` reinicia no F5 (mock) — não há persistência.

## 6. Navegação e RBAC

- O item **Escopo de Projetos** da sessão **Publicações** da sidebar
  (`app/config/navigation.ts`, ícone `ClipboardList` `#50a1ff`) declara
  `to: '/admin/escopo-projetos'` e fica ativo na rota (`aria-current="page"`).
- A rota fica sujeita à guarda de sessão (`app/middleware/auth.global.ts`); sem sessão →
  `/admin/login?redirect=`.
- A matriz do módulo `escopo-projetos` já existe no catálogo RBAC: `visualizar`, `criar`,
  `alterar`, `excluir`, `publicar`, `arquivar`, `download`, `exportar`, `importar`, `filtrar` e
  `buscar`. **Não há `visualizar_itens`** — o ícone de itens usa `visualizar` (somente leitura).
- Gates da UI:
  - Cabeçalho: "Novo Escopo" (`criar`), "Relatórios" (`exportar`).
  - Grade: busca (`buscar`), Import (`importar`), Filtros (`filtrar`).
  - Card: Itens (`visualizar`), Editar (`alterar`), Excluir (`excluir`), Publicar (`publicar`),
    Arquivar (`arquivar`).
- **Auditoria:** não há registros nesta fase (ações em memória); a futura API deve mapear o
  recurso "Escopo de Projetos".

## 7. Dataset em memória

- **`escopos`:** 9 registros (`esc-2026-01`…`esc-2023-01`), sendo 8 vigentes e 1 arquivado
  (`PE-2023.01`). Cobre os quatro status, anos 2023–2026, versões e softwares variados.
- **`itensPorProjeto`:** 11 itens distribuídos entre 2026.01 (3), 2026.02 (2), 2026.03 (1),
  2025.01 (2), 2025.03 (1) e 2024.01 (2). `itensCount` e `softwaresContemplados` são derivados
  desse mapa (não há seleção manual de softwares).
- **Chaves `useState`:** `escopo-projetos-base`, `escopo-projetos-itens`,
  `escopo-projetos-filtros` e `escopo-projetos-busca`.
- **Ações:** `adicionar` gera `id` (UUID quando disponível) e código; `atualizar` preserva
  `codigo`/`itensCount`/`arquivada` e troca `atualizadoEm`; `publicar` e `arquivar` marcam o
  registro; `excluir` remove o escopo e seus itens.
- **Reset:** F5 reinicia o seed — comportamento esperado e declarado nesta fase.

## 8. Itens do projeto e importação

- **Itens:** somente leitura no modal `xl` com `UiDataTable`; o CRUD de `entregas_itens` pertence
  ao módulo "Lançar as Chamadas". A contagem (`itensCount`) bloqueia a exclusão do escopo e os
  softwares das chamadas preenchem os softwares contemplados do escopo.
- **Importação:** o ícone `Import` da toolbar é uma **affordance inerte** (sem handler) até a
  fase backend. Não abre modal nem dispara requisição.
- **Exportação:** PDF/CSV são gerados no cliente sobre o conjunto filtrado; não há guarda remota
  nesta fase (a permissão é checada na UI).

## 9. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) — `UiEntityCard`, `UiKpi`, `UiBadge`,
  `UiActionMenu`, `UiModal`, `UiPagination`; vitrine `/design`.
- Arquitetura/base: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md) §4.6;
  Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md) §11.
- Módulos-molde: [`docs/11`](11%20-%20Módulo%20de%20Parceiros.md) (cards/grade/PDF) e
  [`docs/13`](13%20-%20Módulo%20de%20Manuais%20Mensais.md) (itens em modal, publicar/arquivar).
- Banco: [`docs/bd/01`](bd/01%20-%20banco_dados_mariadb.sql) (`projetos_escopo`,
  `entregas_itens`).

## 10. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes unitários: `tests/escopo-projetos-validadores.test.ts` cobre obrigatórios, ordem de
  datas, ano, código único, filtros, KPIs, busca, derivação de softwares e guarda de exclusão.
- Conferência manual em `http://localhost:3000/admin/escopo-projetos`: cards, busca, filtros,
  paginação, novo, editar, publicar, arquivar, excluir (guarda), itens em modal, PDF/CSV, ícone
  de importação inerte e reset no F5.
- Regressão: `/design` e telas que usam `UiEntityCard`/`UiPagination`/`UiActionMenu` (Parceiros,
  Release Week, Manuais).
- `openspec validate "construir-escopo-projetos-frontend"`.

## 11. Pendências e próximos passos

- **Backend:** migrations para a coluna `arquivada` (hoje só mock) e API `/api/escopo-projetos/**`
  com RBAC, validação e auditoria, substituindo o seed.
- **Itens:** CRUD de `entregas_itens` no módulo "Lançar as Chamadas"; a leitura aqui passa a
  consumir `GET /:id/itens`.
- **Importação:** implementar o modal/parser quando a API existir (o ícone já está posicionado).
- **Área Pública:** exposição dos escopos publicados (fora deste módulo).
- **Softwares:** trocar `SOFTWARES_MOCK` pelo catálogo real de `softwares` quando a tela passar
  a usar a API; o backend deve derivar `softwares_contemplados` dos itens (não aceitar seleção
  manual).
- **Exportação:** manter no cliente ou mover para o servidor (decisão futura), com guarda
  `exportar` na API.
