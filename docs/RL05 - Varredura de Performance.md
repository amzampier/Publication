# RL05 — Varredura de Performance (verificação final antes de novos módulos)

| Campo | Valor |
| :--- | :--- |
| **ID** | RL05-PERF |
| **Tipo** | Auditoria de performance, escala e eficiência (pós-RL04 Etapa 4) |
| **Base normativa** | `docs/qa/00`, `docs/qa/06`, `docs/02` (pool/migrations), `openspec/specs/**` |
| **Data** | 17/10/2026 |
| **Escopo** | Frontend (bundle/SSR/fanout/exportação) + Backend/DB (consultas, `EXPLAIN`, índices, paginação, transações, pool, cache, auditoria/expurgo) + carga/concorrência |
| **Método** | Análise estática + `EXPLAIN`/`SHOW INDEX`/`SHOW GLOBAL STATUS`/`information_schema` read-only no MariaDB 11.8 + medição HTTP no dev server (`localhost:3000`) com access JWT válido forjado (HS256, sem escrita) |
| **Alterações de código/dados** | **Nenhuma** (somente-leitura; nenhum POST/PUT/DELETE; o token de medição foi assinado fora do banco) |
| **Veredito** | **APROVADO COM RESSALVAS** — 0 Crítica, 0 Alta; 4 Médias + 2 Baixas + 1 Melhoria |
| **Risco** | **Médio** |

> As tabelas de conteúdo público existem no schema (`release_week`, `projetos_escopo`, `manuais_mensal`, `entregas_itens`) mas **não têm UI/API** — o filtro de visibilidade da Área Pública é **escopo não aplicável** (§8). Fronteira Área Pública × Administrativa e RBAC foram verificados no eixo de custo (§5).

---

## 1. Resumo executivo

- **Status: APROVADO COM RESSALVAS.** A Etapa 4 do RL04 **se sustenta** no que foi corrigido: os índices escolhidos são usados no caminho padrão (listagem de auditoria `Using index`/`Using index for group-by`, **sem filesort**), `registrarAuditoria` e a recuperação de senha rodam **fora do caminho da resposta** (`event.waitUntil`), `jspdf`/`exceljs` seguem **100 % em `import()` dinâmico** e não há **N+1** (a importação grava em multi-row por chunks; a matriz RBAC é lida 1× por request).
- **Núcleo de escala com ressalvas estruturais:** as listagens são paginadas no servidor (LIMIT/OFFSET, `porPagina` clamp 200) e as opções de filtro são cacheadas (TTL 30 s), mas **a busca textual permanece inindexável** (M12), **a exportação continua sem streaming** (M13), **o pool satura sob concorrência** (M14 — reproduzido com HTTP 500 `Queue limit reached.`) e **o endpoint de e-mails não tem limite** (B24).
- **Fronteira Pública × Admin íntegra em custo:** anônimo responde `401` **sem tocar o banco** (0 statements); RBAC resolve a matriz em **1 query memoizada por request**; a única porta pública (`/api/configuracoes/identidade`) faz **2 queries** para devolver 1 campo (over-fetch menor, §7).
- As ressalvas de correção (cache de opções sem invalidação, convite a conta Inativa, lockout de perfil) são **funcionais** e pertencem ao `RL05-FUN`; aqui só o que cruza custo.

### 1.1 Placar

| Severidade | Qtd | IDs |
| :--- | ---: | :--- |
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 4 | RL05-PERF-01 … RL05-PERF-04 |
| Baixa | 2 | RL05-PERF-05, RL05-PERF-06 |
| Melhoria | 1 | RL05-PERF-07 |

Mapa com o RL04: **M12/B12 → PERF-01**; **M13 → PERF-02**; **M14 → PERF-03**; **B24 → PERF-04**; **B25 (parcial) → PERF-05**; **M16 → PERF-06**; **cache de opções (FUN-01) → PERF-07**.

---

## 2. Cobertura executada

