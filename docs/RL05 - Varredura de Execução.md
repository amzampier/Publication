# RL05 — Varredura de Execução (E2E / Manual)

| Campo | Valor |
| :--- | :--- |
| **ID** | RL05-EXE |
| **Tipo** | Execução E2E/manual read-only contra o ambiente de desenvolvimento |
| **Base normativa** | `openspec/specs/**` (30 specs), `docs/qa/00`, `docs/qa/07`, `docs/01`, `docs/02` |
| **Data** | 17/10/2026 |
| **Alvo** | `http://localhost:3000` (dev server ativo) + MariaDB up (validado por queries reais nas rotas) |
| **Método** | Login real + `GET` reais (Node `fetch` e PowerShell `Invoke-WebRequest`); uploads negativos (rejeitados, nada gravado); rotação/reuso de refresh da própria sessão |
| **Credenciais** | `ana.carolina@empresa.com.br` (Administrador) — senha fornecida pelo orquestrador, não registrada |
| **Alterações de código** | **Nenhuma**. Nenhum `POST/PUT/DELETE` de dados persistentes de negócio. |
| **Veredito** | **APROVADO COM RESSALVAS** — 0 Críticos, 0 Altos; 1 Médio (código) + baixos/doc |
| **Risco** | **Baixo/Médio** |

> Esta varredura **executa** o sistema real e confirma os fluxos das specs. Não substitui a auditoria estática (`RL05 - Varredura Funcional.md`) nem os pareceres de segurança/UX/banco; eles permanecem válidos.

---

## 1. Resumo executivo

- **Ambiente confirmado:** dev server em `http://localhost:3000` respondendo (`/` → 200; `/design` → 200; `/admin/login` → 200; `/admin/esqueci-senha` → 200). MariaDB está **up** — foi exercitado por login, listagens, KPIs e trilha de auditoria reais.
- **Fronteira Área Pública × Área Administrativa íntegra em runtime:** sem sessão, **100%** das APIs administrativas testadas respondem `401` (inclusive `POST /api/usuarios` e `POST /api/uploads`); `/admin/**` responde `302 → /admin/login?redirect=…`; `/rota-inexistente` responde `404` com a página pt-BR própria; a única porta pública (`GET /api/configuracoes/identidade`) devolve **somente** `logo_login_url`.
- **Autenticação real OK:** login `200` com cookies `HttpOnly`; access `Max-Age=900` (15 min) e refresh `Max-Age=604800` (**7 dias**, confirmado); rotação de refresh `200` e **reuso do refresh rotacionado → 401**; sessão válida após a rotação.
- **RBAC/matriz e contagens:** matriz do Administrador `9/9` ações por módulo; perfis com `99/99`, `45/99`, `21/99`, `6/99` (Administrador/Editor/Revisor/Leitor) e `usuarios` derivados da base. Ordenação server-side de usuários e auditoria **asc ≠ desc** (parâmetro correto `ordenar`); coluna fora da whitelist é ignorada.
- **Uploads/XSS fechado:** destino `../fora` → `400`; HTML/SVG disfarçado de `image/png` (nome `.html`) → `400`; texto plano → `400`; nenhum arquivo gravado. Arquivo servido em `/uploads/**` responde `200 image/png` + `X-Content-Type-Options: nosniff`.
- **Meu Perfil/SMTP sem vazamento:** `GET /api/usuarios/eu` traz `smtp.senha: ""` com `temSenha:false` (nunca o valor em claro).
- **Ressalvas (nenhuma Crítica/Alta):** (1) convite a conta **Inativa existente** retorna sucesso mas **não reativa** a conta (o usuário continua sem autenticar); (2) lixo `7 x [Sucess] ` na 1ª linha de `app/pages/design.vue`; (3) `Location` do guard não percent-encoded; (4) busca `LIKE '%termo%'` sem escapar `%`/`_`; (5) com `Accept` não-HTML o 404 devolve a página padrão do Nuxt (EN) em vez da pt-BR (só com `Accept: text/html` a própria aparece).

### 1.1 Placar da execução

| Métrica | Valor |
| :--- | :--- |
| Verificações executadas | **53** |
| PASS | **53 / 53** (sem falha funcional nas executadas) |
| Crítica | 0 |
| Alta | 0 |
| Média | 1 (RL05-EXE-01, confirmada por código — não executável sem escrita) |
| Baixa / Melhoria | 4 (RL05-EXE-02 … 05) |
| Conflito doc/spec | 3 (RL05-EXE-06 … 08) |

