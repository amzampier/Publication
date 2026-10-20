# Proposal

## Why

O módulo Manuais Mensais foi entregue só no **frontend**, operando sobre um dataset em memória: nada é
persistido, as ações não sobrevivem ao F5 e a importação é apenas um ícone. Agora que o fluxo, o
contrato e o RBAC (`manuais` com 13 funcionalidades, catálogo 90) estão fixados, o módulo precisa do
**backend real** — API, persistência, arquivamento, itens sob demanda, RBAC e auditoria — e da
**importação por planilha** para meses históricos.

## What Changes

- **Backend `/api/manuais/**`** (molde Release Week):
  - `GET /api/manuais` (não arquivados + `itensCount`) e `?exportar=1` (guarda `exportar`);
    `GET /api/manuais/:id/itens` (itens somente leitura, `visualizar_itens`).
  - `POST /api/manuais` (criação; também usada pelo clone), `PUT /api/manuais/:id` (edição),
    `PUT /api/manuais/:id/publicar`, `PUT /api/manuais/:id/arquivar` e `DELETE /api/manuais/:id`
    (guarda de arquivamento/itens/anexos).
  - `POST /api/manuais/importar` (revalidação + transação).
  - `requirePermission` em todas as rotas e auditoria com recurso **"Manuais Mensais"**.
- **Regras de domínio** movidas/estendidas para `shared/utils/manuais.ts`, compartilhadas entre app,
  server e testes (`#shared`): tipos, validação, `codigo` `MAN-XX/AAAA`, guarda de exclusão,
  `prefillClone`, KPIs e formatação.
- **Regras de persistência:** `id` UUID; `codigo` gerado/regenerado a partir de `mes`/`ano`;
  `UNIQUE (ano, mes_numero)` → `409`; `autor_id` = sessão; `autorNome`/`revisorNome` via
  `LEFT JOIN usuarios`; `data_criacao` do banco ou histórica; `data_publicacao` do banco/histórica e
  preservada no publicar (`COALESCE(data_publicacao, CURRENT_DATE)`).
- **Frontend API-backed:** `useManuaisModelo` troca o dataset por `useApiFetch`; `UiLoading` real no
  F5; ações assíncronas; itens sob demanda; `itensCount` vindo da API; tratamento de `400/409/403`.
- **Importação histórica por planilha:** modelo `.xlsx` com Título, Mês, Ano, Descrição, Status,
  Data de Criação, Data de Publicação, Destaque do mês e Destaque da semana; parser local,
  pré-visualização, `POST /api/manuais/importar` transacional (limite 500), revalidação de datas,
  conflitos `(ano, mês)` e auditoria com a contagem.
- **Documentação:** `docs/13` (backend/API/importação), `docs/02` (rotas e remoção do "sem UI/API"),
  `docs/05` (mapeamento de auditoria) e novo `docs/modelos/modelo-importacao-manuais.xlsx`.
- **Sem migration nova:** `arquivada` (21) e o RBAC (22) já existem; o catálogo já está em 90.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova: o módulo já existe como `manuais-mensais`. -->

### Modified Capabilities

- `manuais-mensais`: o dataset em memória é substituído pela API; entram o backend (persistência,
  `arquivada`, código gerado, autor/revisor derivados, guardas, itens, auditoria) e a importação
  histórica por planilha; as exportações passam pela guarda `?exportar=1`; a affordance de importação
  deixa de existir.
- `autorizacao-rbac`: o catálogo de rotas administrativas passa a mapear `/api/manuais/**` para o
  módulo `manuais` e as ações `visualizar`, `visualizar_itens`, `criar`, `alterar`, `publicar`,
  `arquivar`, `excluir`, `importar` e `exportar`.

## Impact

- **Código novo:** `shared/utils/manuais.ts`, `server/utils/manuais.ts`, `server/api/manuais/**`,
  `app/components/manuais/Importar.vue`, `app/components/manuais/lerPlanilhaManuais.ts`.
- **Código alterado:** `app/components/manuais/validadores.ts` (reexport de `#shared`),
  `useManuaisModelo.ts` (API), `Formulario.vue`, `Tabela.vue`, `Itens.vue`, `Cabecalho.vue`,
  `app/pages/admin/manuais.vue`.
- **Docs/modelo:** `docs/13`, `docs/02`, `docs/05`,
  `docs/modelos/modelo-importacao-manuais.xlsx`.
- **Specs:** `manuais-mensais` e `autorizacao-rbac` (deltas).
- **Testes:** `tests/manuais-validadores.test.ts` (ajuste de import),
  `tests/manuais-import-parser.test.ts` (novo) e E2E/API manual.
- **Fora de escopo:** CRUD de `entregas_itens` (pertence a "Lançar as Chamadas"), UI de anexos
  (`anexos_midias`), Área Pública, fluxo de revisão/`revisor_feedback`, exportação gerada no
  servidor e preservação do autor histórico (o autor é o usuário que importa).
