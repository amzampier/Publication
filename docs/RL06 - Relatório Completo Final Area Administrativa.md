# RL06 – Relatório Completo Final da Área Administrativa

| Campo | Valor |
| :--- | :--- |
| **ID** | RL06 |
| **Tipo** | Auditoria final completa (7 especialidades + execução E2E real) da Área Administrativa antes do início da Área Pública |
| **Base normativa** | `docs/qa/00-arquitetura-e-regras-gerais.md`, `docs/qa/01..07`, `openspec/specs/**` (42 capabilities — 22 funcionais + 20 de design-system), `docs/01 - design_system.md`, `docs/02 - Guia de Arquitetura e Migrations.md`, `docs/03..17`, `docs/bd/01`, `docs/bd/02` |
| **Data** | 23/10/2026 |
| **Commit auditado** | `85c79c8` — “Ajustes Finos nas telas da Esteira e Lancamento das Chamadas” |
| **Escopo auditado** | Toda a Área Administrativa implementada: shell/navegação, autenticação (login, recuperação, primeiro acesso, logout/refresh/revogação), Gestão de Usuários + convite + importação, Perfis de Acesso/RBAC, Auditoria, Configurações Globais (identidade, e-mail, segurança/rate limit/lockout), Meu Perfil, Softwares, Parceiros, Release Week, Manuais Mensais, Escopo de Projetos, Lançar as Chamadas, Esteira de Revisão, Painel Executivo, Uploads, 404, vitrine `/design` e design system. Área Pública: apenas o placeholder `/` (próxima etapa), com verificação obrigatória da fronteira. |
| **Capabilities** | 42 specs em `openspec list --specs`; `openspec validate --specs --strict` → **42/42 passed, 0 failed**; nenhuma change ativa (apenas `archive/`) |
| **Banco** | MariaDB 11.8.6 / `publications`; 30 migrations aplicadas (`01`–`30`); 21 tabelas base (20 de aplicação + `_migrations`) e 4 views |
| **Método** | Análise estática + `EXPLAIN`/medições + consultas read-only no MariaDB + testes HTTP reais + execução E2E no dev server (`localhost:3000`) + gates (`lint`, `test`, `typecheck`, `build`) |
| **Alterações de código** | **Nenhuma.** Auditoria somente leitura; os agentes de QA só escreveram dados de teste, com limpeza declarada na seção 10 |
| **Veredito** | **Aprovado com ressalvas (M-07)** — snapshot histórico: REPROVADO em 23/10 |
| **Risco** | **Baixo/operacional** — M-07 (grants da conta de dev) e I-01; sem bloqueadores críticos/altos no estado atual |

> **Nota de snapshot (27/10/2026):** este relatório é o snapshot de 23/10/2026, commit `85c79c8`. As contagens do Apêndice D (42 specs, 30 migrations, 84 rotas, 18 páginas, 36 componentes e 15 composables) são históricas. No estado atual (commit `203aece`): **46 specs, 42 migrations, 86 rotas, 18 páginas, 39 componentes e 16 composables**; o antigo `docs/18` foi removido. Para o estado vigente, consulte `docs/02` e `openspec/specs`.

> **Revalidação 27/10/2026 (pós-RL06):** A-04 fechado com N=20 no dev local — Painel `ok=20/20`, `503=0`, `500=0` (336 ms); Esteira `ok=20/20`, `503=0`, `500=0` (124 ms). A-05 mantém o gate de visibilidade (`sqlVinculoPublicado`/`itemVisivelNoPortal`) com testes explícitos para `release`, `manual` e `projeto` arquivados. Os achados históricos abaixo permanecem como snapshot.

> **M-07 (risco aceito, 27/10/2026):** no ambiente de desenvolvimento, a conta de banco é do operador e pode manter privilégios amplos; o projeto não cria usuários nem altera grants. Em produção, o operador deve provisionar a conta e aplicar o mínimo privilégio.

> **Revalidação RL06-2 (27/10/2026):** A-06 e A-08 foram alinhados ao contrato atual; M-05 foi corrigido pela migration 41 (views com projeção explícita e boot check); M-21, M-22, M-23 e M-29 foram corrigidos na documentação/spec. A decisão de produto de 27/10 superou M-01/A-08 quanto à Data de lançamento: ela aceita qualquer data civil válida, enquanto a Data de liberação continua sujeita à regra da Release. O veredito global permanece em aberto até o Change 2 (M-10/M-11/B-07).

> **Revalidação RL06-2 — Change 2 (27/10/2026):** M-10 fechado com projeção mínima, cache de fluxo/anos e invalidação por prefixo; carga N=20 no Painel `ok=20/20`, `503=0`, `500=0` (333 ms) e Esteira `ok=20/20`, `503=0`, `500=0` (224 ms). M-11 fechado no board (contagem/capa, sem array completo), no PDF (teto de 5.000) e no formulário (catálogo remoto). B-07 fechado com importação em lote (`inserirEmLotes` + softwares multi-row); E2E importou 3 linhas e removeu os registros. M-02 aplica `status` antes da paginação; M-03 limpa a data ao remover a Release e valida a herança na aprovação.

> **Revalidação RL06-2 — B-03 (27/10/2026):** `softwares.uuid UUID UNIQUE` restaurado pela migration 42, mantendo `codigo` como PK/FK. As auditorias de criação, alteração e exclusão usam `entidade_id = uuid`; o código `SFT-XXX` permanece em `detalhes`. E2E validou os três eventos e a migration 42 confirmou 44 softwares com UUIDs únicos e não nulos.

> **Fechamento documental (27/10/2026):** B-09 corrigido com placeholder `slate-500`; B-19 alinhado para incluir `primeiro-acesso` na identidade das telas de autenticação; `docs/qa/05` atualizado para 39 componentes; B-03 fechado com UUID. M-07 e I-01 permanecem como risco operacional aceito. A Área Pública não faz parte deste relatório.

> **Objetivo deste documento:** ser o relatório único e definitivo de fechamento da Área Administrativa, consolidando e deduplicando os sete pareceres (documentação, funcional, segurança, banco, UX, performance e execução), classificando a severidade e servindo de plano de correção para que a Área Pública comece sobre uma base aprovada.
>
> **Nota de consolidação:** os pareceres de origem usaram prefixos próprios (`DOC`, `FUN`, `SEG`, `BD`, `UX`, `PERF`, `EXE`). Neste relatório, os achados foram deduplicados e renumerados como `RL06-C-*` (Crítica), `RL06-A-*` (Alta), `RL06-M-*` (Média), `RL06-B-*` (Baixa) e `RL06-I-*` (Melhoria). A rastreabilidade está na seção 9.
>
> **Nota de severidade:** as três divergências documentais classificadas como **Alta** pelo `qa-documentacao` foram mantidas como Alta (contrato da fonte da verdade), embora o código executável esteja correto nos três casos. Elas bloqueiam a **próxima etapa** (Área Pública), não a operação atual.

---

## 1. Resumo executivo

- **Status: REPROVADO.** A Área Administrativa está funcionalmente madura e o fluxo editorial principal (Release/Manual/Escopo → Chamada → Esteira → Publicado) **persiste, cascateia e registra histórico/auditoria corretamente**. Contudo, a matriz do `docs/qa/00` é inequívoca: **qualquer bug crítico, alto, falha de segurança, inconsistência de banco ou exposição de conteúdo não publicado reprova**.
- **2 bugs Críticos:**
  1. **RL06-C-01 — mídias de chamadas não publicadas são servidas anonimamente** em `/uploads/chamadas/<ano>/<mês>/<arquivo>` (6 das 9 mídias pertencem a chamadas em `Revisar`, `Aprovado` ou `Publicar`). É exposição de conteúdo não publicado na Área Pública — exemplo textual de Crítica no `docs/qa/00`.
  2. **RL06-C-02 — bypass da permissão `publicar`**: perfil com `alterar` (ex.: Revisor) envia `status=Publicado` no `PUT` genérico de Release/Manual/Escopo, recebe `200` e publica o conteúdo e as filhas, sem `publicar`, sem passar pela esteira e sem `data_aprovacao`.
- **8 bugs Altos:** recuperação de senha (`esqueci-senha`) não revoga sessões; Painel Executivo sem RBAC expõe títulos/status de conteúdo não publicado a qualquer sessão; `criarEscopo` não é atômico; o pool satura com `HTTP 500 Queue limit reached` já em N≈10; arquivar o pai não reconcilia as filhas publicadas; e três contratos normativos divergentes (catálogo RBAC incompleto, fórmula do KPI do Painel e contrato do formulário de Lançar as Chamadas).
- **30 Médias:** quatro defeitos funcionais objetivos (segunda-feira não validada, filtro `Publicado` da Esteira vazio, herança da Data de liberação ausente, histórico de id inexistente com `200 []`), views quebradas, endurecimento de upload/banco/RBAC, custo do Painel, ausência de paginação nas listagens novas, imagens originais sem cache, 7 lacunas de UX e 11 divergências documentais.
- **23 Baixas + 2 Melhorias:** datas residuais, rastreabilidade da auditoria, unicidade com arquivadas, ausência de `publicado_em`, bundle do TipTap, transações longas, acessibilidade/contraste, textos, vitrine, ação de menu e documentação.
- **O que está sólido (comprovado):** fronteira de áreas nas APIs (74 endpoints sem sessão → `401`), guard de cliente (`/admin/**` → `302`), RBAC por módulo nas rotas (`requirePermission` em todas), matriz 92/67/41/14 sem bypass de Administrador, JWT/refresh rotativo/logout, lockout e rate limit, ausência de SQL Injection, sanitização do texto rico, uploads por magic bytes com `nosniff` + CSP, DTO sem segredos, auditoria append-only, 30/30 migrations, 23 FKs, 0 órfãos e 0 duplicidades, guardas de exclusão `409`, cascata de publicação e histórico imutável no fluxo oficial, 404 real e UI kit aderente ao design system.
- **Risco: Crítico.** Não é seguro iniciar a Área Pública enquanto C-01 e C-02 estiverem abertos; A-01/A-02/A-03/A-04/A-05 precisam ser fechados na mesma etapa. A Área Pública tornaria a exposição de mídias e a publicação indevida **diretamente visíveis ao anônimo**.

### 1.1 Veredito por especialidade

| Especialidade | Veredito | Destaque |
| :--- | :--- | :--- |
| qa-documentacao | **Reprovado (documental)** | 42/42 specs válidas; 3 Altas de contrato (catálogo RBAC, KPI do Painel, formulário de Chamadas), 11 Médias e 5 Baixas; código/banco consistentes |
| qa-funcional | **Reprovado** | 1 Crítica (bypass `publicar`), 1 Alta (mídia não publicada), 4 Médias e 2 Baixas; 267 requirements/1.015 cenários mapeados; fluxo de publicação e cascata aprovados no caminho oficial |
| qa-seguranca | **Reprovado** | 1 Crítica, 3 Altas (bypass, Painel sem RBAC, reset sem revogação) e 5 Médias; fronteira/RBAC/SQLi/XSS/segredos íntegros no restante |
| qa-banco | **Reprovado** | 1 Crítica, 4 Altas (bypass, arquivamento, reset, atomicidade), 3 Médias e 3 Baixas; 23 FKs, 0 órfãos, 0 duplicidades, 30/30 migrations |
| qa-ux | **Aprovado com ressalvas** | 0 Crítico/Alto; 7 Médias (estados de erro, duplo envio, variantes de status, paginação estreita, foco/A11y) e 11 Baixas; sem regressão do RL05 |
| qa-performance | **Reprovado** | 1 Alta (pool 500 em N≈10), 3 Médias (full scans do Painel, falta de paginação, imagens sem cache), 2 Baixas e 1 Melhoria; caminho feliz p50 15–44 ms |
| qa-execucao | **Reprovado** | 1 Crítica, 3 Altas (2 confirmadas + 1 estática), 6 Médias; 40+ cenários executados; gates `lint`/`typecheck` OK, `test` com 1 timeout isolado, `build` OK |

