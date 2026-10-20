# Design: construir-escopo-projetos-frontend

## Context

Ver `proposal.md - Why`. Estado relevante verificado no código:

- `projetos_escopo` já existe (`server/migration/01_create_tables.sql` §14) com `id`, `codigo`,
  `nome`, `versao`, `ano`, `data_inicio`, `data_final`, `data_previsao`, `data_publicacao`,
  `status` (4 valores), `softwares_contemplados` (JSON), `descricao_geral`, `total_visualizacoes` e
  timestamps. **Não há** coluna `arquivada`.
- O item **Escopo de Projetos** está na sidebar (`ClipboardList`, `#50a1ff`) sem `to`; o módulo RBAC
  `escopo-projetos` já tem as 11 funcionalidades (`visualizar`, `criar`, `alterar`, `excluir`,
  `publicar`, `arquivar`, `download`, `exportar`, `importar`, `filtrar`, `buscar`), sem
  `visualizar_itens` e sem `clonar`.
- `entregas_itens.projeto_id` referencia `projetos_escopo(id)` com `ON DELETE SET NULL`; a contagem
  de itens é a relação que deve bloquear a exclusão no mock.
- O molde visual é o módulo **Parceiros** (`docs/11`): cabeçalho, KPIs, grade de cards com
  `UiEntityCard` + `UiPagination`, filtros em modal, formulário, exclusão e exportações.
- O kit já tem `UiEntityCard`, `UiPagination`, `UiActionMenu`, `UiCheckboxGroup`, `UiDatePicker`,
  `UiTextarea`, `UiSegmented`, `UiSelect`, `UiKpi`, `UiBadge`, `UiModal`, `UiTooltip` e `UiLoading`.
- Não há spec prévia de `escopo-projetos`; a documentação `docs/02` ainda diz que
  `projetos_escopo` está sem UI/API.

## Goals / Non-Goals

**Goals:**
- Entregar a tela `/admin/escopo-projetos` completa no molde de Parceiros, com dataset mock em
  memória.
- Fixar o contrato visual e comportamental (campos, status, ações, filtros, formulário, itens).
- Reutilizar o kit existente; não criar componentes paralelos.
- Documentar a fase frontend no `docs/14`, com as pendências de backend.

**Non-Goals:**
- Backend/API, migration, seed de banco e persistência.
- Importação funcional (apenas o ícone).
- CRUD dos itens de `entregas_itens` (pertence a "Lançar as Chamadas").
- Anexos/uploads, Área Pública e fluxo de revisão.
- Coluna real `arquivada` (o arquivamento é apenas mock nesta fase).

## Decisions

### D1 — Listagem em grade de cards
A tela usa `UiEntityCard` + `UiPagination` (6 cards/página), com busca textual e filtros no cliente.
O card exibe `codigo`, `UiBadge` de status, `nome` (título), `versao` (subtítulo) e as linhas **Ano**,
**Período**, **Itens vinculados** (`itensCount`) e **Visualizações**. Softwares não aparecem no
card.

- **Por que:** o usuário pediu explicitamente o molde de Parceiros; a grade valoriza o escopo como
  entidade e não como linha de tabela.
- **Alternativa descartada:** `UiDataTable` — o módulo é de cards.

### D2 — Dataset mockado em memória
`useEscopoProjetosModelo` mantém `escopos` e `itens` em `useState`, semeados com exemplos no
primeiro acesso. Os softwares contemplados não são um estado editável: são derivados dos itens.
Todas as ações mutam esse conjunto; recarregar restaura o seed e nada vai ao banco.

- **Por que:** decisão do usuário para esta fase; permite exercitar todos os fluxos sem backend.
- **Dívida registrada:** na fase backend, o seed é substituído por `GET /api/escopo-projetos` e os
  itens por `entregas_itens` filtrados por `projeto_id`.

### D3 — Código gerado no mock
O mock gera `codigo = PE-<ano>.<sequencial>` (ex.: `PE-2026.01`), único, na inclusão; na edição o
código é somente leitura e imutável. O formulário não digita o código.