| Eixo | Situação |
| :--- | :--- |
| Bundle / lazy-load | Executado — 100 % dos imports de `jspdf`/`jspdf-autotable`/`exceljs` são `await import()` (0 imports estáticos); build de produção incompleto no ambiente (§9) |
| SSR / payload de páginas | Executado — HTML e TTFB de `/`, `/admin/login`, `/admin/esqueci-senha`, `/admin/gestao-usuarios`, `/design` |
| Consultas e `EXPLAIN` | Executado — 20 planos (listagens, agregados, opções, filtros, segurança, e-mails, sessão) |
| Índices | Executado — `SHOW INDEX` nas tabelas quentes; 12/12 migrations aplicadas |
| Paginação / over-fetching | Executado — LIMIT/OFFSET e clamp 200; teto de exportação 10.000 |
| N+1 | Executado — nenhum loop com query por registro; importação em chunks de 200 |
| Cache de opções (30 s) | Executado — leitura de `server/utils/cache.ts` e medição warm/cold |
| Pool (`connectionLimit`/`queueLimit`) | Executado — 10/50 (defaults) + teste de concorrência até 100 |
| Concorrência | Executado — 20/25/30/40/50/60/70/100 simultâneas |
| Transações (`getTransaction`) | Executado — leitura estática (sem HTTP/PDF dentro de transação) |
| Auditoria (`waitUntil`) | Executado — `registrarAuditoria` e `esqueci-senha` desacoplados |
| Rate limit | Executado — janela 60 s por IP, cache de limite 60 s (não exercido por volume) |
| Expurgo / migrations | Executado — 4 eventos `ENABLED`; `LAST_EXECUTED = null` |
| Fronteira Pública × Admin / RBAC (custo) | Executado — 401 anônimo sem banco; 1 query por request autenticado no middleware |
| Filtro de visibilidade da Área Pública | **Não aplicável** (§8) |

---

## 3. Medições

### 3.1 Banco (read-only)

| Tabela | Linhas | Observação |
| :--- | ---: | :--- |
| `usuarios` | 3 | 3 Administrador, todos Ativos |
| `perfis_acesso` / `permissoes_perfil` | 4 / 44 | matriz 99/45/21/6 |
| `auditoria` | 328 (331 em `TABLE_ROWS`) | `detalhes` médio 53,6 B; máx. 150 B |
| `seguranca_eventos_login` | 96 | — |
| `sessoes` | 198–202 | — |
| `token_blacklist` | 0 | sem uso |

- `_migrations` = **12/12**; `event_scheduler = ON`; eventos `ev_expurgo_*` = 4 `ENABLED`, `LAST_EXECUTED = null`.
- `Threads_connected = 15`; `Max_used_connections = 18`; `Connections = 344` (dev; ver §7 — HMR).

### 3.2 `EXPLAIN` (trechos não triviais)

| Consulta | `type` | `key` | `Extra` |
| :--- | :--- | :--- | :--- |
| Usuários — listagem base | `ALL` (u) | `NULL` | `Using filesort` |
| Usuários — busca `LIKE '%a%'` | `ALL` (u) | `NULL` | `Using where; Using filesort` |
| Usuários — opções nomes `DISTINCT` | `range` | `idx_usuarios_nome` | `Using index for group-by` |
| Usuários — filtro `situacao` | `index` | `idx_usuarios_nome` | `Using where` |
| Auditoria — listagem | `index` | `idx_audit_data_hora_id` | — (sem filesort) |
| Auditoria — `COUNT/MAX` | `index` | `idx_audit_data_hora` | `Using index` |
| Auditoria — `COUNT(DISTINCT usuario_nome)` | `range` | `idx_audit_usuario` | `Using index for group-by` |
| Auditoria — opções `DISTINCT` | `range` | `idx_audit_usuario` / `idx_audit_entidade` | `Using index for group-by` |
| Auditoria — filtro `acao` | `ref` | `idx_audit_acao` | `Using index condition; Using where; Using filesort` |
| Auditoria — busca `LIKE` | `index` | `idx_audit_data_hora_id` | `Using where` |
| Auditoria — exportação (LIMIT 10000) | `index` | `idx_audit_data_hora_id` | `Using index` |
| Segurança — contas (OR `tentativas_falhas`/`bloqueado_ate`) | `ALL` | `NULL` | `Using where; Using filesort` |
| Segurança — só `bloqueado_ate` | `range` | `idx_usuarios_bloqueado_ate` | `Using index` |
| Segurança — eventos | `index` | `idx_seguranca_ocorrido_id` | — |
| E-mails da base | `index` | `uk_usuarios_email` | `Using index` |