---

## 2. Cobertura executada

| Eixo | Situação |
| :--- | :--- |
| Funcional | Executado — fluxos de leitura reais (login, shell, usuários, perfis, auditoria, configurações, meu perfil, uploads, 404) |
| Regressão | Executado — TTL do refresh/cookies, ordenação server-side, matriz RBAC, servimento de uploads |
| Permissões | Executado — fronteira anônima (401/302) e matriz do usuário logado; RBAC de Leitor **não executável** (sem conta no banco) |
| Banco | Executado por via indireta — KPIs, contagens e trilha vieram do MariaDB pelas APIs |
| UX | Executado parcial — título pt-BR do 404, shell das páginas administrativas (200) |
| Segurança | Executado — XSS por upload (rejeições), SQLi em `busca`/`acao`/`ordenar`, ausência de senha SMTP na API, `nosniff` |
| Performance | Executado pontual — paginação/limites do servidor; sem medição de carga |
| Fronteira Pública × Admin | Executado em runtime |
| Escopos não aplicáveis | RBAC de Leitor (sem conta), CRUD de escrita/convite (read-only), lockout/revogação por desativar (exigem escrita) |

---

## 3. Tabela de cenários executados (esperado × obtido)

| # | Cenário (spec) | Esperado | Obtido | Status | Evidência |
| ---: | :--- | :--- | :--- | :--- | :--- |
| 1 | Ambiente up (`/`, `/design`, `/admin/login`, `/admin/esqueci-senha`) | 200 | 200/200/200/200 | PASS | `ENV GET … -> 200` |
| 2 | API admin sem sessão | 401 | 401 em `/api/usuarios`, `/emails`, `/perfis`, `/auditoria`, `/configuracoes`, `/configuracoes/shell`, `/seguranca/estado`, `/usuarios/eu` | PASS | `ANON GET … -> 401` |
| 3 | Escrita sem sessão | 401 | `POST /api/usuarios` → 401; `POST /api/uploads` → 401 | PASS | `ANON POST … -> 401` |
| 4 | `/admin/**` sem sessão | 302 → login?redirect | 302, `Loc=/admin/login?redirect=/admin/gestao-usuarios` (idem perfis-acesso, meu-perfil) | PASS* | `ANON GET … -> 302` |
| 5 | Rota inexistente | 404 + página pt-BR | 404; com `Accept: text/html` → `<title>Página não encontrada | Publications</title>` | PASS | Node probe |
| 6 | Porta pública devolve só identidade | 200 `logo_login_url` | `{ "logo_login_url": "/uploads/logomarcas/LogoTeoremaCompletoTransparente-1.png" }` | PASS | `PUBLIC GET …` |
| 7 | Login credenciais corretas | 200 + sessão | 200 `{usuario:{…,perfil:"Administrador",provisoria:false}}` | PASS | `LOGIN -> 200` |
| 8 | Cookies HttpOnly e TTL | access ~15min, refresh 7d | `auth-token(Max-Age=900;httpOnly=true) auth-refresh(Max-Age=604800;httpOnly=true)` | PASS | `SET-COOKIE:` |
| 9 | Logada, `/admin/login` redireciona | 302 `/admin` | 302 `Loc=/admin` | PASS | `AUTH GET /admin/login` |
| 10 | `/admin/**` inexistente (logado) | 404 | 404 | PASS | `AUTH GET /admin/rota-inexistente -> 404` |
| 11 | Hidratação de sessão | 200 | 200 com o usuário correto | PASS | `GET /api/auth/seguro` |
| 12 | Lista de usuários + KPIs | do banco | 3 usuários, KPIs `{total:3,ativos:3,inativos:0,perfisDistintos:1}` | PASS | `GET /api/usuarios` |
| 13 | Ordenação server-side (nome) | asc ≠ desc | asc `Ana > Antonio > Fabiola`; desc `Fabiola > Antonio > Ana` | PASS | `?ordenar=nome` |
| 14 | Ordenação server-side (email) | asc ≠ desc | asc `amzampier@msn… > ana.carolina…`; desc inverso | PASS | `?ordenar=email` |
| 15 | Coluna fora da whitelist | ignorada (default) | `?ordenar=id;DROP TABLE usuarios` → 200, ordem default, sem efeito | PASS | `perfis/usuario` |
| 16 | Coluna de e-mails | 200 | 3 e-mails | PASS | `GET /api/usuarios/emails` |
| 17 | Perfis e matriz | 99/45/21/6 | Administrador 99/99, Editor 45/99, Revisor 21/99, Leitor 6/99 | PASS | `GET /api/perfis` |
| 18 | Contagem de usuários por perfil | derivada | Administrador=3, demais=0 | PASS | `GET /api/perfis` |
| 19 | Matriz do usuário logado | reflete perfil | 9/9 ações nos módulos (`manuais`, `release-week`, …) | PASS | `GET /api/usuarios/eu/permissoes` |
| 20 | Auditoria: lista + KPIs + entidade | do banco | `total=329`, kpis ok, `entidadeId` presente, mais recente no topo | PASS | `GET /api/auditoria` |
| 21 | Auditoria: filtro por ação | filtra | `?acao=Inclusão` → `total=58` | PASS | `GET /api/auditoria` |
| 22 | Auditoria: data inexistente | 400 | `?dataInicial=2026-13-99` → 400 | PASS | `GET /api/auditoria` |
| 23 | Auditoria: ordenação server-side | asc ≠ desc | `?ordenar=dataHora&direcao=asc` 1º `2026-10-15…`; desc 1º `2026-10-17…` | PASS | `GET /api/auditoria` |
| 24 | Configurações | 200 | hidrata retenção/logo/sidebar/rate limit | PASS | `GET /api/configuracoes` |
| 25 | Shell para qualquer sessão | 200 | `logo_header_url` + `sidebar_grupos` | PASS | `GET /api/configuracoes/shell` |
| 26 | Segurança: constantes do servidor | 5/15/120 | `{tentativas_max:5,janela_bloqueio_min:15,limite_requisicoes_minuto:120,rate_limit_ativo:true}` | PASS | `GET /api/seguranca/estado` |
| 27 | Meu Perfil sem senha SMTP | sem valor | `senha:""`, `smtp.temSenha:false` | PASS | `GET /api/usuarios/eu` |
| 28 | Páginas admin com sessão | 200 | `/admin`, gestão-usuarios, perfis-acesso, auditoria, configurações-globais, meu-perfil → 200 | PASS | `AUTH GET /admin…` |
| 29 | Rotação de refresh | 200 | 200 (novo refresh emitido) | PASS | `POST /api/auth/refresh` |
| 30 | Reuso de refresh rotacionado | 401 | 401 "Sessão inválida ou expirada" | PASS | `POST /api/auth/refresh` (antigo) |
| 31 | Sessão após rotação | 200 | 200 | PASS | `GET /api/auth/seguro` |
| 32 | Upload destino inválido | 400 | 400 (`../fora`) | PASS | `POST /api/uploads` |
| 33 | Upload HTML disfarçado de imagem | 400 | 400 (`<script>` como `image/png`, nome `.html`) | PASS | `POST /api/uploads` |
| 34 | Upload texto declarado imagem | 400 | 400 | PASS | `POST /api/uploads` |
| 35 | Servimento com `nosniff` | `nosniff` | `200 image/png` + `x-content-type-options: nosniff` | PASS | `GET /uploads/logomarcas/…png` |
| 36 | SQLi na busca de usuários | sem efeito | `?busca=' OR '1'='1` → 200, `total=0` | PASS | `GET /api/usuarios` |
| 37 | SQLi na ação da auditoria | sem efeito | `?acao=' OR 1=1--` → 200 | PASS | `GET /api/auditoria` |

