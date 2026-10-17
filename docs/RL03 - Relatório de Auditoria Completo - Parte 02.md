# RL03 — Relatório de Auditoria Completo — Parte 02

| Campo | Valor |
| :--- | :--- |
| **ID** | RL03 |
| **Tipo** | Auditoria completa de qualidade (7 especialidades + execução E2E) — reauditoria pós-correções do RL02 |
| **Base normativa** | `docs/qa/00-arquitetura-e-regras-gerais.md`, `docs/qa/01..07`, `openspec/specs/**`, `docs/01 - design_system.md`, `docs/02 - Guia de Arquitetura e Migrations.md` |
| **Data** | 16/10/2026 |
| **Escopo auditado** | Todo o sistema já implementado — Área Pública raiz + Área Administrativa (Shell, Login/Recuperação, Primeiro Acesso, Gestão de Usuários, Perfis/RBAC, Auditoria, Configurações Globais, Segurança, Meu Perfil, Uploads, Convite, Migrations, 404) + Design System/Vitrine |
| **Capabilities** | 30 entradas em `openspec list --specs` (15 funcionais + 15 sub-specs de `design-system`); **nenhuma change ativa** |
| **Método** | Análise estática + consultas read-only no MariaDB 11.8 + medições (`EXPLAIN`/bundle) + execução E2E no dev server (`localhost:3000`) |
| **Alterações de código** | **Nenhuma** — auditoria somente-leitura. O `qa-execução` criou e removeu seus próprios dados de teste e restaurou a configuração |
| **Veredito desta auditoria** | **REPROVADO** (1 Crítico, 2 Altos, 15 Médios + itens Baixos) |
| **Risco** | **Alto** |

> **Nota de escopos de ID:** os identificadores deste relatório são prefixados como `RL03-*` e **não** reutilizam os IDs do RL02 (que estão encerrados/`CORRIGIDO`). A rastreabilidade para os IDs de origem de cada especialista está na seção 9.

---

## 1. Resumo executivo

- **Status:** **REPROVADO.** O núcleo funcional auditado no RL02 continua coerente (autenticação/lockout/rate limit, fronteira anônima, RBAC por módulo, integridade do banco), mas a **revogação de sessão é contornável pelas rotas isentas de `/api/auth/*`**: um access token revogado por logout, ainda dentro da validade (~15 min), permite **alterar a senha da conta** — e a hidratação de sessão (`/api/auth/seguro`) também aceita token revogado.
- **Risco:** **Alto** — falha de autenticação/revogação de sessão (Crítica) + dois Altos funcionais (hidratação de sessão e importação de usuários).
- **O que está correto (e foi confirmado nesta rodada):**
  - **SQL Injection:** ❌ **não existe** — confirmado exaustivamente (estático) e por 11 payloads em runtime.
  - **Fronteira Área Pública × Área Administrativa:** ✅ íntegra (páginas → `302` login; APIs → `401`; endpoint público devolve só `logo_login_url`).
  - **RBAC:** ✅ catálogo de 28 rotas confere 100% com `autorizacao-rbac`; Leitor → `403` em toda escrita/leitura administrativa; sem bypass de Administrador.
  - **Banco:** ✅ 10/10 migrations, 0 órfãos, 0 duplicidades, FKs coerentes, transações nos pontos compostos.
  - **Design System / UX / Performance:** aprovados com ressalvas (apenas itens baixos/estruturais, sem impacto imediato na volumetria atual).

### 1.1 Resposta direta às perguntas do solicitante

| Pergunta | Resposta |
| :--- | :--- |
| **Há problemas de SQL Injection?** | **Não.** Todas as 40+ chamadas usam placeholders `?`; as interpolações existentes derivam só de constantes/estruturas de código. Runtime: 11 payloads (`' OR '1'='1`, `1;DROP TABLE auditoria--`, `UNION SELECT`, etc.) → `200/400/401` limpos, sem traceback/vazamento, tabelas íntegras. **Zero SQLi explorável.** |
| **Está tudo aprovado sem ressalvas?** | **Não.** SQLi, fronteira e RBAC passaram; porém a capability `revogacao-sessao` tem falha explorável (**RL03-C-01**) e há 2 Altos funcionais, o que **reprova** pela matriz do `docs/qa/00`. |

### 1.2 Veredito por especialidade

| Especialidade | Veredito | Destaque |
| :--- | :--- | :--- |
| qa-documentacao | Aprovado com ressalvas | 198/200 requisitos implementados; 2 divergências spec×código; 1 doc de replicação com config de boot obsoleta |
| qa-funcional | REPROVADO | 1 Crítico (revogação em `trocar-senha`) + 2 Altos (`/auth/seguro`, importação) |
| qa-seguranca | Aprovado com ressalvas¹ | SQLi/RBAC/fronteira OK; sem Crítico/Alto no seu recorte (não cobriu as rotas isentas) |
| qa-banco | Aprovado com ressalvas | Base íntegra; 1 inconsistência estrutural (escopo não aplicável) + itens de manutenção |
| qa-ux | Aprovado com ressalvas | 0 altos/críticos; 6 itens baixos (contraste, tipografia, a11y, vitrine) |
| qa-performance | Aprovado com ressalvas | 0 críticos/altos; 7 médios + 4 baixos, todos estruturais (escala) |
| qa-execucao | Aprovado com ressalvas | Confirmou fronteira/RBAC/SQLi; ressalva de dado vivo (matriz do Editor) + ambiente |

¹ Ver **Nota de conflito resolvido** (§2).

### 1.3 Placar consolidado