> **Ressalva de volume:** `usuarios` tem 3 linhas — o otimizador prefere `ALL`; os `filesort` de Usuários/Auditoria filtrada tendem a se manter com volume, mas o teste decisivo é de carga futura (não executável nesta rodada).

### 3.3 HTTP no dev server (mediana de 7; payload real)

| Endpoint | status | mediana | payload |
| :--- | :--- | ---: | ---: |
| `GET /api/auth/seguro` | 200 | 14,0 ms | 0,2 KB |
| `GET /api/configuracoes/shell` | 200 | 17,5 ms | 0,3 KB |
| `GET /api/configuracoes` | 200 | 19,1 ms | 0,6 KB |
| `GET /api/configuracoes/identidade` (público) | 200 | 14,9 ms | 0,1 KB |
| `GET /api/usuarios?pagina=1&porPagina=20` | 200 | 19,8 ms | 2,8 KB |
| `GET /api/usuarios?...&busca=a` | 200 | 19,9 ms | 2,8 KB |
| `GET /api/usuarios/emails` | 200 | 19,1 ms | 0,1 KB |
| `GET /api/usuarios?exportar=1` | 200 | 20,3 ms | 2,8 KB |
| `GET /api/usuarios/:id` | 200 | 27,5 ms | 0,8 KB |
| `GET /api/auditoria?pagina=1&porPagina=20` | 200 | 20,8 ms | **9,7 KB** |
| `GET /api/auditoria?...&acao=Inclusão` | 200 | 21,2 ms | 9,9 KB |
| `GET /api/auditoria?exportar=1` | 200 | **36,8 ms** | **142,7 KB** |
| `GET /api/perfis` | 200 | 21,8 ms | 5,9 KB |
| `GET /api/seguranca/estado` | 200 | 20,4 ms | 10,7 KB |
| `GET /api/usuarios/eu/permissoes` | 200 | 16,5 ms | 2,0 KB |

**Nº de queries por request** (delta de `Questions`, descontando o `SHOW` de medição):

| Endpoint | Statements reais | Composição |
| :--- | ---: | :--- |
| `GET /` (sem banco) | **0** | página sem API |
| Anônimo `GET /api/usuarios` (401) | **0** | `getSessionUser` sem cookie → 401 antes do banco |
| `GET /api/usuarios/eu/permissoes` | 2 | sessão resolvida pelo middleware + leitura da matriz |
| `GET /api/configuracoes/identidade` | 2 | `configuracoes_globais` + `configuracoes_limite_requisicao` (para devolver 1 campo) |
| `GET /api/configuracoes/shell` | 3 | middleware (1) + 2 (config) |
| `GET /api/usuarios` (warm) | **4** | middleware (1) + `requirePermission` (1) + página (1) + agregado (1); opções em cache |
| `GET /api/auditoria` (warm) | **5** | middleware (1) + `requirePermission` (1) + página (1) + agregados (2); opções em cache |
| `GET /api/perfis` | 5 | middleware (1) + perm (1) + `listarPerfis` (3) |
| `GET /api/seguranca/estado` | 6 | middleware (1) + perm (1) + 4 varreduras |

