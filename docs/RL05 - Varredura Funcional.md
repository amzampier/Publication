# RL05 — Varredura Funcional (verificação final antes de novos módulos)

| Campo | Valor |
| :--- | :--- |
| **ID** | RL05-FUN |
| **Tipo** | Verificação funcional de regressão pós-RL04 (Etapas 1–5) |
| **Base normativa** | `openspec/specs/**` (30 specs — prevalece), `docs/01`, `docs/02`, `docs/qa/00`, `docs/qa/01` |
| **Data** | 17/10/2026 |
| **Escopo** | Área Pública raiz + Área Administrativa (Shell, Login/Recuperação, Primeiro Acesso, Gestão de Usuários, Perfis/RBAC, Auditoria, Configurações Globais, Segurança, Meu Perfil, Uploads, Convite, Migrations, 404) + Vitrine `/design` |
| **Método** | Análise estática + consultas read-only no MariaDB 11.8 + E2E GET no dev server (`localhost:3000`) com a sessão de `ana.carolina@empresa.com.br` |
| **Alterações de código** | **Nenhuma** (somente-leitura; nenhum POST/PUT/DELETE de dados) |
| **Veredito** | **APROVADO COM RESSALVAS** — sem Crítico/Alto novo; RL04-C-01/A-01/A-02 corrigidos; 3 Médios + baixos + conflitos de spec |
| **Risco** | **Médio** |

> Permissões (etapa 6), segurança (etapa 9), banco (etapa 7) e UX (etapa 8) pertencem aos respectivos agentes; aqui só o que cruza o funcional.

---

## 1. Resumo executivo

- **Status: APROVADO COM RESSALVAS.** As correções das Etapas 1–5 do RL04 **se sustentam**: o XSS por upload não existe mais (extensão derivada do tipo real; servido `image/png` + `nosniff` + CSP `sandbox`), o TTL do refresh voltou a 7 dias, o estado sensível é limpo no logout, a ordenação é server-side, o shell usa `/api/configuracoes/shell`, a recuperação responde off-path, os KPIs são zerados na falha e os baixos funcionais estão no ar.
- **Fronteira Pública × Administrativa íntegra em runtime:** anônimo → `401` em 100% das APIs administrativas (incluindo `GET /api/usuarios/:id` e `GET /api/configuracoes/shell`); `/admin/**` → `302 /admin/login?redirect=…`; a única porta pública (`/api/configuracoes/identidade`) devolve **só** `logo_login_url`; a raiz não chama API.
- **RBAC por módulo íntegro no código:** todas as rotas administrativas chamam `requirePermission`; a matriz vem do banco por request; 99/45/21/6 confirmados por `GET /api/perfis`.
- **Ressalvas novas (nenhuma Crítica/Alta):** (1) cache de opções de 30 s sem invalidação → perfil customizado some do modal/filtro por até 30 s; (2) convite a conta Inativa **existente** com payload `situacao=Ativo` retorna 200 e redefine a senha; (3) inativar o perfil que sustenta a administração essencial não é recusado (vetor de lockout); (4) importação concorrente de e-mail duplicado → 500; (5) resíduos do E2E anterior em `uploads/avatares/`; (6) lixo `7 x [Sucess]` na 1ª linha de `app/pages/design.vue`.
- **4 conflitos spec×código** para o agente de documentação: exclusão "irrestrita" × anti-lockout; upload PNG+HTML 400×200; catálogo RBAC sem `GET /api/usuarios/:id` e `/api/configuracoes/shell`; convite valida situação do payload, não da conta.

### 1.1 Placar

| Severidade | Qtd | IDs |
| :--- | ---: | :--- |
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 3 | RL05-FUN-01, RL05-FUN-02, RL05-FUN-03 |
| Baixa / Melhoria | 8 | RL05-FUN-04 … RL05-FUN-11 |
| Conflito doc/spec | 3 | RL05-FUN-12 … RL05-FUN-14 |
| Ambiente (banco) | 1 | RL05-FUN-15 |

---

## 2. Cobertura executada

| Eixo | Situação |
| :--- | :--- |
| Funcional | Executado — GET reais + análise estática das escritas |
| Regressão | Executado — usuários×perfis×opções, auth×revogação, upload×servimento, auditoria×filtros, config×shell |
| Fronteira Pública × Admin | Executado em runtime |
| RBAC por perfil | Estático + admin em runtime (sem conta Leitor/Editor no banco) |
| Negativos | Executado — 400/401/404, destino de upload, duplicidade (código) |
| Borda | Executado — TTL, paginação além do fim, `porPagina` clamp, reuso de refresh |
| Banco | Leitura — 12/12 migrations, 177 sessões, 322 auditorias, eventos `LAST_EXECUTED` nulo |
| UX/Performance/Segurança/Banco | Repassados aos especialistas |

---

## 3. Achados

### 3.1 Médias

#### RL05-FUN-01 · Cache de opções (30 s) sem invalidação — perfil customizado/usuário novo somem do modal e do filtro
- **Severidade:** Média (regressão transitória)
- **Módulo:** Gestão de Usuários × Perfis × cache de infra
- **Cenário:** criar um perfil customizado Ativo e abrir o modal de usuário (ou o modal de Filtros) sem aguardar 30 s.
- **Esperado (spec `gestao-usuarios`):** "Perfil customizado é oferecido no modal de usuário" e "Perfil customizado aparece nas opções do filtro" — imediatamente.
- **Obtido:** `listarUsuarios` serve `opcoes` de `cacheado('usuarios-opcoes', 30_000, …)` **sem invalidação** em `criarPerfil`/`criarUsuario`/`atualizarPerfil`; o select (`Formulario.vue:318`) e o filtro ficam sem a opção por até 30 s (idem `auditoria-opcoes`).
- **Passos:** criar perfil "X" → Gestão de Usuários → Novo Usuário → select de Perfil sem "X"; após 30 s, aparece.
- **Evidências:** `server/utils/usuarios.ts:362-371`; `server/utils/audit.ts:256-265`; `server/utils/cache.ts` (sem invalidar); `app/components/usuarios/Formulario.vue:318`.
- **Impacto:** requisito explícito de perfis customizados falha em janela de 30 s após cada escrita.
- **Origem:** RL04 `otimizar-desempenho-e-banco` (cache TTL 30 s) — regressão.

#### RL05-FUN-02 · Convite a conta **Inativa/Bloqueada existente** com payload `situacao=Ativo` retorna 200 e redefine a senha
- **Severidade:** Média
- **Módulo:** Convite × Gestão de Usuários
- **Cenário:** `POST /api/convite` para e-mail de conta Inativa, com `situacao=Ativo` (ou omitido — default `Ativo`).
- **Esperado (Requirement "O convite só atribui credenciais a usuário Ativo"):** `400`, nenhuma credencial gerada.
- **Obtido:** a rota valida só `body.situacao` (payload) e nunca lê a situação da conta; o `UPDATE` redefine `hash_senha`/`senha_provisoria` e devolve `200 {ok:true,criado:false}`; o login segue bloqueado (Inativo).
- **Passos:** conta Inativa no banco → `POST /api/convite {email, senha, nome, perfil, situacao:"Ativo"}` → 200. (Não executado: exige escrita e não há conta Inativa no ambiente.)
- **Evidências:** `server/api/convite/index.post.ts:51-54,86-91,108-122`; `app/components/usuarios/Convite.vue:151`.
- **Impacto:** credenciais provisórias inválidas entregues por e-mail.
- **Origem:** RL04-B-18 (parcial) + qa-documentacao — confirmado.

