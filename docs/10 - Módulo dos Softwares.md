# 10 - Módulo dos Softwares — Área Administrativa

**Versão:** 2.0.0 — **Data:** 2026-10-17 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal do módulo **Softwares** — listagem do catálogo corporativo
(`codigo`, `descricao`, `categoria`, `situacao`, `criado_em`, `atualizado_em`), KPIs, filtros por
categoria e situação, exportações **PDF** e **CSV**, os **modais de cadastro/edição e de exclusão**,
a **importação por planilha** e o **modelo de importação** versionado. O **backend está implementado**
(`server/api/softwares/**`): o `codigo` sequencial (`SFT-XXX`) é a identidade/chave primária do
software e é gerado pelo servidor; as rotas exigem permissão RBAC do módulo `softwares` e registram
auditoria.
**Arquivos-fonte:** [`app/pages/admin/softwares.vue`](../app/pages/admin/softwares.vue) ·
[`app/components/softwares/`](../app/components/softwares) ·
[`server/api/softwares/`](../server/api/softwares) ·
[`server/utils/softwares.ts`](../server/utils/softwares.ts) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — **nenhum** componente de kit novo; a tela reusa
`UiButton`, `UiBadge`, `UiKpi`, `UiDataTable`, `UiSelect`, `UiModal`, `UiModalSection`, `UiUploadFiles`,
`UiCheckbox`, `UiTooltip` e `UiLoading`
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md)
**Autoridade de comportamento:** `openspec/specs/softwares` (deltas desta change em
`openspec/changes/softwares-backend-e-importacao/specs/softwares` — sincronizada no archive via
`/opsx-sync`)

> Este documento é a referência da tela `/admin/softwares` e de tudo o que foi criado para ela —
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

O catálogo de softwares é a tela de cadastro dos sistemas e soluções tecnológicas da Área
Administrativa:

- **Rota:** `/admin/softwares` → `app/pages/admin/softwares.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`
  (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Modelo de dados:** conforme `docs/bd/01` §7 (tabela `softwares`) —
  `codigo` (VARCHAR(20), **chave primária**, `SFT-XXX`), `descricao` (nome/descrição exibido),
  `categoria` (`Delphi` | `Web` | `Delphi e Web`), `situacao` (`Ativo` | `Inativo`), `criado_em` e
  `atualizado_em` (timestamps gerados pelo sistema). O FK `entregas_itens.software_id` referencia
  `softwares(codigo)`.
- **Persistência:** a listagem é carregada de `GET /api/softwares` no `onMounted`; a tela exibe
  `UiLoading` no voo e, em falha, um toast de erro + lista **vazia** — nunca a demo fingindo ser
  persistida (RL02 DIV-12/13). O catálogo é semeado por `server/migration/15_seed_softwares.sql`.
- **Componentização:** a página é fina e dona da coordenação; cada parte é um componente em
  `app/components/softwares/` (auto-import com prefixo `Softwares*`).

## 2. Estrutura da página (componentização)

```
admin/softwares.vue                     (page - definePageMeta + composição + coordenação)
├── <SoftwaresCabecalho @novo />        → tile Boxes #0364f7 + título + menu "Relatórios" + "Novo Software"
├── <SoftwaresKpis class="mt-6" />      → 6 UiKpi do conjunto VIGENTE (Total, Ativos, Inativos e por Categoria)
├── <SoftwaresTabela
│       ref="tabelaRef"
│       class="mt-5"
│       @editar @excluir @importar @open-filters />  → UiDataTable (busca + Import + Filtros + badges + ações)
├── <SoftwaresFiltros v-model="filtrosAbertos" />    → modal de filtros (Categoria, Situação)
├── <SoftwaresFormulario v-model :modo :software />  → modal de cadastro/edição
├── <SoftwaresExclusao v-model :software @confirmar /> → modal de confirmação de exclusão
└── <SoftwaresImportar v-model="importarAberto" />   → modal de importação (.xlsx)
```

- **Estado de coordenação:** `carregando` (overlay), `filtrosAbertos`, os modais
  `modalAberto`/`modo`/`softwareEditar` (cadastro/edição), `exclusaoAberta`/`softwareExcluir`
  (exclusão) e `importarAberto` (importação), mais `tabelaRef<{ focarBusca }>` (molde de
  Perfis/Usuários). `abrirEdicao(linha)` resolve o registro **completo** por `codigo` na base
  (timestamps) e abre em modo edição; `confirmarExclusao()` fecha e chama `excluirSoftware()` (DELETE).
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8` (mesmo padrão de
  Usuários, Perfis e Auditoria).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<SoftwaresCabecalho>`

- Cabeçalho sem container (padrão `PerfisCabecalho`): tile `bg-brand-primary` com `Boxes` em
  `#0364f7`, título "Softwares" e subtítulo "Catálogo de softwares corporativos — categoria,
  situação e auditoria de cadastro."
- **Botão "Novo Software"** (`UiButton` primary + `Plus`): **emite `@novo`** para a página.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, mini-menu
  `role="menu"`): "Listagem em PDF" (→ `gerarPdfSoftwares`) e "Exportar em CSV" (coluna **Código**
  incluída). O menu fecha no clique fora e no `Escape`.