| Severidade | Qtd | IDs consolidados |
| :--- | ---: | :--- |
| Crítica | 1 | RL03-C-01 |
| Alta | 2 | RL03-A-01, RL03-A-02 |
| Média | 15 | RL03-M-01 … RL03-M-15 |
| Baixa / Melhoria | 20 | RL03-B-01 … RL03-B-20 |
| Documentação obsoleta | 8 | RL03-DOC-01 … RL03-DOC-08 |
| Dados (ambiente) | 1 | RL03-DAD-01 |

---

## 2. Nota de conflito resolvido (qa-seguranca × qa-funcional)

O `qa-seguranca` classificou a revogação de sessão como íntegra; o `qa-funcional` reportou bug Crítico. **O orquestrador verificou diretamente na fonte e confirmou o `qa-funcional`:**

- `server/middleware/auth-api.ts:12` — todo `/api/auth/*` é **isento** do middleware (que é quem chama `sessaoAtivaNoServidor`).
- `server/api/auth/trocar-senha/index.post.ts:18-40` — usa `getSessionUser` (valida **só** o JWT) + `buscarUsuarioPorId` (checa **só** `situacao === 'Ativo'`), **sem** validar `token_version`.
- `server/api/auth/seguro/index.get.ts:7-11` — idem, apenas `getSessionUser`.
- `server/utils/auth.ts:326-337` — `sessaoAtivaNoServidor` é quem compara `token_version`; **não é chamada** nessas duas rotas.

O `qa-seguranca` analisou o middleware global (correto) e não aprofundou as rotas isentas — daí a divergência. **A falha é real e explorável.** O `qa-execução` não a reproduziu porque o cenário exige um access token capturado, dentro da janela de validade, após logout (a desativação é bloqueada porque a rota checa situação).

---

## 3. Cobertura da auditoria

| Eixo | Situação |
| :--- | :--- |
| Funcional | Executado — casos BDD derivados de todas as capabilities aplicáveis |
| Regressão | Executado — cruzamentos usuário×sessão, perfis×usuários, upload×identidade; revogação regrediu nas rotas `auth` |
| Permissões (RBAC) | ✅ Executado — 28 rotas; catálogo confere com `autorizacao-rbac` |
| Banco | Executado estático + runtime (MariaDB 11.8); 10/10 migrations; 0 órfãos; 0 duplicidades |
| UX | Executado estático (6 ressalvas baixas); medição em browser não executada |
| Segurança | SQLi ✅ (0); RBAC ✅; fronteira ✅; **revogação de sessão FALHA** (RL03-C-01/A-01) |
| Performance | Executado com medições (`EXPLAIN` + bundle); gargalos estruturais de escala |
| Fronteira Área Pública × Administrativa | ✅ Anônimo OK (`/admin/**` → `302` login; `/api/**` → `401`; pública só `logo_login_url`) |
| Execução E2E | Executado — dev server real (`200`) + MariaDB up; login `ana.carolina@empresa.com.br` |
| Escopos não aplicáveis | Declarados na seção 7 |

---

## 4. Achados

### 4.1 Críticos

#### RL03-C-01 · `POST /api/auth/trocar-senha` aceita access token revogado (bypass da revogação de sessão)
- **Severidade:** Crítica
- **Módulo:** revogacao-sessao / Autenticação
- **Cenário:** acesso com token revogado por logout, ainda dentro da validade do access JWT (~15 min), altera a senha da conta.
- **Resultado esperado (spec `revogacao-sessao`):** token de sessão revogada não autentica → `401`; a troca exige sessão válida no servidor.
- **Resultado obtido:** `200 { ok: true }` com novo `hash_senha` gravado (a rota confere apenas `situacao === 'Ativo'`, que permanece `Ativo` após um logout).
- **Passos para reprodução:**
  1. Login do usuário U (access `tv=N`); capturar o cookie de access.
  2. `POST /api/auth/logout` (incrementa `token_version` para `N+1`; a conta continua `Ativo`).
  3. Reutilizar o cookie antigo (`tv=N`) em `POST /api/auth/trocar-senha` com `{ atual, nova }`.
  4. Observar `200 { ok: true }` e o novo hash gravado.
- **Evidências:** `server/api/auth/trocar-senha/index.post.ts:18-40`; `server/utils/auth.ts:262-276` (`getSessionUser` só valida JWT), `:326-337` (`sessaoAtivaNoServidor` existe mas não é chamada aqui); `server/middleware/auth-api.ts:12` (isenção `/api/auth/`).
- **Impacto:** um token roubado sobrevive ao logout e reemerge como redefinição de senha da vítima. Falha de autenticação/revogação → **reprova por si só**.
- **IDs de origem:** qa-funcional B-01.

### 4.2 Altos

#### RL03-A-01 · `GET /api/auth/seguro` devolve sessão para token revogado
- **Severidade:** Alta
- **Módulo:** revogacao-sessao / Login
- **Cenário:** recarga (F5) de rota `/admin/**` com access token revogado e não expirado.
- **Resultado esperado:** `401` para sessão revogada → login.
- **Resultado obtido:** `200 { usuario }` (só `getSessionUser`), hidratando o shell administrativo antes de as APIs falharem.
- **Evidências:** `server/api/auth/seguro/index.get.ts:7-11`; `app/composables/useAuth.ts:127-146`; `app/middleware/auth.global.ts:16-39`.
- **Impacto:** a sessão revogada ainda "autentica" na hidratação; viola o requisito de revogação imediata (não expõe dados diretamente).
- **IDs de origem:** qa-funcional B-02.

