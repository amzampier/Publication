# Tasks

## 1. Domínio compartilhado e testes

- [x] 1.1 Criar `shared/lancar-chamadas.ts` com tipos, enums, `ChamadaModelo`, `EntradaChamada`, `FiltrosChamada`, `KpisChamada` e as funções puras `derivarOrigem`, `validarChamada`, `filtrarChamadas`, `buscarChamadas`, `calcularKpis`, `podeExcluir`, `motivoBloqueioExclusao`, `ehSegundaFeira`, `proximaSegunda`, `formatarData` e `formatarNumero`; verificar com `npm run typecheck`
- [x] 1.2 Criar `tests/lancar-chamadas-validadores.test.ts` cobrindo obrigatórios, vínculo ausente, origem com um/dois/três vínculos, duplicidade de chamada, segunda-feira, links, tags, filtros, KPIs e guarda de exclusão; verificar com `npm run test`
- [x] 1.3 Criar `app/components/lancar-chamadas/validadores.ts` reexportando `#shared/lancar-chamadas`; verificar com `npm run typecheck`

## 2. Design system: UiTagInput

- [x] 2.1 Implementar `app/components/ui/TagInput.vue` com props (`modelValue`, `label`, `placeholder`, `max`, `maxLength`, `error`, `helperText`, `disabled`), emits (`update:modelValue`, `change`), chips removíveis, Enter/vírgula, Backspace, trim, deduplicação, limites e estados canônicos de foco/erro/desabilitado; verificar com `npm run typecheck`
- [x] 2.2 Adicionar a seção 24 em `app/pages/design.vue` com exemplos interativos de adição/remoção, limite, erro e desabilitado; verificar em `http://localhost:3000/design` que a seção renderiza e opera por mouse e teclado
- [x] 2.3 Atualizar o sumário e a §5.24 de `docs/01 - design_system.md` com props, emits, estados e comportamento do `UiTagInput`, alinhados à implementação e à vitrine; verificar que a documentação descreve exatamente os exemplos da seção 24

## 3. Modelo e catálogos em memória

- [x] 3.1 Implementar `app/components/lancar-chamadas/useLancarChamadasModelo.ts` com `useState` para chamadas, filtros e estados de carga, dataset de demonstração e catálogos locais de releases, projetos, manuais, softwares e parceiros; verificar com `npm run typecheck`
- [x] 3.2 Implementar os derivados `linhas`, `kpis`, `filtrosAtivosCount`, `opcoes`, `chamadasFiltradas` e as ações `adicionar`, `atualizar`, `aprovar`, `excluir` e `limparFiltros`, aplicando `derivarOrigem` e as guardas; verificar com `npm run typecheck`
- [x] 3.3 Implementar `app/components/lancar-chamadas/gerarPdfLancarChamadas.ts` e o gerador CSV com `;`, BOM UTF-8 e neutralização de fórmulas; verificar geração manual de ambos os arquivos com dados e com conjunto vazio

## 4. Componentes de domínio, página e documentação

- [x] 4.1 Criar `Cabecalho.vue` (tile `Megaphone` `#f59e0b`, botão "Nova Chamada" sob `criar`, menu "Relatórios" sob `download`) e `Kpis.vue` por status (Total, Revisar, Aprovado, Recusado); verificar que os componentes renderizam com os dados do modelo e que os gates de RBAC ocultam as ações
- [x] 4.2 Criar `Tabela.vue` com `UiDataTable`, colunas definidas, busca sob `buscar`, botão de filtros sob `filtrar`, ações Detalhes/Editar/Excluir e `UiActionMenu` com Aprovar/Recusar, incluindo estados vazios distintos; verificar que busca, ordenação e paginação operam no cliente
- [x] 4.3 Criar `Filtros.vue` com Status, Situação, Tipo, Impacto, Software, Parceiro, Origem e períodos De/Até de lançamento e liberação em três colunas a partir de `sm`, rascunho isolado, "Limpar Filtros", "Cancelar", "Aplicar" e badge de filtros ativos; verificar que aplicar recalcula tabela e KPIs e cancelar descarta o rascunho
- [x] 4.4 Criar `Formulario.vue` em `UiModal` `xl` como wizard de quatro etapas (Vínculos e origem → Identificação → Classificação → Conteúdo e mídias), com etapas clicáveis, validação por etapa, campos do design, Situação removida do formulário, Tags na Classificação, Título do manual no conteúdo, Data de liberação herdada da Release, status somente leitura e foco no primeiro erro; verificar criação, edição, navegação direta e cancelamento com dados válidos e inválidos
- [x] 4.5 Criar `Midias.vue` integrando `UiUploadFiles`, a galeria das imagens existentes e a colagem com Ctrl+V, com remoção e preview local, além dos campos `manualTitulo`, `link_manual` e `link_video`; verificar que selecionar/colar imagens entra no rascunho e que remover atualiza a lista
- [x] 4.6 Criar `Detalhes.vue` em `UiModal` `xl` somente leitura com identificação, classificação, vínculos/origem, descrição, título do manual, links, tags, imagens, autor e timestamps; verificar abertura e fechamento por `Escape`, `X` e "Fechar"
- [x] 4.7 Criar `Aprovar.vue`, `Recusar.vue` e `Exclusao.vue` como modais de confirmação, com textos de consequência e bloqueio de exclusão por status/histórico; verificar que aprovar/recusar alteram o status para `Aprovado`/`Recusado` e que excluir remove a chamada apenas quando permitido
- [x] 4.8 Criar `app/pages/admin/lancar-chamadas.vue` como orquestração (`layout: 'admin'`, `UiLoading`, abertura/fechamento dos modais e handlers) e adicionar `to: '/admin/lancar-chamadas'` em `app/config/navigation.ts`; verificar a rota em `http://localhost:3000/admin/lancar-chamadas` e o item ativo na sidebar
- [x] 4.9 Atualizar `docs/03 - Header e Sidebar.md` para remover "Lançar as Chamadas" dos itens sem rota e criar `docs/15 - Módulo Lançar Chamadas.md` com visão geral, componentização, mapa de `entregas_itens`, contrato futuro da API, fluxos, RBAC, validações, relatórios, design system, verificação e pendências; verificar que o documento espelha os arquivos e comportamentos implementados

## 5. Integração, regressão e validação

- [x] 5.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; verificar que os quatro gates passam sem erros
- [x] 5.2 Conferir manualmente a página em viewport de 375px, 768px e desktop: KPIs empilhados, tabela com rolagem horizontal apenas em telas estreitas (sem rolagem em telas amplas), formulário em uma coluna, modais sem overflow e botões acessíveis
- [x] 5.3 Conferir o fluxo completo: criar com vínculo obrigatório e origem derivada, navegar pelo wizard e colar imagem com Ctrl+V, editar, detalhar, aprovar, recusar, tentar excluir bloqueado, excluir permitido, filtrar (incluindo períodos), buscar, exportar PDF/CSV e recarregar (F5) confirmando a restauração do dataset
- [x] 5.4 Conferir os gates de RBAC na interface com perfis Administrador, Editor, Revisor e Leitor, verificando que o item, Nova Chamada, Editar, Excluir, Aprovar, Recusar, Filtros, busca e Relatórios seguem a matriz
- [x] 5.5 Verificar a regressão em `/design` seção 24, na navegação da sidebar e nos modais de itens de Release Week, Manuais e Escopo de Projetos, que devem continuar somente leitura
- [x] 5.6 Executar `openspec validate "construir-lancar-chamadas-frontend" --type change --strict` e confirmar que a change permanece válida