- **Por que:** o código é identidade; o mock precisa de uma regra determinística e o backend
  definirá a definitiva.
- **Alternativa descartada:** campo de código livre — o padrão `PE-D26.06a` do schema é uma
  referência visual, não uma regra de geração; deixar livre permite duplicidade e inconsistência.
- **Risco:** o backend pode adotar outro formato; isso fica documentado no `docs/14`.

### D4 — Publicar/Arquivar no `UiActionMenu`, arquivamento mock
O card tem **Itens**, **Editar** e **Excluir** como ícones inline e um `UiActionMenu` com
**Publicar** e **Arquivar**. Publicar altera para `Publicado` e preenche `dataPublicacao` com a data
atual (mock) e fica desabilitado quando já publicado. Arquivar marca `arquivada = true` no dataset
mock e remove o card da grade/KPIs, preservando dados e itens.

- **Por que:** o RBAC tem `publicar`/`arquivar` e o usuário pediu o menu com as opções.
- **Schema:** `projetos_escopo` não tem `arquivada`; a coluna real entra na fase backend. O mock
  antecipa o contrato e o `docs/14` registra a migration futura.
- **Alternativa descartada:** arquivar apenas por status — o fluxo editorial é outro; arquivar é
  soft e precisa sumir da lista sem apagar.

### D5 — Itens em modal somente leitura, sem rota
O ícone `ListChecks` do card abre um `UiModal size="xl"` com os itens do projeto em modo somente
leitura (Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status, Data de liberação) no
`UiDataTable` do kit. A grade oferece busca, agrupamento por até três níveis, ordenação
multi-coluna, redimensionamento, paginação e totalizadores. Não há rota/página nova. Sem itens, o
modal mostra o estado vazio. O ícone é gated por `visualizar` (única funcionalidade compatível; o
catálogo não tem `visualizar_itens`).

- **Por que:** o usuário quer visualizar e explorar os itens sem criar a tela do módulo de itens; o
  CRUD pertence a "Lançar as Chamadas".
- **Alternativa descartada:** expansão inline no card — a grade de cards não tem linha expansível e
  perderia o layout; o modal isola a leitura.
- **Alternativa descartada:** tabela HTML simples — o `UiDataTable` já entrega agrupamento,
  multi-sort, totalizadores e redimensionamento sem componente paralelo.

### D6 — Softwares contemplados derivados das chamadas
O formulário **não** oferece seleção de softwares. Os softwares contemplados são derivados dos
itens vinculados ao escopo: cada software distinto das chamadas vira um código do catálogo
`SOFTWARES_MOCK` (mapeado pelo nome) e a lista aparece, somente leitura, quando há pelo menos um
item. Sem itens, a linha/lista não aparece; o card e a exclusão também omitem a linha "Softwares".
O filtro por Software usa apenas os softwares presentes no conjunto.

- **Por que:** decisão do usuário — os softwares chegam quando as chamadas são lançadas em "Lançar
  as Chamadas"; não devem ser digitados no escopo.
- **Alternativa descartada:** `UiCheckboxGroup` manual — contraria a regra de negócio e permitiria
  divergência entre o escopo e as chamadas.
- **Dívida:** o mapeamento nome → código usa o catálogo mock; o backend derivará dos itens reais.

### D7 — Quatro KPIs e filtros Status/Ano/Versão/Software
Quatro `UiKpi` (Em Andamento, Homologação, Concluído, Publicado) sobre o conjunto filtrado. Filtros em
modal com Status, Ano, Versão e Software; busca textual; contador no badge. Paginação no cliente.

- **Por que:** os quatro status são o domínio; ano/versão/software são os eixos de navegação úteis.
- **Alternativa descartada:** KPI de total — os quatro status já cobrem o conjunto.