### 1.2 Placar consolidado (deduplicado)

| Severidade | Qtd | IDs |
| :--- | ---: | :--- |
| Crítica | **2** | RL06-C-01, RL06-C-02 |
| Alta | **8** | RL06-A-01 … RL06-A-08 |
| Média | **30** | RL06-M-01 … RL06-M-30 |
| Baixa | **23** | RL06-B-01 … RL06-B-23 |
| Melhoria | **2** | RL06-I-01, RL06-I-02 |

> Deduplicação: mídia não publicada = FUN-02 = SEG-01 = BD-01 = EXE-01; bypass `publicar` = FUN-01 = SEG-02 = BD-02 = EXE-02; reset de senha = SEG-04 = BD-04 = EXE-03; Painel sem RBAC = SEG-03 = BD-07 = EXE-05; `criarEscopo` = BD-05 = EXE-04; pool = PERF-01; arquivamento = BD-03 = EXE-11; segunda-feira = FUN-03 = EXE-06 = DOC-03; filtro da Esteira = FUN-04 = EXE-08; Data de liberação = FUN-05 = EXE-07 = DOC-03; histórico 404 = FUN-06 = EXE-09; views = BD-06 = EXE-10.

---

## 2. Cobertura executada

| Eixo | Situação |
| :--- | :--- |
| Documental | Executado — 42 specs validadas, 22 funcionais cruzadas com código/rotas/docs 01–17/bd; matriz de rastreabilidade e 19 achados de origem |
| Funcional | Executado — 267 requirements e 1.015 cenários mapeados; fluxo principal, CRUD, filtros, ordenação, paginação, exportação, persistência e fronteira |
| Regressão | Executado — RL04/RL05 revalidados, cadeia Release/Manual/Escopo ↔ Chamadas ↔ Esteira, auth ↔ revogação, uploads ↔ servimento, auditoria ↔ filtros, painel ↔ dados |
| Permissões (RBAC) | Executado — matriz 92/67/41/14; 74 `requirePermission`; smoke com Administrador, Editor, Revisor e Leitor; ações fixas e extras; sem bypass de Administrador |
| Banco | Executado read-only — 30/30 migrations, 23 FKs, 15 índices únicos, 0 órfãos, 0 duplicidades, transações, views, defaults/timestamps, Event Scheduler, grants |
| UX | Executado estático + SSR autenticado — UI kit (36 componentes), 20 specs de design system, estados, feedback, responsividade, acessibilidade e consistência entre áreas; sem browser real |
| Segurança | Executado — fronteira, RBAC, JWT/refresh/logout, lockout/rate limit, SQLi, XSS (incluindo rich text), uploads, CSRF/SameSite, segredos, headers e importações |
| Performance | Executado com medições — 35 planos `EXPLAIN`, `Questions`, p50/p95, payload, concorrência N=2…40, carga sintética revertida, bundle/build |
| Fronteira Pública × Admin | Executado em runtime — 74 endpoints sem sessão → `401`; `/admin/**` → `302`; única porta pública mínima; **quebra identificada em `/uploads/**` (C-01)** |
| Execução E2E | Executado — dev server + MariaDB; login, sessão, CRUD, ciclo, cascata, esteira, importação, uploads, RBAC e reprodução dos achados; dados de teste removidos |
| Gates | `lint` PASS; `typecheck` PASS; `build` PASS; `test` 246/246 com **1 timeout intermitente** sob carga paralela (isolado 7/7 PASS) |
| Escopos não aplicáveis | Declarados na seção 3 |

---

## 3. Escopos não aplicáveis (declarados — não são falha)

1. **Área Pública de conteúdo** (páginas e APIs de leitura de Releases Week, Manuais e Escopo de Projetos): **roadmap da próxima etapa**. Hoje `app/pages/index.vue` é placeholder e não há endpoints públicos de conteúdo. Consequências: “filtro de visibilidade pública em queries públicas” e “agendamento/data futura na exibição” são **N/A** nesta rodada; a fronteira foi validada e a única superfície pública indevida encontrada é `/uploads/**` (C-01).
2. **`server/utils/validation.ts` (Zod)** — roadmap (`docs/02 §3.2`); a validação ad hoc com `createError(400)` é o padrão atual.
3. **`server/utils/safeError.ts` / `handleApiError`** — roadmap; erros serializados pelo Nitro.
4. **Headers de segurança globais (CSP/HSTS/X-Frame-Options/Referrer-Policy) e token CSRF dedicado** — roadmap; hoje há `nosniff` + CSP `sandbox` em `/uploads/**` e `SameSite=Lax`.
5. **Envio real de e-mail (Resend)** — implementado por código, **não exercido** em runtime nesta auditoria (nenhum e-mail foi disparado).
6. **Soft delete** — não previsto; exclusão física intencional, com guardas `409` e arquivamento (`arquivada`) para conteúdo.
7. **Itens de escala congelados no RL05** (FULLTEXT, export streaming, paginação de `/api/usuarios/emails`, store persistente de rate limit) — permanecem roadmap; não contam como regressão, salvo o pool, que **piorou** e virou Alta (A-04).
8. **Navegador real / Lighthouse / axe / leitores de tela / viewport real** — não executados; UX e responsividade foram avaliadas por código + SSR.
9. **Produção (`NODE_ENV=production`)** — não executada; cookies `__Host-`, erros sem stack e compressão/CDN não foram validados em build de produção (o `build` foi executado).
10. **2FA, multi-tenant, isolamento por empresa/filial** — não existem no sistema; não aplicáveis.
11. **Conteúdo de demonstração** — não há seed de negócio (Softwares/Parceiros/Release/Manual/Escopo); o banco tem dados de teste/QA.

---
## 4. Achados

### 4.1 Críticas (bloqueantes absolutas)

#### RL06-C-01 · Mídias de chamadas não publicadas são servidas anonimamente em `/uploads/**`

- **Severidade:** Crítica (exposição de conteúdo não publicado na Área Pública)
- **Módulos:** Lançar as Chamadas · Anexos/Mídias · Uploads · fronteira Área Pública × Administrativa
- **Origem:** qa-funcional `FUN-02` = qa-seguranca `SEG-01` = qa-banco `BD-01` = qa-execucao `EXE-01`
- **Cenário:** uma chamada em `Revisar`, `Aprovado` ou `Publicar` possui imagens em `anexos_midias`, e um visitante anônimo acessa diretamente a URL do arquivo.
- **Resultado esperado:** mídia de conteúdo não publicado inacessível sem sessão/permissão; se pública, somente quando a chamada e o conteúdo pai estiverem `Publicado` e não arquivados.
- **Resultado obtido:** `GET /uploads/chamadas/2026/10/imagem-3.jpg` (sem cookie) → **`200 image/jpeg`, 122.996 bytes**; `imagem.png` → **`200`, 2.785.849 bytes**. O banco comprova que `imagem-3.jpg` pertence à chamada `0000646487` (status `Revisar`, pai `RW-44/2026` em `Em Revisão`). Distribuição das 9 mídias: `Revisar` 2 mídias/1 item, `Aprovado` 1/1, `Publicar` 3/2, `Publicado` 3/1 — **6 de 9 pertencem a chamadas não publicadas**.
- **Passos para reprodução:**
  1. `curl -i http://localhost:3000/uploads/chamadas/2026/10/imagem-3.jpg` sem cookie → `200`.
  2. Consultar `SELECT e.status FROM anexos_midias a JOIN entregas_itens e ON e.id = a.entrega_item_id` → status `Revisar`.
  3. Repetir com `imagem.png` (chamada em `Revisar`) e comparar com `imagem-1.png` (chamada `Publicado`) — ambas retornam `200`.
- **Evidências:** `nuxt.config.ts:36-57` publica `uploads/` inteiro via `nitro.publicAssets`; `server/api/uploads/index.post.ts:50-69` grava em `chamadas/<ano>/<mes>`; `server/utils/uploads.ts:104-113` devolve URL pública; `anexos_midias` não possui coluna de visibilidade/publicação; a spec `uploads` manda servir todo upload, em conflito com a regra de conteúdo não publicado.
- **Impacto:** vazamento anônimo de evidências/rascunhos de chamadas internas (capturas de tela, documentação de correção). Os nomes são genéricos (`imagem.png`, `imagem-1..7`), o que facilita enumeração. Viola diretamente “conteúdo não publicado exposto na Área Pública = Crítica”. A Área Pública tornaria o vazamento parte da experiência pública.
- **Correção recomendada:** remover `uploads/chamadas/**` do `nitro.publicAssets` e servir por rota autenticada/autorizada (`GET /api/chamadas/:id/midias/:arquivo`) com verificação de RBAC e de `entregas_itens.status='Publicado'` + pai ativo/publicado; ou usar URLs assinadas com expiração e nomes aleatórios. Manter públicos apenas `logomarcas`/`avatares`/`logos`. Alinhar a spec `uploads` a essa regra.

#### RL06-C-02 · Bypass da permissão `publicar` via `PUT` genérico de edição (Release/Manual/Escopo)

- **Severidade:** Crítica (bypass de permissão)
- **Módulos:** Release Week · Manuais Mensais · Escopo de Projetos · RBAC
- **Origem:** qa-funcional `FUN-01` (Crítica) = qa-seguranca `SEG-02` (Alta) = qa-banco `BD-02` (Alta) = qa-execucao `EXE-02` (Alta)
- **Cenário:** perfil com `alterar` mas **sem** `publicar` (ex.: Revisor, cuja matriz em `release-week`/`manuais`/`escopo-projetos` é `v=1, c=0, a=1, e=0` e extras sem `publicar`) abre o modal de edição e salva com `Status = Publicado`.
- **Resultado esperado:** `403` por falta de `publicar`; a publicação só pode ocorrer pelo endpoint dedicado (`PUT .../publicar`), com auditoria “Homologação”, `data_aprovacao` e cascata.
- **Resultado obtido:** `PUT /api/release-week/:id` exige apenas `alterar`, grava `status` do payload e chama a cascata. E2E com Revisor: `RW-46/2026` → **`200` e `Publicado`**; `MAN-12/2026` → **`200` e `Publicado`**; `PE-2026.02` → **`200` e `Publicado`**; a chamada filha foi promovida de `Publicar` para `Publicado`, o histórico registrou o Revisor e a auditoria saiu como **“Alteração”**, não “Homologação”. O endpoint correto `/publicar` responde `403` para o mesmo Revisor.
- **Passos para reprodução:**
  1. Criar um usuário temporário com perfil Revisor (seed) e senha conhecida.
  2. Autenticar e enviar `PUT /api/release-week/<id>` com `{"status":"Publicado"}` → `200`.
  3. Conferir `release_week.status`, a chamada filha, `historico_esteira_revisao` e `auditoria`.
  4. Repetir em `/api/manuais/<id>` e `/api/escopo-projetos/<id>`.
