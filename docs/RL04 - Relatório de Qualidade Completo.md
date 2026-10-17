# RL04 — Relatório de Qualidade Completo

| Campo | Valor |
| :--- | :--- |
| **ID** | RL04 |
| **Tipo** | Auditoria completa de qualidade (7 especialidades + execução E2E real) |
| **Base normativa** | `docs/qa/00-arquitetura-e-regras-gerais.md`, `docs/qa/01..07`, `openspec/specs/**` (fonte da verdade), `docs/01 - design_system.md`, `docs/02 - Guia de Arquitetura e Migrations.md` |
| **Data** | 17/10/2026 |
| **Escopo auditado** | Todo o sistema implementado — Área Pública raiz + Área Administrativa (Shell, Login/Recuperação, Primeiro Acesso, Gestão de Usuários, Perfis/RBAC, Auditoria, Configurações Globais, Segurança, Meu Perfil, Uploads, Convite, Migrations, 404) + Design System/Vitrine `/design` |
| **Capabilities** | 30 entradas em `openspec list --specs` (15 funcionais + 15 sub-specs de `design-system`); nenhuma change ativa |
| **Método** | Análise estática + consultas read-only no MariaDB 11.8 + `EXPLAIN`/bundle/SSR + execução E2E no dev server (`localhost:3000`) |
| **Alterações de código** | **Nenhuma** — auditoria somente-leitura; dados/arquivos de teste do E2E removidos e ambiente restaurado |
| **Veredito desta auditoria** | **REPROVADO** (1 Crítico + 2 Altos + 22 Médios + Baixos) |
| **Risco** | **Alto** |

> **Objetivo deste documento:** servir de plano de correção para que o sistema desenvolvido até aqui seja **aprovado sem ressalvas**. Concluídas as Etapas 1 a 5 (seção 8), a reauditoria tende a **APROVADO**.

> **Nota de IDs:** os identificadores consolidados são prefixados `RL04-*` (C = Crítico, A = Alto, M = Médio, B = Baixo, DOC = Documentação, OBS = estrutural/ambiente). A rastreabilidade para os IDs de origem de cada especialista está na seção 9.

---

## 1. Resumo executivo

- **Status: REPROVADO.** O núcleo funcional está maduro e bem arquitetado — **fronteira Área Pública × Área Administrativa íntegra**, **RBAC 100% coerente** com o catálogo, **SQL Injection inexistente**, **banco consistente** (11/11 migrations, 0 órfãos, 0 duplicidades, matriz 99/45/21/6), **revogação de sessão corrigida** nas rotas `/api/auth/*` (RL03-C-01/A-01 confirmados em runtime) e **importação corrigida** (RL03-A-02). O design system, o kit de componentes, os toasts, o loading e a distinção de áreas estão aderentes às specs.
- **Porém**, a varredura encontrou **1 Crítico + 2 Altos novos** que **reprovam** o sistema pela matriz do `docs/qa/00`:
  1. **RL04-C-01 (Crítico)** — **XSS armazenado via upload**: arquivo com nome terminando em `.html` e corpo iniciado por magic bytes PNG passa na validação, é gravado e servido como `text/html` na **mesma origem**. Qualquer perfil autenticado (inclusive Leitor, pois `avatares` só exige sessão) pode plantar o payload; um administrador que abrir a URL tem a sessão comprometida (**elevação Leitor → Admin**).
  2. **RL04-A-01 (Alto)** — **TTL do refresh errado**: `auth.ts:151,172` soma `7*24*3600` **ms** a `Date.now()` → `sessoes.expira_em = criado_em + 604 s (~10 min)`, enquanto o cookie anuncia 7 dias. Sem refresh proativo, a **sessão morre em ~15 min** (viola "sessão expirada é renovada automaticamente" da spec `login`).
  3. **RL04-A-02 (Alto)** — **estado não limpo no logout**: `useState` de módulos sobrevive ao logout; ao logar outro perfil na mesma aba, Gestão de Perfis/Usuários exibem dados da sessão anterior **sem chamar a API** (exposição da matriz de permissões e de nomes/contagens a perfil sem permissão).
- **Risco: Alto** — falha de segurança (XSS same-origin) + regressão de autenticação (sessão caindo a cada ~15 min) + vazamento de estado entre sessões no cliente.
- **O que está correto (confirmado nesta rodada):** fronteira de áreas, RBAC por módulo (Leitor → `403` em 100% das rotas), SQLi inexistente, banco íntegro, correções do RL03 sustentadas em runtime, design system/UX/performance sem críticos nem altos.

### 1.1 Veredito por especialidade

| Especialidade | Veredito | Destaque |
| :--- | :--- | :--- |
| qa-documentacao | Aprovado com ressalvas | 8 correções do RL03 confirmadas; 10 médios + 7 baixos de documentação obsoleta |
| qa-funcional | REPROVADO | 2 Altos (TTL do refresh; estado no logout) + 8 Médios + 13 Baixos |
| qa-seguranca | REPROVADO | XSS armazenado por upload (Alto) + confirmação do TTL; fronteira/RBAC/SQLi íntegros |
| qa-banco | REPROVADO | 1 Alto (TTL do refresh — 158/158 sessões com 604 s) + expurgo sem execução confirmada |
| qa-ux | Aprovado com ressalvas | 0 críticos/altos; 5 médios (a11y/feedback) + 8 baixos |
| qa-performance | Aprovado com ressalvas | 0 críticos/altos; 6 médios estruturais de escala |
| qa-execucao | REPROVADO | Reproduziu XSS, TTL e revogação por reativação; fronteira/RBAC/SQLi OK |

### 1.2 Placar consolidado

| Severidade | Qtd | IDs consolidados |
| :--- | ---: | :--- |
| Crítica | 1 | RL04-C-01 |
| Alta | 2 | RL04-A-01, RL04-A-02 |
| Média | 22 | RL04-M-01 … RL04-M-22 |
| Baixa / Melhoria | 30 | RL04-B-01 … RL04-B-30 |
| Documentação | 10 (M) + 7 (B) | RL04-DOC-01 … RL04-DOC-17 |
| Estrutural / ambiente | 9 | RL04-OBS-01 … RL04-OBS-09 |

---

## 2. Cobertura executada

| Eixo | Situação |
| :--- | :--- |
| Funcional | Executado — casos BDD derivados das 15 capabilities; 375 cenários catalogados |
| Regressão | Executado — usuário×sessão, perfis×usuários, upload×identidade, matriz×login, config×shell |
| Permissões (RBAC) | Executado — 28 rotas; Leitor → `403` em 100%; sem bypass de Administrador |
| Banco | Executado estático + runtime (MariaDB 11.8); 11/11 migrations; 0 órfãos; 0 duplicidades |
| UX | Executado estático (5 médios + 8 baixos); medição em navegador não executada (RL01 cobre) |
| Segurança | SQLi inexistente; fronteira íntegra; revogação `/api/auth/*` íntegra; **XSS por upload FALHA** |
| Performance | Executado com medições (`EXPLAIN` + bundle + SSR); gargalos estruturais de escala |
| Fronteira Área Pública × Administrativa | Anônimo OK (`/admin/**` → `302` login; `/api/**` → `401`; pública só `logo_login_url`) |
| Execução E2E | Executado — dev server real + MariaDB up; login `ana.carolina@empresa.com.br` |
| Escopos não aplicáveis | Declarados na seção 5 |

