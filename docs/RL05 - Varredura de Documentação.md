# RL05 – Varredura de Documentação (Conformidade Documentação × Implementação)

**Projeto:** Publications (Dicas Teorema)
**Agente:** QA de Documentação (docs/qa/04) — última barreira de qualidade
**Data:** 2026-10-17
**Escopo:** working tree atual (árvore com alterações não commitadas)
**Fonte da verdade:** `openspec/specs/**` (30 capabilities, validadas com `openspec validate --specs --strict`)
**Apoio:** `docs/01` a `docs/09`, `docs/bd/01`, `AGENTS.md`, `docs/qa/00` e `docs/qa/04`
**Veredito:** Aprovado com ressalvas (0 crítica, 0 alta, 4 média, 9 baixa)

> Nenhum arquivo de código, schema ou dado foi alterado. Apenas auditoria e o presente relatório.

---

## 1. Resumo executivo

- **Funcionalidade:** varredura de conformidade entre a documentação/spec (fonte da verdade) e a implementação real (working tree).
- **Status:** 30 specs válidas (`openspec validate --specs --strict` sem erro); backend, RBAC, migrations, auth, uploads, auditoria e o kit de UI existem e estão integrados. A varredura não encontrou bypass da fronteira Área Pública × Área Administrativa nem falha de RBAC.
- **Aprovado ou reprovado:** **Aprovado com ressalvas**.
- **Risco:** baixo a moderado. Os achados são de natureza documental (specs desatualizadas/contraditórias e docs de apoio obsoletos) e uma validação de convite feita sobre o payload em vez da conta-alvo. Nenhum deles expõe conteúdo restrito, concede acesso indevido ou corrompe dados.

---

## 2. Cobertura executada

| Frente | Situação | Observação |
|---|---|---|
| Funcional | Coberta (leitura de código) | Rotas e componentes conferidos contra os cenários das specs. |
| Regressão documental | Coberta | Comparação spec × código nos 30 capabilities. |
| Permissões (RBAC) | Coberta | `requirePermission` e catálogo do `autorizacao-rbac`. |
| Banco de dados | Coberta | Migrations 01–12, seeds, expurgo e integridade. |
| UX / design system | Coberta | 16 specs `design-system/*` × `docs/01` × `app/components/ui/*`. |
| Segurança | Coberta (leitura) | Rate limit, lockout, segredos, uploads, nosniff/CSP. |
| Performance | Parcial | Não mensurada; apenas contratos de paginação/ordenação server-side. |
| Fronteira Pública × Admin | Coberta | Guard de cliente + middleware de API. |
| Escopos não aplicáveis | Declarados | Ver seção 7. |

---

## 3. Matriz de rastreabilidade (requisito → spec → implementação → status)

| # | Capability | Reqs | Implementação principal | Status |
|---|---|---|---|---|
| 1 | `auditoria` | 17 | `server/api/auditoria/index.get.ts`, `server/utils/audit.ts`, `app/components/auditoria/*` | Implementado |
| 2 | `autorizacao-rbac` | 4 | `server/utils/permission.ts` + `requirePermission` nas rotas | Implementado (ressalva DOC-03) |
| 3 | `busca-cep` | 4 | `app/composables/useBuscaCep.ts`, `useViaCep.ts`, `AbaEndereco.vue`, `Formulario.vue` | Implementado |
| 4 | `configuracoes-globais` | 15 | `server/api/configuracoes/*`, `server/api/seguranca/*`, `app/components/configuracoes/*` | Implementado |
| 5 | `design-system/*` (16 specs) | 78 | `app/components/ui/*`, `app/pages/design.vue` | Implementado |
| 6 | `gestao-usuarios` | 25 | `server/api/usuarios/*`, `server/api/convite`, `server/utils/usuarios.ts`, `app/components/usuarios/*` | Implementado (ressalvas DOC-01/DOC-06/DOC-12) |
| 7 | `login` | 16 | `server/api/auth/*`, `server/utils/auth.ts`, `app/pages/admin/login.vue`, `app/components/auth/*` | Implementado |
| 8 | `meu-perfil` | 12 | `server/api/usuarios/eu/*`, `app/pages/admin/meu-perfil.vue`, `app/components/perfil/*` | Implementado |
| 9 | `migracoes-banco` | 12 | `server/migration/*`, `server/utils/migration-runner.ts`, `server/plugins/migration.ts` | Implementado (ressalva DOC-11) |
| 10 | `pagina-404` | 3 | `app/error.vue` | Implementado |
| 11 | `perfis-acesso` | 22 | `server/api/perfis/*`, `server/utils/perfis.ts`, `app/components/perfis/*` | Implementado |
| 12 | `primeiro-acesso` | 3 | `app/middleware/auth.global.ts`, `server/middleware/auth-api.ts`, `app/pages/admin/primeiro-acesso.vue` | Implementado |
| 13 | `revogacao-sessao` | 3 | `server/utils/auth.ts`, `server/middleware/auth-api.ts` | Implementado |
| 14 | `uploads` | 3 | `server/api/uploads/index.post.ts`, `server/utils/uploads.ts`, `nuxt.config.ts` (routeRules) | Implementado (ressalva DOC-02) |
| 15 | `vitrine` | 4 | `app/pages/design.vue` | Implementado |