- **Evidências:** `server/api/release-week/[id]/index.put.ts:9` (só `alterar`); `server/utils/release-week.ts:297-326` (grava status e chama `reconciliarFilhasPublicacao`); `server/utils/manuais.ts:310-342`; `server/utils/escopo-projetos.ts:349-378`; `POST` de criação também aceita `status=Publicado` (`release-week/index.post.ts:9,17`); formulários oferecem `Publicado` sem checar `.can(...)` (`release-week/Formulario.vue:88-92`, `manuais/Formulario.vue:82-87`, `escopo-projetos/Formulario.vue:67-71`); a rota dedicada exige `publicar` (`release-week/[id]/publicar/index.put.ts:8`).
- **Impacto:** um perfil de revisão publica conteúdo sem a ação de publicação, sem passar pela esteira/homologação e sem `data_aprovacao`; a trilha não distingue publicação de edição. Com a Área Pública ativa, conteúdo não revisado chegaria ao portal. É bypass de permissão — Crítica pela matriz.
- **Correção recomendada:** remover `status` do payload de edição (e forçar status inicial na criação) ou exigir `requirePermission(modulo,'publicar')` quando o status mudar para `Publicado`; centralizar a máquina de estados no servidor; gravar `data_aprovacao` ao publicar e limpá-la ao reabrir; auditar como “Homologação”. Adicionar testes de regressão por perfil.

---

### 4.2 Altas (bloqueantes)

#### RL06-A-01 · `esqueci-senha` troca a credencial sem revogar sessões (regressão parcial do RL05-A-01)

- **Severidade:** Alta (falha de segurança/sessão)
- **Módulos:** Autenticação · Recuperação de senha · Revogação de sessão
- **Origem:** qa-seguranca `SEG-04` = qa-banco `BD-04` = qa-execucao `EXE-03`
- **Cenário:** um access/refresh é roubado; a vítima solicita recuperação e a senha provisória é gravada.
- **Resultado esperado:** o reset revoga **todas** as sessões da conta (incremento de `token_version` + `revogado_em` em `sessoes`), como já ocorre em `trocar-senha`, `convite` e `PUT /api/usuarios/:id`.
- **Resultado obtido:** `esqueci-senha` executa apenas `UPDATE usuarios SET hash_senha=?, senha_provisoria=1`; a sessão antiga continua válida. Reprodução com usuário temporário e simulação do efeito do reset (sem disparar e-mail): `GET /api/auth/seguro` e `GET /api/painel-executivo` com o access antigo → **`200`**; `token_version` inalterado.
- **Passos para reprodução:** (1) autenticar usuário de teste; (2) simular o reset por SQL (`hash_senha` novo + `senha_provisoria=1`, sem tocar `token_version`/`sessoes`); (3) reutilizar o cookie antigo em `/api/auth/seguro` → `200`.
- **Evidências:** `server/api/auth/esqueci-senha/index.post.ts:82-84`; `server/utils/auth.ts:319-323,375-392` (sessão vem do JWT; não checa `senha_provisoria`/hash); `revogarSessoesDoUsuario` não é chamado no fluxo.
- **Impacto:** token roubado sobrevive à remediação por até o TTL do access (15 min) — e o refresh pode ser renovado, ampliando a janela. O RL05 declarou A-01 fechado, mas o fluxo de autoatendimento ficou fora.
- **Correção recomendada:** executar a troca de hash e `revogarSessoesDoUsuario` na mesma transação; como defesa em profundidade, `sessaoAtivaNoServidor` comparar também `senha_provisoria`/versão do hash. Atualizar `revogacao-sessao/spec.md` e adicionar teste.

#### RL06-A-02 · Painel Executivo sem RBAC expõe títulos/status de conteúdo não publicado a qualquer sessão

- **Severidade:** Alta (mínimo privilégio / conteúdo restrito)
- **Módulos:** Painel Executivo · RBAC · Release/Manuais/Escopo
- **Origem:** qa-seguranca `SEG-03` (Alta) = qa-banco `BD-07` (Média) = qa-execucao `EXE-05` (Média; conforme spec)
- **Cenário:** perfil **Leitor**, sem `visualizar` em `lancar-chamadas`, `softwares`, `parceiros` e `esteira-revisao`, acessa `GET /api/painel-executivo`.
- **Resultado esperado:** apenas dados de módulos autorizados; publicações não publicadas mascaradas ou negadas.
- **Resultado obtido:** `200` com KPIs, séries e `porPublicacao` contendo `RW-44/2026 Em Revisão`, `MAN-10/2026 Em Revisão` e `PE-2026.01 Em Andamento`, além de rankings de softwares/tipos/impactos de chamadas. A rota só chama `getSessionUser`, sem `requirePermission`; as agregações não filtram `arquivada=0`.
- **Evidências:** `server/api/painel-executivo/index.get.ts:10-22`; `server/utils/painel-executivo.ts:166-246,319-346`; a spec `painel-executivo` diz “acessível a qualquer sessão autenticada, sem criar novo módulo RBAC” — **conflito normativo com a regra de não acessar módulo sem permissão** (`docs/qa/02`).
- **Impacto:** um perfil de leitura vê a existência, o nome e o status de conteúdo editorial em preparação e dados de módulos que a matriz lhe nega. Não é bypass da fronteira (exige sessão), mas é vazamento de informação interna e quebra de granularidade.
- **Correção recomendada:** exigir `visualizar` dos módulos agregados (ou ao menos mascarar publicações não `Publicado` para quem não tem `publicar`/`visualizar` do módulo); filtrar `arquivada=0` nas métricas; atualizar a spec do Painel para refletir a decisão.

#### RL06-A-03 · `criarEscopo` grava o pai fora da transação da cascata (operação parcial)

- **Severidade:** Alta (integridade de dados)
- **Módulo:** Escopo de Projetos
- **Origem:** qa-banco `BD-05` = qa-execucao `EXE-04` (estático)
- **Cenário:** criar escopo com `status='Publicado'` e falha na reconciliação das filhas.
- **Resultado esperado:** `INSERT` do escopo + cascata/histórico na mesma transação; falha = rollback total.
- **Resultado obtido:** o `INSERT INTO projetos_escopo` usa `query()` (pool, autocommit) e só depois abre `getTransaction()` para a cascata. Se a cascata falhar, o escopo permanece gravado sem reconciliação. É o único módulo de conteúdo com esse padrão (Release/Manual já fazem corretamente).
- **Evidências:** `server/utils/escopo-projetos.ts` — `await query('INSERT INTO projetos_escopo …')` antes do `getTransaction()`; `if (validada.status === 'Publicado') { const tx = await getTransaction(); … }`.
- **Impacto:** inconsistência permanente pai/filhas e histórico ausente em erro parcial; o retry só cobre `1062`, não o estado parcial.
- **Correção recomendada:** abrir a transação antes do `INSERT` e executar insert + reconciliação + commit/rollback juntos; adicionar teste de falha induzida.

#### RL06-A-04 · Pool saturado: `HTTP 500 Queue limit reached` em concorrência moderada (N≈10)

- **Severidade:** Alta (disponibilidade)
- **Módulos:** Infraestrutura de banco · Painel Executivo · Esteira de Revisão
- **Origem:** qa-performance `PERF-01`
- **Cenário:** 10 requisições simultâneas nas duas telas centrais.
- **Resultado esperado:** a fila absorve a carga ou degrada latência, sem erro.
- **Resultado obtido:** `/api/painel-executivo` N=10 → **3–4 de 10 respostas `500`** em três rodadas; N=20 → 10–14/20; N=40 → 35/40. `/api/esteira-revisao` N=10 → 2–3/10; N=20 → 8–9/20. Corpo: `"message": "Queue limit reached."`. N=8 passa 8/8. O painel executa **12 consultas em `Promise.all`** por request; a esteira, 12–14.
- **Evidências:** `server/utils/db.ts:24-25` (`connectionLimit 10`, `queueLimit 50`); `server/utils/painel-executivo.ts:111-248`; `server/utils/esteira-revisao.ts:142-158`; piso de 2 queries por request em `auth-api.ts:18-27` + `permission.ts:60-65`. Cinco painéis simultâneos já demandam 60 slots (10 + 50). No RL05 o erro aparecia em N=40–60 — **piorou** com os novos módulos.
- **Impacto:** recurso central indisponível sob uso simultâneo; p95 sobe de ~40 ms (isolado) para ~2,3 s antes de falhar. Viola a matriz (indisponibilidade de processo importante = Alta).
- **Correção recomendada:** consolidar as 12 consultas do painel em 1–3 (UNION ALL/CASE), limitar o paralelismo por request, cachear agregados por ano, enxugar a esteira (opções cacheadas, vínculos em UNION, decisões no JOIN), elevar `DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT` por env e mapear o erro de fila para `503` + `Retry-After`.

#### RL06-A-05 · Arquivar o pai não reconcilia as filhas publicadas (invariante de visibilidade latente)

- **Severidade:** Alta (consistência de publicação — risco para a Área Pública)
- **Módulos:** Release Week · Manuais · Escopo de Projetos · visibilidade
- **Origem:** qa-banco `BD-03` (Alta) = qa-execucao `EXE-11` (Média, conforme spec)
- **Cenário:** arquivar um pai `Publicado` que possui chamadas `Publicado`.
- **Resultado esperado:** pela regra de `publicacao-pais.ts`, filha só é `Publicado` se existir pai ativo `Publicado`; ao arquivar, a filha deveria voltar a `Publicar` (ou toda leitura pública deveria negar pelo pai).
- **Resultado obtido:** `arquivarReleaseWeek/Manual/Escopo` executam somente `UPDATE ... SET arquivada=1`; nenhuma reconciliação é chamada. Simulação em transação: `RW-52/2026` arquivada → `0000545878` permaneceu `Publicado`. O estado do banco passa a divergir da própria regra de visibilidade.
- **Evidências:** `server/utils/release-week.ts`, `manuais.ts`, `escopo-projetos.ts` (funções de arquivar); `server/utils/publicacao-pais.ts` considera pai arquivado como “não publicado” (`arquivada=0`); a spec de Release Week diz “Arquivar não altera as filhas” — **conflito de contrato**.
- **Impacto:** uma futura consulta pública que filtre apenas `entregas_itens.status='Publicado'` exibirá conteúdo de pai arquivado; `temVinculoPublicado` e KPIs divergem. Hoje não há API pública, mas o risco é estrutural.
- **Correção recomendada:** decidir o invariante: (a) reconciliar as filhas na mesma transação do arquivamento; ou (b) impor em **toda** leitura pública o join com pai `arquivada=0` e `status='Publicado'`; documentar a semântica na spec e cobrir com teste de regressão.

#### RL06-A-06 · Catálogo normativo de RBAC incompleto (Escopo de Projetos e Esteira ausentes)

