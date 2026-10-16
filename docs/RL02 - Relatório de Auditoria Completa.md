# RL02 — Relatório de Auditoria Completa (QA 00–09)

| Campo | Valor |
| :--- | :--- |
| **ID** | RL02 |
| **Tipo** | Auditoria completa de qualidade (7 especialidades + execução E2E) |
| **Base normativa** | `docs/qa/00-arquitetura-e-regras-gerais.md`, `docs/qa/01..07`, `openspec/specs/**`, `docs/01 - design_system.md`, `docs/02 - Guia de Arquitetura e Migrations.md` |
| **Data** | 16/10/2026 |
| **Escopo auditado** | Todo o sistema já implementado — Área Pública raiz + Área Administrativa (Shell, Login/Recuperação, Gestão de Usuários, Perfis/RBAC, Auditoria, Configurações Globais, Meu Perfil, Uploads, Migrations, 404) + Design System/Vitrine |
| **Capabilities** | 26 entradas em `openspec list --specs` (11 funcionais + 15 sub-specs de `design-system`) |
| **Método** | Análise estática + consultas read-only no MariaDB 11.8.6 + medições (EXPLAIN) + execução E2E no dev server (`localhost:3000`) |
| **Alterações de código** | **Nenhuma** — auditoria somente-leitura. O `qa-execução` criou e removeu seus próprios dados de teste, restaurou a configuração e encerrou o servidor |
| **Veredito desta auditoria** | **REPROVADO** (3 Críticos, 6 Altos, 21 Médios + itens Baixos) |
| **Risco** | **Alto** |

---

## 1. Resumo executivo

- **Status:** **REPROVADO.** Existe bypass de autorização explorável por qualquer conta autenticada (inclusive o perfil mais restrito), exposição de credenciais, HTML/JS arbitrário servido na mesma origem (XSS armazenado), revogação de sessão ineficaz e uma migration capaz de apagar o banco.
- **Risco:** **Alto.**
- **O que está correto:** o núcleo funcional está coerente na volumetria atual — autenticação/lockout/rate limit operantes, fronteira anônima (público × admin) preservada, CRUD de usuários/perfis, auditoria server-side, configurações, meu perfil, migrations idempotentes no fluxo normal, base relacional íntegra (0 órfãos, 13 FKs coerentes) e design system maduro. `npm run build` OK.

### Veredito por especialidade

| Especialidade | Veredito | Destaque |
| :--- | :--- | :--- |
| qa-documentacao | REPROVADO | 154/169 requisitos implementados; 13 parciais; 12 docs obsoletos |
| qa-funcional | REPROVADO | 559/572 casos BDD passam; 8 falhas |
| qa-seguranca | REPROVADO | RBAC-01 Crítico + falhas altas de sessão/segredos |
| qa-banco | REPROVADO | BD-01 Crítico; base íntegra; atomicidade/unicidade falhas |
| qa-ux | Aprovado com ressalvas | 0 altos/críticos; 5 baixos de a11y/responsividade |
| qa-performance | Aprovado com ressalvas | Nada quebra hoje; gargalos de escala |
| qa-execucao | REPROVADO | Confirmou em runtime RBAC-01, SEG-02, SEG-03, SEG-05, SEG-06 |

### Placar consolidado

| Severidade | Qtd | IDs consolidados |
| :--- | ---: | :--- |
| Crítica | 3 | C-01, C-02, C-03 |
| Alta | 6 | A-01 … A-06 |
| Média | 21 | M-01 … M-21 |
| Baixa | 10 | B-01 … B-10 (UX/a11y, tokens, comportamento, banco, performance) |
| Documentação obsoleta | 12 | DOC-01 … DOC-12 (+ NOM-02, MEL-01…03) |

> Mapeamento ID consolidado ↔ IDs de origem na seção 7 (Rastreabilidade).

---

## 2. Cobertura da auditoria

| Eixo | Situação |
| :--- | :--- |
| Funcional | Executado — 26 capabilities × casos BDD (559/572 passam) + `npm run build` OK |
| Regressão | Executado — 23 fluxos (login → shell → CRUD usuários → perfis → auditoria → config → perfil → logout); sem regressão nova |
| Permissões (RBAC) | **FALHA** — nenhuma rota valida permissão por módulo |
| Banco | Executado estático + runtime (MariaDB 11.8.6); 0 órfãos; 13 FKs coerentes |
| UX | Executado estático (5 ressalvas baixas); medição em browser não executada |
| Segurança | **FALHA** — RBAC, segredos, uploads, XFF, sessão |
| Performance | Executado com medições (EXPLAIN); gargalos de escala |
| Fronteira Área Pública × Administrativa | Anônimo OK (`/admin/**` → 302 login; `/api/**` → 401); RBAC quebra a fronteira autenticada |
| Execução E2E | Executado — dev server real, 24 cenários, login `ana.carolina@empresa.com.br` |