#### RL03-A-02 · Importação de usuários compara e-mail apenas com a página corrente
- **Severidade:** Alta
- **Módulo:** gestao-usuarios
- **Cenário:** base com >1 página (paginação server-side, `porPagina` padrão 20); e-mail já existente fora da página é classificado "Pronto para importar" e pré-selecionado; a API rejeita **todo** o lote com `400`.
- **Resultado esperado (spec `gestao-usuarios`):** situação "E-mail já cadastrado" (base inteira, sem distinção de caixa) e checkbox desabilitado.
- **Resultado obtido:** falso "pronto" + falha total da importação; a pré-visualização não é corrigida após o erro.
- **Passos:** ter >20 usuários e importar `.xlsx` com e-mail já existente fora da página corrente → "Importar (1)" → erro da API, nada gravado.
- **Evidências:** `app/components/usuarios/Importar.vue:58-61`; `app/components/usuarios/useUsuarios.ts:196-197`; `app/components/usuarios/lerPlanilhaUsuarios.ts:74,106`; `server/utils/usuarios.ts:641-656`.
- **Impacto:** o fluxo principal da importação é frustrado em bases reais (sem corrupção — a API é atômica e revalida).
- **IDs de origem:** qa-funcional B-03.

### 4.3 Médios

| ID | Título | Módulo | Esperado × Obtido | Evidência (arquivo:linha) | Impacto | IDs de origem |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RL03-M-01 | Perfis customizados não atribuíveis/filtráveis/importáveis na Gestão de Usuários | gestao-usuarios × perfis-acesso | Spec `perfis-acesso` permite criar perfis; cliente fixa 4 perfis do seed | `Formulario.vue:318`, `Filtros.vue:25`, `lerPlanilhaUsuarios.ts:92`, `useUsuariosModelo.ts:5,78` | RBAC dinâmico incompleto pela UI; perfis legítimos inutilizáveis | qa-funcional B-04 |
| RL03-M-02 | `POST /api/seguranca/liberar` responde `404` espúrio quando o UPDATE não altera linhas | configuracoes-globais (Segurança) | Esperado: liberação idempotente; obtido: `404 "Usuário não encontrado."` em conta já limpa/duplo clique | `auth.ts:407-413`, `seguranca/liberar/index.post.ts:16-27` | Mensagem enganosa; operador acha que a conta não existe | qa-funcional B-05 |
| RL03-M-03 | Links de e-mail caem no `Host` quando `APP_URL` está vazio | login / convite | Spec `login`: link usa sempre a origem configurada; obtido: fallback `getRequestURL(event).origin` | `esqueci-senha/index.post.ts:51-52`, `convite/index.post.ts:131` | Se `APP_URL` faltar, o controle anti-`Host`-forjado não se aplica (phishing) | qa-documentacao F-08 |
| RL03-M-04 | `docs/02` §Passo 4 marca `permission.ts` como `[roadmap]` | Documentação (RBAC) | Contradiz §3.2/§3.5 e o código (19 rotas chamam `requirePermission`) | `docs/02:639` × `:215-217` | Induz o leitor (e o QA) a tratar o RBAC como inexistente | qa-documentacao F-02 |
| RL03-M-05 | `docs/qa/00:29-30` descreve `requirePermission`/RBAC como roadmap | Documentação de processo de QA | Base compartilhada obrigatória está obsoleta | `docs/qa/00:29-30` | Contamina a classificação de achados de RBAC de todos os especialistas | qa-documentacao F-03 |
| RL03-M-06 | Spec `auditoria` exige "Gestão de Auditoria"; código/spec `layout-navigation` usam "Auditoria" | auditoria / Navegação | Divergência spec×spec×código (+ comentário de contrato desatualizado no endpoint) | `openspec/specs/auditoria/spec.md:21`, `navigation.ts:98`, `auditoria/index.get.ts:2-3` | Inconsistência de nomenclatura/contrato | qa-documentacao F-07 |
| RL03-M-07 | Paginação da Auditoria ignora índice (`filesort` da tabela inteira) | Auditoria / Performance | Esperado `type=index`; obtido `key=idx_audit_data_hora + Using filesort` (desempate `id DESC`) | `audit.ts:183`, `migration/01_create_tables.sql:527` | Latência da trilha cresce não linearmente (tabela append-only, 180 dias) | qa-performance PERF-01 |
| RL03-M-08 | `seguranca_eventos_login` ordena a tabela inteira na aba Segurança | Configurações › Segurança / Performance | `type=ALL; Using filesort` pelo mesmo desempate | `seguranca.ts:165-170`, `migration/05_seguranca_eventos_login.sql:26` | Aba Segurança degrada sem expurgo | qa-performance PERF-02 |
| RL03-M-09 | Listagem de usuários sem índice em `nome_completo` + busca `LIKE '%…%'` inindexável | gestao-usuarios / Performance | `ORDER BY nome_completo` → `ALL + filesort`; busca → `ALL` | `usuarios.ts:296,307-315` | Cada página/recarga faz full scan; busca O(n) | qa-performance PERF-03 |
| RL03-M-10 | Fanout de ~6 queries/listagem e ausência de expurgo de `sessoes` | Infra DB / Sessões | 4 queries de dados + 2 de infra por listagem; `rotacionarSessao` insere sem limpar | `usuarios.ts:317-332`, `audit.ts:195-208`, `auth.ts:166-200,203-209` | Pressão do pool; crescimento indefinido de sessões | qa-performance PERF-04/05, qa-banco BUG-04 |
| RL03-M-11 | `jspdf` no bundle inicial de 3 telas (~136 KB gzip sem uso) | Frontend (usuários/auditoria/perfis) | `exceljs` é lazy; `jspdf` é import estático | `gerarPdfUsuarios.ts:4-5`, `gerarPdfFichaCadastral.ts:5`, `gerarPdfAuditoria.ts:4-5`, `gerarPdfPerfis.ts:6-7` | Afeta TTI em redes móveis | qa-performance PERF-06 |
| RL03-M-12 | `registrarAuditoria` aguardada no caminho da resposta e aceita detalhes de até 16 MB | Auditoria / todas as escritas | Esperado: trilha não atrasa a resposta; obtido: `await` + `slice(0, 16_000_000)` | `audit.ts:109-122` | Latência somada a toda escrita; risco de registro desproporcional | qa-performance PERF-08 |
| RL03-M-13 | Pool sem `acquireTimeout`/`connectTimeout`; limite 10 com fanout alto | Infra DB | Filas saturam sem timeout controlado; `queueLimit` rejeita imediatamente | `db.ts:24-25` | Sob pico, falha imediata/indefinida | qa-performance PERF-09 |
| RL03-M-14 | Divergência estrutural `CASCADE` (release→entregas) × `RESTRICT` (entregas→histórico) | Schema do conteúdo público | Exclusão de release cascatearia e seria bloqueada (errno 1451) | `migration/01_create_tables.sql:422-426,572-576` | **Não reproduzível hoje** (conteúdo público é roadmap); risco futuro | qa-banco OBS-01 |
| RL03-M-15 | `docs/02` §6 Passos 2/3 com `runtimeConfig`/`.env` obsoletos; replicar o guia não sobe o app | Documentação de Arquitetura | Guia usa `jwtSecret`/`JWT_SECRET`; código exige `AUTH_JWT_SECRET`/`SMTP_ENC_KEY` (`auth-config.ts` aborta o boot) | `docs/02:587-591,611-625`; `nuxt.config.ts:22-32`; `server/plugins/auth-config.ts:11-23` | Guia de replicação gera app que não boota | qa-documentacao F-01 |

