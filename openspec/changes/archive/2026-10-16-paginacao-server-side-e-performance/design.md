# Design

## Context

Ver `proposal.md` — Why. Base de código: `server/utils/audit.ts` (`listarAuditoria` sem `LIMIT`, retorna `{ registros, opcoes }`); `server/utils/usuarios.ts` (`listarUsuarios` com `ORDER BY`, `COLUNAS_LISTA` larga; `importarUsuarios` com `resolverPerfilId` por linha + `INSERT` por linha em transação); `server/utils/db.ts` (pool `connectionLimit: 10`, `getTransaction` sem `finally`); `server/utils/uploads.ts` (`existsSync`/`writeFileSync` síncronos); `app/components/ui/DataTable.vue` (filtro/ordenação/agrupamento/paginação 100% no cliente sobre `props.data`); `app/composables/useConfiguracoesGlobais.ts` (GET chamado no layout e na página).

## Goals / Non-Goals

**Goals:** paginar/filtrar/KPIs no servidor; modo servidor no `UiDataTable` + debounce; importação sem N+1; pool/release/IO assíncrono; dedup de `/api/configuracoes`; projeção enxuta.

**Non-Goals:** virtualização de linhas (descartada — a página menor torna desnecessária); trocar a stack de tabela; alterar conteúdo/regras de negócio (só a forma de consulta/entrega).

## Decisions

### D1 — Modo servidor do `UiDataTable`
Novas props: `serverMode: boolean`, `total: number`, `page: number`, `perPage: number`, `searchDebounceMs: number` (default ~300). Com `serverMode`: a tabela **não** filtra/ordena/pagina/agrupa localmente — renderiza `props.data` como a página corrente e deriva "Página X de Y" de `total`/`perPage`. Emite `page-change`, `per-page-change`, `sort-change` e `search` (a busca passa por debounce interno). Sem `serverMode`, tudo permanece como hoje.
- **Por quê:** isola a mudança no kit e preserva as demais telas (perfis, que continuam client-side).

### D2 — Contratos das listagens (BREAKING)
`GET /api/auditoria` e `GET /api/usuarios` aceitam `pagina`/`porPagina` + filtros e devolvem `{ itens, total, kpis, opcoes?, pagina, porPagina }`. `auditoria` usa `registros` (nome existente) como `itens`; `usuarios` usa `usuarios`. Um modo exportação (`?exportar=1`) devolve o conjunto filtrado **completo**, limitado por um teto de segurança (ex.: 10.000 linhas), para CSV/PDF.
- **Por quê:** a exportação precisa do conjunto filtrado inteiro, mas a listagem precisa ser paginada.
- **Alternativa descartada:** paginar no cliente com `LIMIT` de segurança — não resolve payload/scan.

### D3 — KPIs no servidor
`auditoria`: `kpis = { registros, usuariosDistintos, ultimaAtividade }` (rótulo de período no cliente). `usuarios`: `kpis = { total, ativos, inativos, perfisDistintos }`. Calculados com SQL agregado sobre o conjunto filtrado (uma query de agregação + uma de página + opções).
- **Por quê:** KPIs precisam refletir o banco, não a página.

### D4 — Importação sem N+1 (M-17)
Carregar `SELECT id, nome_perfil, situacao FROM perfis_acesso` uma vez em um `Map`; validar as linhas com o mapa; gravar com **multi-row `INSERT`** (chunks, ex.: 500) numa transação. Resolver o perfil por nome no mapa (não por query).
- **Por quê:** elimina até 1.000 round-trips por importação.

### D5 — Pool e conexões (M-19, PERF-10)
`connectionLimit`/`queueLimit` configuráveis por env (`DB_POOL_LIMIT`, `DB_POOL_QUEUE_LIMIT`), com defaults atuais. `getTransaction` libera a conexão em `finally` (commit/rollback sempre chamam `release`). Upload com `fs/promises` (`stat`, `writeFile`) em vez de síncronos.

### D6 — Dedup de `/api/configuracoes` (PERF-08)
`useConfiguracoesGlobais` passa a guardar o carregamento com `useState` (idempotente) e/ou `useAsyncData`, evitando o GET duplicado (layout + página).

### D7 — Projeção enxuta de usuários (PERF-09)
`COLUNAS_LISTA` deixa de trazer colunas não usadas na listagem (inclusive `senha_smtp`); o detalhe/SMTP continua atendido por `/api/usuarios/eu` e pela edição.

### D8 — Debounce da busca (M-18)
A busca do `UiDataTable` no modo servidor é debounced (`searchDebounceMs`); no modo cliente permanece imediata.

## Risks / Trade-offs

- **Mudança de contrato (BREAKING):** consumidores que esperavam o array cru → mitigação: atualizar os composables/páginas das duas telas no mesmo change.
- **Modo servidor altera o kit:** risco de regressão nas telas client-side → mitigação: o modo server é opt-in; `npm run build` + conferência em `/design` e nas telas.
- **Exportação com teto:** bases muito grandes podem truncar → aviso ao usuário quando o teto for atingido.
- **Índices:** paginação por data/hora já tem `idx_audit_data_hora`; a filtragem por `acao` usa `idx_audit_acao` (Etapa 2). Ordenação de usuários por `nome_completo` sem índice — aceitável na volumetria atual (PERF-11, baixo).

## Migration Plan

- **Schema:** nenhuma migration.
- **Deploy:** subir backend + frontend juntos (contratos mudam).
- **Rollback:** reverter o commit.
- **Verificação:** `npm run build` + E2E (paginação server-side em auditoria/usuários; KPIs do servidor; exportação do conjunto completo; importação em lote; dedup de configurações).

## Open Questions

Nenhuma pendente — as três decisões de escopo foram resolvidas com o usuário.
