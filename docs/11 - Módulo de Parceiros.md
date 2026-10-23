# 11 - Módulo de Parceiros — Área Administrativa

**Versão:** 1.0.0 — **Data:** 2026-10-18 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal do módulo **Parceiros** — listagem em **grade de cards** do cadastro
corporativo (`id`, `codigo`, `razao_social`, `nome_fantasia`, `cidade`, `estado`, `regiao`, `logo_url`,
`situacao`, `criado_em`, `atualizado_em`), KPIs de situação, filtros por situação/região/estado,
exportações **PDF** e **CSV**, os **modais de cadastro/edição e de exclusão**, a **importação por
planilha** e o **modelo de importação** versionado. O **backend está implementado**
(`server/api/parceiros/**`): o `codigo` sequencial (`PAR-XXX`) é um identificador **secundário**
(único, gerado pelo servidor — **não** é chave primária; a PK segue `id` UUID); a `regiao` é derivada
da UF; as rotas exigem permissão RBAC do módulo `parceiros` e registram auditoria.
**Arquivos-fonte:** [`app/pages/admin/parceiros.vue`](../app/pages/admin/parceiros.vue) ·
[`app/components/parceiros/`](../app/components/parceiros) ·
[`server/api/parceiros/`](../server/api/parceiros) ·
[`server/utils/parceiros.ts`](../server/utils/parceiros.ts) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — componentes de kit novos: `UiEntityCard` (seção 21)
e `UiPagination` (seção 22); a tela também reusa `UiButton`, `UiBadge`, `UiKpi`, `UiSelect`,
`UiSegmented`, `UiModal`, `UiModalSection`, `UiUploadFiles`, `UiCheckbox`, `UiDataTable` (na
pré-visualização da importação), `UiTooltip` e `UiLoading`
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) (§5.21/§5.22)
**Autoridade de comportamento:** `openspec/specs/parceiros` (delta desta change em
`openspec/changes/construir-parceiros/specs/parceiros` — sincronizada no archive via `/opsx-sync`)

