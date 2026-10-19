# Design: release-week-backend-e-importacao

## Context

Ver `proposal.md - Why`. Estado relevante:

- O frontend da Release Week (change arquivada `construir-release-week-frontend`) opera sobre
  `useState` em `useReleaseWeekModelo.ts`; os validadores puros vivem em
  `app/components/release-week/validadores.ts`.
- `release_week` já tem `codigo` único, `UNIQUE (ano, semana)`, `status` ENUM de 4 valores,
  `destaque_semana`, `autor_*`, `revisor_*` e timestamps; **não** tem coluna de arquivamento.
- `entregas_itens.release_id` referencia a release (`ON DELETE CASCADE`) e é a relação que impede
  a exclusão.
- O padrão de backend é `server/utils/<modulo>.ts` + `server/api/<modulo>/**` com
  `requirePermission` e `registrarAuditoria` (molde `softwares`).
- O catálogo RBAC é espelhado em `app/config/perfis.ts` ↔ `server/utils/perfis.ts` (+ `Extra` em
  `usePerfisModelo.ts`); o total (86) também aparece em `docs/07`, `tests/perfis-funcionalidades` e
  na spec `perfis-acesso`. A reconciliação de matriz é feita por migration (16 e 17).
- Há `shared/utils/` importável como `#shared` por app, server e testes (padrão `emails.ts`).

## Goals / Non-Goals

**Goals:**
- Persistir Release Weeks e itens reais, com RBAC/auditoria no servidor.
- Fechar a importação por planilha.
- Refletir `clonar`/`visualizar_itens` na matriz e nos totais normativos.

**Non-Goals:**
- CRUD de `entregas_itens` (módulo "Lançar as Chamadas").
- Exportação gerada no servidor (CSV/PDF continua no cliente; a API só expõe a guarda `exportar`).
- Seed de Release Weeks.

## Decisions

### D1 — Regras puras em `shared/utils/release-week.ts`
Mover/estender a lógica pura (tipos, validação do cabeçalho, `gerarCodigo`, regra de segunda-feira,
`prefillClone`, guarda de exclusão, KPIs) para `shared/utils/release-week.ts`. App, server e testes
importam via `#shared/utils/release-week` (mesmo padrão de `emails.ts`). Elimina a duplicação
app×server e mantém um único conjunto de testes.

- **Alternativa descartada:** duplicar a validação em `server/utils` (como no RBAC) — mais risco de
  divergência entre a tela e a API.

### D2 — API por ação, com permissão própria
Rotas como em `softwares`/`parceiros`:
`GET /api/release-week` (visualizar; `?exportar=1` → exportar), `GET /:id/itens` (visualizar_itens),
`POST` (criar), `PUT /:id` (alterar), `PUT /:id/publicar` (publicar), `PUT /:id/arquivar` (arquivar),
`DELETE /:id` (excluir) e `POST /importar` (importar). `server/utils/release-week.ts` concentra
validação e acesso; as rotas só aplicam RBAC, chamam o util e registram auditoria.

- **Clone:** o cliente abre o formulário pré-preenchido e grava por `POST /api/release-week`
  (permissão `criar`). `clonar` controla apenas a affordance; a matriz exige `criar` junto (D10).

### D3 — `arquivada` booleano + listagem sem arquivadas
Migration `19_add_release_week_arquivada.sql`: `arquivada TINYINT(1) NOT NULL DEFAULT 0` + índice.
`GET /api/release-week` filtra `arquivada = 0`; `PUT /:id/arquivar` só marca a flag (nenhum
`DELETE`). `itensCount` vem de um `LEFT JOIN`/subconsulta em `entregas_itens`.

- **Alternativa descartada:** novo valor no ENUM `status` — arquivar não é etapa do fluxo editorial e
  precisa sumir da lista sem apagar.

### D4 — Código gerado/regenerado no servidor
`codigo = RW-<semana>/<ano>` derivado no servidor na criação **e na edição** quando `semana`/`ano`
mudam. Unicidade por `codigo` e `(ano, semana)`; violação → `409`. O cliente nunca envia `codigo`.