---

## 4. Bugs / Achados

### RL05-DOC-01 — Spec de Gestão de Usuários diz que a exclusão é "irrestrita", mas o servidor bloqueia o último administrador com 409

- **Severidade:** Média
- **Módulo:** Gestão de Usuários / Perfis de Acesso (RBAC)
- **Cenário:** confirmação de exclusão do último usuário administrador essencial.
- **Resultado esperado (spec `perfis-acesso`):** `DELETE /api/usuarios/:id` que removeria a última administração essencial ativa responde `409` e nada é gravado.
- **Resultado obtido (spec `gestao-usuarios`):** o documento afirma Exclusão "irrestrita (qualquer perfil, sem bloqueio por papel)", inclusive Administrador — o que contradiz o código e a spec de perfis.
- **Evidências (documentação divergente):**
  - `openspec/specs/gestao-usuarios/spec.md:477` — "A exclusão SHALL ser irrestrita (qualquer perfil, sem bloqueio por papel)".
  - `openspec/specs/gestao-usuarios/spec.md:501-503` — cenário "Exclusão é irrestrita" (inclusive Administrador).
- **Evidências (fonte correta que o código segue):**
  - `openspec/specs/perfis-acesso/spec.md:562-591` — "A gravação da matriz protege contra o lockout administrativo" (desativar/excluir o último admin → `409`).
  - `docs/06 - Gestão de Usuários e Convite.md:48` — "com guarda anti-lockout do administrador essencial".
- **Implementação:**
  - `server/api/usuarios/[id]/index.delete.ts:10` → chama `excluirUsuario`.
  - `server/utils/usuarios.ts:555-568` → `excluirUsuario` chama `garantirAdministracaoApos(tx)`.
  - `server/utils/perfis.ts:382-388` → lança `409` quando a contagem de administradores essenciais ativos chega a zero.
- **Impacto:** a spec `gestao-usuarios` induz a erro implementadores e QA; o código está correto à luz de `perfis-acesso`.
- **Correção recomendada (documentação):** revisar `openspec/specs/gestao-usuarios/spec.md` para ressalvar a guarda anti-lockout (exclusão irrestrita **exceto** quando deixaria o sistema sem administração essencial — `409`), alinhando-a a `perfis-acesso` e a `docs/06`.

### RL05-DOC-02 — Spec de Uploads tem contradição interna sobre PNG+HTML e diverge do código

- **Severidade:** Média
- **Módulo:** Uploads
- **Cenário:** conteúdo com assinatura PNG válida seguida de payload HTML/script, com nome terminando em extensão executável.
- **Resultado esperado (cenário isolado):** `400` e nada gravado.
- **Resultado obtido (código):** `200` e gravação do arquivo com extensão **canônica** `.png` (a extensão enviada é descartada); servido com `X-Content-Type-Options: nosniff` e CSP `sandbox`.
- **Evidências (contradição dentro da própria spec):**
  - `openspec/specs/uploads/spec.md:41-43` — cenário exige `400`.
  - `openspec/specs/uploads/spec.md:24-31` e `:45-47` — o requisito e o cenário irmão admitem gravar com extensão segura derivada do tipo real.
