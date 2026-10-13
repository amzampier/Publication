# Design

## Context

Ver `proposal.md` — Why. O estado atual relevante:

- `AuthLoginForm` (`app/components/auth/LoginForm.vue`) já valida e-mail/senha no cliente com o
  padrão do kit e o link "Esqueceu a senha?" hoje dispara `toast.info('Funcionalidade em breve.')`.
- As telas de autenticação são páginas com `definePageMeta({ layout: false })`, card
  `max-w-xs` sobre o `AuthBackground`, `AuthLoginHeader` + divisor `bg-brand-focus`
  (`app/pages/admin/login.vue`).
- A guarda `app/middleware/auth.global.ts` libera só `/admin/login` sem sessão.
- O login compara `credenciais.senha !== SENHA_DEMO` (`app/composables/useAuth.ts:98`) —
  senha única para todos os registros da base demo.
- O item "Meu Perfil" do menu Account (`AppHeader.vue:254`, `navigation.ts:111`) é um botão
  **sem rota** (só fecha menus) — a página não existe e fica para change futura.
- `docs/08` §10 declara `/admin/esqueci-senha` como pendência; spec `login` exige hoje o toast
  e a spec `layout-navigation` exige que `/admin/login` seja a **única** rota sem shell.

## Goals / Non-Goals

**Goals:**

- Fechar o fluxo "esqueci a senha" da fase 1 fake: e-mail → senha provisória aleatória →
  login com ela.
- Reutilizar integralmente o kit e os padrões visuais do login (zero componentes novos de UI).
- Manter os contratos de segurança já estabelecidos: resposta genérica sem enumeração de
  e-mails; erro de login continuamente genérico.

**Non-Goals:**

- Página `/admin/redefinir-senha` — fluxo descartado pelo usuário.
- Página **Meu Perfil** e a troca da senha provisória — change futura (a provisória é aceita
  no login; a troca fica como pendência documentada).
- Backend, envio real de e-mail, persistência da senha entre recargas e tokens.
- Mudanças no kit (`UiInput`, `UiButton`, `AuthBackground`, `AuthLoginHeader`).

## Decisions

1. **Uma página + um componente de formulário** — `app/pages/admin/esqueci-senha.vue`
   (`layout: false`, orquestra background/card/header) + `AuthForgotForm` em
   `app/components/auth/`, no padrão do `AuthLoginForm`.
   *Alternativa descartada:* form inline na página — quebraria o padrão de formulário
   isolável do projeto.

2. **Estados vivem no card, não em toast** — sucesso (com a senha provisória) troca o
   conteúdo do card, mantendo identidade no topo. *Alternativa:* toast + navegação —
   perderia o contexto e a senha sairia da tela rápido demais.

3. **Senha provisória gerada no cliente** — `crypto.getRandomValues`, ~12 caracteres
   alfanuméricos sem ambíguos (0/O/1/l), gravada no registro da base demo como senha
   vigente (campo opcional; ausente → `SENHA_DEMO`). O login passa a aceitar
   `senha === (registro.senha ?? SENHA_DEMO)`.
   *Alternativa descartada:* derivar a provisória do e-mail (previsível) ou aceitar só
   `SENHA_DEMO` (fluxo não fecharia).

4. **Exibir a senha no card é a simulação do e-mail** — fase 1 não tem caixa de entrada; o
   estado de sucesso mostra a senha com instrução de usá-la no login. Para e-mail não
   cadastrado a resposta é **idêntica** (mesma forma, senha exibida que não autentica) —
   anti-enumeração preservada; o login responde com o erro genérico usual.
   *Alternativa descartada:* erro "e-mail não encontrado" — revelaria cadastro.

5. **Guarda com rota livre explícita** — só `/admin/login` e `/admin/esqueci-senha`; logado
   nelas → `navigateTo('/admin')`. Estrutura de `path` checks do middleware mantida.

6. **Validação reutiliza o padrão do `AuthLoginForm`** — erros no `error` do controle, foco
   no primeiro campo inválido, erro limpa ao digitar, `labelClass` condicional.

7. **`docs/08` absorve o fluxo** — seção nova "Esqueci a senha" (rota, estados, senha
   provisória, exercícios de QA incluindo login com ela), §4 deixa de descrever o toast, §5
   documenta a senha vigente/provisória, §9 ganha verificações e §10 remove a pendência
   `/admin/esqueci-senha` e acrescenta as novas (persistência real, Meu Perfil, envio real).

## Risks / Trade-offs

- [Base demo é em memória: F5 zera a provisória] → fase 1 aceita; documentado no `docs/08`
  como pendência de persistência (QA: gerar e logar sem recarga; com recarga, `Public@2026`
  volta a valer).
- [Senha visível na tela pode dar falsa sensação de e-mail real] → texto do estado de
  sucesso deixa claro que é a senha a ser usada; `docs/08` §10 lista o envio real como
  pendência.
- [Usuário fica com a provisória indefinidamente sem Meu Perfil] → pendência declarada no
  `docs/08` §10 e no requirement de documentação; change futura cuida da troca.
- [Esquecer a rota nova na guarda] → redirecionaria para o login (falha visível); coberto
  pelo cenário "A rota de recuperação é livre sem sessão".
- [Specs atuais proíbem as mudanças (exceção única de shell, toast obrigatório, senha =
  `SENHA_DEMO`)] → deltas de `login` e `design-system/layout-navigation` cobrem esses
  pontos; validação `--strict` na change.

## Migration Plan

Frontend puro, sem dados persistentes e sem dependências: deploy normal
(`npm run build`), reversível por revert — nada a migrar.

## Open Questions

_Nenhuma — escopo (só esqueci-senha, sem redefinir e sem Meu Perfil), efeito simulado e
defaults de UI/validação foram decididos na exploração (ver proposal.md)._
