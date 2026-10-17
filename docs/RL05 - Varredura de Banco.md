# RL05 — Varredura de Banco (Etapa 7)

| Campo | Valor |
| :--- | :--- |
| **ID** | RL05-BD |
| **Tipo** | Auditoria de banco de dados (Etapa 7) — reexecução da varredura final |
| **Base normativa** | `docs/qa/00`, `docs/qa/03`, `docs/02`, `server/migration/*.sql`, `server/api/**`, `server/utils/**`, `openspec/specs/**` |
| **Data** | 17/10/2026 |
| **Ambiente** | MariaDB **11.8.6** (`localhost:3306`, db `publications`, user `zampier`) |
| **Método** | **Somente leitura**: SQL + `information_schema` + `EXPLAIN` + análise estática de `server/api`/`server/utils`. Nenhum dado ou schema foi alterado. |
| **Migrations aplicadas** | **12/12** (todas registradas em `_migrations`, sem pendências) |
| **Veredito** | **APROVADO COM RESSALVAS** |
| **Risco** | **Médio** |

> Escopo da Etapa 7 (persistência/integridade). Permissões, segurança, UX e performance de runtime pertencem aos respectivos especialistas; aqui só o que cruza a camada de dados.

---

## 1. Resumo executivo

- **Status: APROVADO COM RESSALVAS.** O banco está **estruturalmente íntegro e consistente**: 12/12 migrations registradas, 0 órfãos em 15 verificações de FK, 0 duplicidades em 8 verificações de unicidade, FKs com as regras `CASCADE`/`RESTRICT`/`SET NULL` exatamente como o schema declara, `utf8mb4_unicode_520_ci` em 100% das tabelas, `criado_em`/`atualizado_em` com `DEFAULT CURRENT_TIMESTAMP(6)`/`ON UPDATE`, `numero` com default `''` (migration 04) e matriz RBAC **99/45/21/6** confirmada por SQL.
- **Atomicidade:** as escritas compostas administrativas usam `getTransaction()` (usuários, perfis/matriz, configurações, convite, importação, rotação de refresh e lockout). A exceção é o **logout**, que revoga access e refresh em duas queries independentes e ainda pode deixar uma **sessão órfã ativa** quando o access está expirado — ressalva confirmada e ampliada.
- **TTL de 7 dias do refresh:** confirmado no código (`REFRESH_TTL_DIAS = 7`, `auth.ts:43-45`) e no banco — 29 das 30 sessões ativas com `expira_em - criado_em = 604799 s` (~7 dias). Permanecem **157 sessões legadas** de 604 s (pré-correção RL04-A-01), todas já revogadas, e **1 sessão ativa com TTL atípico de 606920 s**.
- **Drift encontrado:** a migration **07 (seed de auditoria)** está registrada em `_migrations` como aplicada, mas os **25 registros `log-seed-*` estão ausentes** do banco (0 linhas) — o runner nunca a reexecuta e não há mecanismo de restauração.
- **Expurgo:** os 4 eventos (`ev_expurgo_*`) estão `ENABLED` com `LAST_EXECUTED = NULL` e o Event Scheduler está `ON`; a cobertura é feita pelo catch-up no boot.
- **Itens conhecidos confirmados:** (a) 4 eventos com `LAST_EXECUTED = null`; (b) usuário de aplicação com `ALL PRIVILEGES ON *.* … WITH GRANT OPTION`; (c) logout não atômico.
- **Fronteira Pública × Administrativa e RBAC:** verificadas do lado dos dados — não há rota/API pública de conteúdo (Área Pública é placeholder), de modo que o filtro de visibilidade pública é **N/A**; o RBAC é alimentado pela matriz do banco (11 módulos × 4 perfis = 44 linhas) e a guarda anti-lockout só é chamada nos fluxos de usuário, **não** na inativação de perfil.
- **Sem soft delete:** não existe coluna de exclusão lógica em nenhuma tabela; a exclusão é física e intencional.

### 1.1 Placar