### 3.2 `Kpis.vue` → `<SoftwaresKpis>`

- Seis `UiKpi` derivados do **conjunto vigente** (filtrado, quando houver filtro): **Total de
  softwares** (`#0364f7`), **Ativos** (`#047857`), **Inativos** (`#64748b`) e a quebra por
  categoria — **Delphi** (`#b070ef`), **Web** (`#50a1ff`) e **Delphi e Web** (`#2dd4bf`).

### 3.3 `Tabela.vue` → `<SoftwaresTabela>`

- `UiDataTable` com `show-header-top` (busca) e `show-filters` (botão "Filtros" com contador),
  colunas **Código, Descrição, Categoria, Situação, Criado em, Atualizado em** + **Ações**.
- **Categoria** em `UiBadge neutral` (sem ícone); **Situação** em `UiBadge`
  (`Ativo`→`done`, `Inativo`→`neutral`, mapa `VARIANTE_POR_SITUACAO`).
- **Ações** (`Pencil` editar, `Trash2` excluir) emitem `@editar`/`@excluir` para a página; a busca
  expõe `focarBusca()` para encadear o foco quando a linha do gatilho sair do DOM.
- **Importação**: botão (`Import`) no slot `filtersLeft` da `UiDataTable`, **imediatamente à esquerda**
  do botão "Filtros", emite `@importar` para a página (§3.7).
- Busca, ordenação e paginação são **client-side**, como as demais telas do kit.

### 3.4 `Filtros.vue` → `<SoftwaresFiltros>`

- `UiModal size="sm"` acionado pela toolbar da tabela, com **Categoria** e **Situação** em
  `UiSelect` (vazio = todas) e os botões "Limpar Filtros", "Cancelar" e "Aplicar" — molde
  `PerfisFiltros`/`UsuariosFiltros`.
- Rascunho isolado (`rascunho`): ao abrir espelha o estado vigente; "Aplicar" grava os filtros,
  "Cancelar" descarta e "Limpar Filtros" zera rascunho e estado.

### 3.5 `Formulario.vue` → `<SoftwaresFormulario>` (cadastro/edição)

- `UiModal size="md"` aberto por "Novo Software" (criação) ou pela ação "Editar" (edição), molde
  `PerfisFormulario`: seção **Dados do Software** com **Descrição** (`UiInput`, obrigatória, ≤ 200),
  **Categoria** (`UiSelect` — `Delphi`/`Web`/`Delphi e Web`, `clearable` desligado) e **Situação**
  (`UiSegmented` — `Ativo`/`Inativo`); na criação nasce com `Delphi` e `Ativo`.
- Na **edição** exibe a seção **Informações de Cadastro** com **Código** (somente leitura), "Criado
  em" e "Atualizado em" desabilitados (o código é imutável).
