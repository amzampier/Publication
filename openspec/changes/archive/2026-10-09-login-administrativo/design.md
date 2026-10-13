# Design

## Context

Fase 1 do Publications: tudo em memória, sem `server/`, sem banco. A Área Administrativa já tem
5 telas sob o shell (`app/layouts/admin.vue`), mas nenhuma sessão as protege — qualquer URL
`/admin/**` é acessível direto. O `docs/02` §3.4/§5.3 já desenha o destino final (JWT em cookie
HttpOnly, `useApiFetch`, `useAuth`, `auth.global.ts`), e a rota prevista é `/admin/login`.
Três componentes de login foram esboçados em `app/components/auth/` com APIs fora do kit
(`:icon` inexistente em `UiInput`/`UiButton`, constante `COOKIE_EMAIL_LEMBRADO` não definida,
paleta teal fora da marca). Motivação completa: `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Tela `/admin/login` funcional que de fato gateia `/admin/**` com sessão fake (cookie fino),
  sobrevivendo a F5, 100% frontend.
- Reaproveitar a base `useUsuariosDemo` (16 usuários, `SENHA_DEMO`) como fonte de credenciais —
  sem duplicar dados.
- Adesar os 3 componentes `app/components/auth/` aos contratos do kit sem alterar nenhum
  componente de `app/components/ui/`.
- Documentação normativa `docs/08` + capability OpenSpec `login`.

**Non-Goals:**
- Backend real (JWT, HttpOnly, refresh, lockout, rate limit) — fase com `server/`.
- Página `/admin/esqueci-senha` (link só avisa "em breve").
- RBAC por perfil no frontend (`usePermissions`) — fica para quando houver sessão real.
- `useApiFetch` — não há API para chamar ainda.
- Alterar contrato visual de componentes do kit ou do shell (docs/01/docs/03 intocados).

## Decisions

### D1 — Sessão: cookie fino com id do usuário (não `useState` puro, não localStorage)
`useCookie<string|null>('auth-sessao')` guarda apenas o id da base demo (`u-001`...). O estado
reativo (`useState('auth-usuario')`) guarda o objeto logado; em F5 a guarda reidencia pelo cookie
consultando a base.
- *Por quê:* `useState` puro derruba a sessão a cada reload — inaceitável para QA e para o fluxo
  de redirect. `localStorage` não viaja para o SSR/middleware. Cookie via `useCookie` é lido no
  servidor e no cliente, alinhando hidratação, e já encosta no destino do `docs/02`
  (cookie `__Host-auth-token`), tornando a migração da fase 2 uma troca de conteúdo, não de
  mecanismo.
- *Descartado:* plugin de restore + middleware separado — o middleware já roda em toda navegação
  (inclusive SSR); restore nele elimina ordem de inicialização.

### D2 — Guarda: middleware global `app/middleware/auth.global.ts`
Um único middleware, conforme nome e papel do `docs/02` §5.3. Lógica:
```
to.path começa com /admin/login:
    logado? -> redirect /admin : allow
to.path começa com /admin:
    ensureSessao() (cookie -> base demo)
    sem sessao? -> redirect /admin/login?redirect=<to.fullPath>
else (Área Pública): allow
```
- *Por quê:* global cobre rotas futuras sem marcação por página (mantém o espírito do requisito
  de `layout-navigation` — a única exceção é o login, formalizada no delta da spec).
- *Sanitização do `?redirect=`:* só aceitar caminhos relativos iniciados em `/admin` e sem `//`
  (evita open redirect para domínio externo); inválido cai em `/admin`.

### D3 — Validação de credenciais no `useAuth.entrar()`, navegação na página
`entrar({ email, senha, lembrar })` devolve `boolean`; valida contra `useUsuariosDemo`
(email exato + `senha === SENHA_DEMO` + `status === 'Ativo'`), atualiza `ultimoAcesso` do registro
na base reativa (a Gestão de Usuários reflete o login sem esforço extra), grava cookie + estado e
aplica lembrar-me. Erro único genérico "E-mail ou senha inválidos." (toast `danger`) não revela
se o e-mail existe; Inativo recebe toast `warning` próprio. A página (`aoSubmeter`) é dona do
`loading` e do `navigateTo(redirect || '/admin')`.
- *Por quê:* separação estado (composable) x navegação (página) igual à relação
  página/`use*Demo` já usada nas telas admin; comparar senha com `===` é aceitável porque a senha
  demo é constante pública de demonstração (bcrypt só quando houver backend — pendência do
  docs/08).

### D4 — Foco no primeiro campo inválido via `$el`, sem tocar no kit
`UiInput` não expõe `focus()`. Em vez de adicionar `defineExpose` ao kit (muda docs/01/spec
`form-control-states`), o `LoginForm` resolve
`ref.value?.$el?.querySelector('input')?.focus()` — `$el` é parte da instância pública de qualquer
componente. Comportamento idêntico ao planejado, zero superfície nova no design system.
- *Descartado:* `defineExpose({ focus })` em `UiInput` — vira mudança de kit com custo
  documental desproporcional para um consumidor único.

### D5 — Constantes de cookie em `app/utils/cookies.ts`
`COOKIE_SESSAO = 'auth-sessao'` e `COOKIE_EMAIL_LEMBRADO = 'email-lembrado'` num único arquivo de
`app/utils/` (auto-importado pelo Nuxt 4, mesmo mecanismo de `app/utils/dataGrid.ts`), resolvendo
a referência quebrada em `LoginForm.vue`.
- *Por quê:* um ponto para renomear/evoluir os nomes quando o backend real definir
  `__Host-auth-token`.

### D6 — Página `admin/login.vue` com `layout: false`, dona da composição
A página monta `AuthBackground` (absolute, canvas), um container centralizado e o card branco
(`max-w-xs`, `rounded-xl`, `shadow-lg`, `p-8`) com `AuthLoginHeader` + `AuthLoginForm`. Passa ao
header a logomarca de `useLogomarcaLogin` (`preview || caminho`) e o subtítulo "Área
Administrativa"; ao formulário o `loading`. O cabeçalho exibe a identidade no lugar do título
"Dicas Teorema": a logomarca quando personalizada, senão a marca padrão do sistema (ícone
`Building2` + nome "Publications", como o `AppHeader`), com o subtítulo abaixo nos dois casos
(ajuste pós-implementação, refletido na spec `login`). Entre eles, divisor `h-px bg-brand-focus`
(`#1a9e07`, `role="separator"`) separa a identidade do formulário (ajuste pós-implementação).
Escuta `@submit`, chama `entrar`, navega.
- *Por quê:* `layout: false` é o padrão já usado fora do shell (`/design`, `error.vue`); a página
  é o único consumidor do trio de auth hoje — um `layouts/login.vue` só faria sentido com a
  página de esqueci-senha no mesmo layout (futura).

### D7 — `AuthBackground` retintado para a paleta brand
Mapeamento da arte existente (estrutura preservada, cor trocada):
| Elemento | Hoje | Passa a |
|---|---|---|
| Gradiente de fundo | `#071019 → #040b14 → #02070d` | navy derivado de `#112051` escurecido (`#0b1330 → #070d22 → #040814`) |
| Paleta dos anéis/pontos | teal/ciano | `['#0364f7', '#50a1ff', '#4ed813', '#1a9e07', '#0364f7']` |

`prefers-reduced-motion`, pausa por `visibilitychange` e resize já estão implementados —
preservados sem alteração.

**Onda no fundo (ajuste pós-implementação):** cada anel emite uma onda sonar (ripple
expansiva na cor do anel) a cada 1,4-2,2 s na posição corrente; a frente de onda desloca até
10 px e acende os pontos do campo (`ONDA_LARGURA = 48`) - o campo de pontos passou a ser
redesenhado por quadro (gradiente continua pré-renderizado). `prefers-reduced-motion` segue
congelando a arte (sem ondas).

### D8 — `AppHeader` deriva o bloco Account da sessão
`const { usuario } = useAuth()`; nome/perfil/iniciais passam a vir de `usuario`, com fallback
para o `conta` atual de `config/navigation.ts` (segurança caso o componente renderize fora de
sessão). "Encerrar Sessão" ganha handler: `sair()` (limpa estado + cookie) + `navigateTo('/admin/login')`.
A estrutura e a ordem do menu (spec `layout-navigation`) não mudam.

## Risks / Trade-offs

- **QA das 5 telas admin passa a exigir login (BREAKING operacional)** → credenciais demo
  (`ana.carolina@empresa.com.br` / `Public@2026`) documentadas em destaque no `docs/08`; a
  mudança é anunciada na proposta e é exatamente o comportamento desejado ("logar na área
  administrativa").
- **Cookie sem `HttpOnly`/`Secure` (inherente a cookie de cliente)** → aceito na fase 1: o cookie
  só contém um id opaco de demo, não token; a pendência de endurecimento consta do `docs/08` como
  primeira tarefa da fase backend.
- **Comparação de senha em texto puro** → aceitável porque `SENHA_DEMO` é constante pública de
  demonstração; nenhum hash é simulado para não criar falsa sensação de segurança — pendência
  backend documentada.
- **SSR: base demo é recriada por request** → a restauração consulta a semente determinística
  (`USUARIOS`), então o id do cookie sempre resolve; se um id não existir, é tratado como sem
  sessão (cenário "cookie órfão" da spec).
- **`?redirect=` pode ser explorado para open redirect** → sanitização estrita (D2): somente
  caminhos `/admin...` sem `//`.
- **Retint do canvas muda uma arte já aceita pelo usuário** → paleta e estrutura aprovadas na
  exploração; o canvas continua sendo arte decorativa (`aria-hidden`, `pointer-events-none`), sem
  dependência funcional.

## Migration Plan

Sem deploy/config externa: `npm run build` é o gate; rollback = reverter os commits da change
(middleware, composable e página são aditivos — removê-los devolve o comportamento atual de acesso
livre). Na fase backend, a migração é incremental: `COOKIE_SESSAO` → `__Host-auth-token`,
`entrar()` → `POST /api/auth/login`, guarda ganha refresh — sem mudar a rota, a página nem o
formulário.

## Open Questions

Nenhuma que afete specs, abordagem ou quebra de tarefas — todas as decisões de escopo foram
fechadas na exploração com o usuário (cookie fino, retint brand, header derivado da sessão,
"esqueci a senha" com toast, rota `/admin/login`).