| Severidade | Qtd | IDs |
| :--- | ---: | :--- |
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 5 | RL05-BD-01 … RL05-BD-05 |
| Baixa | 5 | RL05-BD-06 … RL05-BD-10 |
| Melhoria | 1 | RL05-BD-11 |
| Observação (informativa) | 1 | RL05-BD-12 |
| Escopo não aplicável | 2 | Filtro de visibilidade pública; soft delete |

---

## 2. Cobertura executada

| Item | Situação |
| :--- | :--- |
| INSERT/UPDATE/DELETE | Analisados estaticamente (nenhuma escrita executada); transações verificadas |
| Integridade referencial (FKs) | Executado — 15 checagens de órfãos, 0 ocorrências |
| Unicidade (constraints/índices únicos) | Executado — 8 checagens de duplicidade, 0 ocorrências |
| Timestamps / valores padrão | Executado — defaults e `ON UPDATE` conferidos |
| Consistência (junctions/status) | Executado — matriz, perfis×usuários, sessões |
| Transações (`getTransaction`) | Estático — 20 pontos de uso; 1 exceção (logout) |
| Migrations × `_migrations` | Executado — 12/12, 0 pendências; **1 drift de dados (seed 07)** |
| Índices da migration 12 (EXPLAIN) | Executado — 1 efetivo, 1 no-op (pré-existente) |
| Expurgo (`LAST_EXECUTED`) | Executado — 4 eventos `ENABLED`/`NULL` |
| Fronteira Pública × Admin / RBAC | Executado do lado de dados (matriz por perfil) |
| Soft delete | **N/A** — não previsto no schema |

---

## 3. Escopos não aplicáveis

1. **Filtro de visibilidade pública (`status`/`ativo`)** — a Área Pública é apenas o placeholder `app/pages/index.vue`; não há endpoint público de conteúdo (`release_week`/`manuais_mensal`/`projetos_escopo`). Nenhuma query pública existe para filtrar. **N/A.**
2. **Soft delete** — não há coluna de exclusão lógica (0 colunas `%deleted%`/`%excluido%`/`%removido%`). A exclusão é física, por decisão de projeto. **N/A.**
3. **Conteúdo público (`entregas_itens`, `anexos_midias`, `historico_esteira_revisao`)** — tabelas existem no schema (com FKs corretas), porém sem UI/API; integridade referencial verificada, operações de escrita não exercitáveis. **N/A operacional.**

---

## 4. Achados

### 4.1 Médias

#### RL05-BD-01 · Logout não atômico e sessão órfã ativa quando o access está expirado
- **Severidade:** Média
- **Módulo:** Autenticação / Sessões (`sessoes`, `usuarios.token_version`)
- **Cenário:** (i) falha entre as duas revogações do logout; (ii) logout com access expirado (~15 min) e refresh válido.
- **Esperado:** logout revoga refresh **e** access de forma atômica, sem deixar sessão ativa.
- **Obtido:** `server/api/auth/logout/index.post.ts:15-21` executa `revogarSessao(refresh)` (`UPDATE sessoes`) e `revogarAccessVigente(sessao.id)` (`UPDATE usuarios`) como **duas queries independentes, sem `getTransaction()`**. Agravante: `getSessionUser(event)` (linha 15), com access expirado, chama `renovarSessao` → `rotacionarSessao` (`auth.ts:168-203`), que **revoga a linha antiga e INSERE uma nova linha** em `sessoes`; a seguir, `getCookie(event,'auth-refresh')` (linha 16) lê o cookie **antigo** (o novo só existe na resposta), então `revogarSessao` não encontra a linha nova — que **permanece ATIVA no banco**, sem token correspondente no cliente.
- **Passos:** login → aguardar o access expirar → `POST /api/auth/logout` → inspecionar `sessoes`: há uma linha com `revogado_em IS NULL` recém-inserida para o usuário.
- **Evidências:** `server/api/auth/logout/index.post.ts:15-21`; `server/utils/auth.ts:168-203,206-212,371-390`. Estado no banco (17/10/2026 18:14): `sessoes` 202 linhas, **30 ativas**, 172 revogadas, **0 expiradas sem revogar**.
- **Impacto:** revogação incompleta no logout e resíduo de sessão ativa (higiene/churn de `sessoes`); **não há bypass** — ninguém detém o refresh. A revogação por `token_version` é global à conta (afeta access de todos os dispositivos, mas cada dispositivo reautentica pelo refresh, que continua válido).
- **Correção recomendada:** envolver as duas revogações em `getTransaction()` e revogar a sessão pelo `id` devolvido pela rotação (ou ler/validar o refresh **antes** de `getSessionUser`, evitando a renovação dentro do logout).