---

## 3. Achados

### 3.1 Críticos

#### C-01 · Bypass total de autorização (RBAC não aplicado nas rotas)
- **Severidade:** Crítica
- **Módulo:** Autorização / todas as APIs administrativas
- **Cenário:** conta com perfil **Leitor** (6/99 permissões) autenticada chama ações de escrita/exclusão.
- **Resultado esperado:** `403` conforme `permissoes_perfil` (spec `perfis-acesso`, `docs/07`).
- **Resultado obtido:** confirmado em runtime — `DELETE /api/usuarios/<id>` → **200 `{"ok":true}`**. Qualquer sessão executa CRUD de usuários/perfis, `PUT /api/configuracoes`, uploads e `POST /api/convite`; via convite é possível redefinir a senha do Administrador (escalada).
- **Passos para reprodução:**
  1. Admin cria usuário com perfil Leitor (`POST /api/usuarios`).
  2. Login como Leitor.
  3. `POST /api/usuarios` com corpo vazio → 400 (não 403).
  4. `DELETE /api/usuarios/<id-de-outro-usuário>` → 200 `{"ok":true}`.
- **Evidências:** `server/middleware/auth-api.ts:18-21`; ausência de `server/utils/permission.ts` e `app/composables/usePermissions.ts`; `server/api/convite/index.post.ts:93-97`; `docs/02 §3.5` (roadmap); auditoria registrou "Exclusão | Usuários" feita pelo Leitor.
- **Impacto:** o modelo de autorização é inexistente — todo o RBAC exibido na tela de Perfis é decorativo.
- **IDs de origem:** RBAC-01, E2E-01.

#### C-02 · Migration 01 executa `DROP TABLE` de todas as tabelas antes de recriar
- **Severidade:** Crítica
- **Módulo:** Migrations de banco
- **Cenário:** banco já populado com `_migrations` desalinhada (restore/limpeza de linha) ou criado a partir de `docs/bd/01`.
- **Resultado esperado:** reexecução idempotente e não destrutiva (spec `migracoes-banco`).
- **Resultado obtido:** `server/migration/01_create_tables.sql:24-46` apaga `usuarios`, `auditoria`, `configuracoes_globais`, `sessoes`, `release_week` etc. antes de recriar.
- **Passos para reprodução:** popular o banco → remover a linha `01_create_tables.sql` de `_migrations` → subir o app → schema apagado.
- **Evidências:** arquivo citado; `server/utils/migration-runner.ts` (só filtra por `_migrations`).
- **Impacto:** perda total de dados sem recuperação pela aplicação.
- **IDs de origem:** BD-01.

#### C-03 · Credencial de Administrador padrão, fixa e sem troca obrigatória
- **Severidade:** Crítica (falha de autenticação)
- **Módulo:** Bootstrap / Login
- **Cenário:** provisionamento inicial em qualquer ambiente, inclusive produção.
- **Resultado esperado:** credencial única por ambiente e/ou troca obrigatória no primeiro acesso.
- **Resultado obtido:** `ensureAdminUser` cria `ana.carolina@empresa.com.br` / **`Public@2026`** em qualquer banco vazio, com `senha_provisoria = 0`; login confirmou 200 em runtime.
- **Passos para reprodução:** banco limpo → subir → `POST /api/auth/login` com a credencial fixa → sessão de administrador.
- **Evidências:** `server/utils/bootstrap-admin.ts:8-9,30-46`; `server/plugins/migration.ts:11`; `openspec/specs/migracoes-banco/spec.md` R7.
- **Impacto:** tomada de conta administrativa imediata em qualquer instalação exposta.
- **IDs de origem:** SEG-01.

### 3.2 Altos

#### A-01 · Senha SMTP de todos os usuários em texto claro na API
- **Severidade:** Alta
- **Módulo:** Gestão de Usuários / Meu Perfil
- **Esperado:** segredo nunca retornado (ou mascarado); armazenamento protegido.
- **Resultado obtido:** `GET /api/usuarios` e `/api/usuarios/eu` devolvem `smtp.senha` em claro (`montarUsuario` → `senha: row.senha_smtp`); runtime confirmou `smtp.senha='SmtpSegredo@2026'`.
- **Passos:** criar usuário com `smtp.senha` → `GET /api/usuarios`.
- **Evidências:** `server/utils/usuarios.ts:106-113,119-122`; coluna `senha_smtp VARCHAR(255)` sem cifra (`01_create_tables.sql`).
- **Impacto:** vazamento de credenciais corporativas de e-mail para qualquer sessão (e, por C-01, qualquer perfil).
- **IDs de origem:** SEG-02, E2E-02, PERF-09.

