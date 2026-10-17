# Proposal

## Why

A tela de Softwares já existe (`/admin/softwares`), mas o catálogo é um **botão morto**: não há API
`/api/softwares` (o `GET`/`POST`/`PUT`/`DELETE` que o frontend já chama falham) e a importação por
planilha está desabilitada (a affordância na toolbar só informa que "será habilitada"). Além disso, o
catálogo não tem identidade estável e legível — a PK atual é `id VARCHAR(64)` (UUID sem
significado) — enquanto releases e projetos referenciam softwares por id. Esta change materializa o
**backend do módulo** e a **importação**, e promove um **`codigo` sequencial (`SFT-001`)** a
identidade do software.

## What Changes

- **BREAKING (schema):** a tabela `softwares` passa a ter **`codigo VARCHAR(20)` como chave primária**
  (formato `SFT-%03d`); a coluna `id` é renomeada para `codigo` e o FK
  `entregas_itens.software_id` passa a referenciar `softwares(codigo)`. Ambas as tabelas estão
  **vazias hoje** (o seed não insere entregas) — a migration não perde dados.
- **Backend novo** (`server/api/softwares/**` + `server/utils/softwares.ts`):
  - `GET /api/softwares` — catálogo completo (array ordenado por `codigo`; busca/ordenação/paginação
    no cliente, como o frontend já faz).
  - `POST /api/softwares` (gera o próximo `codigo`), `PUT /api/softwares/:codigo`,
    `DELETE /api/softwares/:codigo`.
  - `POST /api/softwares/importar` — revalida as linhas contra o banco e grava em **transação**,
    atribuindo os códigos sequenciais.
- **RBAC por rota:** cada rota exige `softwares`/`visualizar|criar|alterar|excluir|importar`
  (a matriz já existe; Administrador tem `importar`, Editor só `exportar`).
- **Auditoria:** cada escrita registra na trilha com recurso **"Softwares"** (Inclusão/Alteração/
  Exclusão; a importação como Inclusão "Importou N software(s)").
- **Importação (cliente):** parser `lerPlanilhaSoftwares.ts` (colunas **Descrição, Categoria,
  Situação**) e modal `Importar.vue` (upload `.xlsx`, prévia com Situação — pronto / já cadastrado /
  repetido / inválido —, seleção das linhas prontas e `POST /api/softwares/importar`). Dedup por
  **descrição** (case-insensitive); **o servidor gera os códigos** (a planilha não tem coluna Código).
- **Seed inicial:** softwares `SFT-001…` (catálogo de exemplo real) + atualização de `docs/bd/01`
  (schema) e `docs/bd/02_seed.sql`.
- **Frontend alinhado:** `id` → `codigo` no modelo/componentes; coluna **"Código"** na tabela, no PDF
  e no CSV; no editar, Código somente-leitura; no incluir, gerado pelo servidor.
- **Documentação:** `docs/10 - Módulo dos Softwares.md`, `docs/02` §3.7 (rota de importação) e
  `docs/05` (tabela rota → ação → recurso da auditoria).

## Capabilities

### New Capabilities

<!-- Nenhuma. -->

### Modified Capabilities

- `softwares`: a estrutura do catálogo ganha `codigo` como identidade (chave primária) e o backend
  passa a servir as rotas de leitura/escrita e a importação com revalidação, geração de código e
  transação.
- `autorizacao-rbac`: o catálogo de rotas administrativas passa a mapear as rotas de `softwares`
  (`GET`/`POST`/`PUT`/`DELETE`/`importar`) para o módulo `softwares`.
- `migracoes-banco`: os seeds iniciais passam a incluir o catálogo de softwares e uma migration de
  reestruturação de identidade (`codigo` como PK) entra na cadeia versionada.

## Impact

- **Banco/schema:** migrations novas (`14_softwares_codigo_pk.sql`, `15_seed_softwares.sql`);
  `docs/bd/01 - banco_dados_mariadb.sql` e `docs/bd/02_seed.sql`.
- **Backend:** `server/utils/softwares.ts` (novo), `server/api/softwares/**` (novo). Reutiliza
  `requirePermission`, `registrarAuditoria`, `query`/`getTransaction`, `escaparLike`.
- **Frontend:** `app/components/softwares/` (`useSoftwaresModelo.ts`, `Tabela.vue`, `Formulario.vue`,
  `Exclusao.vue`, `Cabecalho.vue`, `gerarPdfSoftwares.ts` ajustados; `lerPlanilhaSoftwares.ts` e
  `Importar.vue` novos) e `app/pages/admin/softwares.vue`.
- **Specs:** deltas em `softwares`, `autorizacao-rbac` e `migracoes-banco`.
- **Documentação:** `docs/10`, `docs/02`, `docs/05`.
- **Dependências:** nenhuma nova (`exceljs`, `jspdf`/`jspdf-autotable`, `mysql2`, `bcrypt` já
  presentes).
- **Fora de escopo:** telas de Releases/Projetos que consomem softwares (o FK é apenas reapontado),
  exportação server-side, e qualquer alteração em `auditoria` (a trilha é dinâmica).
