# Proposal

## Why

A auditoria RL02 (Etapa 5) apontou gargalos de escala ainda abertos: `GET /api/auditoria` e `GET /api/usuarios` devolvem o conjunto **inteiro** sem `LIMIT` (full scan + payload que cresce linearmente — ~46 MB projetados a 200k registros de auditoria), a importação de usuários faz N+1 (um `SELECT` de perfil por linha + um `INSERT` por linha), o pool comporta poucas requisições concorrentes e há desperdícios pontuais (`/api/configuracoes` duplicado, projeção larga em `/api/usuarios`, conexão de transação sem `finally`, I/O síncrono no upload). Corrigir isso é pré-requisito para o sistema crescer sem degradar.

## What Changes

- **Paginação server-side (M-14):** `GET /api/auditoria` e `GET /api/usuarios` passam a aceitar `page`/`perPage` e filtros/ordenação no servidor, devolvendo a **página** + `total` + KPIs calculados no servidor; a exportação busca o conjunto filtrado completo pela API. O `UiDataTable` ganha **modo servidor** (renderiza a página, usa `total` e emite eventos de página/tamanho/busca/ordenação).
- **Busca com debounce (M-18):** a busca da tabela passa a ser debounced (sem recomputar/emitir a cada tecla). Sem virtualização (a página menor já reduz o custo).
- **Importação sem N+1 (M-17):** carregar os perfis de uma vez (`Map` por nome) e gravar com **multi-row insert** em transação.
- **Pool e atomicidade (M-19, PERF-10):** `connectionLimit` configurável por env e liberação da conexão garantida em `finally` (commit/rollback); upload com I/O assíncrono (`fs/promises`).
- **Desperdícios (PERF-08/09):** `/api/configuracoes` sem chamada duplicada (dedup/cache no cliente) e projeção enxuta na listagem de usuários (sem colunas não usadas, incluindo a senha SMTP).
- **BREAKING:** as listagens deixam de devolver o conjunto inteiro (agora paginado) — contratos de `GET /api/auditoria` e `GET /api/usuarios` mudam.

## Capabilities

### New Capabilities
- `design-system/data-table`: modo servidor do `UiDataTable` — a tabela renderiza a página recebida, deriva o total de páginas de um `total` externo e emite eventos (página, tamanho, busca debounced, ordenação) em vez de processar tudo no cliente.

### Modified Capabilities
- `auditoria`: filtros, paginação, KPIs e exportação passam a operar no servidor (a API pagina e calcula KPIs; a exportação busca o conjunto filtrado completo).
- `gestao-usuarios`: filtros, busca, paginação, KPIs e exportações passam a operar no servidor sobre o conjunto filtrado.

## Impact

- **Backend:** `server/api/auditoria/index.get.ts`, `server/api/usuarios/index.get.ts`, `server/utils/audit.ts` (`listarAuditoria` com `LIMIT`/`total`/KPIs), `server/utils/usuarios.ts` (`listarUsuarios` paginado + projeção enxuta + importação em lote), `server/utils/db.ts` (pool configurável + `finally`), `server/utils/uploads.ts` (I/O assíncrono).
- **Frontend:** `app/components/ui/DataTable.vue` (modo servidor + debounce), `app/pages/admin/auditoria.vue` + `app/components/auditoria/*`, `app/pages/admin/gestao-usuarios.vue` + `app/components/usuarios/*`, `app/composables/useConfiguracoesGlobais.ts`.
- **Config:** `DB_POOL_LIMIT` (opcional) documentado em `.env.example`.
- **Contratos HTTP:** `GET /api/auditoria` e `GET /api/usuarios` passam a devolver `{ itens, total, kpis, pagina, porPagina, opcoes }` (paginado).
- **Dependências:** nenhuma nova.
- **Invariantes:** RBAC e auditoria preservados; nenhuma mudança no conteúdo, só na forma de entrega/consulta.