#### RL05-FUN-03 · Inativar/bloquear o perfil que sustenta a única administração essencial não é recusado (lockout)
- **Severidade:** Média
- **Módulo:** Perfis de Acesso × Autenticação
- **Cenário:** `PUT /api/perfis/:id` marcando como Inativo/Bloqueado o único perfil com `alterar` nos 3 módulos essenciais.
- **Esperado:** a guarda de lockout deveria impedir o sistema ficar sem administração possível.
- **Obtido:** `atualizarPerfil` revoga as sessões do perfil e **não chama `garantirAdministracaoApos`**; o login recusa perfil não-Ativo → lockout total.
- **Passos:** Perfis → Editar Administrador → Inativo → Salvar (200) → login → `403 "Perfil de acesso inativo"`.
- **Evidências:** `server/utils/perfis.ts:292-326` × `:382-388`; `server/api/auth/login/index.post.ts:76-81`.
- **Impacto:** lockout total por ação legítima de UI; spec não enumera a inativação de perfil (gap de spec + guarda ausente).
- **Origem:** RL04-B-10 (guarda estendida a usuário, não a perfil) — novo.

### 3.2 Baixas / Melhorias

#### RL05-FUN-04 · Importação concorrente de e-mail duplicado devolve 500 (não reporta conflitos)
- **Severidade:** Baixa · **Módulo:** Gestão de Usuários (importação)
- **Esperado (spec):** linhas conflitantes viram "E-mail já cadastrado" (API reporta conflitos no commit).
- **Obtido:** o `INSERT` multi-row não mapeia `errno 1062`; rollback + 500 genérico, sem `data.conflitos`.
- **Evidências:** `server/utils/usuarios.ts:746-768` (o `criarUsuario` mapeia em `:458-463`). **Origem:** RL04-B-21 (só a criação).

#### RL05-FUN-05 · Resíduos do E2E do RL04 permanecem em `uploads/avatares/`
- **Severidade:** Baixa · **Módulo:** Uploads/ambiente
- **Obtido:** `p.png`, `evil.png` (73 B, corpo `<script>alert(document.domain)</script>` com magic PNG) e `real.png` gravados e servidos (`200 image/png`, inertes por `nosniff`+CSP). A alegação de limpeza do RL04 não se sustenta.
- **Evidências:** arquivos + `GET /uploads/avatares/p.png`.

#### RL05-FUN-06 · Lixo `7 x [Sucess] ` na 1ª linha de `app/pages/design.vue`
- **Severidade:** Baixa · **Módulo:** Vitrine `/design`
- **Obtido:** `app/pages/design.vue:1` = `7 x [Sucess] <script setup lang="ts">` (fora do bloco). Compila e `/design` responde 200 sem renderizar o texto (Vue SFC ignora o texto solto). Resíduo de edição.
- **Evidências:** bytes `37 20 78 20 5B 53 75 63 65 73 73 5D 20 …`; `GET /design` 200.

#### RL05-FUN-07 · Expurgo: 4 eventos com `LAST_EXECUTED=null`; TTL legado de 604 s em 158 sessões
- **Severidade:** Baixa (banco) · **Módulo:** Migrations/Expurgo
- **Obtido:** `ev_expurgo_*` `ENABLED`/`LAST_EXECUTED=null` (scheduler ON); expurgo efetivo depende do catch-up no boot; 158 sessões antigas (TTL 604 s) seguem como revogadas recentes.
- **Evidências:** `information_schema.EVENTS`; `migration/11:16-43`; `utils/expurgo.ts:12-29`; `plugins/migration.ts:13-14`. **Origem:** qa-banco RL04-M-16.

#### RL05-FUN-08 · `config-shell-cache` não é limpo no logout (residual do A-02)
- **Severidade:** Baixa · **Módulo:** Login/estado cliente
- **Obtido:** `limparEstadoSessao()` zera listas/KPIs/matriz/config-completa, mas não `config-shell-cache`, `usuarios-ordem`, `*-recarga-pendente`, `auditoria-ordem`, `logomarca-*`, `sidebar-*` (não restritos).
- **Evidências:** `app/composables/sessaoEstado.ts:13-40,43-95` × `useConfiguracoesGlobais.ts:72`; `useUsuarios.ts:193,195`; `useAuditoriaModelo.ts:125,127`.

#### RL05-FUN-09 · Buscas `LIKE '%termo%'` sem escapar `%`/`_`
- **Severidade:** Baixa · **Cenário:** `GET /api/usuarios?busca=%25` → retorna toda a base. **Evidências (E2E):** 3/3 usuários; `usuarios.ts:326-331`; `audit.ts:214-219`. (RL04-B-12/RL03-B-20 persiste.)

#### RL05-FUN-10 · `redirect` do guard não percent-encoded
- **Severidade:** Baixa · **Obtido (E2E):** `Location: /admin/login?redirect=/admin/gestao-usuarios` × spec `%2Fadmin%2F...`. Sem impacto funcional (`auth.global.ts:34-35`).

#### RL05-FUN-11 · Exportação limita silenciosamente a 10.000 linhas
- **Severidade:** Baixa · **Evidências:** `usuarios.ts:283,339-344`; `audit.ts:91,229-235`. (RL04 Etapa 4 — pendência declarada.)

### 3.3 Conflitos de documentação/spec (agente de documentação)

| ID | Conflito | Spec | Código |
| :--- | :--- | :--- | :--- |
| RL05-FUN-12 | Upload PNG+HTML | `uploads/spec.md:41-43` exige 400 | `uploads/index.post.ts:54-63` responde 200 e grava `.png` (spec `:45-47` permite extensão segura — contradição interna) |
| RL05-FUN-13 | Exclusão "irrestrita" | `gestao-usuarios/spec.md:477-479,501-503` | `usuarios.ts:555-568` → `409` no último admin (`perfis-acesso/spec.md:585-591` exige o 409) |
| RL05-FUN-14 | Catálogo RBAC incompleto | `autorizacao-rbac/spec.md:39-52` | existem `GET /api/usuarios/:id` e `GET /api/configuracoes/shell` fora do catálogo (shell nem consta do autoatendimento) |

### 3.4 Ambiente (banco)

#### RL05-FUN-15 · Usuário de banco da aplicação com `ALL PRIVILEGES`
- `SHOW GRANTS FOR 'zampier'@'%'` → `GRANT ALL PRIVILEGES ON *.* … WITH GRANT OPTION`; `root@localhost` idem. Confirma o achado do qa-banco.

---

## 4. Catálogo BDD

> Cada `#### Scenario` das specs funcionais e da vitrine → uma linha BDD (Dado/Quando/Então) com status. **PASS** (conforme), **FAIL** (divergente), **PARCIAL** (conforme com ressalva), **N/E** (não executável nesta rodada), **DOC** (conflito de doc).
> As 15 specs `design-system/*` (284 cenários visuais) são do qa-ux; aqui só o acoplamento funcional (uploads, data-table server-side, toasts, form-control-states).

### 4.1 `autorizacao-rbac` (12)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Permissão concedida prossegue | Sessão cujo perfil concede → chama rota → 200/201/204 | PASS |
| Permissão ausente responde 403 sem efeito | Perfil sem a ação → chama → 403 + nada alterado | PASS (código) |
| Sem sessão permanece 401 | Anônimo → rota de módulo → 401 | PASS (E2E) |
| Ação extra é exigida como as fixas | Sem `importar` → POST importar → 403 | PASS (código) |
| Leitor não executa escrita nem exclusão | Leitor → POST/PUT/DELETE usuários → 403 | N/E (sem conta) |
| Leitor não grava configurações nem perfis | Leitor → PUT config/permissões → 403 | N/E |
| Ação extra de importar é exigida | Perfil com criar, sem importar → importar → 403 | PASS (código) |
| Rota de e-mails exige visualizar | Sem `gestao-usuarios/visualizar` → `/emails` → 403 | PASS (código) |
| Meu Perfil acessível a qualquer perfil | Qualquer perfil → GET/PATCH `/eu` → autorizado por sessão | PASS (código) |
| Upload de avatar independe da matriz | Qualquer perfil → POST uploads avatares → aceito | PASS (código) |
| Portas públicas seguem abertas | Anônimo → `/api/auth/*`, identidade → 200 | PASS (E2E) |
| Helper responde pelas permissões | Sessão → `.can(modulo,acao)` → reflete a matriz | PASS (código) |

