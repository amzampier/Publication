# 13 - Módulo de Manuais Mensais — Área Administrativa

**Versão:** 1.0.0 — **Data:** 2026-10-20 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal do módulo **Manuais Mensais** — o cabeçalho do catálogo mensal
(`codigo`, `titulo`, `descricao`, `ano`, `mes`, `mes_numero`, `status`, `destaque_mes`,
`destaque_semana`, `total_visualizacoes`, `autor_nome`, `revisor_nome`, `arquivada`,
`data_criacao`, `data_publicacao`, timestamps), os **cinco KPIs** (Rascunho, Em Revisão,
Alterações Solicitadas, Aprovado, Publicado), busca/filtros/ordenação/paginação, as **ações de
linha** (Clonar, Editar, Publicar, Arquivar e Excluir condicionada), a **flag de itens** no
cabeçalho da tabela com expansão somente leitura dos itens de cada mês, as **exportações PDF/CSV**
e a **affordance de importação**. O **frontend está implementado** com dataset em memória; o
**backend é a próxima fase** (a coluna `arquivada` e as permissões `clonar`/`visualizar_itens` já
foram preparadas no schema).
**Arquivos-fonte:** [`app/pages/admin/manuais.vue`](../app/pages/admin/manuais.vue) ·
[`app/components/manuais/`](../app/components/manuais) ·
[`app/config/navigation.ts`](../app/config/navigation.ts) ·
[`server/migration/21_add_manuais_arquivada.sql`](../server/migration/21_add_manuais_arquivada.sql) ·
[`server/migration/22_reconciliar_rbac_manuais.sql`](../server/migration/22_reconciliar_rbac_manuais.sql)
**Design system:** [`/design`](../app/pages/design.vue) — variante `alteracoes` do `UiBadge`
(seção 4), `UiDataTable` com expansão de linha, `UiActionMenu`, `UiKpi`, `UiModal`,
`UiSegmented`, `UiSwitch`, `UiSelect`, `UiTextarea`, `UiTooltip` e `UiLoading`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) (§5.2, §5.11, §5.23)
**Autoridade de comportamento:** `openspec/specs/manuais-mensais` (delta da change
`construir-manuais-mensais`) e `openspec/specs/perfis-acesso` (catálogo 90)

