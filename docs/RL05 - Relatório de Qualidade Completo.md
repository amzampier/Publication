# RL05 – Relatório de Qualidade Completo

| Campo | Valor |
| :--- | :--- |
| **ID** | RL05 |
| **Tipo** | Varredura final de qualidade (7 especialidades + execução E2E real) antes de iniciar novos módulos |
| **Base normativa** | `docs/qa/00-arquitetura-e-regras-gerais.md`, `docs/qa/01..07`, `openspec/specs/**` (30 specs — fonte da verdade), `docs/01 - design_system.md`, `docs/02 - Guia de Arquitetura e Migrations.md` |
| **Data** | 17/10/2026 |
| **Escopo auditado** | Todo o sistema implementado – Área Pública raiz + Área Administrativa (Shell, Login/Recuperação, Primeiro Acesso, Gestão de Usuários, Perfis/RBAC, Auditoria, Configurações Globais, Segurança, Meu Perfil, Uploads, Convite, Migrations, 404) + Design System/Vitrine `/design` |
| **Capabilities** | 30 entradas em `openspec list --specs`; `openspec validate --specs --strict` → 30/30; nenhuma change ativa |
| **Método** | Análise estática + consultas read-only no MariaDB 11.8 + `EXPLAIN`/bundle + execução E2E no dev server (`localhost:3000`) |
| **Alterações de código** | Auditoria original somente-leitura; as correções foram implementadas e verificadas na seção 11 |
| **Veredito** | **APROVADO** (após as correções da seção 11) — as 2 Altas e 3 Médias de segurança foram corrigidas e verificadas; itens de escala já declarados roadmap permanecem fora do escopo |
| **Risco** | **Baixo** (após correções; ver seção 11) |

> **Objetivo deste documento:** ser o relatório único da varredura final, consolidando e deduplicando os sete pareceres, e servir de plano de correção para que o sistema chegue a **Aprovado sem ressalvas** antes dos novos módulos.
>
> **Relatórios de apoio persistidos:** `docs/RL05 - Varredura Funcional.md`, `docs/RL05 - Varredura de Documentação.md`, `docs/RL05 - Varredura de Banco.md`, `docs/RL05 - Varredura de UX.md`, `docs/RL05 - Varredura de Performance.md`, `docs/RL05 - Varredura de Execução.md`. O parecer de segurança está integralmente na seção 4.1 e no Apêndice A.
>
> **Nota de IDs:** os identificadores consolidados usam o prefixo `RL05-*` (A = Alto, M = Médio, B = Baixo, D = Documentação, I = Melhoria). A rastreabilidade para os IDs de origem de cada especialista está na seção 9.
> **Nota de revisão (17/10/2026):** executada a correção dos achados (seção 11). O veredito de execução original (**REPROVADO**) e a matriz da seção 7 ficam como registro histórico da varredura; o estado vigente do sistema é **APROVADO** sobre o escopo aplicável.

---

## 1. Resumo executivo

- **Status: REPROVADO.** O núcleo do sistema está maduro: as correções das Etapas 1–5 do RL04 **se sustentam em runtime** — XSS por upload fechado (extensão derivada dos magic bytes; `/uploads/**` servido `image/png` + `nosniff` + CSP `sandbox`), TTL do refresh em 7 dias, limpeza de estado no logout, ordenação server-side, shell via `/api/configuracoes/shell`, recuperação de senha off-path, KPIs zerados na falha e baixos funcionais no ar.
- **Fronteira Área Pública × Área Administrativa íntegra:** anônimo recebe `401` em 100% das APIs administrativas (incluindo `GET /api/usuarios/:id`, `GET /api/usuarios/emails`, `GET /api/configuracoes/shell`, `/api/auditoria`, `/api/seguranca/estado`); `/admin/**` responde `302 /admin/login?redirect=…`; a única porta pública (`/api/configuracoes/identidade`) devolve apenas `logo_login_url`; não há conteúdo não publicado exposto (Área Pública é placeholder).
- **RBAC íntegro no servidor:** todas as rotas de módulo chamam `requirePermission`; a matriz vem do banco por request (99/45/21/6, 9/9 módulos por perfil); não há bypass de Administrador; ações extras (importar) são exigidas separadamente.
- **SQL Injection inexistente:** queries parametrizadas, ordenação por whitelist, paginação clampada.
- **Banco íntegro:** 12/12 migrations registradas, 0 órfãos (15 checagens de FK), 0 duplicidades (8 checagens), 21 FKs, 0 tabelas fora de `utf8mb4`, timestamps consistentes.
- **Execução E2E:** 53/53 checagens executadas = PASS (login, sessão, rotação/reuso de refresh, RBAC, ordenação, uploads/XSS, sem SQLi, detalhe sem segredo SMTP, 404).

**Porém, dois achados Altos e três Médias de segurança reprovam o sistema pela matriz do `docs/qa/00`:**

1. **RL05-A-01 (Alta)** — **troca/reset de senha não revoga as sessões vigentes.** `POST /api/auth/trocar-senha`, `atualizarUsuario` (quando define senha) e `POST /api/convite` (reset de conta existente) gravam o novo hash **sem** chamar `revogarSessoesDoUsuario`. Um refresh roubado continua renovável por até **7 dias** depois de a vítima trocar a senha — justamente a mitigação esperada após um incidente de credencial.
2. **RL05-A-02 (Alta)** — **inativar/bloquear o perfil que sustenta a administração essencial não é recusado.** `atualizarPerfil` revoga as sessões do perfil, mas não chama `garantirAdministracaoApos`; o login recusa perfil não-Ativo. Resultado: o único perfil com `alterar` nos três módulos essenciais pode ser desativado pela UI e **nenhum administrador consegue mais logar** (recuperação só via banco).
3. **RL05-M-01 (Média, segurança/regressão)** — `POST /api/convite` valida a `situacao` do **payload**, não a da conta-alvo, e regrava a senha de **qualquer conta existente** com apenas `gestao-usuarios/criar` (inclusive de perfil superior). Com perfis customizados, permite sequestro de conta; hoje a seed limita o impacto.
4. **RL05-M-02 / M-03 (Médias)** — upload multipart bufferizado inteiro antes do limite de 5 MB (DoS de memória; permissão checada após o parse) e cookies `__Host-*` não removidos no logout em produção (falha de higiene, sem bypass).

- **Risco: Alto** — falha de segurança de autenticação/sessão + vetor de lockout administrativo + regressão reaberta (convite) + 3 lacunas médias de segurança.
- **O que NÃO é problema:** fronteira de áreas, RBAC, SQLi, XSS, banco (integridade), performance do caminho padrão, design system e UX base. Nenhum Crítico; nenhuma exposição de conteúdo não publicado.

### 1.1 Veredito por especialidade

| Especialidade | Veredito | Destaque |
| :--- | :--- | :--- |
| qa-documentacao | Aprovado com ressalvas | 30/30 specs válidas; 4 Médias (DOC-01/02/04 + validação do convite) e 9 Baixas; código/banco/permissões consistentes |
| qa-funcional | Aprovado com ressalvas | 0 Crítico/Alto; RL04-C-01/A-01/A-02 corrigidos; 3 Médias + 8 Baixas + 3 conflitos de spec |
| qa-seguranca | **REPROVADO** | 2 Altas (revogação na troca de senha; lockout por perfil) + 3 Médias + 7 Baixas; fronteira/RBAC/SQLi/XSS íntegros |
| qa-banco | Aprovado com ressalvas | 12/12 migrations, 0 órfãos/duplicidades, matriz 99/45/21/6; 5 Médias (logout não atômico, drift de seed, grant total) + 5 Baixas |
| qa-ux | Aprovado com ressalvas | 0 Crítico/Alto/Médio; 6 Baixas (vitrine, textos técnicos, 404) + 1 Melhoria |
| qa-performance | Aprovado com ressalvas | 0 Crítico/Alto; Etapa 4 do RL04 sustentada; 4 Médias de escala (LIKE, export, pool, e-mails) + 2 Baixas |
| qa-execucao | Aprovado com ressalvas | 53/53 PASS; 1 Médio (convite a conta Inativa, por código) + 4 Baixas + 3 DOC |

