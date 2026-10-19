# Tasks

## 1. Base compartilhada e banco

- [x] 1.1 Criar `shared/utils/release-week.ts` com tipos, `validarReleaseWeek`, `gerarCodigo`, `prefillClone`, regra de segunda-feira só para `data_publicacao` (UTC), `podeExcluirRelease`/`motivoBloqueioExclusao` e KPIs; apontar app/testes para `#shared/utils/release-week` e verificar `npm run test`
- [x] 1.2 Criar `server/migration/19_add_release_week_arquivada.sql` (`arquivada TINYINT(1) NOT NULL DEFAULT 0` + índice) com bloco de rollback; verificar no boot que a coluna existe e que `_migrations` registra o arquivo
- [x] 1.3 Criar `server/migration/20_reconciliar_rbac_release_week.sql` (adiciona `clonar`/`visualizar_itens` ao `extras` de `release-week` por perfil, idempotente) e atualizar `server/migration/02_seed.sql` + `docs/bd/02_seed.sql`; verificar os `extras` no banco após o boot
- [x] 1.4 Atualizar `docs/bd/01 - banco_dados_mariadb.sql` com a coluna `arquivada` na `release_week`

## 2. Catálogo e matriz RBAC

- [x] 2.1 Adicionar `clonar` e `visualizar_itens` em `app/config/perfis.ts`, `server/utils/perfis.ts` e na união `Extra`/`EXTRAS` de `app/components/perfis/usePerfisModelo.ts` (módulo `release-week`), mantendo app×server idênticos
- [x] 2.2 Implementar em `validarMatriz` a regra `clonar` exige `criar` (400) e atualizar `tests/perfis-funcionalidades.test.ts` para o total **88** + cenário da regra; verificar `npm run test`
- [x] 2.3 Atualizar `docs/07 - Perfis de Acesso (RBAC).md` (§7 catálogo/totais 88/63/38/13, 202/352, nota da migration 20) e conferir as referências cruzadas no `docs/02`/`docs/12`

## 3. Backend da Release Week

- [x] 3.1 Criar `server/utils/release-week.ts` usando o `shared`: listar ativas com `itensCount`, buscar, criar/editar (código gerado/regenerado, unicidade → 409), publicar (`data_aprovacao`), arquivar, excluir (guarda → 409) e listar itens; cobrir as regras puras com testes
- [x] 3.2 Criar `server/api/release-week/index.get.ts` (visualizar; `?exportar=1` → exportar) e `server/api/release-week/[id]/itens/index.get.ts` (visualizar_itens); verificar 200/403 e o filtro de arquivadas
- [x] 3.3 Criar `server/api/release-week/index.post.ts`, `[id]/index.put.ts`, `[id]/index.delete.ts`, `[id]/publicar/index.put.ts` e `[id]/arquivar/index.put.ts` com `requirePermission` + `registrarAuditoria` (recurso "Release Week"); verificar 201/200/409/403 e os registros na trilha
- [x] 3.4 Verificar as regras de servidor: `data_publicacao` fora de segunda-feira → 400; `(ano, semana)`/`codigo` duplicado → 409; release arquivada/com itens → 409 na exclusão; edição de `semana`/`ano` regenera o código

## 4. Importação

- [x] 4.1 Criar `app/components/release-week/lerPlanilhaReleaseWeek.ts` (parser puro + classificação `pronta`/`repetida`/`já cadastrada`/`inválida`) e `tests/release-week-import-parser.test.ts`; verificar `npm run test`
- [x] 4.2 Implementar `importarReleaseWeeks` em `server/utils/release-week.ts` (revalidação, dedup `(ano, semana)`, transação, limite 500) e `server/api/release-week/importar/index.post.ts` (importar + auditoria); verificar 200/400/403
- [x] 4.3 Criar `docs/modelos/modelo-importacao-release-week.xlsx` com as colunas oficiais e conferir a leitura pelo parser

## 5. Frontend API-backed

- [x] 5.1 Reescrever `app/components/release-week/useReleaseWeekModelo.ts` para `useApiFetch` (lista, itens lazy com cache, criar/editar/clonar/publicar/arquivar/excluir), removendo o dataset de exemplo e o timer fake; verificar o loading real no F5 e a persistência após recarregar
- [x] 5.2 Ajustar `Tabela.vue`/`Itens.vue`/`Cabecalho.vue`/`app/pages/admin/release-week.vue`: gates `clonar`/`visualizar_itens`/`importar`, expansão com loading/erro e exclusão guiada pelo `itensCount` da API; verificar na UI com perfis distintos
- [x] 5.3 Criar `Importar.vue` (upload `.xlsx`, pré-visualização com `UiDataTable`, seleção e commit) e ligar ao botão da toolbar; verificar importação válida e recusa de linha inválida
- [x] 5.4 Estender `tests/release-week-validadores.test.ts` para as regras de servidor (segunda-feira, regeneração/unicidade do código, guarda e clone); verificar `npm run test`

## 6. Documentação e gates

- [x] 6.1 Atualizar `docs/12 - Módulo das Releases Week.md` (backend implementado, contrato da API, fluxos, itens, importação, verificação e pendências) e conferir `docs/01`/`docs/02` onde citarem a matriz/totais
- [x] 6.2 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar os quatro gates verdes
- [x] 6.3 Verificação E2E manual: CRUD, publicar, arquivar (some da lista), exclusão bloqueada, itens sob `visualizar_itens`, importação, 400 de segunda-feira, 409 de duplicidade e 403 por permissão; recarregar e confirmar a persistência
- [x] 6.4 Rodar `openspec validate release-week-backend-e-importacao --strict` e `openspec validate --specs`; então seguir `/opsx-sync` + `/opsx-archive`