#### RL05-BD-02 · Convite redefine credenciais de conta Inativa/Bloqueada existente
- **Severidade:** Média
- **Módulo:** Convite × Gestão de Usuários (`usuarios`)
- **Cenário:** `POST /api/convite` para e-mail de conta **existente Inativa**, com `situacao` `Ativo` (ou omitido — default `Ativo`).
- **Esperado (spec "O convite só atribui credenciais a usuário Ativo"):** `400`, nenhuma credencial gerada.
- **Obtido:** a rota valida apenas `body.situacao` (`convite/index.post.ts:86-91`) e **nunca lê a situação da conta** existente; o `UPDATE` (`:109-112`) regrava `hash_senha`, `senha_provisoria=1`, `tentativas_falhas=0`, `bloqueado_ate=NULL` e devolve `200 {ok:true,criado:false}`. A conta continua `Inativa` e não autentica (login recusa situação/perfil), mas o banco guarda credencial nova válida para conta bloqueada.
- **Passos:** conta Inativa no banco → `POST /api/convite {email, senha, nome, perfil, situacao:"Ativo"}` → 200 e `hash_senha` alterado. (Não executado: exigiria escrita e não há conta Inativa no ambiente.)
- **Evidências:** `server/api/convite/index.post.ts:51-54,86-91,108-122`; `app/components/usuarios/Convite.vue:151`. Estado: 3 usuários, todos `Ativo`.
- **Impacto:** credencial provisória inválida entregue por e-mail; inconsistência entre credencial gravada e possibilidade real de login.
- **Correção recomendada:** carregar `usuarios.situacao` da conta existente e recusar `400` quando não for `Ativo`.

#### RL05-BD-03 · Inativar/Bloquear o perfil essencial não é recusado — invariante anti-lockout da matriz quebrada
- **Severidade:** Média
- **Módulo:** Perfis de Acesso (RBAC) × invariante de banco
- **Cenário:** `PUT /api/perfis/:id` marcando como `Inativo`/`Bloqueado` o único perfil que sustenta a administração essencial.
- **Esperado:** preservar a invariante ">= 1 usuário Ativo com `alterar` em `gestao-usuarios`, `perfis-acesso` e `configuracoes-globais`".
- **Obtido:** `atualizarPerfil` (`perfis.ts:303-322`) revoga as sessões do perfil mas **não chama `garantirAdministracaoApos`**. Como `contarAdministradoresEssenciais` exige `perfis_acesso.situacao = 'Ativo'` (`perfis.ts:369`), inativar o perfil zera o invariante. O login ainda recusa perfil não-Ativo → **lockout total**.
- **Passos:** Perfis → Editar Administrador → Inativo → Salvar (200) → login → `403 "Perfil de acesso inativo"`.
- **Evidências:** `server/utils/perfis.ts:303-326,361-388`; `server/api/auth/login/index.post.ts:76-81`. Estado: 4 perfis `Ativo`, 3 usuários `Ativo` (todos Administrador).
- **Impacto:** o banco pode ficar sem administração essencial por ação legítima de UI.
- **Correção recomendada:** chamar `garantirAdministracaoApos(tx)` também em `atualizarPerfil`, após o `UPDATE`, dentro da transação.