### 4.2 `uploads` (13)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Upload de logomarca | Sessão com `config/alterar` → imagem válida → 200 `url=/uploads/logomarcas/<n>` | PASS |
| Subpasta por finalidade | Sessão → imagem válida avatares → 200 `/uploads/avatares/<n>` | PASS |
| Destino não permitido | Sessão → `pasta=../fora` → 400, nada gravado | PASS (código) |
| Arquivo não-imagem | Sessão → `.txt` → 400 | PASS (código) |
| Conteúdo não-imagem declarando imagem | HTML com `Content-Type: image/png` → 400 | PASS (código) |
| **Conteúdo inicia imagem + payload, nome `.html`** | PNG+HTML → **spec 400**, obtido 200 `.png` | **FAIL (DOC)** — FUN-12 |
| Extensão executável | imagem real `.svg/.html` → 400 ou extensão segura | PASS (E2E) |
| Acima do limite | imagem >5 MB → 400 | PASS (código) |
| Sem arquivo | multipart sem `file` → 400 | PASS (código) |
| Acesso à URL | arquivo gravado → GET → imagem | PASS (E2E) |
| Arquivo em produção acessível | upload runtime → GET imediato → 200 | PASS |
| Servimento com nosniff | `/uploads/**` → GET → `nosniff` | PASS (E2E) |
| Nunca servido como documento | `/uploads/**` → GET → nunca `text/html` | PASS (E2E) |

### 4.3 `revogacao-sessao` (10)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Sessão válida segue | token válido → rota → autorizada | PASS (E2E) |
| Token revogado não autentica | access pré-logout → rota → 401 | PASS (E2E) |
| Hidratação recusa revogado | access pré-logout → `/auth/seguro` → 401 | PASS (E2E) |
| Troca de senha recusa revogado | access pré-logout → trocar-senha → 401 | PASS (código) |
| Refresh não renova revogada | refresh revogado → refresh → 401 | PASS (E2E reuso) |
| Cookie reutilizado após logout | access capturado → rota → 401 | PASS (E2E) |
| Desativado perde acesso imediato | sessão aberta → Inativo → 401 | PASS (código) |
| Desativação via edição geral revoga | `PUT /:id` Inativo → 401 + refresh não renova | PASS (código) |
| Reativar não reaviva o token | desativa+reativa → cookie antigo → 401 | PASS (código) |
| Excluído perde acesso imediato | exclui → token válido → 401 | PASS (código) |

### 4.4 `primeiro-acesso` (7)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Login com provisória sinaliza | `senha_provisoria=1` → login → sessão + flag | PASS (código) |
| Sessão restaurada mantém | provisória → F5 → continua provisória | PASS (código) |
| Rota admin negada | sessão provisória → `GET /api/usuarios` → 403 | PASS (código) |
| Rotas da troca acessíveis | provisória → trocar-senha/logout/refresh → processadas | PASS (código) |
| Fluxo completo | provisória → nova senha → libera admin | PASS (código) |
| Redirecionamento forçado | provisória → `/admin/**` → `/admin/primeiro-acesso` | PASS (código) |
| Troca inválida mantém | atual errada → confirma → erro + bloqueado | PASS (código) |

### 4.5 `pagina-404` (5)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Rota inexistente é substituída | anônimo → `/rota-inexistente` (Accept HTML) → 404 pt-BR | PASS (E2E) |
| Erro fora do shell | `/admin/**` inexistente → sem shell | PASS (E2E) |
| Identidade visual | erro renderizado → tipografia/cores/kit | PASS (UX) |
| Ação de retorno | página de erro → "Voltar ao início" + "Área Administrativa" | PASS (E2E) |
| Status preservado | rota inexistente → GET → 404 | PASS (E2E) |

### 4.6 `busca-cep` (9)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| CEP válido preenche | 01001-000 → busca → logradouro/bairro/cidade/UF/região, sem toast | PASS (código) |
| Número/complemento preservados | Nº 100 → busca OK → preservados | PASS (código) |
| Mesmo comportamento nos dois forms | Meu Perfil/Usuários → busca → mesmos valores + toast do módulo | PASS (código) |
| CEP incompleto não consulta | <8 dígitos → busca → aviso, sem request | PASS (código) |
| CEP inexistente | 8 dígitos inexistente → busca → toast de erro | PASS (código) |
| Falha de rede | timeout/inválida → busca → toast de erro | PASS (código) |
| Clique duplo | em voo → aciona → ignorado | PASS (código) |
| Tempo limite vira falha | sem resposta → timeout → aborta + toast | PASS (código) |
| Resposta parcial preserva | endereço digitado → resposta parcial → mantém | PASS (código) |