### D8 — Formulário e validação
`UiModal size="lg"` com seções **Dados do Escopo** (código somente leitura na edição, nome, versão,
ano, status), **Cronograma** (quatro `UiDatePicker`), **Descrição** (`UiTextarea`, com a lista
somente leitura de softwares quando houver itens) e **Informações de Cadastro** (só na edição).
Validação no cliente: nome/versão/ano, quatro datas obrigatórias, `dataFinal >= dataInicio` e
unicidade do código; foco no primeiro erro. Softwares não entram na validação porque não são
digitados.

- **Por que:** replica a consistência dos demais módulos e cobre o schema.
- **Alternativa descartada:** validação só no backend — não há backend nesta fase.

### D9 — Exportações PDF/CSV no cliente
Menu "Relatórios" no cabeçalho com PDF (`gerarPdfEscopoProjetos.ts`) e CSV (`;`, BOM UTF-8,
neutralização de fórmulas) do conjunto filtrado, com Código, Nome, Versão, Ano, Status, Período,
Softwares e Visualizações. Gated por `exportar`.

### D10 — Importação apenas affordance
O ícone `Import` fica à esquerda de "Filtros", gated por `importar`, mas não abre modal, não lê
planilha e não dispara requisição. O `docs/14` registra a pendência.

### D11 — Nenhum componente novo no kit
`UiEntityCard`, `UiActionMenu`, `UiModal`, `UiDataTable`, `UiDatePicker`, `UiPagination`, `UiKpi`,
`UiBadge`, `UiSegmented`, `UiSelect`, `UiTextarea`, `UiTooltip` e `UiLoading` cobrem o módulo. Se
algum detalhe exigir componente novo, ele entra em `docs/01` e na vitrine `/design` no mesmo
change.

### D12 — Documentação
Novo `docs/14 - Módulo do Escopo de Projetos.md`, no molde dos docs 11/12/13. Atualizar `docs/03`
(rota da sidebar) e `docs/02` (UI frontend em memória; API pendente). Nenhuma mudança em
`docs/07`/`docs/bd`/`docs/01`/`/design`.

### D13 — RBAC de interface
A tela usa `.can('escopo-projetos', ...)` para Editar (`alterar`), Excluir (`excluir`), Publicar
(`publicar`), Arquivar (`arquivar`), Exportar (`exportar`), Importar (`importar`) e
Filtros/Busca. O ícone de Itens usa `visualizar`. Nenhuma funcionalidade nova de RBAC é criada.

## Risks / Trade-offs

- [Arquivar sem coluna real] → mock `arquivada`; `docs/14` registra a migration necessária na fase
  backend.
- [Código mock divergir do backend] → formato documentado; o backend poderá adotar outra regra sem
  quebrar a tela (o código é gerado/read-only).
- [Softwares derivados por nome] → o mapeamento nome → código usa `SOFTWARES_MOCK`; o backend
  derivará dos itens reais do catálogo `softwares`.
- [Itens somente leitura] → o CRUD fica em "Lançar as Chamadas"; o `UiDataTable` do modal permite
  explorar/agrupar/ordenar, mas não editar.
- [Dataset em memória some no F5] → esperado e documentado no `docs/14`.
- [Sem backend, a validação é só de cliente] → coberta por testes dos validadores; a fase backend
  reaplicará no servidor.
- [Modal de itens em card] → usa `UiModal` com tabela simples; sem rota nova e sem alterar o shell.

## Migration Plan

Sem migration de banco (fase frontend). Ordem:
1. `useEscopoProjetosModelo.ts` + `validadores.ts` + testes.
2. Componentes (`Cabecalho`, `Kpis`, `Card`, `Grade`, `Itens`, `Filtros`, `Formulario`,
   `Publicar`, `Arquivar`, `Exclusao`, `gerarPdfEscopoProjetos.ts`).
3. Página + navegação.
4. `docs/14`, `docs/03`, `docs/02`.
5. Gates e conferência visual.
Rollback: remover a página/componentes e a rota da sidebar; o kit permanece inalterado.