- Validação no cliente (Descrição obrigatória/limite) com erro persistente no campo e foco no
  primeiro problema; Enter navega para o próximo campo. Salvar chama `salvarSoftware`
  (`POST` na criação, `PUT /api/softwares/:codigo` na edição — §4) e, no sucesso, fecha o modal com
  `toast.success`.

### 3.6 `Exclusao.vue` → `<SoftwaresExclusao>`

- `UiModal size="sm"`: apresentação pura — exibe **descrição, código e categoria** do software e
  emite `confirmar`; a página fecha o modal e chama `excluirSoftware` (`DELETE /api/softwares/:codigo`),
  removendo a linha e confirmando com `toast.success` (falha → `toast.danger` com a listagem intacta;
  `409` quando há entregas vinculadas).

### 3.7 `Importar.vue` + `lerPlanilhaSoftwares.ts` → `<SoftwaresImportar>`

- `UiModal size="lg"` aberto pelo botão de importação da toolbar, molde `UsuariosImportar`:
  `UiUploadFiles` (`.xlsx`), pré-visualização em `UiDataTable` com a coluna **Resultado**
  (`Pronto para importar` / `Já cadastrado` / `Repetido no arquivo` / `Linha inválida`) e seleção
  das linhas prontas; o commit vai a `POST /api/softwares/importar`.
- `lerPlanilhaSoftwares.ts`: parser puro do modelo (colunas **Descrição, Categoria, Situação**),
  sem imports de Nuxt — `classificarLinhas` é coberto por testes unitários. Normaliza trim/caixa e
  classifica na ordem `inválida → repetida → já cadastrada → pronta`; descrição é a chave de
  duplicidade (case-insensitive).

## 4. Contrato de dados

O frontend consome `GET /api/softwares`, que devolve o catálogo completo **em ordem de `codigo`**
(array de `SoftwareModelo` em `app/components/softwares/useSoftwaresModelo.ts`):

```json
[
  {
    "codigo": "SFT-001",
    "descricao": "Teorema ERP",
    "categoria": "Delphi e Web",
    "situacao": "Ativo",
    "criado_em": "2026-10-17T12:00:00.000Z",
    "atualizado_em": "2026-10-17T12:00:00.000Z"
  }
]
```

- `categoria` ∈ `Delphi` | `Web` | `Delphi e Web`; `situacao` ∈ `Ativo` | `Inativo`.
- Os timestamps são ISO 8601 e formatados em `dd/mm/aaaa hh:mm` (pt-BR) pela função
  `formatarDataHora` na tabela e nas exportações.

**Escritas e importação (backend real — `server/api/softwares/**`):**

| Ação | Método e rota | Permissão | Corpo / resposta |
|---|---|---|---|
| Listar | `GET /api/softwares` | `softwares`/`visualizar` | → `200` array ordenado por `codigo` |
| Incluir | `POST /api/softwares` | `softwares`/`criar` | `{ descricao, categoria, situacao }` → `201` software (código gerado) |
| Editar | `PUT /api/softwares/:codigo` | `softwares`/`alterar` | `{ descricao?, categoria?, situacao? }` → `200` software |
| Excluir | `DELETE /api/softwares/:codigo` | `softwares`/`excluir` | → `200` `{ ok: true }` (409 com entregas) |
| Importar | `POST /api/softwares/importar` | `softwares`/`importar` | `{ linhas: [...] }` → `200` `{ importados }` (400 com `motivos`/`conflitos`) |

O cliente envia só os campos editáveis; o servidor gera o `codigo` (`SFT-XXX`, `MAX + retry`) e
resolve `criado_em`/`atualizado_em`. Escritas registram auditoria com recurso **"Softwares"**
(`docs/05` §6.2).

## 5. Fluxos

- **Listagem:** `onMounted` chama `carregarSoftwares()` (idempotente). No voo, `UiLoading`
  ("Carregando softwares…") cobre o conteúdo; em sucesso, KPIs + tabela refletem a base; em falha,
  toast de erro e lista vazia.
