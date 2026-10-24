# 12 - Módulo das Releases Week — Área Administrativa

**Versão:** 2.0.0 — **Data:** 2026-10-19 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal do módulo **Release Week** — o cabeçalho das semanas de entrega
(`codigo`, `nome`, `versao`, `release`, `semana`, `ano`, `mes`, `data_inicio`, `data_finaliza`,
`data_publicacao`, `status`, `descricao`, `destaque_semana`, `autor_nome`, `revisor_nome`,
`arquivada`, timestamps), os **quatro KPIs** (Abertas, Em Revisão, Aprovadas, Publicadas),
busca/filtros/ordenação/paginação, as **ações de linha** (Clonar, Editar, Publicar, Arquivar e
Excluir condicionada), a **flag de itens** no cabeçalho da tabela com expansão somente leitura dos
itens de cada release, as **exportações PDF/CSV** e a **importação por planilha**. O **backend está
implementado** (`server/api/release-week/**`): persistência em `release_week`, código `RW-XX/AAAA`
gerado pelo servidor, `arquivada` soft, guarda de exclusão por itens e RBAC/auditoria no servidor.
**Arquivos-fonte:** [`app/pages/admin/release-week.vue`](../app/pages/admin/release-week.vue) ·
[`app/components/release-week/`](../app/components/release-week) ·
[`server/api/release-week/`](../server/api/release-week) ·
[`server/utils/release-week.ts`](../server/utils/release-week.ts) ·
[`shared/release-week.ts`](../shared/release-week.ts) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Design system:** [`/design`](../app/pages/design.vue) — `UiActionMenu` (seção 23), variantes
`aberta`/`publicado`/`arquivado` do `UiBadge` e expansão de linha do `UiDataTable`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) (§5.2, §5.11, §5.23)
**Autoridade de comportamento:** `openspec/specs/release-week` (deltas das changes
`construir-release-week-frontend` e `release-week-backend-e-importacao`)

