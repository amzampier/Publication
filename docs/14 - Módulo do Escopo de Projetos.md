# 14 - Módulo do Escopo de Projetos — Área Administrativa

**Versão:** 2.0.0 — **Data:** 2026-10-20 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela e **backend** do módulo **Escopo de Projetos** — catálogo de escopos anuais,
quatro KPIs, cards, busca, filtros, paginação, cadastro/edição, publicar/arquivar, exclusão
condicionada, itens em modal somente leitura, exportações PDF/CSV e **importação XLSX de escopos**.
A persistência é real em `projetos_escopo`; **não existe seed** e o módulo nasce vazio.
**Arquivos-fonte:** [`app/pages/admin/escopo-projetos.vue`](../app/pages/admin/escopo-projetos.vue) ·
[`app/components/escopo-projetos/`](../app/components/escopo-projetos) ·
[`shared/escopo-projetos.ts`](../shared/escopo-projetos.ts) ·
[`server/utils/escopo-projetos.ts`](../server/utils/escopo-projetos.ts) ·
[`server/api/escopo-projetos/`](../server/api/escopo-projetos) ·
[`docs/modelos/modelo-importacao-escopo-projetos.xlsx`](modelos/modelo-importacao-escopo-projetos.xlsx)
**Design system:** [`/design`](../app/pages/design.vue) — `UiEntityCard`, `UiKpi`, `UiBadge`,
`UiActionMenu`, `UiModal`, `UiModalSection`, `UiInput`, `UiSelect`, `UiDatePicker`,
`UiSegmented`, `UiTextarea`, `UiPagination`, `UiDataTable`, `UiUploadFiles`, `UiLoading`,
`UiTooltip` e `UiButton`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md)
**Autoridade de comportamento:** `openspec/specs/escopo-projetos` (delta
`escopo-projetos-backend-e-importacao`)