---

## 3. Achados

### 3.1 Críticos

#### RL04-C-01 · XSS armazenado por upload de arquivo `.html` servido como `text/html`
- **Severidade:** Crítica
- **Módulo:** uploads / segurança / fronteira de origem
- **Cenário:** usuário autenticado (qualquer perfil, inclusive **Leitor**) envia multipart `pasta=avatares` com arquivo cujo **nome termina em `.html`** e corpo iniciando por magic bytes PNG (`89 50 4E 47 0D 0A 1A 0A`) seguido de `<script>`.
- **Resultado esperado (spec `uploads`):** só imagens reais aceitas e servidas como imagem; arquivo não renderizável não deve ser executável na origem da aplicação.
- **Resultado obtido:** `POST /api/uploads` → `200 {"url":"/uploads/avatares/probe.html"}`; `GET` → `200 Content-Type: text/html; charset=utf-8` (o `nosniff` faz o navegador **respeitar** o HTML e executar o script).
- **Passos para reprodução:**
  1. Autenticar com qualquer perfil e capturar o cookie de sessão.
  2. `printf '\x89PNG\r\n\x1a\n<html><body><script>alert(document.domain)</script></body></html>' > p.html`
  3. `curl -X POST http://localhost:3000/api/uploads -b "auth-token=<cookie>" -F pasta=avatares -F "file=@p.html;type=image/png"` → `200 {"url":"/uploads/avatares/p.html"}`
  4. `curl -i http://localhost:3000/uploads/avatares/p.html` → `Content-Type: text/html; charset=utf-8`
- **Evidências:**
  - `server/api/uploads/index.post.ts:40-58` — valida o MIME declarado e os magic bytes, mas **nunca confronta a extensão/nome** com o tipo real.
  - `server/utils/uploads.ts:43-51` — `sanitizarNomeArquivo` preserva `.html` (o alfabeto `[a-zA-Z0-9._-]` permite).
  - `server/utils/uploads.ts:54-74` — `gravarUpload` grava usando a extensão do nome.
  - `nuxt.config.ts:44-54` — `/uploads/**` servido como asset público (`publicAssets`) com apenas `nosniff`.
  - Runtime (qa-execução): `GET → content-type: text/html; charset=utf-8`, `x-content-type-options: nosniff`.
- **Impacto:** XSS armazenado *same-origin* → session-riding (ações autenticadas em nome da vítima), leitura de dados administrativos e phishing; **elevação Leitor → Admin**. Reprova por si (falha de segurança).
- **Correção sugerida:** derivar a extensão do tipo real detectado (whitelist) ou negar `.html/.htm/.svg/.js/.xml` no nome final e/ou servir `/uploads/**` com `Content-Type` fixo de imagem + `Content-Disposition: attachment`/CSP `sandbox`.
- **IDs de origem:** qa-segurança RL04-SEG-01; qa-execução RL04-EXE-01.

### 3.2 Altos

#### RL04-A-01 · TTL do refresh gravado em ~10 min (unidade ms×s) — sessão cai em ~15 min
- **Severidade:** Alta
- **Módulo:** autenticação / sessões (`sessoes`)
- **Cenário:** login cria a sessão; `expira_em` deveria ser `agora + 7 dias`.
- **Resultado esperado (spec `login`):** refresh válido por 7 dias; sessão expirada é renovada automaticamente.
- **Resultado obtido:** `expira_em = criado_em + 604 s` (~10,08 min). Como `rotacionarSessao` exige `expira_em > agora`, o refresh falha a partir de ~10 min; o access dura 900 s e `useApiFetch` só renova no `401` → **logout forçado a cada ~15 min**.
- **Passos para reprodução:**
  1. Login; `SELECT criado_em, expira_em, TIMESTAMPDIFF(SECOND,criado_em,expira_em) FROM sessoes ORDER BY criado_em DESC LIMIT 5;` → `604` em 158/158.
  2. (Controle) simular vencimento da linha e `POST /api/auth/refresh` → `401` + limpeza de cookies.
- **Evidências:** `server/utils/auth.ts:151` e `:172` (`new Date(Date.now() + REFRESH_TTL_DIAS * 24 * 3600)`), com `REFRESH_TTL_DIAS = 7` (`:43`); cookie correto em `:74` (segundos); `app/composables/useApiFetch.ts:51-59` (renova só no `401`).
- **Impacto:** sessão efetiva de ~15 min (não 7 dias); perda de rascunhos e churn de login; além do crescimento de `sessoes`.
- **Correção sugerida:** `new Date(Date.now() + REFRESH_TTL_DIAS * 24 * 60 * 60 * 1000)` (ou `* 86_400_000`) + teste de unidade do TTL.
- **IDs de origem:** qa-banco RL04-BD-01; qa-funcional RL04-FUN-01; qa-segurança RL04-SEG-03; qa-execução RL04-EXE-02.

#### RL04-A-02 · Estado de módulos não é limpo no logout — exposição cross-sessão na mesma aba
- **Severidade:** Alta
- **Módulo:** cliente / RBAC de exibição (Perfis, Usuários, Permissões, Configurações)
- **Cenário:** Administrador usa a mesma aba, faz logout e um Leitor/Editor faz login sem recarregar o navegador; o novo usuário abre `/admin/perfis-acesso` (ou `/admin/gestao-usuarios`).
- **Resultado esperado:** todo estado derivado da sessão é descartado no logout; a página sem permissão não exibe dados administrativos (a API responderia `403`).
- **Resultado obtido:** `sair()` limpa só `auth-usuario`/`auth-verificada`; permanecem `useState('perfis-base')`, `perfis-carregado`, `permissoes-usuario` e `config-globais-cache`. `carregarPerfis()` retorna cedo quando `carregado === true`, então **não refaz a busca** → a tabela de perfis, a matriz e os KPIs do Administrador são renderizados para o Leitor **sem nenhuma chamada à API**. Em Usuários, a falha de carga (`403`) zera a tabela, mas mantém `kpis`, `opcoes` e `total` antigos.
- **Passos para reprodução:** 1) login Admin; 2) abrir Perfis/Usuários; 3) logout; 4) login Leitor na mesma aba; 5) abrir `/admin/perfis-acesso` e `/admin/gestao-usuarios`.
- **Evidências:** `app/composables/useAuth.ts:110-118,152-155`; `app/components/perfis/usePerfisModelo.ts:196-220`; `app/components/usuarios/useUsuarios.ts:211-216`; `app/composables/usePermissions.ts:13`; `app/composables/useConfiguracoesGlobais.ts:43`.
- **Impacto:** exposição de informação restrita (matriz de permissões, nomes/contagens) a perfil sem permissão, sem bypass da API. Quebra a expectativa de RBAC na UI.
- **Correção sugerida:** limpar todo `useState` derivado da sessão no logout; remover o curto-circuito de `carregado` (refazer GET na montagem) e zerar `kpis/total/opcoes` nos `catch`.
- **IDs de origem:** qa-funcional RL04-FUN-02; qa-execução RL04-EXE-04.
### 3.3 Médios