\* `Location` sai sem percent-encoding (`/admin/login?redirect=/admin/gestao-usuarios`), divergindo do `%2F…` exemplificado na spec — sem impacto funcional (ver RL05-EXE-03).

---

## 4. Achados (bugs)

### RL05-EXE-01 — Convite a conta Inativa existente retorna sucesso mas não reativa a conta

- **Severidade:** Média (impacto funcional; sem bypass de fronteira nem perda de dados)
- **Módulo:** Convite × Gestão de Usuários
- **Cenário:** `POST /api/convite` para o e-mail de uma conta **Inativa**, com `situacao` omitido (default `Ativo`).
- **Resultado esperado (spec `gestao-usuarios`):** o convite só entrega credenciais a usuário Ativo; conta não-Ativa não deveria receber provisória que não autentica (`400`) — ou, se aceito, a conta deveria ser reativada para a credencial valer.
- **Resultado obtido:** a rota valida apenas `body.situacao`/situação do **perfil** e **nunca lê a `situacao` da conta**. O `UPDATE` do caminho find-or-create altera `hash_senha`, `senha_provisoria`, `tentativas_falhas`, `bloqueado_ate`, **mas não `situacao`**: devolve `200 { ok:true, criado:false }` e a conta **permanece Inativa**; o login segue `403 "Usuário inativo. Contate o administrador."`.
- **Passos para reprodução:** conta Inativa no banco → `POST /api/convite { email, senha, nome, perfil, situacao:"Ativo" }` → 200 → tentar login com a provisória → 403 Inativo.
- **Evidências (código):**
  - `server/api/convite/index.post.ts:51-54` (só lê `situacao` do payload, default `Ativo`)
  - `server/api/convite/index.post.ts:86-91` (recusa quando o **payload** não é Ativo)
  - `server/api/convite/index.post.ts:108-112` (`UPDATE … SET hash_senha=?, senha_provisoria=1, tentativas_falhas=0, bloqueado_ate=NULL WHERE id=?` — **sem `situacao`**)
  - `server/api/auth/login/index.post.ts:68-73` (Inativo → 403)