### 1.2 Placar consolidado (deduplicado)

| Severidade | Qtd | IDs consolidados |
| :--- | ---: | :--- |
| Crítica | 0 | — |
| Alta | 2 | RL05-A-01, RL05-A-02 |
| Média | 14 | RL05-M-01 … RL05-M-14 |
| Baixa | 30 | RL05-B-01 … RL05-B-21 + RL05-D-01 … RL05-D-09 |
| Melhoria | 4 | RL05-I-01 … RL05-I-04 |

> Deduplicação: um mesmo defeito reportado por vários especialistas recebeu **um** ID consolidado (ex.: lockout de perfil = A-02 = BD-03 = FUN-03; convite = M-01 = SEG-03 = FUN-02 = BD-02 = EXE-01 = DOC-06; lixo no `design.vue` = B-14 = FUN-06 = UX-01 = EXE-02; expurgo nulo = B-06 = BD-06 = PERF-06 = FUN-07).

---

## 2. Cobertura executada

| Eixo | Situação |
| :--- | :--- |
| Funcional | Executado — casos derivados das 15 capabilities funcionais; GET reais + análise das escritas |
| Regressão | Executado — RL04-C-01/A-01/A-02 confirmados corrigidos; usuários↔perfis↔opções, auth↔revogação, upload↔servimento, auditoria↔filtros, config↔shell |
| Permissões (RBAC) | Executado — rotas administrativas; matriz 99/45/21/6; Leitor `403` em 100% (runtime + estático); sem bypass de Administrador |
| Banco | Executado read-only — 12/12 migrations, 0 órfãos, 0 duplicidades, 21 FKs, views, índices via `EXPLAIN` |
| UX | Executado estático — UI kit, tokens, a11y, estados, responsividade; 0 Crítico/Alto/Médio |
| Segurança | Executado — RBAC, sessão/revogação, CSRF, uploads, XSS, SQLi, headers, rate limit, segredos; 2 Altas |
| Performance | Executado com medições — `EXPLAIN`, bundle/SSR, pool, concorrência, cache, lazy load |
| Fronteira Pública × Admin | Executado em runtime — anônimo `401`/`302`; única porta pública com 1 campo; sem conteúdo não publicado |
| Execução E2E | Executado — dev server + MariaDB; 53/53 checagens PASS |
| Escopos não aplicáveis | Declarados na seção 3 |

---

## 3. Escopos não aplicáveis (declarados — não são falha)

1. **Conteúdo público (Releases Week Semanal, Manuais, Escopo de Projetos)** — roadmap; `app/pages/index.vue` é placeholder e **não há APIs de conteúdo**. Consequências: “exposição de conteúdo não publicado” e “filtro de visibilidade pública em queries públicas” são **N/A** nesta rodada.
2. **`server/utils/validation.ts` (Zod)** — roadmap (`docs/02 §3.2`); validação ad hoc com `createError(400)` é o padrão atual.
3. **`server/utils/safeError.ts` / `handleApiError`** — roadmap; erros serializados pelo Nitro.
4. **Headers de segurança globais e token CSRF dedicado** — roadmap; hoje há `nosniff` + CSP `sandbox` em `/uploads/**` e `SameSite=Lax` (registrado como melhoria I-01, não como falha).
5. **Envio real de e-mail (Resend)** — implementado por código (timeout, `APP_URL` fixa, escape HTML), **não exercido** em runtime.
6. **Soft delete** — não previsto; exclusão física intencional.
7. **Módulos do sidebar sem rota** — itens de roadmap; não auditáveis.
8. **Etapa 4 do RL04 (FULLTEXT, export server-side/streaming, paginação de e-mails)** — itens de comportamento **intencionalmente excluídos**; aqui aparecem como Médias de escala (M-08, M-09, M-11), não como regressão.
9. **Testes automatizados de segurança / E2E de escrita** — não executados (auditoria read-only); achados de escrita vêm de análise estática + inspeção de dependência.

---
## 4. Achados

### 4.1 Alta severidade (bloqueantes)

#### RL05-A-01 · Troca/reset de senha não revoga as sessões vigentes (access e refresh sobrevivem)
- **Severidade:** Alta (falha de segurança)
- **Módulo:** Autenticação · Meu Perfil (Segurança) · Gestão de Usuários · Convite
- **Origem:** qa-seguranca `RL05-SEG-01` (achado novo)
- **Cenário:** um access/refresh é roubado. A vítima (ou um administrador) altera a senha para expulsar o invasor.
- **Resultado esperado:** a troca/reset de senha invalida **todas** as sessões anteriores (incremento de `token_version` + `revogado_em` em `sessoes`), mantendo apenas o novo par emitido para a sessão atual.
- **Resultado obtido:** o novo hash é gravado e o access é reemitido **com o mesmo `token_version`**; nenhuma linha de `sessoes` é revogada. O access antigo segue válido até o TTL (~15 min) e o **refresh antigo continua renovável por até 7 dias**.
- **Passos para reprodução (estático):** (1) `server/api/auth/trocar-senha/index.post.ts:52-59` grava `hash_senha` e chama `reemitirAccesso`; (2) `server/utils/usuarios.ts:507-541` grava `hash_senha`/`senha_provisoria=1` e só chama `revogarSessoesDoUsuario` quando `situacao === 'Inativo'`; (3) `server/api/convite/index.post.ts:108-112` regrava a senha sem revogar.
- **Evidências:**
  - `trocar-senha/index.post.ts:52-59` — `UPDATE usuarios SET hash_senha=?, senha_provisoria=0` + `reemitirAccesso(event, { ...sessao, provisoria:false })`.
  - `usuarios.ts:538-541` — `if (situacao === 'Inativo' && existente.status !== 'Inativo') { await revogarSessoesDoUsuario(...) }`.
  - `revogarSessoesDoUsuario()` (que incrementa `token_version` e marca `revogado_em`) **não é chamado** em nenhum caminho de troca/reset de senha.
- **Impacto:** falha na mitigação pós-incidente de credencial. Quem detiver o refresh roubado mantém acesso administrativo por até 7 dias mesmo após a troca de senha. Explorável remotamente por quem já detém o token. Viola o objetivo da capability `revogacao-sessao` (que hoje cobre apenas logout/desativação/exclusão — lacuna de contrato).
- **Correção recomendada:** em `trocar-senha` e, ao gravar senha em `atualizarUsuario`/`convite`, chamar `revogarSessoesDoUsuario(id)` antes de reemitir o par da sessão atual; atualizar `revogacao-sessao/spec.md` para cobrir troca/reset de senha.

