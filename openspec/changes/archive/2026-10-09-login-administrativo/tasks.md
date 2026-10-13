# Tasks

## 1. Fundação da sessão (utils, composable, guarda)

- [x] 1.1 Criar `app/utils/cookies.ts` exportando `COOKIE_SESSAO = 'auth-sessao'` e
      `COOKIE_EMAIL_LEMBRADO = 'email-lembrado'` e verificar que `npm run build` compila e as
      constantes resolvem por auto-import (usá-las num ponto temporário ou conferir o
      auto-import no `.nuxt/types` gerado).
- [x] 1.2 Criar `app/composables/useAuth.ts` com `useState('auth-usuario')`, cookie fino via
      `useCookie(COOKIE_SESSAO)`, `entrar({ email, senha, lembrar })` (valida contra
      `useUsuariosDemo`: e-mail exato + `SENHA_DEMO` + status Ativo; genérico em erro,
      toast próprio em Inativo; atualiza `ultimoAcesso`; grava cookie + estado; aplica
      lembrar-me) e `sair()`; verificar que `npm run build` compila sem erro de tipo.
- [x] 1.3 Criar `app/middleware/auth.global.ts` com a lógica do design D2 (login logado →
      `/admin`; `/admin/**` sem sessão → `/admin/login?redirect=` sanitizado — só caminho
      relativo iniciado em `/admin` e sem `//`; Área Pública livre; restauração de sessão
      pelo cookie via `ensureSessao`); verificar que `npm run build` compila e o arquivo
      exporta o handler default.

## 2. Adesão dos componentes `app/components/auth/` ao kit

- [x] 2.1 Em `LoginForm.vue`: trocar `:icon` por `:left-icon` nos dois `UiInput`, trocar
      `:icon` do `UiButton` pelo slot `#leftIcon` (`<ArrowRight class="h-3.5 w-3.5" />`),
      substituir a referência quebrada `COOKIE_EMAIL_LEMBRADO` pelo import de
      `app/utils/cookies.ts` e implementar o foco no primeiro campo inválido via
      `$el.querySelector('input')?.focus()`; verificar que `npm run build` compila sem
      warning de props desconhecidas.
- [x] 2.2 Em `LoginForm.vue`: trocar o `NuxtLink` "Esqueceu a senha?" por botão/link com
      `@click` exibindo `toast.info('Funcionalidade em breve.')` sem navegar; verificar
      build e ausência de rota `/admin/esqueci-senha` no href.
- [x] 2.3 Em `Background.vue`: retintar o gradiente de fundo para a escala navy derivada de
      `#112051` (`#0b1330 → #070d22 → #040814`) e a paleta dos anéis/pontos para
      `['#0364f7', '#50a1ff', '#4ed813', '#1a9e07', '#0364f7']`, preservando
      `prefers-reduced-motion`, pausa por visibilidade e resize; verificar build e, no
      grupo 6, o visual.
- [x] 2.4 Em `Background.vue`: fazer com que, conforme os anéis percorrem o fundo, cada um
      emita ondas sonar expansivas que deslocam e acendem os pontos do campo (gradiente
      pré-renderizado, campo redesenhado por quadro), preservando `prefers-reduced-motion`
      e a paleta brand; verificar `npm run build` e o visual no grupo 6.
- [x] 2.5 Em `LoginForm.vue`: deixar os rótulos "E-mail" e "Senha" sem negrito e em cinza
      mais claro via `labelClass` (`font-medium` + `!text-slate-500` no estado normal; sem
      cor no erro para preservar o `text-rose-700` do kit); verificar `npm run build` e o
      visual no grupo 6.
- [x] 2.6 Em `LoginForm.vue`: adicionar o olho de visualização da senha pelo padrão do kit
      (`right-icon` `Eye`/`EyeOff` + `@right-icon-click` alternando `type`), exibido **só
      com senha digitada** (sumindo e voltando a `password` ao limpar o campo); verificar
      `npm run build` e o ícone no grupo 6.
- [x] 2.7 Em `LoginForm.vue` + `UiCheckbox`: reduzir o "Lembrar-me" para `size="sm"` e
      deixá-lo em cinza com a prop nova `labelClass="!text-slate-500"` (documentada em
      `docs/01` §5.9); verificar `npm run build` e o visual no grupo 6.
- [x] 2.8 Eliminar o segundo olho do campo de senha: o reveal nativo do Edge
      (`::-ms-reveal`) aparecia ao digitar junto com o olho do kit — ocultado via CSS em
      `app/assets/css/main.css`; verificado com digitação real via CDP no Edge (um único
      `lucide-eye` no campo).

