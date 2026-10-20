# Tasks

## 1. Contrato de banco e RBAC

- [x] 1.1 Criar `server/migration/21_add_manuais_arquivada.sql` com a coluna `arquivada TINYINT(1) NOT NULL DEFAULT 0` após `destaque_semana`, o índice `idx_manuais_arquivada` e o rollback comentado; verificar no boot que a coluna/índice existem e que reaplicar não quebra
- [x] 1.2 Criar `server/migration/22_reconciliar_rbac_manuais.sql` acrescentando `clonar` ao Administrador/Editor e `visualizar_itens` aos quatro perfis, de forma idempotente e com rollback; verificar por consulta que os extras aparecem uma única vez
- [x] 1.3 Atualizar `server/migration/02_seed.sql`, `docs/bd/02_seed.sql` e `docs/bd/01 - banco_dados_mariadb.sql` (coluna `arquivada` e extras de `manuais`); verificar que um banco novo nasce com os extras e que o DDL de referência bate com as migrations
- [x] 1.4 Atualizar `app/config/perfis.ts` e `server/utils/perfis.ts` (`manuais` com `clonar`/`visualizar_itens`, total 90), a regra `clonar`⇒`criar` em `validarMatriz` (release-week e manuais) e `tests/perfis-funcionalidades.test.ts` (total 90 + cenários de manuais); verificar `npm run test`
- [x] 1.5 Atualizar `docs/07 - Perfis de Acesso (RBAC).md` com o catálogo de `manuais`, as contagens normativas `90/65/39/14`, o total `208/360` e a regra de clonagem; verificar que as contagens batem com o catálogo e com o teste

## 2. Design system

- [x] 2.1 Adicionar a variante `alteracoes` (âmbar, ícone próprio, rótulo "Alterações Solicitadas") ao `app/components/ui/Badge.vue` sem alterar as variantes existentes; verificar no `/design` e nas telas que usam `UiBadge`
- [x] 2.2 Atualizar `docs/01 - design_system.md` (§5.2: enum e mapeamento do módulo Manuais) e a seção 4 da vitrine `/design`, verificando que a nova variante aparece e as demais seguem idênticas

## 3. Modelo e regras

- [x] 3.1 Criar `app/components/manuais/validadores.ts` com tipos (`ManuaisModelo`, `ItemManual`, `StatusManual`, `FiltrosManuais`), meses/status, KPIs, filtragem, validação de título/mês/ano, unicidade `(ano, mês)`, `prefillClone`, `podeExcluir` e formatação de datas; verificar `npm run typecheck`
- [x] 3.2 Criar `app/components/manuais/useManuaisModelo.ts` com dataset em memória (`useState`), itens por manual (lazy/cache), derivados (linhas/KPIs/opções/filtros ativos) e ações de incluir/editar/clonar/publicar/arquivar/excluir; verificar as ações na UI e o reset no F5
- [x] 3.3 Criar `tests/manuais-validadores.test.ts` cobrindo obrigatórios, mês 1–12, unicidade `(ano, mês)`, prefill da clonagem, guarda de exclusão (arquivada ou com itens) e KPIs; verificar `npm run test`

## 4. Componentes de domínio

- [x] 4.1 Criar `app/components/manuais/Cabecalho.vue` (tile `BookOpen` `#f45f71`, título/subtítulo, menu "Relatórios" e botão "Novo Manual") e `app/components/manuais/Kpis.vue` (cinco `UiKpi` do conjunto vigente); verificar renderização e gating por permissão
- [x] 4.2 Criar `app/components/manuais/Tabela.vue` com `UiDataTable` (Código, Título, Mês/Ano, Status, Autor, Publicação, Ações; destaques junto ao título), busca/filtros, Editar/Excluir inline, `UiActionMenu` (Clonar/Publicar/Arquivar) e flag `#expandHeader`/`#expanded`; verificar que expandir não afeta busca/ordenação/paginação
- [x] 4.3 Criar `app/components/manuais/Itens.vue` (tabela somente leitura: Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status, Data de liberação) com estados de loading, erro e vazio; verificar com manual com e sem itens
- [x] 4.4 Criar `app/components/manuais/Filtros.vue` (Status, Ano, Mês, Autor e Destaque; rascunho; "Limpar Filtros"/"Cancelar"/"Aplicar"; badge de filtros ativos); verificar aplicar/limpar/cancelar e o refinamento de tabela/KPIs
- [x] 4.5 Criar `app/components/manuais/Formulario.vue` para novo/editar/clonar (Título, Mês, Ano, Descrição, Status em `UiSegmented`, Destaques em `UiSwitch`; Código, carimbos e Data de publicação somente leitura na edição; validação com foco no primeiro erro e conflito `(ano, mês)`); verificar os três modos
- [x] 4.6 Criar `app/components/manuais/Publicar.vue`, `Arquivar.vue` e `Exclusao.vue` (confirmações; exclusão condicionada com motivo acessível); verificar publicar, arquivar (some da lista/KPIs) e excluir (permitido só sem itens e não arquivado)
- [x] 4.7 Criar `app/components/manuais/gerarPdfManuais.ts` e a exportação CSV no menu "Relatórios" (conjunto filtrado, colunas da listagem, `;`/BOM/neutralização, aviso de vazio/erro); verificar os downloads

## 5. Página, navegação e documentação

- [x] 5.1 Criar `app/pages/admin/manuais.vue` (`definePageMeta({ layout: 'admin' })`) compondo cabeçalho, KPIs, tabela, filtros, formulário e modais, com estado de coordenação e loading coerente; verificar em `http://localhost:3000/admin/manuais`
- [x] 5.2 Atualizar `app/config/navigation.ts` para o item `manuais` declarar `to: '/admin/manuais'`; verificar a navegação e o `aria-current="page"` na rota
- [x] 5.3 Criar `docs/13 - Módulo de Manuais Mensais.md` espelhando o código (visão geral/rota, componentização, componentes, contrato do modelo, fluxos, RBAC, dataset em memória, migrations, verificação e pendências de backend); verificar que os caminhos e nomes citados existem

## 6. Integração e gates

- [x] 6.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar os quatro gates verdes
- [ ] 6.2 Conferir manualmente em `/admin/manuais`: novo, editar, clonar (prefill correto), publicar, arquivar (some da lista), excluir (guarda), flag de itens + expansão, filtros e exportações; recarregar e confirmar que o dataset voltou ao inicial
- [x] 6.3 Conferir regressão em `/design`, `/admin/perfis-acesso`, `/admin/release-week`, Softwares, Parceiros e Usuários, confirmando que a variante do Badge e as permissões novas não alteraram o comportamento existente
- [x] 6.4 Rodar `openspec validate --change "construir-manuais-mensais"` e confirmar a change válida
