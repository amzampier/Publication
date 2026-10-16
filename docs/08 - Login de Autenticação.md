# 08 - Login de Autenticação - Área Administrativa

**Versão:** 2.0.0 - **Data:** 2026-10-14 - **Idioma:** Português do Brasil (pt-BR)
**Escopo:** telas de autenticação da Área Administrativa com backend real (change
`auth-backend-resend`) - rotas `/admin/login` e `/admin/esqueci-senha` fora do shell,
formulários com os componentes do kit, autenticação contra o **banco** via API (bcrypt,
lockout e rate limit), sessão por cookies HttpOnly (access JWT + refresh rotativo),
recuperação de senha com envio **real** por e-mail (Resend), "Lembrar-me" do e-mail e
"Encerrar Sessão" que revoga a sessão no servidor
**Arquivos-fonte:** [`app/pages/admin/login.vue`](../app/pages/admin/login.vue) ·
[`app/pages/admin/esqueci-senha.vue`](../app/pages/admin/esqueci-senha.vue) ·
[`app/composables/useAuth.ts`](../app/composables/useAuth.ts) ·
[`app/composables/useApiFetch.ts`](../app/composables/useApiFetch.ts) ·
[`app/middleware/auth.global.ts`](../app/middleware/auth.global.ts) ·
[`server/api/auth/`](../server/api/auth) · [`server/utils/auth.ts`](../server/utils/auth.ts) ·
[`server/utils/mailer.ts`](../server/utils/mailer.ts) ·
[`shared/utils/emails.ts`](../shared/utils/emails.ts) ·
[`app/components/auth/`](../app/components/auth)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) - componentes do kit
usados (`UiInput`, `UiCheckbox`, `UiButton`, `useToast`) e tokens `brand.*` do canvas
**Autoridade de comportamento:** specs da capability `login` (`openspec/specs/login`)