- **Não executado em runtime:** o banco atual **não possui conta Inativa** (3 usuários, todos Ativos) e criar uma violaria a regra read-only desta varredura. Confirmação feita por análise do caminho real de código.
- **Impacto:** o operador vê sucesso no convite enquanto o usuário convidado continua sem conseguir autenticar (credencial provisória inútil). Mesmo achado do `RL05-FUN-02`.
- **Origem:** RL04-B-18 / RL05-FUN-02 — confirmado.

### RL05-EXE-02 — Lixo `7 x [Sucess] ` na 1ª linha de `app/pages/design.vue`

- **Severidade:** Baixa
- **Módulo:** Vitrine `/design`
- **Cenário:** inspecionar o arquivo-fonte da vitrine.
- **Esperado:** SFC iniciando pelo bloco `<script setup>`.
- **Obtido:** `app/pages/design.vue:1` = `7 x [Sucess] <script setup lang="ts">` (texto solto antes do bloco). Compila e `/design` responde 200 (Vue ignora texto fora dos blocos), mas é resíduo de edição.
- **Passos:** abrir `app/pages/design.vue`, linha 1; `GET /design` → 200.
- **Evidências:** leitura da linha 1; `ENV GET /design -> 200`.
- **Impacto:** higiene de código; nenhum efeito visual detectado.
- **Origem:** RL05-FUN-06 — confirmado.

### RL05-EXE-03 — `Location` do guard não é percent-encoded

- **Severidade:** Baixa
- **Módulo:** Login/guarda global
- **Esperado (spec `login`):** `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`.
- **Obtido:** `Location: /admin/login?redirect=/admin/gestao-usuarios` (barras cruas).
- **Passos:** requisição anônima `GET /admin/gestao-usuarios` (sem seguir redirect) → inspecionar `Location`.
- **Evidências:** `ANON GET /admin/gestao-usuarios -> 302 Loc=/admin/login?redirect=/admin/gestao-usuarios`.
- **Impacto:** cosmético/baixo; o destino é preservado e o retorno funciona.
- **Origem:** RL05-FUN-10 — confirmado.

### RL05-EXE-04 — Busca `LIKE '%termo%'` sem escapar `%`/`_`

- **Severidade:** Baixa
- **Módulo:** Gestão de Usuários × Auditoria
- **Esperado:** o termo de busca é literário.
- **Obtido:** o curinga `%` não é escapado (`server/utils/usuarios.ts:326-331`, `server/utils/audit.ts:214-219`), então `?busca=%` retorna a base inteira. A tentativa de injeção (`' OR '1'='1`) **não** injeta (query parametrizada), apenas trata o texto como curinga.
- **Passos:** `GET /api/usuarios?busca=%25` / `?busca=%27OR%271%27=%271`.
- **Evidências:** `SQLI users busca -> 200 total=0` (texto literal); código: `LIKE ?` com `%${busca}%` sem escape.
- **Impacto:** filtro impreciso para termos com `%`/`_`; sem impacto de segurança.
- **Origem:** RL04-B-12 / RL05-FUN-09 — confirmado (parcialmente executado).