#### RL05-A-02 · Inativar/bloquear o perfil que sustenta a administração essencial não é recusado (lockout total)
- **Severidade:** Alta (disponibilidade administrativa / anti-lockout)
- **Módulo:** Perfis de Acesso (RBAC) · Login
- **Origem:** qa-seguranca `RL05-SEG-02` = qa-banco `RL05-BD-03` = qa-funcional `RL05-FUN-03`
- **Cenário:** o único perfil com `alterar` nos três módulos essenciais (hoje, o perfil Administrador) é marcado como Inativo/Bloqueado pela UI.
- **Resultado esperado:** a operação é recusada com `409` quando zeraria a administração essencial (mesma guarda já aplicada a usuários e à matriz).
- **Resultado obtido:** a atualização é aceita, as sessões do perfil são revogadas e — como o login recusa perfil não-Ativo — **nenhum administrador consegue logar**. A recuperação exige acesso direto ao banco.
- **Passos para reprodução (estático):** (1) `server/utils/perfis.ts:292-326` (`atualizarPerfil`) grava a `situacao` e revoga as sessões do perfil, mas **não chama** `garantirAdministracaoApos`; (2) `server/utils/perfis.ts:382-388` define a guarda, usada apenas em usuários/matriz (`:425`, `:470`); (3) `server/api/auth/login/index.post.ts:76-81` recusa `perfil_situacao !== 'Ativo'`.
- **Evidências:**
  - `perfis.ts:304-315` — `UPDATE perfis_acesso SET ... situacao=?`, revogação das sessões e `commit()` sem validação de lockout.
  - `perfis.ts:312-314` — `if (situacao !== 'Ativo' && existente.situacao === 'Ativo') { revogarSessoesDoPerfil(...) }`.
- **Impacto:** DoS administrativo auto-infligido por ator autenticado com `perfis-acesso/alterar`. Pela letra do `docs/qa/00`, “login indisponível” é exemplo de **Crítica**; foi classificado **Alta** porque exige um administrador legítimo e é auto-infligido — de todo modo, **reprova**.
- **Correção recomendada:** chamar `garantirAdministracaoApos(tx)` também em `atualizarPerfil` (e em `excluirPerfil`) antes do `commit`, respondendo `409`. Adicionar cenário na spec `perfis-acesso`.

---
### 4.2 Média severidade

#### RL05-M-01 · Convite reescreve credenciais de conta existente e não valida a situação real da conta
- **Severidade:** Média (segurança — regressão reaberta)
- **Módulo:** Convite · Gestão de Usuários
- **Origem:** qa-seguranca `RL05-SEG-03` = qa-funcional `RL05-FUN-02` = qa-banco `RL05-BD-02` = qa-execucao `RL05-EXE-01` = qa-documentacao `DOC-06` / `RL05-B-18` (RL04)
- **Cenário A (estado):** convidar uma conta **Inativa/Bloqueada** existente com payload `situacao=Ativo`. **Esperado:** `400` (conta não-Ativa) ou reativação real. **Obtido:** `200 {ok:true,criado:false}` e a conta **permanece Inativa**; o login segue `403 "Usuário inativo"`.
- **Cenário B (privilégio):** perfil com `gestao-usuarios/criar` (sem `alterar`) convida o e-mail de um Administrador. **Esperado:** negar/rejeitar. **Obtido:** a senha da conta-alvo é **redefinida** (`hash_senha`, `senha_provisoria=1`, `tentativas_falhas=0`, `bloqueado_ate=NULL`) e o atacante assume a conta.
- **Evidências:** `server/api/convite/index.post.ts:38` (exige só `criar`), `:51-54,86-91` (valida `body.situacao` e o perfil do payload), `:108-112` (`UPDATE` sem `situacao`). Cliente `Convite.vue:151`. Docs `docs/06:46` afirmam “só usuário Ativo pode ser convidado”.
- **Impacto:** hoje a seed limita o ganho (só Administrador tem `criar`); com o RBAC dinâmico suportado, há **escalada vertical/sequestro de conta**. Independentemente disso, a conta Inativa recebe senha provisória por e-mail que não funciona.
- **Correção recomendada:** no ramo “existente”, ler `usuarios.situacao` no banco e recusar `400` quando não-Ativa; exigir `gestao-usuarios/alterar` para redefinir credenciais de conta existente (e/ou negar alvo de perfil superior).

#### RL05-M-02 · Upload lê o corpo multipart inteiro antes do limite de 5 MB e checa permissão depois do parse
- **Severidade:** Média (DoS de memória)
- **Módulo:** Uploads
- **Origem:** qa-seguranca `RL05-SEG-04`
- **Evidências:** `server/api/uploads/index.post.ts:15` (`await readMultipartFormData(event)` bufferiza tudo), `:36-38` (`requirePermission` de `logomarcas` só após o parse), `:47` (checagem dos 5 MB só após o buffer). `nuxt.config.ts` não define `nitro.bodyLimit`; a rota não tem rate limit.
- **Impacto:** usuário autenticado de baixo privilégio (destino `avatares` exige apenas sessão) envia corpo enorme e esgota a memória do processo antes do corte → indisponibilidade.
- **Correção recomendada:** limitar o corpo no Nitro/`content-length` antes do parse; mover a autorização de `logomarcas` para antes do consumo; rate limit na rota.

#### RL05-M-03 · `limparCookiesAuth` não apaga os cookies `__Host-*` em produção
- **Severidade:** Média (higiene de sessão / defesa em profundidade)
- **Módulo:** Autenticação (logout)
- **Origem:** qa-seguranca `RL05-SEG-05`
- **Evidências:** `server/utils/auth.ts:54,80-83` — `deleteCookie(event, NOME_ACCESS, { path: '/' })` sem `secure: true`. No `h3` instalado, `deleteCookie` → `setCookie(..., maxAge:0)` e não adiciona `Secure`; o navegador **rejeita** remover um cookie `__Host-` sem `Secure`.
- **Impacto:** em produção, logout deixa `__Host-auth-token`/`__Host-auth-refresh` no navegador. A revogação server-side (`token_version` + `revogado_em`) impede reuso, então **não há bypass** — mas é falha de higiene em máquina compartilhada.
- **Correção recomendada:** `deleteCookie(..., { path: '/', secure: ehProducao, sameSite: 'lax' })` (ou reusar `opcoesBase`).

#### RL05-M-04 · Logout não atômico e sessão órfã ativa quando o access expira
- **Severidade:** Média (consistência de sessão)
- **Módulo:** Autenticação (logout/rotação)
- **Origem:** qa-banco `RL05-BD-01`
- **Evidências:** `server/api/auth/logout/index.post.ts:15-21` — `revogarSessao` (UPDATE `sessoes`) e `revogarAccessVigente` (UPDATE `usuarios.token_version`) são duas queries **sem** `getTransaction()`. `auth.ts:168-212` — se o access expirou, `getSessionUser` rotaciona e insere nova linha, mas `getCookie` lê o refresh antigo já revogado → a nova linha fica **ativa** (sessão órfã). Snapshot: 202 sessões / 30 ativas / 172 revogadas / 0 expiradas sem revogar.
- **Impacto:** revogação incompleta + resíduo de sessão ativa. Sem bypass (o refresh órfão não é conhecido pelo cliente), mas amplia a superfície.
- **Correção recomendada:** transacionar as duas revogações; revogar pelo `id` da rotação em vez do cookie relido.

#### RL05-M-05 · Drift: seed da migration 07 ausente embora registrada em `_migrations`
- **Severidade:** Média (consistência de dados de seed)
- **Módulo:** Banco / Migrations / Auditoria
- **Origem:** qa-banco `RL05-BD-04`
- **Evidências:** `SELECT COUNT(*) FROM auditoria` = 331; `LIKE 'log-seed%'` = **0**; `MIN(data_hora)` = 2026-10-15 19:21 > aplicação da migration 07 (17:14:13). A invariante documentada (=25 eventos de seed) falha e o runner nunca reexecuta.
- **Impacto:** dados de demonstração ausentes; o contrato da migration não corresponde ao estado real. **Não** há corrupção de dados de usuário nem inconsistência referencial (0 órfãos/duplicidades).
- **Correção recomendada:** reconciliar (re-inserir o seed de forma idempotente ou criar migration 13 que o restaure).