### 4.4 Baixos e melhorias

| ID | Título | Módulo | Evidência | IDs de origem |
| :--- | :--- | :--- | :--- | :--- |
| RL03-B-01 | Conflito interno da spec `gestao-usuarios` (filtros "em memória" × "no servidor") | gestao-usuarios (doc) | `openspec/specs/gestao-usuarios/spec.md:167` × `:292` | qa-funcional B-06 |
| RL03-B-02 | Dica de upload informa "SVG", mas o servidor rejeita SVG | configuracoes-globais / uploads | `AbaLogomarcas.vue:194,242`; `uploads.ts:10,17-33` | qa-funcional B-07 |
| RL03-B-03 | Campo de rate limit aceita `0` no rascunho e o `PUT` responde `400` genérico | configuracoes-globais | `AbaSeguranca.vue:113-117`; `configuracoes/index.put.ts:66-79` | qa-funcional B-08 |
| RL03-B-04 | Nome de perfil duplicado (`409`) cai em toast genérico, sem erro no campo | perfis-acesso | `perfis/Formulario.vue:120-136`; `perfis.ts:278-283` | qa-funcional B-09 |
| RL03-B-05 | Comentário obsoleto no modal de permissões ("sem interruptor nesta etapa") | perfis-acesso | `perfis/Permissoes.vue:38-40` × `:303-315` | qa-funcional B-10 |
| RL03-B-06 | Accent `#4ed813` aplicado como texto/ícone sobre fundo claro na `UiDataTable` | Design System | `DataTable.vue:590,652` | qa-ux Achado 1 |
| RL03-B-07 | Hex fora da paleta (`#183b8c`) no hover dos links de autenticação | Login / Recuperação | `LoginForm.vue:153`, `ForgotForm.vue:122,167` | qa-ux Achado 2 |
| RL03-B-08 | Peso tipográfico dos rótulos (`font-bold`/`font-semibold`) divergente de `font-medium` | Design System | `Input.vue:99`, `Textarea.vue:57`, `Select.vue:251`, `DatePicker.vue:210`, `Segmented.vue:146` | qa-ux Achado 3 |
| RL03-B-09 | Ordenação/agrupamento/resize/totalizadores da `UiDataTable` inacessíveis por teclado (sem `aria-sort`) | Design System | `DataTable.vue:696-765,1050-1108` | qa-ux Achado 4 |
| RL03-B-10 | Botão de busca de CEP (`role="button"`) não responde a `Space` | Usuários / Meu Perfil | `usuarios/Formulario.vue:447-459`, `perfil/AbaEndereco.vue:55-67` | qa-ux Achado 5 |
| RL03-B-11 | Vitrine com resíduos `lime-500`/`rose-500`/`rose-600` e hex fora da paleta em demos | Vitrine `/design` | `design.vue:678,684,714,1244-1265,2015-2018` | qa-ux Achado 6 |
| RL03-B-12 | `buscarPerfil` roda `COUNT(*) … GROUP BY perfil_id` sobre toda a tabela `usuarios` a cada leitura/gravação | perfis-acesso / Performance | `perfis.ts:195-200,244,414,425-428` | qa-performance PERF-07 |
| RL03-B-13 | Matriz de permissões grava 11 `INSERT` em loop (poderia ser multi-row) | perfis-acesso / Performance | `perfis.ts:390-406,433-449` | qa-performance PERF-10 |
| RL03-B-14 | Boot: `migrarSenhasSmtp` faz N+1 (um `UPDATE` por registro legado) | Migrations/Boot | `usuarios.ts:499-509` | qa-performance PERF-11 |
| RL03-B-15 | Exportação devolve até 10.000 registros em uma resposta (sem streaming) | Usuários/Auditoria | `usuarios.ts:272,305-310`, `audit.ts:66,179-186` | qa-performance PERF-13 |
| RL03-B-16 | Expurgo cobre apenas `auditoria`; `seguranca_eventos_login`/`sessoes`/`token_blacklist` ficam de fora | Migrations/Expurgo | `migration/10_auditoria_expurgo_event.sql:12-21`, `expurgo.ts:7-22` | qa-performance PERF-14 |
| RL03-B-17 | Rotação de refresh sem `FOR UPDATE` e sem detecção de reuso | Autenticação / Performance-segurança | `auth.ts:176-193` | qa-seguranca F-01 |
| RL03-B-18 | Ausência de headers de segurança globais (só `nosniff` em `/uploads/**`) — camada roadmap | Infra / Segurança | `nuxt.config.ts:44-48` | qa-seguranca F-02 |
| RL03-B-19 | CSRF sem token dedicado (mitigado por `SameSite=Lax`) | API / Sessão | `auth.ts:55-60` | qa-seguranca F-03 |
| RL03-B-20 | Curingas `LIKE` não escapados nas buscas (não é SQLi) | auditoria / gestao-usuarios | `audit.ts:168`, `usuarios.ts:295` | qa-seguranca F-04 |

