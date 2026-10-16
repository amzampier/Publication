# Tasks

## 1. UiDataTable — modo servidor

- [x] 1.1 Props (`serverMode`, `total`, `page`, `perPage`, `searchDebounceMs`) e emits (`page-change`, `per-page-change`, `sort-change`, `search`); no modo servidor, renderiza a página recebida e deriva as páginas de `total`/`perPage`. Verificado por build; modo cliente inalterado.
- [x] 1.2 Debounce da busca no modo servidor (emite `search`). Verificado por build.

## 2. API de auditoria paginada

- [x] 2.1 `listarAuditoria` com `pagina`/`porPagina` (`LIMIT`/`OFFSET`) + `total` + `kpis`; rota lê os parâmetros. Verificado no E2E: página 1 = 2 registros, total 95; página 2 distinta; KPIs presentes.
- [x] 2.2 Modo exportação (`?exportar=1`) devolve o conjunto filtrado completo. Verificado: 95 registros = total.

## 3. API de usuários paginada + projeção

- [x] 3.1 `listarUsuarios` com `pagina`/`porPagina`/filtros/busca + `total` + `kpis` + `opcoes`. Verificado: página 1 = 1 usuário, total 3, KPIs (ativos/inativos/perfis), opções.
- [x] 3.2 Projeção sem `senha_smtp` (indicador `tem_senha`). Verificado: export sem senha em claro.
- [x] 3.3 Modo exportação completo. Verificado: 3 = total.

## 4. Cliente (auditoria/usuários)

- [x] 4.1 `auditoria`: composable/página em modo servidor (filtros/paginação/busca → API), KPIs do servidor e exportação pelo conjunto completo. Verificado por build/E2E.
- [x] 4.2 `gestao-usuarios`: composable/página em modo servidor; KPIs do servidor; exportação pelo conjunto completo; mutações rebuscam. Verificado por build/E2E.

## 5. Importação e infra

- [x] 5.1 `importarUsuarios` sem N+1 (Map de perfis + multi-row INSERT em chunks). Verificado: importar 2 linhas → `importados: 2`.
- [x] 5.2 Pool configurável (`DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT`) e `getTransaction` liberando conexão em `finally`. Verificado por build.
- [x] 5.3 Upload com `fs/promises`. Verificado por build.

## 6. Desperdícios

- [x] 6.1 Dedup do `GET /api/configuracoes` (`useConfiguracoesGlobais` com cache `useState`). Verificado por build.

## 7. Verificação integrada

- [x] 7.1 `npm run build` — sucesso ("Build complete!").
- [x] 7.2 E2E integrado: auditoria paginada (página 2 distinta, total 95, export completo); usuários paginados (total 3, KPIs do servidor, export completo, sem senha em claro); importação de 2 linhas; base restaurada (3).
- [x] 7.3 Etapa 5 registrada no `docs/RL02`; `.env.example` ganhou `DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT`.
