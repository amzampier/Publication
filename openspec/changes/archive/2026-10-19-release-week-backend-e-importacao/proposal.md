# Proposal: release-week-backend-e-importacao

## Why

O módulo Release Week foi entregue só no **frontend**, operando sobre um dataset em memória: nada é
persistido, as ações não sobrevivem ao F5 e a importação é apenas um ícone. Agora que o fluxo e o
contrato estão fixados, o módulo precisa de **backend real** (persistência, arquivamento, itens,
RBAC e auditoria) e da **importação por planilha** que ficou adiada. Em paralelo, a matriz RBAC
precisa contemplar as funcionalidades que a tela introduziu (`clonar` e `visualizar_itens`), para que
o servidor seja a fonte da verdade dessas ações.

## What Changes

- **Backend `/api/release-week/**`** (molde Softwares/Parceiros):
  - `GET /api/release-week` (ativas + `itensCount`) e `?exportar=1` (guarda `exportar`);
    `GET /api/release-week/:id/itens` (itens somente leitura, `visualizar_itens`).
  - `POST /api/release-week` (criação; também usada pelo clone), `PUT /api/release-week/:id`
    (edição), `PUT /api/release-week/:id/publicar`, `PUT /api/release-week/:id/arquivar` e
    `DELETE /api/release-week/:id` (com guarda de arquivamento/itens).
  - `POST /api/release-week/importar` (revalidação + transação).
  - RBAC (`requirePermission`) em todas as rotas e auditoria com recurso **"Release Week"**.
- **Regras de domínio** em `shared/utils/release-week.ts` (compartilhado app×server): validação do
  cabeçalho, `codigo` `RW-XX/AAAA` gerado/regenerado no servidor com unicidade, **`data_publicacao`
  obrigatoriamente segunda-feira** no servidor, guarda de exclusão e `prefillClone`.
- **Banco:** migration `19_add_release_week_arquivada.sql` (`arquivada` booleano + índice) e
  migration `20_reconciliar_rbac_release_week.sql` (reconcilia o `extras` de `release-week`).
- **RBAC:** `release-week` passa a oferecer **`clonar`** e **`visualizar_itens`**; catálogo
  **86 → 88**. `clonar` exige `criar` na validação da matriz. Defaults: Administrador 88/88,
  Editor 63/88, Revisor 38/88, Leitor 13/88 (**202/352**).
- **Frontend:** o modelo troca o dataset em memória pela API (`useApiFetch`); itens sob demanda,
  loading real no F5, ações gated por `can(...)`, e a **importação** passa a ser funcional
  (modal + parser `.xlsx` + modelo versionado).
- **Documentação:** `docs/12` (backend/contrato/importação), `docs/07` (matriz/totais),
  `docs/bd/01`/`docs/bd/02` e `server/migration/02_seed.sql`.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova: o módulo já existe como capability `release-week`. -->

### Modified Capabilities

- `release-week`: a persistência substitui o dataset em memória; entra o backend (API, `arquivada`,
  regeneração de código, segunda-feira, guarda de exclusão, itens, auditoria) e a importação por
  planilha deixa de ser affordance; a flag de itens passa a exigir `visualizar_itens` e a clonagem
  é gated por `clonar` (operação exige `criar`).
- `perfis-acesso`: catálogo de funcionalidades com `clonar`/`visualizar_itens` no `release-week`;
  total do catálogo 88 e totais normativos 88/63/38/13 (202/352); regra de que `clonar` exige
  `criar`.
- `autorizacao-rbac`: o catálogo de rotas administrativas passa a mapear as rotas de
  `/api/release-week/**` para o módulo `release-week` e as ações `visualizar`, `visualizar_itens`,
  `criar`, `alterar`, `publicar`, `arquivar`, `excluir`, `importar` e `exportar`; o helper `.can`
  passa a controlar também `clonar`/`visualizar_itens`.

## Impact

- **Código novo:** `server/utils/release-week.ts`, `server/api/release-week/**`,
  `shared/utils/release-week.ts`, `app/components/release-week/Importar.vue`,
  `app/components/release-week/lerPlanilhaReleaseWeek.ts`.
- **Código alterado:** `app/components/release-week/useReleaseWeekModelo.ts` (API), `Tabela.vue`,
  `Itens.vue`, `Cabecalho.vue`, `app/config/perfis.ts`, `server/utils/perfis.ts`,
  `app/components/perfis/usePerfisModelo.ts`, `app/pages/admin/release-week.vue`.
- **Migrations:** `19_add_release_week_arquivada.sql`, `20_reconciliar_rbac_release_week.sql`.
- **Seed:** `server/migration/02_seed.sql` (extras de `release-week`).
- **Docs:** `docs/12`, `docs/07`, `docs/bd/01`, `docs/bd/02`,
  `docs/modelos/modelo-importacao-release-week.xlsx`.
- **Specs:** `release-week`, `perfis-acesso`, `autorizacao-rbac` (deltas).
- **Testes:** `tests/release-week-validadores.test.ts`, `tests/release-week-import-parser.test.ts`,
  `tests/perfis-funcionalidades.test.ts` (total 88 + regra `clonar`⇒`criar`).
- **Fora de escopo:** CRUD dos itens (`entregas_itens` pertence a "Lançar as Chamadas"); tela
  pública de Release Week; exportação gerada no servidor (o CSV/PDF continua no cliente sob a
  guarda `exportar`).