### 4.5 Documentação obsoleta

| ID | Documento e trecho | Estado real |
| :--- | :--- | :--- |
| RL03-DOC-01 | `docs/01 §5.10` (default do `UiKpi` `#2161ef`) | Código usa `#0364f7` (`Kpi.vue:15-21`); `#2161ef` não existe no kit |
| RL03-DOC-02 | `docs/01:219` e `docs/qa/00:25` (`lucide-vue-next`) | Pacote real é `@lucide/vue` (`package.json:13`) |
| RL03-DOC-03 | `docs/05:192,194,205`, `docs/07:195`, `docs/bd/02_seed.sql:4`, `server/migration/02_seed.sql:7`, `server/utils/perfis.ts:3,28,43` (`usePerfisDemo`/`useAuditoriaDemo`) | Arquivos reais são `usePerfisModelo.ts`/`useAuditoriaModelo.ts` |
| RL03-DOC-04 | `docs/02 §2` (árvore de utilitários) | Omite `server/utils/bootstrap-admin.ts` |
| RL03-DOC-05 | `docs/01` Sumário ("Componentes (5.1–5.17)") | Corpo documenta até §5.20 (Avatar) |
| RL03-DOC-06 | `server/api/auditoria/index.get.ts:2-3` (contrato `{ registros, opcoes }`) | Contrato real: `{ registros, total, kpis, opcoes, pagina, porPagina }` |
| RL03-DOC-07 | `docs/02 §Passo 2/3` (config de boot) | Duplica RL03-M-15 (mantido aqui para rastreio do bloco de docs) |
| RL03-DOC-08 | `docs/qa/00:29-30` (RBAC roadmap) | Duplica RL03-M-05 (mantido aqui para rastreio do bloco de docs) |

### 4.6 Achado de dados (ambiente, não código)

#### RL03-DAD-01 · Matriz do perfil **Editor** divergente da semente (42/99 em vez de 45/99)
- **Severidade:** Baixa (dado vivo no ambiente de dev)
- **Módulo:** Perfis de Acesso (RBAC) / Dados
- **Esperado:** 45/99 (seed `02_seed.sql`; `docs/07`/spec) → KPI 171/396.
- **Obtido:** 42/99 → KPI 168/396; o módulo `release-week` do Editor perdeu as 3 ações fixas (`visualizar`,`criar`,`alterar`), mantendo só `[publicar, arquivar, download, exportar]`. Administrador `99/99`, Revisor `21/99`, Leitor `6/99` corretos.
- **Evidências:** `GET /api/perfis` (qa-execução); banco `publications.permissoes_perfil` (qa-banco OBS-02).
- **Atribuição:** o código de gravação está correto (valida `400/409` e mantém o Administrador íntegro) — a divergência é **provavelmente resíduo de testes destrutivos de uma execução anterior**.
- **Ação:** re-semear/re-gravar a matriz do Editor e confirmar 45/99; se reaparecer sem edição manual, reabrir como bug de código.
- **IDs de origem:** qa-banco OBS-02, qa-execucao 5.1.

### 4.7 Observações de ambiente (E2E)

| ID | Observação | Severidade | Evidência |
| :--- | :--- | :--- | :--- |
| RL03-B-21 | IP registrado como `0.0.0.0` na auditoria/segurança (rate limit vira bucket global) | Baixa/Média (ambiente) | `ipDoCliente` → `getRequestIP` retornou vazio no runtime Nitro; validar em produção (`audit.ts`, `rateLimit.ts:55-62`) |
| RL03-B-22 | `stack` (trace) presente nas respostas de erro em dev | Baixa (dev) | validar no build de produção (`Nitro` normalmente omite) |
| RL03-B-23 | `redirect` do guard usa barra literal (`?redirect=/admin/...`) em vez de percent-encoded | Baixa (cosmético) | `app/middleware/auth.global.ts:32-36` |

---

## 5. Matriz de aprovação