#### A-02 · Upload valida só o MIME declarado; `.html` é servido como `text/html` (XSS armazenado)
- **Severidade:** Alta
- **Módulo:** Uploads
- **Esperado:** aceitar apenas imagens reais (magic bytes) e extensão da lista permitida.
- **Resultado obtido:** runtime confirmou `.html` declarado `image/png` → 200 em `/uploads/logomarcas/qa-evil.html`, servido `Content-Type: text/html` com `<script>` executável, mesma origem.
- **Passos:** `curl -F pasta=logomarcas -F "file=@qa-evil.html;type=image/png" /api/uploads` → abrir a URL.
- **Evidências:** `server/api/uploads/index.post.ts:32-44`; `server/utils/uploads.ts`; `nuxt.config.ts:31-36`.
- **Impacto:** hospedagem de HTML/JS arbitrário na origem autenticada (ações autenticadas via fetch).
- **IDs de origem:** SEG-03, E2E-03.

#### A-03 · `X-Forwarded-For` confiável: rate limit contornável e IP de auditoria forjável
- **Severidade:** Alta
- **Módulo:** Rate limit / Auditoria
- **Esperado:** limite por IP real; IP da trilha confiável.
- **Resultado obtido:** runtime — com IP fixo, 4ª tentativa → 429; alternando o header, **sem 429** (bucket novo por IP forjado); IP gravado na trilha é falsificável.
- **Passos:** disparar logins variando `X-Forwarded-For: 10.99.99.N`.
- **Evidências:** `server/utils/rateLimit.ts:44-51,58-83`; `server/utils/auth.ts:117-123`; `server/utils/audit.ts:97`.
- **Impacto:** brute-force/enumeração em escala e trilha com IP não confiável (mitigado parcialmente pelo lockout por e-mail, que funcionou).
- **IDs de origem:** SEG-04, E2E-04.

#### A-04 · Logout não invalida o access JWT
- **Severidade:** Alta
- **Módulo:** Autenticação / Sessão
- **Esperado:** token revogado deixa de autenticar (spec e `docs/02 §3.4` — blacklist por `jti`).
- **Resultado obtido:** runtime — após `POST /api/auth/logout`, o cookie de access reutilizado em `/api/usuarios` → **200** (só o refresh foi revogado); `token_blacklist`/`jti` existem e nunca são usados.
- **Passos:** login → backup do jar → logout → `curl -b backup /api/usuarios`.
- **Evidências:** `server/api/auth/logout/index.post.ts:10-13`; `server/utils/auth.ts:181-187,238-245`.
- **Impacto:** sessão "encerrada" válida por até ~15 min; contenção de incidentes ineficaz.
- **IDs de origem:** SEG-05, E2E-06.

#### A-05 · Desativar/excluir usuário não derruba a sessão vigente
- **Severidade:** Alta
- **Módulo:** Sessão / Gestão de Usuários
- **Esperado:** sessões do usuário inativo/excluído deixam de autenticar (spec `gestao-usuarios`).
- **Resultado obtido:** runtime — conta Inativo mantém `/api/auth/seguro` e `/api/usuarios` → 200 até o access expirar.
- **Passos:** login do usuário → admin `PUT /api/usuarios/:id/situacao {Inativo}` → usar o jar do usuário.
- **Evidências:** `server/utils/auth.ts:207-245` (checagem de situação só no refresh).
- **Impacto:** acesso administrativo residual por até ~15 min após desligamento.
- **IDs de origem:** SEG-06, E2E-07.

#### A-06 · Recuperação de senha altera o hash antes de confirmar o envio do e-mail
- **Severidade:** Alta
- **Módulo:** Login / Recuperação de senha
- **Esperado:** ou entrega a senha provisória, ou mantém o hash anterior.
- **Resultado obtido:** `UPDATE usuarios SET hash_senha` antes de `enviarEmail`; falha do Resend somente loga → a senha antiga deixa de valer e a nova não chega.
- **Passos:** acionar recuperação com o provedor de e-mail indisponível → tentar login com a senha anterior (recusado).
- **Evidências:** `server/api/auth/esqueci-senha/index.post.ts:46-63`.
- **Impacto:** conta bloqueada em falha do provedor de e-mail.
- **IDs de origem:** FUN-01, BD-06, DIV-05.

### 3.3 Médios