### RL05-EXE-05 — Página 404 própria depende de `Accept: text/html`; sem isso cai no erro padrão do framework

- **Severidade:** Baixa / Melhoria
- **Módulo:** Página 404
- **Esperado (spec `pagina-404`):** qualquer rota inexistente renderiza a página própria em pt-BR.
- **Obtido:** com `Accept: text/html` (navegador) → `404` + `<title>Página não encontrada | Publications</title>` (PASS). Com `Accept: */*` (fetch/`Invoke-WebRequest` padrão) → `404` com a página de erro **padrão do Nuxt em inglês** ("An error has occurred / Page not found").
- **Passos:** `GET /rota-inexistente` com e sem `Accept: text/html`.
- **Evidências:** probe Node — `PT-BR-SIM` só com `Accept: text/html`; `ENV /rota-inexistente -> 404` genérico caso contrário.
- **Impacto:** clientes não-browser (crawlers/ferramentas com `Accept: */*`) veem a página do framework; navegadores (caso da spec) veem a correta.
- **Observação:** o status 404 é sempre preservado (PASS no requisito de status).
- **Origem:** novo (não constava no RL05-FUN).

### RL05-EXE-06 — (Conflito doc/spec) Upload PNG+HTML: spec exige 400, código aceita e grava `.png`

- **Severidade:** Baixa (conflito de documentação; **segurança preservada**)
- **Módulo:** Uploads
- **Detalhe:** a spec `uploads` exige `400` para "conteúdo que inicia como imagem mas carrega payload executável (nome `.html`)"; o código valida só a assinatura inicial (`detectarTipoImagem`) e gravaria como `.png` (`server/api/uploads/index.post.ts:54-63`), respondendo 200. Como a extensão/tipo final derivam do tipo real e o servimento é `image/png` + `nosniff`, **não há XSS**.
- **Evidência:** rejeições executadas retornaram 400 (HTML disfarçado e texto); o caso "magic PNG + payload" **não foi persistido** para não deixar arquivo (read-only). Código citado.
- **Origem:** RL05-FUN-12 — mantido.

### RL05-EXE-07 — (Conflito doc/spec) Exclusão "irrestrita" × anti-lockout `409`

- **Severidade:** Baixa (conflito de documentação)
- **Detalhe:** `gestao-usuarios` diz exclusão irrestrita por papel; `perfis-acesso` exige `409` ao remover a última administração essencial. O código implementa o anti-lockout (`server/utils/usuarios.ts:555-568`).
- **Evidência:** não executado (exige escrita); conflito já registrado no RL05-FUN-13.
- **Origem:** RL05-FUN-13.

### RL05-EXE-08 — (Conflito doc/spec) Catálogo RBAC incompleto

- **Severidade:** Baixa (conflito de documentação)
- **Detalhe:** existem rotas administrativas fora do catálogo `autorizacao-rbac` (ex.: `GET /api/usuarios/:id`, `GET /api/configuracoes/shell`), esta última usada pelo shell para qualquer perfil só com sessão.
- **Evidência:** `GET /api/configuracoes/shell` → 200 para a sessão (autoatendimento implícito); catálogo da spec não a lista.
- **Origem:** RL05-FUN-14.

---

## 5. Confirmação dos itens conhecidos

| Item | Situação nesta execução | Evidência |
| :--- | :--- | :--- |
| (a) Convite a conta **Inativa** existente → sucesso sem reativar | **CONFIRMADO (código)** — não há conta Inativa no ambiente; reprodução de escrita não executada (read-only) | `convite/index.post.ts:51-54,86-91,108-112`; RL05-EXE-01 |
| (b) Lixo `7 x [Sucess] ` na 1ª linha de `design.vue` | **CONFIRMADO** | `app/pages/design.vue:1`; `/design` → 200 |
| (c) 42 checagens de API OK: XSS por upload fechado, TTL 7 dias, revogação por desativar/reativar, ordenação/detalhe/shell corretos, fronteira/RBAC do Leitor, sem SQLi | **CONFIRMADO** (53 verificações, 53 PASS) — com 3 ressalvas: TTL/refresh e reuso de refresh **executados**; revogação por desativar/reativar **confirmada por código** (exige escrita); RBAC de **Leitor** confirmado por código (não há conta Leitor no banco); ordenação/detalhe/shell **executados**; sem SQLi nas tentativas `busca`/`acao`/`ordenar` | seções 3 e 6 |

