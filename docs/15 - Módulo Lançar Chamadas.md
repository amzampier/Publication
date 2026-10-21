# 15 - Módulo Lançar Chamadas — Área Administrativa

**Versão:** 1.0.0 — **Data:** 2026-10-21 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela **fase frontend** do módulo **Lançar as Chamadas** — listagem, quatro KPIs, busca,
filtros (incluindo períodos), cadastro/edição em wizard, detalhes, aprovação, exclusão condicionada e
relatórios PDF/CSV sobre
`entregas_itens`, com dataset em memória e catálogos locais. **Não há backend/API de itens nesta
fase.**
**Arquivos-fonte:** [`app/pages/admin/lancar-chamadas.vue`](../app/pages/admin/lancar-chamadas.vue) ·
[`app/components/lancar-chamadas/`](../app/components/lancar-chamadas) ·
[`shared/lancar-chamadas.ts`](../shared/lancar-chamadas.ts) ·
[`app/components/ui/TagInput.vue`](../app/components/ui/TagInput.vue)
**Design system:** [`/design`](../app/pages/design.vue) — `UiDataTable`, `UiModal`, `UiModalSection`,
`UiInput`, `UiSelect`, `UiDatePicker`, `UiSegmented`, `UiTextarea`, `UiTagInput` (novo), `UiBadge`,
`UiActionMenu`, `UiKpi`, `UiButton`, `UiTooltip`, `UiUploadFiles` e `UiLoading`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md)
**Autoridade de comportamento:** `openspec/specs/lancar-chamadas` e
`openspec/specs/design-system/tag-input` (change `construir-lancar-chamadas-frontend`)