> Este documento é a referência das telas `/admin/login` e `/admin/esqueci-senha` e de tudo
> que foi criado para elas - páginas, `useAuth`, middleware global de rotas, backend
> `/api/auth/**` e envio de e-mails via Resend. A Área Administrativa exige sessão real: sem
> login, qualquer rota `/admin/**` (exceto as telas de autenticação) redireciona para
> `/admin/login` (impacto direto no QA das telas administrativas - use as credenciais da §6).
> Toda alteração aqui deve manter as specs da capability `login` e a implementação coerentes.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Sessão real (cookies HttpOnly + refresh)](#3-sessão-real-cookies-httponly--refresh)
4. [Comportamento do formulário](#4-comportamento-do-formulário)
5. [Esqueci a senha (envio real por e-mail)](#5-esqueci-a-senha-envio-real-por-e-mail)
6. [Credenciais e contas](#6-credenciais-e-contas)
7. [Background e identidade](#7-background-e-identidade)
8. [Encerrar Sessão e bloco Account](#8-encerrar-sessão-e-bloco-account)
9. [Especificações OpenSpec](#9-especificações-openspec)
10. [Verificação](#10-verificação)
11. [Pendências e próximos passos](#11-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

O Login é a porta de entrada da Área Administrativa:

- **Rotas de autenticação:** `/admin/login` (`app/pages/admin/login.vue`),
  `/admin/esqueci-senha` (`app/pages/admin/esqueci-senha.vue`) e
  `/admin/primeiro-acesso` (`app/pages/admin/primeiro-acesso.vue`), todas com
  `definePageMeta({ layout: 'auth' })` - **não** herdam o shell (header + sidebar): são as
  rotas sob `/admin/**` sem shell, exceção formalizada em
  `design-system/layout-navigation` (spec `login`; `primeiro-acesso` na spec homônima). A
  composição canônica (fundo, card, identidade e divisor) e a hidratação da logomarca são dono
  do layout próprio `app/layouts/auth.vue` (change `auth-layout-logomarca-login`).
- **Modelo de dados:** real, no banco — credenciais em `usuarios` (`hash_senha` bcrypt,
  `ultimo_login`, `tentativas_falhas`/`bloqueado_ate`, `senha_provisoria`); sessões em
  `sessoes` (hash do refresh rotativo, `expira_em`, `revogado_em`). O login valida contra a
  tabela `usuarios` (e-mail exato case-insensitive + bcrypt + situação **Ativo**).
- **Identidade:** card branco centralizado sobre o canvas animado `AuthBackground`; o
  cabeçalho exibe a logomarca de Configurações > Logomarcas (`useLogomarcaLogin`) quando
  personalizada — ou a marca padrão do sistema (ícone `Building2` + "Publications") quando não
  — no lugar do título, com o subtítulo "Área Administrativa" abaixo. A logomarca é hidratada
  no carregamento da página pelo layout `auth` via **endpoint público mínimo**
  `GET /api/configuracoes/identidade` (retorna somente `logo_login_url` - o `GET /api/configuracoes`
  completo exige sessão e é bloqueado ao visitante anônimo por `server/middleware/auth-api.ts`),
  assim ela aparece também em acesso direto/F5/aba anônima, já no primeiro paint (SSR).

```
/qualquer rota
      |
      v
app/middleware/auth.global.ts  (async — consulta a API quando sem estado)
      |
      +-- Area Publica (/) .............................. livre
      +-- /admin/login
      |      |  sessão? --> redirect /admin
      |      v
      |   layout 'auth': GET /api/configuracoes/identidade (público) --> logo no card
      |   card: AuthLoginHeader + AuthLoginForm  (sobre AuthBackground)
      |      |  submit { email, senha, lembrar }
      |      v
      |   useAuth.entrar() --> POST /api/auth/login
      |      |  rate limit -> lockout -> bcrypt -> situacao
      |      +-- ok -------> cookies HttpOnly (access JWT + refresh) + estado --> /admin ou ?redirect=
      |      +-- erro -----> toast (401 generico / 403 inativo-ou-bloqueio / 429)
      |
      +-- /admin/esqueci-senha
      |      |  sessão? --> redirect /admin
      |      v
      |   layout 'auth' (mesma identidade hidratada)
      |   card: AuthLoginHeader + AuthForgotForm  (sobre AuthBackground)
      |      |  POST /api/auth/esqueci-senha  (resposta SEMPRE generica)
      |      v
      |   servidor: se a conta existir -> gera provisória, grava hash
      |             e ENVIA POR E-MAIL via Resend (senha nunca aparece na tela)
      |
      +-- /admin/primeiro-acesso .............. sessão provisória --> troca obrigatória da senha
      +-- /admin/** ........................... sem sessão --> /admin/login?redirect=...
      |                                          sessão provisória --> /admin/primeiro-acesso
```

## 2. Estrutura da página (componentização)

A composição canônica das telas de autenticação é dona do layout `app/layouts/auth.vue`
(change `auth-layout-logomarca-login`) - as páginas declaradas com `definePageMeta({ layout: 'auth' })`
são donas apenas do próprio formulário. O layout monta, de fora para dentro:

| Camada | Componente | Papel |
| :--- | :--- | :--- |
| Hidratação | layout (`<script setup>`) | `await carregarIdentidadeLogin()` - `GET /api/configuracoes/identidade` (**público**, retorna só `logo_login_url`; dispensa de sessão em `server/middleware/auth-api.ts`) preenche `useLogomarcaLogin` antes do primeiro paint; falha do GET mantém a marca padrão |
| Fundo | `AuthBackground` | canvas animado (`pointer-events-none`, `aria-hidden`), paleta brand (§7) |
| Container | layout | `flex` centralizado, `min-h-dvh`, `p-6` |
| Card | layout | `max-w-xs` (320px), branco, `rounded-xl`, `shadow-lg`, `p-8` |
| Cabeçalho | `AuthLoginHeader` | identidade centralizada — logomarca (`useLogomarcaLogin`: `preview \|\| caminho`) ou, sem personalização, a marca padrão (ícone `Building2` + "Publications", como no `AppHeader`) — e subtítulo "Área Administrativa" abaixo |
| Divisor | layout | linha `h-px` em `bg-brand-focus` (`#1a9e07`) com `role="separator"`, separando o cabeçalho do formulário |
| Formulário | página | `AuthLoginForm` em `/admin/login`: `UiInput` e-mail + `UiInput` senha (olho à direita alterna visibilidade) + `UiCheckbox` "Lembrar-me" (`size="sm"`, cinza) + "Esqueceu a senha?" + `UiButton` "Entrar no Portal" (`w-full`, `:loading`); `AuthForgotForm` em `/admin/esqueci-senha` (§5) |

A página `/admin/login` é dona do estado de `loading` e da navegação pós-login
(`aoSubmeter` — chama `await useAuth().entrar`); o `AuthLoginForm` é dono da validação de
campos e emite `submit`. A `/admin/esqueci-senha` reusa o mesmo layout trocando o formulário
por `AuthForgotForm` — ver §5.

**Adesão ao kit (componentes `app/components/auth/`):** inalterada em relação à fase 1
(`leftIcon`/`rightIcon` do `UiInput`, foco no primeiro campo inválido via `$el`, olho da
senha com `AlertCircle` priorizado no erro, `UiCheckbox size="sm"`, cookies de apoio em
`app/utils/cookies.ts` — hoje só `COOKIE_EMAIL_LEMBRADO`; o cookie fino `auth-sessao` da
fase 1 saiu de cena).

## 3. Sessão real (cookies HttpOnly + refresh)

### 3.1 Cookies (`server/utils/auth.ts`)

| Cookie | Conteúdo | Observação |
| :--- | :--- | :--- |
| `auth-token` (`__Host-auth-token` em produção) | access JWT (HS256, `AUTH_JWT_SECRET`, ~15 min) | `HttpOnly`, `SameSite=Lax`, `Path=/`; `Secure`+prefixo `__Host-` só em produção (dev é http) |
| `auth-refresh` (`__Host-auth-refresh` em produção) | refresh opaco (32 bytes) | mesmo `HttpOnly`; validade 7 dias; o **hash** (SHA-256) é o que vive em `sessoes` |

O cliente **não lê** nenhum dos dois (HttpOnly). `AUTH_ACCESS_TTL` (segundos) pode sobrescrever
o TTL do access em ambiente de teste.

### 3.2 Endpoints (`server/api/auth/*`)

| Rota | Papel |
| :--- | :--- |
| `POST /api/auth/login` | rate limit → lockout (5 falhas → bloqueio 15 min) → bcrypt → situação Ativo → zera falhas, grava `ultimo_login`, emite os dois cookies e devolve `{ usuario }` |
| `POST /api/auth/refresh` | rotaciona o refresh (transação: revoga o antigo e insere o novo hash) e reemite o access — o token anterior cai com `401` |
| `POST /api/auth/logout` | revoga a sessão (`revogado_em`) e limpa os cookies (idempotente) |
| `GET /api/auth/seguro` | hidratação da sessão (`{ usuario }` ou `401`); access expirado com refresh válido é **renovado no servidor** (rotação) — o F5 não dança refresh no cliente |
| `POST /api/auth/esqueci-senha` | recuperação por e-mail (§5) |
| `POST /api/auth/trocar-senha` | Meu Perfil > Segurança (bcrypt da senha atual + novo hash) |

### 3.3 `useAuth` e guarda (`app/composables/useAuth.ts`, `app/middleware/auth.global.ts`)

| Exposição | Papel |
| :--- | :--- |
| `usuario` (`useState('auth-usuario')`) | `{ id, nome, email, perfil }` do logado ou `null` (preenchido pelo login ou por `GET /api/auth/seguro`) |
| `entrar({ email, senha, lembrar })` | `POST /api/auth/login`; erros: 401 → toast genérico, 403 → aviso do servidor (inativo/bloqueada), 429 → muitas tentativas; devolve `boolean` |
| `sair()` | `POST /api/auth/logout` (best-effort) + limpa o estado |
| `ensureSessao()` (async) | com estado cacheado não chama a API; sem ele, `GET /api/auth/seguro` — no SSR via `useRequestFetch` (encaminha cookies), no cliente via `$fetch` com `credentials` |
| `sessaoInvalidada()` | derruba o estado local quando o auto-refresh definitivamente falha |
| `sanitizarRedirectAdmin(valor)` | só caminhos `/admin` sem `//` (anti open redirect) |

O `useApiFetch` implementa o **auto-refresh com single-flight** (docs/02 §5.2): num `401`,
todas as chamadas em voo compartilham a mesma promessa de `/api/auth/refresh` e refazem a
requisição uma vez; refresh falho → estado cai e o middleware redireciona.

**Guarda** (`auth.global.ts`, async): Área Pública livre; `/admin/login` e
`/admin/esqueci-senha` com sessão redirecionam para `/admin`; demais `/admin/**` exigem
sessão (`ensureSessao`) com redirect para `/admin/login?redirect=`.

## 4. Comportamento do formulário

- **Validação no cliente (antes de qualquer autenticação):** e-mail obrigatório
  ("Informe o e-mail.") e com formato válido ("Informe um e-mail válido."); senha obrigatória
  ("Informe a senha."). Erros usam o padrão do design system (`error` no controle: recorte
  `rose-700`, ícone `AlertCircle` com tooltip e região viva `role="alert"`) e o foco vai ao
  **primeiro** campo inválido; digitar limpa o erro do campo.
- **Autenticação (`useAuth.entrar` → `POST /api/auth/login`):** e-mail exato
  (case-insensitive) + senha conferida com **bcrypt** contra `hash_senha` + situação
  **Ativo**, no banco.
  - Erro de credencial (e-mail inexistente ou senha errada) → toast **danger** único e
    genérico: "E-mail ou senha inválidos." (não revela se o e-mail existe);
  - status **Inativo** → toast **warning**: "Usuário inativo. Contate o administrador.";
  - conta **bloqueada** (5 falhas consecutivas, janela de 15 min) → toast warning com os
    minutos restantes, mesmo com a senha correta;
  - `429` (rate limit por IP, configurado em `configuracoes_limite_requisicao`) → toast de
    muitas tentativas;
  - sucesso → `ultimo_login` atualizado no banco, cookies emitidos, "Lembrar-me" aplicado
    (cookie fino de e-mail no cliente) e navegação para o `?redirect=` sanitizado ou `/admin`.
- **Loading:** o botão "Entrar no Portal" mostra o spinner do `UiButton` (`:loading`); nova
  submissão é ignorada enquanto `loading` está ativo.
- **"Esqueceu a senha?":** navega para `/admin/esqueci-senha` (fluxo da §5).

## 5. Esqueci a senha (envio real por e-mail)

- **Rota:** `/admin/esqueci-senha` — composição idêntica ao login; corpo = `AuthForgotForm`.
- **Estados do card:**
  - *Formulário:* "Recuperar Acesso ao Portal", `UiInput` e mesma validação do login e
    `UiButton` "Enviar link" com `:loading`; link "Voltar ao login".
  - *Sucesso (genérico):* selo `MailCheck`, título "Verifique seu e-mail" e o texto "Se o
    e-mail informado estiver cadastrado no sistema, enviamos as instruções de recuperação
    com a senha provisória — mesma resposta para qualquer e-mail." **Nenhuma senha aparece
    na tela**; botão "Voltar ao login" e link "Enviar para outro e-mail".
- **Servidor (`POST /api/auth/esqueci-senha`):** resposta **sempre `{ ok: true }`** com o
  mesmo corpo — para e-mail cadastrado e não cadastrado a aparência é idêntica (nenhuma
  mensagem ou sinal indica existência; anti-enumeração; o caminho sem conta executa trabalho
  bcrypt equivalente, sem diferença de tempo). Quando a conta existe e está Ativa, o servidor:
  gera a senha provisória (régua do `shared/utils/emails` — ≥8 com maiúscula, minúscula, número
  e símbolo, por **CSPRNG**), **envia por e-mail via Resend** (template
  `renderHtmlRecuperacao`/`renderTextoRecuperacao` com a senha e o link de acesso) e **somente
  após o envio bem-sucedido** grava o `hash_senha` (bcrypt) com `senha_provisoria = 1` — falha
  do provedor mantém a senha anterior válida. Os links de acesso usam a origem configurada
  (`APP_URL`), não o `Host` recebido (change `endurecer-sessao-segredos-e-uploads`).
- **Login com a provisória:** a senha recebida autentica normalmente; a anterior deixa de
  valer. Como a conta fica marcada com **senha provisória**, o acesso administrativo é
  bloqueado (`403`) até a troca e o usuário é conduzido à tela **`/admin/primeiro-acesso`**
  (capability `primeiro-acesso`, change `endurecer-banco-e-bootstrap`).
- **Guarda/retorno:** rota livre sem sessão; com sessão redireciona para `/admin`;
  "Voltar ao login" navega para `/admin/login`.

## 6. Credenciais e contas

> **QA e demonstração:** com o backend real, **apenas as contas existentes no banco**
> autenticam. Por decisão da change `auth-backend-resend` **não há seed dos 16 usuários
> demo** da fase 1: contas novas nascem pelo **convite da Gestão de Usuários**
> (`POST /api/convite`, find-or-create — spec `gestao-usuarios`), que materializa a conta
> (hash da provisória) e envia o e-mail real.
>
> **Administrador provisionado** (`server/utils/bootstrap-admin.ts`): criado automaticamente
> **apenas em ambiente de demonstração/desenvolvimento** (`NODE_ENV !== 'production'`) e com
> **senha provisória** — em produção nenhum administrador é criado (change
> `endurecer-banco-e-bootstrap`). Contas com **senha provisória** (provisionadas, convidadas
> ou recuperadas) só liberam a Área Administrativa depois da troca em `/admin/primeiro-acesso`;
> contas com senha definitiva já vigente entram direto.
>
> **`ana.carolina@empresa.com.br`** / **`Public@2026`**

| Exercício | Credencial | Resultado esperado |
| :--- | :--- | :--- |
| Login completo (Administrador, senha definitiva) | `ana.carolina@empresa.com.br` / senha vigente | entra em `/admin`; header mostra "Ana Carolina Ribeiro / Administrador" |
| Primeiro acesso (senha provisória) | conta recém-provisionada/convite/recuperação | login aceito, porém o acesso fica bloqueado (`403`) até a troca em `/admin/primeiro-acesso` |
| Conta inexistente no banco | qualquer e-mail sem cadastro | toast genérico "E-mail ou senha inválidos." |
| Senha errada | admin + senha errada | mesmo toast genérico |
| Bloqueio por tentativas | 5 senhas erradas seguidas | 6ª tentativa (mesmo correta) → aviso de conta bloqueada temporariamente (15 min) |
| Recuperação | `/admin/esqueci-senha` com e-mail cadastrado | e-mail real com senha provisória; a provisória autentica e força a troca em `/admin/primeiro-acesso` |
| Convite | Gestão de Usuários → `MailCheck` → "Enviar Convite" | conta criada no banco + e-mail real; a provisória do convite autentica e força a troca |

## 7. Background e identidade

`AuthBackground` (`app/components/auth/Background.vue`) mantém a estrutura (gradiente +
campo de pontos + anéis animados com sprites, `prefers-reduced-motion`, pausa por
`visibilitychange`, resize com DPR) e a paleta brand:

| Elemento | Cor |
| :--- | :--- |
| Gradiente de fundo | `#0b1330` → `#070d22` → `#040814` (escala navy derivada de `brand.primary` `#112051`) |
| Paleta dos anéis/pontos | `#0364f7` (`brand.structure`), `#50a1ff`, `#4ed813` (`brand.accent`), `#1a9e07` (`brand.focus`), `#0364f7` |

**Onda no fundo:** cada anel emite uma onda sonar a cada 1,4-2,2 s; a onda desloca e acende
o campo de pontos conforme avança (`ONDA_LARGURA = 48 px`, `ONDA_FORCA = 10`);
`prefers-reduced-motion` congela tudo.

## 8. Encerrar Sessão e bloco Account

- **Encerrar Sessão** (item fixo do menu da conta, `AppHeader`): `await useAuth.sair()` —
  a chamada `POST /api/auth/logout` **é aguardada** antes de navegar (navegar primeiro
  cancelaria o fetch e a sessão viveria no servidor) —, fecha o menu e vai para
  `/admin/login`. O logout revoga a sessão no servidor: além do refresh, incrementa a
  **versão da sessão** da conta (`usuarios.token_version`), de modo que o cookie de acesso
  em uso deixa de autenticar imediatamente (capability `revogacao-sessao`, change
  `endurecer-sessao-segredos-e-uploads`).
- **Bloco Account:** nome, perfil e iniciais derivam de `useAuth().usuario` (hidratado pelo
  login ou por `GET /api/auth/seguro`), com fallback no valor fixo `conta` de
  `app/config/navigation.ts`. A ordem do menu segue governada por
  `design-system/layout-navigation`.

## 9. Especificações OpenSpec

- **`openspec/changes/archive/2026-10-09-login-administrativo`** (arquivada — originou a
  spec `login`): capability `login` (rota/composição, validação, autenticação fake, sessão
  por cookie fino, guarda, identidade) + exceção de shell em `design-system/layout-navigation`.
- **`openspec/changes/archive/2026-10-XX-esqueci-senha`** (arquivada): `login` MODIFIED/ADDED
  (link "Esqueceu a senha?", guarda da rota, autenticação com senha vigente, requirement da
  página `/admin/esqueci-senha`).
- **`openspec/changes/auth-backend-resend`** (change desta versão):

  | Capability | Operação |
  | :--- | :--- |
  | `login` | **REMOVED** autenticação fase 1/sessão fake/exibição da senha na tela + **ADDED** autenticação no banco via API, sessão HttpOnly com refresh rotativo, recuperação por e-mail, lockout de tentativas, rate limit `429` + **MODIFIED** `docs/08` |
  | `meu-perfil` | **MODIFIED** aba Segurança: troca de senha via API (bcrypt no servidor) |
  | `gestao-usuarios` | **MODIFIED/REMOVED/ADDED** convite real via Resend com find-or-create da conta (só o convite usa rede na tela) |

## 10. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório) e
  `openspec validate "auth-backend-resend" --strict`.
- Bateria de API (curl/script): login 200 + cookies HttpOnly + `ultimo_login`; 401 genérico
  idêntico para senha errada × e-mail inexistente; 403 inativo e 403 bloqueio (5 falhas →
  15 min); `refresh` rotaciona (antigo → `401`); `logout` revoga; `seguro` renova access
  expirado com só o refresh; `esqueci-senha` sempre 200 com corpo idêntico (hash trocado +
  provisória quando cadastrado); `trocar-senha` 400/200; `convite` 401 sem sessão,
  find-or-create (conta nova autentica; reconvite substitui hash; whatsapp só grava); `429`
  no estouro do rate limit.
- Fluxo manual no dev server: login/logout/F5/redirect `?redirect=`; expiração curta
  (`AUTH_ACCESS_TTL`) cobrindo o auto-refresh single-flight; `/admin/esqueci-senha` com
  estado genérico e senha chegando por e-mail; convite real pela Gestão de Usuários;
  Meu Perfil > Segurança (senha errada no campo, troca reflete no login); Área Pública livre.

## 11. Pendências e próximos passos

- **Proteção das demais APIs:** as rotas `/api/**` exigem sessão via `server/middleware/auth-api.ts` e a **autorização por módulo já é aplicada** por `requirePermission(event, modulo, acao)` (change `rbac-require-permission`); o cliente dispõe de `usePermissions().can()`.
- **Auditoria de login:** **implementada** — `server/utils/audit.ts` grava eventos tipo `Acesso` (login, logout, troca e recuperação de senha) na tabela `auditoria` (change `auditoria-backend-integracao`).
- **RBAC no cliente:** **implementado** — `usePermissions().can(modulo, acao)` deriva a matriz do próprio usuário via `GET /api/usuarios/eu/permissoes`.
- **Rate limit global:** o contador em memória já lê `configuracoes_limite_requisicao` e honra o status `ativo`; estendê-lo às demais rotas permanece como melhoria.
- **Lockout por conta (risco aceito — MEL-03):** cinco falhas bloqueiam a conta por 15 min, o que permite a um terceiro negar acesso a um usuário legítimo (negação por conveniência). Mantido como risco aceito nesta fase; mitigação futura: backoff progressivo/feedback por IP confiável.
- **Página de redefinição por token:** fluxo com link único em `tokens_acesso`
  (tipo `recuperacao`, com expiração) substituindo a provisória por e-mail — mais seguro
  (o token não viaja no corpo do e-mail como senha).
- **Timing do esqueci-senha:** a resposta é idêntica em conteúdo, mas a latência difere
  (bcrypt + Resend só quando a conta existe) — envio assíncrono padronizaria.
- **`configuracoes_limite_requisicao` como fonte única** já é usada pelo rate limit de
  auth; o "Aba Segurança" de Configurações Globais (UI de edição) segue pendente.