- **Trade-off:** editar `semana`/`ano` altera o código (coerência) — o formulário mostra o código
  somente leitura e a mudança é refletida no retorno da API.

### D5 — Segunda-feira só para `data_publicacao`
Validação no servidor: interpretar `AAAA-MM-DD` em UTC (`Date.UTC`) e exigir `getUTCDay() === 1` para
`data_publicacao`; demais datas só presença/formato. `400` com mensagem clara.

- **Por que UTC:** evita deslocamento de fuso (o valor é uma data civil, não um instante).

### D6 — Guarda de exclusão no servidor
`DELETE /:id` recusa com `409` quando `arquivada = 1` ou quando existe item em `entregas_itens` com
`release_id = :id`. A UI desabilita a ação pelo `itensCount`; a API é a fonte da verdade.

### D7 — Itens sob demanda
`GET /:id/itens` devolve `entregas_itens` da release (somente leitura) e exige `visualizar_itens`.
A expansão busca na primeira abertura e faz cache por release no cliente; a flag só aparece com a
permissão. `itensCount` na lista é apenas contagem (visualizar).

### D8 — Frontend API-backed
`useReleaseWeekModelo` troca `useState`/dataset por `useApiFetch`: `carregarSemanas` (loading/erro),
`itensDaRelease` (lazy), `adicionar`/`atualizar`/`publicar`/`arquivar`/`excluir` (API) e
`clonarPreenchimento` (local). Remove os dados de exemplo e o timer fake; o `UiLoading` do F5 cobre o
`GET` real. Ações gated por `can(...)`.

### D9 — Importação transacional
`Importar.vue` + `lerPlanilhaReleaseWeek.ts` (parser puro, classificação `pronta`/`repetida`/`inválida`/
`já cadastrada`) + `POST /api/release-week/importar`. O servidor revalida (incluindo segunda-feira),
recusa tudo se houver linha inválida/duplicada (`400` com motivos/conflitos), grava em transação
(códigos gerados) e registra auditoria. Limite de 500 linhas.

### D10 — RBAC: `clonar` + `visualizar_itens`
`release-week` passa de 11 para 13 funcionalidades; catálogo 86 → 88. Defaults:
Administrador 88/88, Editor 63/88, Revisor 38/88, Leitor 13/88 (202/352). A validação da matriz
recusa `clonar` sem `criar` (400). Migration `20_reconciliar_rbac_release_week.sql` atualiza o
`extras` de `release-week` por perfil (idempotente) e `02_seed.sql`/`docs/bd/02` refletem o default.
`importar` no release-week segue só no Administrador.

### D11 — Auditoria
Recurso **"Release Week"**: criar/importar → `Inclusão`; editar/arquivar → `Alteração`; publicar →
`Homologação`; excluir → `Exclusão`. `data_aprovacao` é gravada no publicar.

## Risks / Trade-offs

- [Total 86 espalhado em docs/specs/testes] → varredura dirigida + `openspec validate --specs`.
- [`clonar` sem `criar`] → regra no `validarMatriz` (400) e default sempre junto.
- [Fuso na segunda-feira] → comparação em UTC da data civil.
- [Regeneração de código na edição] → `409` explícito + teste.
- [Reconciliação RBAC apagar extras] → UPDATE que só acrescenta as funcionalidades, preservando o
  restante; idempotente.
- [Itens lazy] → cache por release + estados de loading/erro na expansão.
- [Importação parcial] → validação/conflito antes da transação; nada parcial persiste.

## Migration Plan

1. `shared/utils/release-week.ts` + testes.
2. Migrations `19` (coluna) e `20` (RBAC) + seed/docs de banco.
3. Catálogo RBAC + docs/07 + testes.
4. Backend (`server/utils/release-week.ts` + rotas) + auditoria.
5. Importação (server + parser + modelo).
6. Frontend API-backed + permissões + importação.
7. Docs/specs + gates + E2E.
Rollback: remover as rotas/componentes e reverter as migrations (`DROP COLUMN arquivada`; UPDATE do
`extras` de volta), conforme o bloco de rollback de cada arquivo.
