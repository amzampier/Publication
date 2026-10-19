# Proposal: construir-release-week-frontend

## Why

A tabela `release_week` já existe no schema (`server/migration/01_create_tables.sql` §13) e o item
**Release Week** já aparece na sidebar (sessão *Publicações*, ícone `Rocket`), mas é um **botão
morto** — sem rota, sem página e sem contrato de tela. Antes de construir o backend, o módulo precisa
de uma página administrativa que materialize o ciclo semanal (cabeçalho da semana, KPIs, filtros,
ações de linha e os itens de cada release), fixando o contrato que o backend servirá depois. Sem
isso, a primeira implementação de backend inventa um recorte e frontend/backend divergem — o mesmo
problema que a fase frontend de Softwares resolveu.

## What Changes

- **Nova página `/admin/release-week`** (`app/pages/admin/release-week.vue`,
  `definePageMeta({ layout: 'admin' })`), fina e dona da coordenação, componentizada em
  `app/components/release-week/`.
- **Listagem do cabeçalho da semana**: código, nome, semana/ano, período, status, autor, data de
  publicação e ações — em `UiDataTable`, com busca, filtros (Status, Ano, Mês, Autor), ordenação e
  paginação no cliente.
- **Quatro KPIs** do conjunto vigente: Abertas, Em Revisão, Aprovadas e Publicadas.
- **Ações de linha**: **Nova Release Week**, **Clonar**, **Editar**, **Publicar**, **Arquivar** e
  **Excluir** (condicionada). Arquivar é **soft** (`arquivada = true`, some da lista, nunca exclui).
  Excluir só é permitido quando a release **não está arquivada** e **não possui itens/relacionamentos**.
- **Clonar** abre o formulário de cadastro com `versao`, `release` e `destaque_semana` preenchidos; os
  demais campos (código, semana, ano, mês, datas, status, descrição, nome) em branco.
- **Flag de itens no cabeçalho da tabela**: ao marcá-la surge um `+` por release; o clique expande a
  linha exibindo os **itens da release** (`entregas_itens` vinculados) em modo somente leitura.
- **Dataset em memória** (`useState`) nesta fase — permite exercitar as ações; é descartado no F5 e
  substituído pela API na fase backend. Nenhum seed de banco.
- **Ícone de importação** na toolbar (à esquerda de "Filtros"): apenas a affordância nesta fase —
  modal, parser, modelo `.xlsx` e gravação ficam para depois do backend.
- **Design system**: novo `UiActionMenu` (menu de ações acessível), variantes de `UiBadge` para
  `Aberta`/`Publicado`/`Arquivado` e **expansão de linha opcional** no `UiDataTable` (estritamente
  aditiva — nenhuma função existente é removida).
- **Documentação**: novo `docs/12 - Módulo das Releases Week.md`, espelhando o código.
- **Navegação**: o item `release-week` de `app/config/navigation.ts` passa a declarar
  `to: '/admin/release-week'`.

## Capabilities

### New Capabilities

- `release-week`: página administrativa da Release Week na fase frontend — rota/shell, cabeçalho da
  semana, KPIs (Abertas/Em Revisão/Aprovadas/Publicadas), listagem com filtros/busca/ordenação/
  paginação, ações (Nova, Clonar, Editar, Publicar, Arquivar e Excluir condicionada), flag de itens
  com expansão somente leitura, exportações PDF/CSV, dataset em memória, affordância de importação e
  navegação até a tela.
- `design-system/action-menu`: componente `UiActionMenu` — menu de ações de linha (dropdown) acessível
  por mouse e teclado, com foco canônico, fechamento por `Escape`/clique-fora e suporte a itens
  habilitados/desabilitados com motivo.

### Modified Capabilities

- `design-system/data-table`: passa a suportar **expansão de linha opcional** (slot de conteúdo
  renderizado abaixo da linha) sem alterar o modo servidor, a ordenação acessível, o estado vazio,
  o agrupamento e as demais funções existentes.

## Impact

- **Código:** `app/pages/admin/release-week.vue` (novo); `app/components/release-week/`
  (`Cabecalho`, `Kpis`, `Tabela`, `Itens`, `Filtros`, `Formulario`, `Arquivar`, `Exclusao`,
  `useReleaseWeekModelo.ts`, `gerarPdfReleaseWeek.ts` — novos); `app/components/ui/ActionMenu.vue`
  (novo); `app/components/ui/DataTable.vue` (expansão aditiva); `app/components/ui/Badge.vue`
  (variantes); `app/pages/design.vue` (vitrine); `app/config/navigation.ts` (rota do item).
- **Design system:** `docs/01 - design_system.md` (§5.2 Badge, §5.11 DataTable, §5.23 ActionMenu) e
  especificações `design-system/action-menu` (nova) e `design-system/data-table` (delta).
- **Documentação:** `docs/12 - Módulo das Releases Week.md` (novo).
- **Testes:** validadores e regras de negócio (`tests/release-week-validadores.test.ts`) — clone,
  guarda de exclusão, KPIs.
- **Fora de escopo:** `server/api/**`, `server/utils/**`, migration/seed, coluna `arquivada` no banco,
  `GET /api/release-week`, RBAC de execução no servidor e a **execução da importação** (só o ícone).