- **Implementação:**
  - `server/api/uploads/index.post.ts:54-63` — aceita o tipo canônico pelos magic bytes e grava.
  - `server/utils/uploads.ts:28-44` — `detectarTipoImagem` valida apenas a assinatura inicial.
  - `server/utils/uploads.ts:84-108` — `gravarUpload` deriva a extensão do tipo detectado.
  - `nuxt.config.ts:44-52` — `nosniff` + CSP `sandbox` no servimento de `/uploads/**`.
- **Impacto:** expectativa documental inconsistente; não há execução de script na origem (defesas de servimento ativas).
- **Correção recomendada (documentação):** ajustar o cenário `:41-43` para permitir a gravação com extensão canônica (comportamento pretendido pela change RL04-C-01), ou decidir formalmente na spec por reforçar a validação de conteúdo. Manter o requisito e o cenário coerentes entre si.

### RL05-DOC-03 — Catálogo do RBAC não lista duas rotas implementadas

- **Severidade:** Baixa
- **Módulo:** autorizacao-rbac
- **Resultado esperado:** o catálogo "mapeia cada rota para módulo e ação" (e as portas somente-sessão listadas).
- **Resultado obtido:** duas rotas reais não constam do catálogo.
- **Evidências:**
  - `openspec/specs/autorizacao-rbac/spec.md:39-52` — lista de rotas (não inclui `GET /api/usuarios/:id` nem `GET /api/configuracoes/shell`).
  - `openspec/specs/autorizacao-rbac/spec.md:70-75` — portas públicas/autoatendimento (não inclui `GET /api/configuracoes/shell`).
- **Implementação:**
  - `server/api/usuarios/[id]/index.get.ts:7` — `requirePermission(event, 'gestao-usuarios', 'visualizar')`.
  - `server/api/configuracoes/shell/index.get.ts:6-13` — somente sessão (sem permissão de módulo), conforme `configuracoes-globais`.
- **Impacto:** lacuna de rastreabilidade; o catálogo deixa de ser a fonte completa de autorização.
- **Correção recomendada (documentação):** acrescentar `GET /api/usuarios/:id` → `gestao-usuarios`/`visualizar` e registrar `GET /api/configuracoes/shell` na seção de rotas que exigem apenas sessão.

### RL05-DOC-04 — `AGENTS.md` desatualizado e com contradição interna

- **Severidade:** Média
- **Módulo:** documentação de processo
- **Resultado esperado:** doc refletindo o repositório atual.
- **Resultado obtido:** o texto descreve um "starter" e afirma que não há lint/test/auth/DB, que `server/`/`shared/` não existem e que o shell mora em `layouts/default.vue`.
- **Evidências (documento):**
  - `AGENTS.md:3-11` — "Fresh Nuxt 4.5.2 + Vue 3 starter" e "No test, lint, format, state-management, auth, or DB tooling exists yet".
  - `AGENTS.md:28` — "`server/` … and `shared/` … — neither exists yet".
  - `AGENTS.md:42` — "shell de `app/layouts/default.vue`".
  - `AGENTS.md:58` — "(não existe lint/test — a build e o olho são o gate)".
- **Evidências (código):**
  - `package.json:11-13` — scripts `lint`, `typecheck`, `test`; devDeps `eslint`, `vitest`, `typescript-eslint` (`package.json:28-36`).
  - `eslint.config.mjs`; `tests/cache.test.ts`, `tests/uploads.test.ts`; `vitest.config.ts`.
  - `server/` e `shared/utils/emails.ts` existem.
  - Shell real em `app/layouts/admin.vue:1-56`; `app/layouts/default.vue` é o layout da Área Pública (`:1-5`).
- **Impacto:** o documento orienta agentes/desenvolvedores de forma equivocada (inclusive a supor que os gates não existem).
- **Correção recomendada (documentação):** reescrever as seções "What this repo is", "Directory layout" e "Verificação" do `AGENTS.md`, removendo a contradição e apontando `app/layouts/admin.vue` como shell.

### RL05-DOC-05 — `docs/08` afirma que não existe lint/test no repositório