> Cache de opções frio acrescenta **+2 queries** (Usuários) e **+2** (Auditoria) na primeira chamada após 30 s.

### 3.4 Concorrência (pool `connectionLimit: 10`, `queueLimit: 50`)

| Carga simultânea | `/api/auditoria` | `/api/usuarios` |
| :--- | :--- | :--- |
| 20 | 20×200 (p50 ≈ 247 ms) | 20×200 (p50 ≈ 172 ms) |
| 25–30 | 30×200 | 30–40×200 |
| **40** | **32×200 + 8×500** | 40×200 |
| **50** | **29×200 + 21×500** | **39×200 + 11×500** |
| **60** | **22×200 + 38×500** | **36×200 + 24×500** |
| 70 / 100 | 43×200 + 30×500 (mistura) | 27×200 + 25×500 (mistura) |

Erro capturado no corpo (500): `"message": "Queue limit reached."` — `at query (…/.nuxt/dev/index.mjs) at listarAuditoria`. O isolado é ~20 ms; sob 20 simultâneas a latência sobe a ~250–350 ms.

### 3.5 SSR / payload

| Rota | status | TTFB | HTML |
| :--- | :--- | ---: | ---: |
| `/` (Área Pública) | 200 | 43 ms | 2,6 KB |
| `/admin/login` | 200 | 63 ms | 9,0 KB |
| `/admin/esqueci-senha` | 200 | 51 ms | 6,7 KB |
| `/admin/gestao-usuarios` | 200 | 87 ms | 9,0 KB |
| `/design` (vitrine) | 200 | 256 ms | 323,7 KB |

---

## 4. Achados

### 4.1 Médias

#### RL05-PERF-01 · Busca textual `LIKE '%termo%'` inindexável (full scan)
- **Severidade:** Média · **Origem:** RL04-M-12 / RL04-B-12
- **Módulo:** Gestão de Usuários / Auditoria
- **Cenário:** buscar por subtermo em Usuários (`?busca=a`) ou em Auditoria (`?busca=a`).
- **Resultado esperado:** busca sem varredura integral da tabela.
- **Resultado obtido:** Usuários → `EXPLAIN type=ALL` + `Using filesort`; Auditoria → `type=index` (varredura ordenada pelo índice) aplicando 4 `LIKE` como filtro. O curinga inicial impede uso de índice; o custo degrada não linearmente com o volume. (Medido 19,9–21,2 ms com 3/328 linhas.)
- **Passos:** `GET /api/usuarios?busca=a`; `GET /api/auditoria?busca=a`.
- **Evidências:** `server/utils/usuarios.ts:326-331`; `server/utils/audit.ts:214-219`; `EXPLAIN` (§3.2); `docs/qa/06` ("evitar queries não indexadas").
- **Impacto:** full scan por termo em cada pesquisa; o índice `idx_usuarios_nome`/`idx_audit_usuario` não cobre substring.
- **Correção sugerida:** índice `FULLTEXT` (ou prefixo `LIKE 'termo%'`) para as colunas pesquisadas; alternativamente, limitar a busca a prefixo e documentar. (Mudança de comportamento/contrato — fora do escopo comportamento-preservante do RL04.)

#### RL05-PERF-02 · Exportação sem paginação/streaming e montada na main thread
- **Severidade:** Média · **Origem:** RL04-M-13
- **Módulo:** Gestão de Usuários / Auditoria (exportações CSV/PDF)
- **Cenário:** acionar CSV/PDF com o conjunto filtrado completo.
- **Resultado esperado:** resposta leve/streaming e UI responsiva.
- **Resultado obtido:** o servidor devolve até 10.000 linhas em **um único JSON** (`TETO_EXPORTACAO = 10_000`) e o cliente monta CSV/PDF **na thread principal** (`gerarPdf*`/CSV após `buscarParaExportacao`). Medido: `/api/auditoria?exportar=1` = **142,7 KB para 328 linhas (~0,44 KB/linha → ~4,4 MB em 10k)**; com `detalhes` no teto de 8 KB, o pior caso projetado chega a ~80 MB. O limite de 10.000 é silencioso (RL05-FUN-11).
- **Passos:** Auditoria/Usuários → Relatórios → CSV/PDF.
- **Evidências:** `server/utils/audit.ts:91,228-235`; `server/utils/usuarios.ts:283,339-349`; `app/components/usuarios/Cabecalho.vue:42-96`; `app/components/auditoria/gerarPdfAuditoria.ts`; medição §3.3.
- **Impacto:** resposta pesada, risco de travamento do navegador e de truncamento silencioso em bases grandes.
- **Correção sugerida:** geração/streaming server-side (CSV por stream, PDF em worker/fila) e sinalizar quando o conjunto excede o teto.