### 4.7 `gestao-usuarios` (115)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Rota renderiza com shell | sessão admin → abre → shell + título/tile | PASS (E2E 200) |
| Acesso direto por URL | sessão → F5 → lista da API | PASS (E2E) |
| Item da sidebar navega e ativa | sessão → clica → navega + ativo | PASS (código) |
| Item do menu da conta navega | sessão → clica → navega | PASS (código) |
| APIs sem sessão → 401 | anônimo → `/api/usuarios` etc. | PASS (E2E) |
| Rotas de auth acessíveis | anônimo → login/refresh/recuperação → respondem | PASS (E2E) |
| Com sessão as APIs operam | sessão → rotas → atendidas | PASS (E2E) |
| Base completa | sem filtro → GET → KPIs do banco | PASS (E2E 3/3) |
| Conjunto alterado recalcula KPIs | filtro → GET → KPIs filtrados | PASS (E2E Inativo=0) |
| Criar/editar recalcula KPIs | escrita → rebusca → KPIs novos | PASS (código) |
| Colunas e ordenação | abre → 5 colunas + paginação | PASS |
| Ordenar consulta servidor | aciona Nome → API reordena | PASS (E2E asc≠desc) |
| Badges de perfil/status | dados variados → badges distintas | PASS |
| Busca textual | digita → só contém o texto | PASS (E2E; ressalva FUN-09) |
| Usuário sem acesso | `ultimo_login` nulo → "-" | PASS (código) |
| Trocar linhas sem rolagem | ≥1280px → muda por página → sem scroll | PASS (UX) |
| Novo Usuário | clica → modal criação | PASS (código) |
| Importar na toolbar | tooltip → modal importação | PASS (código) |
| Filtros na toolbar | clica → modal filtros | PASS (código) |
| Convite abre o modal | `MailCheck` → modal com destinatário | PASS (código) |
| Excluir abre confirmação | `Trash2` → modal exclusão | PASS (código) |
| Bloquear confirma e alterna | linha Ativa → confirma → Inativo + KPI + toast | PASS (código) |
| Desbloquear devolve a Ativo | linha Inativa → confirma → Ativo + KPI + toast | PASS (código) |
| Confirmação descarta | modal → Cancelar/Esc/X → sem requisição | PASS (código) |
| Exportar em CSV | Relatórios > CSV → arquivo do conjunto | PASS (código) |
| Relação Completa | Relatórios > PDF → `usuarios.pdf` paisagem | PASS (código) |
| Ficha Cadastral | PDF → `ficha-cadastral.pdf` 1 página/usuário | PASS (código) |
| Sem diálogo de impressão | PDF → sem `window.print()` | PASS (código) |
| Abertura pelo botão Filtros | clica → Usuário/Perfil e Status | PASS (código) |
| Aplicar filtra e recalcula | escolhe perfil → Aplicar → tabela/KPIs/badge/CSV | PASS (código) |
| Perfil customizado no filtro | perfil Ativo → abre modal → lista | **PARCIAL** — FUN-01 (≤30 s) |
| Rascunho descartado | filtros aplicados → Cancelar → inalterado | PASS (código) |
| Limpar Filtros zera | 2 critérios → Limpar → zera + mantém aberto | PASS (código) |
| Limpeza pelo X do select | select preenchido → X + Aplicar → "todos" | PASS (código) |
| Badge só do estado aplicado | rascunho alterado → fecha → badge fixo | PASS (código) |
| Conjunto filtrado vazio | sem correspondência → Aplicar → vazio + KPIs 0 | PASS (E2E) |
| Recarga descarta filtros | filtros → F5 → base completa | PASS (código) |
| Abertura pelo Importar | clica → modal vazio | PASS (código) |
| Arquivo válido monta prévia | `.xlsx` modelo → linhas prontas marcadas | PASS (código) |
| Checkbox com nome acessível | AT percorre → nome por registro | PASS (UX) |
| Linhas com problemas | existente/repetido/perfil inválido → situações | PASS (código) |
| E-mail de outra página | base completa → arquivo → "já cadastrado" | PASS (E2E `/emails`) |
| Arquivo fora do modelo | cabeçalho divergente → erro, sem prévia | PASS (código) |
| Selecionar todos os prontos | checkbox mestre → marca/desmarca prontos | PASS (código) |
| Sem linhas de dados | cabeçalho válido, 0 linhas → mensagem | PASS (código) |
| Importar grava e fecha | n selecionados → Importar (n) → grava + toast | PASS (código) |
| Seleção zerada | nenhum → "Importar (0)" desabilitado | PASS (código) |
| Reimportar marca cadastrados | mesmo arquivo → linhas já cadastradas | PASS (código) |
| Conflito pela API refletido | corrida no commit → linhas "já cadastrado" | **PARCIAL** — FUN-04 (500) |
| Descarte por Cancelar | arquivo carregado → Cancelar → sem request | PASS (código) |
| Filtros preservados | filtros ativos → importa fora → intactos | PASS (código) |
| Recarga mantém importados | após importar → F5 → persistem | PASS (código) |
| Painel lista em voo | import em andamento → painel + contagem | PASS (código) |
| Falha devolve prévia | envio falha → painel some + erro | PASS (código) |
| Sucesso fecha com toast | API responde → encerra + fecha + toast | PASS (código) |
| Carga inicial do banco | abre → loading + 1ª página | PASS (E2E) |
| Falha na carga | falha → toast + KPIs/total/opções zerados | PASS (código) |
| Recarga rebusca | após escrita → F5 → persistem | PASS (código) |
| Filtro/exportação no servidor | filtra/exporta → 1 request por interação | PASS (código) |
| Exportação conjunto completo | CSV/PDF → conjunto completo | PASS (código; teto 10k → FUN-11) |
| Modo de criação | Novo Usuário → 3 blocos, sem datas | PASS (código) |
| Modo de edição | lápis → preenchido + Informações | PASS (código) |
| Máscara CEP/telefone/porta | digita → máscara + valor gravado | PASS (código) |
| Busca de CEP preenche | CEP válido → preenche, preserva Nº/Compl. | PASS (código) |
| Falha da busca | falha → toast "Gestão de Usuários" | PASS (código) |
| Avatar com câmera | captura → prévia + modal aberto | PASS (código) |
| Importação grava número vazio | sem endereço → `numero=''` | PASS (código) |
| Cadastro manual sem endereço | salva → `numero=''` | PASS (código) |
| Legado vazio limpo na migration | boot → `S/N`→vazio | PASS (migration 04) |
| S/N legítimo preservado | endereço preenchido → mantém S/N | PASS (migration 04) |
| E-mail duplicado | criação e-mail existente → erro no campo + foco | PASS (código) |
| Senha inválida na criação | <8/divergente → erro persistente | PASS (código) |
| Senha parcial na edição | 1 campo → erro no campo | PASS (código) |
| Formulário válido grava | válido → grava | PASS (código) |
| Criação reflete na listagem | cria → linha + KPI + toast | PASS (código) |
| Edição atualiza a linha | edita → linha nova + toast | PASS (código) |
| Senha provisória gravada | cria/edita → hash no banco, sem exibir | PASS (código) |
| Cancelar não altera | edita → Cancelar → sem request | PASS (código) |
| Recarga mantém alterações | grava → F5 → persistem | PASS (código) |
| Provedor sugere a porta | troca segurança → porta sugerida | PASS (código) |
| Teste com sucesso | 587 → Testar → Conectado | PASS (código) |
| Teste com falha | 250 → Testar → Falha | PASS (código) |
| Alterar bloco reseta | Conectado → altera → "Não testado" | PASS (código) |
| Envio de teste simulado | Conectado → Enviar teste → toast, sem request | PASS (código) |
| Abertura pelo ícone | `Trash2` → modal com nome/e-mail | PASS (código) |
| Confirmação remove | confirma → remove + KPI + toast | PASS (código) |
| Excluir última linha | único registro → página válida | PASS (código) |
| Descarte preserva | modal → Cancelar → nada muda | PASS (código) |
| Foco na busca | exclusão confirmada → foco na busca | PASS (código/UX) |
| **Exclusão é irrestrita** | qualquer perfil → confirma → **spec remove**, obtido 409 no último admin | **FAIL (DOC)** — FUN-13 |
| Recarga mantém exclusão | após excluir → F5 → não volta | PASS (código) |
| Abertura pela linha (convite) | `MailCheck` → 4 seções, e-mail, senha vazia | PASS (código) |
| WhatsApp sem telefone | sem telefone → desabilitado com dica | PASS (código) |
| Prévia acompanha o canal | troca canal → HTML ↔ texto | PASS (código) |
| Senha vazia bloqueia/gera | gera → habilita envio | PASS (código) |
| Redefinir antes do envio | gera → só grava ao enviar | PASS (código) |
| Convite cria a conta | e-mail novo → envia → cria + autentica | PASS (código) |
| Envio por E-mail | E-mail → envia → Resend + toast; falha mantém modal | PASS (código) |
| Envio por WhatsApp | telefone → envia → grava + abre app | PASS (código) |
| Fallback do WhatsApp | protocolo sem resposta → ~2 s → `wa.me` | PASS (código) |
| Descarte do rascunho | senha gerada → Cancelar → não grava | PASS (código) |
| Recarga mantém a conta | após convite → F5 → persiste | PASS (código) |
| Listagem não traz senha | GET lista → indicador, nunca valor | PASS (E2E) |
| Senha vazia preserva a existente | edição sem senha SMTP → mantém | PASS (código) |
| Nova senha cifrada | envia nova → cifrada, não volta | PASS (código) |
| Perfil customizado no modal | perfil Ativo → abre modal → lista | **PARCIAL** — FUN-01 |
| Perfil customizado na importação | planilha com perfil Ativo → válida | PASS (código) |
| Perfil Inativo não oferecido | perfil Inativo → ausente + "Linha inválida" | PASS (E2E só Ativos) |
| Falha na exportação | falha → toast | PASS (código) |
| Exportação com loading | aciona → loading | PASS (código) |
| Falha de carga genérica | carga falha → toast genérico | PASS (código) |
| Recarga durante carga | carga em voo → recarga pendente executa | PASS (código) |
| Campo de busca reflete termo | volta à lista → campo com o termo | PASS (código) |
| Corrida de unicidade | 2ª viola unicidade → 409 | PASS (código 1062) |
| Convite a Inativo | payload Inativo → 400 | PASS (código); ressalva FUN-02 (conta existente) |