- **Severidade:** Baixa
- **Módulo:** documentação da tela de Login
- **Evidência (documento):** `docs/08 - Login de Autenticação.md:308` — "não há lint/test no repositório".
- **Evidência (código):** `package.json:11-13`, `eslint.config.mjs`, `tests/`, `vitest.config.ts`.
- **Impacto:** mesma contradição do DOC-04, em documento de tela.
- **Correção recomendada (documentação):** atualizar a observação de verificação para citar `npm run lint`, `npm run test` e `npm run typecheck`.

### RL05-DOC-06 — `POST /api/convite` valida a situação do payload, não a da conta-alvo

- **Severidade:** Média
- **Módulo:** Gestão de Usuários / Convite
- **Cenário:** convite para um e-mail que **já existe** no banco com situação Inativo/Bloqueado.
- **Resultado esperado:** recusa, pois "só usuário Ativo pode ser convidado" (`docs/06:46`) e um usuário não-Ativo não autenticaria com as credenciais.
- **Resultado obtido:** o servidor valida `body.situacao` (enviado pelo cliente, com default `Ativo`) em vez de ler a situação da conta existente. No caminho find-or-create, o `UPDATE` apenas substitui `hash_senha`/`senha_provisoria` e **não** altera a situação — a conta permanece Inativa/Bloqueada.
- **Evidências:**
  - `server/api/convite/index.post.ts:51-54` — `situacao` lida do corpo com fallback `'Ativo'`.
  - `server/api/convite/index.post.ts:86-91` — recusa apenas se `situacao !== 'Ativo'` (valor do payload).
  - `server/api/convite/index.post.ts:108-122` — no caminho "existente", não lê nem valida a situação atual da conta.
  - `app/components/usuarios/Convite.vue:151` — o cliente envia `situacao: alvo.status` (mascara o problema apenas na UI).
  - `server/api/convite/index.post.ts:84-91` — comentário declara a intenção ("exige usuário Ativo (RL04 B-18)").
- **Impacto:** a guarda de negócio é aplicável pela API apenas quando o cliente é cooperativo; via requisição direta, uma conta não-Ativa pode ser "convidada" (embora continue sem autenticar, pois o login checa a situação).
- **Correção recomendada (código):** no ramo de conta existente, buscar a `situacao` no banco e recusar `400` quando não-Ativa (ou promovê-la a Ativo de forma explícita e documentada), deixando de confiar no payload. Complementar a spec/documentação com esse contrato.

### RL05-DOC-07 — `docs/01` descreve o agrupamento da DataTable com resíduos `lime-500` que não existem mais

- **Severidade:** Baixa
- **Módulo:** design system / DataTable
- **Evidência (documento):** `docs/01 - design_system.md:695` — "estado drag-over `bg-lime-50/80 ring-lime-500/30`; … `border-l-lime-500` → `sky` → `slate-200`".
- **Evidência (código):** `app/components/ui/DataTable.vue:552-562` — `border-l-brand-accent` (nível 1 recolhido) / `border-l-sky-500` / `border-l-slate-200`; `:663` — drag-over `bg-brand-accent/10 border-brand-accent ring-2 ring-brand-accent/30`.
- **Impacto:** doc de design descreve estado visual inexistente, contrariando a spec `brand-tokens` (accent via token, sem `lime-500`).
- **Correção recomendada (documentação):** atualizar `docs/01` §5.11 para `brand-accent`/`sky`/`slate-200` e o drag-over em `brand-accent`.

### RL05-DOC-08 — `docs/02` aponta `app/types/<modulo>.ts`, diretório que não existe

- **Severidade:** Baixa
- **Módulo:** arquitetura
- **Evidência (documento):** `docs/02 - Guia de Arquitetura e Migrations.md:87` — "contratos e tipos em `app/types/<modulo>.ts`".
- **Evidência (código):** não existe `app/types/`; os contratos vivem junto aos componentes, ex.: `app/components/usuarios/useUsuariosModelo.ts`, `app/components/perfis/usePerfisModelo.ts`, `app/components/auditoria/useAuditoriaModelo.ts`.
- **Impacto:** convenção documentada não corresponde à estrutura real.
- **Correção recomendada (documentação):** corrigir o caminho/convenção da seção §2.2.