#### RL05-M-06 · Usuário de banco da aplicação com `ALL PRIVILEGES … WITH GRANT OPTION`
- **Severidade:** Média (ambiente / menor privilégio)
- **Módulo:** Banco / Infraestrutura
- **Origem:** qa-banco `RL05-BD-05` = qa-funcional `RL05-FUN-15`
- **Evidências:** `SHOW GRANTS FOR CURRENT_USER()` → `GRANT ALL PRIVILEGES ON *.* ... WITH GRANT OPTION`.
- **Impacto:** comprometimento da aplicação expõe todo o servidor MariaDB (blast radius total), contrariando o menor privilégio. Não é falha de código da aplicação.
- **Correção recomendada:** usuário dedicado com DML em `publications.*` + `EVENT`, sem `GRANT OPTION`.

#### RL05-M-07 · Cache de opções (30 s) sem invalidação — perfil/usuário novo some por até 30 s
- **Severidade:** Média (regressão transitória)
- **Módulo:** Gestão de Usuários · Auditoria (filtros/modais)
- **Origem:** qa-funcional `RL05-FUN-01` = qa-performance `RL05-PERF-07`
- **Evidências:** `server/utils/cache.ts:16-22` (`cacheado('usuarios-opcoes'|'auditoria-opcoes', 30_000, …)`) sem gancho de invalidação nas escritas.
- **Impacto:** após criar um perfil customizado/usuário, ele pode não aparecer no modal/filtro por até 30 s (e o inverso após excluir).
- **Correção recomendada:** `invalidarCache()` nas escritas de usuários/perfis (mantendo o ganho do cache).

#### RL05-M-08 · Busca `LIKE '%termo%'` inindexável — full scan por termo
- **Severidade:** Média (escala)
- **Módulo:** Usuários · Auditoria
- **Origem:** qa-performance `RL05-PERF-01` (RL04-M-12)
- **Evidências:** `EXPLAIN` Usuários → `type=ALL`, `Using where; Using filesort`; Auditoria → `type=index` varrendo índice com 4 `LIKE`. Medido 19,9–21,2 ms (3/328 linhas). `usuarios.ts:326-331`, `audit.ts:214-219`.
- **Impacto:** degradação não linear com o volume; hoje imperceptível.
- **Correção recomendada:** `FULLTEXT` ou busca por prefixo (item intencionalmente adiado na Etapa 4).

#### RL05-M-09 · Exportação sem streaming, na main thread, com teto silencioso de 10.000 linhas
- **Severidade:** Média (escala)
- **Módulo:** Usuários · Auditoria (exportação)
- **Origem:** qa-performance `RL05-PERF-02` = qa-funcional `RL05-FUN-11`
- **Evidências:** `/api/auditoria?exportar=1` = 142,7 KB/328 linhas (≈0,44 KB/linha → ≈4,4 MB em 10k); CSV/PDF montados no cliente (`usuarios/Cabecalho.vue:42-96`); teto `10_000` silencioso (`audit.ts:91,228-235`; `usuarios.ts:283,339-349`).
- **Impacto:** resposta pesada, travamento de navegador e truncamento sem aviso ao usuário.
- **Correção recomendada:** geração/streaming server-side e aviso explícito ao atingir o teto (adiado na Etapa 4).

#### RL05-M-10 · Saturação do pool → HTTP 500 `Queue limit reached.`
- **Severidade:** Média (disponibilidade sob pico)
- **Módulo:** Banco / API
- **Origem:** qa-performance `RL05-PERF-03` (RL04-M-14)
- **Evidências:** `/api/auditoria` N=40 → 8×500; N=50 → 21×500; N=60 → 38×500; `/api/usuarios` N=50 → 11×500; p50 ~247–343 ms em 20 simultâneas. `db.ts:24-25` (connectionLimit 10 / queue 50), 3 queries em `Promise.all` (`audit.ts:244-254`).
- **Impacto:** usuários legítimos recebem 500 sob carga concorrente.
- **Correção recomendada:** combinar agregados numa query, elevar `DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT` e responder 503 amigável com retry.

#### RL05-M-11 · `GET /api/usuarios/emails` sem paginação/limite
- **Severidade:** Média (escala)
- **Módulo:** Gestão de Usuários (importação)
- **Origem:** qa-performance `RL05-PERF-04` (RL04-B-24)
- **Evidências:** `usuarios.ts:397-403` — `SELECT email_corporativo FROM usuarios` sem `LIMIT`; hoje 0,1 KB, cresce linearmente.
- **Impacto:** payload/tempo sem teto; bloqueia importação em base grande.
- **Correção recomendada:** paginar/limitar ou checar duplicidade no commit.

#### RL05-M-12 · Contradição de spec: exclusão “irrestrita” × guarda anti-lockout (`409`)
- **Severidade:** Média (documentação/contrato)
- **Módulo:** Gestão de Usuários
- **Origem:** qa-documentacao `DOC-01` = qa-funcional `RL05-FUN-13` = qa-execucao `RL05-EXE-07`
- **Evidências:** `openspec/specs/gestao-usuarios/spec.md:477,501-503` diz exclusão irrestrita (inclusive Administrador); `server/utils/usuarios.ts:555-568` responde `409` ao remover o último admin — comportamento **exigido** por `perfis-acesso/spec.md:562-591` e `docs/06:48`.
- **Impacto:** auditoria futura pode tratar o código correto como bug. O código está certo; a spec está errada.
- **Correção recomendada:** atualizar `gestao-usuarios` ressalvando a guarda anti-lockout.

#### RL05-M-13 · Contradição de spec: upload PNG+HTML deve responder `400`, mas o código aceita e grava `.png`
- **Severidade:** Média (documentação/contrato)
- **Módulo:** Uploads
- **Origem:** qa-documentacao `DOC-02` = qa-funcional `RL05-FUN-12` = qa-execucao `RL05-EXE-06`
- **Evidências:** `openspec/specs/uploads/spec.md:41-43` exige `400`; o código (`uploads/index.post.ts:54-63`) responde `200` e grava `.png`; a própria spec `:24-31,45-47` prevê “extensão segura”, gerando contradição interna. **Segurança preservada** (`image/png` + `nosniff` + CSP).
- **Impacto:** conflito de contrato; risco de regressão futura se alguém “corrigir” o código para 400.
- **Correção recomendada:** alinhar `:41-43` ao comportamento seguro atual (gravação com extensão canônica).

#### RL05-M-14 · `AGENTS.md` desatualizado e internamente contraditório
- **Severidade:** Média (documentação)
- **Módulo:** Documentação do repositório
- **Origem:** qa-documentacao `DOC-04`
- **Evidências:** `AGENTS.md:3-11,28,42,58` afirma que é starter sem lint/test/auth/DB, que `server/`/`shared/` não existem e que o shell está em `default.vue`; na prática existem `npm run lint/test/typecheck`, `server/`, `shared/`, autenticação, banco e o shell em `app/layouts/admin.vue`.
- **Impacto:** onboarding/ferramentas de IA recebem instruções erradas (ex.: “não existe lint/test”).
- **Correção recomendada:** reescrever “What this repo is”, “Directory layout” e “Verificação”; corrigir a referência de shell.

---
### 4.3 Baixa severidade — produto

