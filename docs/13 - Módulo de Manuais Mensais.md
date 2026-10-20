# 13 - Módulo de Manuais Mensais — Área Administrativa

**Versão:** 2.0.0 — **Data:** 2026-10-20 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal e **backend** do módulo **Manuais Mensais** — o cabeçalho do catálogo
mensal (`codigo`, `titulo`, `descricao`, `ano`, `mes`, `mes_numero`, `status`, `destaque_mes`,
`destaque_semana`, `total_visualizacoes`, `autor_nome`, `revisor_nome`, `arquivada`,
`data_criacao`, `data_publicacao`, timestamps), os **cinco KPIs** (Rascunho, Em Revisão,
Alterações Solicitadas, Aprovado, Publicado), busca/filtros/ordenação/paginação, as **ações de
linha** (Clonar, Editar, Publicar, Arquivar e Excluir condicionada), a **flag de itens** com
expansão somente leitura, as **exportações PDF/CSV** e a **importação histórica por planilha**.
O backend está implementado (`/api/manuais/**`), com RBAC, auditoria e transação na importação.
**Arquivos-fonte:** [`app/pages/admin/manuais.vue`](../app/pages/admin/manuais.vue) ·
[`app/components/manuais/`](../app/components/manuais) ·
[`shared/utils/manuais.ts`](../shared/utils/manuais.ts) ·
[`server/utils/manuais.ts`](../server/utils/manuais.ts) ·
[`server/api/manuais/`](../server/api/manuais) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Design system:** [`/design`](../app/pages/design.vue) — variante `alteracoes` do `UiBadge`
(seção 4), `UiDataTable` com expansão de linha, `UiActionMenu`, `UiKpi`, `UiModal`,
`UiSegmented`, `UiSwitch`, `UiSelect`, `UiTextarea`, `UiUploadFiles`, `UiTooltip` e `UiLoading`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) (§5.2, §5.11, §5.23)
**Autoridade de comportamento:** `openspec/specs/manuais-mensais` e `openspec/specs/autorizacao-rbac`
(deltas da change `manuais-backend-e-importacao`)