- **Severidade:** Alta (documentação/contrato de autorização)
- **Módulos:** autorizacao-rbac · Escopo de Projetos · Esteira de Revisão · Painel Executivo
- **Origem:** qa-documentacao `DOC-01`
- **Cenário:** provar o `403` de Escopo/Esteira exclusivamente pelo catálogo da spec.
- **Resultado esperado:** catálogo com os 11 módulos da matriz e todas as rotas administrativas mapeadas para módulo/ação.
- **Resultado obtido:** a spec lista 9 módulos e não mapeia `escopo-projetos`, `esteira-revisao`, `GET /api/painel-executivo` nem `PUT /api/lancar-chamadas/:id/desaprovar`; `docs/07:451-454` já lista 11.
- **Evidências:** `openspec/specs/autorizacao-rbac/spec.md:40-96`; `server/api/escopo-projetos/index.get.ts:8`; `server/api/esteira-revisao/index.get.ts:10`; `server/api/lancar-chamadas/[id]/desaprovar.put.ts:8`; `server/utils/permission.ts`; `app/config/perfis.ts` (11 módulos).
- **Impacto:** o contrato de autorização fica incompleto justamente nos módulos novos; uma rota futura pode nascer sem guard e a auditoria de permissões não tem evidência documental. **O código está correto** — o defeito é normativo.
- **Correção recomendada:** acrescentar os 2 módulos e todas as rotas de Escopo/Esteira/Painel/`desaprovar`, com cenários de `401`/`403`; validar contra `server/utils/perfis.ts`.

#### RL06-A-07 · Fórmula do KPI “% do fluxo concluído” do Painel contradiz o código e a Esteira

- **Severidade:** Alta (documentação/contrato de indicador executivo)
- **Módulos:** Painel Executivo · Esteira de Revisão
- **Origem:** qa-documentacao `DOC-02`
- **Cenário:** todas as chamadas do ciclo estão publicadas; leitura do KPI na tela/spec.
- **Resultado esperado (spec do Painel):** `(Aprovado + Publicar + Publicado) / universo com vínculo ativo` → cenário totalmente publicado = **100%**.
- **Resultado obtido (código):** `somarStatus` trata `Publicado` como contagem informativa e o exclui do total; `calcularFluxoPainel` calcula `(aprovado + publicar) / total` → ciclo totalmente publicado = **0%**. Em sentido oposto, `docs/16` e a spec `esteira-revisao` usam `(Aprovado + Publicar) / ciclo ativo`.
- **Evidências:** `openspec/specs/painel-executivo/spec.md:48-61,73-76`; `docs/17:84`; `shared/painel-executivo.ts:287-299`; `shared/esteira-revisao.ts:215-237`; `tests/painel-executivo.test.ts:157-177` (valida o código contra a regra da Esteira).
- **Impacto:** duas specs normativas divergem; o KPI pode induzir decisão errada e o teste atual “protege” a regra errada. Hoje os dados batem com a Esteira (75%), mas o contrato do Painel está quebrado.
- **Correção recomendada:** decidir a regra de produto. Se publicado conta como concluído, alterar `calcularFluxoPainel` e testes; se é informativo, corrigir `painel-executivo/spec.md`, `docs/17` e o cenário de 100%.

#### RL06-A-08 · Contrato do formulário de Lançar as Chamadas divergente (Data de liberação e segunda-feira)

- **Severidade:** Alta (documentação/contrato funcional)
- **Módulo:** Lançar as Chamadas
- **Origem:** qa-documentacao `DOC-03`
- **Cenário:** criar/editar chamada, selecionar uma Release com `dataPublicacao` e informar data fora de segunda-feira.
- **Resultado esperado (spec):** Data de liberação preenchida com a publicação da release e **editável**; Data de lançamento e Data de liberação validadas como **segunda-feira**.
- **Resultado obtido:** o formulário mantém a Data de liberação **vazia e desabilitada**, selecionar release não preenche a data, e `validarChamada` só valida formato ISO, sem dia da semana. `docs/15` descreve o comportamento atual (vazia/desabilitada, sem segunda-feira), contradizendo a spec.
- **Evidências:** `openspec/specs/lancar-chamadas/spec.md:212-213,232-235,262-264,286-289`; `app/components/lancar-chamadas/Formulario.vue:253-255,538-545`; `shared/lancar-chamadas.ts:397-428` (`ehSegundaFeira` existe em 276-290 e não é chamado); `docs/15:267,298,333`.
- **Impacto:** QA e desenvolvimento seguem contratos diferentes; a spec, se implementada, recusaria chamadas hoje aceitas (e vice-versa). A ausência de segunda-feira também é um defeito funcional (M-01).
- **Correção recomendada:** reconciliar com o produto: se a UX atual é definitiva, reescrever a spec (herança na aprovação, sem segunda-feira); se a regra de segunda-feira é necessária, implementar no validador/DatePicker, preencher a Data de liberação ao selecionar a Release e atualizar `docs/15`.

---

### 4.3 Médias (produto, segurança, performance e UX)

| ID | Módulo | Cenário · Esperado × Obtido | Evidência | Impacto | Correção |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RL06-M-01** | Lançar as Chamadas | Salvar chamada com data em terça/quinta/sexta · Esperado: `400` “segunda-feira” · Obtido: `201`, data persistida. `0000646487`/`0000578781` estão em quinta (22/10) e `0000545878` em sexta (23/10) | `shared/lancar-chamadas.ts:397-407`; `ehSegundaFeira` (276-290) não é chamada; `server/utils/lancar-chamadas.ts:339-350`; `tests/lancar-chamadas-validadores.test.ts:147-153` aceita terça | Datas de liberação fora da regra de negócio; relatórios e herança incorretos | Aplicar `ehSegundaFeira` (ou “próximo dia útil”, se a regra for a mesma da Release) em `validarChamada`; alinhar testes |
| **RL06-M-02** | Esteira de Revisão | Filtrar `status=Publicado` sem vínculo · Esperado: exibir publicados fora do ciclo · Obtido: **0 itens**, embora a API devolva 6 itens e 1 `Publicado` | `shared/esteira-revisao.ts:171-178` (gate só reabre se houver `releaseId/manualId/projetoId`); `useEsteiraRevisaoModelo.ts:151-158`; teste fixa o comportamento (`tests/esteira-revisao-validadores.test.ts:307`) | Consulta de publicados impossível sem filtrar um vínculo | Incluir `filtros.status==='Publicado'` na condição de visibilidade do board |
| **RL06-M-03** | Lançar as Chamadas | Selecionar Release com `dataPublicacao` · Esperado: preencher Data de liberação editável · Obtido: campo vazio; o servidor herda só na aprovação | `app/components/lancar-chamadas/Formulario.vue:253-255,538-545`; `server/utils/lancar-chamadas.ts:810-823` | Usuário grava sem a data herdada; funcionalidade documentada ausente | Preencher `rascunho.dataLiberacao` ao trocar a Release (editável) e derivar no create |
| **RL06-M-04** | Esteira de Revisão | `GET /api/esteira-revisao/:id/historico` com UUID inexistente · Esperado: `404` · Obtido: `200 []` | `server/api/esteira-revisao/[id]/historico.get.ts:7-9` (valida formato, não existência); detalhe/transições já retornam 404 | Consumidor não distingue “sem histórico” de “não existe” | Verificar `buscarItemEsteira(id)` antes de listar o histórico |
| **RL06-M-05** | Schema/Migrations | Consultar `v_release_itens`/`v_projeto_itens`/`v_manual_itens` · Esperado: views válidas · Obtido: `ER_VIEW_INVALID 1356`; a view `manuais` não tem `arquivada` | Migration 28 removeu `entregas_itens.situacao`; views criadas na 01 com `SELECT *`; `information_schema.VIEWS` ainda referencia a coluna | Objetos quebrados no schema (backups/relatórios/ferramentas); drift não detectado pelo runner | Nova migration recriando as views sem `situacao` e com `arquivada`; verificação de dependências no boot |
| **RL06-M-06** | Uploads | Enviar multipart grande para destino sem permissão; ou `Transfer-Encoding: chunked` sem `Content-Length` · Esperado: `403` antes do parse e limite efetivo · Obtido: parse integral em `readMultipartFormData` antes da permissão; limite só por `content-length` | `server/api/uploads/index.post.ts:15-26,50-90`; `server/middleware/body-limit.ts:9-15`; resíduo do RL05-M-02 | DoS de memória por sessão autenticada (`avatares` é session-only) e bypass do limite por chunked | Pré-autorizar por destino, parser streaming/`bodyLimit` no Nitro e rejeitar chunked acima do teto |
| **RL06-M-07** | Banco/Infra | `SHOW GRANTS FOR CURRENT_USER()` · Esperado: DML restrito a `publications` + `EVENT` · Obtido: `GRANT ALL PRIVILEGES ON *.* ... WITH GRANT OPTION` | `.env.example:5` recomenda mínimo privilégio, mas a conta real é total; resíduo do RL05-M-06 | Comprometimento da aplicação expõe todo o MariaDB (DDL/GRANT/outras bases) | Criar usuário dedicado sem `GRANT OPTION`/DDL e revisar `.env` de produção |
| **RL06-M-08** | Rate limit / Auditoria | Configurar `TRUSTED_PROXIES` com IPs/CIDRs · Esperado: confiar em XFF só do proxy listado · Obtido: qualquer valor não vazio habilita XFF | `server/utils/rateLimit.ts:56-62`; `server/utils/auth.ts:152-159` (não compara peer com a lista) | Latente: spoofing de IP para burlar rate limit e mascarar autoria quando configurado | Parsear CIDRs e comparar com o socket; ignorar XFF fora da lista |
| **RL06-M-09** | Gestão de Usuários/Convite | Perfil customizado com `gestao-usuarios/criar` cria usuário Administrador · Esperado: só atribuir perfil ≤ ao do ator · Obtido: qualquer perfil ativo por nome é aceito | `server/utils/usuarios.ts:174-186,428,498`; `server/api/usuarios/index.post.ts:9,17`; `server/api/convite/index.post.ts:73-84` | Latente: escalada vertical quando o RBAC dinâmico conceder gestão de usuários a perfil intermediário | Validar hierarquia/perfil do ator ao atribuir `perfil_id`; reservar Administrador a quem controla perfis |
| **RL06-M-10** | Painel Executivo | Abrir o painel/trocar ano · Esperado: agregações indexadas e limitadas ao ano · Obtido: `itensFluxo` sem `WHERE` (todas as linhas + 3 LEFT JOIN no Node); 5 varreduras `type=ALL`; sem índice em `data_lancamento`/`data_liberacao` | `server/utils/painel-executivo.ts:235-247`; `01_create_tables.sql:452-467`; `EXPLAIN` `type=ALL`/`Using temporary; Using filesort`; 5.005 linhas → `itensFluxo` 56 ms | Custo linear com o histórico e fanout que alimenta A-04 | Agregar no SQL (`SUM(CASE …)`/`DATEDIFF`), criar índices de data e cachear `anosDisponiveis` |
| **RL06-M-11** | Lançar as Chamadas/Esteira | Abrir as listagens/buscar · Esperado: paginação server-side e projeção enxuta · Obtido: todas as colunas (HTML, imagens, tags) sem `LIMIT`; cliente filtra/pagina o array completo; payload 10,3 KB/5 chamadas e 21,0 KB/esteira; 5.005 linhas → 108 ms/1,03 MiB | `server/utils/lancar-chamadas.ts:106-112,198-210`; `esteira-revisao.ts:142-158`; `useLancarChamadasModelo.ts:113-115`; `existentesParaValidacao()` lê `id, chamada` de toda a tabela | Memória/DOM/tráfego sem teto; validação de unicidade O(n) por save | `?pagina=&porPagina=`, projeção enxuta, detalhe sob demanda, checar duplicidade por `WHERE chamada=?` (a UK já existe) |
| **RL06-M-12** | Lançar as Chamadas/Uploads | Abrir detalhe/galeria com imagens · Esperado: miniatura leve, lazy e cacheável · Obtido: original de **2,66 MiB** para thumb de 96 px, sem `loading="lazy"`/`srcset`; `/uploads/**` com `Cache-Control: public, max-age=0` | `Detalhes.vue:265-278`; `Midias.vue:209-219`; `nuxt.config.ts:44-53`; medição HTTP do PNG | Abertura lenta e consumo de banda; pico de memória em uploads | Gerar variantes WebP ~320 px, `loading="lazy" decoding="async" srcset`, cache `max-age=86400` com nome único |
| **RL06-M-13** | Todas as telas com listagem | GET inicial falha (offline/500/403) · Esperado: estado de erro persistente com motivo e “Tentar novamente” · Obtido: toast `danger` de 5 s + KPIs zerados + “Nenhum registro encontrado”; 403 parece conexão | `app/pages/admin/softwares.vue:25-38,94-96`; `ui/DataTable.vue:1035-1040`; contraste positivo em `meu-perfil.vue:186-190`; `permission.ts:78-83` | Operador conclui que não há dados e não sabe que a carga falhou | Estado de erro no `v-else` + retry, com mensagens distintas para 401/403/5xx (Meu Perfil é o molde) |
| **RL06-M-14** | 7 fluxos de escrita | Clique duplo/toque repetido em “Salvar” · Esperado: `loading` + `disabled` até a resposta · Obtido: botão habilitado sem spinner; cada clique dispara nova requisição | `softwares/Formulario.vue:100-133,245-248`; `parceiros/Formulario.vue:106-134,303`; `escopo-projetos/Formulario.vue:122-165,337`; `perfis/Formulario.vue:102-142,257`; `perfis/Permissoes.vue:118-132,366`; `configuracoes-globais.vue:59-90`; `meu-perfil.vue:89-130`; contraste em `manuais/Formulario.vue:73,119-120` | Inclusões duplicadas, dois toasts e KPIs inconsistentes | `salvando` + `:loading`/`:disabled` em todos os fluxos |
| **RL06-M-15** | Painel × módulos | Mesmo status no Painel e na origem · Esperado: mesma variante de `docs/01 §5.2` · Obtido: `Aberta`/`Em Andamento` e `Rascunho` → `pending` no Painel, mas `aberta`/`neutral` na origem; `Concluído` → `pending` × `done`; `Alterações Solicitadas` → `blocked` × `alteracoes` | `painel/TabelaPublicacoes.vue:27-36,85`; `release-week/Tabela.vue:34-40`; `manuais/Tabela.vue:40-49`; `shared/escopo-projetos.ts:18-26` | O mesmo registro “muda de estado” conforme a tela; leitura executiva incorreta | Mapa único por domínio reutilizando os `VARIANTE_*` dos módulos |
| **RL06-M-16** | DataTable/Pagination | Viewport 320/375 px com páginas · Esperado: quebra de linha/rolagem própria, botões acessíveis · Obtido: grupo de controles sem `flex-wrap`, card com `overflow-hidden` corta os botões; `UiPagination` rola a página | `ui/DataTable.vue:640,1082,1092`; `ui/Pagination.vue:59,67`; `parceiros/Grade.vue:121-128` | Impossível navegar entre páginas no celular | `flex-wrap`/`overflow-x-auto` no grupo de controles; validar 320/375 |
| **RL06-M-17** | Shell (header/sidebar) | Teclado: abrir Account/Notificações e pressionar `Escape`; abrir drawer < `lg` · Esperado: fechar e devolver foco ao gatilho; drawer como diálogo · Obtido: fecha sem devolver foco (foco cai no `body`); drawer sem `Escape`/`role="dialog"`/trap | `AppHeader.vue:155-157`; `openspec/specs/design-system/layout-navigation/spec.md:29-46`; `admin.vue`/`AppSidebar.vue:81-84` | Usuário de teclado/leitor de tela perde a posição | Guardar o gatilho e focá-lo no fechamento; aplicar semântica/trap no drawer |
| **RL06-M-18** | Busca (DataTable/Parceiros/Escopo) | Focar a busca com leitor de tela · Esperado: nome acessível (`label`/`aria-label`) · Obtido: `UiInput` sem label, só placeholder | `ui/DataTable.vue:668-675`; `ui/Input.vue:103-160`; `parceiros/Grade.vue:63-69`; `escopo-projetos/Grade.vue:63-70` | Vários campos anunciados apenas como “edição de texto” | Prop de nome acessível no kit ou `label` `sr-only`/`aria-label` no consumidor |
| **RL06-M-19** | Lançar as Chamadas (rich text) | Focar “Descrição do Resumo”/“Solução” · Esperado: label associado ao `contenteditable` · Obtido: `<label for>` aponta para `id` inexistente; editor sem `id`/`aria-label` | `ui/RichText.client.vue:44,73-84,127-128`; `lancar-chamadas/Formulario.vue` | Campo central do wizard sem nome acessível | `id` no `editorProps.attributes` + `aria-labelledby`, ou `aria-label` derivado |