| ID | Título | Módulo | Esperado × Obtido | Evidência (arquivo:linha) | Impacto | IDs de origem |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M-01 | Avatar descartado no modal de usuário | Gestão de Usuários | Spec: avatar persistido; obtido: `POST`/`PUT /api/usuarios` omitem `avatar` (só `PATCH /eu` grava) | `usuarios/index.post.ts:11-22`, `[id]/index.put.ts:16-27`, `usuarios.ts:276,343` | Foto perdida; uploads órfãos | FUN-02, DIV-03, BD-11 |
| M-02 | `rate_limit.ativo` não tem efeito | Configurações Globais | Desligar não muda comportamento; `ativo=false` e 4ª req → 429 (runtime) | `rateLimit.ts:24-42` | Operador acredita ter desligado a proteção | FUN-05, DIV-01, SEG-07, E2E-05 |
| M-03 | Retenção de auditoria sem expurgo | Auditoria / Config. | UI promete expurgo; não há job/DELETE | `AbaRetencaoAuditoria.vue`; ausência de `DELETE FROM auditoria` | Trilha cresce sem limite | FUN-06, DIV-02, BD-09, PERF-06 |
| M-04 | Convite não reconhece senha existente | Gestão de Usuários | Spec: senha somente-leitura + "Redefinir"; obtido: `senhaExistente=false` fixo | `usuarios/Convite.vue:91` | Desvio do fluxo de credenciais | FUN-11, SPEC-02 |
| M-05 | Situação do perfil sem efeito operacional | Perfis / Login | Perfil Bloqueado não impede login de quem o usa | `login/index.post.ts:62-67` | Expectativa de bloqueio não atendida | FUN-12, DIV-06, SPEC-01 |
| M-06 | Filtro de data final perde o último segundo | Auditoria | `DATETIME(6)` × `<= '... 23:59:59'` | `audit.ts:121-124` | Registros somem no fim do dia | FUN-04, DIV-09, BD-10, E2E-09 |
| M-07 | Enumeração de contas por tempo de resposta | Login / Recuperação | Existente roda bcrypt + envelope; inexistente retorna direto | `login/index.post.ts`; `esqueci-senha/index.post.ts` | Enumeração apesar do corpo idêntico | SEC-05, SEG-13 |
| M-08 | Senha provisória gerada com `Math.random()` | Login / Recuperação | Esperado CSPRNG (`crypto.randomBytes`/`randomInt`) | `shared/utils/emails.ts:174-191` | Previsibilidade das credenciais provisórias | SEG-08 |
| M-09 | Host header injection nos links de e-mail | Recuperação / Convite | `getRequestURL().origin` sem allowlist | `esqueci-senha:53`; `convite:125` | Phishing a partir de e-mail legítimo | SEG-09 |
| M-10 | `nome_perfil` sem UNIQUE + corrida de e-mail devolve 500 | Perfis / Usuários | Esperado 409; obtido 500 (errno 1062 não tratado) e resolução ambígua de perfil | `perfis.ts:284`; `usuarios.ts:170-178`; schema sem UNIQUE | Ambiguidade de RBAC e contrato de erro inconsistente | BD-02 |
| M-11 | Operações multi-tabela sem transação | Configurações | `PUT /configuracoes` grava 2 tabelas sem `getTransaction` | `configuracoes.ts:109-145` | Estado parcial entre abas | BD-03 |
| M-12 | Lockout de brute-force não atômico | Login | `SELECT`+`UPDATE` sem lock → subconta em concorrência | `auth.ts:304-326` | Bloqueio pode não disparar | BD-04 |
| M-13 | `_migrations` não resiliente | Migrations | INSERT fora do laço tolerante → 1062 aborta boot; DDL com commit implícito | `migration-runner.ts:65-79` | Indisponibilidade de boot em multi-instância | BD-05 |
| M-14 | Listagens sem paginação server-side | Auditoria / Usuários | Sem `LIMIT`; full scan + filesort; ~46 MB projetados a 200k linhas | `audit.ts:144-157`; `usuarios.ts:231-237` | Degrada com o volume | PERF-01 |
| M-15 | Falta índice `auditoria(acao)` | Auditoria (banco) | `EXPLAIN` → `ALL` no filtro por ação | `SHOW INDEX` / `information_schema` | Filtros cada vez mais lentos | PERF-02, BD-08 |
| M-16 | Falta índice composto em `seguranca_eventos_login` | Config. › Segurança | `DEPENDENT SUBQUERY ALL` | EXPLAIN | Custo O(E × e-mails) | PERF-03, BD-08 |
| M-17 | N+1 na importação (até 500 SELECTs + 500 INSERTs) | Gestão de Usuários | Sem Map de perfis nem multi-row insert | `usuarios.ts:460-512` | ~1.000 round-trips por importação | PERF-04 |
| M-18 | Processamento integral no cliente sem virtualização | Frontend (listas) | Filtros/ordenação/PDF sobre o array inteiro | `useUsuarios`/`useAuditoriaDemo`/`usePerfisDemo`, `DataTable.vue` | UI aquece com milhares de linhas | PERF-05 |
| M-19 | Pool saturado pelo fanout interno | Infra DB | 3–4 queries `Promise.all` por request com `connectionLimit:10` | `db.ts:16-35` | ~3 requests concorrentes esgotam o pool | PERF-07 |
| M-20 | Seed de auditoria grava 25 registros fictícios | Auditoria | Trilha real poluída em qualquer ambiente novo | `07_seed_auditoria.sql` | Governança da trilha comprometida | SEG-10 |
| M-21 | `PUT /api/perfis/:id` sem `descricao` apaga a descrição | Perfis (API) | Atualização parcial não preserva o campo | `perfis/[id]/index.put.ts:13-17`; `perfis.ts:284` | Perda de dado para clientes que omitam o campo | FUN-03, DIV-08 |