### 4.8 `perfis-acesso` (84)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Renderização com shell | abre → shell + ShieldCheck #f5b302 | PASS (E2E 200) |
| Página fora do shell não se aplica | `/admin/**` → usa layout admin | PASS |
| Navegação pela sidebar | clica → navega + `aria-current` | PASS |
| Navegação pelo menu da conta | clica → navega + fecha | PASS |
| URL direta marca o item | abre direto → ativo | PASS |
| Carga inicial do banco | abre → 4 perfis 99/45/21/6 | PASS (E2E) |
| Falha na carga | falha → toast + vazio | PASS |
| Recarga preserva alterações | muta → F5 → API rebusca | PASS |
| Mutação reflete sem recarregar | muta → linha/KPIs imediatos | PASS |
| Base de demonstração | 4 perfis → 171/396 | PASS (dados) |
| Recalculo após mudança | muta → 5 KPIs | PASS |
| Filtro recalcula KPIs | filtra → só o conjunto | PASS |
| Abertura pelo botão Filtros | clica → Perfil/Status | PASS |
| Aplicar filtra e recalcula | filtra → tabela/KPIs/badge | PASS |
| Rascunho descartado | Cancelar → inalterado | PASS |
| Limpar Filtros zera | Limpar → zera + mantém aberto | PASS |
| Limpeza pelo X | X + Aplicar → "todos" | PASS |
| Badge só do aplicado | rascunho → fecha → fixo | PASS |
| Conjunto vazio | sem correspondência → 0/0 | PASS |
| Recarga descarta filtros | F5 → base completa | PASS |
| Exportar em CSV | CSV → `perfis.csv` `;` BOM | PASS |
| Relação de perfis PDF | PDF → `perfis.pdf` paisagem | PASS |
| Sem diálogo de impressão | PDF → sem print | PASS |
| Exporta conjunto filtrado | filtro → exporta → só o filtrado | PASS |
| Colunas e badges | base → 6 colunas + badges | PASS |
| Sem rolagem horizontal | ≥1280px → sem scroll | PASS (UX) |
| Busca textual | digita → filtra visual | PASS |
| Contagens derivadas | carregado → 99/45/21/6 + Administrador 3 | PASS (E2E) |
| Acompanha a base | cria/exclui usuário → contagem atualiza | PASS |
| Salvar matriz recalcula | salva → nova soma/99 | PASS |
| Permissões abre o modal | `KeyRound` → matriz | PASS |
| Abertura pela ação | abre → 4 abas + 9 ações + n/99 | PASS |
| Abas particionam módulos | troca aba → só a sessão; contador global | PASS |
| Interruptor só rascunho | liga/desliga → contador; base intacta | PASS |
| Chips editam extras | clica → rascunho; base intacta | PASS |
| Salvar via API | altera → grava + toast + fecha | PASS |
| Cancelar/Esc/X descartam | fecha → sem request | PASS |
| Recarga restaura | F5 → API reflete | PASS |
| Admin editável/novo configurável | abre → editável | PASS |
| Rodapé com cópias à esquerda | abre → ícones à esquerda | PASS |
| Importar substitui rascunho | "copiar de" → rascunho; base intacta | PASS |
| Descartar após importar | Cancelar → base intacta | PASS |
| Exportar grava no alvo | "copiar para" → alvo = salva + toast | PASS |
| Exportar usa a salva | rascunho alterado → dest recebe a salva | PASS |
| Seletor exclui o corrente | abre filho → sem o corrente | PASS |
| Nome vazio recusado | POST/PUT → 400 | PASS |
| Situação fora do enum | PUT → 400 | PASS |
| Perfil inexistente | PUT/DELETE/matriz id inválido → 404 | PASS |
| Módulo/ação desconhecida | PUT matriz → 400 | PASS |
| Exclusão com vínculos | DELETE perfil com usuários → 409 | PASS |
| Modo novo | Novo Perfil → sem datas, Ativo | PASS |
| Modo edição | Editar → preenchido + Informações | PASS |
| Nome obrigatório | salvar sem nome → erro | PASS |
| Salvar cria | válido → 0/99 + KPIs + toast | PASS |
| Edição preserva criado_em | edita → criado_em mantido | PASS |
| Situação 3 estados | Bloqueado → badge blocked | PASS |
| Descarte preserva | Cancelar → sem request | PASS |
| Gravação persiste | cria/edita → F5 → persiste | PASS |
| Abertura do modal (exclusão) | Excluir → modal sm nome/contagem | PASS |
| Confirmação bloqueada | com usuários → 409 + toast | PASS |
| Confirmação remove | sem usuários → remove + toast + foco | PASS |
| Descarte preserva | Cancelar → sem request | PASS |
| Excluir última linha | único → página válida | PASS |
| Exclusão irrestrita | sem vínculos → remove | PASS |
| Recarga mantém exclusão | F5 → não volta | PASS |
| Consistência doc ↔ tela | docs/07 → 99/45/21/6 e 171/396 | PASS (doc) |
| Escopo do modal declarado | docs/07 → fonte normativa | PASS (doc) |
| Conceder ação permite | matriz ganha → perfil passa a poder | PASS |
| Revogar ação nega | matriz perde → 403 | PASS |
| Retirar última administração | matriz essencial → 409 | PASS |
| Cópia que removeria última | "copiar para" → 409 | PASS |
| Alteração com outra administração | existe outra → 200 | PASS |
| Desativar último admin | único ativo → 409 | PASS (código) |
| Excluir último admin | único → 409 | PASS (código) |
| Mensagem do lockout | 409 → cliente exibe a mensagem | PASS (código) |
| Nome duplicado (criação) | POST → 409 | PASS |
| Nome duplicado (edição) | PUT → 409 | PASS |
| Usuário de perfil não-Ativo não loga | login → 403 aviso perfil | PASS |
| Perfil não-Ativo não atribuível | criar/editar/convite → 400 | PASS |
| Inativar perfil derruba sessões | Inativo → 401 + refresh 401 | PASS (código) |
| Omitir descrição não apaga | PUT só nome → mantida | PASS |
| Enviar descrição altera | PUT com descrição → atualiza | PASS |
| Falha na exportação | falha → toast | PASS |
| Falha sem detalhe interno | falha → mensagem genérica | PASS |

> Ressalva: cenários "Perfil customizado…" → RL05-FUN-01; "Inativar o perfil derruba as sessões" não cobre o lockout do perfil essencial → RL05-FUN-03.