#### RL05-PERF-03 · Saturação do pool sob concorrência → HTTP 500 `Queue limit reached.`
- **Severidade:** Média · **Origem:** RL04-M-14 / PERF-05
- **Módulo:** Infra DB (todas as listagens)
- **Cenário:** N usuários abrem listagens simultaneamente.
- **Resultado esperado:** degradação por fila, sem erro (o pool não deve esgotar).
- **Resultado obtido:** `GET /api/auditoria` (3 consultas paralelas + 1 de middleware + 1 de RBAC) começa a responder **500** em **N=40** (8 falhas), N=50 (21) e N=60 (38); `/api/usuarios` falha a partir de N=50 (11). Corpo: `"message": "Queue limit reached."` em `server/utils/db.ts` (`query()`), a partir de `listarAuditoria`. Latência p50 sob 20 simultâneas ≈ 247–343 ms (vs ~20 ms isolado).
- **Passos:** disparar 40–60 `GET /api/auditoria?pagina=1&porPagina=20` simultâneos com sessão.
- **Evidências:** §3.4; `server/utils/db.ts:24-25` (`connectionLimit 10`, `queueLimit 50`); `server/utils/audit.ts:244-254` (3 consultas em `Promise.all`); `server/utils/usuarios.ts:351-360` (2 em `Promise.all`); `server/middleware/auth-api.ts:24` e `server/utils/permission.ts:60-65` (1 query cada por request).
- **Impacto:** erro 500 a usuários legítimos sob pico; a fila não absorve a carga realista.
- **Correção sugerida:** reduzir conexões simultâneas por request (agregados combinados numa única consulta, p.ex. `SUM/CASE` + subconsulta), elevar `connectionLimit`/`queueLimit` por env (`DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT` já suportados) e tratar `Queue limit reached` com retry/503 amigável. (Mudança de comportamento — fora do escopo comportamento-preservante.)

#### RL05-PERF-04 · `GET /api/usuarios/emails` sem paginação/limite (listagem sem teto)
- **Severidade:** Média · **Origem:** RL04-B-24 / PERF-08
- **Módulo:** Gestão de Usuários (importação)
- **Cenário:** abrir a importação (pré-classificação "E-mail já cadastrado").
- **Resultado esperado (checklist `docs/qa/06`):** endpoints paginam (`?page=&perPage=`) — listagem sem limite é bug de performance.
- **Resultado obtido:** `SELECT email_corporativo FROM usuarios` **sem LIMIT** devolve a base inteira numa resposta (hoje 3 e-mails = 0,1 KB; cresce linearmente). Existe índice que cobre a coluna (`uk_usuarios_email` → `Using index`), mas não há teto/paginação.
- **Passos:** Usuários → Importar (`buscarEmailsBase`).
- **Evidências:** `server/api/usuarios/emails/index.get.ts`; `server/utils/usuarios.ts:397-403`; `app/components/usuarios/useUsuarios.ts:139-142`; §3.2/§3.3.
- **Impacto:** payload e tempo de resposta crescem sem limite; bloqueia a importação em bases grandes.
- **Correção sugerida:** paginar/limitar o endpoint ou trocar por verificação de duplicidade no commit (server-side), devolvendo só os conflitos.