#### 4.3.1 Médias documentais (contrato da fonte da verdade)

| ID | Documento × realidade | Divergência | Correção |
| :--- | :--- | :--- | :--- |
| **RL06-M-20** | `docs/02`, `docs/12`–`14` × `publicacao-pais.ts` | Cascata de publicação pai→filhas, histórico por filha e reversão em `Publicado` não estão descritas nos docs de módulo (só “status passa a Publicado”) | Acrescentar seção “Publicação em cascata” nos docs 12–14 (incluindo `chamadasPublicadas` e múltiplos vínculos) |
| **RL06-M-21** | `docs/bd/01` × migrations 23–30 | Complemento lista só 03–12; faltam `projetos_escopo.arquivada`/`uk_projetos_ano_versao` (23), `descricao_html/solucao/solucao_html` (25) e `entregas_itens_softwares` (26) | Regenerar `docs/bd/01` a partir das migrations 01–30 |
| **RL06-M-22** | `migracoes-banco/spec.md:84-100` × banco real | Spec exige 44 linhas com totais **99/45/21/6**; o banco tem **92/67/41/14**; `docs/bd/02:5` fala em “9 ações = 99” e `02_seed.sql:8,29` em “90” | Atualizar a spec e os cabeçalhos dos seeds para 92/67/41/14 (214/368) |
| **RL06-M-23** | `docs/02:348,355` e §3.7 × rotas | Diz `convite` exige `gestao-usuarios/criar` (é `convite`/`alterar`), lista só `Revisar/Aprovado/Recusado` (falta `Publicar/Publicado`) e omite Escopo/Painel | Corrigir a permissão, os status e incluir os endpoints novos |
| **RL06-M-24** | `docs/02:36,47,51,69,586,589`; `docs/01:8` | “26 componentes” (há 36), árvore/APIs sem os 10 módulos novos, “sidebar exibe Módulo em construção”, `.can()` “disponível para uso incremental”, exemplo com módulo inexistente `publicacoes` | Atualizar árvore, contagens, lista de APIs/utils e exemplo para um módulo real |
| **RL06-M-25** | `docs/05:257`; `docs/02:330` × código | Doc declara 42/41 rotas auditadas; o código tem **59** chamadas de `registrarAuditoria` (54 administrativas + 5 de auth), e a tabela não inclui Parceiros/Release/Esteira | Regenerar tabela/totais |
| **RL06-M-26** | `docs/10:254-255`, `docs/11:265-266` × componentes | Afirmam que a UI mostra a tela a qualquer sessão e que o gate RBAC é pendente; os componentes já usam `.can(...)`; os contratos omitem `?exportar=1` | Remover a pendência falsa e documentar a guarda de exportação |
| **RL06-M-27** | `docs/13:308-309` × `docs/07:456-521`/banco | Doc de Manuais informa 90/90, 65/90, 39/90, 14/90 (total 208/360); o real é 92/67/41/14 (214/368) | Atualizar os números |
| **RL06-M-28** | `softwares/spec.md:61-66,175,244-279` × código/docs/10 | Spec omite a coluna Código, usa `PUT /:id` (código usa `/:codigo`), e o requisito de backend omite `409` (FK 1451) e `?exportar=1` | Corrigir a spec para `:codigo`, incluir Código, 409 e exportação |
| **RL06-M-29** | `uploads/spec.md:5,11,15-23,86-96` × código | Spec não cita o destino `logos` (usado com `parceiros/alterar`) e diz que avatares/mídias são “futuro”; acima de 5 MB o código responde `413` (pré-checagem) e a spec exige `400` | Incluir `logos`/permissão, atualizar o Purpose e documentar/unificar `400`×`413` |
| **RL06-M-30** | `gestao-usuarios/spec.md:20-22` × código | Cenário diz que a página renderiza “usuários de demonstração”, contrariando o restante da spec e a API real | Trocar por “usuários persistidos retornados por `GET /api/usuarios`” |

---

### 4.4 Baixas

