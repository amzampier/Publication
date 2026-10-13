# 08 - Login de Autenticação - Área Administrativa

**Versão:** 1.1.0 - **Data:** 2026-10-09 - **Idioma:** Português do Brasil (pt-BR)
**Escopo:** telas de autenticação da Área Administrativa em fase 1 (fake, 100% frontend, sem
backend) - rotas `/admin/login` e `/admin/esqueci-senha` fora do shell, formulários com os
componentes do kit, autenticação contra a base de demonstração (`useUsuariosDemo`) com senha
vigente por registro, fluxo "Esqueci a senha" com geração de senha provisória, sessão fake
persistida por cookie fino que sobrevive a F5, guarda global das rotas `/admin/**` com redirect
da rota pretendida, "Lembrar-me" do e-mail e "Encerrar Sessão" no menu da conta
**Arquivos-fonte:** [`app/pages/admin/login.vue`](../app/pages/admin/login.vue) -
[`app/pages/admin/esqueci-senha.vue`](../app/pages/admin/esqueci-senha.vue) -
[`app/composables/useAuth.ts`](../app/composables/useAuth.ts) -
[`app/middleware/auth.global.ts`](../app/middleware/auth.global.ts) -
[`app/utils/cookies.ts`](../app/utils/cookies.ts) -
[`app/components/auth/`](../app/components/auth)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) - componentes do kit
usados (`UiInput`, `UiCheckbox`, `UiButton`, `useToast`) e tokens `brand.*` do canvas
**Autoridade de comportamento:** specs da capability `login` (`openspec/specs/login`)