### 4.2 Baixas

#### RL05-PERF-05 · Aba Segurança — varredura de contas com `type=ALL` + `Using filesort`
- **Severidade:** Baixa · **Origem:** RL04-B-25 (parcial)
- **Módulo:** Configurações Globais › Segurança
- **Cenário:** abrir a aba Segurança (`GET /api/seguranca/estado`).
- **Resultado esperado (RL04 Etapa 4):** varredura "por índice".
- **Resultado obtido:** a consulta com `WHERE tentativas_falhas > 0 OR (bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW(6)) ORDER BY bloqueado_ate DESC, email_corporativo ASC` usa **`type=ALL` + `Using filesort`**; apenas o ramo `bloqueado_ate` isolado usa `idx_usuarios_bloqueado_ate` (`range`, `Using index`). Não há índice em `tentativas_falhas`.
- **Passos:** Configurações Globais → Segurança.
- **Evidências:** `server/utils/seguranca.ts:144-149`; `EXPLAIN` (§3.2); `server/migration/12_indices_seguranca.sql`.
- **Impacto:** full scan + ordenação a cada abertura da aba; relevante com muitas contas com falhas. **Ressalva:** tabela com 3 linhas — o plano pode mudar com volume.
- **Correção sugerida:** índice em `tentativas_falhas` e/ou reescrever o OR (union de dois ramos indexados) para permitir o uso de `idx_usuarios_bloqueado_ate`.

#### RL05-PERF-06 · Eventos de expurgo `ENABLED` mas nunca executados (`LAST_EXECUTED = null`)
- **Severidade:** Baixa · **Origem:** RL04-M-16 / RL05-FUN-07
- **Módulo:** Migrations / Expurgo
- **Cenário:** avaliar acúmulo de `sessoes`/log.
- **Resultado esperado:** eventos diários executando (retenção).
- **Resultado obtido:** os 4 eventos (`ev_expurgo_sessoes`, `ev_expurgo_token_blacklist`, `ev_expurgo_seguranca_login`, `ev_expurgo_auditoria`) estão `ENABLED` com `LAST_EXECUTED = null`; o expurgo efetivo depende do **catch-up no boot** (`executarExpurgo`, best-effort). Retenção de auditoria em 550 dias não tem efeito prático nesta base.
- **Passos:** `information_schema.EVENTS`; boot.
- **Evidências:** `information_schema.EVENTS`; `server/migration/11_indices_e_expurgo.sql:16-43`; `server/utils/expurgo.ts:12-29`; `server/plugins/migration.ts`.
- **Impacto:** as tabelas de sessão/log podem crescer além do previsto até o primeiro ciclo; sem impacto imediato (base pequena).
- **Correção sugerida:** confirmar `LAST_EXECUTED` após o primeiro horário agendado (03:10–03:30) ou disparar o expurgo no boot de forma idempotente; documentar a janela.

### 4.3 Melhoria

#### RL05-PERF-07 · Cache de opções (30 s) sem invalidação — custo de correção
- **Severidade:** Melhoria · **Origem:** RL05-FUN-01 (cruzamento de custo)
- **Módulo:** Infra de cache / Usuários / Auditoria
- **Cenário:** criar/alterar perfil ou usuário e reconsultar as opções.
- **Resultado esperado:** cache que se invalida quando a fonte muda (sem sacrificar a correção).
- **Resultado obtido:** `cacheado('usuarios-opcoes'|'auditoria-opcoes', 30_000, …)` é uma mitigação de performance (evita os `DISTINCT` a cada listagem, confirmado por `Using index for group-by`), porém **sem gancho de invalidação** — a defasagem de até 30 s é a contrapartida (regressão funcional FUN-01).
- **Evidências:** `server/utils/cache.ts:16-22`; `server/utils/usuarios.ts:362-371`; `server/utils/audit.ts:256-265`.
- **Impacto:** nenhum custo de performance novo; é uma oportunidade de corrigir a defasagem sem perder o ganho.
- **Correção sugerida:** exportar `invalidarCache(chave)` e chamá-lo nas escritas de usuários/perfis (e no `atualizarCachesAposSalvar`); opcionalmente, reutilizar a resposta de `GET /api/configuracoes/shell` na tela de Configurações para evitar o 2º GET (`/api/configuracoes`) do mesmo dado.