- **Filtros:** o modal refina o conjunto vigente. Aplicar recalcula KPIs e linhas; limpar restaura o
  catálogo completo; o badge do botão "Filtros" mostra a quantidade de filtros ativos.
- **Exportação PDF:** `gerarPdfSoftwares` (jsPDF A4 paisagem + autotable) gera a listagem com
  cabeçalho (logomarca de login quando configurada), colunas do catálogo (**Código** incluído) e
  rodapé "Página X de Y".
- **Exportação CSV:** gerado no cliente (`;`, BOM UTF-8, neutralização de fórmula), com as colunas do
  catálogo sobre o conjunto filtrado; falha → `toast.danger`.
- **Cadastro/edição:** "Novo Software" abre o modal em modo criação; "Editar" resolve o registro
  completo por `codigo` e abre em modo edição (com Código somente-leitura e timestamps). Salvar grava
  via API (`POST`/`PUT`) e fecha com `toast.success`; falha `400` aponta no campo e mantém o modal.
- **Exclusão:** "Excluir" abre o modal de confirmação; confirmar remove via `DELETE` (409 se houver
  entregas vinculadas), atualiza a listagem e devolve o foco à busca (`nextTick`); falha → `toast.danger`.
- **Importação:** o botão da toolbar abre o modal; após escolher o arquivo, o parser local classifica
  as linhas e o usuário seleciona as prontas; o commit vai à API (revalidação + transação + códigos),
  recarrega a lista e confirma com `toast.success`. Linhas inválidas/duplicadas não gravam nada.

## 6. Navegação até a tela

- O item **Softwares** da sessão **Cadastros** da sidebar (`app/config/navigation.ts`) declara
  `to: '/admin/softwares'` e navega ao clique, como os demais itens com rota; em
  `/admin/softwares` ele é exibido como ativo (`aria-current="page"`).
- A rota fica sujeita à mesma guarda de sessão das demais telas administrativas
  (`app/middleware/auth.global.ts`); sem sessão → `/admin/login?redirect=`. As rotas de API exigem
  a permissão do módulo `softwares` (`server/utils/permission.ts`).

## 7. Modelo e importação

- Modelo oficial versionado em
  [`docs/modelos/modelo-importacao-softwares.xlsx`](modelos/modelo-importacao-softwares.xlsx), com
  cabeçalho **Descrição, Categoria, Situação** (sem coluna Código — o servidor gera os códigos).
- A importação é executada pelo modal `SoftwaresImportar` (§3.7) + parser `lerPlanilhaSoftwares.ts` e
  pela rota `POST /api/softwares/importar` (revalidação, dedup por descrição, transação, limite de 500
  linhas; códigos sequenciais atribuídos pelo servidor).

## 8. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md); arquitetura/base:
  [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md);
  Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md);
  Auditoria (detalhe da trilha): [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md);
  Gestão de Usuários (molde de importação):
  [`docs/06`](06%20-%20Gestão%20de%20Usuários%20e%20Convite.md);
  Perfis/RBAC (molde de filtros/exportação): [`docs/07`](07%20-%20Perfis%20de%20Acesso%20(RBAC).md).

## 9. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes unitários: código (`SFT-XXX`), validadores (descrição/categoria/situação) e classificação
  da planilha (`tests/softwares-*.test.ts`).
- Conferência: `http://localhost:3000/admin/softwares` — listar, incluir, editar, excluir e importar
  (modelo `docs/modelos/modelo-importacao-softwares.xlsx`); a vitrine `/design` permanece inalterada
  (nenhum componente de kit novo).

## 10. Pendências e próximos passos

- **RBAC na interface:** gate de rota/botões por permissão do módulo `softwares` no cliente (hoje a
  autorização é server-side; a UI mostra a tela a qualquer sessão válida).
- **Escala:** migrar busca/filtros/paginação para server-side se o catálogo crescer.
- **Releases/Projetos:** as telas que consomem softwares passam a usar `codigo` (FK já reapontado).