#### RL05-BD-04 · Drift: seed da migration 07 ausente embora registrada em `_migrations`
- **Severidade:** Média
- **Módulo:** Migrations / Auditoria
- **Cenário:** verificar os 25 registros curados da migration 07 após o boot.
- **Esperado (migration 07 + `docs/05`):** `SELECT COUNT(*) FROM auditoria WHERE id LIKE 'log-seed-%'` = **25** após a migration aplicada.
- **Obtido:** **0**. O registro mais antigo da tabela é `2026-10-15 19:21:03` — **posterior** à aplicação da migration 07 (`_migrations.aplicado_em = 2026-10-15 17:14:13`). Os 331 registros atuais são todos reais. Como `_migrations` mantém 07 como aplicada, o runner **nunca** a reexecuta e não há mecanismo de restauração do seed.
- **Evidências:**
  - `SELECT COUNT(*) FROM auditoria;` → **331**
  - `SELECT COUNT(*) FROM auditoria WHERE id LIKE 'log-seed%';` → **0**
  - `SELECT MIN(data_hora) FROM auditoria;` → `2026-10-15 19:21:03.502390`
  - `SELECT nome, aplicado_em FROM _migrations WHERE nome='07_seed_auditoria.sql';` → `2026-10-15 17:14:13.795859`
- **Impacto:** invariante documentada falha; conteúdo inicial da tela de auditoria divergente; evidencia que dados de uma migration podem desaparecer sem re-provisionamento (drift entre `_migrations` e o estado real).
- **Correção recomendada:** reconciliar (re-inserir os 25 registros manualmente **ou** criar migration 13 idempotente que recrie o seed) e documentar que a 07 não restaura dados apagados.

#### RL05-BD-05 · Usuário de banco da aplicação com `ALL PRIVILEGES ON *.* WITH GRANT OPTION`
- **Severidade:** Média (hardening de ambiente; escala para Alta caso a superfície de injeção mude)
- **Módulo:** Infraestrutura / Banco
- **Esperado:** usuário da aplicação com privilégio mínimo (DML em `publications.*` + `EVENT` para os expurgos) — `01_create_tables.sql:4-5` declara que o usuário "não deve ter privilégio de criar bancos".
- **Obtido:** `SHOW GRANTS FOR CURRENT_USER()` → `GRANT ALL PRIVILEGES ON *.* TO 'zampier'@'%' IDENTIFIED BY PASSWORD '...' WITH GRANT OPTION`.
- **Evidências:** `SHOW GRANTS FOR CURRENT_USER();` (executado). Corrobora RL05-FUN-15.
- **Impacto:** qualquer comprometimento da aplicação (ou injeção futura) tem blast radius **total** no servidor (`DROP DATABASE`, `CREATE USER`, leitura de outros schemas).
- **Correção recomendada:** criar usuário dedicado com `SELECT, INSERT, UPDATE, DELETE` em `publications.*`, `EVENT` e `SET GLOBAL event_scheduler = ON` (ou EVENT com `DEFINER` adequado); remover `GRANT OPTION` e `ALL ON *.*`.

### 4.2 Baixas / Melhorias

#### RL05-BD-06 · 4 eventos de expurgo `ENABLED` sem execução confirmada (`LAST_EXECUTED = null`)
- **Severidade:** Baixa · **Módulo:** Migrations / Expurgo
- **Obtido:** `information_schema.EVENTS` → `ev_expurgo_auditoria`, `ev_expurgo_sessoes`, `ev_expurgo_token_blacklist`, `ev_expurgo_seguranca_login`, todos `STATUS=ENABLED`, `LAST_EXECUTED=NULL`; `@@event_scheduler=ON`. O `STARTS` aponta para o próximo dia às 03:00; a cobertura imediata é do catch-up `executarExpurgo()` no boot (`plugins/migration.ts:14`).
- **Evidências:** SQL acima; `server/migration/10_auditoria_expurgo_event.sql:12-21`, `11_indices_e_expurgo.sql:16-43`; `server/utils/expurgo.ts:12-29`.
- **Impacto:** nenhuma falha imediata; expurgo agendado ainda não comprovado pelo scheduler.
- **Correção recomendada:** nenhuma obrigatória — validar `LAST_EXECUTED` após o 1º ciclo (ou registrar execução).