### 4.9 `auditoria` (52)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Rota renderiza com shell | abre → shell + título | PASS (E2E 200) |
| Acesso direto por URL | F5 → registros da API | PASS (E2E) |
| Item da sidebar | clica → navega + ativo | PASS |
| Item do menu da conta | clica → navega | PASS |
| Sem filtros ativos | abre → total + última atividade | PASS (E2E 322) |
| Filtro de ação recalcula | `acao=Inclusão` → KPIs só Inclusão | PASS (E2E 58) |
| Período vira rótulo | datas → `dd/mm – dd/mm`; sem datas "Tudo" | PASS |
| Modal com cinco campos | Filtros → 5 campos + ações | PASS |
| Corpo em três sessões | abre → Período/Usuário/Ação e Recurso | PASS |
| Selecionar e aplicar | escolhe ação → Aplicar → filtra + badge | PASS (E2E) |
| Aplicar filtra tabela/KPIs | filtros → Aplicar → conjunto filtrado | PASS |
| Limpar restaura | filtros → Limpar → sem filtros | PASS |
| Cancelar descarta | altera → Cancelar → vigentes inalterados | PASS |
| Escape fecha primeiro o dropdown | popup → Esc → fecha popup; 2º Esc fecha modal | PASS (UX) |
| Colunas e ordenação | abre → 6 colunas, mais recente no topo | PASS (E2E) |
| Ordenar consulta servidor | aciona coluna → API reordena | PASS |
| Badge distinto por ação | tipos → badges; Acesso neutro | PASS |
| Busca textual | digita → só contém o texto | PASS (E2E) |
| Trocar linhas sem rolagem | ≥1280px → sem scroll | PASS (UX) |
| Filtro de ação oferece 5 tipos | abre → 5 opções | PASS |
| Abrir o detalhe | ver detalhes → modal "Dados do Registro" | PASS |
| Fechar o detalhe | X/Esc → fecha, tabela no estado | PASS |
| CSV respeita filtros | filtros → CSV → filtrados | PASS |
| PDF estruturado | PDF → `auditoria.pdf` paisagem | PASS |
| Sem logo, PDF só título | sem logo → sem imagem | PASS |
| PDF sem diálogo | PDF → sem print | PASS |
| Nota e navegação | página → nota + link Configurações | PASS |
| Carga inicial do banco | abre → overlay + 1ª página | PASS (E2E) |
| Loading no F5 sem parcial | F5 em voo → só overlay | PASS |
| Falha na carga | falha → toast + KPIs/total/opções zerados | PASS |
| Paginar consulta servidor | muda página/tamanho/ordem → API | PASS (E2E) |
| Recarga rebusca e descarta | filtros → F5 → vazio + API | PASS |
| Acesso sem sessão | anônimo → `/api/auditoria` → 401 | PASS (E2E) |
| Filtros por query param | `?acao=Inclusão&pagina=2&porPagina=20` → 2ª página | PASS (E2E) |
| Sem parâmetros | sem query → 1ª página + total | PASS (E2E) |
| Opções do não filtrado | filtro usuário → opções completas | PASS (E2E 29) |
| Ação desconhecida não quebra | `acao=X` → vazio | PASS |
| Criação gera Inclusão | POST usuários OK → registro | PASS |
| Exclusão/alteração geram | DELETE/PUT OK → registros | PASS |
| Gravação falhada não gera | escrita falha → nenhum registro | PASS |
| Falha no log não derruba | falha no log → resposta de sucesso | PASS |
| Recurso/tipo refletem | escrita → tipo + recurso corretos | PASS |
| Login registra Acesso | login OK → Acesso com id/nome | PASS (E2E) |
| Tentativa inválida não gera Acesso | login 401 → só log de segurança | PASS |
| Logout registra Acesso | logout com cookies → Acesso | PASS (E2E código) |
| Troca de senha registra | troca OK → Acesso | PASS |
| Recuperação nos dois caminhos | ativa + inexistente → `{ok:true}` + Acesso | PASS |
| IP da conexão | XFF forjado → IP da conexão | PASS |
| Falha na exportação | falha → toast | PASS |
| Falha de carga genérica | falha → toast genérico | PASS |
| Data inexistente | `2026-13-99`/`2026-02-30` → 400 | PASS (E2E) |
| Detalhe mostra a entidade | `entidade_id` → exibe | PASS (E2E API) |

### 4.10 `configuracoes-globais` (56)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Rota com shell | abre → shell + título | PASS (E2E 200) |
| Item da sidebar | clica → navega + ativo | PASS |
| Aba padrão | carrega → Logomarcas ativa | PASS |
| Troca de aba | seleciona → painel + pill | PASS |
| Cada aba exibe painel | seleciona → painéis reais | PASS |
| Upload armazena caminho | envia imagem → caminho + desabilitado + prévia | PASS |
| Logo salva recarrega | logo no banco → caminho desabilitado | PASS (E2E) |
| Limpar volta ao padrão | remove → vazio + Marca padrão | PASS |
| Campo vazio editável | sem arquivo → habilitado | PASS |
| Logo do header reflete | envia → AppHeader exibe | PASS (E2E shell) |
| Limpar restaura padrão | remove → ícone+nome | PASS |
| Logo sobrevive à troca de aba | troca aba → mantém | PASS |
| Barra com opção atenuada | Recolhida → outra `opacity-60` | PASS (UX) |
| Barra vale para o shell | marca Recolhida → sidebar recolhe | PASS |
| Preset em todas as sessões | marca preset → cartões coerentes | PASS |
| Escolha por sessão múltipla | desmarca Cadastros → estado misto | PASS |
| Sessões refletem na sidebar | marca/desmarca → expande/recolhe | PASS |
| Grupos independentes | altera barra → sessões inalteradas | PASS |
| Cartão marcado DS | marcado → verde lime | PASS (UX) |
| Cartão neutro | desmarcado → neutro | PASS (UX) |
| Checkbox acompanha variante | marcado → cor lime | PASS (UX) |
| Indicadores do servidor | aba Segurança → 5/15/120 | PASS (E2E) |
| Conta bloqueada status real | bloqueada → status/monitorando | PASS |
| Liberar destrava | bloqueada → Liberar → zera + login | PASS |
| E-mail inexistente liberável | 5 tentativas → libera + log | PASS |
| Cada falha gera evento | falhas → evento com tipo/tentativas | PASS (E2E) |
| Log somente leitura | observa → sem ações | PASS (UX) |
| Atualizar recarrega | clica → rebuscado | PASS |
| Rate limit persiste | altera + salva → F5 → gravado | PASS |
| Valor padrão | abre → 180 dias | PASS (dados: 550 atual) |
| Slider atualiza | move → sincroniza | PASS |
| Atalho move slider | 365 → slider 365 | PASS |
| Seleção única preservada | clica já selecionado → mantém | PASS |
| Subtítulo dinâmico | 365 → "mais de 365 dias" | PASS |
| Query dinâmica | 180 → `INTERVAL 180 DAY` | PASS |
| Botão inicia desabilitado | carrega → desabilitado | PASS |
| Alteração habilita | altera → habilitado | PASS |
| Liberar não habilita | Liberar → botão inalterado | PASS |
| Salvar confirma | salva → toast + desabilitado | PASS |
| Falha preserva | PUT falha → erro + habilitado | PASS |
| Estado persiste | salva → F5 → gravado | PASS |
| Reentrar sem F5 | salva/navega/volta → cache atualizado | PASS |
| Carregamento de espera | F5 em voo → loading | PASS |
| Hidratação | config gravada → painéis hidratados | PASS |
| Sidebar recolhida | salvo recolhida → abre recolhida | PASS |
| Primeira execução | sem customização → padrões | PASS |
| Falha não quebra | GET falha → padrões | PASS |
| Preferências em outra rota | F5 outra rota → logo + sidebar | PASS (E2E shell) |
| Preferências p/ não-admin | sem `config/visualizar` → shell aplica | PASS (código) |
| Hidratação não é alteração | carrega → Salvar desabilitado | PASS |
| Falha parcial | PUT 2 tabelas falha → rollback + erro | PASS |
| Expurgo fora da janela | evento executa → remove antigos | PARCIAL — FUN-07 |
| Janela acompanha config | altera retenção → próximo expurgo | PASS (DDL) |
| Liberar conta limpa | sem falhas → 200 | PASS |
| Liberar inexistente | id inválido → 404 | PASS |
| Falha de gravação genérica | salvar falha → toast genérico | PASS |