---

## 5. Verificações obrigatórias — Fronteira Pública × Admin e RBAC (custo)

| Verificação | Resultado | Evidência |
| :--- | :--- | :--- |
| Anônimo em `/api/**` administrativa | `401` **sem tocar o banco** (0 statements) | medição §3.3; `server/middleware/auth-api.ts` |
| Autenticado — custo de sessão por request | **1 query** (`sessaoAtivaNoServidor`), em todo request autenticado | `server/utils/auth.ts:332-349` |
| RBAC por módulo | **1 query** por request, memoizada em `event.context.__permissoes` | `server/utils/permission.ts:51-68` |
| Porta pública | `/api/configuracoes/identidade` **2 queries** para devolver `logo_login_url` (over-fetch menor) | `server/api/configuracoes/identidade/index.get.ts:10`; `server/utils/configuracoes.ts:86-105` |
| Preferências do shell | `/api/configuracoes/shell` é session-only (3 queries: 1 sessão + 2 config) e não devolve rate/retenção | `server/api/configuracoes/shell/index.get.ts` |
| Área Pública | `/` responde 200 sem API/DB (placeholder) | `app/pages/index.vue`; §3.5 |

> Nenhum caminho de custo observado sugere bypass de fronteira ou exposição: o middleware barra antes do banco e o RBAC é resolvido por query indexada (PK de `usuarios` + `uk_perfil_modulo`).

---

## 6. Confirmação do RL04 Etapa 4

| Item do RL04 Etapa 4 | Estado na RL05 | Evidência |
| :--- | :--- | :--- |
| Índices escolhidos / sem filesort | **SUSTENTADO** no caminho padrão | Listagem e agregados de auditoria usam índice (`Using index`/`group-by`), sem filesort; `DISTINCT` de opções por group-by |
| Agregado de auditoria separado por índice | **SUSTENTADO** | `COUNT/MAX` → `idx_audit_data_hora`; `COUNT(DISTINCT)` → `idx_audit_usuario` |
| Auditoria fora do caminho da resposta | **SUSTENTADO** | `registrarAuditoria` usa `event.waitUntil` (`audit.ts:161-167`); `esqueci-senha` idem |
| Listagem enxuta + `GET /api/usuarios/:id` | **SUSTENTADO** | `COLUNAS_LISTA_ENXUTA` (`usuarios.ts:134`); listagem 2,8 KB |
| Cache de opções (30 s) | **SUSTENTADO** (com ressalva FUN-01 → PERF-07) | `cache.ts`; warm = 4/5 queries |
| Timeout no envio de e-mail | **SUSTENTADO** | `mailer.ts:39` (`AbortSignal.timeout`, default 10 s) |
| `jspdf`/`exceljs` lazy | **SUSTENTADO** | 4/4 geradores usam `await import()`; 0 imports estáticos |
| `DB_TIMEZONE` explícito no pool | **SUSTENTADO** | `db.ts:29` (default `'local'`) |
| Expurgo catch-up no boot | **SUSTENTADO (com ressalva M-16)** | `expurgo.ts:12-29`; eventos `LAST_EXECUTED=null` |
| Menos paralelismo por listagem / pool | **PARCIAL** → RL05-PERF-03 | 2 conexões (Usuários) e 3 (Auditoria) em paralelo; 500 a partir de ~40 |

---

## 7. Observações e sugestões (não pontuadas)