### 3.4 Baixos e melhorias

| ID | Título | Módulo | Evidência | IDs de origem |
| :--- | :--- | :--- | :--- | :--- |
| B-01 | Botão de fechar do toast sem nome acessível | UI kit `ToastContainer` | `ToastContainer.vue:130-136` | UX-01 |
| B-02 | Botão de limpar do DatePicker sem nome acessível | UI kit `DatePicker` | `DatePicker.vue:266-273` × `Select.vue:311-319` | UX-02 |
| B-03 | Toast cortado à esquerda em telas < ~404px | UI kit `ToastContainer` | `ToastContainer.vue:90-93` | UX-03 |
| B-04 | `<select>` nativo sem foco/rótulo na DataTable | UI kit `DataTable` | `DataTable.vue:919-929` | UX-04 |
| B-05 | Gatilho do Account sem nome acessível em `<sm` | Shell `AppHeader` | `AppHeader.vue:228-247` | UX-05 |
| B-06 | Checkbox: erro `rose-600` e anel não-brand | Design system | `Checkbox.vue:128,134-151` | DS-01 |
| B-07 | Hex `#2161ef` / `#070d22` fora dos tokens | Design system | `LoginForm.vue:152`, `auth.vue:23`, `ForgotForm.vue:121,166`, `Background.vue:125`, `Kpi.vue:16` | DS-02 |
| B-08 | Resíduos `lime-500` onde o accent é `#4ed813` | Design system | `DataTable.vue:469,523,577,585`, `Checkbox.vue:155`, `CheckCard.vue:128`, `ChoiceCard.vue:140`, `UploadFiles.vue:53,55,147` | DS-03 |
| B-09 | Comportamento/consistência: 429 como warning, fallback "Super Admin", notificações de demo, classificação de auditoria, KPIs ignoram "Bloqueado", importação grava "Geral" | Shell / Auditoria / Usuários / Login | `useAuth.ts:98-99`; `navigation.ts:104-107,130-148`; `uploads/index.post.ts:45-49`; `convite/index.post.ts:115-121`; `usuarios/Kpis.vue:11-12`; `01_create_tables.sql:91` | DIV-11, DIV-12, DIV-13, DIV-14, FUN-13, FUN-14 |
| B-10 | Banco/performance: colunas de convite/mortas sem uso; `/api/configuracoes` duplicado sem cache; release de transação não garantido + I/O síncrono no upload; ordens sem índice; `docs/bd` desatualizado | Banco / Config / Uploads / Docs | `convite/index.post.ts`; `layouts/admin.vue:15` + `pages/admin/configuracoes-globais.vue:41-56`; `db.ts:57-66` + `uploads.ts:32-47`; `nome_completo`/`nome_perfil`; `docs/bd/01`, `docs/02 §4.3` | BD-07, BD-11, PERF-08, PERF-10, PERF-11 |

### 3.5 Documentação obsoleta

