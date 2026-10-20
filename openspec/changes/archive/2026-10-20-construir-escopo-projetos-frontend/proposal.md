# Proposal

## Why

O item **Escopo de Projetos** já existe na sidebar (`app/config/navigation.ts`) e o módulo RBAC
`escopo-projetos` já está na matriz, mas o item é um **botão morto**: não há rota, página, contrato de
tela nem documentação. A tabela `projetos_escopo` já modela os escopos anuais (código, nome, versão,
datas, status, softwares contemplados, descrição e visualizações), mas nada disso está acessível na
Área Administrativa. Antes de construir o backend, o módulo precisa de uma tela frontend que fixe o
recorte visual e comportamental — no molde de Parceiros, com listagem em cards.

## What Changes

- **Nova tela `/admin/escopo-projetos`** (`app/pages/admin/escopo-projetos.vue`), fina e dona da
  coordenação, componentizada em `app/components/escopo-projetos/`.
- **Listagem em grade de cards** (`UiEntityCard` + `UiPagination`), com busca, filtros
  (Status, Ano, Versão e Software), ordenação/paginação no cliente e dataset **mockado em memória**.
- **Quatro KPIs** do conjunto vigente: Em Andamento, Homologação, Concluído e Publicado.
- **Card:** código, badge de status, nome, versão, ano, período, **quantidade de itens vinculados**
  e visualizações. Ações: **Itens** (`ListChecks`), **Editar**, **Excluir** e **`UiActionMenu`** com
  **Publicar** e **Arquivar**.
- **Itens do projeto:** o ícone abre um `UiModal` **somente leitura** e **mais largo** (`xl`) com um
  `UiDataTable` (Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status e Data de
  liberação), permitindo busca, agrupamento em até três níveis, ordenação multi-coluna, paginação e
  totalizadores. **Nenhuma rota/tela nova** é criada; o CRUD dos itens permanece em "Lançar as
  Chamadas".
- **Softwares contemplados derivados:** não há seleção manual no formulário; a lista é preenchida
  pelos softwares das chamadas lançadas no escopo e só aparece quando há itens.
- **Publicar/Arquivar:** confirmação; publicar muda o status para `Publicado` e preenche a data de
  publicação; arquivar marca `arquivada = true` **apenas no mock** (a tabela real não tem essa coluna
  — a migration fica para o backend) e remove o card da lista/KPIs.
- **Exclusão condicionada:** bloqueada quando há itens vinculados (`itensCount`), com motivo
  acessível.
- **Formulário:** Nome, Código (gerado no mock como `PE-<ano>.<sequencial>`, somente leitura na
  edição), Versão, Ano, Status, Data de Início, Data Final, Data de Previsão, Data de Publicação e
  Descrição Geral. Validação de obrigatórios, datas, ano e unicidade de código. Os softwares
  contemplados são somente leitura e derivados dos itens.
- **Exportações PDF e CSV** do conjunto filtrado (Código, Nome, Versão, Ano, Status, Período,
  Softwares e Visualizações).
- **Importação apenas como affordance:** ícone na toolbar, sem modal/parser/modelo nesta fase.
- **Documentação:** novo `docs/14 - Módulo do Escopo de Projetos.md`; atualização de `docs/03`
  (rota da sidebar) e `docs/02` (UI frontend em memória; API pendente).
- **Nenhum componente novo no kit** é necessário; se algum detalhe exigir, ele entra em
  `docs/01 - design_system.md` e na vitrine `/design` no mesmo change.

## Capabilities

### New Capabilities

- `escopo-projetos`: tela administrativa do catálogo de escopos de projetos na fase frontend —
  rota/shell, grade de cards, KPIs, filtros, formulário, itens em modal somente leitura,
  publicar/arquivar mockados, exclusão condicionada, exportações e importação como affordance,
  operando sobre um dataset em memória.

### Modified Capabilities

<!-- Nenhuma capability existente tem requirement alterado: não há API, migration, RBAC ou
     componente de design system novo neste change. -->

## Impact

- **Código novo:** `app/pages/admin/escopo-projetos.vue`; `app/components/escopo-projetos/`
  (`Cabecalho`, `Kpis`, `Grade`, `Card`, `Itens`, `Filtros`, `Formulario`, `Publicar`, `Arquivar`,
  `Exclusao`, `useEscopoProjetosModelo.ts`, `validadores.ts`, `gerarPdfEscopoProjetos.ts`).
- **Código alterado:** `app/config/navigation.ts` (rota do item `escopo-projetos`).
- **Docs:** `docs/14` (novo), `docs/03`, `docs/02`.
- **Specs:** `escopo-projetos` (nova).
- **Testes:** `tests/escopo-projetos-validadores.test.ts`.
- **Fora de escopo:** backend/API, migration da coluna `arquivada`, importação funcional, CRUD dos
  itens de `entregas_itens`, upload/anexos, Área Pública e persistência real.