| ID | Achado | Módulo | Evidência | Impacto / Correção |
| :--- | :--- | :--- | :--- | :--- |
| **RL06-B-01** | `data_aprovacao` residual em Release reaberta (`RW-43/2026` em `Em Revisão` com carimbo de 22/10) | Release Week | `release-week.ts:351` grava; `atualizarReleaseWeek` (301-326) não limpa | Dado semanticamente inconsistente; limpar ao sair de `Publicado` ou documentar como histórico |
| **RL06-B-02** | Listagem de usuários devolve `dataCadastro`/`atualizadoEm` nulos | Gestão de Usuários | `server/utils/usuarios.ts:135,342-347` (projeção enxuta) vs `:124` (mapeador lê `criado_em`) | Inconsistência de contrato; detalhe devolve as datas. Documentar ou devolver os carimbos |
| **RL06-B-03** | `auditoria.entidade_id` mistura UUID e código e referencia registros excluídos | Auditoria | 153 com valor: 130 UUID, 10 códigos (`RW-43/2026`, `MAN-10/2026`, `SFT-045`), 13 dangling, 5 `''` | Trilha sem join confiável; gravar sempre UUID e manter o código em `detalhes` |
| **RL06-B-04** | Unicidade inclui registros arquivados | Release/Manual/Escopo | `uk_release_ano_semana`, `uk_manual_ano_mes`, `uk_projetos_ano_versao` | Não é possível recriar um ciclo arquivado; decidir regra e documentar (índice parcial via coluna gerada) |
| **RL06-B-05** | `Publicado` com data futura e ausência de `publicado_em` | Visibilidade | `RW-52/2026` `Publicado` com `data_publicacao=2026-12-28`; chamada `0000545878` idem; schema não tem `publicado_em` | Se a Área Pública filtrar só `status`, exporá conteúdo agendado antes da data; adicionar `publicado_em` e aplicar `<= NOW()` |
| **RL06-B-06** | TipTap entra no bundle da rota Lançar antes de abrir o editor | Frontend/Bundle | `RichText.client.vue:9-12`; rota 760 KB/252 KB gz vs 201–284 KB/69–107 KB gz; chunk TipTap 449 KB/139 KB gz | ~145 KB gz extras em tela de consulta; `defineAsyncComponent`/`LazyUiRichText` |
| **RL06-B-07** | Transações longas nas importações e 1 INSERT por URL de mídia | Importações/Mídias | `lancar-chamadas.ts:1101-1108`; `midias.ts:85-105`; loops em manuais/release/escopo/parceiros/softwares; usuários já usa chunks de 200 | Conexão presa por segundos; multi-row em chunks e upsert único de mídias |
| **RL06-B-08** | Ícone direito do `UiInput` é `<div @click>` (mouse-only) | UI kit | `ui/Input.vue:171-181`; `DataTable.vue:673-674`; `parceiros/Grade.vue:67-68`; `LoginForm.vue:136` | Ação sem equivalente por teclado; `<button type="button" aria-label>` |
| **RL06-B-09** | Texto de apoio em `text-slate-400` abaixo do AA | UI kit/telas | `#94a3b8` sobre branco ≈ 2,54:1; `UploadFiles.vue:187`, `DataTable.vue:1038`, `esteira/Board.vue:213`, `parceiros/Grade.vue:110`, `Kpi.vue:73` | Baixa legibilidade; usar `slate-500/600` em texto (400 só em ícone decorativo) |
| **RL06-B-10** | “Limpar Filtros” aplica imediatamente dentro do modal de rascunho | 10 módulos | `softwares/Filtros.vue:53-57`; `esteira/Filtros.vue:89-92`; `usuarios/Filtros.vue:51-55`; `lancar-chamadas/Filtros.vue:113-116` | “Cancelar” não desfaz; limpar só o rascunho e aplicar no “Aplicar” |
| **RL06-B-11** | “Recusar” desabilitado sem explicar requisito; validação inalcançável | Lançar/Esteira | `lancar-chamadas/Recusar.vue:35-46,63,77,90`; `esteira/Decisao.vue:78-84,153` | Usuário acha que não tem permissão; marcar obrigatório e validar no clique |
| **RL06-B-12** | Códigos/datas sem mono/tabular em tabelas | Softwares/Release/Manuais/Auditoria | `softwares/Tabela.vue:31,35-36`; `release-week/Tabela.vue:43`; `manuais/Tabela.vue:52`; `auditoria/Tabela.vue:26` | Leitura de identificadores pior; `#cell` mono + `tabular-nums` |
| **RL06-B-13** | Vitrine §27 com caracteres corrompidos e fora do índice | `/design` | `design.vue:737,742,3438-3439,3451,3453,3460-3461`; índice em 706-732 termina na 26 | Texto/aria-label degradados; corrigir encoding e adicionar “27. Gráficos” |
| **RL06-B-14** | Menus “Relatórios/Exportar” reimplementados fora do `UiActionMenu` | 7 telas | `softwares/Cabecalho.vue:31-42,128-162`; `auditoria/Cabecalho.vue:19-30`; canônico em `ui/ActionMenu.vue:196-197` | Sem setas/Home/End/retorno de foco; usar o componente do kit |
| **RL06-B-15** | Textos/rótulos imprecisos | Auth/Paginação/Convite | “Enviar link” quando envia senha provisória (`ForgotForm.vue:5-11,115,143-147`); “parceiros exibidas” (`Pagination.vue:64`); `title` nativo no convite (`Convite.vue:359`) | Expectativa errada e feedback inconsistente; corrigir textos e usar `UiTooltip` |
| **RL06-B-16** | SQL bruto exposto em Configurações → Retenção | Configurações | `AbaRetencaoAuditoria.vue:37-40,107` (`DELETE FROM auditoria …`) | Ruído técnico; resumo em linguagem natural com detalhe recolhido |
| **RL06-B-17** | Documentação do design system divergente | `docs/01`/AGENTS | “26 componentes”/“20 seções” × 36/27; `UploadFiles.dica` “SVG” × “WebP/GIF”; “Bloqueio 30 min” × 15 min; §5.28 com mojibake | Atualizar contagem, dica, token e encoding |
| **RL06-B-18** | Hex de marca em classes arbitrárias nas telas novas | Softwares/Parceiros/Lançar/Auditoria/Esteira | `softwares/Cabecalho.vue:105`; `parceiros/Cabecalho.vue:91`; `lancar-chamadas/Cabecalho.vue:106`; `auditoria/Cabecalho.vue:95`; `esteira/Cabecalho.vue:8` | Drift de token; usar classes de token ou documentar a exceção |
| **RL06-B-19** | Specs de login/layout dizem que só login e esqueci-senha não têm shell | login/layout-navigation | `login/spec.md:20-21,208-214`; `layout-navigation/spec.md:156-161`; `primeiro-acesso.vue:5` usa `layout:'auth'`; `docs/08:54-57` lista 3 | Guarda documentada incompleta; incluir `primeiro-acesso` |
| **RL06-B-20** | `docs/03:264,271`; `docs/05:356` desatualizados | Navegação | Parceiros/Softwares “sem spec” (existem); `SidebarItem` sem `to`/`modulo` (tem); Painel e itens “sem rota” (todos têm) | Referência enganosa; atualizar |
| **RL06-B-21** | Contagens/seções da vitrine e do design system | docs/01/AGENTS/vitrine | `docs/01:8` “26” (36); `AGENTS.md:44` “seções 1-15” (27); array `secoes` até 26 (`design.vue:707-732`) | Documentação incompleta; atualizar faixa e índice |
| **RL06-B-22** | `docs/15:100` diz “Desaprovar apenas em `Aprovado`”; `:154` e o código aceitam `Aprovado` ou `Recusado` | Lançar as Chamadas | `server/utils/lancar-chamadas.ts:837` | QA pode considerar a ação indisponível em `Recusado`; corrigir a linha 100 |
| **RL06-B-23** | `.env.example` não lista `DB_TIMEZONE`, documentado em `docs/02:672-673` | Config/Infra | `server/utils/db.ts:29` consome | Operador pode não descobrir a configuração; incluir `# DB_TIMEZONE=` |

### 4.5 Melhorias

| ID | Achado | Origem | Correção |
| :--- | :--- | :--- | :--- |
| **RL06-I-01** | Imutabilidade de `historico_esteira_revisao`/`auditoria` não é imposta no banco (sem triggers; usuário com DML/DDL total) | qa-banco `BD-12` | Restringir grants e/ou triggers bloqueando `UPDATE`/`DELETE` (exceto expurgo controlado) |
| **RL06-I-02** | 6 queries de SSR por página, shell e permissões em série, `getConfiguracoes()`/`listarOpcoesChamadas()` sem cache, `/api/usuarios/eu` revalida a sessão | qa-performance `PERF-07` | Cachear shell/config/opções (TTL + invalidação), paralelizar shell+permissões, single-flight no cache, usar `event.context.sessaoUsuario` |

---

## 5. Itens verificados e aprovados (com evidência)

| # | Verificação | Resultado | Evidência |
| :--- | :--- | :--- | :--- |
| 5.1 | Fronteira Pública × Admin — APIs sem sessão | **PASS** | 74 endpoints administrativos/de apoio testados (GET/POST/PUT/DELETE) → `401`; inclui softwares, parceiros, release-week, manuais, escopo, lançar-chamadas, esteira e painel; `server/middleware/auth-api.ts:9-27` |
| 5.2 | Rotas `/admin/**` sem sessão | **PASS** | `/admin`, `/admin/release-week`, `/admin/esteira`, `/admin/gestao-usuarios` → `302 /admin/login?redirect=…`; `app/middleware/auth.global.ts:32-36` |
| 5.3 | Porta pública mínima | **PASS** | `GET /api/configuracoes/identidade` → `{ "logo_login_url": "/uploads/logomarcas/…" }`; `/` é placeholder sem fetch; não há APIs públicas de conteúdo |
| 5.4 | RBAC por módulo nas rotas | **PASS** | 74 chamadas de `requirePermission`; ações fixas e extras (`publicar`, `arquivar`, `importar`, `exportar`, `download`, `filtrar`, `buscar`, `permissoes`, `convite`, `clonar`, `visualizar_itens`); `403` verificado com Editor/Revisor/Leitor, exceto o bypass C-02 |
| 5.5 | Sem bypass de Administrador | **PASS** | Administrador passa pela mesma matriz (92/92); nenhum perfil é imune ao JSON; `permission.ts` não compara nome de perfil |
| 5.6 | Matriz RBAC e seed | **PASS** | 4 perfis, 44 linhas, 11 módulos × 4 perfis; totais **92/67/41/14**; `app/config/perfis.ts` ≡ `server/utils/perfis.ts`; migrations 16/20/22/27 reconciliadas |
| 5.7 | Sessão/JWT/refresh/logout | **PASS** | HS256 fixado; segredo ≥32 com fail-fast; access 900 s; refresh opaco com rotação `FOR UPDATE`; reuso → `401`; logout revoga refresh + `token_version` (access antigo/novo → `401`); `token_version` não exposto no DTO |
| 5.8 | Senha provisória e lockout | **PASS** | Login sinaliza `provisoria:true`; APIs administrativas → `403`; troca libera; 5 falhas → bloqueio 15 min; 6ª tentativa e senha correta → `403`; e-mail inexistente → `401` genérico |
| 5.9 | Rate limit | **PASS** | Rajada de login → `429`; limite por IP em 60 s lido de configuração com cache; uploads/convite/auth cobertos |
| 5.10 | SQL Injection | **PASS** | Queries parametrizadas; `ORDER BY` por whitelist em usuários/auditoria; `escaparLike`; payloads `' OR 1=1 --`, `nome;DROP TABLE`, `(SELECT 1)` → `200` literal, sem erro/efeito |
| 5.11 | XSS (rich text e upload) | **PASS** | Único `v-html` é `RichTextViewer.vue:17-22` com HTML sanitizado no servidor (`sanitize-html`, allowlist `p/br/strong/span`, cores/tamanhos fixos); 37 testes de rich text; upload por magic bytes rejeita HTML/SVG disfarçado; `/uploads/**` com `nosniff` + CSP `sandbox` |
| 5.12 | Exposição de segredos | **PASS** | `hash_senha`/`senha_smtp`/`token_version` não serializados; `senha:''` + `temSenha`; SMTP cifrado AES-256-GCM; respostas de erro sem topologia do banco |
| 5.13 | Auditoria | **PASS** | Append-only; 59 chamadas de `registrarAuditoria`; leitura gated; IP real; escrita em `waitUntil` e resiliente; 0 seeds; ações restritas a Inclusão/Alteração/Exclusão/Homologação/Acesso |
| 5.14 | Banco — migrations e integridade | **PASS** | 30/30 migrations na ordem; 23 FKs; 15 índices únicos; **0 órfãos**, **0 duplicidades**; 0 tabelas fora de `utf8mb4`; defaults/timestamps consistentes; `ON DELETE` conferidos; junção/mídias/histórico íntegros |
| 5.15 | Transações | **PASS** (exceto A-03) | Release/Manual, esteira, importações, convite, configurações e logout usam `getTransaction` com rollback; `UPDATE … WHERE status = ?` protege dupla aprovação; `criarEscopo` é a exceção |
| 5.16 | Cascata de publicação (fluxo oficial) | **PASS** | `POST /publicar` em `RW-52/2026` promoveu `0000545878` a `Publicado`, preservou `data_liberacao`, gravou parecer automático e **uma** auditoria “Homologação”; reabrir reverte a filha para `Publicar` |
| 5.17 | Histórico da esteira | **PASS** | 33 transições; ordem decrescente (mais recente primeiro); perfil, parecer, critérios, tempo no estágio; último status do histórico = status atual em todos os itens |
| 5.18 | Guardas de exclusão/unicidade | **PASS** | Release/Manual com itens → `409`; parceiro/software com entregas → `409` (FK 1451); perfil com usuários → `409`; e-mail/perfil/chamada/semana/mês/ano+versão → `1062`/`409`; id inexistente → `404` |
| 5.19 | Anti-lockout | **PASS** | `garantirAdministracaoApos` em matriz, situação de usuário, exclusão de usuário e `atualizarPerfil`; `409` com mensagem explicativa; RL05-A-02 confirmado fechado |
| 5.20 | Configurações | **PASS** | `GET`/`PUT` completos; validação `400`; `PUT` atômico em 2 tabelas; `shell` reflete logo/sidebar; estado de segurança com constantes reais (5/15/120); retenção 30–730 |
| 5.21 | Uploads (endurecimento) | **PASS** | Magic bytes, extensão canônica, `400` para destino/travessia/ano-mês/MIME inválido, `413` acima do envelope, `nosniff`; ressalvas M-06/M-12 |
| 5.22 | Painel e KPIs (dados) | **PASS** | Contagens conferem com o banco; ano inválido → `400`; ano sem chamadas não entra no seletor; 5 lançadas/1 liberada/75%; divergência de contrato em A-07 |
| 5.23 | 404 e identidade de área | **PASS** | 404 HTTP real com página pt-BR, fora do shell; `/` sem header/sidebar; `/admin/**` com shell; login/esqueci/primeiro-acesso em `auth` |
| 5.24 | UI kit e design system | **PASS** (com M-13…M-19) | 36 componentes; `Ui*` usado nas telas; zero-pill; `brand-focus`/`rose-700`/`.ds-bottom-clip`; toasts `role=status`; datas pt-BR; modais com `role=dialog`/focus-trap; sem regressão RL05 |
| 5.25 | Migrations/boot | **PASS** | 30/30 aplicadas; `verificarDuplicatasChamadas` 10,8 ms; `uk_entregas_chamada` presente; `event_scheduler=ON`; 4 eventos `ENABLED`; nenhum DDL pendente |
| 5.26 | Gates | **PASS** (test com ressalva) | `lint` sem erros/avisos; `typecheck` 0 erros; `build` OK; `test` 246/246, com **1 timeout intermitente** em `lancar-chamadas-import-parser` sob carga paralela (isolado 7/7) |
| 5.27 | Performance do caminho feliz | **PASS** (com A-04) | APIs p50 15–44 ms; SSR 59–71 ms; paginação server-side em usuários/auditoria; `EXPLAIN` usa índices de visibilidade/ordenação; ExcelJS/jsPDF lazy; 0 N+1 de leitura |
| 5.28 | Execução E2E | **PASS parcial** | Login/sessão/refresh/logout, CRUD Software/Parceiro, unicidade/guardas, ciclo Release→Chamada→Aprovar→Publicar, esteira, uploads inválidos, importação e fronteira; FAILs em C-01/C-02/M-01/M-02/M-03/M-04/M-05 |