### RL05-DOC-09 — Nomenclatura inconsistente: "Configurações Gerais" × "Configurações Globais"

- **Severidade:** Baixa
- **Módulo:** configuracoes-globais
- **Evidência (documento):** arquivo e título `docs/04 - Configurações Gerais.md:1` — "# 04 - Configurações Gerais — Área Administrativa".
- **Evidência (spec/página):** `openspec/specs/configuracoes-globais/spec.md:14` — título "Configurações Globais do Sistema"; rota `/admin/configuracoes-globais`; menu "Configurações Globais".
- **Impacto:** termo divergente entre spec, navegação e documentação de tela.
- **Correção recomendada (documentação):** renomear título e arquivo para "Configurações Globais".

### RL05-DOC-10 — `docs/03` lista `app/layouts/default.vue` como fonte do shell

- **Severidade:** Baixa
- **Módulo:** shell / layout
- **Evidência (documento):** `docs/03 - Header e Sidebar.md:7` — cabeçalho de arquivos-fonte cita `app/layouts/default.vue` (o corpo do documento já cita `admin.vue` em `:43`, `:356`).
- **Evidência (código):** `app/layouts/admin.vue:1-56` é o shell (header + sidebar); `app/layouts/default.vue:1-5` é o layout da Área Pública.
- **Impacto:** cabeçalho de referência desatualizado.
- **Correção recomendada (documentação):** trocar `default.vue` por `admin.vue` no cabeçalho de arquivos-fonte.

### RL05-DOC-11 — Migration `07_seed_auditoria.sql` sem bloco de rollback

- **Severidade:** Baixa
- **Módulo:** migracoes-banco
- **Resultado esperado (spec):** "Os arquivos SQL de `server/migration/` SHALL seguir as convenções do `docs/02` §4.5: … bloco de rollback comentado ao final".
- **Resultado obtido:** `07_seed_auditoria.sql` não possui bloco `-- REVERTER (ROLLBACK)`; as demais 11 migrations possuem.
- **Evidências:**
  - `openspec/specs/migracoes-banco/spec.md:57-62` (requisito + cenário "Migration nova respeita a convenção").
  - `server/migration/07_seed_auditoria.sql:1-40` (sem seção de rollback).
- **Impacto:** violação pontual de convenção; rastreabilidade de reversão incompleta.
- **Correção recomendada (código/documentação):** acrescentar o bloco comentado apontando o `DELETE FROM auditoria WHERE id LIKE 'log-seed-%'` e a remoção do registro em `_migrations`.

### RL05-DOC-12 — Comentário obsoleto no endpoint de convite ("base demo")

- **Severidade:** Baixa
- **Módulo:** gestao-usuarios
- **Evidência (documento em código):** `server/api/convite/index.post.ts:6` — "A listagem de /admin/gestao-usuarios continua a base demo."
- **Evidência (código real):** `app/pages/admin/gestao-usuarios.vue` carrega via API e `server/api/usuarios/index.get.ts:11-24` serve a listagem persistida; a spec `gestao-usuarios` exige a API (`spec.md:321-342`).
- **Impacto:** comentário contradiz o comportamento atual.
- **Correção recomendada:** atualizar/remover o comentário.

### RL05-DOC-13 — `docs/02` rotula "403 permissão" como roadmap, contrariando §3.5

- **Severidade:** Baixa
- **Módulo:** arquitetura
- **Evidência (documento):** `docs/02 - Guia de Arquitetura e Migrations.md:183` — "(400 validação, 404 inexistente, 409 conflito, 403 permissão — roadmap)".
- **Evidência (mesmo documento/código):** `docs/02:216-218` e `:262-272` afirmam que o RBAC "já é aplicado"; `server/utils/permission.ts:78-85` responde `403`.
- **Impacto:** ambiguidade documental que sugere que a autorização por módulo ainda não existe.
- **Correção recomendada (documentação):** reposicionar o rótulo "roadmap" (aplica-se à centralização `safeError`/Zod, não ao `403`).

---

## 5. Verificações obrigatórias