| ID | Documento e trecho | Estado real |
| :--- | :--- | :--- |
| DOC-01 | `docs/02 §1, §6 Passo 1` | Stack cita libs inexistentes (`jsonwebtoken`, `zod`, `@vueuse/core`, `lucide-vue-next`, `easy-template-x`, `pdf-lib`, `qrcode`); não cita `jspdf`/`jspdf-autotable` |
| DOC-02 | `docs/02 §4.2, §4.3, §4.4` | Plugin/`_migrations`/hook divergem do código real |
| DOC-03 | `docs/02 §4.5 item 2` | Diz que toda migration inicia com `USE publications;` (executáveis não usam) |
| DOC-04 | `docs/02 §2` | Árvore com `server/middleware/auth.ts` (real `auth-api.ts`), `presenca.vue`, `AppLayout`, `server/services/`, `app/types/`; "19 componentes" (real 26) |
| DOC-05 | `docs/02 §5.3, §6 Passo 6` | `usePermissions.ts` citado sem marcação de roadmap (não existe) |
| DOC-06 | `docs/02 §5.2` | Snippet de `useApiFetch` sem single-flight/SSR |
| DOC-07 | `docs/02 §3.4` | Cookies `__Host-` afirmados em geral; em dev o código usa `auth-token` |
| DOC-08 | `docs/02 §2.1`, `docs/01 §1.1` | Descrevem a Área Pública com publicações no presente (só existe placeholder) |
| DOC-09 | `docs/01:6,8`, `docs/02:36`, `docs/RL01:9` | Contagens divergentes de seções/componentes |
| DOC-10 | `docs/08 §11` | Diz auditoria de login "pendente quando existir audit.ts" (já implementada) |
| DOC-11 | `docs/07 §13` | Diz rotas `/api/perfis/**` abertas (hoje exigem sessão) |
| DOC-12 | `docs/04 §12` | Diz persistência "fase 2" (já existe) |
| NOM-02 | `app/components/*/use*Demo.ts` | Nomes `*Demo` em código de produção (API-backed) |
| MEL-01 | `configuracoes_globais` | Colunas sem spec nem UI (`nome_empresa`, `banner_*`, `notificar_por_email`…) |
| MEL-02 | Endpoints sem contrato nomeado | `/api/convite`, `/api/seguranca/*`, `/api/usuarios/eu`, `/api/configuracoes/identidade` |
| MEL-03 | Lockout por conta | Permite negação de acesso por terceiro (5 falhas/15 min) |

---

## 4. Matriz de aprovação

| Critério | Situação |
| :--- | :--- |
| Sem bugs críticos | FALHA — 3 críticos (C-01, C-02, C-03) |
| Sem bugs altos | FALHA — 6 altos (A-01…A-06) |
| Regressão inexistente | OK |
| Banco consistente | FALHA — BD-01, BD-02, BD-03, BD-05 |
| Permissões corretas | FALHA — RBAC inexistente |
| Sem bypass de fronteira / exposição de conteúdo não publicado | FALHA — bypass de autorização (C-01); fronteira anônima OK |

### VEREDITO: REPROVADO — Risco Alto

---

## 5. Escopos não aplicáveis (com motivo)

1. **Conteúdo da Área Pública** (Releases, Manuais, Escopo) — só existe o placeholder `app/pages/index.vue`; sem API pública. As views `v_*` não filtram `status` — reauditar quando houver endpoints.
2. **Módulos da sidebar sem rota** (Manuais, Release Week, Escopo, Esteira, Chamadas, Parceiros, Softwares) — exibem "Módulo em construção" (conforme spec `layout-navigation`).
3. **RBAC por módulo, `validation.ts` (Zod), `safeError.ts`, `usePermissions.ts`, middlewares `security-headers`/`rate-limit`** — roadmap declarado; auditados como risco (exceto C-01, explorável hoje).
4. **Fluxo de token de convite/recuperação com expiração** (`tokens_acesso`) — schema existe; fluxo usa senha provisória.
5. **Expurgo automático de auditoria** — inexistente (correlacionado a M-03).
6. **Soft delete** — não previsto; exclusão física, coerente com a spec.
7. **Medições de UI em navegador** (overflow 320–1440px, drawer, contraste, foco/trap) — dependem de runtime (RL01 já revalidou por CDP).
8. **Verificação da entrega real do e-mail** de recuperação — sem caixa de e-mail.
9. **Bundle size / lint / test / typecheck** — inexistentes no repositório.

---

## 6. Plano de correção por etapas

> Cada etapa deve virar um change OpenSpec (`/opsx-propose` → apply → `/opsx-sync` → `/opsx-archive`) e terminar com `npm run build` + verificação visual em `/design` quando houver UI.