#### RL05-BD-07 · Sessão ativa com TTL atípico (606920 s ≈ 7,02 dias)
- **Severidade:** Baixa · **Módulo:** Sessões
- **Obtido:** entre as 30 sessões ativas, **1** (usuário `amzampier@msn.com`) tem `expira_em - criado_em = 606920 s`, fora do TTL canônico `604800 s`; as outras 29 estão em `604799 s`.
- **Evidências:** `SELECT id, TIMESTAMPDIFF(SECOND,criado_em,expira_em) ... FROM sessoes ORDER BY 2 DESC LIMIT 1;` → `606920`.
- **Impacto:** desvio do TTL de 7 dias; não é exploit (o refresh não é conhecido). Origem não determinável em leitura (provável inserção direta/teste).
- **Correção recomendada:** investigar e expirar/limpar a linha.

#### RL05-BD-08 · 157 sessões legadas com TTL de 604 s retidas (todas revogadas)
- **Severidade:** Baixa (higiene) · **Módulo:** Sessões / Expurgo
- **Obtido:** `TIMESTAMPDIFF = 604` em **157** linhas, **todas** com `revogado_em` preenchido (resíduo pré-correção RL04-A-01). Serão removidas pelo `ev_expurgo_sessoes`/catch-up 1 dia após a revogação, mas o evento ainda não executou.
- **Evidências:** `SELECT TIMESTAMPDIFF(...) ttl, COUNT(*), SUM(revogado_em IS NOT NULL) FROM sessoes GROUP BY ttl;`.
- **Impacto:** crescimento residual de `sessoes`.
- **Correção recomendada:** o catch-up já cobre; validar após o 1º ciclo de expurgo.

#### RL05-BD-09 · Migration 12: `CREATE INDEX idx_audit_usuario` é no-op (índice já existia desde a migration 01)
- **Severidade:** Baixa / Melhoria · **Módulo:** Migrations / Índices
- **Obtido:** `12_indices_seguranca.sql:10` recria `idx_audit_usuario (usuario_nome)`, já criado em `01_create_tables.sql:529`. O runner tolera o errno 1061; a migration 12 efetivamente só adicionou `idx_usuarios_bloqueado_ate`. O `EXPLAIN` confirma o índice em uso (`Using index for group-by`), mas a criação é atribuível à migration 01.
- **Evidências:** `SHOW INDEX FROM auditoria` (índice único `idx_audit_usuario`); `EXPLAIN SELECT COUNT(DISTINCT usuario_nome) FROM auditoria;` → `key=idx_audit_usuario`.
- **Impacto:** nenhum funcional; ruído de intenção (a migration sugere criar o que já existia).
- **Correção recomendada:** comentar que o índice é pré-existente (sem efeito funcional).

#### RL05-BD-10 · `token_blacklist` existe e nunca é usada (revogação por `token_version`)
- **Severidade:** Baixa (documentação) · **Módulo:** Schema / Documentação
- **Obtido:** `token_blacklist` com **0 linhas**; a revogação é feita por `usuarios.token_version` (`auth.ts:371-390`). `docs/qa/00` (linha 28) cita "blacklist em logout" — divergente do comportamento real (`docs/02 §3.4` já explica a revogação por versão).
- **Evidências:** `SELECT COUNT(*) FROM token_blacklist;` → 0.
- **Impacto:** documentação divergente; tabela ociosa.
- **Correção recomendada:** alinhar `docs/00` ao comportamento real ou decidir pela remoção da tabela (mudança de schema exige migration).

#### RL05-BD-11 · Índices sobrepostos (redundância benigna)
- **Severidade:** Melhoria · **Módulo:** Índices
- **Obtido:** `idx_audit_data_hora` (01) vs `idx_audit_data_hora_id` (11); `idx_seguranca_eventos_ocorrido_em` (05) vs `idx_seguranca_ocorrido_id` (11); `idx_seguranca_eventos_email_alvo` (05) vs prefixo de `idx_seg_email_tipo_data` (08).
- **Impacto:** custo marginal de escrita/memória; sem impacto funcional.
- **Correção recomendada:** avaliar consolidação em rodada de tuning.

#### RL05-BD-12 · (Observação) `idx_usuarios_bloqueado_ate` não escolhido no volume atual
- **Severidade:** Observação · **Módulo:** Índices / Performance
- **Obtido:** `EXPLAIN` da varredura da aba Segurança (`seguranca.ts:144-149`) → `possible_keys=idx_usuarios_bloqueado_ate`, `key=NULL`, `type=ALL`, `Using filesort` (3 linhas). Esperado em tabela minúscula; em produção a cardinalidade tende a usá-lo.
- **Impacto:** nenhum no volume atual. **Correção:** nenhuma.