#### 3.3.1 Funcionais e de autorização

| ID | Título | Módulo | Evidência (arquivo:linha) | Impacto | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RL04-M-01 | Desativação via `PUT /api/usuarios/:id` (modal) **não incrementa `token_version`** → reativar na janela de 15 min **revive o token antigo** | Sessão / Usuários | `server/utils/usuarios.ts:469-490` × `:522-540` | Token roubado sobrevive à operação de bloqueio; defesa em profundidade aquém | BD-03, FUN-11, SEG-02, EXE-03 |
| RL04-M-02 | Ordenação da `UiDataTable` **no-op no modo servidor** (Usuários e Auditoria) | Usuários / Auditoria | `app/components/ui/DataTable.vue:406-408`; `usuarios/Tabela.vue:45-65`; `auditoria/Tabela.vue:39-56` | Funcionalidade de ordenação anunciada e inoperante | FUN-03 |
| RL04-M-03 | Preferências globais do shell **não chegam a perfis não-Administrador** (GET gate `configuracoes-globais/visualizar` → 403 → defaults) | Configurações × Shell × RBAC | `server/api/configuracoes/index.get.ts:6`; `server/migration/02_seed.sql:54-57,82-85`; `useConfiguracoesGlobais.ts:72-74` | Identidade/preferência de navegação inconsistentes por perfil | FUN-04 |
| RL04-M-04 | Cache de configurações **não é invalidado após salvar** (reentrada na tela mostra valores antigos; logo do header reverte) | Configurações | `app/composables/useConfiguracoesGlobais.ts:43-74`; `app/pages/admin/configuracoes-globais.vue:41-56` | Tela e shell divergem do banco; risco de regravar valores antigos | FUN-05 |
| RL04-M-05 | **Perfis Inativos oferecidos** no modal/importação/filtros e o servidor rejeita (importação falha em lote) | Gestão de Usuários × Perfis | `server/utils/usuarios.ts:326-331`; `usuarios/Formulario.vue:317`; `usuarios/Importar.vue:59` | Opção visível que sempre falha; importação frustrada | FUN-06 |
| RL04-M-06 | Mensagem do **anti-lockout (409) engolida** (toast genérico "conexão com o banco") | Perfis de Acesso | `app/components/perfis/Permissoes.vue:110-125,165-177`; `server/utils/perfis.ts:366-372` | Operador não entende a proteção; acha que é falha de conexão | FUN-07 |
| RL04-M-07 | Recuperação de senha **revela existência da conta por tempo de resposta** (Resend síncrono no caminho do existente) | Login / Recuperação | `server/api/auth/esqueci-senha/index.post.ts:44-70`; `server/utils/mailer.ts:28-56` | Oráculo de enumeração de contas por timing | FUN-08 |
| RL04-M-08 | **Falha de carga preserva KPIs/total/opções** da carga anterior | Usuários / Auditoria | `app/components/usuarios/useUsuarios.ts:211-216`; `auditoria/useAuditoriaModelo.ts:154-156` | Leitura de dados desatualizados como se fossem atuais; soma-se ao RL04-A-02 | FUN-09 |
| RL04-M-09 | **Inativar um perfil não encerra sessões abertas** nem bloqueia o refresh | Perfis / Autenticação | `server/utils/auth.ts:239-243,326-337` | Perfil desativado mantém acesso pleno enquanto a sessão viver | FUN-10 |

#### 3.3.2 Performance e banco

| ID | Título | Módulo | Evidência (arquivo:linha) | Impacto | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RL04-M-10 | **Fanout de 6 queries por listagem** (+1 por request autenticado no middleware) | Infra DB | `server/utils/audit.ts:195-208`; `usuarios.ts:317-332`; `permission.ts:60-65`; `middleware/auth-api.ts:24` | Multiplica carga por interação e pressiona o pool | PERF-01 |
| RL04-M-11 | Agregado de Auditoria em **full scan** (`type=ALL`) a cada request | Auditoria | `server/utils/audit.ts:197-201` | Custo O(n) por page view; trilha append-only cresce | PERF-02 |
| RL04-M-12 | Busca `LIKE '%…%'` **inindexável** + listagem de usuários `ALL + filesort` | Usuários / Auditoria | `server/utils/usuarios.ts:293-298`; `audit.ts:166-171` | Full scan por termo; degradação não linear | PERF-03 |
| RL04-M-13 | **Exportação sem streaming** (10.000 linhas; pior caso ~80 MB; PDF/CSV na main thread) | Usuários / Auditoria | `server/utils/audit.ts:66,179-186`; `usuarios.ts:272,305-310`; `auditoria/gerarPdfAuditoria.ts` | Resposta pesada e travamento do navegador | PERF-04, FUN-19, RL03-B-15 |
| RL04-M-14 | **Saturação do pool** por fanout concorrente (4 conexões/listagem; `connectionLimit: 10`) | Infra DB | `server/utils/db.ts:24-26`; `audit.ts:195`; `usuarios.ts:317` | ~2 listagens concorrentes esgotam o pool; fila/erros sob pico | PERF-05 |
| RL04-M-15 | `registrarAuditoria` **aguardada** no caminho da resposta | Auditoria / todas as escritas | `server/utils/audit.ts:90-126`; rotas (20+) | +1 INSERT somado a toda escrita | PERF-06, FUN |
| RL04-M-16 | Eventos de expurgo **`ENABLED` mas sem execução confirmada** (`LAST_EXECUTED = null`) | Migrations / Expurgo | `server/migration/11_indices_e_expurgo.sql:16-43`; `information_schema.EVENTS` | Acúmulo de `sessoes`/log até o primeiro ciclo; retenção de auditoria em 550 dias | BD-02, PERF-12 |

#### 3.3.3 UX / acessibilidade

| ID | Título | Módulo | Evidência (arquivo:linha) | Impacto | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RL04-M-17 | **Meu Perfil fica em tela em branco** quando a carga do registro falha (só toast) | Meu Perfil | `app/pages/admin/meu-perfil.vue:38-49,169-171` | Usuário perde contexto e não tem retry na tela | UX-01 |
| RL04-M-18 | Checkboxes da importação **sem nome acessível** | Gestão de Usuários | `app/components/usuarios/Importar.vue:264-271`; `ui/Checkbox.vue` | AT anuncia "caixa de seleção" sem contexto | UX-02 |
| RL04-M-19 | `CheckCard` embute checkbox **sem rótulo acessível** (Config › Sidebar) | Configurações | `app/components/ui/CheckCard.vue:108-120,160-168` | ~8 cartões de preferência anunciados sem nome | UX-03 |
| RL04-M-20 | `UiSelect` sem `label` → **combobox sem nome** nos modais de filtro | Design System | `app/components/ui/Select.vue:247-267`; `*/Filtros.vue` | 4 selects de filtro inacessíveis por nome | UX-04 |
| RL04-M-21 | **Exportações (PDF/CSV) falham em silêncio** (só `console.error`, sem toast/loading) | Usuários / Auditoria / Perfis | `usuarios/Cabecalho.vue:59-77`; `auditoria/Cabecalho.vue:52-65`; `perfis/Cabecalho.vue:83` | Ação assíncrona sem feedback; parece não fazer nada | UX-05 |