### Etapa 1 — Autorização (desbloqueio de Critical) · **obrigatória**
- C-01: implementar `requirePermission(event, módulo, ação)` em todas as rotas administrativas (derivando de `permissoes_perfil` + `extras`), aplicar `403`, e `.can()` no cliente (`usePermissions.ts`); restringir `convite`/recuperação a perfis autorizados.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `rbac-require-permission` (arquivos novos `server/utils/permission.ts` e `app/composables/usePermissions.ts`; `requirePermission` aplicado nas rotas de usuários/perfis/auditoria/configurações/segurança/uploads; `GET /api/usuarios/eu/permissoes` session-only; guarda anti-lockout `409` em `server/utils/perfis.ts`). Verificado por `npm run build` e E2E real: Leitor → `403` em POST/DELETE de usuários e `PUT /api/configuracoes` (antes `200`); Administrador → `200/201`; autoatendimento `200`; lockout → `409` com a matriz do Administrador preservada (`99/99`).

### Etapa 2 — Banco e bootstrap
- C-02: remover os `DROP` da migration 01 (ou mover para provisionamento controlado).
- C-03: condicionar o bootstrap do admin a ambiente demo + forçar troca no primeiro login.
- M-10: UNIQUE em `perfis_acesso.nome_perfil`; tratar errno 1062 como 409.
- M-11, M-12, M-13: transações (`FOR UPDATE`, multi-tabela) e resiliência de `_migrations`.
- M-15, M-16: índices `auditoria(acao)` e `seguranca_eventos_login(email_alvo, tipo, ocorrido_em)`.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `endurecer-banco-e-bootstrap`: removidos os `DROP` do `01_create_tables.sql`; nova migration `08_integridade_e_indices.sql` (UNIQUE de perfil + índices de auditoria/segurança); bootstrap restrito a `NODE_ENV !== 'production'` e com `senha_provisoria = 1`; troca obrigatória no 1º login (`/admin/primeiro-acesso`, bloqueio `403` no middleware, reemissão do access em `trocar-senha`); `409` de nome de perfil duplicado; `atualizarConfiguracoes` e `registrarFalhaLogin` em transação; `_migrations` tolera `1062`. Verificado por `npm run build` e E2E real: convite→login provisório→`403`→troca→acesso liberado; `409` de nome duplicado; boot de produção não cria admin e sobe com 8 migrations sem perda de dados.

### Etapa 3 — Sessão, segredos e uploads
- A-01: não retornar `senha_smtp` (mascarar/omitir) e cifrar em repouso.
- A-02: validar magic bytes + whitelist de extensão; `nosniff`/`Content-Disposition` para `/uploads/**`.
- A-03: `X-Forwarded-For` só atrás de proxy confiável.
- A-04, A-05: revogação de sessão no servidor (logout, desativação, exclusão).
- A-06: inverter a ordem da recuperação (enviar antes de gravar).
- M-07, M-08, M-09: equalizar tempo de login, CSPRNG, origin fixa nos e-mails.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `endurecer-sessao-segredos-e-uploads`: revogação de sessão por `token_version` (middleware valida conta ativa + versão; logout/desativação incrementam); senha SMTP nunca devolvida (indicador `temSenha`) e cifrada em repouso (AES-256-GCM, `SMTP_ENC_KEY`, backfill no boot); uploads validam magic bytes e `/uploads/**` servido com `nosniff`; IP do rate limit/auditoria é o da conexão (XFF só com `TRUSTED_PROXIES`); recuperação grava a senha só após o envio; tempo de login/recuperação uniforme; senha provisória por CSPRNG; links de e-mail usam `APP_URL`. Verificado por `npm run build` e E2E real (logout/desativação → `401`; `smtp.senha` vazio + `temSenha`; upload `.html` → `400`; `nosniff` presente; XFF forjado ausente da trilha; senha antiga preservada em falha de envio).

### Etapa 4 — Funcional e UX
- M-01: persistir `avatar` no `POST`/`PUT` de usuários.
- M-02: honrar `rate_limit.ativo` no limitador.
- M-03: expurgo de auditoria conforme `dias_retencao_auditoria`.
- M-04: reconhecer senha existente no convite.
- M-05: definir efeito da situação do perfil.
- M-06: filtro de data inclusivo.
- M-21: `PUT /api/perfis/:id` preservar campo omitido.
- B-01…B-09: nomes acessíveis, responsividade do toast, tokens de cor, textos/comportamentos.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `correcoes-funcionais-e-ux`: avatar persistido no POST/PUT (M-01); `rate_limit.ativo` honrado (M-02); expurgo de auditoria por **EVENTO** MariaDB diário às 03:00 (`10_auditoria_expurgo_event.sql`; M-03); convite sempre com nova provisória (M-04); perfil não-Ativo bloqueia login e não é atribuível (M-05); filtro de data final inclusivo (M-06); `PUT /api/perfis/:id` parcial (M-21); acessibilidade/responsividade (B-01…B-05), tokens do kit (B-06…B-08) e textos/estado (B-09). Verificado por `npm run build` + E2E: avatar persistiu; descrição preservada no PUT parcial; `rate_limit.ativo=false` sem 429; login de perfil Inativo → `403`; evento `ev_expurgo_auditoria` ENABLED (scheduler ON).