---

## 5. Confirmação dos itens conhecidos

| Item conhecido | Estado | Evidência |
| :--- | :--- | :--- |
| (a) 4 eventos de expurgo com `LAST_EXECUTED = null` | **CONFIRMADO** | `information_schema.EVENTS` → 4 eventos `ENABLED`/`NULL`; scheduler `ON` (RL05-BD-06) |
| (b) Usuário de banco com `ALL PRIVILEGES ON *.* WITH GRANT OPTION` | **CONFIRMADO** | `SHOW GRANTS FOR CURRENT_USER()` (RL05-BD-05) |
| (c) Logout não atômico (access e refresh em passos separados) | **CONFIRMADO e AMPLIADO** | `logout/index.post.ts:15-21` sem transação; **sessão órfã ativa** quando o access expira (RL05-BD-01) |

---

## 6. Evidências de cobertura (SQL)

### 6.1 Migrations
```
SELECT nome, aplicado_em FROM _migrations ORDER BY nome;  -- 12 linhas (01..12), 2026-10-13 → 2026-10-17
```
Todas as 12 migrations registradas, sem pendências; arquivos × registros sem divergência de nome.

### 6.2 Integridade referencial (0 órfãos)
15 consultas `LEFT JOIN ... WHERE filho.id IS NULL` cobrindo `permissoes_perfil→perfis_acesso`, `usuarios→perfis_acesso`, `sessoes/tokens_acesso/seguranca_eventos_login/auditoria→usuarios`, `release_week/manuais_mensal/entregas_itens→usuarios`, `entregas_itens→release_week/projetos_escopo/manuais_mensal/softwares/parceiros`, `anexos_midias→entregas_itens/manuais_mensal`, `historico_esteira_revisao→entregas_itens`. **Todas = 0.**

### 6.3 Unicidade (0 duplicidades)
8 agrupamentos `GROUP BY ... HAVING COUNT(*) > 1` (`email_corporativo`, `nome_perfil`, `(perfil_id,modulo)`, `refresh_token_hash`, `auditoria.id`, `token_blacklist.token_hash`, `release.codigo`, `(ano,semana)`). **Todos vazios.** Constraints únicas presentes (incl. `uk_perfis_nome` da migration 08).

### 6.4 Matriz RBAC por perfil (99/45/21/6)
```
SELECT pf.nome_perfil,
  SUM(p.pode_visualizar+p.pode_incluir+p.pode_editar+p.pode_excluir) AS fixas,
  SUM(JSON_LENGTH(COALESCE(p.extras, JSON_ARRAY()))) AS extras,
  SUM(p.pode_visualizar+p.pode_incluir+p.pode_editar+p.pode_excluir)
    + SUM(JSON_LENGTH(COALESCE(p.extras, JSON_ARRAY()))) AS total
FROM permissoes_perfil p JOIN perfis_acesso pf ON p.perfil_id = pf.id
GROUP BY pf.id, pf.nome_perfil ORDER BY total DESC;
```
Resultado: **Administrador 44+55=99 · Editor 23+22=45 · Revisor 14+7=21 · Leitor 3+3=6** (11 módulos por perfil, 44 linhas). 0 perfis com número de módulos ≠ 11.

### 6.5 Sessões / TTL
```
SELECT TIMESTAMPDIFF(SECOND,criado_em,expira_em) ttl, COUNT(*) n FROM sessoes GROUP BY ttl;
-- 604 → 157 (todas revogadas) | 604799 → 29 (ativas) | 606920 → 1 (ativa)
```
`REFRESH_TTL_DIAS = 7` / `REFRESH_TTL_SEG = 604800` (`auth.ts:43-45`). Snapshot 17/10/2026 18:14:58: **202** totais, **30 ativas**, **172 revogadas**, **0 expiradas sem revogar**.

