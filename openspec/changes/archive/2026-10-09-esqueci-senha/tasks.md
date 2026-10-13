# Tasks

## 1. Guarda global e link do login

- [x] 1.1 Em `app/middleware/auth.global.ts`: liberar `/admin/esqueci-senha` sem sessão (com
      sessão, redirecionar para `/admin`, igual a `/admin/login`) mantendo as demais rotas
      `/admin/**` protegidas; verificar com `npm run build` e abrindo a rota sem sessão
      (renderiza) e `/admin/perfis-acesso` sem sessão (ainda redireciona com `?redirect=`).
- [x] 1.2 Em `app/components/auth/LoginForm.vue`: trocar o `toast.info('Funcionalidade em
      breve.')` do link "Esqueceu a senha?" por navegação para `/admin/esqueci-senha`;
      verificar `npm run build` e que o clique leva à rota sem exibir toast.

## 2. Tela /admin/esqueci-senha com senha provisória

- [x] 2.1 Criar `app/components/auth/ForgotForm.vue` no padrão do `AuthLoginForm`:
      `UiInput` e-mail (obrigatório + formato, erros no padrão do kit, foco no primeiro campo
      inválido, erro limpa ao digitar) + `UiButton` "Enviar link" com `:loading`; ao enviar,
      gerar senha provisória aleatória (`crypto.getRandomValues`, ~12 caracteres sem
      ambíguos) e, se o e-mail existir na base demo, gravá-la como senha vigente do registro;
      estado de sucesso no card exibindo a senha gerada + instrução de usá-la no login, com
      a mesma aparência para e-mail não cadastrado; verificar `npm run build` e no browser:
      vazio/inválido bloqueia, válido mostra sucesso com senha, resposta idêntica para e-mail
      inexistente.
- [x] 2.2 Criar `app/pages/admin/esqueci-senha.vue` (`layout: false`) com `AuthBackground`,
      card `max-w-xs`, `AuthLoginHeader` (logo + "Área Administrativa") e divisor
      `brand-focus`, montando o `AuthForgotForm`; verificar `npm run build` e que a rota
      renderiza sem shell sobre o canvas, idêntica em composição ao login.
- [x] 2.3 Fios do fluxo em `ForgotForm`: retorno ao login no estado inicial/sucesso;
      verificar no browser a navegação de volta para `/admin/login`.
- [x] 2.4 Atualizar `docs/08 - Login de Autenticação.md`: §4 passa a descrever o link
      navegando para `/admin/esqueci-senha` (sem toast) e criar a seção do fluxo "Esqueci a
      senha" (rota, composição, estados, geração/exibição da senha provisória, anti-
      enumeração); verificar que o documento bate com o comportamento implementado.
- [x] 2.5 Lacunas de escopo apontadas pelo QA em `docs/08`: §1 remove a alegação de
      "única rota sem shell" (agora são as 2 telas de autenticação) e o blockquote passa a
      citar `/admin/esqueci-senha` como rota livre; §3.3 + diagrama listam a rota de
      recuperação na guarda; §9 aponta as 2 changes (a arquivada com caminho correto e a
      `esqueci-senha`) sem citar o toast revogado; corrigir os 3 `U+FFFD` → `§` (refs
      §5/§6/§11) e a nomenclatura da L51 ("senha provisória única" → senha vigente); a
      renumeração das seções (nova §5, credenciais §6 → pendências §11) foi feita junto;
      verificar `openspec validate --specs` e que nenhum texto falso restou no documento.

## 3. Login aceita a senha provisória

- [x] 3.1 Em `app/composables/useAuth.ts` + base `useUsuariosDemo`: dar ao registro uma
      senha vigente opcional (ausente → `SENHA_DEMO`) e validar `senha === (registro.senha
      ?? SENHA_DEMO)`, mantendo erro genérico e bloqueio de Inativos; verificar
      `npm run build` e no browser: `Public@2026` loga nos registros sem provisória, a
      senha provisória gerada no esqueci-senha loga no dono do e-mail, senha antiga não é
      mais aceita para ele e e-mail inexistente/errada continua no mesmo toast genérico.
- [x] 3.2 Em `docs/08 - Login de Autenticação.md`: §6 documentar a senha vigente
      (provisória sobrepõe a demo; exercícios de QA com login pela provisória) e §11
      remover a pendência `/admin/esqueci-senha`, acrescentando as pendências reais
      (persistência da senha, envio real de e-mail, troca no Meu Perfil, JWT/HttpOnly,
      `useApiFetch`, rate limit); verificar que §5/§6/§10/§11 conferem com a tela.

## 4. Verificação final (integração)

- [x] 4.1 Rodar `npm run build` e `openspec validate "esqueci-senha" --strict`, confirmando
      conclusão limpa (sem erro e sem warning de props/nome de componente da change).
- [x] 4.2 Percorrer o fluxo completo em `http://localhost:3000`: login → "Esqueceu a
      senha?" → envio (vazio, inválido, cadastrado, inexistente com mesma resposta) → copiar
      a senha provisória → logout → login com ela → `Public@2026` não é mais aceita para o
      dono (mas ainda loga nos demais); sem sessão `/admin/esqueci-senha` renderiza e
      `/admin/**` protegida redireciona; logada, a rota de recuperação manda para `/admin`.