### Etapa 5 — Performance
- M-14: paginação server-side (ou `LIMIT` de segurança) em auditoria/usuários.
- M-17: corrigir N+1 da importação (Map de perfis + multi-row insert).
- M-18, M-19: virtualização/debounce e ajuste do pool.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `paginacao-server-side-e-performance`: `GET /api/auditoria` e `GET /api/usuarios` paginam no servidor com filtros/busca/KPIs e modo exportação; `UiDataTable` ganhou modo servidor + busca debounced; importação sem N+1 (Map de perfis + multi-row INSERT); pool configurável (`DB_POOL_LIMIT`) e `getTransaction` liberando conexão em `finally`; upload com I/O assíncrono; dedup do GET de configurações; projeção de usuários sem `senha_smtp`. Verificado por `npm run build` + E2E: auditoria página 2 distinta (total 95), export completo; usuários paginados (total 3, KPIs do servidor), export completo; importação de 2 linhas; base restaurada.

### Etapa 6 — Documentação
- DOC-01…DOC-12, NOM-02, MEL-01…MEL-03: atualizar `docs/02`, `docs/01`, `docs/04`, `docs/07`, `docs/08`, `docs/bd/01`, `docs/bd/02`.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `documentacao-e-renomeacoes` (skip_specs, sem deltas): `docs/02` (stack real, árvore, `_migrations`, snippet do plugin/`useApiFetch`, cookies dev/prod, flags de roadmap, endpoints auxiliares §3.7); `docs/01` (26 componentes/20 seções; Área Pública roadmap); `docs/04`/`docs/07`/`docs/08` (pendências resolvidas + MEL-01/03); `docs/bd/01` (complemento de objetos das migrations 03–10) e `docs/bd/02` (removido o INSERT do admin com hash placeholder); MEL-02 (contratos de endpoints nomeados); NOM-02 (renome de `useUsuariosDemo`→`useUsuariosModelo`, `usePerfisDemo`→`usePerfisModelo`, `useAuditoriaDemo`→`useAuditoriaModelo` e tipos `*Modelo`). Verificado por `npm run build`.

---

## 7. Rastreabilidade de IDs

| Consolidado | Especialistas |
| :--- | :--- |
| C-01 | RBAC-01, E2E-01 |
| C-02 | BD-01 |
| C-03 | SEG-01 |
| A-01 | SEG-02, E2E-02, PERF-09 |
| A-02 | SEG-03, E2E-03 |
| A-03 | SEG-04, E2E-04 |
| A-04 | SEG-05, E2E-06 |
| A-05 | SEG-06, E2E-07 |
| A-06 | FUN-01, BD-06, DIV-05 |
| M-01 | FUN-02, DIV-03, BD-11 |
| M-02 | FUN-05, DIV-01, SEG-07, E2E-05 |
| M-03 | FUN-06, DIV-02, BD-09, PERF-06 |
| M-04 | FUN-11, SPEC-02 |
| M-05 | FUN-12, DIV-06, SPEC-01 |
| M-06 | FUN-04, DIV-09, BD-10, E2E-09 |
| M-07 | SEC-05, SEG-13 |
| M-08 | SEG-08 |
| M-09 | SEG-09 |
| M-10 | BD-02 |
| M-11 | BD-03 |
| M-12 | BD-04 |
| M-13 | BD-05 |
| M-14 | PERF-01 |
| M-15 | PERF-02, BD-08 |
| M-16 | PERF-03, BD-08 |
| M-17 | PERF-04 |
| M-18 | PERF-05 |
| M-19 | PERF-07 |
| M-20 | SEG-10 |
| M-21 | FUN-03, DIV-08 |
| B-01…B-05 | UX-01…UX-05 |
| B-06…B-08 | DS-01…DS-03 |
| B-09 | DIV-11, DIV-12, DIV-13, DIV-14, FUN-13, FUN-14 |
| B-10 | BD-07, BD-11, PERF-08, PERF-10, PERF-11 |

---

## 8. Encerramento

A auditoria cobriu funcional, regressão, permissões, banco, UX, segurança, performance e a fronteira Área Pública × Área Administrativa, com execução E2E real. O sistema está funcionalmente coerente na volumetria atual, mas **não está apto a continuar como base de desenvolvimento sem corrigir as Etapas 1 a 3** — em especial o RBAC (hoje inexistente) e os vetores de exposição de credenciais e XSS. Nenhum arquivo foi alterado; o ambiente de execução foi limpo.