### 5.1 Fronteira Área Pública × Área Administrativa

- Cliente: `app/middleware/auth.global.ts:21-42` libera a Área Pública e as telas de autenticação (`/admin/login`, `/admin/esqueci-senha`); demais rotas `/admin/**` exigem sessão (redirect `?redirect=`) e conduzem sessões provisórias a `/admin/primeiro-acesso`.
- Servidor: `server/middleware/auth-api.ts:10-27` exige sessão em `/api/**`, isentando apenas `/api/auth/*` e `/api/configuracoes/identidade`; valida revogação (`sessaoAtivaNoServidor`) e bloqueia senha provisória (`:34-39`).
- **Resultado:** sem bypass identificado. A omissão do `GET /api/configuracoes/shell` no catálogo (DOC-03) é lacuna documental, não brecha — o endpoint é intencionalmente somente-sessão (`configuracoes-globais`, `useConfiguracoesGlobais.ts:70-86`).

### 5.2 RBAC

- `server/utils/permission.ts:51-85` carrega a matriz do perfil da sessão (uma query, memoizada) e nega com `403`.
- Rotas administrativas aplicam `requirePermission` (ex.: `server/api/usuarios/index.get.ts:12`, `server/api/perfis/index.post.ts:7`, `server/api/auditoria/index.get.ts:15`, `server/api/configuracoes/index.put.ts:10`, `server/api/seguranca/liberar/index.post.ts:11`, `server/api/uploads/index.post.ts:36-38`).
- Cliente: `app/composables/usePermissions.ts:32-34` expõe `.can(modulo, acao)`.
- **Resultado:** RBAC efetivo; sem bypass. Ressalva documental DOC-03 (catálogo incompleto) e a guarda de matriz/anti-lockout implementada (`server/utils/perfis.ts:382-388`).

---

## 6. Escopos não aplicáveis (declarados, não são falha)

| Escopo | Motivo | Evidência |
|---|---|---|
| Conteúdo público (Releases Week, Manuais, Escopo de Projetos) | Roadmap; a Área Pública tem apenas o placeholder `/` | `app/pages/index.vue:1-10`, `docs/02:69` |
| `server/utils/validation.ts` (Zod) | Roadmap; validação ad hoc com `createError(400)` | arquivo inexistente; `docs/02:19,176-177,214` |
| `server/utils/safeError.ts` (`handleApiError`) | Roadmap | arquivo inexistente; `docs/02:184,232-233` |
| Headers globais de segurança / CSRF token | Roadmap (não há middleware `security-headers`; rate limit é chamado nas rotas de auth) | `docs/qa/00:26` |
| Envio real de e-mail | Implementado via Resend (não é lacuna) | `server/utils/mailer.ts:24-53` |
| Soft delete | Não adotado; exclusões físicas com FK `CASCADE`/`RESTRICT` | `server/utils/perfis.ts:332-354`, `server/api/usuarios/[id]/index.delete.ts` |

---

## 7. Placar

| Severidade | Quantidade | IDs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 4 | DOC-01, DOC-02, DOC-04, DOC-06 |
| Baixa | 9 | DOC-03, DOC-05, DOC-07, DOC-08, DOC-09, DOC-10, DOC-11, DOC-12, DOC-13 |
| **Total** | **13** | — |

Distribuição por natureza: regra de negócio divergente (DOC-01, DOC-06); divergência de contrato/documento de segurança (DOC-02); documentação obsoleta/contraditória (DOC-04, DOC-05, DOC-07, DOC-08, DOC-09, DOC-10, DOC-13); lacuna de rastreabilidade (DOC-03); convenção de artefato (DOC-11); comentário de código obsoleto (DOC-12).

---

## 8. Veredito

**Aprovado com ressalvas.** Não há bugs críticos nem altos, não há regressão, o banco permanece consistente, as permissões estão corretas e não foi identificado bypass da fronteira de áreas nem exposição de conteúdo não publicado. Os 13 achados são documentais (specs/docs/comentários) e uma validação de convite a ser endurecida no servidor (DOC-06). Recomenda-se corrigir as ressalvas no mesmo ciclo, priorizando DOC-01, DOC-02, DOC-04 e DOC-06.