Detalhes executados de (c):

- **XSS por upload fechado:** destino inválido/HTML disfarçado/texto → 400 sem gravar; servimento `image/png` + `nosniff`.
- **TTL 7 dias:** `auth-refresh` `Max-Age=604800`.
- **Revogação (código):** `revogarSessoesDoUsuario`/`revogarAccessVigente` em `server/utils/auth.ts`; reuso de refresh rotacionado → `401` (executado).
- **Ordenação/detalhe/shell:** ordenação server-side `asc ≠ desc`; auditoria com `entidadeId`; `/api/configuracoes/shell` → 200.
- **Fronteira/RBAC do Leitor:** fronteira anônima 100% `401`/`302`; Leitor sem conta → validado por código (`requirePermission`).
- **Sem SQLi:** tentativas em `busca`, `acao` e `ordenar` retornaram `200` sem erro nem efeito.

---

## 6. Escopos não aplicáveis (e motivo)

| Escopo | Motivo |
| :--- | :--- |
| CRUD de usuários/perfis (criar/editar/excluir), importação, convite e bloqueio | Read-only: são `POST/PUT/DELETE` de dados persistentes; cobertos por análise estática no `RL05-FUN`. |
| RBAC de Leitor/Editor em runtime | Não existem contas desses perfis no banco de dev (3 usuários, todos Administrador). |
| Revogação por desativar/reativar e lockout de brute-force | Exigem escrita (desativar conta) e/ou 5 falhas de login; confirmados por código. |
| E-mail real (Resend) no convite/recuperação | Depende de provedor externo; não exercitado nesta varredura. |
| Performance sob carga | Fora do escopo desta varredura (sem ferramenta de carga). |
| UI visual fina (rolagem horizontal, hovers, toasts) | Pertence ao agente de UX. |

---

## 7. Dados de teste criados/removidos

- **Nenhum dado de negócio criado/alterado/removido** por esta varredura.
- Efeitos colaterais inerentes à autenticação: o login grava a trilha de auditoria (tipo `Acesso`, recurso `Autenticação`) e atualiza `ultimo_login`; a rotação de refresh revoga e cria linhas em `sessoes`. São registros operacionais normais, não dados de teste, e **não** foram revertidos (reverter a trilha de auditoria seria, ele próprio, uma escrita indevida).
- Uploads de teste foram **todos rejeitados (400)** — nenhum arquivo foi gravado. Confirmado: `uploads/avatares/` contém apenas `.gitkeep` e `avatar.jpg`; `uploads/logomarcas/` apenas os dois PNGs de logo esperados.
- Observação: os resíduos `p.png`/`evil.png` apontados no RL05-FUN-05 **não estão mais presentes** no diretório — limpos desde então.

---

## 8. Comandos e respostas (evidência bruta)

