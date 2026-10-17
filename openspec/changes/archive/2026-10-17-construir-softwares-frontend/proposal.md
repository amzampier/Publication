# Proposal

## Why

O grupo **Cadastros** da sidebar já reserva o item **Softwares** (ícone `Boxes`, cor `#0364f7`), mas ele é um botão morto — sem rota, sem página e sem API — e a tabela `softwares` (catálogo corporativo, `docs/bd/01` §7) não tem nenhuma tela que a exponha. Antes de construir o backend, o módulo precisa de uma **página administrativa** que materialize a listagem, os filtros e as exportações, de modo a **fixar o contrato** que o backend servirá depois. Sem isso, cada tela nova inventa seu próprio recorte e o frontend/backend divergem.

## What Changes

- **Nova página `/admin/softwares`** (`app/pages/admin/softwares.vue`, `definePageMeta({ layout: 'admin' })`), fina e dona da coordenação, componentizada em `app/components/softwares/`.
- **Listagem componentizada** no molde de `perfis-acesso`/`gestao-usuarios`: `SoftwaresCabecalho` (tile `Boxes`, título, menu "Relatórios" e ação primária), `SoftwaresKpis` (`UiKpi` do conjunto vigente) e `SoftwaresTabela` (`UiDataTable` com **Descrição, Categoria, Situação, Criado em, Atualizado em** + coluna de ações).
- **Filtros por Categoria e Situação** no **modal** padrão do kit (`SoftwaresFiltros`, molde `PerfisFiltros`/`UsuariosFiltros`), com contador no badge da toolbar, "Limpar Filtros", "Cancelar" e "Aplicar".
- **Exportações "Listagem em PDF" e "em CSV"** do conjunto filtrado, geradas no cliente como em `perfis-acesso` (`gerarPdfSoftwares.ts` + CSV no cabeçalho), reusando `jspdf`/`jspdf-autotable`.
- **Modelo de importação versionado**: criar `docs/modelos/modelo-importacao-softwares.xlsx` (colunas Descrição, Categoria, Situação) para não perder o processo. **A execução da importação (modal/parser/rota) fica fora desta change.**
- **Navegação**: o item `softwares` (`app/config/navigation.ts`) passa a declarar `to: '/admin/softwares'` e a navegar como os demais itens com rota.
- **Contrato primeiro, sem dado fictício**: `useSoftwaresModelo.ts` já consome `GET /api/softwares`; enquanto o backend não existe, a tela exibe **estado vazio/erro** coerente (nunca uma base de demonstração fingindo ser persistida — `RL02 DIV-12/13`).
- **Documentação**: novo `docs/10 - Módulo dos Softwares.md` espelhando o código (molde `docs/07`).
- **Fora de escopo nesta change**: backend/API real, persistência, modais de incluir/editar/excluir e a importação de fato.

## Capabilities

### New Capabilities

- `softwares`: página administrativa do catálogo de softwares — rota e shell, estrutura da listagem (campos `descricao`, `categoria`, `situacao`, `criado_em`, `atualizado_em`), KPIs, filtros por categoria/situação, exportações PDF/CSV do conjunto filtrado, estado vazio/erro sem dado fictício, contrato de listagem `GET /api/softwares`, modelo de importação versionado e navegação até a tela.

### Modified Capabilities

<!-- Nenhuma. A requirement de navegação (`design-system/layout-navigation`) é genérica
     ("itens podem declarar rota"); habilitar rota no item Softwares é configuração
     (`app/config/navigation.ts`), não mudança de comportamento especificado. -->

## Impact

- **Código:** `app/pages/admin/softwares.vue` (nova); `app/components/softwares/` (`Cabecalho.vue`, `Kpis.vue`, `Tabela.vue`, `Filtros.vue`, `useSoftwaresModelo.ts`, `gerarPdfSoftwares.ts` — novos); `app/config/navigation.ts` (item `softwares` ganha `to`).
- **API:** contrato `GET /api/softwares` é definido nesta change, mas o endpoint em `server/api/softwares/` **não** é criado aqui.
- **Dependências:** nenhuma nova — `jspdf`, `jspdf-autotable` e `exceljs` (para o modelo) já estão no `package.json`.
- **Design system:** espera-se **nenhum** componente `Ui*` novo; `docs/01` e a vitrine `/design` só mudam se um componente de kit nascer (não previsto).
- **Documentação:** `docs/10 - Módulo dos Softwares.md` (novo); `docs/modelos/modelo-importacao-softwares.xlsx` (novo).
- **Fora de escopo:** `server/api/softwares/**`, migrations/seed de softwares, modais de CRUD, importação funcional, RBAC por rota (a chave de módulo `softwares` já existe em `usePerfisModelo.ts`).