> Este documento é a referência da tela `/admin/lancar-chamadas` na fase frontend. Em caso de
> divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Modelo de dados e mapa de `entregas_itens`](#4-modelo-de-dados-e-mapa-de-entregas_itens)
5. [Contrato futuro da API](#5-contrato-futuro-da-api)
6. [Fluxos](#6-fluxos)
7. [Navegação, RBAC e auditoria](#7-navegação-rbac-e-auditoria)
8. [Validações e regras de negócio](#8-validações-e-regras-de-negócio)
9. [Relatórios PDF/CSV](#9-relatórios-pdfcsv)
10. [Design system](#10-design-system)
11. [Documentação relacionada](#11-documentação-relacionada)
12. [Verificação](#12-verificação)
13. [Pendências e próximos passos](#13-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

- **Rota:** `/admin/lancar-chamadas` → `app/pages/admin/lancar-chamadas.vue` com
  `definePageMeta({ layout: 'admin' })` — herda header + sidebar de `/admin/**`.
- **Navegação:** o item **Lançar as Chamadas** da sessão **Movimentos** declara
  `to: '/admin/lancar-chamadas'` em `app/config/navigation.ts` e exibe `aria-current="page"` na rota.
- **Modelo de dados:** a tela representa `entregas_itens`, a tabela única de itens de Release Week
  (`release_id`), Escopo de Projetos (`projeto_id`) e Manuais (`manual_id`), com FKs adicionais para
  `softwares(codigo)`, `parceiros(id)` e `usuarios(id)`.
- **Fase frontend:** o conjunto de chamadas e os catálogos vivem em memória (`useState`), sem API de
  itens, sem migration, sem seed de banco e sem persistência. Recarregar a página restaura o dataset
  de demonstração.
- **O que é editável:** vínculos/origem, identificação, classificação (incluindo tags), conteúdo,
  título do manual, links e imagens. O **status** nasce `Revisar` e só muda pela ação
  **Aprovar** (→ `Aprovado`); a edição do status pertence à Esteira de Revisão. O campo **Situação**
  não é exibido no formulário — o valor existente é preservado e novas chamadas usam
  `Desenvolvimento` internamente.
- **O que não existe nesta fase:** **Arquivar** (não há coluna `arquivada` em `entregas_itens`),
  **Publicar** como ação (o fluxo desta tela é `Revisar` → `Aprovado`/`Recusado`) e **Importar XLSX** (o catálogo
  RBAC do módulo não possui `importar`).

## 2. Estrutura da página (componentização)

```
admin/lancar-chamadas.vue                         (page - layout admin + coordenação)
├── <UiLoading v-if="carregando" />                → overlay do primeiro acesso/F5
├── <LancarChamadasCabecalho @novo />              → tile Megaphone #f59e0b + "Relatórios" + "Nova Chamada"
├── <LancarChamadasKpis class="mt-6" />            → 4 UiKpi por status
├── <LancarChamadasTabela
│       @detalhes @editar @aprovar @recusar @excluir
│       @open-filters />                            → busca + Filtros + UiDataTable + ações
├── <LancarChamadasFiltros v-model="filtrosAbertos" /> → modal de filtros (inclui períodos)
├── <LancarChamadasFormulario v-model :modo :chamada /> → wizard de cadastro/edição
├── <LancarChamadasDetalhes v-model :chamada />     → detalhes somente leitura
├── <LancarChamadasAprovar v-model :chamada @confirmar />
├── <LancarChamadasRecusar v-model :chamada @confirmar />
└── <LancarChamadasExclusao v-model :chamada @confirmar />
```

- **Estado de coordenação:** `carregando`, `filtrosAbertos`, `formAberto`/`modo`/`chamadaEditar`,
  `detalhesAberto`/`chamadaDetalhes`, `aprovarAberto`/`chamadaAprovar`,
  `recusarAberto`/`chamadaRecusar` e `exclusaoAberta`/`chamadaExcluir`.
- **Estado de domínio:** `useLancarChamadasModelo` mantém `chamadas`, `busca`, `filtros`, catálogos,
  derivados e ações.
- **Loading:** no primeiro acesso/F5 a página exibe `UiLoading` ("Carregando chamadas…") enquanto o
  seed é montado; falha (não esperada) gera toast e segue para a listagem.
- **Largura:** container `mx-auto max-w-[85rem]` (1.360 px) com `p-4 sm:p-6` e, a partir de `lg`,
  `px-1 py-8` — cerca de 1 cm a mais de área útil em cada lado em relação ao `max-w-7xl` anterior. Em
  telas amplas a tabela cabe sem rolagem horizontal; em telas estreitas a rolagem horizontal é
  preservada.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<LancarChamadasCabecalho>`

- Tile `bg-brand-primary` com `Megaphone` em `#f59e0b`, título "Lançar as Chamadas" e subtítulo
  "Lançamento e manutenção das chamadas — vínculos, classificação, conteúdo e aprovação."
- **Nova Chamada** (`UiButton` primary + `Plus`), gated por `criar`, emite `@novo`.
- **Relatórios** (`NotebookText` + `ChevronDown`): "Listagem em PDF" e "Exportar em CSV" do
  conjunto vigente, gated por `download`. Lista vazia → aviso e nenhum arquivo.

### 3.2 `Kpis.vue` → `<LancarChamadasKpis>`

- Quatro `UiKpi` do conjunto filtrado, por **status**: **Total** (`#0364f7`, `Megaphone`),
  **Revisar** (`#f59e0b`, `Clock`), **Aprovado** (`#1a9e07`, `ShieldCheck`) e
  **Recusado** (`#be123c`, `XCircle`).
- Recalculam com busca, filtros, inclusão, edição, aprovação, recusa e exclusão.

### 3.3 `Tabela.vue` → `<LancarChamadasTabela>`

- `UiDataTable` com **Chamada, Título, Software, Módulo, Tipo, Impacto, Status, Lançamento e
  Liberação**; `defaultPageSize` 10; ordenação padrão por **chamada** e paginação no cliente.
- **Busca** no slot `#filtersLeft` (o `showSearch` interno fica desligado) para que o termo também
  recalcule KPIs; o badge de critérios ativos soma busca + filtros.
- **Filtros** gated por `filtrar`; **busca** gated por `buscar`.
- **Chamada** é um botão mono que abre os detalhes. Na coluna de ações: **Editar** (`alterar`),
  **Excluir** (`excluir`, desabilitado com motivo) e `UiActionMenu` com **Detalhes**, **Aprovar**
  (`publicar`) e **Recusar** (`alterar`), ambos desabilitados quando o status não é `Revisar`.
- **Status** em `UiBadge`: `Revisar`→`pending`, `Aprovado`→`reconciled`, `Recusado`→`blocked`,
  `Publicar`→`done`.
- Estados vazios distintos do kit: base vazia × filtro/busca sem resultado.

### 3.4 `Filtros.vue` → `<LancarChamadasFiltros>`

- `UiModal size="lg"` com **Status, Situação, Tipo, Impacto, Software, Parceiro, Origem** e
  **Período de lançamento (De/Até)** e **Período de liberação (De/Até)** em **três colunas a partir
  de `sm`** (uma no mobile), além dos botões "Limpar Filtros", "Cancelar" e "Aplicar". Os períodos são
  inclusivos; chamadas sem data de liberação não correspondem a um filtro de liberação.
- Rascunho isolado que espelha o estado vigente ao abrir; "Aplicar" reflete na tabela/KPIs;
  "Limpar Filtros" zera rascunho e estado (a busca textual permanece).

### 3.5 `Formulario.vue` → `<LancarChamadasFormulario>`

- `UiModal size="xl"` em **wizard de quatro etapas**, navegável pelo indicador (qualquer etapa):
  1. **Vínculos e origem:** Release, Projeto, Manual e badge de origem derivada. É sempre a primeira
     etapa.
  2. **Identificação:** Chamada (mono), Título, Data de lançamento, Data de liberação, Status somente
     leitura e Autor somente leitura. A **Data de liberação** é preenchida automaticamente com a
     `dataPublicacao` da Release selecionada e pode ser ajustada.
  3. **Classificação:** Software, Parceiro, Módulo, Menu/funcionalidade, Tipo, Impacto e **Tags**
     (`UiTagInput`).
  4. **Conteúdo e mídias:** Descrição completa, Título do manual, `LancarChamadasMidias` (links +
     imagens) e Informações de Cadastro (somente edição).
- **Campo Situação:** não aparece no formulário; o valor existente é preservado e novas chamadas usam
  `Desenvolvimento` internamente.
- **Novo:** status `Revisar`, tipo `Correção`, impacto `Médio` e `dataLancamento` pré-preenchida com a
  próxima segunda-feira.
- **Editar:** preenchido; status e autor originais permanecem; timestamps são somente leitura.
- **Status:** não é editável; a aprovação é uma ação separada.
- **Navegação:** "Próximo" valida a etapa corrente; clicar no indicador vai direto para a etapa
  escolhida; "Salvar" valida todas e leva à etapa do primeiro erro.
- **Validação:** cliente + foco no primeiro erro; ver §8.
- Salvar inclui no topo (novo) ou substitui a linha (edição), fecha o modal e dispara toast.

### 3.6 `Midias.vue` → `<LancarChamadasMidias>`

- Campos **Título do manual**, **Link do manual** e **Link do vídeo** (`UiInput`).
- Galeria das imagens existentes com remoção e `UiUploadFiles` (`multiple`, PNG/JPG/WebP, 5 MB).
- **Colagem com `Ctrl` + `V`:** enquanto a etapa Conteúdo e mídias está montada, o componente lê
  arquivos de imagem do clipboard, valida tipo/tamanho e incorpora à galeria sem exigir salvar o
  arquivo localmente. A dica visual fica acima do upload.
- Imagens são lidas como data URL e guardadas em `imagens` (JSON na fase backend); não há upload
  persistido nem `anexos_midias` nesta fase.

### 3.7 `Detalhes.vue` → `<LancarChamadasDetalhes>`

- `UiModal size="xl"` somente leitura com identificação, classificação, vínculos, conteúdo
  (descrição, título do manual e links), tags, imagens e informações de cadastro.
- Fecha por `Escape`, `X` ou "Fechar".

### 3.8 `Aprovar.vue` / `Recusar.vue` / `Exclusao.vue`

- `UiModal size="sm"` de apresentação pura; emitem `confirmar` e a página chama o modelo.
- **Aprovar:** confirma a mudança de status para `Aprovado`; só disponível em `Revisar`.
- **Recusar:** confirma a mudança de status para `Recusado`; só disponível em `Revisar`.
- **Exclusao:** mostra chamada, título e motivo do bloqueio quando houver; exclusão só ocorre em
  `Revisar` e sem histórico.

### 3.9 `gerarPdfLancarChamadas.ts`

- `gerarPdfLancarChamadas` (jsPDF A4 paisagem + autotable): logo de login quando houver, título
  "Relatório de Lançar as Chamadas", data/contagem, colunas da listagem e rodapé
  "Página X de Y" · "Publications · Lançar as Chamadas". Arquivo `lancar-chamadas.pdf`.
- `gerarCsvLancarChamadas`: CSV com `;`, BOM UTF-8 e neutralização de fórmulas (`=`, `+`, `-`,
  `@`, tab, CR). Arquivo `lancar-chamadas.csv`.

### 3.10 `useLancarChamadasModelo.ts`

- `useState` (`lancar-chamadas-base`, `-carregando`, `-carregado`, `-busca`, `-filtros`).
- Catálogos locais: releases, projetos, manuais, softwares e parceiros.
- Dataset de demonstração com oito chamadas cobrindo origens, situações, status e histórico.
- Derivados: `chamadasFiltradas`, `linhas`, `kpis`, `filtrosAtivosCount`, `criteriosAtivosCount`,
  `opcoes`, `autorAtual`.
- Ações: `carregarChamadas`, `adicionar`, `atualizar`, `aprovar`, `recusar`, `excluir`,
  `limparFiltros`, `resolver`.

## 4. Modelo de dados e mapa de `entregas_itens`

```ts
interface ChamadaModelo {
  id: string
  origem: 'Release' | 'Projeto' | 'Manual' | 'Ambos'
  releaseId: string
  projetoId: string
  manualId: string
  softwareId: string
  parceiroId: string
  autorId: string
  autorNome: string
  chamada: string
  dataLancamento: string
  dataLiberacao: string
  release: string
  titulo: string
  parceiro: string
  software: string
  modulo: string
  menuFuncionalidade: string
  tipo: 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
  impacto: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  situacao: 'Desenvolvimento' | 'Homologação' | 'Implantado'
  descricaoCompleta: string
  manualTitulo: string
  linkManual: string
  linkVideo: string
  imagens: string[]
  status: 'Revisar' | 'Aprovado' | 'Recusado' | 'Publicar'
  tags: string[]
  temHistorico: boolean
  criadoEm: string
  atualizadoEm: string
}
```

| Coluna em `entregas_itens` | Uso na tela |
|---|---|
| `id` | Gerado no modelo (`crypto.randomUUID`) nesta fase; backend gera depois |
| `origem` | Derivada dos vínculos; somente leitura |
| `release_id` / `projeto_id` / `manual_id` | Selects de vínculo; ao menos um obrigatório |
| `software_id` / `parceiro_id` | Selects de catálogo |
| `software` / `parceiro` / `release` | Textos derivados dos catálogos, não digitados |
| `autor_id` / `autor_nome` | Sessão atual; somente leitura |
| `chamada` | Input mono, obrigatório, ≤60, sem duplicidade no conjunto |
| `titulo` | Input, obrigatório, ≤255 |
| `data_lancamento` / `data_liberacao` | `UiDatePicker`; lançamento obrigatório; ambas segunda-feira |
| `modulo` | Input, obrigatório, ≤100 |
| `menu_funcionalidade` | Input opcional |
| `tipo` / `impacto` | `UiSegmented` na etapa Classificação |
| `situacao` | Não exibido no formulário; valor preservado / `Desenvolvimento` interno |
| `descricao_completa` | `UiTextarea`, obrigatório |
| `manualTitulo` | `UiInput` no conteúdo (campo de frontend; futuro backend) |
| `link_manual` / `link_video` | `UiInput type="url"` |
| `tags` | `UiTagInput` (JSON), na etapa Classificação |
| `imagens` | Galeria + `UiUploadFiles` + colagem `Ctrl+V` (JSON) |
| `status` | Novo = `Revisar`; ação Aprovar = `Aprovado` |
| `ordem_apresentacao` | Coluna legada; não usada pela UI — ordenação sempre por `chamada` |
| `criado_em` / `atualizado_em` | Somente leitura |

**Decisão de origem (A):** um vínculo → `Release`/`Projeto`/`Manual`; dois ou mais → `Ambos`; nenhum
→ erro de validação. Os vínculos são obrigatórios.

## 5. Contrato futuro da API

A fase backend deverá expor rotas equivalentes (nomes indicativos, ainda não implementados):

| Ação | Método e rota | Permissão |
|---|---|---|
| Listar | `GET /api/lancar-chamadas` | `visualizar` |
| Criar | `POST /api/lancar-chamadas` | `criar` |
| Editar | `PUT /api/lancar-chamadas/:id` | `alterar` |
| Aprovar | `PUT /api/lancar-chamadas/:id/aprovar` | `publicar` |
| Recusar | `PUT /api/lancar-chamadas/:id/recusar` | `alterar` |
| Excluir | `DELETE /api/lancar-chamadas/:id` | `excluir` |
| Relatórios | `GET /api/lancar-chamadas?exportar=1` | `download` |
| Catálogos | `GET /api/lancar-chamadas/opcoes` | `visualizar` |

- A API deverá repetir a validação do cliente, aplicar RBAC/auditoria e usar transação quando
  necessário.
- `chamada` precisa de índice único (ou regra de negócio explícita) no backend; hoje o banco só tem
  índice simples.
- `arquivada`, importação XLSX e `anexos_midias` ficam para decisões futuras.

## 6. Fluxos

- **Listagem:** `onMounted` chama `carregarChamadas()`; o seed é montado em memória e a tabela usa o
  conjunto filtrado.
- **Busca:** o termo no campo da toolbar refina tabela e KPIs em tempo real.
- **Filtros:** o modal mantém rascunho isolado; "Aplicar" refina (inclusive períodos de lançamento e
  liberação); "Limpar Filtros" zera; "Cancelar" descarta.
- **Nova:** abre na etapa Vínculos e origem; ao escolher uma Release, a Data de liberação recebe a
  `dataPublicacao` dela. "Próximo" valida a etapa, o indicador permite ir direto a qualquer etapa e
  "Salvar Chamada" valida tudo, inclui no topo e fecha com toast.
- **Editar:** resolve o registro por id, abre preenchido no wizard e substitui a linha.
- **Detalhes:** abre o modal somente leitura; não altera dados.
- **Colar imagem:** na etapa Conteúdo e mídias, `Ctrl` + `V` incorpora imagens do clipboard à galeria.
- **Aprovar:** confirmação → status `Aprovado`; linha e KPIs atualizados.
- **Recusar:** confirmação → status `Recusado`; linha e KPIs atualizados.
- **Excluir:** só abre quando `Revisar` e sem histórico; confirmação → remove da lista e recalcula.
- **Relatórios:** PDF/CSV do conjunto vigente; lista vazia → aviso.
- **F5:** restaura o dataset de demonstração (fase frontend).

## 7. Navegação, RBAC e auditoria

- Item **Lançar as Chamadas** na sessão **Movimentos** (`Megaphone`, `#f59e0b`), com
  `to: '/admin/lancar-chamadas'` e `aria-current="page"`.
- Rota sujeita a `app/middleware/auth.global.ts`; sem sessão → login com `?redirect=`.
- Gates da UI via `.can('lancar-chamadas', ação)`:
  - `criar` → Nova Chamada
  - `alterar` → Editar e Recusar
  - `excluir` → Excluir
  - `publicar` → Aprovar
  - `download` → Relatórios
  - `filtrar` → Filtros
  - `buscar` → campo de busca
  - `visualizar` → acesso à tela e item da sidebar
- **Auditoria:** não há auditoria nesta fase (frontend em memória); a fase backend deverá registrar
  inclusão, alteração, aprovação, recusa e exclusão no recurso **"Lançar as Chamadas"**.

## 8. Validações e regras de negócio

- `chamada`: obrigatória, ≤60, sem duplicidade (case-insensitive) no conjunto carregado.
- `titulo`: obrigatório, ≤255.
- `softwareId`, `parceiroId`, `modulo` e `descricaoCompleta`: obrigatórios; `modulo` ≤100.
- `manualTitulo`: opcional, ≤255.
- Ao menos um vínculo (Release, Projeto ou Manual).
- `dataLancamento`: obrigatória e segunda-feira. `dataLiberacao`: opcional; se preenchida,
  segunda-feira. Ao selecionar uma Release, recebe a `dataPublicacao` dela automaticamente.
- Links: `http(s)` quando informados.
- Tags: até 12, cada uma até 30 caracteres; duplicadas são ignoradas; ficam na Classificação.
- Imagens: PNG/JPG/WebP, até 5 MB cada, por seleção ou colagem `Ctrl+V`; inválidas são recusadas.
- `situacao`: não editável no formulário; valor preservado e default `Desenvolvimento`.
- Novo status `Revisar`; status não editável no formulário.
- Exclusão bloqueada quando `status !== 'Revisar'` ou `temHistorico = true`.
- Aprovação e recusa bloqueadas quando o status já não é `Revisar`.

### Ordenação

A ordenação é **sempre pelo número da chamada** (`chamada ASC`, com comparação numérica natural). Não
existe mais campo de ordem manual no formulário e o valor de `ordem_apresentacao` não é usado para
ordenar. A mesma regra vale para as listas de itens de Release Week, Manuais e Escopo de Projetos, que
passaram a ordenar por `chamada ASC`; a coluna `ordem_apresentacao` permanece apenas como legado no
schema.

## 9. Relatórios PDF/CSV

- **PDF:** A4 paisagem, logo opcional, título, data de geração, contagem, colunas da listagem e
  rodapé com paginação.
- **CSV:** separador `;`, BOM UTF-8, cabeçalho e neutralização de fórmulas.
- Ambos usam o conjunto vigente (filtros + busca) e a permissão `download`.
- Nenhum arquivo é gerado com o conjunto vazio.

## 10. Design system

- **Novo componente:** `UiTagInput` (`app/components/ui/TagInput.vue`), documentado na
  [`§5.24`](01%20-%20design_system.md) e na seção 24 do `/design`.
- **Reuso:** `UiDataTable`, `UiModal`, `UiModalSection`, `UiInput`, `UiSelect`, `UiDatePicker`,
  `UiSegmented`, `UiTextarea`, `UiBadge`, `UiActionMenu`, `UiKpi`, `UiButton`, `UiTooltip`,
  `UiUploadFiles` e `UiLoading`.
- **Tokens:** foco `brand-focus` `#1a9e07`, erro `rose-700`, accent `brand-accent`; tipografia
  mono para chamada/datas.

## 11. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) §5.23 (ActionMenu) e §5.24 (TagInput).
- Arquitetura: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md).
- Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md).
- Módulos consumidores: [`docs/12`](12%20-%20Módulo%20das%20Releases%20Week.md),
  [`docs/13`](13%20-%20Módulo%20de%20Manuais%20Mensais.md) e
  [`docs/14`](14%20-%20Módulo%20do%20Escopo%20de%20Projetos.md).
- Banco: [`docs/bd/01`](bd/01%20-%20banco_dados_mariadb.sql) (`entregas_itens`,
  `historico_esteira_revisao`, `anexos_midias`).

## 12. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes: `tests/lancar-chamadas-validadores.test.ts` (obrigatórios, vínculos/origem, segunda-feira,
  duplicidade, links, tags, filtros por campos e períodos, KPIs e guardas de exclusão/aprovação/recusa).
- Manual: `/admin/lancar-chamadas` — F5, busca, filtros (incluindo períodos), wizard (etapas
  clicáveis), criar/editar/detalhar, colar imagem com `Ctrl+V`, aprovar/recusar, exclusão
  bloqueada/permitida, PDF/CSV e recarga restauradora.
- Vitrine: `http://localhost:3000/design` — seção 24.
- Regressão: navegação da sidebar, `/design` e modais de itens de Release Week, Manuais e Escopo de
  Projetos (somente leitura).

## 13. Pendências e próximos passos

- **Backend/API real** de `entregas_itens`, com persistência, RBAC e auditoria.
- **`manualTitulo`**: campo existe apenas no modelo frontend nesta fase; a fase backend deve definir
  a coluna/armazenamento (não há coluna correspondente em `entregas_itens`).
- **`arquivada`** e ação Arquivar (decisão de schema).
- **Importação XLSX** de chamadas (exige `importar` no catálogo RBAC).
- **`anexos_midias`** e upload persistente (hoje apenas `imagens` em memória).
- **Histórico real** da Esteira de Revisão (`temHistorico` é simulado nesta fase).
- **Unicidade de `chamada`** no banco (hoje só índice).
- **Área Pública** e exposição das chamadas publicadas.