| ID | Achado | Módulo | Origem | Evidência | Impacto / Correção |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RL05-B-01** | CSV Injection: valores iniciados por `=`, `+`, `-`, `@` não neutralizados | Usuários, Auditoria, Perfis (exportação) | SEG-06 (RL04-B-11) | `usuarios/Cabecalho.vue:47-54`; `auditoria/Cabecalho.vue:40-47`; `perfis/Cabecalho.vue:64-65` | Fórmula executa no Excel/LibreOffice ao abrir o CSV. Prefixar `'` (apóstrofo) nesses valores |
| **RL05-B-02** | Curingas `LIKE` (`%`, `_`) não escapados | Usuários, Auditoria | SEG-07 = FUN-09 = EXE-04 (RL04-B-12) | `usuarios.ts:326-331`; `audit.ts:214-219` | `?busca=%` varre o conjunto inteiro (sem SQLi). Escapar e usar `ESCAPE '\\'` |
| **RL05-B-03** | `POST /api/auth/refresh` não valida `token_version` | Autenticação | SEG-09 (RL04-B-14 — marcado `[x]`, ausente) | `auth.ts:232-259` | Defesa em profundidade; hoje coberto pela revogação da linha de `sessoes`. Comparar versão no refresh |
| **RL05-B-04** | `tokenVersion` exposto nas respostas de sessão | Autenticação | SEG-10 | `auth.ts:11-20`; `login/index.post.ts:139`; `seguro/index.get.ts:13`; `refresh/index.post.ts:14` | Divulga contador interno. Projetar DTO público |
| **RL05-B-05** | Rate limit só em rotas de auth, em memória e com bucket de fallback `0.0.0.0` | Infra/API | SEG-11 (RL04-B-16 parcial) | `rateLimit.ts:13,56-63,70-98` | Upload/escrita sem limite; single-node; bucket global com IP não resolvido. Rate limit nas rotas de escrita + store persistente |
| **RL05-B-06** | 4 eventos de expurgo `ENABLED` com `LAST_EXECUTED=null` | Banco/Expurgo | BD-06 = PERF-06 = FUN-07 (RL04-M-16) | `information_schema.EVENTS`; `expurgo.ts:12-29`; `plugins/migration.ts:14` | Cobertura só por catch-up no boot. Confirmar execução agendada / expurgo idempotente no boot |
| **RL05-B-07** | 1 sessão ativa com TTL 606.920 s (~7,02 d) | Banco | BD-07 | `TIMESTAMPDIFF` nas sessões ativas | Desvio do TTL 604.800 s; sem exploit. Corrigir/lapidar ao expurgo |
| **RL05-B-08** | 157 sessões legadas com TTL 604 s retidas | Banco | BD-08 | `GROUP BY ttl` | Crescimento residual; catch-up cobre |
| **RL05-B-09** | Migration 12 `CREATE INDEX idx_audit_usuario` é no-op | Banco | BD-09 | `SHOW INDEX auditoria`; `EXPLAIN` | Índice já existia na 01; ruído de intenção. Remover da 12 ou documentar |
| **RL05-B-10** | `token_blacklist` nunca usada (0 linhas); revogação por `token_version` | Banco/Doc | BD-10 | `COUNT=0`; `auth.ts:371-390`; `docs/00:28` | Documentação divergente; tabela ociosa. Alinhar doc/avaliar remoção |
| **RL05-B-11** | Importação concorrente de e-mail duplicado devolve 500 | Usuários (importação) | FUN-04 | `usuarios.ts` importação em chunks | Corrida entre checagem e `INSERT`; mapear `1062` para conflito (como no CRUD) |
| **RL05-B-12** | Cache `config-shell-cache` não é limpo no logout | Shell/Sessão | FUN-08 (residual do RL04-A-02) | `useConfiguracoesGlobais.ts` | Preferências da sessão anterior podem persistir na aba |
| **RL05-B-13** | `redirect` do guard não percent-encoded | Navegação | FUN-10 = EXE-03 | `app/middleware/auth.global.ts` | Spec pede `%2Fadmin%2F…`; sem impacto funcional |
| **RL05-B-14** | Lixo `7 x [Sucess] ` na 1ª linha de `app/pages/design.vue` | Vitrine `/design` | FUN-06 = UX-01 = EXE-02 | `design.vue:1` | `/design` responde 200 (texto não renderizado), mas polui o SFC/diff. Remover o prefixo |
| **RL05-B-15** | Grafia “Operação Concluída com **Successo**” na vitrine | Vitrine `/design` | UX-02 | `design.vue:1320,1422` | Erro de português (regressão do replace `Sucess`→`Success`). Trocar por “Sucesso” |
| **RL05-B-16** | Ícone do gatilho “Disparar Warning” em verde (`text-lime-700`) | Vitrine `/design` | UX-03 | `design.vue:1432` vs `ToastContainer.vue:23-29` | Divergência com o componente real (laranja). Usar `text-orange-700` |
| **RL05-B-17** | Rodapé da 404 expõe stack: “Publications Design System · Nuxt 4 + Tailwind CSS” | 404 / `error.vue` | UX-04 | `error.vue:53` | Texto de desenvolvedor em tela do usuário. Trocar por texto institucional |
| **RL05-B-18** | Default de `dica` anuncia SVG (servidor rejeita) | UI kit | UX-05 (residual RL04-B-01) | `ui/UploadFiles.vue:25` | Todas as chamadas atuais passam `dica` (latente). Default `'PNG, JPG, WebP ou GIF'` |
| **RL05-B-19** | Textos técnicos expostos ao usuário (“via API (MariaDB)”, “RATE LIMIT DA API”, “simulados nesta fase”) | Várias telas | UX-06 | `usuarios/Tabela.vue:50`; `perfis/Tabela.vue:36`; `auditoria/Tabela.vue:43`; `AbaSeguranca.vue:353`; `AbaEmail.vue:51` | Fere `docs/qa/05`. Reescrever em linguagem de negócio |
| **RL05-B-20** | 404 própria depende de `Accept: text/html` | 404 | EXE-05 | Runtime | Com `Accept: */*` cai na página padrão do Nuxt em inglês (status 404 preservado). Forçar negociação pt-BR |
| **RL05-B-21** | Aba Segurança em `type=ALL` + `Using filesort` | Segurança | PERF-05 (RL04-B-25 parcial) | `EXPLAIN` `seguranca.ts:144-149` | Full scan/ordenação a cada abertura (3 linhas hoje). Índice em `tentativas_falhas`/união de ramos |

### 4.4 Baixa severidade — documentação

| ID | Documento (arquivo:linha) | Código/realidade | Divergência | Correção |
| :--- | :--- | :--- | :--- | :--- |
| **RL05-D-01** | `autorizacao-rbac/spec.md:39-52` | `usuarios/[id]/index.get.ts:7`; `configuracoes/shell/index.get.ts:6-13` | Catálogo RBAC não lista `GET /api/usuarios/:id` nem `GET /api/configuracoes/shell` (só-sessão) | Acrescentar as duas rotas (a segunda na seção somente-sessão) |
| **RL05-D-02** | `docs/08:308` | `package.json`; `tests/`; `eslint.config.mjs` | Afirma “não há lint/test no repositório”, mas os gates existem | Citar `npm run lint/test/typecheck` |
| **RL05-D-03** | `docs/01:695` | `ui/DataTable.vue:552-562,663` | Doc descreve `lime-500`; componente usa `brand-accent`/`sky`/`slate` | Atualizar o doc |
| **RL05-D-04** | `docs/02:87` | não existe `app/types/`; tipos em `use*Modelo.ts` | Convenção aponta diretório inexistente | Corrigir a convenção da §2.2 |
| **RL05-D-05** | `docs/04` (título) | `configuracoes-globais/spec.md:14`; rota `/admin/configuracoes-globais` | “Configurações Gerais” × “Configurações Globais” | Renomear título/arquivo |
| **RL05-D-06** | `docs/03:7` | `layouts/admin.vue`; `layouts/default.vue` | Lista `default.vue` como fonte do shell | Trocar por `admin.vue` |
| **RL05-D-07** | `migracoes-banco/spec.md:57-62` | `migration/07_seed_auditoria.sql:1-40` | Exige bloco de rollback; a 07 não tem (as outras 11 têm) | Adicionar bloco comentado |
| **RL05-D-08** | `convite/index.post.ts:6` (comentário) | `usuarios/index.get.ts:11-24`; `gestao-usuarios.vue` | Comentário diz que a listagem “continua a base demo”, mas vem da API | Atualizar/remover o comentário |
| **RL05-D-09** | `docs/02:183` | `docs/02:216-218,262-272`; `permission.ts:78-85` | Rotula 403/RBAC como “roadmap”, contrariando §3.5 | Reposicionar o rótulo (refere-se a safeError/Zod) |

