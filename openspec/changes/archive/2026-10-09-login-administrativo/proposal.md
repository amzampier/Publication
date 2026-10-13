# Proposal

## Why

A Área Administrativa já existe com 5 telas em memória, mas não tem porta de entrada: qualquer
rota `/admin/**` é acessível direto, sem sessão, e a rota `/admin/login` prevista no `docs/02` §3.4
não foi criada. Três arquivos de login já foram esboçados em `app/components/auth/` fora dos
convenções do kit, sem rota, sem guarda e sem documentação. Esta change fecha o ciclo da fase 1
(frontend puro, sem backend): tela de login fake que de fato protege a Área Administrativa.

## What Changes

- Nova rota `/admin/login` (página `app/pages/admin/login.vue`, `layout: false`) com os componentes
  `AuthLoginHeader`, `AuthLoginForm` e `AuthBackground` adaptados às convenções do kit
  (`:left-icon`, slot `#leftIcon`, constantes em `app/utils/`, retint da paleta para os tokens
  `brand.*`).
- Novo `app/composables/useAuth.ts`: sessão fake em memória (`useState`) com persistência por
  cookie fino (`COOKIE_SESSAO` = id do usuário) que sobrevive ao F5; `entrar()` valida contra a
  base `useUsuariosDemo` (e-mail + `SENHA_DEMO` + status Ativo), atualiza `ultimoAcesso` e grava a
  sessão; `sair()` limpa estado e cookie.
- Novo `app/middleware/auth.global.ts` (guarda global, nome e papel previstos no `docs/02` §5.3):
  Área Pública livre; `/admin/login` redireciona para `/admin` quando já logado; demais rotas
  `/admin/**` exigem sessão e redirecionam para `/admin/login?redirect=<rota original>`.
- Item **Encerrar Sessão** do menu do Account (já existente, hoje sem ação) passa a chamar
  `useAuth.sair()` e navegar para `/admin/login`.
- Bloco Account do header exibe nome e perfil do usuário logado (hoje fixos em `conta`), com
  fallback para o valor atual.
- Link "Esqueceu a senha?" passa a exibir `toast.info` "Funcionalidade em breve." (a página
  `/admin/esqueci-senha` não existe e não faz parte da fase 1).
- **BREAKING (comportamental):** a partir desta change, acessar qualquer rota `/admin/**` sem
  sessão redireciona para `/admin/login` — o QA das telas administrativas passa a exigir login
  prévio com as credenciais demo.
- **BREAKING (spec):** `/admin/login` é a única rota `/admin/**` que renderiza **sem** o shell
  (header + sidebar) — exceção à exigência de que toda rota administrativa herde o shell.
- Novo documento `docs/08 - Login de Autenticação.md` (fonte normativa da tela, no formato do
  `docs/07`).

## Capabilities

### New Capabilities

- `login`: tela e fluxo de autenticação fake da fase 1 — rota `/admin/login`, composição e
  comportamento do formulário, validação de credenciais contra a base demo, estado de erro,
  "lembrar-me", sessão por cookie, guarda global de `/admin/**`, redirect pós-login, logout e
  identidade do usuário no bloco Account.

### Modified Capabilities

- `design-system/layout-navigation`: a exigência "toda rota sob `/admin/**` é renderizada com o
  shell sem exceção" ganha a exceção `/admin/login` (renderiza sem shell, com layout próprio),
  mantendo todas as demais rotas administrativas sob o shell.

## Impact

- **Código novo:** `app/composables/useAuth.ts`, `app/middleware/auth.global.ts`,
  `app/pages/admin/login.vue`, `app/utils/cookies.ts`.
- **Código alterado:** `app/components/auth/LoginForm.vue` (adesão ao kit), 
  `app/components/auth/Background.vue` (retint `brand.*`), 
  `app/components/layout/AppHeader.vue` (conta do usuário + logout).
- **Sem alteração no kit `app/components/ui/`** — nenhuma API de componente muda (o foco no
  primeiro campo inválido é resolvido no consumidor via `$el`, sem `defineExpose`).
- **Documentação:** novo `docs/08`; `docs/01` e `docs/03` intocados (nenhum componente de kit ou
  zona do header muda de contrato visual).
- **QA:** as 5 telas administrativas existentes passam a exigir login (credenciais demo
  documentadas no `docs/08`); nenhuma mudança de comportamento interno dessas telas.
- **Backend futuro:** fora do escopo (JWT/HttpOnly, `useApiFetch`, esqueci-senha, rate limit
  ficam para a fase com `server/`, listados como pendências no `docs/08`).