### 4.11 `login` (50)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Sem shell | anônimo → `/admin/login` → card sobre canvas | PASS (E2E 200) |
| Logada redireciona | sessão → 302 `/admin` | PASS (E2E) |
| Campos vazios | envia → erro no e-mail + foco | PASS |
| E-mail inválido | `abc` → erro no padrão | PASS |
| Digitar limpa erro | digita → erro sai | PASS |
| Credenciais corretas | Ana/Public@2026 → sessão + último acesso + `/admin` | PASS (E2E) |
| Senha errada/desconhecida | inválido → "E-mail ou senha inválidos." | PASS |
| Inativo bloqueado | Inativo → aviso próprio | PASS (código) |
| Lembrar-me | marcado → e-mail preenchido | PASS |
| Login com provisória | provisória → aceito + navega | PASS (código) |
| Bloqueio após falhas | 5 erros + correta → bloqueio temporário | PASS (código) |
| Bloqueio expira | janela passa → aceito + zera | PASS |
| E-mail inexistente bloqueia | 5 tentativas → 6ª → mesmo aviso | PASS |
| Resposta uniforme | existente/inexistente 5+1 → mesmos erros | PASS |
| Bloqueio expira (inexistente) | >15 min → erro genérico | PASS |
| Exceder limite | volume alto → 429 + toast | PASS (código; não executado) |
| Uso normal | volume normal → sem 429 | PASS (E2E) |
| XFF não contorna | varia header → IP real | PASS |
| F5 mantém acesso | F5 → restaurada | PASS (E2E) |
| Encerrar sessão | menu → revoga + login | PASS (E2E logout) |
| Sessão expirada renova | access expira → ação → refresh silencioso | PASS (código) |
| Sobrevive à janela do access | access expira → volta em 7 dias → renova | PASS (E2E TTL) |
| Token inválido/revogado | cookie inválido → sem sessão | PASS (E2E) |
| Reuso de refresh | refresh antigo → 401 | PASS (E2E) |
| Concorrência de refresh | 2 iguais simultâneos → 1 aceita, 1 401 | PASS (FOR UPDATE) |
| Sem sessão redireciona | `/admin/perfis-acesso` → 302 login?redirect | PASS (E2E; encoding FUN-10) |
| Login com redirect | `?redirect=` → rota pretendida | PASS |
| Área Pública anônima | `/` → renderiza | PASS (E2E) |
| Recuperação livre | `/admin/esqueci-senha` → renderiza | PASS |
| Logada recuperação→painel | sessão → 302 `/admin` | PASS (E2E) |
| Header reflete usuário | abre → nome/perfil/iniciais | PASS |
| Logomarca acompanha config | logo → `/admin/login` → logomarca/senão padrão | PASS (E2E) |
| Cabeçalho idêntico | esqueci-senha → mesma identidade | PASS |
| Envio cadastrado | ativa → sucesso genérico + e-mail | PASS (código) |
| Não cadastrado mesma aparência | inexistente → idêntico; sem e-mail | PASS (código) |
| Vazio/inválido bloqueia | inválido → erro + foco | PASS |
| Link leva à recuperação | clica → rota | PASS |
| Retorno ao login | retorno → login | PASS |
| Documento bate | docs/08 → coerente | PASS (doc) |
| Falha no envio preserva | envio falha → senha anterior válida | PASS |
| Envio ativa a provisória | entrega OK → provisória vale | PASS |
| Senha só muda depois | resposta imediata → troca após envio | PASS |
| Latências equivalentes | existente/inexistente → tempos equivalentes | PASS (código) |
| Responde antes de enviar | ativa → POST → resposta antes | PASS (`waitUntil`) |
| Host forjado | Host diferente → link `APP_URL` | PASS |
| Perfil inativo bloqueia | perfil Inativo → aviso + sem sessão | PASS |
| Novo login não vê anterior | logout+outro → módulos sem dados do anterior | PASS (residual FUN-08) |
| Estado recarregado | novo login → abre módulo → recarga | PASS |
| Detalhe envio OK | envio OK → "provisória enviada" | PASS |
| Detalhe falha | falha → indica falha | PASS |

### 4.12 `meu-perfil` (35)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Com sessão, shell | abre → shell + conteúdo | PASS (E2E 200) |
| Sem sessão, guarda | anônimo → login?redirect | PASS |
| Resumo reflete usuário | carrega → nome/status/perfil/último acesso | PASS (E2E) |
| Avatar sem foto | sem foto → iniciais | PASS |
| Avatar com foto | foto → imagem | PASS |
| Upload troca prévia | imagem → avatar + Salvar habilita | PASS |
| Câmera captura | captura → prévia + Salvar | PASS |
| Lápis só no hover | com foto → hover → visível | PASS (UX) |
| Lápis sempre visível | sem foto → sempre | PASS |
| Foto só ao salvar | troca → sai → mantém anterior | PASS |
| Abas canônicas | renderiza → Dados Pessoais ativa | PASS |
| Filete verde | qualquer aba → linha verde | PASS (UX) |
| Troca de aba | Endereço → painel | PASS |
| Nome vazio bloqueia | nome vazio → erro | PASS |
| Sem campo e-mail | inspeciona → sem e-mail | PASS |
| Cargo/Setor readonly | inspeciona → desabilitados | PASS |
| Senha atual incorreta | errada → erro do servidor | PASS |
| Confirmação divergente | diferem → "As senhas não conferem." | PASS |
| Senha nova curta | <8 → erro | PASS |
| Troca bem-sucedida | válidos → novo hash + toast | PASS |
| Campos espelham modal | Endereço → 8 campos | PASS |
| CEP preenche + habilita | CEP válido → preenche + Salvar | PASS |
| Falha busca | falha → toast "Meu Perfil" | PASS |
| Segurança sugere porta | seleciona → porta sugerida | PASS |
| Alterar zera status | Conectado → altera → "Não testado" | PASS |
| Teste porta válida | válida → Conectado | PASS |
| Salvar 3 abas | altera → 1 gravação + resumo | PASS |
| Salvar só após alteração | carrega/salva → desabilitado | PASS |
| Cancelar descarta | altera → volta ao registro | PASS |
| Documento bate | docs/09 → coerente | PASS (doc) |
| ViaCEP sem pendência | docs/09 → só RBAC | PASS (doc) |
| Leitura sem senha | GET/PATCH → sem senha | PASS (E2E) |
| Gravação preserva senha | salva sem senha SMTP → mantém | PASS |
| Falha com ação | GET falha → erro + tentar novamente | PASS |
| Tentar novamente | tenta → recarrega | PASS |

### 4.13 `migracoes-banco` (24)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Banco vazio | boot → 12 migrations | PASS (12/12) |
| Banco provisionado | boot → nenhuma reexecuta | PASS |
| Reexecução com objetos existentes | reexecuta → tolera idempotente | PASS |
| Boot repetido sem duplicar seeds | reinicia → sem duplicidade | PASS |
| Não destrutiva | dados presentes → nada removido | PASS |
| Base vazia provisionada | sem tabelas → schema completo | PASS |
| Registro após execução | migration OK → `_migrations` | PASS |
| Erro fatal não registra | erro não tolerado → não registra | PASS |
| Registro duplicado não aborta | corrida → tolerado | PASS |
| Migration nova respeita convenção | novo `.sql` → ordem correta | PASS |
| Statement inválido aborta | erro fora da lista → log + falha | PASS |
| Perfis e matriz | provisionado → 4 + 44 linhas 99/45/21/6 | PASS (E2E) |
| Configurações iniciais | provisionado → 1 `config_default` | PASS |
| Bootstrap cria admin | sem admin → cria + provisória | PASS |
| Admin existente intacto | existe → não modifica | PASS |
| Produção não cria admin | `NODE_ENV=production` → ignora | PASS |
| Acentuação preservada | acento → íntegro | PASS (E2E acentos) |
| Transação com falha | rollback → nada persiste | PASS |
| Build e boot produção | build → `.output/server/migration` presente | PASS (hook compilou; EPERM só no unlink final) |
| Outra instância | `DB_*` outro host → opera no alvo | PASS |
| Sem .env usa defaults | sem `DB_*` → defaults | PASS |
| Sessões expiradas/revogadas | evento → remove | PARCIAL — FUN-07 |
| Tokens vencidos | evento → remove | PASS (0 hoje) |
| Log de segurança antigo | evento → remove | PARCIAL — FUN-07 |