| Critério | Situação |
| :--- | :--- |
| Sem bugs críticos | **FALHA** — RL03-C-01 |
| Sem bugs altos | **FALHA** — RL03-A-01, RL03-A-02 |
| Regressão inexistente | **FALHA** — revogação de sessão regrediu nas rotas `/api/auth/*` |
| Banco consistente | OK |
| Permissões corretas | OK — catálogo RBAC confere 100% |
| Sem bypass da fronteira / exposição de conteúdo não publicado | OK — anônimo e RBAC íntegros; sem endpoint público de conteúdo |

### VEREDITO: REPROVADO — Risco Alto

---

## 6. Escopos não aplicáveis (com motivo)

1. **Conteúdo da Área Pública** (Releases Week, Manuais, Escopo de Projetos) — só existe o placeholder `app/pages/index.vue`; não há páginas `/releases`,`/manuais`,`/escopos` nem APIs públicas. As tabelas existem no schema sem UI/API/dados. **Logo, "exposição de conteúdo não publicado" é não aplicável hoje.**
2. **Módulos da sidebar sem rota** (Manuais, Release Week, Escopo, Esteira, Chamadas, Parceiros, Softwares) — exibem "Módulo em construção" (`layout-navigation`).
3. **`server/utils/validation.ts` (Zod) e `server/utils/safeError.ts`** — roadmap declarado; não existem.
4. **Headers de segurança globais / CSRF token** — roadmap declarado (ver RL03-B-18/B-19).
5. **`usePermissions().can()` consumido pela UI** — helper existe e é conforme a spec (`.can()` disponível sem exigir ocultação de botões).
6. **Medições de UI em navegador** (contraste computado, overflow 320–1440px, foco/trap) — dependem de runtime.
7. **Envio real de e-mail** (convite/recuperação) — `RESEND_API_KEY` ausente no ambiente; convite responde `502`.
8. **Soft delete** — não previsto; exclusão física é intencional e coerente.
9. **Bundle size / lint / test / typecheck scripts** — inexistentes no repositório.

---

## 7. Plano de correção por etapas

> Cada etapa deve virar um change OpenSpec (`/opsx-propose` → apply → `/opsx-sync` → `/opsx-archive`) e terminar com `npm run build` + verificação visual em `/design` quando houver UI. A reauditoria confirma o fix na próxima passagem.

### Etapa 1 — Revogação de sessão (desbloqueio de crítico) · **obrigatória**
- **RL03-C-01:** validar `sessaoAtivaNoServidor(sessao)` em `trocar-senha` (ou aplicar o middleware de revogação a todas as rotas autenticadas de `/api/auth/*`, exceto `login`/`refresh`/`esqueci-senha`).
- **RL03-A-01:** `/api/auth/seguro` deve validar a revogação antes de devolver `{ usuario }`.
- **RL03-B-17:** `SELECT … FOR UPDATE` na rotação do refresh.
- Critério de aceite: cookie de access pós-logout → `401` em `trocar-senha` e em `seguro`.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `endurecer-revogacao-sessao`: novo helper `obterSessaoValida(event)` (`server/utils/auth.ts`) usado por `GET /api/auth/seguro` e `POST /api/auth/trocar-senha`, que agora validam a revogação no servidor (conta Ativa + `token_version`) e respondem `401` limpando os cookies; `rotacionarSessao` passou a usar `SELECT … FOR UPDATE` (rotação atômica, reuso/concorrência → `401`). Verificado por `npm run build` e E2E real: cookie de access pós-logout → `401` em `/api/auth/seguro` e `/api/auth/trocar-senha` (senha inalterada); refresh reutilizado → `401` e renovações concorrentes → `200,401`; desativação de usuário → `401`; sessão válida e fluxo de senha provisória (`primeiro-acesso`) inalterados.

### Etapa 2 — Importação de usuários
- **RL03-A-02:** validar e-mails contra a **base completa** na pré-visualização (usar consulta/`exportar=1` no servidor), desabilitando a linha e refletindo a correção após erro.
- Critério de aceite: e-mail existente fora da página → "E-mail já cadastrado"; o lote não é rejeitado por linha já existente.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `corrigir-importacao-usuarios`: novo endpoint `GET /api/usuarios/emails` (`listarEmailsUsuarios` + rota sob `gestao-usuarios`/`visualizar`) entrega todos os e-mails da base; a pré-visualização (`Importar.vue`) classifica "E-mail já cadastrado" contra essa lista (não mais a página corrente) e, ao selecionar o arquivo, falha de busca da base impede a pré-classificação; a API passa a devolver `data.conflictos` no `400` e o cliente marca/desmarca as linhas conflitantes sem descartar o arquivo. Verificado por `npm run build` e E2E real: `GET /api/usuarios/emails` → `401` anônimo / `200` admin (todos os e-mails) / `403` perfil sem `visualizar`; importar e-mail existente → `400` com `data.conflitos`.

### Etapa 3 — RBAC dinâmico na UI e ergonomia de segurança
- **RL03-M-01:** usar `opcoes.perfis` do servidor no formulário/filtros/importação (perfis customizados atribuíveis).
- **RL03-M-02:** liberação de bloqueio idempotente (não devolver `404` quando a conta existe e já está limpa).
- Critério de aceite: perfil customizado atribuível e filtrável; liberar conta já limpa → `200`.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `rbac-dinamico-ui-liberacao-bloqueio`: `PerfilUsuario` virou `string` e o badge usa `variantePerfil` (fallback `neutral`); Formulário/Filtros montam as opções de Perfil a partir de `opcoes.perfis` (do servidor) e a importação valida o Perfil contra essa lista (`lerPlanilhaUsuarios` recebe `perfisValidos`); `limparFalhasLogin` passou a confirmar a existência da conta (liberação idempotente). Verificado por `npm run build` e E2E real: liberar conta existente já limpa → `200` (antes `404`); conta inexistente → `404`; perfil customizado Ativo aparece em `opcoes.perfis` e é aceito na importação (`200`, 1 importado).