> Este documento é a referência das telas `/admin/login` e `/admin/esqueci-senha` e de tudo o que
> foi criado para elas - páginas, `useAuth`, middleware global de rotas e constantes de cookie.
> A partir da change `login-administrativo` a Área Administrativa exige sessão: sem login, qualquer
> rota `/admin/**` (exceto as telas de autenticação) redireciona para `/admin/login` (impacto
> direto no QA das telas administrativas - use as credenciais da §6). Toda alteração aqui deve
> manter as specs da capability `login` e a implementação coerentes.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Sessão fake e guarda de rotas](#3-sessão-fake-e-guarda-de-rotas)
4. [Comportamento do formulário](#4-comportamento-do-formulário)
5. [Esqueci a senha (fluxo de recuperação)](#5-esqueci-a-senha-fluxo-de-recuperação)
6. [Credenciais de demonstração](#6-credenciais-de-demonstração)
7. [Background e identidade](#7-background-e-identidade)
8. [Encerrar Sessão e bloco Account](#8-encerrar-sessão-e-bloco-account)
9. [Especificações OpenSpec](#9-especificações-openspec)
10. [Verificação](#10-verificação)
11. [Pendências e próximos passos](#11-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

O Login é a porta de entrada da Área Administrativa:

- **Rotas de autenticação:** `/admin/login` (`app/pages/admin/login.vue`) e
  `/admin/esqueci-senha` (`app/pages/admin/esqueci-senha.vue`), ambas com
  `definePageMeta({ layout: false })` - **não** herdam o shell (header + sidebar): são as
  **únicas** rotas sob `/admin/**` sem shell, exceção formalizada no delta de
  `design-system/layout-navigation` (spec `login`).
- **Modelo de dados:** fase 1 em memória - as credenciais vêm da base `useUsuariosDemo`, em que
  cada registro tem uma senha vigente (`SENHA_DEMO = 'Public@2026'` por padrão, ou a senha
  provisória gravada pelo fluxo da §5); a sessão guarda apenas o **id** do usuário em cookie
  (`docs/02` §3.4 prevê o destino real: JWT + cookie HttpOnly).
- **Identidade:** card branco centralizado sobre o canvas animado `AuthBackground`; o
  cabeçalho exibe a logomarca de Configurações > Logomarcas (`useLogomarcaLogin`) quando
  personalizada — ou a marca padrão do sistema (ícone `Building2` + "Publications") quando não —
  no lugar do título, com o subtítulo "Área Administrativa" abaixo.

```
/qualquer rota
      |
      v
app/middleware/auth.global.ts
      |
      +-- Area Publica (/) .............................. livre
      +-- /admin/login
      |      |  logado? --> redirect /admin
      |      v
      |   card: AuthLoginHeader + AuthLoginForm  (sobre AuthBackground)
      |      |  submit { email, senha, lembrar }
      |      v
      |   useAuth.entrar()  -- valida contra useUsuariosDemo
      |      +-- ok -------> sessao (cookie + estado) --> /admin ou ?redirect=
      |      +-- erro -----> toast (generico / inativo)
      |
      +-- /admin/esqueci-senha
      |      |  logado? --> redirect /admin
      |      v
      |   card: AuthLoginHeader + AuthForgotForm  (sobre AuthBackground)
      |      |  envio simulado --> senha provisória gerada (exibida no card)
      |      v
      |   base demo: senha vigente do registro (se o e-mail existir)
      |
      +-- /admin/** ........................... sem sessao --> /admin/login?redirect=...
```

## 2. Estrutura da página (componentização)

`app/pages/admin/login.vue` monta, de fora para dentro:

| Camada | Componente | Papel |
| :--- | :--- | :--- |
| Fundo | `AuthBackground` | canvas animado (`pointer-events-none`, `aria-hidden`), paleta brand (§7) |
| Container | página | `flex` centralizado, `min-h-dvh`, `p-6` |
| Card | página | `max-w-xs` (320px), branco, `rounded-xl`, `shadow-lg`, `p-8` |
| Cabeçalho | `AuthLoginHeader` | identidade centralizada — logomarca (`useLogomarcaLogin`: `preview \|\| caminho`) ou, sem personalização, a marca padrão (ícone `Building2` + "Publications", como no `AppHeader`) — e subtítulo "Área Administrativa" abaixo |
| Divisor | página | linha `h-px` em `bg-brand-focus` (`#1a9e07`) com `role="separator"`, separando o cabeçalho do formulário |
| Formulário | `AuthLoginForm` | `UiInput` e-mail + `UiInput` senha (olho à direita alterna visibilidade) + `UiCheckbox` "Lembrar-me" (`size="sm"`, cinza) + "Esqueceu a senha?" + `UiButton` "Entrar no Portal" (`w-full`) |

A página é dona do estado de `loading` e da navegação pós-login (`aoSubmeter`); o
`AuthLoginForm` é dono da validação de campos e emite `submit`.

A página `/admin/esqueci-senha` reusa **exatamente** a mesma composição (fundo, card, cabeçalho
e divisor), trocando apenas o formulário por `AuthForgotForm` - ver §5.

**Adesão ao kit (componentes `app/components/auth/`):**

- `UiInput` recebe `:left-icon` (`Mail`/`Lock`) - **não** existe prop `icon` no kit;
- `UiButton` recebe o ícone pelo slot `#leftIcon` (`ArrowRight`, `h-3.5 w-3.5`);
- o foco no primeiro campo inválido resolve-se pelo `$el` público do `UiInput`
  (`$el.querySelector('input').focus()`) - o kit não expõe `focus()` e **não** foi alterado;
- os rótulos "E-mail"/"Senha" usam a prop `labelClass` para sair do `font-bold text-slate-700`
  padrão: `font-medium` + `!text-slate-500` (cinza mais claro) no estado normal; **sem** cor
  override no erro, para o rótulo manter o `text-rose-700` do kit (a ordem de emissão do CSS
  do Tailwind exige o `!` contra `text-slate-700`, que é emitido depois);
- o olho da senha usa `right-icon`/`@right-icon-click` do `UiInput` (mesmo padrão da vitrine
  `/design`), alternando `type` entre `password` e `text` — **só aparece enquanto houver
  senha digitada** (ao limpar o campo o olho some e o tipo volta a `password`); com erro
  ativo o kit prioriza o `AlertCircle`, e o olho volta ao limpar o campo;
- o reveal nativo do Edge (`input[type='password']::-ms-reveal`) é ocultado em
  `app/assets/css/main.css` — sem isso ele aparece ao digitar e fica **dois olhos** no
  campo (o nativo + o do kit); o olho visível é sempre o do componente;
- o "Lembrar-me" usa `UiCheckbox size="sm"` (caixa 14px, rótulo 11px) + a prop nova
  `labelClass="!text-slate-500"` do kit (cinza, alinhado aos rótulos dos campos);
- constantes de cookie em `app/utils/cookies.ts` (`COOKIE_SESSAO`, `COOKIE_EMAIL_LEMBRADO`),
  resolvidas por auto-import do Nuxt 4.

## 3. Sessão fake e guarda de rotas

### 3.1 `useAuth` (`app/composables/useAuth.ts`)

| Exposição | Papel |
| :--- | :--- |
| `usuario` (`useState('auth-usuario')`) | `{ id, nome, email, perfil }` do logado ou `null` |
| `loggedIn` | `computed`: há sessão? |
| `entrar({ email, senha, lembrar })` | valida e-mail, senha vigente do registro e status; atualiza `ultimoAcesso`, grava cookie + estado, aplica lembrar-me; devolve `boolean` |
| `sair()` | limpa estado e cookie |
| `ensureSessao()` | restaura a sessão a partir do cookie (F5/SSR); cookie sem registro ativo é descartado |
| `sanitizarRedirectAdmin(valor)` | só aceita caminhos relativos iniciados em `/admin` e sem `//` (anti open redirect); inválido cai em `/admin` |

### 3.2 Cookies (`app/utils/cookies.ts`)

| Cookie | Conteúdo | Observação |
| :--- | :--- | :--- |
| `auth-sessao` | id do usuário demo (`u-001`...) | `SameSite=Lax`, `Path=/`, 7 dias; **fase 1** - migra para `__Host-auth-token` HttpOnly (docs/02 §3.4) |
| `email-lembrado` | e-mail (apenas se "Lembrar-me") | preenche o campo no próximo acesso |

### 3.3 Guarda (`app/middleware/auth.global.ts`)

Middleware global (nome e papel previstos no `docs/02` §5.3), executado em toda navegação
(inclusive SSR):

- **Área Pública** (raiz e qualquer rota fora de `/admin/**`): livre;
- **`/admin/login` e `/admin/esqueci-senha`** (telas de autenticação): com sessão → redirect
  para `/admin`; sem sessão, renderizam;
- **demais `/admin/**`:** `ensureSessao()`; sem sessão → redirect para
  `/admin/login?redirect=<rota original>` (codificada; sanitizada ao ser lida de volta).

## 4. Comportamento do formulário

- **Validação no cliente (antes de qualquer autenticação):** e-mail obrigatório
  ("Informe o e-mail.") e com formato válido ("Informe um e-mail válido."); senha obrigatória
  ("Informe a senha."). Erros usam o padrão do design system (`error` no controle: recorte
  `rose-700`, ícone `AlertCircle` com tooltip e região viva `role="alert"` - spec
  `design-system/form-control-states`) e o foco vai ao **primeiro** campo inválido; digitar
  limpa o erro do campo.
- **Autenticação (`useAuth.entrar`):** e-mail exato (case-insensitive) + senha igual à **senha
  vigente** do registro (a `SENHA_DEMO` `Public@2026` por padrão, ou a senha provisória gravada
  pelo fluxo da §5) + status **Ativo**, contra a base `useUsuariosDemo`.
  - Erro de credencial → toast **danger** único e genérico: "E-mail ou senha inválidos."
    (não revela se o e-mail existe);
  - status **Inativo** → toast **warning**: "Usuário inativo. Contate o administrador.";
  - sucesso → `ultimoAcesso` do registro é atualizado (a Gestão de Usuários reflete na hora),
    sessão gravada, "Lembrar-me" aplicado e navegação para o `?redirect=` sanitizado ou
    `/admin`.
- **Loading:** o botão "Entrar no Portal" mostra o spinner do `UiButton` (`:loading`); nova
  submissão é ignorada enquanto `loading` está ativo.
- **"Esqueceu a senha?":** navega para `/admin/esqueci-senha` (fluxo documentado na §5) - nenhum
  toast é exibido.

## 5. Esqueci a senha (fluxo de recuperação)

- **Rota:** `/admin/esqueci-senha` - `app/pages/admin/esqueci-senha.vue` com
  `definePageMeta({ layout: false })`; a segunda tela de autenticação fora do shell. Composição
  idêntica ao login: `AuthBackground`, card `max-w-xs` com `AuthLoginHeader` ("Área
  Administrativa") e divisor `bg-brand-focus`; só o corpo do card muda - `AuthForgotForm`
  (`app/components/auth/ForgotForm.vue`).
- **Estados do card (troca de conteúdo, sem toast):**
  - *Formulário:* texto "Recuperar Acesso ao Portal", `UiInput` e-mail (mesma validação do
    login: vazio → "Informe o e-mail.", inválido → "Informe um e-mail válido.", foco no primeiro
    campo inválido, digitar limpa o erro) e `UiButton` "Enviar link" com `:loading`; abaixo do
    botão, o link "Voltar ao login" alinhado à esquerda com a seta `ArrowLeft`.
  - *Sucesso:* o card inteiro é substituído pelo estado de sucesso - selo `KeyRound`, a senha
    provisória em `<code>` (selecionável), a instrução de usá-la no login, o botão "Voltar ao
    login" e o link "Enviar para outro e-mail" (volta ao estado inicial).
- **Envio simulado (fase 1, sem backend):** ao enviar, o componente aguarda ~600 ms (spinner
  visível), gera uma senha provisória aleatória de 12 caracteres via `crypto.getRandomValues`
  (alfabeto sem ambíguos `0/O/1/l/I`) e, **se o e-mail existir na base demo**, grava-a no campo
  `senha` do registro - a senha vigente daquele usuário passa a ser a provisória (a `Public@2026`
  deixa de valer para ele até nova alteração; a base é em memória, então F5 zera o efeito).
- **Resposta genérica (anti-enumeração):** o mesmo caminho de código roda para e-mail cadastrado
  e não cadastrado - mesmo estado de sucesso, mesma forma e latência. Para o e-mail não
  cadastrado a senha exibida **simplesmente não autentica** e o login responde com o toast
  genérico "E-mail ou senha inválidos.". Nenhuma mensagem, tempo ou sinal revela a existência
  do cadastro.
- **Guarda:** rota livre sem sessão; com sessão ativa, redireciona para `/admin` (mesmo
  tratamento do login).
- **Retorno:** "Voltar ao login" (nos dois estados) navega para `/admin/login`.

## 6. Credenciais de demonstração

> **QA e demonstração:** qualquer usuário **Ativo** da base `useUsuariosDemo` loga com a senha
> vigente do seu registro - por padrão `Public@2026` (`SENHA_DEMO`); após um envio em
> `/admin/esqueci-senha`, o registro dono do e-mail passa a aceitar **a senha provisória gerada**
> no lugar da `Public@2026` (a base é em memória: recarregar a página zera a provisória).
> Credencial recomendada (Administrador):
>
> **`ana.carolina@empresa.com.br`** / **`Public@2026`**

| Exercício | Credencial | Resultado esperado |
| :--- | :--- | :--- |
| Login completo (Administrador) | `ana.carolina@empresa.com.br` / `Public@2026` | entra em `/admin`; header mostra "Ana Carolina Ribeiro / Administrador" |
| Outro perfil | `rafael.souza@empresa.com.br` / `Public@2026` | header mostra "Rafael Souza / Editor" |
| Usuário Inativo | `camila.rocha@empresa.com.br` / `Public@2026` | toast de inativo, sem login |
| Senha errada | qualquer e-mail Ativo + senha errada | toast "E-mail ou senha inválidos." |
| E-mail inexistente | `nao.existe@empresa.com.br` + qualquer senha | mesmo toast genérico |
| Senha provisória (fluxo da §5) | e-mail cadastrado + senha gerada em `/admin/esqueci-senha` | entra em `/admin`; `Public@2026` deixa de ser aceita para aquele registro enquanto a provisória estiver vigente |

A comparação em texto puro é aceitável porque `SENHA_DEMO` é constante pública de
demonstração - nenhum hash é simulado para não criar falsa sensação de segurança (§11).

## 7. Background e identidade

`AuthBackground` (`app/components/auth/Background.vue`) mantém a estrutura original (gradiente +
campo de pontos + anéis animados com sprites, `prefers-reduced-motion`, pausa por
`visibilitychange`, resize com DPR) e troca **apenas as cores** pela paleta brand:

| Elemento | Cor |
| :--- | :--- |
| Gradiente de fundo | `#0b1330` → `#070d22` → `#040814` (escala navy derivada de `brand.primary` `#112051`) |
| Paleta dos anéis/pontos | `#0364f7` (`brand.structure`), `#50a1ff`, `#4ed813` (`brand.accent`), `#1a9e07` (`brand.focus`), `#0364f7` |

**Onda no fundo:** cada anel emite uma onda sonar (anel expansivo na cor do anel) a cada
1,4-2,2 s na posição por onde passa; a onda se expande (~110-150 px/s), some em 2,2-3 s e, ao
cruzar o campo de pontos, **desloca** cada ponto até 10 px para fora e **acende** a sua
brilhância conforme a frente de onda (`ONDA_LARGURA = 48 px`, `ONDA_FORCA = 10`) - o efeito é
uma onda percorrendo o fundo exatamente pelo caminho dos círculos. O gradiente continua
pré-renderizado; só o campo de pontos é redesenhado por quadro (~2 mil sprites em `lighter`),
e `prefers-reduced-motion` congela tudo (quadro estático, sem ondas).

## 8. Encerrar Sessão e bloco Account

- **Encerrar Sessão** (item fixo do menu da conta, `AppHeader`): chama `useAuth.sair()` (limpa
  estado e cookie), fecha o menu e navega para `/admin/login` - em seguida, `/admin/**` volta a
  redirecionar.
- **Bloco Account:** nome, perfil e iniciais derivam do usuário logado (`useAuth().usuario`),
  com fallback no valor fixo `conta` de `app/config/navigation.ts` caso o header renderize sem
  sessão. A ordem e a estrutura do menu continuam governadas por `design-system/layout-navigation`.

## 9. Especificações OpenSpec

- **`openspec/changes/archive/2026-10-09-login-administrativo`** (arquivada - originou a spec
  `login`):

  | Capability | Operação |
  | :--- | :--- |
  | `login` | **ADDED** - capability nova: rota e composição, formulário com kit e validação, autenticação fake contra a base demo, sessão por cookie + F5 + logout, guarda global com `?redirect=`, identidade no header + logomarca + retint, este documento |
  | `design-system/layout-navigation` | **MODIFIED** - "Toda rota sob `/admin/**` é renderizada com o shell": exceção `/admin/login` (cenário "A tela de login fica fora do shell") |

- **`openspec/changes/esqueci-senha`** (em andamento):

  | Capability | Operação |
  | :--- | :--- |
  | `login` | **MODIFIED** - link "Esqueceu a senha?" navega (sem toast); guarda libera `/admin/esqueci-senha`; autenticação aceita a senha vigente (provisória) além da `SENHA_DEMO`; documentação exige o fluxo de recuperação; **REMOVED/ADDED** bloco Account e identidade das telas de autenticação; **ADDED** o requirement da página `/admin/esqueci-senha` |
  | `design-system/layout-navigation` | **MODIFIED** - a exceção de shell passa a ser o conjunto de telas de autenticação (`/admin/login` e `/admin/esqueci-senha`) |

## 10. Verificação

- `npm run build` (gate estrutural - não há lint/test no repositório) e
  `openspec validate "esqueci-senha" --strict`.
- Fluxo manual no dev server (`http://localhost:3000`):
  - URL direta em `/admin/perfis-acesso` sem sessão → redirect para
    `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`;
  - login com `ana.carolina@empresa.com.br` / `Public@2026` → entra e segue para a rota
    pretendida; "Último acesso" de Ana atualiza na Gestão de Usuários;
  - senha errada → toast "E-mail ou senha inválidos."; Inativo → toast próprio; F5 mantém a
    sessão; "Encerrar Sessão" volta ao login e o acesso volta a ser bloqueado;
  - "Esqueceu a senha?" → navega para `/admin/esqueci-senha` sem toast; vazio/inválido exibe o
    erro no padrão do kit; envio com e-mail cadastrado exibe a senha provisória que **autentica**
    no login (`Public@2026` deixa de valer para aquele registro); envio com e-mail inexistente
    exibe estado **idêntico** e a senha não autentica (mesmo toast genérico);
  - sem sessão, `/admin/esqueci-senha` renderiza sem shell; com sessão, redireciona para `/admin`;
  - header mostra o usuário logado; o card exibe a logomarca de Configurações > Logomarcas
    (ou a marca padrão); canvas na paleta brand.

## 11. Pendências e próximos passos

- **Backend (fase com `server/`):** `POST /api/auth/login` com bcrypt, cookie `__Host-auth-token`
  HttpOnly/Secure (docs/02 §3.4), refresh com rotação de sessão (`sessoes`), lockout de
  tentativas e rate limit; `useApiFetch` (docs/02 §5.2). O `useAuth.entrar` troca a validação
  local pela chamada à API **sem mudar** a rota, a página nem o formulário.
- **Envio real de e-mail:** o fluxo da §5 é simulado no cliente (a senha exibida no card
  substitui o e-mail); com backend, vira envio de mensagem com token único e expiração, sem
  exibir a senha na tela.
- **Persistência da senha:** a base demo é em memória - F5 zera a provisória gravada e a
  `Public@2026` volta a valer para o registro; com backend, a senha vigente é persistida (hash).
- **Troca da senha provisória ("Meu Perfil"):** página de perfil do usuário para substituir a
  provisória - change futura, fora do escopo da change `esqueci-senha`.
- **RBAC no cliente:** `usePermissions` com helper `.can(modulo, acao)` (docs/02 §5.3) derivando
  do perfil da sessão - entra quando a sessão for real e a matriz de permissões (docs/07)
  vier do banco.
- **Auditoria de login:** gravar eventos de autenticação (sucesso/falha/bloqueio) na Gestão de
  Auditoria quando a base for persistente.