---

## 6. Regressões e reaberturas

| Item | Classificação | Observação |
| :--- | :--- | :--- |
| RL05-A-01 (revogação em troca/reset de senha) | **Reaberto parcialmente** | `trocar-senha`, `convite` e `PUT /api/usuarios/:id` revogam; **`esqueci-senha` não** (RL06-A-01) |
| RL05-M-02 (upload/DoS) | **Reaberto parcialmente** | Limite por `content-length` e pré-checagem existem, mas permissão ocorre após o parse e `chunked` escapa (RL06-M-06) |
| RL05-M-06 (privilégios de banco) | **Não corrigido** | Continua `ALL PRIVILEGES … WITH GRANT OPTION` (RL06-M-07) |
| RL05-PERF-03 (pool) | **Piorou** | Falhava em N=40–60; agora `500` em N≈10 nas telas novas (RL06-A-04) |
| RL05-A-02 (anti-lockout de perfil) | **Corrigido e confirmado** | `atualizarPerfil` chama `garantirAdministracaoApos`; E2E `409` |
| RL05-M-01 (convite) | **Corrigido e confirmado** | Conta não-Ativa → `400`; conta existente exige `alterar`; sessões revogadas |
| RL05-M-03/M-04 (cookies/logout) | **Corrigido e confirmado** | `__Host-*` removidos com `secure`/`sameSite`; logout transacional e sem sessão órfã |
| RL05-B-01/B-02/B-04/B-11 | **Corrigidos** | CSV anti-fórmula, `escaparLike`, DTO sem `tokenVersion`, `1062` → `409` na importação |
| RL05-B-14…B-19 | **Corrigidos** | Vitrine sem lixo/“Successo”/cor errada; rodapé da 404; default do UploadFiles; textos técnicos |
| RL05-design system / 404 | **Sem regressão** | Nenhum item visual do RL05 reaberto |
| Achados novos de segurança | **Novos** | C-01 (mídia), C-02 (bypass), A-02 (Painel), M-08 (XFF), M-09 (hierarquia) |
| Achados novos de banco | **Novos** | A-03 (atomicidade), A-05 (arquivamento), M-05 (views), B-03/B-04/B-05 |
| Achados novos de performance | **Novos** | M-10/M-11/M-12 e A-04 (agravamento) |

---

## 7. Matriz de aprovação (`docs/qa/00`)

| Critério | Resultado |
| :--- | :--- |
| Sem bugs críticos | **FALHA** — RL06-C-01, RL06-C-02 |
| Sem bugs altos | **FALHA** — RL06-A-01 … RL06-A-08 |
| Regressão inexistente | **FALHA** — A-01 (RL05-A-01 parcial), M-06 (RL05-M-02 parcial), M-07 (RL05-M-06), A-04 (pool pior) |
| Banco consistente | **FALHA** — M-05 (3 views inválidas), A-03 (atomicidade), A-05 (invariante); integridade referencial OK (0 órfãos/0 duplicidades) |
| Permissões corretas | **FALHA** — C-02 (bypass `publicar`), A-02 (Painel sem RBAC), M-09 (hierarquia) |
| Sem bypass da fronteira nem exposição de não publicado | **FALHA** — C-01 (mídias anônimas) |
| Sem falha de segurança | **FALHA** — C-01, C-02, A-01, A-02, M-06, M-07, M-08, M-09 |

### VEREDITO: **REPROVADO** · Risco **CRÍTICO**

> A Área Administrativa **não está liberada** para o início da Área Pública. O caminho oficial de publicação está correto, mas há duas portas abertas (exposição anônima de mídia e publicação sem permissão) e uma sessão que sobrevive ao reset de credencial. Pela matriz, qualquer uma delas já reprova; juntas, exigem correção bloqueante antes da próxima etapa.

---

## 8. Plano de correção priorizado

### Etapa RL06-1 — Bloqueante (não iniciar a Área Pública sem esta etapa)

| Ordem | ID | Correção | Critério de aceite |
| :---: | :--- | :--- | :--- |
| 1 | **C-01** | Servir `uploads/chamadas/**` por rota autenticada/autorizada com verificação de status do item **e** do pai, ou URL assinada; remover do `publicAssets`; manter públicos só logos/avatares | Anônimo em qualquer mídia de chamada não publicada → `401/403/404`; mídia de chamada `Publicado` com pai ativo → acessível; teste E2E cobre os 5 status |
| 2 | **C-02** | Remover `status` do `PUT`/`POST` genéricos ou exigir `publicar` na transição para `Publicado`; centralizar máquina de estados; gravar/limpar `data_aprovacao`; auditar “Homologação” | Revisor (sem `publicar`) em `PUT` com `Publicado` → `403`; admin em `/publicar` → `200` + cascata + `data_aprovacao`; testes por perfil nos 3 módulos |
| 3 | **A-01** | `esqueci-senha` revoga sessões e incrementa `token_version` na mesma transação; validar `senha_provisoria` na sessão | Access/refresh anteriores ao reset → `401`; login com a provisória funciona; teste E2E |
| 4 | **A-02** | Exigir `visualizar` dos módulos agregados (ou mascarar não publicados para quem não tem `publicar`); filtrar `arquivada=0`; atualizar spec do Painel | Leitor não vê título/status de conteúdo não publicado; KPIs conferem; spec alinhada |
| 5 | **A-03** | `criarEscopo` com insert + cascata na mesma transação | Falha induzida na cascata → rollback total; teste de integração |
| 6 | **A-04** | Consolidar consultas do Painel (1–3), limitar paralelismo, cachear agregados, enxugar Esteira, elevar pool por env e mapear fila para `503` + `Retry-After` | N=20 sem `500`; p95 aceitável; teste de carga reproduzível |
| 7 | **A-05** | Decidir e implementar o invariante de arquivamento (reconciliar filhas **ou** join obrigatório com pai `arquivada=0` em toda leitura pública); documentar na spec | Nenhuma filha `Publicado` com pai arquivado; consulta pública nega; teste de regressão |

**Critério de saída RL06-1:** 0 Crítica, 0 Alta; nenhuma exposição anônima de conteúdo não publicado; nenhum bypass de `publicar`; revogação de sessão completa; escopo atômico; pool estável em N=20; invariante de arquivamento decidido e coberto por teste.

### Etapa RL06-2 — Consistência e contrato (antes ou junto da Área Pública)

8. **M-01…M-04** — segunda-feira, filtro `Publicado` da Esteira, herança da Data de liberação e `404` do histórico.
9. **M-05** — migration reconciliatória das 3 views + `arquivada` na view de manuais.
10. **M-06/M-07/M-08/M-09** — upload com pré-autorização/streaming, usuário de banco mínimo, validação de `TRUSTED_PROXIES` e hierarquia de atribuição de perfil.
11. **M-10/M-11/M-12** — agregações indexadas do Painel, paginação/projeção de Chamadas/Esteira e miniaturas/cache/lazy de imagens.
12. **M-13…M-19** — estados de erro com retry, anti-duplo-envio, mapa único de status, paginação em 320 px, foco/drawer, nome acessível da busca e do rich text.
13. **A-06/A-07/A-08 + M-20…M-30** — alinhar a fonte da verdade: catálogo RBAC (11 módulos + rotas), fórmula do KPI, contrato do formulário de Chamadas, cascata nos docs 12–14, `docs/bd/01`, totais de seed, `docs/02`, `docs/10/11/13`, spec de Softwares/Uploads/Usuários.
14. **B-01…B-05** — `data_aprovacao`, datas da listagem de usuários, `entidade_id`, unicidade com arquivadas e `publicado_em`/data futura.

**Critério de saída RL06-2:** 0 Média de produto/segurança/performance; specs e docs sem contradição bloqueante; UX com estados de erro e A11y básica; banco sem views inválidas.

### Etapa RL06-3 — Polimento e roadmap

15. **B-06…B-23** — bundle do TipTap, transações longas, acessibilidade/contraste, textos, vitrine, menus, documentação de contagem/seções e `DB_TIMEZONE`.
16. **I-01/I-02** — imutabilidade no banco e cache/fanout de SSR.
17. **Roadmap já declarado** — FULLTEXT, export streaming, `/api/usuarios/emails`, headers globais/CSRF, store persistente de rate limit, compressão/CDN e validação em produção.

---

## 9. Rastreabilidade de IDs

