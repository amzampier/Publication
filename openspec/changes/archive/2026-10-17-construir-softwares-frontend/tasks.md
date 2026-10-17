# Tasks

## 1. Contrato e estado da tela

- [x] 1.1 Criar `app/components/softwares/useSoftwaresModelo.ts` com os tipos do catálogo (`id`, `descricao`, `categoria`, `situacao`, `criado_em`, `atualizado_em`) e a carga de `GET /api/softwares` via `useState` + `useApiFetch`, mantendo a lista **vazia** em falha; verificar com `npm run typecheck`
- [x] 1.2 Implementar no modelo os computeds de filtros (`softwaresFiltrados`, `filtrosAtivosCount`, `opcoes`), as opções de `categoria`/`situacao` do domínio, `limparFiltros` e as linhas da tabela com timestamps formatados em pt-BR; verificar com `npm run typecheck` e conferindo na spec que aplicar/limpar reflete no conjunto

## 2. Listagem, cabeçalho e página

- [x] 2.1 Criar `app/components/softwares/Tabela.vue` (`UiDataTable` com `show-header-top`/`show-filters`, colunas Descrição, Categoria, Situação, Criado em, Atualizado em + ações e `UiBadge` Ativo→`done`/Inativo→`neutral`) e emitir `open-filters`; verificar que a tabela renderiza as colunas e emite `open-filters` pelo botão Filtros
- [x] 2.2 Criar `app/components/softwares/Kpis.vue` (Total, Ativos, Inativos e quebra por Categoria) derivando do conjunto vigente; verificar que os valores mudam ao aplicar um filtro
- [x] 2.3 Criar `app/components/softwares/Cabecalho.vue` (tile `Boxes` `#0364f7`, título "Softwares", subtítulo, menu "Relatórios" e ação primária em `UiButton`); verificar que o menu abre e dispara as exportações
- [x] 2.4 Criar `app/pages/admin/softwares.vue` (`definePageMeta({ layout: 'admin' })`, container `mx-auto max-w-7xl`, `UiLoading` no voo e toast de erro em falha) compondo Cabeçalho + KPIs + Tabela + Filtros; verificar em `http://localhost:3000/admin/softwares` que a tela abre no shell e exibe o estado vazio sem erro de runtime

## 3. Filtros

- [x] 3.1 Criar `app/components/softwares/Filtros.vue` (`UiModal` com `UiSelect` de Categoria e Situação, rascunho isolado, "Limpar Filtros"/"Cancelar"/"Aplicar"); verificar que Aplicar refina o conjunto, Limpar restaura tudo e Cancelar descarta o rascunho

## 4. Exportações

- [x] 4.1 Criar `app/components/softwares/gerarPdfSoftwares.ts` (jsPDF A4 paisagem + autotable, cabeçalho com logomarca via `useLogomarcaLogin`, colunas do catálogo); verificar que a "Listagem em PDF" gera arquivo com o conjunto filtrado
- [x] 4.2 Implementar a exportação CSV no `SoftwaresCabecalho.vue` (`;`, BOM UTF-8 e neutralização de fórmula); verificar que "Exportar em CSV" baixa o conjunto filtrado com as colunas do catálogo e trata falha com toast

## 5. Navegação, documentação e modelo de importação

- [x] 5.1 Adicionar `to: '/admin/softwares'` ao item `softwares` em `app/config/navigation.ts` e verificar que clicar no item navega e que ele fica ativo em `/admin/softwares`
- [x] 5.2 Criar `docs/10 - Módulo dos Softwares.md` (molde `docs/07`: rota, componentes, fluxos, contrato `GET /api/softwares`, filtros, exportações, modelo de importação e verificação) e verificar que cada seção bate com a implementação e com a spec `softwares`
- [x] 5.3 Criar `docs/modelos/modelo-importacao-softwares.xlsx` (cabeçalho Descrição, Categoria, Situação) com `exceljs` e verificar que o arquivo abre com exatamente essas colunas

## 7. Modais de CRUD e affordância de importação

- [x] 7.1 Adicionar a affordância de importação (ícone `Import`) no slot `filtersLeft` da `UiDataTable`, à esquerda do botão "Filtros", emitindo `importar`; verificar que o botão aparece imediatamente à esquerda do botão Filtros
- [x] 7.2 Adicionar `salvarSoftware` (POST/PUT) e `excluirSoftware` (DELETE) ao `useSoftwaresModelo.ts` conforme o contrato da API; verificar com `npm run typecheck`
- [x] 7.3 Criar `app/components/softwares/Formulario.vue` (modal de cadastro/edição com Descrição obrigatória, Categoria, Situação e Informações de Cadastro na edição); verificar validação e foco no primeiro erro
- [x] 7.4 Criar `app/components/softwares/Exclusao.vue` (modal de confirmação) e coordenar os dois modais em `admin/softwares.vue`; verificar exclusão remove a linha e devolve o foco à busca
- [x] 7.5 Atualizar `docs/10` e os artefatos da change (spec/design) para refletir os modais e a importação; verificar com `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`

## 8. Verificação integrada

- [x] 8.1 Rodar os gates `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar que passam
- [x] 8.2 Conferir que nenhum componente `Ui*` novo foi criado (logo `docs/01` e `/design` seguem intactos) e que a página em estado vazio não exibe dado fictício