> Este documento é a referência da tela `/admin/manuais` e de tudo o que foi criado para ela —
> componentes de domínio, dataset em memória, RBAC, migrations de contrato, filtros, exportações
> e modais. Em caso de divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados](#4-contrato-de-dados)
5. [Fluxos](#5-fluxos)
6. [Navegação e RBAC](#6-navegação-e-rbac)
7. [Dataset em memória, migrations e importação](#7-dataset-em-memória-migrations-e-importação)
8. [Documentação relacionada](#8-documentação-relacionada)
9. [Verificação](#9-verificação)
10. [Pendências e próximos passos](#10-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A tela de Manuais Mensais é o **catálogo mensal** da Área Administrativa:

- **Rota:** `/admin/manuais` → `app/pages/admin/manuais.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Modelo de dados:** conforme `docs/bd/01` §15 (tabela `manuais_mensal`) — `id` (PK),
  `codigo` (`MAN-XX/AAAA`), `titulo`, `descricao`, `ano`, `mes` (por extenso), `mes_numero`
  (1–12), `status` (`Rascunho` | `Em Revisão` | `Alterações Solicitadas` | `Aprovado` |
  `Publicado`), `destaque_mes`, `destaque_semana`, `total_visualizacoes`, `autor_id`,
  `revisor_id`, `revisor_feedback`, `data_criacao`, `data_publicacao`, `arquivada` e timestamps.
  Os itens vivem em `entregas_itens` (`manual_id`, `origem='Manual'`); os arquivos, em
  `anexos_midias` (`manual_id`).
- **Status x arquivamento:** `status` é o fluxo editorial de **cinco** valores. **`arquivada` é um
  booleano separado** — arquivar é soft, remove o mês da listagem/KPIs e **não** apaga dados/itens.
- **Persistência nesta fase:** **dataset em memória** (`useState`); recarregar restaura o conjunto
  inicial e nada é gravado no banco. A API (`GET /api/manuais` e escritas) é a fase backend.
- **Componentização:** a página é fina e dona da coordenação; cada parte é um componente em
  `app/components/manuais/` (auto-import com prefixo `Manuais*`).

## 2. Estrutura da página (componentização)

```
admin/manuais.vue                                  (page - definePageMeta + composição + coordenação)
├── <ManuaisCabecalho @novo />                     → tile BookOpen #f45f71 + título + menu "Relatórios" + "Novo Manual"
├── <ManuaisKpis class="mt-6" />                   → 5 UiKpi do conjunto VIGENTE
├── <ManuaisTabela
│       ref
│       @editar @clonar @publicar @arquivar
│       @excluir @importar @open-filters />        → busca + Import + Filtros + tabela + UiActionMenu + flag de itens
├── <ManuaisFiltros v-model="filtrosAbertos" />    → modal (Status, Ano, Mês, Autor, Destaque)
├── <ManuaisFormulario v-model :modo :manual :prefill /> → cadastro/edição/clonagem
├── <ManuaisPublicar v-model :manual @confirmar /> → confirmação de publicação
├── <ManuaisArquivar v-model :manual @confirmar /> → confirmação de arquivamento
└── <ManuaisExclusao v-model :manual @confirmar /> → confirmação de exclusão (condicionada)
```

- **Estado de coordenação:** `filtrosAbertos`, `modalAberto`/`modo`/`manualEditar`/`prefill`
  (cadastro, edição e clonagem), `publicarAberto`, `arquivarAberto` e `exclusaoAberta`, cada um com
  a linha-alvo. `abrirEdicao`/`abrirClonagem`/`abrirExclusao` resolvem o registro **completo** por
  `id` na base carregada.
- **Loading:** o dataset em memória é imediato, então a montagem não exibe overlay (o
  `carregarManuais` existe como ponto de troca para `GET /api/manuais` na fase backend). A expansão
  dos itens tem loading/erro/estado vazio próprios.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8`.
- **Importação:** o ícone da toolbar é apenas affordance; o clique exibe um toast informando que a
  importação entra na fase backend (nenhum modal/requisição).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<ManuaisCabecalho>`

- Cabeçalho sem container: tile `bg-brand-primary` com `BookOpen` em `#f45f71`, título "Manuais
  Mensais" e subtítulo "Catálogo mensal de manuais e procedimentos técnicos — mês, status, autor e
  itens."
- **Botão "Novo Manual"** (`UiButton` primary + `Plus`): emite `@novo`; gated por
  `manuais`/`criar`.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, `role="menu"`):
  "Listagem em PDF" (`gerarPdfManuais`) e "Exportar em CSV" (Código, Título, Mês/Ano, Status,
  Autor, Publicação, Destaques). Fecha por clique fora/Escape; gated por `manuais`/`exportar`.
- **CSV:** separador `;`, BOM UTF-8 e neutralização de fórmulas (`=`, `+`, `-`, `@`, tab, CR).
  Lista vazia → aviso "Não há Manuais Mensais para exportar com os filtros atuais."

### 3.2 `Kpis.vue` → `<ManuaisKpis>`

- Cinco `UiKpi` do **conjunto vigente** (filtrado, quando houver filtro): **Rascunho**
  (`#64748b`, `FileText`), **Em Revisão** (`#7c3aed`, `Search`), **Alterações Solicitadas**
  (`#d97706`, `MessageSquareWarning`), **Aprovado** (`#1a9e07`, `CheckCircle2`) e **Publicado**
  (`#112051`, `Rocket`).
- Arquivados não entram na contagem (a lista já os exclui).

### 3.3 `Tabela.vue` → `<ManuaisTabela>`

- `UiDataTable` com **Código, Título, Mês/Ano, Status, Autor e Publicação** + coluna de ações.
  Busca/ordenação/paginação no cliente (`default-page-size` 5) sobre a lista do modelo.
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
  `Publicado`; "Excluir" fica desabilitado (com motivo) quando o mês tem itens.

### 3.4 `Itens.vue` → `<ManuaisItens>`

- Recebe `manualId`/`codigo` e lê os itens do manual (cache por mês no modelo). Exibe
  loading/erro (com "Tentar novamente") e estado vazio ("Nenhum item vinculado a este manual.").
  Colunas: Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status (`UiBadge`) e Data
  de liberação — somente leitura.
- **Contrato futuro:** `GET /api/manuais/:id/itens` sob `manuais`/`visualizar_itens`.

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
- Salvar chama `adicionar`/`atualizar` (dataset em memória) e fecha com `toast.success`; o
  **Código** é gerado no padrão `MAN-<mês>/<ano>`.

### 3.7 `Publicar.vue` / `Arquivar.vue` / `Exclusao.vue`

- `UiModal size="sm"` de apresentação pura; emitem `confirmar` e a página fecha/grava no modelo.
- **Publicar:** confirma a mudança de status para `Publicado` e preenche `dataPublicacao`.
- **Arquivar:** avisa que o catálogo sai da listagem/KPIs, que os dados/itens permanecem e que um
  catálogo arquivado não pode ser excluído.
- **Exclusao:** mostra código, título, mês/ano e a contagem de itens; avisa que é irreversível. Só
  é aberta quando o catálogo não está arquivado e não tem itens (a página reaplica a guarda
  `motivoBloqueioExclusao`).

### 3.8 `gerarPdfManuais.ts`

- jsPDF A4 paisagem + autotable sobre o conjunto filtrado: cabeçalho com a logomarca de login
  (quando houver), título "Relatório de Manuais Mensais", data de geração, contagem, colunas
  Código, Título, Mês/Ano, Status, Autor, Publicação e Destaques, e rodapé "Página X de Y" ·
  "Publications · Manuais Mensais". Arquivo: `manuais-mensais.pdf`.

### 3.9 `validadores.ts` e `useManuaisModelo.ts`

- **`validadores.ts`:** tipos (`ManuaisModelo`, `ItemManual`, `StatusManual`, `FiltrosManuais`,
  `KpisManuais`, `LinhaManual`), `MESES`, `STATUS_MANUAL`, `gerarCodigo`, `mesPorNumero`,
  `formatarData`, `formatarMesAno`, `validarManual`, `prefillClone`, `motivoBloqueioExclusao`,
  `podeExcluirManual`, `filtrarManuais`, `calcularKpis`, `hojeIso` e `ehDataIso`.
- **`useManuaisModelo.ts`:** estado `useState` (`manuais`, `itensPorManual`, `filtros`,
  `carregado`), itens por manual (lazy/cache), derivados (`manuaisFiltrados`, `linhas`, `kpis`,
  `filtrosAtivosCount`, `opcoes`) e ações (incluir/editar/clonar/publicar/arquivar/excluir).

## 4. Contrato de dados

O frontend consome o modelo abaixo (nesta fase, do dataset em memória; na fase backend, da API):

```ts
interface ManuaisModelo {
  id: string
  codigo: string            // MAN-10/2026 (gerado pelo sistema)
  titulo: string
  descricao: string
  ano: number
  mes: string               // por extenso
  mesNumero: number         // 1..12
  status: 'Rascunho' | 'Em Revisão' | 'Alterações Solicitadas' | 'Aprovado' | 'Publicado'
  destaqueMes: boolean
  destaqueSemana: boolean
  totalVisualizacoes: number
  autorNome: string
  revisorNome: string
  arquivada: boolean
  dataCriacao: string       // AAAA-MM-DD
  dataPublicacao: string    // AAAA-MM-DD (preenchida ao publicar)
  criadoEm: string          // ISO 8601
  atualizadoEm: string
  itensCount?: number       // contagem de entregas_itens
}

interface ItemManual {
  id: string
  manualId: string
  chamada: string
  titulo: string
  software: string
  modulo: string
  tipo: 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
  impacto: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  situacao: 'Desenvolvimento' | 'Homologação' | 'Implantado'
  status: 'Revisar' | 'Aprovado' | 'Publicar'
  dataLiberacao: string     // AAAA-MM-DD
}
```

**Contrato futuro (`GET /api/manuais`):** a API devolverá os catálogos **não arquivados** com
`itensCount`, `autorNome`/`revisorNome` derivados de `usuarios`, e os itens por
`GET /api/manuais/:id/itens`. As escritas (incluir/editar/clonar/publicar/arquivar/excluir) gravarão
em `manuais_mensal` com RBAC e auditoria no servidor; o `codigo` será derivado de `mes`/`ano` e a
unicidade `(ano, mes_numero)` responderá `409`.

## 5. Fluxos

- **Listagem:** o dataset em memória é exibido na montagem; busca/ordenação/paginação no cliente.
- **Filtros:** o modal refina o conjunto vigente (Status, Ano, Mês, Autor, Destaque); "Aplicar"
  recalcula tabela e KPIs; "Limpar Filtros" restaura; o badge conta os filtros ativos.
- **Novo:** abre com mês/ano atuais e status `Rascunho`; salvar inclui no topo com código gerado.
- **Editar:** resolve o registro por `id`, abre preenchido (Código e carimbos somente leitura) e
  grava no conjunto.
- **Clonar:** abre o formulário em modo criação com título/descrição/destaques copiados; nada é
  gravado até salvar; os itens e anexos **não** são copiados.
- **Publicar:** confirmação → status `Publicado` + `dataPublicacao` de hoje.
- **Arquivar:** confirmação → `arquivada = true`; some da listagem/KPIs sem apagar dados ou itens.
- **Excluir:** habilitado só sem itens e não arquivado; confirmação remove o registro e devolve o
  foco à busca.
- **Itens:** a flag (quando permitida) mostra o `+`; o clique expande o `<ManuaisItens>` (somente
  leitura).
- **Exportações:** menu "Relatórios" gera CSV (`;`, BOM, neutralização) e PDF do conjunto filtrado.
- **Recarga:** o dataset volta ao conjunto inicial; nenhuma mudança persiste (fase frontend).

## 6. Navegação e RBAC

- O item **Manuais** da sessão **Publicações** da sidebar (`app/config/navigation.ts`, ícone
  `BookOpen` `#f45f71`) declara `to: '/admin/manuais'` e fica ativo na rota (`aria-current`).
- A rota fica sujeita à guarda de sessão (`app/middleware/auth.global.ts`); sem sessão →
  `/admin/login?redirect=`.
- A matriz do módulo `manuais` controla a tela: `visualizar`, `criar`, `alterar`, `excluir`,
  `publicar`, `arquivar`, `download`, `exportar`, `importar`, `filtrar`, `buscar`, **`clonar`** e
  **`visualizar_itens`** (13 funcionalidades). A clonagem exige `clonar` na UI e `criar` na
  gravação; a matriz recusa `clonar` sem `criar` (release-week e manuais).
- **Catálogo RBAC:** total **90**; contagens normativas Administrador `90/90`, Editor `65/90`,
  Revisor `39/90`, Leitor `14/90`; total concedido `208` e denominador `4 × 90 = 360`.
- **Migrations de contrato:** `21_add_manuais_arquivada.sql` (coluna + índice) e
  `22_reconciliar_rbac_manuais.sql` (`clonar` no Administrador/Editor e `visualizar_itens` nos
  quatro perfis). Em banco novo, `02_seed.sql` já traz a matriz vigente.

## 7. Dataset em memória, migrations e importação

- **Dataset:** `useState('manuais-base')` com cinco meses ativos (Rascunho, Em Revisão, Alterações
  Solicitadas, Aprovado e Publicado) e um arquivado; `useState('manuais-itens')` com itens de
  exemplo (inclusive um mês sem itens para o estado vazio). `useState` sobrevive à navegação
  interna e é descartado no F5.
- **Migração 21:** `ALTER TABLE manuais_mensal ADD COLUMN arquivada TINYINT(1) NOT NULL DEFAULT 0`
  após `destaque_semana`, + `idx_manuais_arquivada`; rollback comentado no arquivo.
- **Migração 22:** `JSON_ARRAY_APPEND` idempotente de `clonar` (Administrador/Editor) e
  `visualizar_itens` (todos os perfis); rollback comentado no arquivo.
- **Importação:** nesta fase, **affordance** apenas (ícone à esquerda de "Filtros", sob
  `importar`). O modelo `.xlsx`, o parser, a pré-visualização e o commit ficam para a fase backend.
- **Anexos:** `anexos_midias` não tem UI nesta fase; a galeria/upload entra com o CRUD de itens ou
  na fase backend.

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
  `(ano, mês)`, `prefillClone`, guarda de exclusão (arquivado/itens) e KPIs;
  `tests/perfis-funcionalidades.test.ts` cobre o total 90 e `clonar`⇒`criar` em `manuais`.
- Banco: o boot do Nitro aplica as migrations 21/22; conferir `SHOW COLUMNS FROM manuais_mensal
  LIKE 'arquivada'`, o índice `idx_manuais_arquivada` e os `extras` do módulo `manuais` nos quatro
  perfis.
- Conferência manual (com sessão): `http://localhost:3000/admin/manuais` — incluir (mês atual,
  título), editar, clonar (prefill), publicar, arquivar (some da lista/KPIs), excluir (guarda),
  flag de itens + expansão, filtros e exportações; recarregar confirma o reset do dataset.
- Vitrine: `http://localhost:3000/design` (seção 4 — variante "Alterações (Manuais)").

## 10. Pendências e próximos passos

- **Backend:** `GET /api/manuais`, `GET /api/manuais/:id/itens`, `POST`/`PUT`/`DELETE`,
  publicação/arquivamento, RBAC e auditoria no servidor; trocar o dataset pela API.
- **Unicidade:** o banco já tem `uk_manual_ano_mes`; a API deve responder `409` para conflito.
- **Itens:** o CRUD de `entregas_itens` pertence ao módulo "Lançar as Chamadas" (aqui é somente
  leitura e a relação que bloqueia a exclusão).
- **Anexos:** galeria/upload de `anexos_midias` (fase backend/CRUD de itens).
- **Importação:** modelo `.xlsx`, parser, pré-visualização e commit (fase backend).
- **Área Pública:** exposição dos manuais publicados/destaques (fora deste módulo).
- **Revisão:** `revisor_id`/`revisor_feedback` existem no schema; o fluxo de revisão/homologação
  pode ganhar UI própria na Esteira de Revisão (hoje o formulário não edita o parecer).