> Este documento é a referência da tela `/admin/parceiros` e de tudo o que foi criado para ela —
> componentes de domínio, backend, filtros, exportações, modais de cadastro/exclusão e importação.
> Em caso de divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados](#4-contrato-de-dados)
5. [Fluxos](#5-fluxos)
6. [Navegação até a tela](#6-navegação-até-a-tela)
7. [Modelo e importação](#7-modelo-e-importação)
8. [Documentação relacionada](#8-documentação-relacionada)
9. [Verificação](#9-verificação)
10. [Pendências e próximos passos](#10-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A tela de parceiros é o cadastro dos clientes, redes e distribuidoras da Área Administrativa:

- **Rota:** `/admin/parceiros` → `app/pages/admin/parceiros.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Modelo de dados:** conforme `docs/bd/01` §6 (tabela `parceiros`) —
  `id` (VARCHAR(64), **chave primária**, UUID), `codigo` (VARCHAR(20), **único**, `PAR-XXX`),
  `razao_social`, `nome_fantasia`, `cidade`, `estado` (UF), `regiao` (uma das 5 regiões do Brasil,
  **derivada da UF**), `logo_url`, `situacao` (`Ativo` | `Inativo` | `Bloqueado`), `criado_em` e
  `atualizado_em`. O FK `entregas_itens.parceiro_id` referencia `parceiros(id)`.
- **Persistência:** a listagem é carregada de `GET /api/parceiros` no `onMounted`; a tela exibe
  `UiLoading` no voo e, em falha, um toast de erro + grade **vazia** — nunca a demo fingindo ser
  persistida.
- **Componentização:** a página é fina e dona da coordenação; cada parte é um componente em
  `app/components/parceiros/` (auto-import com prefixo `Parceiros*`).

## 2. Estrutura da página (componentização)

```
admin/parceiros.vue                       (page - definePageMeta + composição + coordenação)
├── <ParceirosCabecalho @novo />          → tile Handshake #047857 + título + menu "Relatórios" + "Novo Parceiro"
├── <ParceirosKpis class="mt-6" />        → 3 UiKpi do conjunto VIGENTE (Ativos, Inativos, Bloqueados)
├── <ParceirosGrade
│       class="mt-5"
│       @editar @excluir @importar @open-filters />  → busca + Import + Filtros + grade de cards + UiPagination
├── <ParceirosFiltros v-model="filtrosAbertos" />    → modal de filtros (Situação, Região, Estado)
├── <ParceirosFormulario v-model :modo :parceiro />  → modal de cadastro/edição
├── <ParceirosExclusao v-model :parceiro @confirmar /> → modal de confirmação de exclusão
└── <ParceirosImportar v-model="importarAberto" />   → modal de importação (.xlsx)
```

- **Estado de coordenação:** `carregando` (overlay), `filtrosAbertos`, os modais
  `modalAberto`/`modo`/`parceiroEditar` (cadastro/edição), `exclusaoAberta`/`parceiroExcluir`
  (exclusão) e `importarAberto` (importação). `abrirEdicao(parceiro)` resolve o registro
  **completo** por `id` na base (timestamps) e abre em modo edição; `confirmarExclusao()` fecha e
  chama `excluirParceiro()` (DELETE, com `409` quando há entregas vinculadas).
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8` (mesmo padrão de
  Softwares, Usuários, Perfis e Auditoria).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<ParceirosCabecalho>`

- Cabeçalho sem container: tile `bg-brand-primary` com `Handshake` em `#047857`, título "Parceiros" e
  subtítulo "Cadastro de parceiros clientes, redes e distribuidoras — código, região e situação."
- **Botão "Novo Parceiro"** (`UiButton` primary + `Plus`): **emite `@novo`** para a página.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, mini-menu `role="menu"`):
  "Listagem em PDF" (→ `gerarPdfParceiros`) e "Exportar em CSV" (colunas **Código, Razão Social, Nome
  Fantasia, Cidade, Estado, Região, Situação**). O menu fecha no clique fora e no `Escape`.

### 3.2 `Kpis.vue` → `<ParceirosKpis>`

- Três `UiKpi` derivados do **conjunto vigente** (filtrado, quando houver filtro): **Ativos**
  (`#047857`), **Inativos** (`#64748b`) e **Bloqueados** (`#be123c`).

### 3.3 `Grade.vue` → `<ParceirosGrade>`

- Toolbar com título/subtítulo, **busca** (`UiInput`) e, à direita, o botão de **importação**
  (`Import`) imediatamente à **esquerda** do botão "Filtros" (com badge de contador).
- **Grade de cards** responsiva (`sm:grid-cols-2 xl:grid-cols-3`) de `ParceirosCard`, com **paginação
  client-side** (`UiPagination`, padrão de 6 cards/página). Busca, filtros e paginação operam sobre o
  conjunto vigente; a página volta à 1ª quando busca/filtros mudam.

### 3.4 `Card.vue` → `<ParceirosCard>`

- Compõe o `UiEntityCard` (kit): `codigo` (`PAR-XXX`), `UiBadge` de **situação**, `icone` `Handshake`
  à esquerda do título, título = **razão social**, subtítulo = **nome fantasia** e linhas de
  **Localização** (`cidade - UF`, ícone `MapPin`) e **Região** (ícone `Map`). As ações **Editar** e
  **Excluir** ficam no slot `acoes` (topo direito), no hover/foco.

### 3.5 `Filtros.vue` → `<ParceirosFiltros>`

- `UiModal size="sm"` acionado pela toolbar da grade, com **Situação**, **Região** e **Estado**
  (`UiSelect`; vazio = todos) e os botões "Limpar Filtros", "Cancelar" e "Aplicar". Rascunho isolado
  que espelha o estado vigente ao abrir; "Limpar Filtros" zera rascunho e estado.

### 3.6 `Formulario.vue` → `<ParceirosFormulario>` (cadastro/edição)

- `UiModal size="md"` aberto por "Novo Parceiro" (criação) ou pela ação "Editar" do card. A seção
  **Dados do Parceiro** usa **duas colunas** em desktop (`md:grid-cols-[200px_1fr]`): a **Logo**
  (`UiUploadFiles`, `forma="retangular"`) fica encaixada à **esquerda**, ao lado do container com
  **Código** (só na edição), **Razão Social** (obrigatória, ≤ 255) e **Nome Fantasia** (obrigatório,
  ≤ 150); abaixo, em container próprio, vêm **Cidade**, **Estado** (`UiSelect` de UFs), **Região**
  (derivada da UF, desabilitada) e **Situação** (`UiSegmented` — `Ativo`/`Inativo`/`Bloqueado`); na
  criação nasce com situação `Ativo`.
- **Região derivada:** ao escolher o Estado, a Região é preenchida automaticamente (mapa
  `REGIAO_POR_UF` de `app/config/brasil.ts`).
- Na **edição**, o **Código** (somente leitura, ~10 caracteres) aparece à esquerda da **Razão Social**
  (que divide a linha com ele), e a seção **Informações de Cadastro** exibe "Criado em" e "Atualizado
  em" desabilitados.
- Validação no cliente (Razão Social/Nome Fantasia obrigatórios) com erro persistente e foco no
  primeiro problema; Enter navega para o próximo campo. Salvar chama `salvarParceiro`
  (`POST` na criação, `PUT /api/parceiros/:id` na edição); a logo dataURL vira arquivo (upload em
  `logos`) antes de gravar; no sucesso, fecha o modal com `toast.success`.

### 3.7 `Exclusao.vue` → `<ParceirosExclusao>`

- `UiModal size="sm"`: apresentação pura — exibe **`codigo` - razão social**, **localização** e
  **situação** e emite `confirmar`; a página fecha o modal e chama `excluirParceiro`
  (`DELETE /api/parceiros/:id`), confirmando com `toast.success` (falha → `toast.danger`; `409` quando
  há entregas vinculadas).

### 3.8 `Importar.vue` + `lerPlanilhaParceiros.ts` → `<ParceirosImportar>`

- `UiModal size="lg"` aberto pelo botão de importação da toolbar: `UiUploadFiles` (`.xlsx`),
  pré-visualização em `UiDataTable` com a coluna **Resultado** (`Pronto para importar` /
  `Já cadastrado` / `Repetido no arquivo` / `Linha inválida`) e seleção das linhas prontas; o commit
  vai a `POST /api/parceiros/importar`.
- `lerPlanilhaParceiros.ts`: parser puro do modelo (colunas **Razão Social, Nome Fantasia, Cidade,
  Estado, Região, Situação**), sem imports de Nuxt — `classificarLinhas` é coberto por testes
  unitários. Normaliza trim/caixa, deriva a Região da UF e classifica na ordem
  `inválida → repetida → já cadastrada → pronta`; a razão social é a chave de duplicidade
  (case-insensitive).

## 4. Contrato de dados

O frontend consome `GET /api/parceiros`, que devolve o cadastro completo **em ordem de `codigo`**
(array de `ParceiroModelo` em `app/components/parceiros/useParceirosModelo.ts`):

```json
[
  {
    "id": "1f0c...-uuid",
    "codigo": "PAR-001",
    "razao_social": "Nexus Corp Ltda",
    "nome_fantasia": "Nexus",
    "cidade": "São Paulo",
    "estado": "SP",
    "regiao": "Sudeste",
    "logo_url": "/uploads/logos/logo.png",
    "situacao": "Ativo",
    "criado_em": "2026-10-18T12:00:00.000Z",
    "atualizado_em": "2026-10-18T12:00:00.000Z"
  }
]
```

- `situacao` ∈ `Ativo` | `Inativo` | `Bloqueado`; `regiao` ∈ `Norte` | `Nordeste` | `Centro-Oeste` |
  `Sudeste` | `Sul` (derivada da UF).
- Os timestamps são ISO 8601 e formatados em `dd/mm/aaaa hh:mm` (pt-BR) pela função
  `formatarDataHora`.

**Escritas e importação (backend real — `server/api/parceiros/**`):**

| Ação | Método e rota | Permissão | Corpo / resposta |
|---|---|---|---|
| Listar | `GET /api/parceiros` | `parceiros`/`visualizar` | → `200` array ordenado por `codigo` |
| Incluir | `POST /api/parceiros` | `parceiros`/`criar` | `{ razao_social, nome_fantasia, cidade, estado, regiao, logo_url, situacao }` → `201` parceiro (código gerado) |
| Editar | `PUT /api/parceiros/:id` | `parceiros`/`alterar` | campos parciais → `200` parceiro |
| Excluir | `DELETE /api/parceiros/:id` | `parceiros`/`excluir` | → `200` `{ ok: true }` (409 com entregas) |
| Importar | `POST /api/parceiros/importar` | `parceiros`/`importar` | `{ linhas: [...] }` → `200` `{ importados }` (400 com `motivos`/`conflitos`) |

O cliente envia só os campos editáveis; o servidor gera o `codigo` (`PAR-XXX`, `MAX + retry`),
**revalida a coerência UF→Região** e resolve `criado_em`/`atualizado_em`. A **logo** é enviada como
arquivo por `POST /api/uploads` (destino `logos`, gated por `parceiros`/`alterar`). Escritas registram
auditoria com recurso **"Parceiros"**.

## 5. Fluxos

- **Listagem:** `onMounted` chama `carregarParceiros()`. No voo, `UiLoading` ("Carregando parceiros…")
  cobre o conteúdo; em sucesso, KPIs + grade refletem a base; em falha, toast de erro e grade vazia.
- **Busca/paginação:** client-side sobre o conjunto vigente; a página volta à 1ª quando busca/filtros
  mudam.
- **Filtros:** o modal refina o conjunto vigente. Aplicar recalcula KPIs e cards; limpar restaura o
  cadastro completo; o badge do botão "Filtros" mostra a quantidade de filtros ativos.
- **Exportação PDF:** `gerarPdfParceiros` (jsPDF A4 paisagem + autotable) gera a listagem com
  cabeçalho (logomarca de login quando configurada), colunas do cadastro e rodapé "Página X de Y".
- **Exportação CSV:** gerado no cliente (`;`, BOM UTF-8, neutralização de fórmula), com as colunas do
  cadastro sobre o conjunto vigente; falha → `toast.danger`.
- **Cadastro/edição:** "Novo Parceiro" abre o modal em modo criação; "Editar" resolve o registro por
  `id` e abre em modo edição (com Código somente-leitura e timestamps). Salvar grava via API
  (`POST`/`PUT`) e fecha com `toast.success`; falha `400` aponta no campo e mantém o modal.
- **Exclusão:** "Excluir" abre o modal de confirmação; confirmar remove via `DELETE` (409 se houver
  entregas vinculadas), atualiza a grade e confirma; falha → `toast.danger`.
- **Importação:** o botão da toolbar abre o modal; após escolher o arquivo, o parser local classifica
  as linhas e o usuário seleciona as prontas; o commit vai à API (revalidação + transação + códigos),
  recarrega a lista e confirma com `toast.success`. Linhas inválidas/duplicadas não gravam nada.

## 6. Navegação até a tela

- O item **Parceiros** da sessão **Cadastros** da sidebar (`app/config/navigation.ts`, ícone
  `Handshake` `#047857`) declara `to: '/admin/parceiros'` e navega ao clique; em `/admin/parceiros`
  ele é exibido como ativo (`aria-current="page"`).
- A rota fica sujeita à mesma guarda de sessão das demais telas administrativas
  (`app/middleware/auth.global.ts`); sem sessão → `/admin/login?redirect=`. As rotas de API exigem a
  permissão do módulo `parceiros` (`server/utils/permission.ts`).

## 7. Modelo e importação

- Modelo oficial versionado em
  [`docs/modelos/modelo-importacao-parceiros.xlsx`](modelos/modelo-importacao-parceiros.xlsx), com
  cabeçalho **Razão Social, Nome Fantasia, Cidade, Estado, Região, Situação** (sem coluna Código — o
  servidor gera os códigos; sem coluna Logo — a logo é informada só no cadastro/edição).
- A importação é executada pelo modal `ParceirosImportar` (§3.8) + parser `lerPlanilhaParceiros.ts` e
  pela rota `POST /api/parceiros/importar` (revalidação, dedup por razão social, transação, limite de
  500 linhas; códigos sequenciais atribuídos pelo servidor).

## 8. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) (§5.21 `UiEntityCard`, §5.22 `UiPagination`);
  arquitetura/base: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md);
  Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md);
  Auditoria (detalhe da trilha): [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md);
  Softwares (molde do módulo): [`docs/10`](10%20-%20Módulo%20dos%20Softwares.md).

## 9. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes unitários: código (`PAR-XXX`) e validações (`tests/parceiros-validadores.test.ts`), mapa
  UF→Região (`tests/parceiros-regiao.test.ts`) e classificação da planilha
  (`tests/parceiros-import-parser.test.ts`).
- Conferência: `http://localhost:3000/admin/parceiros` — listar (cards), incluir, editar, excluir,
  filtrar, paginar, buscar, exportar PDF/CSV e importar (modelo
  `docs/modelos/modelo-importacao-parceiros.xlsx`); a vitrine `/design` traz as seções 21
  (`UiEntityCard`) e 22 (`UiPagination`).

## 10. Pendências e próximos passos

- **RBAC na interface:** gate de rota/botões por permissão do módulo `parceiros` no cliente (o gate é aplicado no cliente com `.can()` e reaplicado no servidor; a exportação usa `?exportar=1`).
- **Escala:** migrar busca/filtros/paginação para server-side se o cadastro crescer.
- **Relacionamentos:** "Operadores Ativos"/entrega por parceiro e campos da referência visual
  (CNPJ, endereço completo, segmento, matriz/filial) ficam fora desta versão.