### 4.14 `vitrine` (10)

| Cenário | Dado → Quando → Então | Status |
| :--- | :--- | :--- |
| Seção 8 sem nativos | inspeciona → só kit | PASS |
| Demonstração funcional | preenche → toast no canto | PASS |
| Estreitas sem rolagem | 375/768/1024 → sem scroll | PASS (UX) |
| Cabeçalhos com badge | qualquer largura → `flex-wrap` | PASS (UX) |
| Larga sem regressão | 1440 → sem mudança | PASS (UX) |
| Cabeçalho 375px | 375 → sem corte | PASS (UX) |
| Cabeçalho largo | ≥1024 → uma linha | PASS (UX) |
| Demo de toast fiel | aciona → cor/ícone/rótulo fiéis | PASS (resíduo FUN-06) |
| Dica de upload | demo → sem "SVG" | PASS |
| Copiar HEX foco | foco → indicador visível | PASS (UX) |

---

## 5. Confirmação dos itens do RL04

| Item RL04 | Assunto | Estado na RL05 | Evidência |
| :--- | :--- | :--- | :--- |
| RL04-C-01 | XSS por upload `.html` | **CORRIGIDO** | E2E: `p.png`/`evil.png` → `image/png` + `nosniff` + CSP `sandbox`; extensão derivada do tipo real |
| RL04-A-01 | TTL do refresh (ms×s) | **CORRIGIDO** | novas sessões ≈ 604799 s (7 dias); `Set-Cookie` coerente (158 antigas com 604 s são pré-fix, revogadas) |
| RL04-A-02 | Estado no logout | **CORRIGIDO (núcleo)** | `limparEstadoSessao()` zera listas/KPIs/matriz/config; resíduo não-sensível → FUN-08 |
| RL04-M-01 | Desativação via PUT sem `token_version` | **CORRIGIDO (código)** | `usuarios.ts:539-541` + `revogarSessoesDoUsuario` |
| RL04-M-02 | Ordenação server-side no-op | **CORRIGIDO** | E2E asc≠desc; whitelist |
| RL04-M-03 | Shell p/ não-Administrador | **CORRIGIDO** | `GET /api/configuracoes/shell` (só sessão) → 200 sem vazar rate/retenção |
| RL04-M-04 | Cache de config não invalidado | **CORRIGIDO** | `atualizarCachesAposSalvar` chamado (`configuracoes-globais.vue:82`) |
| RL04-M-05 | Perfis Inativos oferecidos | **CORRIGIDO** | `opcoes.perfis` só Ativo (E2E) e `resolverPerfilId` recusa não-Ativo |
| RL04-M-06 | Mensagem do anti-lockout engolida | **CORRIGIDO** | `Permissoes.vue` usa `mensagemErro` (statusMessage) |
| RL04-M-07 | Timing da recuperação | **CORRIGIDO** | `esqueci-senha` responde antes do envio (`waitUntil`) |
| RL04-M-08 | KPIs/total/opções na falha | **CORRIGIDO** | `useUsuarios`/`useAuditoriaModelo` catch zeram tudo |
| RL04-B-15 | `entidade_id` ausente | **CORRIGIDO** | E2E: `entidadeId` na resposta |
| RL04-B-17 | Detalhe "enviada" em falha | **CORRIGIDO** | `esqueci-senha:81-85` reflete o desfecho |
| RL04-B-18 | Convite p/ Inativo | **PARCIAL / REABERTO** | payload validado; **conta existente não** → FUN-02 |
| RL04-B-19/B-20 | Busca/recarga | **CORRIGIDO** | `recargaPendente` + `busca` refletida |
| RL04-B-21 | 1062→409 | **CORRIGIDO (criação)** | `usuarios.ts:458-463`; **importação não** → FUN-04 |
| RL04-B-22 | Data inválida 400 | **CORRIGIDO** | E2E `2026-13-99`/`2026-02-30` → 400 |
| RL04-M-13 | Exportação 10k sem streaming | **PENDENTE** (fora do escopo decidido) | `TETO_EXPORTACAO=10000` |
| RL04-M-16 | Expurgo sem execução | **PENDENTE** | `LAST_EXECUTED=null` → FUN-07 |
| RL03-B-01 | Conflito spec de filtros | **CORRIGIDO** | spec `gestao-usuarios` com filtros no servidor |
| RL03-B-20 | Curingas LIKE | **PENDENTE** | E2E `?busca=%` → base inteira → FUN-09 |
| RL03-B-23 | Redirect não percent-encoded | **PENDENTE** | E2E `?redirect=/admin/...` → FUN-10 |

---

## 6. Escopos não aplicáveis

1. **Conteúdo público (Release Week, Manuais, Escopo)** — só placeholder `app/pages/index.vue`.
2. **Módulos da sidebar sem rota** — "Módulo em construção".
3. **Zod/safeError (`server/utils/validation.ts`)** — roadmap.
4. **Headers globais/CSRF dedicado** — roadmap declarado.
5. **Envio real de e-mail (Resend)** — validado por código, não exercido.
6. **Soft delete** — não previsto; exclusão física intencional.
7. **Busca FULLTEXT / exportação server-side / paginação de e-mails** — fora de escopo por decisão.
8. **Design-system (284 cenários visuais)** — qa-ux; aqui só o acoplamento funcional.
9. **Medições de UI em navegador** — RL01/qa-ux.

---

## 7. Limitações

- **Sem conta não-Administrador** (3 usuários, todos Administrador): RBAC por perfil verificado **estaticamente**, não em runtime (criar usuário seria escrita).
- **Sem POST/PUT/DELETE de dados**: convite a conta Inativa, inativação de perfil, importação concorrente e exclusão do último admin confirmados por **código**.
- **`npm run build`** não concluiu o unlink final (`EPERM` em `.output/.../bcrypt.node`) porque o **dev server estava no ar**; cliente e servidor **compilaram** (`built in 8.61s` / `Server built`) — `design.vue` sem erro. `npm run lint` e `npm run test` (7/7) verdes.
- `npm run typecheck` não reexecutado (RL04 registrou 0 erros).

---

## 8. Encerramento

As correções do RL04 **se sustentam** e o núcleo funcional está estável: fronteira Pública × Admin íntegra em runtime, RBAC por módulo coerente, XSS de upload neutralizado, TTL do refresh correto, estado de sessão limpo, ordenação/carga/exportação com o comportamento esperado. Não há Crítico nem Alto novo. Permanecem **3 Médios** (cache de opções sem invalidação; convite a conta Inativa existente; vetor de lockout ao inativar o perfil essencial), baixos e **3 conflitos spec×código** para o agente de documentação resolver. **Veredito: APROVADO COM RESSALVAS (risco Médio).**

Nenhum arquivo de código foi alterado por esta auditoria; nenhuma escrita de dados foi executada.