> Este documento é a referência da tela `/admin/manuais`, da API e da importação. Em caso de
> divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados (API)](#4-contrato-de-dados-api)
5. [Fluxos](#5-fluxos)
6. [Navegação, RBAC e auditoria](#6-navegação-rbac-e-auditoria)
7. [Importação histórica por planilha](#7-importação-histórica-por-planilha)
8. [Documentação relacionada](#8-documentação-relacionada)
9. [Verificação](#9-verificação)
10. [Pendências e próximos passos](#10-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A tela de Manuais Mensais é o **catálogo mensal** da Área Administrativa:

- **Rota:** `/admin/manuais` → `app/pages/admin/manuais.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Modelo de dados:** `docs/bd/01` §15 (`manuais_mensal`) — `id` (PK), `codigo`
  (`MAN-XX/AAAA`), `titulo`, `descricao`, `ano`, `mes` (por extenso), `mes_numero` (1–12),
  `status` (`Rascunho` | `Em Revisão` | `Alterações Solicitadas` | `Aprovado` | `Publicado`),
  `destaque_mes`, `destaque_semana`, `total_visualizacoes`, `autor_id`, `revisor_id`,
  `revisor_feedback`, `data_criacao`, `data_publicacao`, `arquivada` e timestamps. Os itens vivem
  em `entregas_itens` (`manual_id`); os arquivos, em `anexos_midias` (`manual_id`).
- **Persistência:** `GET /api/manuais` carrega os catálogos não arquivados (com `itensCount`);
  inclusão/edição/publicação/arquivamento/exclusão/importação gravam no banco via API. A recarga
  rebusca os dados — não há mais dataset de demonstração.
- **Status x arquivamento:** `status` é o fluxo editorial de **cinco** valores; **`arquivada` é um
  booleano separado**. Arquivar é soft, remove o mês da listagem/KPIs e **não** apaga dados/itens.
- **Componentização:** a página é fina e dona da coordenação; cada parte é um componente em
  `app/components/manuais/` (auto-import com prefixo `Manuais*`).

## 2. Estrutura da página (componentização)

```
admin/manuais.vue                                   (page - definePageMeta + composição + coordenação)
├── <UiLoading v-if="carregando" />                 → overlay real do GET /api/manuais
├── <ManuaisCabecalho @novo />                      → tile BookOpen #f45f71 + título + "Relatórios" + "Novo Manual"
├── <ManuaisKpis class="mt-6" />                    → 5 UiKpi do conjunto VIGENTE
├── <ManuaisTabela
│       ref
│       @editar @clonar @publicar @arquivar
│       @excluir @importar @open-filters />         → busca + Import + Filtros + tabela + UiActionMenu + flag de itens
├── <ManuaisFiltros v-model="filtrosAbertos" />     → modal (Status, Ano, Mês, Autor, Destaque)
├── <ManuaisImportar v-model="importarAberto" />    → upload .xlsx + pré-visualização + commit
├── <ManuaisFormulario v-model :modo :manual :prefill /> → cadastro/edição/clonagem
├── <ManuaisPublicar v-model :manual @confirmar />  → confirmação de publicação
├── <ManuaisArquivar v-model :manual @confirmar />  → confirmação de arquivamento
└── <ManuaisExclusao v-model :manual @confirmar />  → confirmação de exclusão (condicionada)
```

- **Estado de coordenação:** `carregando` (overlay da montagem), `filtrosAbertos`,
  `importarAberto`, `modalAberto`/`modo`/`manualEditar`/`prefill` (cadastro, edição e clonagem),
  `publicarAberto`, `arquivarAberto` e `exclusaoAberta`, cada um com a linha-alvo.
  `abrirEdicao`/`abrirClonagem`/`abrirExclusao` resolvem o registro **completo** por `id` na base
  carregada.
- **Loading:** `onMounted` chama `carregarManuais()`; o overlay `UiLoading` ("Carregando Manuais
  Mensais…") cobre o `GET` real. Em falha, toast de erro e tabela vazia. A expansão dos itens tem
  loading/erro/estado vazio próprios.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8`.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<ManuaisCabecalho>`

- Cabeçalho sem container: tile `bg-brand-primary` com `BookOpen` em `#f45f71`, título "Manuais
  Mensais" e subtítulo "Catálogo mensal de manuais e procedimentos técnicos — mês, status, autor e
  itens."
- **Botão "Novo Manual"** (`UiButton` primary + `Plus`): emite `@novo`; gated por
  `manuais`/`criar`.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, `role="menu"`):
  "Listagem em PDF" (`gerarPdfManuais`) e "Exportar em CSV" (Código, Título, Mês/Ano, Status,
  Autor, Publicação, Destaques). Antes de gerar, chama `GET /api/manuais?exportar=1` como guarda da
  permissão `exportar`; falha → toast. Lista vazia → aviso.
- **CSV:** separador `;`, BOM UTF-8 e neutralização de fórmulas (`=`, `+`, `-`, `@`, tab, CR).

### 3.2 `Kpis.vue` → `<ManuaisKpis>`

- Cinco `UiKpi` do **conjunto vigente** (filtrado, quando houver filtro): **Rascunho**
  (`#64748b`, `FileText`), **Em Revisão** (`#7c3aed`, `Search`), **Alterações Solicitadas**
  (`#d97706`, `MessageSquareWarning`), **Aprovado** (`#1a9e07`, `CheckCircle2`) e **Publicado**
  (`#112051`, `Rocket`).
- Arquivados não entram na contagem (a API já os exclui).

### 3.3 `Tabela.vue` → `<ManuaisTabela>`

- `UiDataTable` com **Código, Título, Mês/Ano, Status, Autor e Publicação** + coluna de ações.
  Busca/ordenação/paginação no cliente (`default-page-size` 5) sobre a lista da API.
- **Filtros** (`showFilters`) e **Import** à esquerda do botão Filtros (`slot filtersLeft`),
  gated por `filtrar`/`buscar`/`importar`.
- **Destaques:** `Star` (âmbar) ao lado do título para destaque do mês e `CalendarDays` (azul) para
  destaque da semana, cada um com tooltip.
- **Status** em `UiBadge`: `Rascunho`→`neutral`, `Em Revisão`→`inReview`, `Alterações
  Solicitadas`→`alteracoes`, `Aprovado`→`reconciled`, `Publicado`→`publicado`.
- **Flag de itens no cabeçalho** (`slot expandHeader`): um checkbox liga `expandable`; ao marcar,
  cada linha ganha um **`+`** que expande a linha (`slot expanded`) exibindo `<ManuaisItens>`.
  A flag só aparece com `manuais`/`visualizar_itens`; desmarcar recolhe todas.
- **Ações** (por linha): **Editar** (`alterar`) e **Excluir** (`excluir`) ficam como ícones inline
  à esquerda dos três pontinhos; o `UiActionMenu` agrupa **Clonar** (`clonar`), **Publicar**
  (`publicar`) e **Arquivar** (`arquivar`). "Publicar" fica desabilitado quando o status já é
  `Publicado`; "Excluir" fica desabilitado (com motivo) quando o mês tem itens (`itensCount` da
  API). O backend reaplica a guarda, inclusive para anexos.
- **Importação:** o ícone emite `@importar` e a página abre `<ManuaisImportar>`; o toast
  provisório da fase frontend foi removido.

### 3.4 `Itens.vue` → `<ManuaisItens>`

- Recebe `manualId`/`codigo` e busca `GET /api/manuais/:id/itens` **sob demanda** (cache por
  manual). Exibe loading/erro (com "Tentar novamente" usando `forcar`) e estado vazio ("Nenhum item
  vinculado a este manual."). Colunas: Chamada, Título, Software, Módulo, Tipo, Impacto, Situação,
  Status (`UiBadge`) e Data de liberação — somente leitura.
- A API inclui `entregas_itens` com `manual_id = :id` (origem `Manual` ou `Ambos`).

### 3.5 `Filtros.vue` → `<ManuaisFiltros>`

- `UiModal size="md"` com **Status, Ano, Mês, Autor e Destaque** (`UiSelect`; vazio = todos) e os
  botões "Limpar Filtros", "Cancelar" e "Aplicar". O filtro de destaque oferece "Todos",
  "Destaque do mês" e "Destaque da semana". Rascunho isolado que espelha o estado vigente ao abrir;
  "Limpar Filtros" zera rascunho e estado, mantendo o modal aberto.

### 3.6 `Formulario.vue` → `<ManuaisFormulario>` (cadastro/edição/clonagem)

- `UiModal size="lg"`, um componente para os três modos:
  - **Novo:** abre com status `Rascunho`, mês atual pré-selecionado, ano atual e destaques
    desligados.
  - **Editar:** preenchido, com **Código** somente leitura e a seção **Informações de Cadastro**
    (Criado em/Atualizado em/Data de publicação desabilitados).
  - **Clonar:** modo criação com **Título**, **Descrição**, **Destaque do mês** e **Destaque da
    semana** copiados; `codigo`, `mes`, `ano`, datas, `status` (`Rascunho`), itens e anexos em
    branco.
- Seções: **Dados do Catálogo** (Título obrigatório; Mês; Ano; Descrição), **Conteúdo e Status**
  (Status em `UiSegmented`; dois `UiSwitch` de destaque) e **Informações de Cadastro** (só na
  edição).
- **Validação** (cliente + regras puras `validarManual`): título obrigatório (≤255), mês do
  domínio, ano 1900–2100 e **unicidade `(ano, mês)`** no conjunto (exceto o próprio registro na
  edição). Erro persistente no campo e foco no primeiro problema.
- Salvar chama `POST /api/manuais` (novo/clone) ou `PUT /api/manuais/:id` (edição) e fecha com
  `toast.success`; a API gera o **Código** e devolve o registro. Erros `400/409` são mapeados para
  `data.erros` (`titulo`/`mes`/`ano`) com foco no primeiro campo; demais erros → toast.

### 3.7 `Publicar.vue` / `Arquivar.vue` / `Exclusao.vue`

- `UiModal size="sm"` de apresentação pura; emitem `confirmar` e a página chama a API.
- **Publicar:** `PUT /api/manuais/:id/publicar` — status `Publicado` e `data_publicacao` preenchida
  com `COALESCE(data_publicacao, CURRENT_DATE)`, **preservando a data histórica**.
- **Arquivar:** `PUT /api/manuais/:id/arquivar` — avisa que o catálogo sai da listagem/KPIs, que os
  dados/itens permanecem e que um catálogo arquivado não pode ser excluído.
- **Exclusao:** `DELETE /api/manuais/:id` — mostra código, título, mês/ano e a contagem de itens;
  avisa que é irreversível. Só é aberta quando `itensCount = 0`; a API reaplica a guarda
  (arquivada, itens ou anexos → `409`).

### 3.8 `Importar.vue` + `lerPlanilhaManuais.ts`

- `UiModal size="lg"` aberto pelo ícone de importação da toolbar: upload `.xlsx`,
  pré-visualização em `UiDataTable` (Mês/Ano, Título, Status, Publicação, Destaques e **Resultado**:
  `Pronto para importar` / `Já cadastrado` / `Repetido no arquivo` / `Linha inválida`), seleção das
  linhas prontas e commit em `POST /api/manuais/importar`.
- `lerPlanilhaManuais.ts`: parser puro do modelo (Título, Mês, Ano, Descrição, Status, Data de
  Criação, Data de Publicação, Destaque do mês e Destaque da semana), sem imports de Nuxt —
  `classificarLinhasManuais` é coberto por testes. A chave de duplicidade é `(ano, mês)` e
  `Publicado` exige `Data de Publicação`.

### 3.9 `gerarPdfManuais.ts`

- jsPDF A4 paisagem + autotable sobre o conjunto filtrado: cabeçalho com a logomarca de login
  (quando houver), título "Relatório de Manuais Mensais", data de geração, contagem, colunas
  Código, Título, Mês/Ano, Status, Autor, Publicação e Destaques, e rodapé "Página X de Y" ·
  "Publications · Manuais Mensais". Arquivo: `manuais-mensais.pdf`.

### 3.10 `validadores.ts` e `useManuaisModelo.ts`

- **`validadores.ts`:** reexporta `#shared/utils/manuais` (regras puras compartilhadas com o
  servidor e os testes).
- **`shared/utils/manuais.ts`:** tipos (`ManuaisModelo`, `ItemManual`, `StatusManual`,
  `FiltrosManuais`, `KpisManuais`, `LinhaManual`), `MESES`, `STATUS_MANUAL`, `gerarCodigo`,
  `mesPorNumero`, `formatarData`, `formatarMesAno`, `validarManual`, `prefillClone`,
  `motivoBloqueioExclusao`, `podeExcluirManual`, `filtrarManuais`, `calcularKpis`, `hojeIso`,
  `ehDataIso` e `dataPublicacaoAoPublicar`.
- **`useManuaisModelo.ts`:** estado `useState` (`manuais`, `carregando`, `carregado`,
  `itensPorManual`, `filtros`), `carregarManuais(forcar)`, `carregarItens(id, forcar)`, derivados
  (`manuaisFiltrados`, `linhas` com `itensCount` da API, `kpis`, `filtrosAtivosCount`, `opcoes`) e
  ações assíncronas (`adicionar`, `atualizar`, `publicar`, `arquivar`, `excluir`, `importar`).

## 4. Contrato de dados (API)

O frontend consome a API; o shape é o mesmo `ManuaisModelo` usado na tela:

```ts
interface ManuaisModelo {
  id: string
  codigo: string            // MAN-10/2026 (gerado pelo servidor)
  titulo: string
  descricao: string
  ano: number
  mes: string               // por extenso
  mesNumero: number         // 1..12
  status: 'Rascunho' | 'Em Revisão' | 'Alterações Solicitadas' | 'Aprovado' | 'Publicado'
  destaqueMes: boolean
  destaqueSemana: boolean
  totalVisualizacoes: number
  autorNome: string         // LEFT JOIN usuarios
  revisorNome: string       // LEFT JOIN usuarios (vazio até a Esteira de Revisão)
  arquivada: boolean
  dataCriacao: string       // AAAA-MM-DD
  dataPublicacao: string    // AAAA-MM-DD (histórica ou preenchida ao publicar)
  criadoEm: string          // ISO 8601
  atualizadoEm: string
  itensCount?: number       // COUNT de entregas_itens
}
```

**Rotas e permissões** (`requirePermission` em todas):

| Ação | Método e rota | Permissão |
|---|---|---|
| Listar | `GET /api/manuais` | `manuais`/`visualizar` (não arquivados + `itensCount`) |
| Guarda de exportação | `GET /api/manuais?exportar=1` | `manuais`/`exportar` |
| Itens | `GET /api/manuais/:id/itens` | `manuais`/`visualizar_itens` |
| Incluir/clonar | `POST /api/manuais` | `manuais`/`criar` |
| Editar | `PUT /api/manuais/:id` | `manuais`/`alterar` |
| Publicar | `PUT /api/manuais/:id/publicar` | `manuais`/`publicar` |
| Arquivar | `PUT /api/manuais/:id/arquivar` | `manuais`/`arquivar` |
| Excluir | `DELETE /api/manuais/:id` | `manuais`/`excluir` |
| Importar | `POST /api/manuais/importar` | `manuais`/`importar` |

- **Código:** derivado de `mes`/`ano` (`MAN-XX/AAAA`) na criação e **regenerado na edição** quando
  `mes`/`ano` mudam; duplicidade de `codigo`/`(ano, mes_numero)` → `409` com erro no campo `mes`.
- **Validação:** título obrigatório (≤255), mês do domínio, ano 1900–2100, status do domínio e datas
  civis válidas → `400` com `data.erros`.
- **Autor/revisor:** `autor_id` = sessão; `autorNome`/`revisorNome` vêm de `LEFT JOIN usuarios`;
  `revisor_id` fica nulo até a Esteira de Revisão.
- **Datas:** `data_criacao` = data histórica da importação ou `CURRENT_DATE`; `data_publicacao` =
  data histórica, `CURRENT_DATE` quando o status é `Publicado` no cadastro normal, ou nula. O
  publicar usa `COALESCE(data_publicacao, CURRENT_DATE)` e **não sobrescreve** a data histórica.
- **Arquivamento:** `PUT /:id/arquivar` marca `arquivada = 1`; a listagem filtra as arquivadas.
- **Exclusão:** `409` quando arquivada, com itens em `entregas_itens` ou com anexos em
  `anexos_midias`.
- **Auditoria:** recurso **"Manuais Mensais"** (Inclusão/Alteração/Homologação/Exclusão).
- **Frontend:** `useManuaisModelo` mantém a lista da API, itens lazy/cache, filtros em sessão e os
  derivados `linhas`/`kpis`/`opcoes`; as escritas chamam a API e atualizam a lista local.

## 5. Fluxos

- **Listagem:** `GET /api/manuais` no `onMounted`; overlay no voo; falha → toast + lista vazia;
  busca/ordenação/paginação no cliente.
- **Filtros:** o modal refina o conjunto vigente (Status, Ano, Mês, Autor, Destaque); "Aplicar"
  recalcula tabela e KPIs; "Limpar Filtros" restaura; o badge conta os filtros ativos.
- **Novo:** abre com mês/ano atuais e status `Rascunho`; salvar grava via `POST` e inclui no topo.
- **Editar:** resolve o registro por `id`, abre preenchido (Código e carimbos somente leitura) e
  grava `PUT`.
- **Clonar:** abre o formulário em modo criação com título/descrição/destaques copiados; nada é
  gravado até salvar; os itens e anexos **não** são copiados; a gravação usa `POST` (`criar`).
- **Publicar:** confirmação → `PUT /publicar` (status `Publicado` + data preservada/preenchida).
- **Arquivar:** confirmação → `PUT /arquivar`; some da listagem/KPIs sem apagar dados ou itens.
- **Excluir:** habilitado só sem itens; `DELETE`; `409` quando arquivada, com itens ou anexos.
- **Itens:** a flag (quando permitida) mostra o `+`; o clique busca `GET /:id/itens` e expande o
  `<ManuaisItens>` (somente leitura).
- **Exportações:** menu "Relatórios" valida `exportar` na API e gera CSV (`;`, BOM, neutralização)
  e PDF do conjunto filtrado.
- **Importação:** ver §7.
- **Recarga:** rebusca `GET /api/manuais`; as alterações persistem no banco.

## 6. Navegação, RBAC e auditoria

- O item **Manuais** da sessão **Publicações** da sidebar (`app/config/navigation.ts`, ícone
  `BookOpen` `#f45f71`) declara `to: '/admin/manuais'` e fica ativo na rota (`aria-current`).
- A rota fica sujeita à guarda de sessão (`app/middleware/auth.global.ts`); sem sessão →
  `/admin/login?redirect=`.
- A matriz do módulo `manuais` controla a tela e a API: `visualizar`, `criar`, `alterar`, `excluir`,
  `publicar`, `arquivar`, `download`, `exportar`, `importar`, `filtrar`, `buscar`, `clonar` e
  `visualizar_itens`. A clonagem exige `clonar` na UI e `criar` na gravação; a matriz recusa
  `clonar` sem `criar`.
- **Catálogo RBAC:** total **90**; Administrador `90/90`, Editor `65/90`, Revisor `39/90`, Leitor
  `14/90`; total `208` e denominador `4 × 90 = 360` (`docs/07`).
- **Auditoria:** o recurso **"Manuais Mensais"** aparece automaticamente no filtro de recursos;
  as rotas mapeadas estão em `docs/05` §6.2.

## 7. Importação histórica por planilha

- **Modelo oficial:** [`docs/modelos/modelo-importacao-manuais.xlsx`](modelos/modelo-importacao-manuais.xlsx)
  com **Título, Mês, Ano, Descrição, Status, Data de Criação, Data de Publicação, Destaque do mês
  e Destaque da semana** (sem Código — o servidor gera).
- **Fluxo:** o ícone da toolbar abre `ManuaisImportar`; o parser local classifica as linhas
  (`pronto`/`já cadastrado`/`repetido`/`inválida`); o commit vai a `POST /api/manuais/importar`, que
  revalida (incluindo datas e publicação obrigatória para `Publicado`), recusa tudo se houver linha
  inválida/duplicada (`400` com motivos/conflitos), grava em **transação** (códigos gerados) e
  registra auditoria.
- **Datas:** aceita data do Excel, `dd/mm/aaaa` e `AAAA-MM-DD`; não há regra de segunda-feira nem
  exigência de a publicação cair no mês de referência. `Data de Criação` vazia usa a data da
  importação; `Data de Publicação` é obrigatória quando o status é `Publicado`.
- **Unicidade:** `(ano, mês)` no arquivo e contra o banco (inclui arquivados); limite de 500 linhas.
- **Permissão:** `manuais`/`importar` (default: Administrador).
- **Limitação:** o autor histórico **não** é preservado; todos os registros importados ficam com o
  usuário que executa a importação. `data_criacao` histórica é armazenada, mas a tela exibe
  `criado_em`/`atualizado_em`; a data histórica visível é a de publicação.

## 8. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) — §5.2 (Badge, variante `alteracoes`),
  §5.11 (DataTable/expansão), §5.23 (ActionMenu); vitrine `/design` seção 4.
- Arquitetura/base: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md);
  Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md);
  Auditoria: [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md);
  RBAC: [`docs/07`](07%20-%20Perfis%20de%20Acesso%20(RBAC).md).
- Módulos-molde: [`docs/10`](10%20-%20Módulo%20dos%20Softwares.md),
  [`docs/11`](11%20-%20Módulo%20de%20Parceiros.md) e
  [`docs/12`](12%20-%20Módulo%20das%20Releases%20Week.md).
- Banco: [`docs/bd/01`](bd/01%20-%20banco_dados_mariadb.sql) §15 e
  [`docs/bd/02_seed.sql`](bd/02_seed.sql).

## 9. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes unitários: `tests/manuais-validadores.test.ts` cobre obrigatórios, mês 1–12, unicidade
  `(ano, mês)`, `prefillClone`, guarda de exclusão (arquivado/itens/anexos), KPIs e datas;
  `tests/manuais-import-parser.test.ts` cobre datas, status, publicação obrigatória, duplicidade,
  já cadastrado e destaques.
- Banco: o boot do Nitro aplica as migrations 21/22 (já existentes); conferir a coluna `arquivada`,
  o índice `idx_manuais_arquivada` e os `extras` do módulo nos quatro perfis.
- E2E/API: `GET` 200; `POST` válido 201 com código; duplicidade 409; edição/regeneração de código;
  publicar (data histórica preservada); arquivar; exclusão 409/200; itens; importação
  válida/inválida/conflito; `403` sem permissão.
- Conferência manual: `http://localhost:3000/admin/manuais` — carga da API, criar, editar, clonar,
  publicar, arquivar, excluir, itens, importação histórica e F5 preservando os dados; recarregar
  confirma a persistência. Vitrine: `http://localhost:3000/design` (seção 4).

## 10. Pendências e próximos passos

- **Itens:** o CRUD de `entregas_itens` pertence ao módulo "Lançar as Chamadas" (aqui é somente
  leitura e a relação que bloqueia a exclusão).
- **Anexos:** galeria/upload de `anexos_midias` (fase backend/CRUD de itens); a exclusão já os
  considera.
- **Área Pública:** exposição dos manuais publicados/destaques (fora deste módulo).
- **Revisão:** `revisor_id`/`revisor_feedback` existem no schema; o fluxo de revisão/homologação
  pode ganhar UI própria na Esteira de Revisão (hoje o formulário não edita o parecer).
- **Autor histórico:** a importação usa o usuário que importa; uma coluna `Autor` (e-mail) e
  resolução de usuário ficam para uma fase futura.
- **Exportação server-side:** o CSV/PDF continua no cliente, sob a guarda `exportar` da API.
