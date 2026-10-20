# Tasks

## 1. Modelo mock e validadores

- [x] 1.1 Criar `app/components/escopo-projetos/validadores.ts` com tipos (`ProjetoEscopoModelo`, `ItemProjeto`, `StatusEscopo`, `FiltrosEscopo`), domínio de status, `SOFTWARES_MOCK`, helpers de período/data, KPIs, filtragem, geração de código `PE-<ano>.<seq>`, derivação dos softwares a partir dos itens, validação do formulário (nome/versão/ano/datas/unicidade) e `podeExcluir`; verificar `npm run typecheck`
- [x] 1.2 Criar `app/components/escopo-projetos/useEscopoProjetosModelo.ts` com seed em memória (`useState`) de ~7 escopos, softwares e itens, derivados (filtrados, KPIs, opções, paginação) e ações `adicionar`, `atualizar`, `publicar`, `arquivar`, `excluir` e `itensDoProjeto`; verificar as ações e o reset no F5
- [x] 1.3 Criar `tests/escopo-projetos-validadores.test.ts` cobrindo obrigatórios, ordem de datas, ano, softwares, código único, filtros, KPIs e guarda de exclusão; verificar `npm run test`

## 2. Componentes de domínio

- [x] 2.1 Criar `Cabecalho.vue` (tile `ClipboardList` `#50a1ff`, título/subtítulo, menu Relatórios PDF/CSV e botão "Novo Escopo") e `Kpis.vue` (4 `UiKpi` do conjunto vigente); verificar renderização e gating por permissão
- [x] 2.2 Criar `Card.vue` com `UiEntityCard` (código, status, nome, versão, ano, período, quantidade de itens vinculados, visualizações), ícones Editar/Excluir/Itens e `UiActionMenu` com Publicar/Arquivar, incluindo estados desabilitados e motivos; verificar os controles no hover/foco e com permissões diferentes
- [x] 2.3 Criar `Itens.vue` (`UiModal size="xl"` somente leitura com `UiDataTable`, colunas Chamada/Título/Software/Módulo/Tipo/Impacto/Situação/Status/Data de liberação, busca/agrupamento/ordenação/paginação/totalizadores e estado vazio) sem rota/página nova; verificar projeto com e sem itens
- [x] 2.4 Criar `Grade.vue` (busca, ícone Import inerte, botão Filtros com badge, grade responsiva de `Card` e `UiPagination`) e `Filtros.vue` (Status, Ano, Versão, Software; rascunho; Limpar/Cancelar/Aplicar); verificar busca, paginação e refinamento de KPIs
- [x] 2.5 Criar `Formulario.vue` para novo/editar (nome, código read-only na edição, versão, ano, status, quatro datas, descrição em `UiTextarea`, softwares contemplados somente leitura derivados dos itens e exibidos só quando houver itens, seção de cadastro na edição), com validação e foco no primeiro erro; verificar os dois modos
- [x] 2.6 Criar `Publicar.vue`, `Arquivar.vue` e `Exclusao.vue` (confirmações; publicar status/data; arquivar mock; exclusão condicionada por itens); verificar os fluxos e os motivos acessíveis
- [x] 2.7 Criar `gerarPdfEscopoProjetos.ts` e a exportação CSV no cabeçalho (colunas Código, Nome, Versão, Ano, Status, Período, Softwares, Visualizações; `;`/BOM/neutralização; vazio/erro); verificar os downloads do conjunto filtrado

## 3. Página, navegação e documentação

- [x] 3.1 Criar `app/pages/admin/escopo-projetos.vue` (`definePageMeta({ layout: 'admin' })`) compondo cabeçalho, KPIs, grade, filtros, formulário, itens e modais, com estado de coordenação; verificar em `http://localhost:3000/admin/escopo-projetos`
- [x] 3.2 Atualizar `app/config/navigation.ts` para o item `escopo-projetos` declarar `to: '/admin/escopo-projetos'`; verificar navegação e `aria-current="page"`
- [x] 3.3 Criar `docs/14 - Módulo do Escopo de Projetos.md` espelhando o código (visão geral/rota, componentização, componentes, contrato mock + futuro `GET /api/escopo-projetos`, fluxos, RBAC, dataset em memória, itens em modal, importação-affordance, verificação e pendências de backend); verificar que os caminhos citados existem
- [x] 3.4 Atualizar `docs/03` (rota do item na sidebar) e `docs/02` (`projetos_escopo` com UI frontend em memória e API pendente); verificar que não restou a afirmação de que o módulo não tem UI
- [x] 3.5 Se algum componente novo for realmente necessário, documentá-lo em `docs/01 - design_system.md` e na vitrine `app/pages/design.vue`; caso contrário, confirmar que o kit existente cobre tudo e registrar no `docs/14`

## 4. Integração e gates

- [x] 4.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar os quatro gates verdes
- [x] 4.2 Conferir manualmente em `/admin/escopo-projetos`: cards, busca, filtros, paginação, novo, editar, publicar, arquivar, excluir (guarda), itens em modal, PDF/CSV, ícone de importação inerte e reset no F5
- [x] 4.3 Conferir regressão em `/design` e nas telas que usam `UiEntityCard`/`UiPagination`/`UiActionMenu` (Parceiros, Release Week, Manuais); verificar HTTP 200 e comportamento inalterado
- [x] 4.4 Rodar `openspec validate "construir-escopo-projetos-frontend"` e confirmar a change válida