### Etapa 4 — Banco, índices e expurgo (performance)
- **RL03-M-07/08:** remover o desempate `id DESC` **ou** criar índices `(data_hora, id)` e `(ocorrido_em, id)` (migration aditiva).
- **RL03-M-09:** índice em `usuarios.nome_completo`; avaliar prefixo/`FULLTEXT` para a busca.
- **RL03-M-10/B-16:** estender o EVENT para expurgar `sessoes`/`token_blacklist` vencidos e retenção de `seguranca_eventos_login`.
- **RL03-M-11:** `await import('jspdf')` no clique (padrão do `exceljs`).
- **RL03-M-12/13:** limitar `detalhes` a teto realista; definir `connectTimeout`/`acquireTimeout`.
- **RL03-B-12/13/14:** contagem de vínculos sob demanda, INSERT multi-row da matriz, UPDATE em lote no boot.
- Critério de aceite: `EXPLAIN` deixa de acusar `filesort`; bundle das 3 telas sem `jspdf`; eventos de sessão purgados.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `desempenho-indices-expurgo-bundle`: nova migration `11_indices_e_expurgo.sql` com índices compostos `idx_audit_data_hora_id`, `idx_seguranca_ocorrido_id`, `idx_usuarios_nome` (EXPLAIN sem `filesort`) e 3 eventos diários de expurgo `ev_expurgo_sessoes`/`ev_expurgo_token_blacklist`/`ev_expurgo_seguranca_login` (`ENABLED`); `jspdf`/`jspdf-autotable` passaram a `await import(...)` nos 4 geradores (bundle caiu de 12.6→10.2 MB); pool com `connectTimeout`/`acquireTimeout`; `detalhes` limitado a 8 KB; matriz de permissões em INSERT multi-row; `buscarPerfil` usa `contarVinculos` (não o `GROUP BY` global); `migrarSenhasSmtp` em um único UPDATE em lote. Verificado por `npm run build` + banco real (11 migrations; índices presentes; `EXPLAIN` `Using index`; eventos `ENABLED`) + E2E (`salvar_matriz`/`copiar_matriz` → `200`).

### Etapa 5 — Documentação e contratos
- **RL03-M-04/M-05 + DOC-01…DOC-08:** corrigir `docs/02` (§Passo 2/3 config de boot; §Passo 4 `permission.ts` = `[existe]`), `docs/qa/00` (RBAC implementado; `@lucide/vue`), `docs/01` (default do `Kpi`, sumário 5.1–5.20, `@lucide/vue`), nomes `*Modelo`, árvore com `bootstrap-admin.ts`, comentário de contrato do endpoint de auditoria, rótulo da sidebar.
- **RL03-M-03:** remover o fallback `getRequestURL().origin` ou falhar explicitamente sem `APP_URL`.
- **RL03-M-06:** alinhar spec `auditoria` ao rótulo real ("Auditoria").
- Critério de aceite: `npm run build` OK; guia do `docs/02` sobe o app com as chaves reais.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `documentacao-contratos-alinhamento`: `esqueci-senha`/`convite` removem o fallback `getRequestURL().origin` e falham explicitamente sem `APP_URL` (documentada como obrigatória no `.env.example`); rótulo da sidebar alinhado para **"Gestão de Auditoria"** na spec `design-system/layout-navigation` e no `docs/01` (nota: a reverificação mostrou que o código e a spec `auditoria` já usam "Gestão de Auditoria" — a divergência estava na spec `layout-navigation`/`docs/01`, não na spec `auditoria`); `docs/02` (config de boot real `AUTH_JWT_SECRET`/`SMTP_ENC_KEY`/`APP_URL` + `.env`; `permission.ts = [existe]`; árvore com `bootstrap-admin.ts`), `docs/qa/00` (RBAC `requirePermission` implementado; `@lucide/vue`), `docs/01` (default `Kpi` `#0364f7`, sumário 5.1–5.20, `@lucide/vue`), nomes `usePerfisModelo`/`useAuditoriaModelo` (docs/05, docs/07, docs/bd/02, migration 02, comentários) e o comentário de contrato do endpoint de auditoria. Verificado por `npm run build` + `openspec validate --specs` (30/30) + grep sem resíduos de `*Demo`/`lucide-vue-next`/`#2161ef`/rótulo "Auditoria".

### Etapa 6 — Funcional e UX (baixos)
- **RL03-B-02…B-05** (SVG, rate limit `0`, `409` no campo Nome, comentário) e **RL03-B-06…B-11** (tokens/contraste, tipografia, a11y da `DataTable`, CEP por `Space`, vitrine).
- Critério de aceite: kit sem hex/`lime-500` fora do token; `UiDataTable` com `aria-sort` e navegação por teclado; vitrine sem resíduos.
- **Status: CORRIGIDO (16/10/2026)** — change OpenSpec `polimento-funcional-e-ux`: accent sobre claro corrigido na `UiDataTable` (tile do título + ícone de agrupamento → `brand-focus`) e hover do login (`#183b8c` → `brand-primary`); rótulos de `Input`/`Textarea`/`Select`/`DatePicker`/`Segmented` em `font-medium`; `UiDataTable` com `th` ordenável focoável por teclado (`tabindex`, `@keydown` Enter/Espaço) e `aria-sort`/`aria-label`; CEP responde a `Space`; dica de logomarca sem "SVG" (`PNG, JPG, WebP ou GIF`); rate limit valida mínimo `1`; `409` de nome de perfil aponta o campo Nome; comentário obsoleto do modal de permissões removido; vitrine sem `lime-500`/`rose-500`/`rose-600`/hex fora da paleta (Kpi `#0364f7`/`#047857`/`#112051`/`#4338ca`). Verificado por `npm run build` + `openspec validate --specs` (30/30) + grep sem resíduos (exceto o swatch legítimo de Rate Limit `#e11d48`).