1. **Custo fixo por request autenticado:** o middleware faz 1 query (`sessaoAtivaNoServidor`) em **toda** requisição. É necessário para a revogação, mas poderia usar cache curto por `(id, token_version)` (invalidação na revogação) para reduzir o piso de consultas.
2. **`/api/configuracoes/identidade` público faz 2 queries** (lê a linha inteira + a linha de rate) para devolver 1 campo; um `SELECT logo_login_url` direto reduziria para 1.
3. **Filtros de auditoria por ação/usuário geram `Using filesort`** (`ORDER BY data_hora DESC, id DESC` com `WHERE acao`/`usuario_nome`): índices compostos `(acao, data_hora, id)` / `(usuario_nome, data_hora, id)` eliminariam a ordenação se o volume crescer.
4. **Convite aguarda o Resend no caminho da resposta** (até o timeout de 10 s) — diferente da recuperação (`waitUntil`); aceitável pelo feedback de 502, mas é o maior piso de latência de uma escrita.
5. **Ambiente dev:** `Threads_connected = 15` e `Max_used_connections = 18` (> `connectionLimit: 10`) sugerem pools acumulados pelo HMR do Nitro; observar em produção (o módulo carrega uma vez).
6. **Vitrine `/design`:** 323,7 KB de HTML no dev (página de demonstração, fora do fluxo de negócio).

---

## 8. Escopos não aplicáveis

1. **Filtro de visibilidade pública (`status`/`ativo`) em queries da Área Pública** — **N/A**: a Área Pública é o placeholder `app/pages/index.vue`, sem rota de API nem consulta; as tabelas de conteúdo (`release_week`, `projetos_escopo`, `manuais_mensal`, `entregas_itens`) existem no schema, mas sem UI/API. Nada a medir até o módulo existir.
2. **Exportação server-side/streaming** — roadmap (RL04-M-13 reclassificado como Média, §4.1).
3. **Busca FULLTEXT** — roadmap (RL04-M-12 reclassificado como Média, §4.1).
4. **Zod/safeError** (`server/utils/validation.ts`/`safeError.ts`) — roadmap declarado.

---

## 9. Limitações

- **Build de produção incompleto no ambiente:** `.output/` contém apenas `server/chunks` + `server/node_modules` — **não há `.output/server/index.mjs` nem `.output/public`** (o RL05-FUN registrou `EPERM` no unlink por o dev server estar no ar). A verificação de bundle apoiou-se na análise estática (imports dinâmicos) e no dev server; `npm run build` **não** foi reexecutado para não derrubar o dev.
- **Base pequena:** 3 usuários / 328 auditorias / 96 eventos — os planos `ALL` de Usuários e Segurança são sensíveis ao volume; as medições de tempo não representam base de produção.
- **Medição autenticada sem escrita:** o access token de medição foi assinado localmente (HS256) e **não** gravou sessão/último acesso/auditoria; as latências incluem o custo real do middleware/RBAC sobre endpoints `GET`.
- **Concorrência medida em dev (Nitro dev):** o patamar absoluto de falha pode variar em produção; o **mecanismo** (`Queue limit reached` por fanout de conexões) independe do modo.

---

## 10. Encerramento

A Etapa 4 do RL04 **se sustenta** onde foi implementada (índices no caminho padrão sem filesort, auditoria fora da resposta, agregados indexados, lazy-load de PDF/planilha, listagem enxuta, sem N+1) e a fronteira de custo Pública × Administrativa/RBAC está correta. Permanecem **4 Médias** (busca inindexável; exportação sem streaming; saturação do pool com 500 sob concorrência; endpoint de e-mails sem limite), **2 Baixas** (varredura `ALL` da aba Segurança; expurgo sem execução confirmada) e **1 Melhoria** (invalidação do cache de opções). Nenhuma Crítica/Alta.

**Veredito: APROVADO COM RESSALVAS (risco Médio).** Nenhum arquivo de código foi alterado e nenhum dado foi gravado por esta auditoria.