> Este documento é a referência da tela `/admin/release-week`, da API e da importação. Em caso de
> divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados (API)](#4-contrato-de-dados-api)
5. [Fluxos](#5-fluxos)
6. [Navegação e RBAC](#6-navegação-e-rbac)
7. [Importação por planilha](#7-importação-por-planilha)
8. [Documentação relacionada](#8-documentação-relacionada)
9. [Verificação](#9-verificação)
10. [Pendências e próximos passos](#10-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A tela de Release Week é o **cabeçalho do ciclo semanal** da Área Administrativa:

- **Rota:** `/admin/release-week` → `app/pages/admin/release-week.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Modelo de dados:** conforme `docs/bd/01` §13 (tabela `release_week`) — `id` (PK), `codigo`
  (`RW-01/2026`), `nome`, `versao`, `release`, `semana` (1–52), `ano`, `mes`, datas
  (`data_inicio`, `data_finaliza`, `data_publicacao`), `status`
  (`Aberta` | `Em Revisão` | `Aprovado` | `Publicado`), `descricao`, `destaque_semana`, `arquivada`,
  `autor_nome`/`revisor_nome` e timestamps. Os itens vivem em `entregas_itens` (`release_id`).
- **Status x arquivamento:** `status` é o fluxo editorial (4 valores). **`arquivada` é um booleano
  separado** — arquivar é soft, remove a release da listagem/KPIs e **não** apaga dados/itens.
- **Vínculo com chamadas:** ao lançar uma chamada vinculada a esta release, ela passa automaticamente
  para `Em Revisão` (inclusive se estava `Aprovado`/`Publicado`). A Área Pública só exibe a release
  quando o status é `Publicado`.
- **Persistência:** `GET /api/release-week` carrega as releases não arquivadas (com `itensCount`);
  inclusão/edição/clonagem/publicação/arquivamento/exclusão gravam no banco via API.
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
├── <ReleaseWeekImportar v-model="importarAberto" /> → importação .xlsx (parser + pré-visualização + commit)
├── <ReleaseWeekPublicar v-model :release @confirmar /> → confirmação de publicação
├── <ReleaseWeekArquivar v-model :release @confirmar /> → confirmação de arquivamento
└── <ReleaseWeekExclusao v-model :release @confirmar /> → confirmação de exclusão (condicionada)
```

- **Estado de coordenação:** `filtrosAbertos`, `modalAberto`/`modo`/`releaseEditar`/`prefill`
  (cadastro, edição e clonagem), `importarAberto`, `publicarAberto`, `arquivarAberto` e
  `exclusaoAberta`, cada um com a linha-alvo. `abrirEdicao`/`abrirClonagem`/`abrirExclusao` resolvem
  o registro **completo** por `id` na base carregada.
- **Loading:** no F5 a tela exibe `UiLoading` ("Carregando Release Week…") enquanto
  `GET /api/release-week` responde; em falha, toast de erro e tabela vazia.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8`.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<ReleaseWeekCabecalho>`

- Cabeçalho sem container: tile `bg-brand-primary` com `Rocket` em `#1a9e07`, título "Release Week"
  e subtítulo "Cabeçalho das semanas de entrega — período, status, autor e itens de cada release."
- **Botão "Nova Release Week"** (`UiButton` primary + `Plus`): emite `@novo`.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, `role="menu"`):
  "Listagem em PDF" (`gerarPdfReleaseWeek`) e "Exportar em CSV" (Código, Nome, Semana/Ano, Período,
  Status, Autor, Data de publicação). Antes de gerar, chama `GET /api/release-week?exportar=1` como
  guarda da permissão `exportar`. Lista vazia → aviso.
- Gated por `release-week`/`exportar` (menu) e `release-week`/`criar` (botão).

### 3.2 `Kpis.vue` → `<ReleaseWeekKpis>`

- Quatro `UiKpi` do **conjunto vigente** (filtrado, quando houver filtro): **Abertas** (`#0364f7`,
  `Clock`), **Em Revisão** (`#7c3aed`, `Search`), **Aprovadas** (`#1a9e07`, `CheckCircle2`) e
  **Publicadas** (`#112051`, `Rocket`).

### 3.3 `Tabela.vue` → `<ReleaseWeekTabela>`

- `UiDataTable` com **Código, Nome, Semana/Ano, Período, Status, Autor e Publicação** + coluna de
  ações. Busca/ordenação/paginação no cliente (`default-page-size` 5) sobre a lista da API.
- **Filtros** (`showFilters`) e **Import** à esquerda do botão Filtros (`slot filtersLeft`), gated
  por `filtrar`/`buscar`/`importar`.
- **Status** em `UiBadge`: `Aberta`→`aberta`, `Em Revisão`→`inReview`, `Aprovado`→`reconciled`,
  `Publicado`→`publicado`.
- **Flag de itens no cabeçalho** (`slot expandHeader`): um checkbox liga `expandable`; ao marcar,
  cada linha ganha um **`+`** que expande a linha (`slot expanded`) exibindo `<ReleaseWeekItens>`.
  A flag só aparece com `release-week`/`visualizar_itens`; desmarcar recolhe todas.
- **Ações** (por linha): **Editar** (`alterar`) e **Excluir** (`excluir`) ficam como ícones inline à
  esquerda dos três pontinhos; o `UiActionMenu` agrupa **Clonar** (`clonar`), **Publicar**
  (`publicar`) e **Arquivar** (`arquivar`). "Publicar" fica desabilitado quando o status já é
  `Publicado`; "Excluir" fica desabilitado (com motivo) quando a release tem itens.

### 3.4 `Itens.vue` → `<ReleaseWeekItens>`

- Recebe `releaseId`/`codigo` e busca `GET /api/release-week/:id/itens` **sob demanda** (cache por
  release). Exibe loading/erro (com "Tentar novamente") e estado vazio ("Nenhum item vinculado a
  esta release."). Colunas: Chamada, Título, Software, Módulo, Tipo, Impacto, Status
  (`UiBadge`) e Data de liberação — somente leitura.

### 3.5 `Filtros.vue` → `<ReleaseWeekFiltros>`

- `UiModal size="md"` com **Status, Ano, Mês e Autor** (`UiSelect`; vazio = todos) dispostos em
  **duas colunas** e os botões "Limpar Filtros", "Cancelar" e "Aplicar". Rascunho isolado que espelha
  o estado vigente ao abrir; "Limpar Filtros" zera rascunho e estado.

### 3.6 `Formulario.vue` → `<ReleaseWeekFormulario>` (cadastro/edição/clonagem)

- `UiModal size="lg"`, um componente para os três modos:
  - **Nova:** abre com status `Aberta`, **mês atual** pré-selecionado, ano atual e destaque desligado.
  - **Editar:** preenchido, com **Código** somente leitura e a seção **Informações de Cadastro**
    (Criado em/Atualizado em/Publicação desabilitados).
  - **Clonar:** modo criação com `versao`, `release` e `destaque_semana` copiados; `codigo`, `nome`,
    `semana`, `ano`, `mes`, datas, `status` e `descricao` em branco (status `Aberta`).
- Seções: **Dados da Semana** (Nome obrigatório, Versão, Release, Semana, Ano, Mês, três datas),
  **Conteúdo e Status** (Descrição, Status em `UiSegmented`, Destaque em `UiSwitch`) e
  **Informações de Cadastro** (só na edição).
- **Semana 1–52:** o campo só aceita dígitos e faz **clamp imediato** (nunca 0/53+); a API reforça a
  regra e recusa valores fora do intervalo.
- **Validação** (cliente + servidor, `validarReleaseWeek`): nome, semana 1–52, ano, mês do domínio,
  datas `AAAA-MM-DD` e **`data_publicacao` em segunda-feira ou no próximo dia útil quando a segunda-feira for feriado nacional**. Erro persistente no campo e foco no
  primeiro problema; a API responde `400` com `data.erros`.
- **Feriados:** `shared/feriados.ts` lista feriados nacionais fixos e móveis (Carnaval, Sexta-feira
  Santa e Corpus Christi) e aceita `FERIADOS_EXTRAS` para datas locais/estaduais. A regra aceita o
  próximo dia útil após uma segunda-feira feriado (ex.: 03/11/2026 após 02/11/2026 — Finados).
- Salvar chama `adicionar`/`atualizar` (API) e fecha com `toast.success`; `409` (semana/ano
  duplicado) é exibido no toast.
- **Datas:** `UiDatePicker` ⇄ conversão local `Date` ↔ `AAAA-MM-DD` (sem deslocamento de fuso).

### 3.7 `Publicar.vue` / `Arquivar.vue` / `Exclusao.vue`

- `UiModal size="sm"` de apresentação pura; emitem `confirmar` e a página fecha/grava via API.
- **Publicar:** confirma a mudança de status para `Publicado` (a API grava `data_aprovacao`).
- **Arquivar:** avisa que a release sai da listagem/KPIs, que os dados/itens permanecem e que uma
  release arquivada não pode ser excluída.
- **Exclusao:** mostra código, nome, período e a contagem de itens; avisa que é irreversível. Só é
  aberta quando a release não tem itens (a API reaplica a guarda e responde `409`).

### 3.8 `gerarPdfReleaseWeek.ts`

- jsPDF A4 paisagem + autotable sobre o conjunto filtrado: cabeçalho com a logomarca de login
  (quando houver), título "Relatório de Release Week", data de geração, contagem, colunas da
  listagem e rodapé "Página X de Y" · "Publications · Release Week".

### 3.9 `Importar.vue` + `lerPlanilhaReleaseWeek.ts`

- `UiModal size="lg"` aberto pelo ícone de importação da toolbar: upload `.xlsx`, pré-visualização em
  `UiDataTable` (Semana/Ano, Nome, Período, Status e **Resultado**: `Pronto para importar` /
  `Já cadastrado` / `Repetido no arquivo` / `Linha inválida`), seleção das linhas prontas e commit em
  `POST /api/release-week/importar`.
- `lerPlanilhaReleaseWeek.ts`: parser puro do modelo (colunas **Nome, Semana, Ano, Mês, Data Início,
  Data Finaliza, Data Publicação, Status, Versão, Release, Descrição, Destaque**), sem imports de
  Nuxt — `classificarLinhasReleaseWeek` é coberto por testes. A chave de duplicidade é `(ano, semana)`
  e a publicação fora de segunda-feira (ou do próximo dia útil após feriado na segunda) marca a linha como inválida.

## 4. Contrato de dados (API)

O frontend consome a API; o shape é o mesmo `ReleaseWeekModelo` usado na tela:

```ts
interface ReleaseWeekModelo {
  id: string
  codigo: string            // RW-43/2026 (gerado pelo servidor)
  nome: string
  versao: string
  release: string
  semana: number            // 1..52
  ano: number
  mes: string               // por extenso
  dataInicio: string        // AAAA-MM-DD
  dataFinaliza: string
  dataPublicacao: string    // segunda-feira ou próximo dia útil após feriado
  status: 'Aberta' | 'Em Revisão' | 'Aprovado' | 'Publicado'
  descricao: string
  destaqueSemana: boolean
  arquivada: boolean
  autorNome: string
  revisorNome: string
  criadoEm: string          // ISO 8601
  atualizadoEm: string
  itensCount?: number       // contagem de entregas_itens
}
```

**Rotas e permissões** (`requirePermission` em todas):

| Ação | Método e rota | Permissão |
|---|---|---|
| Listar | `GET /api/release-week` | `release-week`/`visualizar` (ativas + `itensCount`) |
| Guarda de exportação | `GET /api/release-week?exportar=1` | `release-week`/`exportar` |
| Itens | `GET /api/release-week/:id/itens` | `release-week`/`visualizar_itens` |
| Incluir/clonar | `POST /api/release-week` | `release-week`/`criar` |
| Editar | `PUT /api/release-week/:id` | `release-week`/`alterar` |
| Publicar | `PUT /api/release-week/:id/publicar` | `release-week`/`publicar` |
| Arquivar | `PUT /api/release-week/:id/arquivar` | `release-week`/`arquivar` |
| Excluir | `DELETE /api/release-week/:id` | `release-week`/`excluir` |
| Importar | `POST /api/release-week/importar` | `release-week`/`importar` |

- **Código:** derivado de `semana`/`ano` (`RW-XX/AAAA`) na criação e **regenerado na edição** quando
  semana/ano mudam; duplicidade de `codigo`/`(ano, semana)` → `409`.
- **Validação:** campos obrigatórios, semana 1–52, mês do domínio, datas `AAAA-MM-DD` e
  `data_publicacao` em segunda-feira ou no próximo dia útil quando a segunda-feira for feriado nacional (UTC) → `400` com `data.erros`.
- **Arquivamento:** `PUT /:id/arquivar` marca `arquivada = 1`; a listagem filtra as arquivadas.
- **Exclusão:** `409` quando arquivada ou com itens em `entregas_itens`.
- **Auditoria:** recurso **"Release Week"** (Inclusão/Alteração/Homologação/Exclusão).
- **Frontend:** `useReleaseWeekModelo` mantém `semanas` (API), `itensPorRelease` (lazy/cache),
  `filtros` (sessão) e os derivados `linhas`/`kpis`/`opcoes`; as escritas chamam a API e atualizam a
  lista local.

> **Permissão de publicação (RL06):** a transição para `Publicado` pela criação ou edição exige `release-week`/`publicar` (não basta `criar`/`alterar`). Sem ela, a API responde `403` sem efeito; a transição autorizada grava `data_aprovacao`, executa a cascata e audita **Homologação**. Reabrir limpa `data_aprovacao` e a auditoria volta a ser **Alteração**.
>
> **Publicação em cascata (RL06):** publicar a Release promove as chamadas filhas em `Publicar` para `Publicado`, grava histórico por filha e uma auditoria única no pai; a resposta de `PUT /publicar` inclui `chamadasPublicadas`. Reabrir a Release devolve a `Publicar` as filhas em `Publicado` que não tenham outro vínculo ativo publicado. Arquivar não altera o status das filhas, mas o gate de visibilidade pública as esconde. Com múltiplos vínculos, a chamada é pública quando ao menos um pai está `Publicado`, não arquivado e com `publicado_em <= NOW()`.

## 5. Fluxos

- **Listagem:** `GET /api/release-week` no `onMounted`; loading no voo; falha → toast + lista vazia;
  busca/ordenação/paginação no cliente.
- **Filtros:** o modal refina o conjunto vigente (Status, Ano, Mês, Autor); "Aplicar" recalcula
  tabela e KPIs; "Limpar Filtros" restaura; o badge conta os filtros ativos.
- **Nova:** abre com mês atual, status `Aberta`; salvar grava via `POST` e inclui no topo.
- **Editar:** resolve o registro por `id`, abre preenchido (com Código somente leitura) e grava `PUT`.
- **Clonar:** abre o formulário em modo criação com `versao`/`release`/`destaque` copiados; nada é
  gravado até salvar; os itens **não** são copiados; a gravação usa `POST` (`criar`).
- **Publicar:** confirmação → `PUT /publicar` (status `Publicado` + `data_aprovacao`).
- **Arquivar:** confirmação → `PUT /arquivar`; some da listagem/KPIs sem apagar dados ou itens.
- **Excluir:** habilitado só sem itens; `DELETE`; `409` quando arquivada/com itens.
- **Itens:** a flag (quando permitida) mostra o `+`; o clique busca `GET /:id/itens` e expande o
  `<ReleaseWeekItens>` (somente leitura).
- **Exportações:** menu "Relatórios" valida `exportar` na API e gera CSV (`;`, BOM UTF-8,
  neutralização de fórmula) e PDF do conjunto filtrado.
- **Importação:** ver §7.

## 6. Navegação e RBAC

- O item **Release Week** da sessão **Publicações** da sidebar (`app/config/navigation.ts`, ícone
  `Rocket` `#1a9e07`) declara `to: '/admin/release-week'` e fica ativo na rota (`aria-current`).
- A rota fica sujeita à guarda de sessão (`app/middleware/auth.global.ts`); sem sessão →
  `/admin/login?redirect=`.
- A matriz do módulo `release-week` controla a tela e a API: `visualizar`, `criar`, `alterar`,
  `excluir`, `clonar`, `publicar`, `arquivar`, `visualizar_itens`, `importar`, `exportar`, `filtrar`,
  `buscar`. A clonagem exige `clonar` na UI e `criar` na gravação; a matriz recusa `clonar` sem
  `criar`.

## 7. Importação por planilha

- **Modelo oficial:** [`docs/modelos/modelo-importacao-release-week.xlsx`](modelos/modelo-importacao-release-week.xlsx)
  com **Nome, Semana, Ano, Mês, Data Início, Data Finaliza, Data Publicação, Status, Versão,
  Release, Descrição, Destaque** (sem Código — o servidor gera).
- **Fluxo:** o ícone da toolbar abre `ReleaseWeekImportar`; o parser local classifica as linhas; o
  commit vai a `POST /api/release-week/importar`, que revalida (incluindo segunda-feira/feriado), recusa tudo
  se houver linha inválida/duplicada (`400` com motivos/conflitos), grava em **transação** (códigos
  gerados) e registra auditoria.
- **Unicidade:** `(ano, semana)` no arquivo e contra o banco; limite de 500 linhas.
- **Permissão:** `release-week`/`importar` (default: Administrador).

## 8. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) — §5.2 (Badge), §5.11 (DataTable/expansão),
  §5.23 (ActionMenu); vitrine `/design` seção 23.
- Arquitetura/base: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md);
  Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md);
  Auditoria: [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md);
  RBAC: [`docs/07`](07%20-%20Perfis%20de%20Acesso%20(RBAC).md).
- Módulos-molde: [`docs/10`](10%20-%20Módulo%20dos%20Softwares.md) e
  [`docs/11`](11%20-%20Módulo%20de%20Parceiros.md).

## 9. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes unitários: `tests/release-week-validadores.test.ts` (obrigatórios, semana 1–52,
  segunda-feira, código, guarda e clone), `tests/release-week-import-parser.test.ts` (classificação e
  duplicidade) e `tests/perfis-funcionalidades.test.ts` (catálogo 88 + `clonar`⇒`criar`).
- E2E/API: `GET` 200; `POST` válido 201 com código; publicação/arquivamento; arquivada some da lista;
  `DELETE` de arquivada 409; `data_publicacao` fora de segunda 400; guarda de permissão 403.
- Conferência manual: `http://localhost:3000/admin/release-week` — incluir (mês atual, semana
  clampada), clonar, editar, publicar, arquivar, excluir, itens sob `visualizar_itens`, importar e
  exportar; recarregar confirma a persistência. Vitrine: `http://localhost:3000/design` (seção 23).

## 10. Pendências e próximos passos

- **Itens:** CRUD de `entregas_itens` pertence ao módulo "Lançar as Chamadas" (aqui é somente
  leitura e a relação que bloqueia a exclusão).
- **Área Pública:** exposição das releases publicadas/destaque na home pública (fora deste módulo).
- **Exportação server-side:** o CSV/PDF continua no cliente, sob a guarda `exportar` da API.
- **Revisão:** campos `revisor_id`/`revisor_feedback`/`data_aprovacao` existem no schema; o fluxo de
  revisão/homologação pode ganhar UI própria (hoje a publicação grava `data_aprovacao`).
- **Expurgo/retenção:** a trilha de auditoria já tem expurgo; a Release Week não tem retenção
  específica definida.

> **Publicação efetiva (RL06 B-05):** `publicado_em` é o carimbo efetivo: status `Publicado` sozinho não torna a Release pública. O carimbo usa a `data_publicacao` quando futura; data passada/ausente usa o instante da transição. Sair de `Publicado` limpa o carimbo.