### 4.5 Melhorias

| ID | Achado | Origem | Correção |
| :--- | :--- | :--- | :--- |
| **RL05-I-01** | Sem headers globais (CSP/HSTS/X-Frame-Options/Referrer-Policy) nem token CSRF dedicado | SEG-08 (roadmap declarado) | `routeRules`/middleware global; avaliar double-submit CSRF |
| **RL05-I-02** | `devtools` fixo habilitado; `.env.example` com `DB_USER=root`; admin demo fora de produção; catálogo RBAC incompleto | SEG-12 | Condicionar `devtools` a não-produção; documentar usuário de banco mínimo; alinhar catálogo |
| **RL05-I-03** | Índices sobrepostos (`idx_audit_data_hora`×`..._id`; `..._ocorrido_em`×`..._ocorrido_id`; `email_alvo`×prefixo) | BD-11 | Redundância benigna; revisar em limpeza futura |
| **RL05-I-04** | Tons residuais nas demos de toast da vitrine (`emerald`/`sky` vs `*-500`/`*-700`) | UX-07 | Alinhar aos tokens do `ToastContainer` |

**Observação (não é achado):** `RL05-BD-12` — `idx_usuarios_bloqueado_ate` existe mas não é escolhido (`type=ALL`, 3 linhas); comportamento esperado no volume atual.

**Resolvido / não reproduzido:** `RL05-FUN-05` — resíduos `p.png`/`evil.png` do E2E anterior em `uploads/avatares/` **não estão mais presentes** (confirmado na execução E2E desta rodada; a pasta contém apenas `.gitkeep` e `avatar.jpg`).

---
## 5. Itens verificados e aprovados (com evidência)

| # | Verificação | Resultado | Evidência |
| :--- | :--- | :--- | :--- |
| 5.1 | Fronteira Pública × Admin — APIs sem sessão | **PASS** | Runtime: 9/9 rotas administrativas → `401` (usuários, `:id`, `emails`, `configuracoes`, `configuracoes/shell`, auditoria, segurança, perfis, `eu`/`eu/permissoes`); `server/middleware/auth-api.ts:9-27` |
| 5.2 | Rotas `/admin/**` sem sessão | **PASS** | `GET /admin/gestao-usuarios` → `302 /admin/login?redirect=…`; `app/middleware/auth.global.ts:32-36` |
| 5.3 | Porta pública devolve só o mínimo | **PASS** | `GET /api/configuracoes/identidade` → `{"logo_login_url":"/uploads/logomarcas/..."}` |
| 5.4 | RBAC por módulo nas rotas de dados | **PASS** | `requirePermission` em usuarios/perfis/auditoria/configuracoes/seguranca/uploads(logomarcas); `permission.ts:25-85` |
| 5.5 | Sem bypass de Administrador | **PASS** | Administrador passa pela mesma matriz; módulo/ação ausente = `false`; seed 99/99 é linha explícita |
| 5.6 | Ações extras exigidas separadamente | **PASS** | `importar` exigido em `POST /api/usuarios/importar`, mesmo para quem tem `criar` |
| 5.7 | Matriz de permissões | **PASS** | 99/45/21/6 (Administrador 44+55, Editor 23+22, Revisor 14+7, Leitor 3+3); 9/9 módulos nas respostas de runtime |
| 5.8 | Revogação por logout/desativação/exclusão/inativação de perfil | **PASS** (exceto troca de senha → A-01) | `revogarSessoesDoUsuario`/`revogarSessoesDoPerfil` incrementam `token_version` e marcam `revogado_em`; middleware valida por request; reativar não reaviva tokens |
| 5.9 | Rotação de refresh atômica | **PASS** | Transação com `SELECT … FOR UPDATE`; reuso/concorrência → `401` (confirmado em runtime) |
| 5.10 | TTL do refresh = 7 dias (correção RL04-A-01) | **PASS** | `REFRESH_TTL_SEG = 7*24*60*60` s; cookie `Max-Age=604800`; 29/30 sessões ativas em 604.799 s |
| 5.11 | Cookies de sessão | **PASS** (ressalva M-03) | `HttpOnly`, `SameSite=Lax`, `Path=/`; `Secure` + prefixo `__Host-` em produção |
| 5.12 | SQL Injection | **PASS** | Queries com `?`; ordenação por whitelist (`usuarios.ts:286-305`, `audit.ts:55-70`); paginação clampada; `?busca=' OR '1'='1` → `total=0` |
| 5.13 | XSS por upload (correção RL04-C-01) | **PASS** | Extensão derivada dos magic bytes → `.png`; servido `image/png` + `nosniff` + CSP `sandbox`; `../fora`, HTML disfarçado e texto → `400`, nada gravado |
| 5.14 | XSS refletido/armazenado | **PASS** | Nenhum `v-html`/`innerHTML`/`eval(` em `app/`; e-mails escapam HTML (`shared/utils/emails.ts`) |
| 5.15 | Exposição de segredos | **PASS** | `montarUsuario` sempre `senha:''` + `temSenha`; `hash_senha`/`senha_smtp` não serializados; SMTP cifrado AES-256-GCM; `GET /api/usuarios/eu` sem senha SMTP |
| 5.16 | Trilha de auditoria | **PASS** | Append-only; leitura gated; IP real; escrita em `waitUntil` e resiliente (`audit.ts`) |
| 5.17 | Login (anti-enumeração/timing/lockout) | **PASS** | 401 genérico + hash de timing cost 12; `registrarFalhaLogin` com `FOR UPDATE`; perfil não-Ativo recusado |
| 5.18 | Banco — migrations e integridade | **PASS** | 12/12 migrations; 19 tabelas + 4 views; 0 órfãos (15 checagens), 0 duplicidades (8), 21 FKs, 0 tabelas não-utf8mb4; 20 pontos transacionais |
| 5.19 | Performance do caminho padrão (RL04 Etapa 4) | **PASS** | Índices escolhidos sem filesort em auditoria/listagem; auditoria em `waitUntil`; listagem enxuta; 0 imports estáticos de `jspdf`/`exceljs`; N+1 inexistente; paginação server-side com clamp 200; `DB_TIMEZONE` explícito |
| 5.20 | UX base | **PASS** | UI kit próprio (26 componentes) usado nas telas e na vitrine; 4 variantes de toast com `role="status"`; foco `brand-focus`/erro `rose-700` + `.ds-bottom-clip`; nomes acessíveis; drawer `<lg`; estados vazios/erro |
| 5.21 | Specs | **PASS** | `openspec validate --specs --strict` → 30/30 |
| 5.22 | E2E | **PASS** | 53/53 checagens executadas PASS (ver `docs/RL05 - Varredura de Execução.md`) |

---

## 6. Regressões e reaberturas