| Consolidado | Origem |
| :--- | :--- |
| RL06-C-01 | FUN-02 = SEG-01 = BD-01 = EXE-01 |
| RL06-C-02 | FUN-01 = SEG-02 = BD-02 = EXE-02 |
| RL06-A-01 | SEG-04 = BD-04 = EXE-03 |
| RL06-A-02 | SEG-03 = BD-07 = EXE-05 |
| RL06-A-03 | BD-05 = EXE-04 |
| RL06-A-04 | PERF-01 |
| RL06-A-05 | BD-03 = EXE-11 |
| RL06-A-06 … A-08 | DOC-01, DOC-02, DOC-03 |
| RL06-M-01 | FUN-03 = EXE-06 (parte de DOC-03) |
| RL06-M-02 | FUN-04 = EXE-08 |
| RL06-M-03 | FUN-05 = EXE-07 (parte de DOC-03) |
| RL06-M-04 | FUN-06 = EXE-09 |
| RL06-M-05 | BD-06 = EXE-10 |
| RL06-M-06 | SEG-05 = SEG-06 |
| RL06-M-07 | SEG-07 = BD-08 |
| RL06-M-08 | SEG-08 |
| RL06-M-09 | SEG-09 |
| RL06-M-10 … M-12 | PERF-02, PERF-03, PERF-04 |
| RL06-M-13 … M-19 | UX-01 … UX-07 |
| RL06-M-20 … M-30 | DOC-04 … DOC-14 |
| RL06-B-01/B-02 | FUN-07, FUN-08 |
| RL06-B-03/B-04/B-05 | BD-09, BD-10, BD-11 |
| RL06-B-06/B-07 | PERF-05, PERF-06 |
| RL06-B-08 … B-18 | UX-08 … UX-18 |
| RL06-B-19 … B-23 | DOC-15 … DOC-19 |
| RL06-I-01/I-02 | BD-12, PERF-07 |

---

## 10. Incidentes de QA, efeitos colaterais e estado final do ambiente

### 10.1 Incidentes declarados (obrigatório)

1. **Usuário `Gabriel Faria`** — durante teste negativo de exclusão via API, o `qa-funcional` removeu e reinseriu o registro com o mesmo id/nome/e-mail/perfil/Ativo/`criado_em`/`senha_provisoria=1`. **O hash bcrypt original foi substituído por um segredo aleatório não divulgado.** A conta precisa de **novo convite** (ou redefinição de senha) para voltar a autenticar. Não é possível restaurar o hash original.
2. **Perfil `Leitor`** — foi removido e reinserido com a descrição do seed e as 11 linhas de matriz; o total atual confere com a matriz normativa **14** (fixas 3 + extras 11). Nenhuma divergência residual detectada na matriz (92/67/41/14, 44 linhas).
3. **Software `SFT-045`** — criado acidentalmente e excluído na sequência; restaram eventos de auditoria “Inclusão/Exclusão SFT-045” (append-only).
4. **Dados de teste E2E** — usuários temporários (`rl06.e2e.*`), `RW-46/2026`, `RW-47/2026`, `MAN-12/2026`, `PE-2026.02`, chamadas `RL06-E2E-*`, software/parceiro de teste e upload de travessia foram criados e removidos; o baseline de negócio foi restaurado (5 chamadas, 3 releases, 1 manual, 1 escopo, 44 softwares, 7 parceiros, 5 usuários).
5. **Performance** — 5.005 `entregas_itens` + 20.000 `auditoria` + 5.000 históricos inseridos em transação e **revertidos**; ~14 eventos `Acesso` e sessões de medição permanecem (append-only/expurgo).
6. **Segurança** — usuários temporários de fuzzing de RBAC criados e removidos; nenhuma conta real foi bloqueada; nenhum e-mail foi enviado.
7. **Nenhum código foi alterado.** `git status` limpo (sem scripts `_rl06_*` ou artefatos não rastreados ao final).

### 10.2 Estado final observado (snapshot de fechamento)

| Item | Estado |
| :--- | :--- |
| Migrations | 30 registradas (`01`–`30`) |
| Tabelas/views | 21 base (20 aplicação + `_migrations`) + 4 views; **3 views inválidas** (`v_release_itens`, `v_projeto_itens`, `v_manual_itens`) e a view `manuais` sem `arquivada` |
| Usuários/perfis | 5 usuários; 4 perfis Ativos; matriz 44 linhas / **92/67/41/14** |
| Conteúdo | 3 releases (`RW-43` Em Revisão com `data_aprovacao` residual; `RW-44` Em Revisão; `RW-52` Publicado com `data_publicacao=2026-12-28`), 1 manual, 1 escopo, 5 chamadas (1 Revisar, 1 Aprovado, 2 Publicar, 1 Publicado), 9 mídias, 33 históricos |
| Auditoria/sessões | 235 eventos e 252 sessões no snapshot (atividade de QA); append-only; 0 seeds |
| Artefatos de QA a limpar antes de produção | `RW-52/2026` e chamada `0000545878` (publicados com data futura, criados em rodada anterior), eventos de auditoria de QA, sessões órfãs de QA, convite do `Gabriel Faria` |
| Event Scheduler | `ON`; 4 eventos `ENABLED`; `LAST_EXECUTED` nulo na janela por uptime curto (não é evidência de falha) |

---

## 11. Conclusão

A Área Administrativa chegou ao fim do seu ciclo com **maturidade funcional real**: o fluxo editorial completo funciona, a cascata oficial publica corretamente, a esteira grava histórico imutável, o RBAC é dinâmico e aplicado no servidor, a fronteira de APIs é fechada, o banco está estruturalmente íntegro e o design system é consistente. Os 30/30 migrations, os 246 testes verdes, o `lint`/`typecheck`/`build` e a execução E2E confirmam uma base sólida.

Isso **não basta para aprovar**. Duas falhas são inaceitáveis para a próxima etapa: **mídia de conteúdo não publicado servida anonimamente** (C-01) e **publicação sem a permissão `publicar`** (C-02). Somam-se a recuperação de senha que não expulsa sessões (A-01), o Painel que expõe rascunhos a qualquer sessão (A-02), a criação de escopo não atômica (A-03), o pool que devolve `500` em concorrência moderada (A-04) e o invariante de arquivamento (A-05). Enquanto esses sete itens estiverem abertos, a Área Pública herdaria portas de exposição e inconsistência.

**Decisão do orquestrador: REPROVADO — Risco Crítico.** Executar a **Etapa RL06-1** integralmente, reauditar com foco em segurança + banco + execução e só então iniciar a Área Pública. A **Etapa RL06-2** deve entrar junto do primeiro ciclo da Área Pública (contratos, docs, UX e performance); a **Etapa RL06-3** é polimento/roadmap.

> **Regra de ouro para a próxima etapa:** toda leitura pública deve provar, na query, que o registro e o pai estão `Publicado` **e** `arquivada=0` **e** `publicado_em <= NOW()` (ou regra equivalente documentada). Nenhuma mídia, listagem, detalhe, busca, contagem ou exportação pública pode escapar desse filtro.

---

## Apêndice A — Parecer de segurança (resumo)

- **Fronteira:** 74 endpoints sem sessão → `401`; `/admin/**` → `302`; identidade pública mínima. **Quebra:** `/uploads/chamadas/**` (C-01).
- **RBAC:** `requirePermission` em todas as rotas de módulo; matriz 92/67/41/14; extras exigidos; sem bypass de Administrador. **Quebras:** `publicar` via edição (C-02) e Painel sem RBAC (A-02).
- **Sessão:** HS256, access 900 s, refresh opaco rotativo, reuso `401`, logout transacional, senha provisória `403`, lockout 5/15 min, rate limit `429`. **Quebra:** `esqueci-senha` (A-01).
- **Injeção/XSS:** SQL parametrizado/whitelist; rich text sanitizado; upload por magic bytes; `nosniff` + CSP; CSV anti-fórmula. **Sem achados críticos.**
- **Segredos:** nenhum hash/SMTP/token em respostas; SMTP cifrado. **Sem achados.**
- **Endurecimento:** parse antes da permissão/chunked (M-06), grants totais (M-07), XFF (M-08), hierarquia de perfil (M-09).
- **N/A:** headers globais/CSRF token, 2FA, produção, envio real de e-mail.

## Apêndice B — Execução E2E (resumo)

- **Cenários executados:** 40+ (login inválido/válido, refresh/reuso, logout/replay, provisória, fronteira, CRUD, unicidade, guardas, ciclo, cascata, esteira, transições inválidas, uploads inválidos/travessia, importação, painel, leituras, RBAC, views, gates).
- **PASS:** 33+ cenários, incluindo toda a fronteira de APIs, sessão, CRUD, unicidade/guardas, cascata oficial e uploads maliciosos.
- **FAIL objetivos:** mídia anônima (13), bypass `publicar` (21), filtro da Esteira (26), histórico `200 []` (27), views inválidas (39).
- **PASS conforme spec, com risco:** Painel acessível a Leitor (36) e arquivamento sem reconciliação (38) — ver A-02/A-05.
- **Limitações:** sem browser real (modais, clipboard, PDF/CSV no navegador, responsividade), sem e-mail real, sem lockout forçado, sem build concorrente ao dev server.

## Apêndice C — Performance (medições selecionadas)

| Endpoint | p50 / p95 | Payload | Queries | Observação |
| :--- | ---: | ---: | ---: | :--- |
| `/api/auth/seguro` | 15,7 / 18,9 ms | 0,2 KB | 1 | JWT + sessão |
| `/api/configuracoes/shell` | 15,4 / 17,4 ms | 0,3 KB | 3 | sem cache |
| `/api/usuarios` | 25,8 / 28,0 ms | 4,3 KB | 4–6 | `ALL` + filesort |
| `/api/auditoria` | 20,2 / 29,7 ms | 8,9 KB | 5–7 | índice de data |
| `/api/softwares` | 20,8 / 24,3 ms | 9,5 KB | 3 | PK |
| `/api/release-week` | 18,5 / 25,1 ms | 1,8 KB | 3 | índice de arquivada |
| `/api/lancar-chamadas` | 23,6 / 29,6 ms | 10,1 KB | 5 | `ALL` + filesort |
| `/api/esteira-revisao` | 26,9 / 40,4 ms | 20,5 KB | 14 | sem paginação |
| `/api/painel-executivo` | 38,1 / 44,6 ms | 6,0 KB | **14** | 5 full scans; 500 em N=10 |
| SSR `/admin` | 59 ms | 22,0 KB | 6 | dados no cliente |
| `POST /api/auth/login` | 908–1.354 ms | 0,2 KB | bcrypt 12 | CPU-bound |

## Apêndice D — Validação documental

- `openspec list --specs`: **42** specs (22 funcionais + 20 design-system).
- `openspec validate --specs --strict`: **42 passed, 0 failed** (apenas `INFO` de requisitos > 500 caracteres).
- `openspec/changes`: apenas `archive/` (95 changes arquivadas); nenhum delta ativo.
- Migrations: 30 arquivos e 30 registros em `_migrations`, na ordem `01`–`30`; todos com bloco `REVERTER`; nenhum `USE`.
- Código: 84 rotas em `server/api`; 18 páginas; 36 componentes `ui/`; 15 composables.

---

*Relatório gerado pelo Agente Oficial de QA do Publications (Dicas Teorema) em 23/10/2026. Nenhum código foi alterado. Os pareceres das sete especialidades foram consolidados e deduplicados; os dados de teste e seus efeitos estão declarados na seção 10.*