## 3. Página `/admin/login`

- [x] 3.1 Criar `app/pages/admin/login.vue` com `definePageMeta({ layout: false })`,
      `AuthBackground` ao fundo, card centralizado branco (`max-w-xs`, `rounded-xl`,
      `shadow-lg`, `p-8`), `AuthLoginHeader` (logo de `useLogomarcaLogin`
      `preview || caminho`, título padrão, subtítulo "Área Administrativa") e
      `AuthLoginForm`; `aoSubmeter` controla `loading`, chama `entrar()` e navega para o
      `redirect` sanitizado ou `/admin`; verificar que `npm run build` compila e a rota
      responde em `http://localhost:3000/admin/login`.
- [x] 3.2 Em `login.vue`: inserir divisor `h-px bg-brand-focus` (`#1a9e07`,
      `role="separator"`) entre o `AuthLoginHeader` (título/subtítulo) e o `AuthLoginForm`
      (campo E-mail), com respiro `mb-4` dos dois lados; verificar `npm run build` e o
      visual no grupo 6.
- [x] 3.3 Em `LoginHeader.vue`: substituir o título "Dicas Teorema" pela identidade do
      sistema — logomarca de Configurações (`useLogomarcaLogin`) quando configurada ou,
      sem personalização, a marca padrão (ícone `Building2` + nome "Publications", como no
      `AppHeader`) — mantendo o subtítulo "Área Administrativa" abaixo; remover a prop
      `titulo`, refletir na spec `login`, `design.md` (D6) e `docs/08` §1/§2; verificar
      `npm run build` e o visual no grupo 6.

## 4. Shell: identidade da conta e logout

- [x] 4.1 Em `AppHeader.vue`: derivar nome, perfil e iniciais do bloco Account de
      `useAuth().usuario`, com fallback para o `conta` de `config/navigation.ts`; verificar
      build e (grupo 6) o header refletindo o usuário logado.
- [x] 4.2 Em `AppHeader.vue`: no botão "Encerrar Sessão" do menu do Account, além de
      `fecharMenus`, chamar `useAuth.sair()` e `navigateTo('/admin/login')`; verificar
      build e (grupo 6) o logout completo.

## 5. Documentação

- [x] 5.1 Criar `docs/08 - Login de Autenticação.md` no formato do `docs/07` (metadados de
      versão/escopo/arquivos-fonte, sumário numerado): rota e composição, `useAuth` e
      guarda, comportamento do formulário (validação, erros, lembrar-me, redirect),
      credenciais demo em destaque (`ana.carolina@empresa.com.br` / `Public@2026`, bloqueio
      de Inativos), background e identidade, verificação e pendências da fase backend
      (JWT/HttpOnly `__Host-auth-token`, `useApiFetch`, esqueci-senha, rate limit);
      verificar que o documento bate com o comportamento implementado e cita os arquivos
      criados/alterados.

## 6. Verificação final (integração)

- [x] 6.1 Rodar `npm run build` e confirmar conclusão limpa (sem erro e sem warning de
      props/nome de componente dos arquivos da change).
- [x] 6.2 Executar o fluxo manual completo em `http://localhost:3000`: (a) URL direta em
      `/admin/perfis-acesso` sem sessão redireciona para `/admin/login?redirect=...`;
      (b) login com `ana.carolina@empresa.com.br` / `Public@2026` loga, atualiza
      "Último acesso" na Gestão de Usuários e segue para a rota pretendida; (c) senha
      errada mostra "E-mail ou senha inválidos."; (d) `camila.rocha@empresa.com.br`
      (Inativa) mostra o aviso de inativo; (e) F5 mantém a sessão; (f) "Encerrar Sessão"
      volta ao login e em seguida `/admin/**` volta a redirecionar; (g) "Esqueceu a senha?"
      exibe o toast sem navegar; (h) header mostra nome/perfil do usuário logado; (i) o
      card de login exibe a logomarca de Configurações > Logomarcas (ou a marca padrão) e o
      canvas aparece na paleta brand.
      *(Executado em 09/10/2026 via agente `qa-execucao`: 21 PASS / 1 FAIL — BUG-1,
      corrigido na task 6.3.)*
- [x] 6.3 Corrigir o BUG-1 da execução 6.2: o `autocomplete` dos campos de login caía no
      wrapper do `UiInput` por fallthrough — nova prop `autocomplete` no kit
      (`app/components/ui/Input.vue`, repassada ao `<input>`), documentada em `docs/01`
      §5.3; verificar `npm run build` e que os `<input>` de e-mail/senha renderizam com
      `autocomplete="username"`/`"current-password"` fora do wrapper.