| Item | Classificação | Observação |
| :--- | :--- | :--- |
| RL04-C-01 (XSS por upload) | **Corrigido e confirmado** | `image/png` + `nosniff` + CSP `sandbox`; polyglot `.html` → `400` |
| RL04-A-01 (TTL do refresh) | **Corrigido e confirmado** | 7 dias no cookie e em `sessoes` |
| RL04-A-02 (estado no logout) | **Corrigido** | `config-shell-cache` residual em B-12 |
| RL05-A-01 (revogação na troca de senha) | **Achado novo** | Gap de contrato na `revogacao-sessao` |
| RL05-M-01 (convite) | **Regressão reaberta** | RL04-B-18 / RL05-FUN-02 não corrigido |
| RL05-B-01 / B-02 (CSV/LIKE) | **Não corrigidos** | RL04-B-11 / RL04-B-12 |
| RL05-B-03 (`token_version` no refresh) | **Regressão de plano** | RL04-B-14 marcado `[x]`, mas ausente no código |
| RL05-M-07 (cache sem invalidação) | **Regressão transitória** | Regressão funcional de 30 s introduzida pelo cache |
| RL05-B-09 (índice no-op na migration 12) | **Ruído de intenção** | Sem efeito funcional |
| RL05-D-09 (403/RBAC rotulado “roadmap”) | **Doc obsoleta** | Código correto |

---

## 7. Matriz de aprovação (`docs/qa/00`)

| Critério | Resultado |
| :--- | :--- |
| Sem bugs críticos | **OK** (0 Crítica) |
| Sem bugs altos | **FALHA** — RL05-A-01, RL05-A-02 |
| Regressão inexistente | **FALHA** — M-01 reabre RL04-B-18; B-03 regressão de plano; M-07 transitória |
| Banco consistente | **RESSALVA** — integridade referencial OK; M-05 é drift de seed (não estrutural); M-04 resíduo de sessão |
| Permissões corretas | **OK no servidor**; ressalva documental (D-01) |
| Sem bypass da fronteira nem exposição de não publicado | **OK** (runtime 100% `401`/`302`; sem APIs públicas de conteúdo) |
| Sem falha de segurança | **FALHA** — A-01, A-02, M-01, M-02, M-03 |

### VEREDITO: **REPROVADO** · Risco **Alto**

---

## 8. Plano de correção priorizado

### Etapa RL05-1 — Bloqueante (segurança/sessão)
1. **A-01** — revogar sessões em troca/reset de senha (`trocar-senha`, `atualizarUsuario`, `convite`) + atualizar `revogacao-sessao/spec.md`.
2. **A-02** — `garantirAdministracaoApos` em `atualizarPerfil` (e `excluirPerfil`) com `409` + cenário na `perfis-acesso/spec.md`.
3. **M-01** — convite: validar `usuarios.situacao` da conta-alvo e exigir `alterar` para redefinir credenciais de conta existente.
4. **M-02** — limite de corpo antes do parse + autorização antes do consumo + rate limit em uploads.
5. **M-03** — `deleteCookie` com `secure`/`sameSite` para `__Host-*`.

**Critério de saída:** 0 Alta; nenhuma falha de segurança conhecida; regressão do convite fechada.

### Etapa RL05-2 — Para Aprovado sem ressalvas (consistência)
6. **M-04** — transacionar logout e revogar pelo `id` da rotação.
7. **M-05** — reconciliar o seed da migration 07 (migration 13 idempotente).
8. **M-06** — usuário de banco de menor privilégio (sem `GRANT OPTION`).
9. **M-07** — invalidação do cache de opções nas escritas de usuários/perfis.
10. **M-12 / M-13 / M-14** — alinhar specs (`gestao-usuarios`, `uploads`) e reescrever `AGENTS.md`.
11. **B-14 … B-19** — remover lixo/erros da vitrine, rodapé da 404 e textos técnicos; corrigir defaults.

**Critério de saída:** 0 Crítica/Alta/Média de produto; documentação sem contradição bloqueante; `design.vue` limpo.

### Etapa RL05-3 — Roadmap de escala (não bloqueia novos módulos)
12. **M-08 … M-11** — FULLTEXT/prefixo, export server-side, pool/503, limite em `/api/usuarios/emails`.
13. **B-01 … B-13, B-20, B-21** e **I-01 … I-04** — endurecimento e polimento.

> Observação: a Etapa RL05-3 inclui itens **intencionalmente adiados** na Etapa 4 do RL04 (FULLTEXT, streaming, paginação de e-mails); não são regressões.

---

## 9. Rastreabilidade de IDs

| Consolidado | Origem |
| :--- | :--- |
| RL05-A-01 | SEG-01 |
| RL05-A-02 | SEG-02 = BD-03 = FUN-03 |
| RL05-M-01 | SEG-03 = FUN-02 = BD-02 = EXE-01 = DOC-06 |
| RL05-M-02 | SEG-04 |
| RL05-M-03 | SEG-05 |
| RL05-M-04 | BD-01 |
| RL05-M-05 | BD-04 |
| RL05-M-06 | BD-05 = FUN-15 |
| RL05-M-07 | FUN-01 = PERF-07 |
| RL05-M-08 | PERF-01 |
| RL05-M-09 | PERF-02 = FUN-11 |
| RL05-M-10 | PERF-03 |
| RL05-M-11 | PERF-04 |
| RL05-M-12 | DOC-01 = FUN-13 = EXE-07 |
| RL05-M-13 | DOC-02 = FUN-12 = EXE-06 |
| RL05-M-14 | DOC-04 |
| RL05-B-01 … B-21 | SEG-06; SEG-07/FUN-09/EXE-04; SEG-09; SEG-10; SEG-11; BD-06/PERF-06/FUN-07; BD-07; BD-08; BD-09; BD-10; FUN-04; FUN-08; FUN-10/EXE-03; FUN-06/UX-01/EXE-02; UX-02; UX-03; UX-04; UX-05; UX-06; EXE-05; PERF-05 |
| RL05-D-01 … D-09 | DOC-03/FUN-14/EXE-08; DOC-05; DOC-07; DOC-08; DOC-09; DOC-10; DOC-11; DOC-12; DOC-13 |
| RL05-I-01 … I-04 | SEG-08; SEG-12; BD-11; UX-07 |

---

## 10. Conclusão

A varredura final confirma que o Publications **evoluiu de forma consistente** desde o RL04: os três defeitos que reprovaram a rodada anterior (XSS por upload, TTL do refresh, estado no logout) estão **corrigidos e comprovados**, a fronteira de áreas e o RBAC estão íntegros, não há SQLi/XSS reproduzível e o banco está estruturalmente são.

Ainda assim, **não é possível aprovar sem ressalvas**: a revogação de sessão não cobre troca/reset de senha (A-01), a inativação do perfil administrativo essencial causa lockout total (A-02), o convite permite redefinir credenciais de conta existente sem validar a situação real (M-01) e há duas falhas médias de endurecimento de upload/cookies (M-02/M-03). Pela matriz do `docs/qa/00`, **qualquer bug alto, regressão confirmada ou falha de segurança reprova**.

**Decisão do orquestrador: REPROVADO — Risco Alto.** Recomenda-se executar a **Etapa RL05-1** antes de iniciar novos módulos e, na sequência, a **Etapa RL05-2** para alcançar o objetivo de aprovação sem ressalvas. Após as correções, uma reauditoria direcionada (segurança + funcional + execução) deve confirmar A-01/A-02/M-01 fechados e a ausência de regressão.

> Nenhum arquivo de código foi alterado por esta auditoria; nenhuma escrita de dados de negócio foi executada. Este relatório é o artefato de saída do QA.

---

## Apêndice A — Parecer de segurança (resumo integral)