### 6.6 Índices (EXPLAIN)
| Query real | Índice (migration) | Plano |
| :--- | :--- | :--- |
| `COUNT(DISTINCT usuario_nome)` | `idx_audit_usuario` (01; recriado no-op em 12) | `Using index for group-by` |
| Auditoria `ORDER BY data_hora DESC, id DESC` | `idx_audit_data_hora_id` (11) | `index`, sem filesort |
| Segurança `ORDER BY ocorrido_em DESC, id DESC` | `idx_seguranca_ocorrido_id` (11) | `index`, sem filesort |
| Auditoria `WHERE acao = ?` | `idx_audit_acao` (08) | `ref`, `Using index condition` |
| Segurança `email_alvo + tipo + ocorrido_em` | `idx_seg_email_tipo_data` (08) | `range`, `Using index` |
| `DISTINCT nome_completo` | `idx_usuarios_nome` (11) | `range`, `Using index for group-by` |
| Aba Segurança (`bloqueado_ate`) | `idx_usuarios_bloqueado_ate` (12) | `possible_keys` presente, `type=ALL` (3 linhas) — ver BD-12 |

### 6.7 Contagens (snapshot 17/10/2026 18:14:58)
| Métrica | Valor |
| :--- | ---: |
| Tabelas base (+ `_migrations`) | 19 (+1) |
| Views | 4 |
| Migrations registradas | 12 |
| Usuários | 3 (todos Administrador/Ativo) |
| Perfis | 4 (todos Ativo) |
| Permissões (matriz) | 44 |
| Sessões (total/ativas/revogadas) | 202 / 30 / 172 |
| Auditoria (total / seed) | 331 / **0** |
| `seguranca_eventos_login` | 96 |
| `token_blacklist` / `tokens_acesso` | 0 / 0 |
| Charset não-utf8mb4 | 0 |
| Colunas de soft delete | 0 |

### 6.8 Schema (amostras)
- `usuarios.numero` `DEFAULT ''` (migration 04 aplicada); `token_version INT NOT NULL DEFAULT 0` (09); `criado_em/atualizado_em DATETIME(6)` com `DEFAULT current_timestamp(6)` e `on update current_timestamp(6)`.
- `seguranca_eventos_login.tipo` ENUM inclui `'bloqueio-liberado'` (06).
- FKs: `usuarios→perfis_acesso` RESTRICT; `permissoes_perfil/sessoes/tokens_acesso→` CASCADE; `auditoria/seguranca_eventos_login/entregas_itens(autor)/release_week(autor,revisor)→usuarios` SET NULL; `entregas_itens→softwares/parceiros` RESTRICT; `entregas_itens→release_week` CASCADE; `historico_esteira_revisao→entregas_itens` RESTRICT.
- `criado_em`/`atualizado_em`: 0 linhas com `atualizado_em < criado_em`.

---

## 7. Encerramento

A camada de dados está **estruturalmente íntegra e consistente** (0 órfãos, 0 duplicidades, constraints e defaults corretos, RBAC 99/45/21/6, TTL do refresh de 7 dias nas sessões novas, transações presentes nas escritas compostas). Não há achado **Crítico** nem **Alto**. Permanecem **5 Médios** — logout não atômico/sessão órfã, convite a conta Inativa existente, anti-lockout ausente na inativação de perfil, drift do seed da migration 07 e privilégios excessivos do usuário de aplicação — além de baixos/melhorias. O filtro de visibilidade pública e o soft delete são **escopo não aplicável** nesta maturidade. **Veredito: APROVADO COM RESSALVAS (risco Médio).**

Nenhum dado ou schema foi alterado por esta auditoria; todas as evidências são consultas reais somente-leitura.

### Histórico de status (Etapa 7)
- **RL04:** REPROVADO — 1 Alto (TTL do refresh: 158/158 sessões com 604 s) + expurgo sem execução confirmada.
- **RL05 (esta):** APROVADO COM RESSALVAS — TTL corrigido (sessões novas em ~7 dias), expurgo criado mas ainda sem execução confirmada; novas ressalvas de atomicidade/logout, convite a Inativo, anti-lockout de perfil, drift de seed e privilégios.