```
# Ambiente
GET / -> 200
GET /design -> 200
GET /admin/login -> 200
GET /admin/esqueci-senha -> 200

# Fronteira anônima
GET /api/usuarios          -> 401
GET /api/perfis            -> 401
GET /api/auditoria         -> 401
GET /api/configuracoes     -> 401
GET /api/configuracoes/shell -> 401
GET /api/seguranca/estado  -> 401
GET /api/usuarios/eu       -> 401
POST /api/usuarios         -> 401
POST /api/uploads          -> 401
GET /admin/gestao-usuarios -> 302 Loc=/admin/login?redirect=/admin/gestao-usuarios
GET /admin/perfis-acesso   -> 302 Loc=/admin/login?redirect=/admin/perfis-acesso
GET /admin/meu-perfil      -> 302 Loc=/admin/login?redirect=/admin/meu-perfil
GET /rota-inexistente      -> 404 (com Accept: text/html: "Página não encontrada | Publications")
GET /api/configuracoes/identidade -> 200 { "logo_login_url": "/uploads/logomarcas/LogoTeoremaCompletoTransparente-1.png" }

# Login + cookies
POST /api/auth/login -> 200 {usuario:{...,perfil:"Administrador",provisoria:false}}
SET-COOKIE: auth-token(Max-Age=900;httpOnly=true;secure=false) auth-refresh(Max-Age=604800;httpOnly=true;secure=false)

# Sessão autenticada
GET /api/auth/seguro            -> 200
GET /admin/login                -> 302 Loc=/admin
GET /admin/rota-inexistente     -> 404
GET /api/usuarios?porPagina=100 -> 200 KPIs {total:3,ativos:3,inativos:0,perfisDistintos:1}
GET /api/usuarios/emails        -> 200 ["amzampier@msn.com","amzampierandroid@gmail.com","ana.carolina@empresa.com.br"]
GET /api/usuarios/eu            -> 200 (senha:"", smtp.temSenha:false)
GET /api/usuarios/eu/permissoes -> 200 (9 ações/módulo)
GET /api/perfis                 -> 200 99/99, 45/99, 21/99, 6/99 (usuarios: 3/0/0/0)
GET /api/auditoria              -> 200 total=329, entidadeId presente
GET /api/configuracoes          -> 200
GET /api/configuracoes/shell    -> 200 logo_header_url=...png
GET /api/seguranca/estado       -> 200 {tentativas_max:5,janela_bloqueio_min:15,limite_requisicoes_minuto:120,rate_limit_ativo:true}
GET /admin, /admin/gestao-usuarios, /admin/perfis-acesso, /admin/auditoria, /admin/configuracoes-globais, /admin/meu-perfil -> 200

# Ordenação / filtros
GET /api/usuarios?ordenar=nome&direcao=asc  -> Ana > Antonio > Fabiola
GET /api/usuarios?ordenar=nome&direcao=desc -> Fabiola > Antonio > Ana
GET /api/usuarios?ordenar=email&direcao=asc -> amzampier@msn > amzampierandroid@gmail > ana.carolina@empresa
GET /api/usuarios?ordenar=id;DROP TABLE usuarios&direcao=desc -> 200 (default, sem efeito)
GET /api/auditoria?acao=Inclusão   -> 200 total=58
GET /api/auditoria?dataInicial=2026-13-99 -> 400
GET /api/auditoria?ordenar=dataHora&direcao=asc  -> 1º 2026-10-15T22:21:03Z
GET /api/auditoria?ordenar=dataHora&direcao=desc -> 1º 2026-10-17T21:10:55Z

# Segurança
GET /api/usuarios?busca=' OR '1'='1 -> 200 total=0
GET /api/auditoria?acao=' OR 1=1--  -> 200
POST /api/uploads (pasta=../fora)                          -> 400
POST /api/uploads (<script> como image/png, nome evil.html)-> 400
POST /api/uploads ("plain text" como image/png)            -> 400
GET /uploads/logomarcas/LogoTeoremaCompletoTransparente.png -> 200 ct=image/png x-content-type-options=nosniff

# Refresh
POST /api/auth/refresh (1ª rotação)        -> 200
POST /api/auth/refresh (refresh rotacionado)-> 401
GET /api/auth/seguro (após rotação)        -> 200
```

Scripts locais (temporários, fora do repositório): `%TEMP%\opencode\rl05-e2e.ps1`, `rl05-e2e.mjs`, `rl05-e2e2.mjs`, `rl05-e2e3.mjs`, `rl05-404.mjs`.

---

## 9. Conclusão

- **Nota:** **APROVADO COM RESSALVAS**.
- Nenhum bug **Crítico** ou **Alto** na execução; a fronteira Pública × Administrativa, o RBAC do usuário logado, a sessão (cookies/TTL/rotação/reuso), a ordenação server-side, o servimento seguro de uploads e a ausência de SQLi/SQLi passaram em runtime.
- Ressalvas remanescentes são **Médio/Baixo/Doc**: o convite a conta Inativa existente (RL05-EXE-01) e resíduos/conflitos de documentação (RL05-EXE-02…08).
- Próximo passo sugerido ao dono do código: reativar a conta no caminho find-or-create do convite (ou recusar conta não-Ativa), remover o lixo da linha 1 do `design.vue`, percent-encodar o `redirect` do guard e escapar `%`/`_` nas buscas.