### Etapa 7 — Dados e ambiente
- **RL03-DAD-01:** re-semear/re-gravar a matriz do Editor e confirmar 45/99 (se reaparecer sem edição manual, reabrir como bug de código).
- **RL03-B-21/22:** validar IP real e ausência de `stack` no build de produção.
- **RL03-M-14:** planejar a interação `CASCADE`×`RESTRICT` antes de implementar o conteúdo público.
- **Status: CORRIGIDO (17/10/2026)** — change OpenSpec `fechamento-dados-e-ambiente`: matriz do perfil **Editor** restaurada para **45/99** (linha `release-week` re-gravada com o seed; Admin 99 / Revisor 21 / Leitor 6 conferidos, sem migration); build de produção validado (`401` **sem** `stack`) e a trilha registra o **IP real** da conexão (`::1`, não `0.0.0.0` — os `0.0.0.0` eram do runtime de dev); nota de integridade referencial do conteúdo público (`CASCADE` `entregas_itens` × `RESTRICT` `historico_esteira_revisao`) registrada no `docs/02` §4.6. Verificado por `openspec validate --specs` (30/30) + produção (`node .output/server/index.mjs`) + consulta ao banco. Ressalva nova: o boot de produção emitiu `Ignoring invalid configuration option ... acquireTimeout` (a opção `acquireTimeout` do `db.ts`, adicionada na Etapa 4, não é aceita pelo mysql2 v3) — **CORRIGIDO (17/10/2026)** pela change `corrigir-opcao-pool-mysql2` (opção `acquireTimeout`/`DB_ACQUIRE_TIMEOUT` removida; `connectTimeout`/`DB_CONNECT_TIMEOUT` mantido e documentado; boot de produção sem o warning, verificado).

---

## 8. Rastreabilidade de IDs

| Consolidado (RL03) | Especialistas de origem |
| :--- | :--- |
| RL03-C-01 | qa-funcional B-01 |
| RL03-A-01 | qa-funcional B-02 |
| RL03-A-02 | qa-funcional B-03 |
| RL03-M-01 | qa-funcional B-04 |
| RL03-M-02 | qa-funcional B-05 |
| RL03-M-03 | qa-documentacao F-08 |
| RL03-M-04 | qa-documentacao F-02 |
| RL03-M-05 | qa-documentacao F-03 |
| RL03-M-06 | qa-documentacao F-07 |
| RL03-M-07 | qa-performance PERF-01 |
| RL03-M-08 | qa-performance PERF-02 |
| RL03-M-09 | qa-performance PERF-03 |
| RL03-M-10 | qa-performance PERF-04, PERF-05; qa-banco BUG-04 |
| RL03-M-11 | qa-performance PERF-06 |
| RL03-M-12 | qa-performance PERF-08 |
| RL03-M-13 | qa-performance PERF-09 |
| RL03-M-14 | qa-banco OBS-01 |
| RL03-M-15 | qa-documentacao F-01 |
| RL03-B-01 | qa-funcional B-06 |
| RL03-B-02 | qa-funcional B-07 |
| RL03-B-03 | qa-funcional B-08 |
| RL03-B-04 | qa-funcional B-09 |
| RL03-B-05 | qa-funcional B-10 |
| RL03-B-06 | qa-ux Achado 1 |
| RL03-B-07 | qa-ux Achado 2 |
| RL03-B-08 | qa-ux Achado 3 |
| RL03-B-09 | qa-ux Achado 4 |
| RL03-B-10 | qa-ux Achado 5 |
| RL03-B-11 | qa-ux Achado 6 |
| RL03-B-12 | qa-performance PERF-07 |
| RL03-B-13 | qa-performance PERF-10 |
| RL03-B-14 | qa-performance PERF-11 |
| RL03-B-15 | qa-performance PERF-13 |
| RL03-B-16 | qa-performance PERF-14 |
| RL03-B-17 | qa-seguranca F-01 |
| RL03-B-18 | qa-seguranca F-02 |
| RL03-B-19 | qa-seguranca F-03 |
| RL03-B-20 | qa-seguranca F-04 |
| RL03-B-21/22/23 | qa-execução 5.2/5.3/5.4 |
| RL03-DAD-01 | qa-banco OBS-02; qa-execução 5.1 |
| RL03-DOC-01…08 | qa-documentacao F-04, F-05, F-06, F-09, F-10 e duplicatas de rastreio |

---

## 9. Encerramento

A auditoria cobriu funcional, regressão, permissões, banco, UX, segurança, performance e a fronteira Área Pública × Área Administrativa, com execução E2E real. O sistema está **funcionalmente maduro** — SQL Injection inexistente, RBAC e fronteira íntegros, banco consistente — porém **não está aprovado sem ressalvas**: a **revogação de sessão é contornável nas rotas isentas de `/api/auth/*`** (RL03-C-01/A-01) e a **importação de usuários** falha em bases paginadas (RL03-A-02). Corrigidas as Etapas 1 e 2 (e, idealmente, as 3 e 4), o sistema retorna a **Aprovado**. Nenhum arquivo foi alterado; o ambiente de execução foi limpo.
