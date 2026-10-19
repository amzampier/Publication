# 12 - Módulo das Releases Week — Área Administrativa

**Versão:** 1.0.0 — **Data:** 2026-10-19 — **Idioma:** Português do Brasil (pt-BR)
**Escopo (fase frontend):** tela principal do módulo **Release Week** — o cabeçalho das semanas de
entrega (`codigo`, `nome`, `versao`, `release`, `semana`, `ano`, `mes`, `data_inicio`,
`data_finaliza`, `data_publicacao`, `status`, `descricao`, `destaque_semana`, `autor_nome`,
`revisor_nome`, `arquivada`, timestamps), os **quatro KPIs** (Abertas, Em Revisão, Aprovadas,
Publicadas), busca/filtros/ordenação/paginação, as **ações de linha** (Clonar, Editar, Publicar,
Arquivar e Excluir condicionada), a **flag de itens** no cabeçalho da tabela com expansão somente
leitura dos itens de cada release, as **exportações PDF/CSV** e a affordância de importação (apenas
o ícone nesta fase). **Sem backend e sem seed:** a tela opera sobre um **dataset em memória**.
**Arquivos-fonte:** [`app/pages/admin/release-week.vue`](../app/pages/admin/release-week.vue) ·
[`app/components/release-week/`](../app/components/release-week) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Design system:** [`/design`](../app/pages/design.vue) — `UiActionMenu` (nova seção 23), variantes
`aberta`/`publicado`/`arquivado` do `UiBadge` e expansão de linha do `UiDataTable`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) (§5.2, §5.11, §5.23)
**Autoridade de comportamento:** `openspec/specs/release-week` (delta desta change em
`openspec/changes/construir-release-week-frontend/specs/release-week`)

