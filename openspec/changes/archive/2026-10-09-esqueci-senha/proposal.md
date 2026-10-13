# Proposal

## Why

O link "Esqueceu a senha?" do login ainda responde apenas com o toast "Funcionalidade em
breve." e o `docs/08` §10 declara `/admin/esqueci-senha` como pendência da fase — sem a tela
de recuperação o frontend da autenticação não fica fechado.

## What Changes

- Nova rota `/admin/esqueci-senha` (fora do shell, sobre o `AuthBackground`): card com
  `UiInput` de e-mail, validação de formato no cliente e envio **simulado** que gera uma
  **senha provisória aleatória** e a registra como senha vigente do usuário da base demo —
  resposta **genérica** que nunca revela se o e-mail existe; como a fase 1 não tem e-mail
  real, o estado de sucesso **exibe a senha provisória** para o usuário copiar e usá-la no
  login, com retorno ao `/admin/login`.
- Login passa a aceitar, além da `SENHA_DEMO` (`Public@2026`), a senha vigente do registro
  (a provisória gerada) — erro continua genérico e o bloqueio de Inativos permanece.
- O link "Esqueceu a senha?" passa a **navegar** para `/admin/esqueci-senha` (substitui o
  toast "Funcionalidade em breve.").
- Guarda global (`app/middleware/auth.global.ts`): `/admin/esqueci-senha` entra na lista de
  rotas livres sem sessão; com sessão ativa, redireciona para `/admin` (mesmo tratamento de
  `/admin/login`).
- `design-system/layout-navigation`: a exceção de shell deixa de ser "somente
  `/admin/login`" e passa a ser o conjunto de telas de autenticação (`/admin/login` e
  `/admin/esqueci-senha`).
- `docs/08 - Login de Autenticação.md`: nova seção §5 sobre o fluxo de recuperação com senha
  provisória, com atualização de §4 (comportamento do link), §6 (credenciais/senha vigente),
  §10 (verificação) e §11 (pendências).
- **Ampliação de documentação (lacunas apontadas pelo QA em 2026-10-09):** §1 deixa de
  afirmar que `/admin/login` é a "única" rota sem shell; §3.3 e o diagrama passam a listar
  `/admin/esqueci-senha` na guarda; §8/§9 passam a apontar a change `esqueci-senha` (a
  `login-administrativo` está arquivada) e o fluxo revogado do toast; correção dos 3
  caracteres `U+FFFD` onde deveria haver `§` (L22/L84/L183); nomenclatura da L51 deixa de
  chamar a `SENHA_DEMO` de "senha provisória".

**Fora do escopo desta change:** página `/admin/redefinir-senha` (fluxo descartado) e
página **Meu Perfil** com a troca da senha provisória (change futura — a provisória é
aceita no login e a troca fica como pendência documentada).

## Capabilities

### New Capabilities

_Nenhuma — a tela de recuperação pertence à capability existente de autenticação._

### Modified Capabilities

- `login`: link "Esqueceu a senha?" navega em vez de exibir toast; guarda global libera
  `/admin/esqueci-senha` sem sessão; rota de recuperação renderiza sem shell; autenticação
  da fase 1 aceita a senha vigente do registro (provisória) além da `SENHA_DEMO`;
  documentação do fluxo passa a ser exigida do `docs/08`; **+1 requirement novo** (página
  `/admin/esqueci-senha` com geração e exibição da senha provisória).
- `design-system/layout-navigation`: requirement "Toda rota sob /admin/** é renderizada com
  o shell" — a "única exceção de `/admin/login`" passa a ser o conjunto de telas de
  autenticação (login e esqueci-senha) e o cenário correspondente é generalizado.

## Impact

- **Arquivos novos:** `app/pages/admin/esqueci-senha.vue`,
  `app/components/auth/ForgotForm.vue`.
- **Arquivos alterados:** `app/components/auth/LoginForm.vue` (link navega),
  `app/composables/useAuth.ts` + base `useUsuariosDemo` (senha vigente opcional;
  ausente → `SENHA_DEMO`), `app/middleware/auth.global.ts` (rota livre),
  `docs/08 - Login de Autenticação.md`.
- **Specs alterados:** `openspec/specs/login/spec.md`,
  `openspec/specs/design-system/layout-navigation/spec.md` (via deltas desta change).
- **Sem** dependências novas, sem backend, sem alteração de kit (`UiInput`/`UiButton`/
  `AuthBackground`/`AuthLoginHeader`/`useToast` já existem). A troca da provisória no
  "Meu Perfil" e a persistência real da senha ficam para fases futuras.