> Este documento é a referência da tela `/admin/escopo-projetos` e da API. Em caso de divergência
> com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados (API)](#4-contrato-de-dados-api)
5. [Fluxos](#5-fluxos)
6. [Navegação, RBAC e auditoria](#6-navegação-rbac-e-auditoria)
7. [Importação XLSX](#7-importação-xlsx)
8. [Itens do projeto](#8-itens-do-projeto)
9. [Documentação relacionada](#9-documentação-relacionada)
10. [Verificação](#10-verificação)
11. [Pendências e próximos passos](#11-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

- **Rota:** `/admin/escopo-projetos` → `app/pages/admin/escopo-projetos.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Modelo:** `projetos_escopo` — `id`, `codigo`, `nome`, `versao`, `ano`, `data_inicio`,
  `data_final`, `data_previsao`, `data_publicacao`, `status` (`Em Andamento` | `Homologação` |
  `Concluído` | `Publicado`), `softwares_contemplados` (JSON), `descricao_geral`,
  `total_visualizacoes`, `arquivada`, `criado_em` e `atualizado_em`.
- **Softwares contemplados:** não são digitados no escopo. A API deriva os **nomes distintos** dos
  itens de `entregas_itens` — pela junção `entregas_itens_softwares` (todos os softwares da chamada),
  com fallback para `software_id`/`softwares` (texto do item) em registros legados — e o
  JSON `softwares_contemplados` é gravado como `[]`.
- **Itens:** vivem em `entregas_itens` (`projeto_id`), são somente leitura nesta tela e alimentam
  `itensCount` e os softwares.
- **Vínculo com chamadas:** ao lançar uma chamada vinculada a este escopo, ele passa automaticamente
  para `Homologação` (inclusive se estava `Concluído`/`Publicado`). A Área Pública só exibe o escopo
  quando o status é `Publicado`.
- **Sem seed:** a migration 23 só altera o schema; o primeiro acesso exibe a grade vazia.
- **Persistência:** criar/editar/publicar/arquivar/excluir/importar gravam no banco e sobrevivem ao
  F5.
- **Componentização:** a página é fina e dona da coordenação; cada parte é um componente em
  `app/components/escopo-projetos/` (auto-import com prefixo `EscopoProjetos*`).

## 2. Estrutura da página (componentização)

```
admin/escopo-projetos.vue                            (page - definePageMeta + composição + coordenação)
├── <UiLoading v-if="carregando" />                  → overlay do primeiro GET (F5 incluso)
├── <EscopoProjetosCabecalho @novo />                → tile ClipboardList #50a1ff + título + "Relatórios" + "Novo Escopo"
├── <EscopoProjetosKpis class="mt-6" />              → 4 UiKpi do conjunto VIGENTE
├── <EscopoProjetosGrade
│       @editar @excluir @publicar @arquivar
│       @ver-itens @importar @open-filters />         → busca + Import + Filtros + grade de cards + UiPagination
├── <EscopoProjetosFiltros v-model="filtrosAbertos" /> → modal (Status, Ano, Versão, Software)
├── <EscopoProjetosFormulario v-model :modo :escopo /> → cadastro/edição pela API
├── <EscopoProjetosItens v-model :escopo />          → itens lazy em modal xl com UiDataTable
├── <EscopoProjetosExclusao v-model :escopo @confirmar /> → confirmação de exclusão (condicionada)
├── <EscopoProjetosPublicar v-model :escopo @confirmar /> → confirmação de publicação
├── <EscopoProjetosArquivar v-model :escopo @confirmar /> → confirmação de arquivamento
└── <EscopoProjetosImportar v-model="importarAberto" /> → upload .xlsx + preview + commit
```

- **Estado de coordenação:** `carregando` local (nasce `true` no F5), `filtrosAbertos`,
  `modalAberto`/`modo`/`escopoEditar`, `itensAberto`/`escopoItens`,
  `exclusaoAberta`/`escopoExcluir`, `publicarAberto`/`escopoPublicar`,
  `arquivarAberto`/`escopoArquivar` e `importarAberto`.
- **Loading:** `onMounted` chama `carregarEscopos()`; o overlay `UiLoading` ("Carregando escopos…")
  cobre o `GET /api/escopo-projetos` e permanece no SSR/F5 até a resposta. Em falha, toast de erro e
  grade vazia.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8`.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<EscopoProjetosCabecalho>`

- Tile `bg-brand-primary` com `ClipboardList` em `#50a1ff`, título "Escopo de Projetos" e
  subtítulo "Catálogo de escopos anuais — versão, período, softwares e situação."
- **Botão "Novo Escopo"** (`UiButton` primary + `Plus`): emite `@novo`; gated por `criar`.
- **Menu "Relatórios"** (`NotebookText` + `ChevronDown`): "Listagem em PDF" e "Exportar em CSV" do
  conjunto filtrado, gated por `exportar`. Antes de gerar, chama `GET /api/escopo-projetos?exportar=1`
  para a guarda server-side; falha → toast e nenhum arquivo.
- **CSV:** separador `;`, BOM UTF-8 e neutralização de fórmulas (`=`, `+`, `-`, `@`, tab, CR).

### 3.2 `Kpis.vue` → `<EscopoProjetosKpis>`

- Quatro `UiKpi` do **conjunto vigente** (filtrado): **Em Andamento** (`#0364f7`, `Clock`),
  **Homologação** (`#7c3aed`, `Search`), **Concluído** (`#1a9e07`, `CheckCircle2`) e
  **Publicado** (`#112051`, `Rocket`).
- Arquivados não são retornados pela API e não entram na contagem.

### 3.3 `Card.vue` → `<EscopoProjetosCard>`

- `UiEntityCard` com **código**, **status** (`UiBadge`), **nome**, **versão** (subtítulo) e as
  linhas **Ano**, **Período** (`dd/mm/aaaa a dd/mm/aaaa`), **Itens vinculados** (`itensCount`) e
  **Visualizações** (pt-BR). O card não exibe softwares.
- **Badge:** `Em Andamento`→`aberta`, `Homologação`→`inReview`, `Concluído`→`done`,
  `Publicado`→`publicado`.
- **Ações no hover/foco:**
  - **Itens** (`ListChecks`): gated por `visualizar`; abre o modal somente leitura.
  - **Editar** (`Pencil`): gated por `alterar`.
  - **Excluir** (`Trash2`): gated por `excluir`; desabilitado com motivo quando há itens
    (`itensCount > 0`) ou quando arquivado (não aparece na grade).
  - **`UiActionMenu`:** **Publicar** (`Send`, gated por `publicar`; desabilitado quando já
    `Publicado`, com motivo) e **Arquivar** (`Archive`, gated por `arquivar`).

### 3.4 `Itens.vue` → `<EscopoProjetosItens>`

- `UiModal size="xl"` **somente leitura**, aberto pelo ícone do card. **Não há rota/página** de
  itens; o CRUD pertence a "Lançar as Chamadas".
- Carrega `GET /api/escopo-projetos/:id/itens` **sob demanda**, com estados de carregamento, erro
  (com "Tentar novamente") e vazio ("Nenhum item vinculado a este projeto.").
- `UiDataTable` com **Chamada, Título, Software, Módulo, Tipo, Impacto, Status e Data de
  liberação**; busca, agrupamento em até três níveis, ordenação multi-coluna, redimensionamento,
  paginação e totalizadores. Status em `UiBadge`: `Revisar`→`pending`, `Aprovado`→`reconciled`,
  `Publicar`→`done`.

### 3.5 `Grade.vue` → `<EscopoProjetosGrade>`

- Painel branco com tile `ClipboardList`, título "Escopo de Projetos" e subtítulo "Catálogo de
  escopos anuais, versões e softwares contemplados".
- **Busca** client-side (`buscar`) sobre código, nome, versão, ano, descrição e softwares.
- **Import** (`Import`): abre o modal de importação; gated por `importar`.
- **Filtros** (`Funnel`): abre o modal; badge com a quantidade de filtros ativos; gated por
  `filtrar`.
- **Grade responsiva** `sm:grid-cols-2 xl:grid-cols-3` de `Card`; estado vazio diferencia "nenhum
  resultado para o filtro" de "nenhum escopo cadastrado".
- **Paginação** (`UiPagination`, 6/12/18/24, padrão 6) sobre o conjunto filtrado.

### 3.6 `Filtros.vue` → `<EscopoProjetosFiltros>`

- `UiModal size="md"` com **Status, Ano, Versão e Software** (`UiSelect`; vazio = todos) e os
  botões "Limpar Filtros", "Cancelar" e "Aplicar".
- Rascunho isolado que espelha o estado vigente ao abrir; "Aplicar" reflete na grade e nos KPIs;
  "Limpar Filtros" zera rascunho e estado. As opções de software vêm dos nomes derivados da API.

### 3.7 `Formulario.vue` → `<EscopoProjetosFormulario>` (novo/edição)

- `UiModal size="lg"` com **Dados do Escopo** (Nome; Versão; Ano; Status em `UiSegmented`),
  **Cronograma** (quatro `UiDatePicker`), **Descrição** (`UiTextarea`) e **Informações de Cadastro**
  (só na edição).
- **Novo:** status `Em Andamento`, ano atual, datas vazias, sem softwares. O código não é digitado;
  o servidor gera `PE-<ano>.<seq>`.
- **Editar:** código somente leitura (`mono`), softwares contemplados em `UiBadge` somente leitura
  (nomes da API) quando há itens.
- **Validação:** nome (≤255), versão (≤50), ano 1900–2100, quatro datas civis,
  `dataFinal >= dataInicio`, status do domínio e unicidade `(ano, versao)`. Erro no campo e foco no
  primeiro problema.
- Salvar chama `POST /api/escopo-projetos` ou `PUT /api/escopo-projetos/:id`; `400/409` são
  mapeados para `data.erros` e focam o primeiro campo; sucesso fecha o modal com `toast.success`.

### 3.8 `Publicar.vue` / `Arquivar.vue` / `Exclusao.vue`

- `UiModal size="sm"` de apresentação pura; emitem `confirmar` e a página chama a API.
- **Publicar:** status `Publicado` + `data_publicacao` atual.
- **Arquivar:** `arquivada = 1`; some da grade/KPIs sem apagar dados ou itens; escopo arquivado não
  pode ser excluído.
- **Exclusao:** mostra código, nome, versão/ano, itens e softwares quando houver; avisa que é
  irreversível. Só abre sem itens; a API reaplica a guarda (`409`).

### 3.9 `gerarPdfEscopoProjetos.ts`

- jsPDF A4 paisagem + autotable sobre o conjunto filtrado: logo de login (quando houver), título
  "Relatório de Escopo de Projetos", data/contagem, colunas Código, Nome, Versão, Ano, Status,
  Período, Softwares e Visualizações, rodapé "Página X de Y" · "Publications · Escopo de Projetos".
  Arquivo: `escopo-projetos.pdf`.

### 3.10 `Importar.vue` + `lerPlanilhaEscopoProjetos.ts`

- `UiModal size="lg"` aberto pelo ícone da toolbar: upload `.xlsx`, pré-visualização em
  `UiDataTable` (Nome, Versão/Ano, Status, Publicação e Resultado), seleção das linhas prontas e
  commit em `POST /api/escopo-projetos/importar`.
- Parser puro (`classificarLinhasEscopoProjetos`) com `exceljs` carregado dinamicamente; normaliza
  datas do Excel/`dd/mm/aaaa`; a classificação é `pronto` / `já cadastrado` / `repetido` /
  `inválido`.

### 3.11 `validadores.ts`, `shared/escopo-projetos.ts` e `useEscopoProjetosModelo.ts`

- **`shared/escopo-projetos.ts`:** tipos (`ProjetoEscopoModelo`, `EntradaEscopo`,
  `ItemProjeto`, `StatusEscopo`, `FiltrosEscopo`, `KpisEscopo`), `STATUS_ESCOPO`,
  `VARIANTE_POR_STATUS`, `chaveAnoVersao`, validação, `gerarCodigo`, `proximoCodigo`,
  `formatarData`, `formatarDataHora`, `formatarPeriodo`, `formatarNumero`, `softwaresTexto`,
  `ehDataIso`, `hojeIso`, `motivoBloqueioExclusao`, `podeExcluir`, `filtrarEscopos`,
  `buscarEscopos` e `calcularKpis`.
- **`app/components/escopo-projetos/validadores.ts`:** reexporta `#shared/escopo-projetos`.
- **`useEscopoProjetosModelo.ts`:** `useState` (`escopos`, `carregando`, `carregado`,
  `itensPorProjeto`, `itensCarregando`, `itensErro`, `filtros`, `busca`), derivados e ações
  assíncronas (`carregarEscopos`, `carregarItens`, `adicionar`, `atualizar`, `publicar`, `arquivar`,
  `excluir`, `importar`). **Sem seed.**

## 4. Contrato de dados (API)

```ts
interface ProjetoEscopoModelo {
  id: string
  codigo: string                  // PE-2026.01 (gerado pelo servidor)
  nome: string
  versao: string
  ano: number
  dataInicio: string              // AAAA-MM-DD
  dataFinal: string
  dataPrevisao: string
  dataPublicacao: string
  status: 'Em Andamento' | 'Homologação' | 'Concluído' | 'Publicado'
  softwaresContemplados: string[] // nomes distintos derivados dos itens
  descricaoGeral: string
  totalVisualizacoes: number
  itensCount: number              // COUNT de entregas_itens
  arquivada: boolean
  criadoEm: string
  atualizadoEm: string
}
```

**Rotas e permissões** (`requirePermission` em todas):

| Ação | Método e rota | Permissão |
|---|---|---|
| Listar | `GET /api/escopo-projetos` | `visualizar` |
| Exportar | `GET /api/escopo-projetos?exportar=1` | `exportar` |
| Criar | `POST /api/escopo-projetos` | `criar` |
| Editar | `PUT /api/escopo-projetos/:id` | `alterar` |
| Publicar | `PUT /api/escopo-projetos/:id/publicar` | `publicar` |
| Arquivar | `PUT /api/escopo-projetos/:id/arquivar` | `arquivar` |
| Excluir | `DELETE /api/escopo-projetos/:id` | `excluir` |
| Itens | `GET /api/escopo-projetos/:id/itens` | `visualizar` |
| Importar | `POST /api/escopo-projetos/importar` | `importar` |

- **Código:** `PE-<ano>.<sequencial>` gerado no create/import; **imutável** na edição.
- **Unicidade:** `(ano, versao)`; duplicidade → `409` com `data.erros.versao`.
- **Datas:** strings civis `AAAA-MM-DD`; as quatro são obrigatórias (schema `NOT NULL`).
- **Publicar:** status `Publicado` + data atual.
- **Arquivar:** soft delete (`arquivada = 1`); a listagem filtra arquivados.
- **Excluir:** `409` quando arquivado ou com itens em `entregas_itens`.
- **Softwares:** derivados na leitura; JSON `softwares_contemplados` recebe `[]`.
- **Auditoria:** recurso **"Escopo de Projetos"**; inclusão, alteração, homologação e exclusão.
- **Sem seed:** nenhuma rota/migration cria escopo de demonstração.

**Migration 23:** `arquivada`, `idx_projetos_arquivada` e `uk_projetos_ano_versao` (sem `INSERT`).

## 5. Fluxos

- **Listagem:** `GET /api/escopo-projetos` no `onMounted`; `UiLoading` cobre o F5; falha → toast e
  lista vazia.
- **Filtros:** modal refina o conjunto; "Aplicar" recalcula grade/KPIs; "Limpar" restaura.
- **Novo:** formulário valida, `POST` gera código e persiste; toast e fechamento.
- **Editar:** `PUT` preserva código; conflito `409` no campo.
- **Itens:** ícone abre o modal; `GET /:id/itens` sob demanda, com loading/erro/vazio.
- **Publicar:** confirmação → `PUT /publicar` (status + data atual).
- **Arquivar:** confirmação → `PUT /arquivar`; some da grade/KPIs sem apagar itens.
- **Excluir:** confirmação → `DELETE`; guarda de itens/arquivamento na API.
- **Exportações:** menu "Relatórios" valida `exportar` na API e gera CSV/PDF do conjunto filtrado.
- **Importação:** ver §7.
- **Recarga:** rebusca a API; dados persistem.

## 6. Navegação, RBAC e auditoria

- Item **Escopo de Projetos** na sessão **Publicações** (`ClipboardList`, `#50a1ff`) com
  `to: '/admin/escopo-projetos'` e `aria-current="page"`.
- A rota exige sessão (`app/middleware/auth.global.ts`); sem sessão → `/admin/login?redirect=`.
- Gates da UI: Cabeçalho (`criar`/`exportar`), Grade (`buscar`/`importar`/`filtrar`), Card
  (`visualizar`/`alterar`/`excluir`/`publicar`/`arquivar`).
- A mesma matriz é aplicada na API. **Não há `visualizar_itens`**; itens usam `visualizar`.
- Auditoria: recurso "Escopo de Projetos" (`Inclusão`, `Alteração`, `Homologação`, `Exclusão`).

## 7. Importação XLSX

- **Modelo:** [`docs/modelos/modelo-importacao-escopo-projetos.xlsx`](modelos/modelo-importacao-escopo-projetos.xlsx).
- **Colunas:** Nome, Versão, Ano, Data de Início, Data Final, Data de Previsão, Data de Publicação,
  Status, Descrição Geral. **Sem Código, softwares ou itens.**
- **Fluxo:** o ícone da toolbar abre `EscopoProjetosImportar`; o parser local classifica as linhas
  (`pronto`/`já cadastrado`/`repetido`/`inválido`); o commit vai a
  `POST /api/escopo-projetos/importar`, que revalida tudo, recusa o lote inteiro se houver qualquer
  linha inválida/conflitante e grava em **transação**.
- **Chave:** `(ano, versao)`, inclusive contra arquivados; limite de 500 linhas; linhas vazias são
  ignoradas. O código é gerado no servidor.
- **Datas:** aceita data do Excel, `dd/mm/aaaa` e `AAAA-MM-DD`.
- **Permissão:** `escopo-projetos`/`importar`.
- **Sem seed:** a importação é a carga inicial opcional; o módulo começa vazio.

## 8. Itens do projeto

- Somente leitura no modal `xl` com `UiDataTable`; o CRUD de `entregas_itens` pertence a "Lançar as
  Chamadas".
- `itensCount` bloqueia a exclusão do escopo e os softwares das chamadas preenchem os softwares
  contemplados. Sem itens, a lista fica vazia.

## 9. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) — `UiEntityCard`, `UiKpi`, `UiBadge`,
  `UiActionMenu`, `UiModal`, `UiDataTable`, `UiPagination`, `UiUploadFiles`, `UiLoading`.
- Arquitetura/base: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md) §4.6;
  Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md) §11; Auditoria:
  [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md) §6.2.
- Módulos-molde: [`docs/11`](11%20-%20Módulo%20de%20Parceiros.md),
  [`docs/12`](12%20-%20Módulo%20das%20Releases%20Week.md) e
  [`docs/13`](13%20-%20Módulo%20de%20Manuais%20Mensais.md).
- Banco: [`docs/bd/01`](bd/01%20-%20banco_dados_mariadb.sql) (`projetos_escopo`,
  `entregas_itens`).

## 10. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes: `tests/escopo-projetos-validadores.test.ts` (validação/identidade/filtros/KPIs/guarda) e
  `tests/escopo-projetos-import-parser.test.ts` (datas, repetição, já cadastrado, inválido).
- E2E/API: banco vazio, criar, editar, publicar, arquivar, excluir (guarda), itens, PDF/CSV,
  importação válida/inválida/duplicada, 401/403 e F5.
- Conferência manual: `http://localhost:3000/admin/escopo-projetos` — F5 com loading, criação,
  edição, itens, importação e recarga preservando os dados.
- Regressão: `/design`, Parceiros, Release Week e Manuais.

## 11. Pendências e próximos passos

- **Itens:** CRUD/importação de `entregas_itens` no módulo "Lançar as Chamadas"; a leitura aqui já
  consome a API.
- **Área Pública:** exposição dos escopos publicados (fora deste módulo).
- **Visualizações:** `total_visualizacoes` permanece 0 até a Área Pública existir.
- **Teste de concorrência:** validar a geração de código sob carga real; o índice único é a barreira.
- **Exportação:** manter no cliente ou mover para o servidor (decisão futura), com guarda
  `exportar` na API.