> Este documento é a referência da tela `/admin/release-week` e de tudo o que foi criado para ela.
> Em caso de divergência com a spec, a spec prevalece. A fase backend (API, migration/seed e
> importação funcional) é uma etapa seguinte, registrada em §10.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados](#4-contrato-de-dados)
5. [Fluxos](#5-fluxos)
6. [Navegação até a tela](#6-navegação-até-a-tela)
7. [Dataset em memória e importação](#7-dataset-em-memória-e-importação)
8. [Documentação relacionada](#8-documentação-relacionada)
9. [Verificação](#9-verificação)
10. [Pendências e próximos passos](#10-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A tela de Release Week é o **cabeçalho do ciclo semanal** da Área Administrativa:

- **Rota:** `/admin/release-week` → `app/pages/admin/release-week.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Modelo de dados:** conforme `docs/bd/01` §13 (tabela `release_week`) — `id` (PK),
  `codigo` (`RW-01/2026`), `nome`, `versao`, `release`, `semana` (1–52), `ano`, `mes`, datas
  (`data_inicio`, `data_finaliza`, `data_publicacao`), `status`
  (`Aberta` | `Em Revisão` | `Aprovado` | `Publicado`), `descricao`, `destaque_semana`,
  `autor_nome`/`revisor_nome` e timestamps. Os itens relacionados vivem em `entregas_itens`
  (`release_id`).
- **Status x arquivamento:** `status` é o fluxo editorial (4 valores). **`arquivada` é um booleano
  separado** — arquivar é soft, remove a release da listagem/KPIs e **não** apaga dados. A coluna
  física correspondente entra no banco na fase backend.
- **Persistência (fase 1):** dataset em memória (`useState`) — ver §7. Nenhuma requisição de
  leitura/gravação nesta fase; recarregar a página restaura o conjunto inicial.
- **Componentização:** a página é fina e dona da coordenação; cada parte é um componente em
  `app/components/release-week/` (auto-import com prefixo `ReleaseWeek*`).

## 2. Estrutura da página (componentização)

```
admin/release-week.vue                              (page - definePageMeta + composição + coordenação)
├── <ReleaseWeekCabecalho @novo />                  → tile Rocket #1a9e07 + título + menu "Relatórios" + "Nova Release Week"
├── <ReleaseWeekKpis class="mt-6" />                → 4 UiKpi do conjunto VIGENTE
├── <ReleaseWeekTabela
│       ref
│       @editar @clonar @publicar @arquivar
│       @excluir @importar @open-filters />         → busca + Import + Filtros + tabela + UiActionMenu + flag de itens
├── <ReleaseWeekFiltros v-model="filtrosAbertos" /> → modal (Status, Ano, Mês, Autor)
├── <ReleaseWeekFormulario v-model :modo :release :prefill /> → cadastro/edição/clonagem
├── <ReleaseWeekPublicar v-model :release @confirmar /> → confirmação de publicação
├── <ReleaseWeekArquivar v-model :release @confirmar /> → confirmação de arquivamento
└── <ReleaseWeekExclusao v-model :release @confirmar /> → confirmação de exclusão (condicionada)
```

- **Estado de coordenação:** `filtrosAbertos`, `modalAberto`/`modo`/`releaseEditar`/`prefill`
  (cadastro, edição e clonagem), `publicarAberto`, `arquivarAberto` e `exclusaoAberta`, cada um com
  a linha-alvo. `abrirEdicao`/`abrirClonagem`/`abrirExclusao` resolvem o registro **completo** por
  `id` na base em memória.
- **Loading:** no F5 a tela exibe `UiLoading` ("Carregando Release Week…") no padrão de
  Softwares/Parceiros. Como o dataset é síncrono/local, o overlay cobre a hidratação com um tempo
  mínimo perceptível; na fase backend ele passa a cobrir o `GET /api/release-week` real.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8`.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<ReleaseWeekCabecalho>`

- Cabeçalho sem container: tile `bg-brand-primary` com `Rocket` em `#1a9e07`, título "Release Week"
  e subtítulo "Cabeçalho das semanas de entrega — período, status, autor e itens de cada release."
- **Botão "Nova Release Week"** (`UiButton` primary + `Plus`): emite `@novo`.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, `role="menu"`):
  "Listagem em PDF" (`gerarPdfReleaseWeek`) e "Exportar em CSV" (Código, Nome, Semana/Ano, Período,
  Status, Autor, Data de publicação). O menu fecha no clique fora e no `Escape`; lista vazia →
  aviso "Não há Release Weeks para exportar…".
- Gated por `release-week`/`exportar` (menu) e `release-week`/`criar` (botão).

### 3.2 `Kpis.vue` → `<ReleaseWeekKpis>`

- Quatro `UiKpi` do **conjunto vigente** (filtrado, quando houver filtro): **Abertas** (`#0364f7`,
  `Clock`), **Em Revisão** (`#7c3aed`, `Search`), **Aprovadas** (`#1a9e07`, `CheckCircle2`) e
  **Publicadas** (`#112051`, `Rocket`).

### 3.3 `Tabela.vue` → `<ReleaseWeekTabela>`

- `UiDataTable` com **Código, Nome, Semana/Ano, Período, Status, Autor e Publicação** + coluna de
  ações (`UiActionMenu`). Busca/ordenação/paginação no cliente (`default-page-size` 5).
- **Filtros** (`showFilters`) e **Import** à esquerda do botão Filtros (`slot filtersLeft`, ícone
  `Import`; ver §5.7). Gated por `filtrar`/`buscar`/`importar`.
- **Status** em `UiBadge`: `Aberta`→`aberta`, `Em Revisão`→`inReview`, `Aprovado`→`reconciled`,
  `Publicado`→`publicado`.
- **Flag de itens no cabeçalho** (`slot expandHeader`): um checkbox liga `expandable`; ao marcar,
  cada linha ganha um **`+`** que expande a linha (`slot expanded`) exibindo `<ReleaseWeekItens>`.
  Desmarcar recolhe todas as linhas.
- **Ações** (por linha): **Editar** (`alterar`) e **Excluir** (`excluir`) ficam como ícones inline à
  esquerda dos três pontinhos; o `UiActionMenu` agrupa **Clonar** (`criar`), **Publicar**
  (`publicar`) e **Arquivar** (`arquivar`). "Publicar" fica desabilitado quando o status já é
  `Publicado`; "Excluir" fica desabilitado (com motivo) quando a release tem itens.

### 3.4 `Itens.vue` → `<ReleaseWeekItens>`

- Tabela **somente leitura** dos itens da release: Chamada, Título, Software, Módulo, Tipo,
  Impacto, Situação, Status (`UiBadge`) e Data de liberação. Release sem itens mostra
  "Nenhum item vinculado a esta release." dentro da própria expansão.

### 3.5 `Filtros.vue` → `<ReleaseWeekFiltros>`

- `UiModal size="md"` com **Status, Ano, Mês e Autor** (`UiSelect`; vazio = todos) dispostos em
  **duas colunas** e os botões "Limpar Filtros", "Cancelar" e "Aplicar". Rascunho isolado que
  espelha o estado vigente ao abrir; "Limpar Filtros" zera rascunho e estado (o badge da toolbar cai
  a 0).

### 3.6 `Formulario.vue` → `<ReleaseWeekFormulario>` (cadastro/edição/clonagem)

- `UiModal size="lg"`, um componente para os três modos:
  - **Nova:** abre vazio, status `Aberta`, destaque desligado.
  - **Editar:** preenchido, com **Código** somente leitura e a seção **Informações de Cadastro**
    (Criado em/Atualizado em/Publicação desabilitados).
  - **Clonar:** modo criação com `versao`, `release` e `destaque_semana` copiados; `codigo`,
    `nome`, `semana`, `ano`, `mes`, datas, `status` e `descricao` em branco (status `Aberta`).
- Seções: **Dados da Semana** (Nome obrigatório, Versão, Release, Semana 1–52, Ano, Mês, três
  datas), **Conteúdo e Status** (Descrição, Status em `UiSegmented`, Destaque em `UiSwitch`) e
  **Informações de Cadastro** (só na edição).
- **Validação no cliente** (`validarReleaseWeek`): campos obrigatórios, semana 1–52, mês do domínio
  e datas `AAAA-MM-DD`; erro persistente no campo e foco no primeiro problema. Salvar chama
  `adicionar`/`atualizar` do modelo em memória e fecha com `toast.success`.
- **Datas:** `UiDatePicker` ⇄ conversão local `Date` ↔ `AAAA-MM-DD` (sem deslocamento de fuso).

### 3.7 `Publicar.vue` / `Arquivar.vue` / `Exclusao.vue`

- `UiModal size="sm"` de apresentação pura; emitem `confirmar` e a página fecha/grava.
- **Publicar:** confirma a mudança de status para `Publicado`.
- **Arquivar:** avisa que a release sai da listagem/KPIs, que os dados/itens permanecem e que uma
  release arquivada não pode ser excluída.
- **Exclusao:** mostra código, nome, período e a contagem de itens; avisa que é irreversível. Só é
  aberta quando `podeExcluirRelease` permite (não arquivada e sem itens).

### 3.8 `gerarPdfReleaseWeek.ts`

- jsPDF A4 paisagem + autotable sobre o conjunto filtrado: cabeçalho com a logomarca de login
  (quando houver), título "Relatório de Release Week", data de geração, contagem, colunas da
  listagem e rodapé "Página X de Y" · "Publications · Release Week".

## 4. Contrato de dados

O modelo em memória (`app/components/release-week/useReleaseWeekModelo.ts`) expõe:

```ts
interface ReleaseWeekModelo {
  id: string
  codigo: string            // RW-43/2026 (gerado pelo sistema)
  nome: string
  versao: string
  release: string
  semana: number            // 1..52
  ano: number
  mes: string               // por extenso
  dataInicio: string        // AAAA-MM-DD
  dataFinaliza: string
  dataPublicacao: string
  status: 'Aberta' | 'Em Revisão' | 'Aprovado' | 'Publicado'
  descricao: string
  destaqueSemana: boolean
  arquivada: boolean        // fase backend: coluna (ou arquivado_em)
  autorNome: string
  revisorNome: string
  criadoEm: string          // ISO 8601
  atualizadoEm: string
}

interface ItemRelease {
  id: string
  releaseId: string
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

- Repositório do frontend: `semanas` e `itens` (`useState`, chaves `release-week-base`/
  `release-week-itens`); filtros em `release-week-filtros`.
- Derivados: `linhas` (datas formatadas + `itensCount`), `kpis`, `filtrosAtivosCount`, `opcoes`
  (status/anos/meses/autores) e `itensDaRelease(id)`.
- Ações: `adicionar`, `atualizar`, `publicar`, `arquivar`, `excluir` (com guarda), `clonarPreenchimento`
  e os helpers `podeExcluirRelease`/`motivoBloqueioExclusao`.
- **Contrato futuro (fase backend):** `GET /api/release-week` devolve as semanas (com `arquivada` e,
  opcionalmente, os itens); escritas em `POST`/`PUT`/`DELETE` e ações `publicar`/`arquivar`. O
  dataset em memória é substituído pela resposta da API sem mudar os componentes.

## 5. Fluxos

- **Listagem:** renderização direta do conjunto em memória (sem `GET`); busca, ordenação e
  paginação no cliente; a tabela distingue base vazia de filtro sem resultado.
- **Filtros:** o modal refina o conjunto vigente (Status, Ano, Mês, Autor); "Aplicar" recalcula
  tabela e KPIs; "Limpar Filtros" restaura; o badge conta os filtros ativos.
- **Nova:** "Nova Release Week" abre o formulário vazio (status `Aberta`); salvar inclui no topo da
  listagem e confirma.
- **Editar:** resolve o registro por `id`, abre preenchido (com Código somente leitura) e atualiza.
- **Clonar:** abre o formulário em modo criação com `versao`/`release`/`destaque` copiados; nada é
  gravado até salvar e os itens **não** são copiados.
- **Publicar:** confirmação → status `Publicado`; a linha e o KPI correspondente são atualizados.
- **Arquivar:** confirmação → `arquivada = true`; some da listagem/KPIs sem apagar dados ou itens.
- **Excluir:** habilitado só quando `!arquivada && sem itens`; confirmação → remove do conjunto.
  Caso contrário, o item do menu fica desabilitado com o motivo acessível.
- **Itens:** marcar a flag no cabeçalho mostra o `+` por linha; o clique expande o `<ReleaseWeekItens>`
  (somente leitura) e recolhe ao clicar de novo.
- **Exportações:** menu "Relatórios" gera CSV (`;`, BOM UTF-8, neutralização de fórmula) e PDF do
  conjunto filtrado; lista vazia → aviso; falha → `toast.danger`.
- **Importação:** o ícone da toolbar existe, mas **não** abre modal nem dispara requisição nesta fase
  (ver §7).

## 6. Navegação até a tela

- O item **Release Week** da sessão **Publicações** da sidebar (`app/config/navigation.ts`, ícone
  `Rocket` `#1a9e07`) passa a declarar `to: '/admin/release-week'` e navega ao clique; na rota ele é
  exibido como ativo (`aria-current="page"`).
- A rota fica sujeita à mesma guarda de sessão das demais telas administrativas
  (`app/middleware/auth.global.ts`); sem sessão → `/admin/login?redirect=`.
- Ações e exportações respeitam a matriz RBAC do módulo `release-week`
  (`visualizar/criar/alterar/excluir/publicar/arquivar/importar/filtrar/buscar/exportar`). A
  clonagem usa a permissão `criar` (não há ação `clonar` no catálogo).

## 7. Dataset em memória e importação

- **Dataset em memória:** `useReleaseWeekModelo` semeia semanas e itens de exemplo no primeiro
  acesso (inclui uma release arquivada para demonstrar que ela não aparece). As ações mutam apenas
  esses arrays; **recarregar a página (F5) restaura o conjunto inicial**. Não há seed de banco nem
  persistência.
- **Por que:** decisão da fase frontend — permite exercitar todas as ações e a expansão de itens
  antes do backend. Na fase backend, o array dá lugar a `GET /api/release-week` e `arquivada` vira
  coluna no banco.
- **Importação:** nesta fase existe **apenas o ícone** de importação na toolbar (à esquerda de
  "Filtros"). Acioná-lo mostra um aviso de que a funcionalidade chega com o backend; **não** há
  modal, parser, modelo `.xlsx` nem gravação. A importação trará as **próprias Release Weeks** na
  fase seguinte.

## 8. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) — §5.2 (Badge), §5.11 (DataTable/expansão),
  §5.23 (ActionMenu); vitrine `/design` seção 23.
- Arquitetura/base: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md);
  Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md);
  Auditoria (trilha das escritas futuras): [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md).
- Módulos-molde: [`docs/10`](10%20-%20Módulo%20dos%20Softwares.md) e
  [`docs/11`](11%20-%20Módulo%20de%20Parceiros.md).

## 9. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes unitários: `tests/release-week-validadores.test.ts` — validação do cabeçalho (obrigatórios,
  semana 1–52, mês e datas), `prefill` da clonagem, guarda de exclusão, filtros/KPIs e formatação.
- Conferência manual: `http://localhost:3000/admin/release-week` — listar, filtrar, buscar, paginar,
  incluir, clonar (prefill correto), editar, publicar, arquivar (some da lista), excluir (só sem
  itens e não arquivada), flag de itens + expansão e exportações; recarregar confirma o reset do
  dataset. Vitrine: `http://localhost:3000/design` (seção 23 e demos de Badge/DataTable).

## 10. Pendências e próximos passos

- **Backend/API:** `server/api/release-week/**` (`GET`/`POST`/`PUT`/`DELETE`, publicar/arquivar),
  com `requirePermission` no módulo `release-week` e `registrarAuditoria` (recurso "Release Week").
- **Banco:** coluna de arquivamento (`arquivada` booleano ou `arquivado_em`), migration própria e
  expurgo/retenção aplicável; carga real de `entregas_itens` por release.
- **Exclusão real:** validar a ausência de relacionamentos no servidor (FKs), não só no dataset.
- **Importação:** ícone já presente; implementar modal, parser `.xlsx` (colunas do cabeçalho),
  pré-visualização e `POST` de importação das Release Weeks.
- **Regra de datas:** o schema assume datas de segunda-feira; a validação de dia da semana fica
  para a API (a UI valida presença/formato).
- **Loading:** substituir a renderização síncrona por `UiLoading` no padrão dos demais módulos
  quando a leitura passar a ser assíncrona.