#### 3.3.4 Documentação (divergência spec × código / doc obsoleta)

| ID | Documento e trecho | Estado real | Origem |
| :--- | :--- | :--- | :--- |
| RL04-DOC-01 | `docs/05 - Gestão de Auditoria.md:291-292,383-384` descreve `requirePermission`/RBAC como **roadmap** | Implementado (19 rotas chamam `requirePermission`) | novo |
| RL04-DOC-02 | `docs/05:300,297-299,364` contrato de `GET /api/auditoria` = `{ registros, opcoes }` | Real: `{ registros, total, kpis, opcoes, pagina, porPagina }` + `busca/pagina/porPagina/exportar` | novo |
| RL04-DOC-03 | `docs/07:271-272,675-676` — dropdown de perfis "fixo na demo" | Real: opções vêm de `opcoes.perfis` do servidor | novo |
| RL04-DOC-04 | `docs/07:678-679` — regra de situação do perfil "a modelar" | Implementado (`login:76`, `usuarios.ts:611-617`, `convite:79`) | novo |
| RL04-DOC-05 | `docs/03 - Header e Sidebar.md:378-382` — "Sem middleware de auth ou RBAC" | Ambos implementados | novo |
| RL04-DOC-06 | `docs/05:387-388,393-394` — paginação server-side e expurgo "pendentes" | Ambos implementados (migration 10/11) | novo |
| RL04-DOC-07 | **Conflito interno** da spec `gestao-usuarios` (`:167` filtros "em memória" × `:312` "no servidor") | Código segue o servidor | RL03-B-01 (pendente) |
| RL04-DOC-08 | `docs/06` **referenciado mas inexistente** (`docs/01:736,747`; `docs/07:569`) | Arquivo ausente | novo |
| RL04-DOC-09 | `docs/bd/01 - banco_dados_mariadb.sql:636-648` **não lista a migration 11** | Migration 11 adiciona índices + 3 eventos | novo |
| RL04-DOC-10 | Catálogo da spec `autorizacao-rbac` **omite `GET /api/usuarios/emails`** | Rota existe sob `gestao-usuarios/visualizar` | novo |
| RL04-DOC-11 | `docs/02:375` — `_migrations (id, nome, executado_em)` | Real: `(nome PK, aplicado_em)` | novo |
| RL04-DOC-12 | `docs/02:317` — `ipDoCliente` com `xForwardedFor: true` fixo | Real: só com `TRUSTED_PROXIES` (`rateLimit.ts:55-62`) | novo |
| RL04-DOC-13 | `docs/01 §5.20:1057` — foto persistida como `dataURL` | Real: arquivo em `avatar_url`; dataURL é rascunho | novo |
| RL04-DOC-14 | `docs/07:407` — "matriz 99/45/21/**99**" | Real: 99/45/21/**6** | novo |
| RL04-DOC-15 | `docs/07:197,247,277`; `docs/09:300,91` — tipos `PerfilDemo`/`UsuarioDemo`, `VARIANTE_POR_PERFIL` | Reais: `PerfilModelo`, `variantePerfil()` | novo |
| RL04-DOC-16 | `docs/03:347` — "8 tintas D9" | São 10 (`shellTintas.ts`) | novo |
| RL04-DOC-17 | `docs/02:293`, `docs/04:49` — resíduos "(demo)"/"mockups" em telas reais | Backend real | novo |
### 3.4 Baixos e melhorias

| ID | Título | Módulo | Evidência (arquivo:linha) | Origem |
| :--- | :--- | :--- | :--- | :--- |
| RL04-B-01 | Default do `UiUploadFiles` e vitrine ainda anunciam **SVG** (servidor rejeita) | Design System | `ui/UploadFiles.vue:25`; `pages/design.vue:1195` | UX-11, FUN-22 |
| RL04-B-02 | Accent `#4ed813` puro sobre superfície clara (filetes do Meu Perfil e `border-l` da DataTable) | Design System | `perfil/AbaDadosPessoais.vue:59,86`; `ui/DataTable.vue:552` | UX-09 |
| RL04-B-03 | Foco de teclado invisível em controles secundários (`focus:outline-none` sem anel) | Design System | `ui/ToastContainer.vue:132`; `ui/Calendar.vue:207,215,289`; `ui/Select.vue:315`; `ui/DatePicker.vue:269` | UX-08 |
| RL04-B-04 | Coluna sem cabeçalho permanece "ordenável" e focável com nome vazio | Design System | `ui/DataTable.vue:717-719,726-727`; `usuarios/Importar.vue:160-161` | UX-07 |
| RL04-B-05 | Textos secundários em `slate-400` (contraste ~2,5:1, cálculo estático) | Design System | `configuracoes/AbaSeguranca.vue:312,348`; `error.vue:52` | UX-13 |
| RL04-B-06 | Menus do header (`role="menu"`) sem navegação por setas nem fechamento ao perder foco | Shell | `layout/AppHeader.vue:102-114,173-224,250-306` | UX-14 |
| RL04-B-07 | Dots de status/`Badge` e sino fora da paleta documentada (`*-500` vs `#047857`/`#be123c`) | Design System | `ui/Badge.vue:38-74`; `layout/AppHeader.vue:168` | UX-16 |
| RL04-B-08 | Vitrine com demos divergentes ("Sucess", warning verde, `rose-400`, dica SVG) | Vitrine `/design` | `pages/design.vue:1282,1309,1337,1362,1424` | UX-10 |
| RL04-B-09 | Mensagens de erro expõem detalhe técnico "conexão com o banco" | Várias telas | `gestao-usuarios.vue:29`; `perfis-acesso.vue:31,115`; `auditoria.vue:33` | UX-06 |
| RL04-B-10 | Antilockout **não cobre** desativar/excluir o último administrador (nem a própria conta) | Perfis / Usuários | `perfis.ts:350-372` (só matriz) × `usuarios.ts:497-501,522-540` | SEG-04 |
| RL04-B-11 | **Injeção de fórmula em CSV** de exportação (`=`, `+`, `-`, `@`) | Exportação | `usuarios/Cabecalho.vue:42-49`; `auditoria/Cabecalho.vue:42-43`; `perfis/Cabecalho.vue:64-65` | SEG-05 |
| RL04-B-12 | Curingas `LIKE` (`%`/`_`) não escapados nas buscas (não é SQLi) | Auditoria / Usuários | `audit.ts:168`; `usuarios.ts:295` | SEG (RL03-B-20) |
| RL04-B-13 | Ausência de **headers de segurança globais** (CSP/HSTS/X-Frame-Options) e de **CSRF token** dedicado (mitigado por `SameSite=Lax`) | Infra / Segurança | `nuxt.config.ts`; `auth.ts:55-60` | SEG (RL03-B-18/19) |
| RL04-B-14 | `POST /api/auth/refresh` não valida `token_version` (hoje coberto por `situacao`) | Autenticação | `server/api/auth/refresh/index.post.ts` | SEG (obs.) |
| RL04-B-15 | `entidade_id` não exposto na API/detalhes da auditoria (UUID omitido) | Auditoria | `audit.ts:213-221` | FUN-12 |
| RL04-B-16 | IP registrado como `0.0.0.0` em dev (rate limit vira bucket global) | Auditoria / Segurança | `rateLimit.ts:55-62` | FUN-13, RL03-B-21 |
| RL04-B-17 | Detalhe de auditoria diz "senha provisória enviada" mesmo quando o Resend falha | Auditoria / Recuperação | `esqueci-senha/index.post.ts:74-85` | FUN-14 |
| RL04-B-18 | Convite para usuário Inativo grava senha e retorna sucesso, mas o login continua bloqueado | Convite | `convite/index.post.ts:92-99`; `login:68-73` | FUN-15 |
| RL04-B-19 | Termo de busca persiste no `useState` após navegação, mas o campo da tabela volta vazio | Usuários / Auditoria | `useUsuarios.ts:184,192-200`; `DataTable.vue:82` | FUN-16 |
| RL04-B-20 | Recarga de lista ignorada se houver carga em voo (`return false`) → tabela/KPIs podem ficar antigos | Usuários / Auditoria | `useUsuarios.ts:188`; `useAuditoriaModelo.ts:129` | FUN-17 |
| RL04-B-21 | E-mail duplicado concorrente na criação não mapeado para `409` (errno 1062 → 500) | Usuários | `usuarios.ts:181-189,406-419` | FUN-18 |
| RL04-B-22 | Data inválida no filtro da auditoria aceita pelo formato e coibida pelo MySQL (em vez de `400`) | Auditoria | `audit.ts:69,139-150` | FUN-23 |
| RL04-B-23 | Over-fetching da listagem de usuários (25 colunas/linha para 5 exibidas) | Usuários | `usuarios.ts:124-128`; `usuarios/Tabela.vue:30-42` | PERF-07 |
| RL04-B-24 | `GET /api/usuarios/emails` sem paginação/limite | Usuários | `usuarios.ts:361-366` | PERF-08 |
| RL04-B-25 | Aba Segurança: varredura de contas sem índice (`type=ALL; Using filesort`) | Configurações | `seguranca.ts:144-149` | PERF-09 |
| RL04-B-26 | Envio de e-mail (Resend) aguardado no caminho da resposta, sem timeout/`AbortSignal` | Convite / Recuperação | `mailer.ts:36-49` | PERF-10 |
| RL04-B-27 | `requirePermission` refaz a leitura da matriz já resolvida no request | RBAC / Infra | `permission.ts:51-68` | PERF-11 |
| RL04-B-28 | `UiSelect`/`DatePicker` não colorem o rótulo em erro (spec `form-control-states`) | Design System | `ui/Select.vue:251`; `ui/DatePicker.vue:210` | UX-12 |
| RL04-B-29 | Estado vazio da `UiDataTable` com texto fixo "com o filtro aplicado" (também sem filtro) | Design System | `ui/DataTable.vue:948-955` | UX-15 |
| RL04-B-30 | Comentário de `perfil/Avatar.vue` sobre `dataURL` pode induzir persistência (é rascunho) | Meu Perfil | `perfil/Avatar.vue:7` | DOC-18 |

### 3.5 Observações estruturais e de ambiente

| ID | Observação | Evidência |
| :--- | :--- | :--- |
| RL04-OBS-01 | `entregas_itens.release_id` **CASCADE** × `historico_esteira_revisao.entrega_item_id` **RESTRICT** — excluir release com itens historizados falharia (errno 1451). **Decidir antes do módulo público.** | `migration/01_create_tables.sql:422-426,572-576` |
| RL04-OBS-02 | `token_blacklist` e `tokens_acesso` existem mas estão **sem uso** (0 linhas); revogação é por `token_version`; convite/recuperação gravam senha direto | contagens 0; `auth.ts` |
| RL04-OBS-03 | `configuracoes_limite_requisicao.taxa_atual`/`ips_bloqueados` sem uso (rate limit é em memória) | `rateLimit.ts` |
| RL04-OBS-04 | Buscas `LIKE '%…%'` em `usuarios`/`auditoria` não usam índice (full scan em escala) | `usuarios.ts:296`; `audit.ts:169` |
| RL04-OBS-05 | Timezone não fixado no pool (`db.ts` sem `timezone`); schema usa `DATETIME(6)` sem TZ | `db.ts:16-35` |
| RL04-OBS-06 | `importarUsuarios` grava `departamento_setor=''` enquanto `criarUsuario`/DEFAULT usam `'Geral'` | `usuarios.ts:678,399-402`; `migration/01:63` |
| RL04-OBS-07 | `configuracoes_globais.dias_retencao_auditoria = 550` (máximo) — retenção de auditoria sem efeito prático nesta base | banco (pré-existente) |
| RL04-OBS-08 | `stack` (trace) presente nas respostas de erro em dev | runtime (dev) |
| RL04-OBS-09 | `usePermissions().can()` implementado mas não consumido pela UI (permitido pela spec) | `usePermissions.ts` |

---

## 4. Confirmação dos itens do RL03 (reauditoria)

| Item RL03 | Assunto | Estado na RL04 |
| :--- | :--- | :--- |
| RL03-C-01 | `trocar-senha` aceitava token revogado | **CORRIGIDO** (runtime: `401`) |
| RL03-A-01 | `/auth/seguro` devolvia sessão revogada | **CORRIGIDO** (runtime: `401`) |
| RL03-A-02 | Importação só comparava a página corrente | **CORRIGIDO** (`GET /api/usuarios/emails`; `data.conflitos`) |
| RL03-M-01 | Perfis customizados inutilizáveis na UI | **CORRIGIDO** (regressão nova: perfis Inativos → RL04-M-05) |
| RL03-M-02 | `liberar` bloqueio respondia 404 espúrio | **CORRIGIDO** (idempotente) |
| RL03-M-03 | Link de e-mail caía no `Host` | **CORRIGIDO** (`APP_URL` obrigatória) |
| RL03-M-04/M-05/M-06 | Docs RBAC/rótulo de Auditoria | **CORRIGIDO** (sobraram docs de tela → RL04-DOC-01…17) |
| RL03-M-07/M-08 | `filesort` em Auditoria/Segurança | **CORRIGIDO** (`Using index`, sem filesort) |
| RL03-M-09 | Índice em `usuarios.nome_completo` + LIKE | **PARCIAL / REABERTO** — índice existe, mas a busca segue full scan → RL04-M-12 |
| RL03-M-10 | Fanout ~6 queries + sem expurgo de `sessoes` | **PARCIAL** — expurgo criado mas sem execução confirmada (RL04-M-16); fanout persiste (RL04-M-10) |
| RL03-M-11 | `jspdf` no bundle inicial | **CORRIGIDO** (lazy; 0 jspdf/exceljs no grafo inicial) |
| RL03-M-12 | `registrarAuditoria` awaited + detalhes 16 MB | **PARCIAL** — detalhes 8 KB corrigido; `await` persiste (RL04-M-15) |
| RL03-M-13 | Pool sem timeouts | **CORRIGIDO (com ressalva)** — `connectTimeout` ok; saturação por fanout persiste (RL04-M-14) |
| RL03-M-14 | CASCADE × RESTRICT do conteúdo público | **CONFIRMADO presente** (roadmap — RL04-OBS-01) |
| RL03-M-15 | `docs/02` com config de boot obsoleta | **CORRIGIDO** |
| RL03-B-01 | Conflito de spec de filtros | **PENDENTE** (RL04-DOC-07) |
| RL03-B-02 | Dica "SVG" no upload | **PARCIAL** — corrigido em `AbaLogomarcas`; resíduo no kit/vitrine (RL04-B-01) |
| RL03-B-03 | Rate limit aceitava `0` | **CORRIGIDO** |
| RL03-B-04 | `409` no campo Nome do perfil | **CORRIGIDO** |
| RL03-B-05 | Comentário obsoleto das permissões | **CORRIGIDO** |
| RL03-B-06…B-11 | Tokens/tipografia/a11y da DataTable/CEP/vitrine | **CORRIGIDO** (com resíduos novos → RL04-B-02/03/08) |
| RL03-B-15 | Exportação 10.000 sem streaming | **PENDENTE** (RL04-M-13) |
| RL03-B-16 | Expurgo só de auditoria | **CORRIGIDO (DDL)** / execução a confirmar (RL04-M-16) |
| RL03-B-17 | Rotação do refresh sem `FOR UPDATE` | **CORRIGIDO** (reuso → `401`; concorrência `200/401`) |
| RL03-B-18/19/20 | Headers globais / CSRF / curingas LIKE | **PENDENTE** (roadmap; RL04-B-12/13) |
| RL03-DAD-01 | Matriz do Editor 42/99 | **CORRIGIDO** (45/99; Admin 99, Revisor 21, Leitor 6) |

---

## 5. Escopos não aplicáveis (declarados, não reprovados)

1. **Conteúdo da Área Pública** (Releases Week, Manuais, Escopo de Projetos) — só existe o placeholder `app/pages/index.vue`; sem páginas nem APIs públicas. **"Exposição de conteúdo não publicado" é não aplicável hoje.**
2. **Módulos da sidebar sem rota** (Manuais, Release Week, Escopo, Esteira, Chamadas, Parceiros, Softwares) — exibem "Módulo em construção".
3. **`server/utils/validation.ts` (Zod) e `server/utils/safeError.ts`** — roadmap declarado; validação ad hoc auditada.
4. **Headers de segurança globais / CSRF token dedicado** — roadmap declarado.
5. **Envio real de e-mail (Resend)** — validado por código (fluxos de convite/recuperação), não exercido.
6. **Soft delete** — não previsto; exclusão física é intencional.
7. **Medições de UI em navegador** (contraste computado, overflow 320–1440px, foco/trap) — apenas análise estática nesta rodada.
8. **`usePermissions().can()` consumido pela UI** — helper conforme, sem exigência de ocultação.
9. **Scripts de lint/test/typecheck/bundle-analyzer** — inexistentes no repositório (gate = `npm run build`).
---

## 6. Melhores práticas de mercado — avaliação

**Pontos fortes (alinhados ao mercado):** arquitetura em camadas clara (página = orquestração, composables de estado, UI kit próprio sem libs pesadas); SQL 100% parametrizado com UUIDs nativos (sem ORM); JWT em `HttpOnly` + refresh rotativo com `FOR UPDATE` + revogação por `token_version`; bcrypt cost 12; segredos em AES-256-GCM; uploads validados por magic bytes + `nosniff`; auditoria centralizada resiliente (`try/catch`); migrations idempotentes com runner e expurgo agendado; lazy-loading de `jspdf`/`exceljs`; índices compostos efetivos; acessibilidade/ARIA acima da média no kit.

**Lacunas frente às melhores práticas (as marcadas bloqueiam a aprovação):**

| # | Lacuna | Situação | Relacionados |
| :--- | :--- | :--- | :--- |
| 1 | **Ausência total de testes automatizados** (unit/integração/E2E) e de lint/format/typecheck | Maior gap de maturidade; a única defesa é `npm run build` + olho humano — os Altos novos (TTL, XSS) passariam por qualquer teste | RL04-A-01, RL04-C-01 |
| 2 | **Upload servido por extensão** em vez do tipo real detectado | Deveria derivar `Content-Type` do magic bytes / forçar extensão segura / `Content-Disposition` | RL04-C-01 |
| 3 | **Validação ad hoc** em vez de schema (`Zod` roadmap) e **erro não centralizado** (`handleApiError` roadmap) | Mensagens divergentes e detalhes de infraestrutura | RL04-B-09, RL04-M-06 |
| 4 | **Headers de segurança globais (CSP/HSTS) e CSRF token** ausentes | Mitigado por `SameSite=Lax`, mas não é o padrão de mercado | RL04-B-13 |
| 5 | **Observabilidade** (logs estruturados/métricas) e **expurgo comprovadamente em execução** | Frágil para produção | RL04-M-16 |
| 6 | **Controle de sessão** — TTL do refresh errado e revogação com vão na desativação via PUT | Afeta disponibilidade e defesa em profundidade | RL04-A-01, RL04-M-01 |
| 7 | **Higiene de sessões** — churn sem expurgo efetivo | Crescimento indefinido | RL04-M-16, RL04-OBS |

---

## 7. Matriz de aprovação

| Critério | Situação |
| :--- | :--- |
| Sem bugs críticos | **FALHA** — RL04-C-01 |
| Sem bugs altos | **FALHA** — RL04-A-01, RL04-A-02 |
| Regressão inexistente | **FALHA** — TTL do refresh; estado no logout; ordenação server-side; shell não-admin |
| Banco consistente | OK — 11/11 migrations, 0 órfãos/duplicidades, matriz 99/45/21/6 |
| Permissões corretas | OK no servidor (Leitor → 403 em 100%) — ressalva de exibição client-side (RL04-A-02) |
| Sem bypass da fronteira / exposição de não publicado | OK — público anônimo; APIs 401; identidade só logo — ressalva: XSS same-origin compromete a autorização (RL04-C-01) |

### VEREDITO: REPROVADO — Risco Alto

---

## 8. Plano de correção por etapas

> Cada etapa deve virar um change OpenSpec (`/opsx-propose` → apply → `/opsx-sync` → `/opsx-archive`) e terminar com `npm run build` + verificação visual em `/design` quando houver UI. A reauditoria confirma o fix na próxima passagem.

### Etapa 1 — Segurança e sessão (desbloqueio) · obrigatória

- [x] **RL04-C-01 (Crítico) — XSS por upload.** Validar a extensão contra o tipo real detectado, forçar extensão segura (ou negar `.html/.htm/.svg/.js/.xml`) e/ou servir `/uploads/**` com `Content-Type` fixo de imagem + `Content-Disposition: attachment`/CSP `sandbox`.
  - Arquivos: `server/utils/uploads.ts:43-74`, `server/api/uploads/index.post.ts:40-61`, `nuxt.config.ts:44-54`.
  - **Aceite:** upload de `*.html` (mesmo com magic PNG) → `400` **ou** servido com `Content-Type` inerte (não `text/html`); E2E: `GET /uploads/**/*.html` não executa script.
- [x] **RL04-A-01 (Alto) — TTL do refresh.** `new Date(Date.now() + REFRESH_TTL_DIAS * 24 * 60 * 60 * 1000)`.
  - Arquivos: `server/utils/auth.ts:151,172`.
  - **Aceite:** `SELECT TIMESTAMPDIFF(SECOND,criado_em,expira_em) FROM sessoes` ≈ `604800`; sessão sobrevive além de 15 min com refresh silencioso.
- [x] **RL04-A-02 (Alto) — Estado no logout.** Limpar todo `useState` derivado da sessão no `sair()`; remover o curto-circuito de `carregado` (refazer GET na montagem); zerar `kpis/total/opcoes` nos `catch`.
  - Arquivos: `app/composables/useAuth.ts`, `app/components/perfis/usePerfisModelo.ts`, `app/components/usuarios/useUsuarios.ts`, `app/composables/usePermissions.ts`, `app/composables/useConfiguracoesGlobais.ts`.
  - **Aceite:** Admin → logout → login Leitor na mesma aba → Perfis/Usuários **sem** dados da sessão anterior.

> **Status: CORRIGIDO (17/10/2026)** — change OpenSpec `corrigir-seguranca-e-sessao` (Etapa 1 concluída). Verificação: (RL04-C-01) upload `*.html` com magic PNG → `200`, gravado como `.png` e servido `image/png` (nunca `text/html`), com CSP `default-src 'none'; sandbox` em `/uploads/**`; conteúdo não-imagem → `400`. (RL04-A-01) novas sessões com `TIMESTAMPDIFF(SECOND,criado_em,expira_em)` ≈ `604800` e `Set-Cookie` do refresh `Max-Age=604800`; `POST /api/auth/refresh` → `200` com rotação (reuso → `401`). (RL04-A-02) `limparEstadoSessao()` no `sair()`/`sessaoInvalidada()` zera todo o estado derivado da sessão (inspeção; reprodução em navegador é passo manual). `npm run build` OK.

### Etapa 2 — Revogação e autorização

- [x] **RL04-M-01:** incrementar `token_version` (e/ou revogar `sessoes`) na desativação via `PUT /api/usuarios/:id` (`server/utils/usuarios.ts:469-490`). **Aceite:** desativar+reativar pelo modal → cookie antigo → `401`.
- [x] **RL04-M-09:** checar `perfil_situacao` na validação de sessão/refresh (`server/utils/auth.ts:239-243,326-337`).
- [x] **RL04-M-05:** filtrar perfis **Ativos** em `opcoes.perfis` (`server/utils/usuarios.ts:326-331`) e na validação da importação.
- [x] **RL04-M-06:** exibir a mensagem real do anti-lockout (`409`) no modal de permissões.
- [x] **RL04-B-10:** estender a guarda antilockout para desativar/excluir o último administrador.
- [x] **RL04-B-14:** validar `token_version` no `POST /api/auth/refresh`.

> **Status: CORRIGIDO (17/10/2026)** — change OpenSpec `endurecer-revogacao-e-autorizacao` (Etapa 2 concluída). Verificação E2E (31/31 checks): desativar pela edição geral (`PUT /api/usuarios/:id`) e por `/situacao` → access `401` e refresh `401`; reativar → cookie antigo segue `401`; inativar o perfil → sessões dos usuários `401` e refresh `401`; `opcoes.perfis` sem perfis Inativos; desativar/excluir o último administrador essencial → `409` com a mensagem de lockout (exibida pelo modal via `statusMessage`); logout segue revogando (`401`). Nota: a validação de revogação no refresh é garantida pela revogação das linhas de `sessoes` a cada bump de `token_version` e pela checagem de conta/perfil ativos em `renovarSessao`. `npm run build` OK.

### Etapa 3 — Funcional e UX

- [x] **RL04-M-02:** mapear `sort-change` → parâmetros da API (ou desabilitar ordenação no modo servidor).
- [x] **RL04-M-03:** fornecer identidade/preferências do shell sem depender de `configuracoes-globais/visualizar` (endpoint público enxuto já existe para a logo de login).
- [x] **RL04-M-04:** invalidar/atualizar o cache de configurações após salvar.
- [x] **RL04-M-07:** enviar o e-mail de recuperação fora do caminho da resposta (ou adicionar jitter/padronizar latência).
- [x] **RL04-M-08:** zerar KPIs/total/opções em falha de carga.

> **Status: NÚCLEO FUNCIONAL CORRIGIDO (17/10/2026)** — change OpenSpec `corrigir-ordenacao-shell-e-carga`. Verificação E2E (25/25 checks): ordenação de Usuários e Auditoria aplicada pelo servidor (`ordenar`/`direcao` com whitelist; asc ≠ desc); `GET /api/configuracoes/shell` (só-sessão) devolve as preferências e não vaza rate limit/retenção — Editor (após primeiro acesso) recebe `200` no shell e `403` na config completa; a recuperação de senha responde sem aguardar o e-mail (latência equivalente: existente 13 ms × inexistente 7 ms); `npm run build` OK. A cauda de UX/acessibilidade da Etapa 3 (RL04-M-17…M-21 + B-03…B-09, B-15…B-22, B-28…B-30) permanece pendente em change próprio.
- [x] **RL04-M-17…M-21 + RL04-B-03…B-09, B-15…B-22, B-28…B-30:** a11y (nomes acessíveis, foco), feedback de erro/exportação, contraste, paleta, tela vazia do Meu Perfil, etc.

> **Status: PARTE A (Acessibilidade & Design System) CORRIGIDA (17/10/2026)** — change OpenSpec `polir-acessibilidade-e-design-system`: nome acessível no `UiSelect` sem label (filtros), no checkbox do `CheckCard` e nas linhas da importação (M-20/M-19/M-18); foco de teclado visível nos controles secundários (limpar de Select/DatePicker, fechar do toast, navegação do calendário, "Copiar HEX") (B-03); coluna sem cabeçalho não é mais focável/ordenável e o estado vazio distingue base vazia de filtro (B-04/B-29); dots de status e sino nos tokens documentados e texto de apoio com contraste AA (B-07/B-05); menus do header navegáveis por teclado (B-06); demos da vitrine fiéis ao componente real (B-08); Meu Perfil com estado de erro recuperável (M-17); rótulo do Avatar/doc alinhados a arquivo (B-30). `npm run build` OK. **Parte B CORRIGIDA (17/10/2026)** — change OpenSpec `corrigir-baixos-funcionais`: exportações (CSV/PDF) com toast de erro e loading (M-21); mensagens de erro sem "conexão com o banco" (B-09); detalhe da auditoria exibe o `entidade_id` (B-15); filtro de data inválida → 400 (B-22); trilha da recuperação reflete o envio (B-17); convite só para usuário Ativo (B-18); recarga concorrente aplicada e campo de busca refletindo o termo (B-19/B-20); e-mail duplicado concorrente → 409 (B-21). Com esta parte, a cauda de UX/acessibilidade da Etapa 3 está concluída.

### Etapa 4 — Performance e banco

- [ ] **RL04-M-10…M-16:** reduzir fanout/caching de opções, agregado por índice, `FULLTEXT`/prefixo na busca, exportação server-side/streaming, paralelismo do pool, `registrarAuditoria` sem `await` no caminho da resposta, expurgo efetivo (`LAST_EXECUTED`).
- [ ] **RL04-B-23…B-27:** projeção de colunas da lista, paginação de `emails`, índice em `bloqueado_ate`, timeout no envio de e-mail, reaproveitar a matriz no middleware.
- [ ] **RL04-OBS-01…07:** planejar CASCADE×RESTRICT, limpar colunas sem uso, fixar timezone do pool, padronizar `departamento_setor`.

> **Status: NÚCLEO COMPORTAMENTO-PRESERVANTE CORRIGIDO (17/10/2026)** — change OpenSpec `otimizar-desempenho-e-banco` (`skip_specs`, sem mudança de comportamento observável): índices em `usuarios.bloqueado_ate` e `auditoria.usuario_nome` (migration 12); agregado de auditoria separado (por índice, KPIs idênticos); cache de opções de filtro (TTL 30 s); menos paralelismo por listagem; listagem enxuta + `GET /api/usuarios/:id` para o modal; `registrarAuditoria` fora do caminho da resposta (`event.waitUntil`); timeout no envio de e-mail; `DB_TIMEZONE` explícito no pool; expurgo catch-up no boot. Verificado por `npm run build` + E2E (13/13) e `EXPLAIN` (aba Segurança por índice). **Permanecem (mudam comportamento/contrato, fora deste escopo):** M-12 (busca prefixo/FULLTEXT), M-13 (exportação gerada no servidor/streaming) e B-24 (limite/paginação do endpoint de e-mails). B-27 já existia (`permission.ts` memoiza a matriz por request).

### Etapa 5 — Documentação e specs

- [x] **RL04-M-22 / RL04-DOC-01…17:** corrigir `docs/05` (RBAC/contrato/paginação/expurgo), `docs/07` (dropdown, situação, matriz 6/99, tipos `*Modelo`), `docs/03` (middleware/RBAC, tintas), `docs/02` (`_migrations`, `ipDoCliente`), `docs/01 §5.20`, `docs/09`, `docs/bd/01` (migration 11) e criar/remover as referências ao `docs/06`.
- [x] **RL04-DOC-07:** resolver o conflito interno da spec `gestao-usuarios` (`:167` × `:312`).
- [x] **RL04-DOC-10:** incluir `GET /api/usuarios/emails` no catálogo de `autorizacao-rbac`.
- [x] **Melhoria de processo:** `npm run lint` (ESLint flat) e `npm run test` (Vitest, suíte mínima de funções puras) adicionados e **verdes**; `npm run typecheck` (`nuxt typecheck`) instalado e rodando — porém acusa **208 erros de tipo pré-existentes** (30 arquivos), registrados como dívida a zerar na change própria `corrigir-erros-de-tipo` (não é gate).

> **Status: CORRIGIDO (17/10/2026)** — change OpenSpec `alinhar-documentacao-e-specs`: resolvido o conflito da spec `gestao-usuarios` (filtros no servidor) e o catálogo de `autorizacao-rbac` (com `GET /api/usuarios/emails`); docs `01/02/03/04/05/07/09`, `docs/bd/01` e `docs/qa/00` alinhados; criado `docs/06 - Gestão de Usuários e Convite.md`; ferramentaria (`lint`/`typecheck`/`test` + AGENTS.md). Verificado por `npm run build` + `npm run lint` + `npm run test` (7/7) + `openspec validate --specs` (30/30). **Dívida de tipos** (208 erros do `typecheck`) fica para a change `corrigir-erros-de-tipo`.

> **Dívida de tipos ZERADA (17/10/2026)** — change OpenSpec `corrigir-erros-de-tipo` (`skip_specs`, sem mudança de comportamento): `npm run typecheck` passou de **208 → 0 erros** (causa-raiz: helpers `: never` como arrow-const não estreitavam — convertidos a `function`; além de tipagem de linhas de `query`, guards de `null`/índice e casts seguros em `.vue`). O `typecheck` passa a **gate** junto de `lint`/`test`/`build`.

---

## 9. Rastreabilidade de IDs

| Consolidado (RL04) | Especialistas de origem |
| :--- | :--- |
| RL04-C-01 | qa-segurança SEG-01; qa-execução EXE-01 |
| RL04-A-01 | qa-banco BD-01; qa-funcional FUN-01; qa-segurança SEG-03; qa-execução EXE-02 |
| RL04-A-02 | qa-funcional FUN-02; qa-execução EXE-04 |
| RL04-M-01 | qa-banco BD-03; qa-funcional FUN-11; qa-segurança SEG-02; qa-execução EXE-03 |
| RL04-M-02 | qa-funcional FUN-03 |
| RL04-M-03 | qa-funcional FUN-04 |
| RL04-M-04 | qa-funcional FUN-05 |
| RL04-M-05 | qa-funcional FUN-06 |
| RL04-M-06 | qa-funcional FUN-07 |
| RL04-M-07 | qa-funcional FUN-08 |
| RL04-M-08 | qa-funcional FUN-09 |
| RL04-M-09 | qa-funcional FUN-10 |
| RL04-M-10…M-16 | qa-performance PERF-01…06, PERF-12; qa-banco BD-02 |
| RL04-M-17…M-21 | qa-ux UX-01…05 |
| RL04-M-22 | qa-documentacao DOC-01…10 |
| RL04-B-01…B-30 | qa-ux UX-06…16; qa-segurança SEG-04/05 + RL03-B-18/19/20; qa-funcional FUN-12…23; qa-performance PERF-07…11; qa-documentacao DOC-11…18 |
| RL04-OBS-01…09 | qa-banco OBS-BD-01…06; qa-performance/qa-seguranca/qa-execução |

---

## 10. Encerramento

A varredura cobriu funcional, regressão, permissões, banco, UX, segurança, performance e a fronteira Área Pública × Área Administrativa, com execução E2E real. O sistema está **funcionalmente maduro** — SQL Injection inexistente, RBAC e fronteira íntegros, banco consistente, correções do RL03 sustentadas — porém **não está aprovado sem ressalvas**: há um **XSS armazenado por upload** (RL04-C-01), o **TTL do refresh** derruba a sessão em ~15 min (RL04-A-01) e o **estado não é limpo no logout** (RL04-A-02). Concluídas as Etapas 1 a 5 (seção 8), o sistema retorna a **APROVADO**.

Nenhum arquivo de código foi alterado por esta auditoria; os dados/arquivos de teste do E2E foram removidos e o ambiente restaurado.