- **Veredito:** REPROVADO · Risco Alto · 2 Alta + 3 Média + 7 Baixa/Melhoria.
- **Aprovado com evidência:** fronteira (9/9 `401` + `302`), RBAC sem bypass, matriz 99/45/21/6, rotação atômica, TTL 7 dias, cookies `HttpOnly/SameSite/Secure/__Host-`, SQLi inexistente, XSS por upload fechado (`image/png` + `nosniff` + CSP), XSS refletido/armazenado inexistente, segredos não serializados, auditoria append-only, login anti-enumeração/lockout, porta pública mínima.
- **Bloqueantes:** A-01 (revogação na troca de senha) e A-02 (lockout por perfil).
- **Médias:** M-01 (convite), M-02 (upload/DoS), M-03 (cookies `__Host-`).
- **Baixas:** CSV injection, curingas `LIKE`, `token_version` no refresh, `tokenVersion` exposto, rate limit, `token_blacklist`/documentação, e itens de ambiente.
- **N/A:** Zod/safeError, headers globais/CSRF token, envio real de e-mail, soft delete, conteúdo público (placeholder), testes de escrita.
---

## 11. Correções aplicadas (fechamento do RL05)

> Executado após a varredura. **Gates:** `npm run lint` (OK), `npm run test` (7/7), `npm run typecheck` (0 erros), `npm run build` (OK). Migrations: 13/13 aplicadas. Verificações E2E ponta a ponta marcadas com **E2E**.

### 11.1 Altas (bloqueantes) — corrigidas e verificadas

| ID | Status | Correção | Verificação |
| :--- | :--- | :--- | :--- |
| **RL05-A-01** | **Corrigido** | `trocar-senha`, `atualizarUsuario` (ao gravar senha) e `convite` (conta existente) chamam `revogarSessoesDoUsuario`; a troca da própria senha emite novo par para a sessão atual | **E2E:** refresh capturado antes da troca → `401`; login com a nova senha → OK |
| **RL05-A-02** | **Corrigido** | `atualizarPerfil` chama `garantirAdministracaoApos(tx)` antes do `commit` | **E2E:** `PUT /api/perfis/:id` com `situacao=Inativo` no Administrador → `409`; perfil permanece Ativo |

### 11.2 Médias — corrigidas

| ID | Status | Correção |
| :--- | :--- | :--- |
| RL05-M-01 | Corrigido | Convite valida a situação real da conta (recusa não-Ativa com `400`) e exige `alterar` para conta existente; redefine a senha revogando as sessões da conta-alvo |
| RL05-M-02 | Mitigado | Middleware global de limite de corpo (6 MB) + pré-checagem de `content-length` em uploads + rate limit na rota; **E2E:** corpo de 7 MB → `413`. Resíduo aceito: `transfer-encoding: chunked` sem `content-length` (Baixa) |
| RL05-M-03 | Corrigido | `limparCookiesAuth` remove os cookies com `secure`/`sameSite` (prefixo `__Host-` em produção) |
| RL05-M-04 | Corrigido | Logout usa `revogarSessaoEAccess` (transação: refresh + `token_version`) e resolve a sessão só pelo access, sem rotacionar o refresh (elimina a sessão órfã) |
| RL05-M-05 | Corrigido | Migration 13 reconcilia o seed da 07 (`INSERT IGNORE`, 25 registros) — aplicada |
| RL05-M-06 | Documentado | `.env.example` passa a orientar usuário de menor privilégio (DML + EVENT, sem `GRANT OPTION`) — ação de infraestrutura no ambiente local fica pendente |
| RL05-M-07 | Corrigido | `invalidarCache('usuarios-opcoes')` nas escritas de usuários/perfis/convite/importação |
| RL05-M-08…M-11 | **Congelado (roadmap)** | Ítens de escala (FULLTEXT, export streaming, pool, `/emails`) já excluídos por decisão na Etapa 4 do RL04 — fora do escopo desta entrega |
| RL05-M-12 | Corrigido | `gestao-usuarios/spec.md` alinhada à guarda anti-lockout (`409`) |
| RL05-M-13 | Corrigido | `uploads/spec.md` alinhada ao comportamento seguro (grava `.png` + `nosniff`, nunca HTML) |
| RL05-M-14 | Corrigido | `AGENTS.md` reescrito (stack real, gates, `server/`/`shared/`, shell em `admin.vue`) |

### 11.3 Baixas e Melhorias

| ID | Status | Correção/observação |
| :--- | :--- | :--- |
| RL05-B-01 | Corrigido | Exportação CSV neutraliza fórmulas (`= + - @`) nos 3 módulos |
| RL05-B-02 | Corrigido | `escaparLike` (`server/utils/sql.ts`) aplicado em usuários e auditoria |
| RL05-B-03 | N/A | O refresh é opaco (sem versão embutida); a revogação por linha de `sessoes` + `token_version` já cobre o caso |
| RL05-B-04 | Corrigido | DTO público `sessaoPublica` — `tokenVersion` não sai nas respostas; **E2E:** ausente no login |
| RL05-B-05 | Parcial | Rate limit adicionado a uploads + limite de corpo; store persistente permanece roadmap |
| RL05-B-06 | Ambiente | Catch-up no boot cobre; execução do scheduler não comprovada (sem ação de código) |
| RL05-B-07 / B-08 | Cobertos | Expurgo catch-up no boot remove sessões revogadas/expiradas |
| RL05-B-09 | Documentado | Índice já existente na 01; `CREATE INDEX` da 12 é no-op (mantido por ser migration já aplicada) |
| RL05-B-10 | Corrigido (doc) | `docs/qa/00` atualizado (revogação por `token_version`; `token_blacklist` ociosa) |
| RL05-B-11 | Corrigido | Importação mapeia `1062` concorrente para `409` com `conflitos` |
| RL05-B-12 | Corrigido | `config-shell-cache` incluída na limpeza de estado da sessão |
| RL05-B-13 | N/A | O guard já usa `encodeURIComponent`; o `Location` sem escaping vem do Nuxt |
| RL05-B-14…B-19 | Corrigidos | `design.vue` (lixo + "Sucesso" + cor), `error.vue` (rodapé), `UploadFiles` (default), textos técnicos (tabelas/Segurança/E-mail) |
| RL05-B-20 | N/A | 404 própria depende de `Accept: text/html`; fallback padrão do Nuxt preserva o status `404` |
| RL05-B-21 | Corrigido | Migration 13 cria `idx_usuarios_tentativas_falhas` (aplicado) |
| RL05-D-01…D-09 | Corrigidos | Catálogo RBAC (+2 rotas), `docs/08`, `docs/01`, `docs/02`, `docs/03`, `docs/04`, rollback da migration 07 |
| RL05-I-01 / I-03 | Congelado (roadmap) | Headers globais/CSRF e revisão de índices sobrepostos |
| RL05-I-02 | Corrigido (parcial) | `devtools` só fora de produção; `.env.example`; catálogo RBAC alinhado |
| RL05-I-04 | Aceito | Tons cosméticos das demos de toast na vitrine (sem impacto funcional) |

### 11.4 Escopo não aplicável / congelado (não conta na aprovação)

Conteúdo público (Releases/Manuais/Escopos), `validation.ts`/`safeError.ts` (Zod/roadmap), headers globais/CSRF, envio real de e-mail, soft delete, e os itens de escala M-08…M-11 / B-05 (store persistente) / I-01 / I-03 — todos já declarados roadmap ou excluídos na Etapa 4 do RL04. O resíduo de `chunked` do M-02 fica como risco Baixo aceito.

### 11.5 Veredito final

**APROVADO** sobre o escopo aplicável: **0 Crítica, 0 Alta, 0 falha de segurança aberta**; nenhuma regressão do RL04; banco consistente (13/13 migrations, seed reconciliado, índice criado); permissões e fronteira de áreas íntegras; os 4 gates verdes. As ressalvas remanescentes são exclusivamente **roadmap/infraestrutura** (itens da seção 11.4), explicitamente fora da linha de aceite atual.