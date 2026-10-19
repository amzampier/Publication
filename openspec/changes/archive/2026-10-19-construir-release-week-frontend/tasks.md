# Tasks

## 1. Design system (kit)

- [x] 1.1 Criar `app/components/ui/ActionMenu.vue` (gatilho + menu, `items`, `role=menu/menuitem`, `aria-expanded`, setas cíclicas, `Enter`/`Space`, `Escape`/clique-fora com retorno de foco, item desabilitado com motivo) e verificar com `npm run lint` + um demo funcional na seção 23 do `/design`
- [x] 1.2 Adicionar as variantes semânticas `aberta`, `publicado` e `arquivado` ao `app/components/ui/Badge.vue` e atualizar `docs/01 §5.2` e o demo de Badge do `/design`; verificar que as variantes existentes continuam renderizando iguais
- [x] 1.3 Estender `app/components/ui/DataTable.vue` de forma **aditiva**: props opcionais `expandable`/`expanded`/`rowKey`/`expandLabel` + slots `#expandHeader` e `#expanded`, renderizando a linha expandida de largura total; verificar que sem as props o componente não muda e que modo servidor, ordenação, agrupamento, paginação, busca, filtros, `#actions` e estado vazio seguem intactos
- [x] 1.4 Atualizar `docs/01 - design_system.md` (§5.2 Badge, §5.11 DataTable, §5.23 ActionMenu) e a vitrine `/design` (seções de Badge/DataTable + nova seção 23) refletindo os componentes reais; verificar abrindo `http://localhost:3000/design`

## 2. Modelo em memória e regras

- [x] 2.1 Criar `app/components/release-week/useReleaseWeekModelo.ts` com os tipos `ReleaseWeekModelo`/`ItemRelease`, o dataset em memória (`useState`) com semanas e itens de exemplo, e os derivados (conjunto filtrado, KPIs Abertas/Em Revisão/Aprovadas/Publicadas, itens por release); verificar `npm run typecheck`
- [x] 2.2 Implementar as ações sobre o dataset em memória (incluir, editar, clonar com `prefill` de `versao`/`release`/`destaque`, publicar, arquivar e excluir condicionada) e o helper `podeExcluir` (`!arquivada && sem itens`); verificar que ações refletem na lista/KPIs e que recarregar restaura o dataset
- [x] 2.3 Criar `tests/release-week-validadores.test.ts` cobrindo validação de campos obrigatórios/semana 1–52, o `prefill` da clonagem (só versão/release/destaque) e a guarda de exclusão (arquivada bloqueia; com itens bloqueia; sem ambos permite); verificar `npm run test` verde

## 3. Componentes de domínio

- [x] 3.1 Criar `Cabecalho.vue` (tile `Rocket` `#1a9e07`, título/subtítulo, menu "Relatórios" com PDF/CSV e botão "Nova Release Week") e `Kpis.vue` (4 `UiKpi` do conjunto vigente); verificar renderização na página
- [x] 3.2 Criar `Tabela.vue` usando `UiDataTable` + `UiActionMenu`, com a flag no cabeçalho (`#expandHeader`) habilitando o `+` por linha e o slot `#expanded` exibindo `Itens`; verificar que marcar a flag mostra o `+` e que expandir/recolher funciona sem afetar busca/ordenação/paginação
- [x] 3.3 Criar `Itens.vue` (tabela somente leitura dos itens da release: Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status, Data de liberação) com estado vazio próprio; verificar com release com e sem itens
- [x] 3.4 Criar `Filtros.vue` (Status/Ano/Mês/Autor, "Limpar Filtros"/"Cancelar"/"Aplicar", contador no badge) no molde dos módulos existentes; verificar aplicar/limpar/cancelar e o badge
- [x] 3.5 Criar `Formulario.vue` (campos do cabeçalho, validação no cliente, foco no primeiro erro, Código/timestamps na edição, `prefill` para clonagem, status padrão `Aberta`); verificar criar, editar e clonar na UI
- [x] 3.6 Criar `Arquivar.vue` e `Exclusao.vue` (confirmações; Excluir só é acionável quando `podeExcluir`, com motivo acessível quando bloqueado); verificar os três cenários de exclusão e o arquivamento sumindo da lista
- [x] 3.7 Criar `gerarPdfReleaseWeek.ts` e a exportação CSV no cabeçalho (colunas da listagem, `;`/BOM/neutralização, aviso de erro e de lista vazia); verificar os downloads do conjunto filtrado

## 4. Página, navegação e documentação

- [x] 4.1 Criar `app/pages/admin/release-week.vue` (`definePageMeta({ layout: 'admin' })`) compondo cabeçalho, KPIs, tabela, filtros e modais, com estado de coordenação e loading coerente; verificar a página em `http://localhost:3000/admin/release-week`
- [x] 4.2 Atualizar `app/config/navigation.ts` para o item `release-week` declarar `to: '/admin/release-week'`; verificar navegação e `aria-current="page"` na rota
- [x] 4.3 Criar `docs/12 - Módulo das Releases Week.md` espelhando o código (visão geral/rota, componentização, componentes, contrato em memória + contrato futuro `GET /api/release-week`, fluxos e guarda de exclusão, navegação, dataset em memória, verificação, pendências — importação/backend); verificar que os caminhos e nomes citados existem

## 5. Integração e gates

- [x] 5.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar os quatro gates verdes
- [x] 5.2 Conferir manualmente em `/admin/release-week`: Nova, Clonar (prefill correto), Editar, Publicar, Arquivar (some da lista), Excluir (permitido só sem itens e não arquivada), flag de itens + expansão e exportações; recarregar a página e confirmar que o dataset voltou ao inicial
- [x] 5.3 Conferir regressão nas telas que usam `UiDataTable`/`UiBadge` (Softwares, Parceiros, Usuários, Perfis, Auditoria) e na vitrine `/design`, confirmando que as adições do kit não alteraram o comportamento existente
