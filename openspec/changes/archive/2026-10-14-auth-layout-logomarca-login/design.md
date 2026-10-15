# Design

## Context

- `useLogomarcaLogin()` (`app/composables/useLogomarcaLogin.ts`) é `useState` **em memória**, iniciando vazio — o comentário "Fase 1" no próprio arquivo documenta que recarregar a página restaura a marca padrão.
- A hidratação real existe e é compartilhada: `carregarConfiguracoesGlobais()` (`app/composables/useConfiguracoesGlobais.ts`) faz `GET /api/configuracoes` e aplica logos/sidebar/sessões no estado. Hoje só é chamada por `app/layouts/admin.vue` (`onMounted`) e por `app/pages/admin/configuracoes-globais.vue`.
- **Premissa corrigida durante a implementação:** o handler `GET /api/configuracoes` não tem auth própria, mas o middleware global `server/middleware/auth-api.ts` exige sessão válida para **todo** `/api/**` (exceto `/api/auth/*`) — o visitante anônimo do login recebe `401 "Sem sessão ativa"` (verificado ao vivo no dev). O loader completo portanto **não** serve às telas de autenticação; a hidratação delas precisa de um endpoint público mínimo (ver D2).
- `AuthLoginHeader` (`app/components/auth/LoginHeader.vue`) renderiza `<img v-if="logo">` ou, sem logo, `Building2` + "Publications" — o fallback que o visitante vê hoje.
- A guarda `app/middleware/auth.global.ts` já libera as duas rotas sem sessão; o layout não altera essa regra (guarda é por path, independente de layout).
- Conforme proposal.md: nenhuma spec muda — as specs `login` e `design-system/layout-navigation` já descrevem o comportamento alvo; isto é bugfix + refatoração.

## Goals / Non-Goals

**Goals:**
- Hidratar a logomarca do login em **todo** carregamento das telas de autenticação, inclusive acesso direto/F5/aba anônima, **já no primeiro paint** (sem flash da marca padrão).
- Eliminar a duplicação da composição das telas de autenticação num único ponto (`app/layouts/auth.vue`), alinhado ao que `design-system/layout-navigation` chama de "layout próprio" das telas de autenticação.
- Zero regressão visual: classes copiadas idênticas das páginas atuais.

**Non-Goals:**
- Alterar specs, migrations de banco, tokens, `AuthBackground`, `AuthLoginHeader`, `AuthLoginForm` ou `AuthForgotForm`.
- Tocar no fluxo de sessão, guarda de rotas ou rate limit.
- Expor o `GET /api/configuracoes` completo sem sessão (a exemption é **somente** para `/api/configuracoes/identidade`; o restante da linha — retenção, flags, banners, sidebar — permanece protegido).
- Estender a hidratação a qualquer rota fora das telas de autenticação (o shell `admin` já cuida das suas).

## Decisions

### D1 — Layout `auth` com `await` no `<script setup>` (não `onMounted`, não await nas páginas)

O novo `app/layouts/auth.vue` chama `await carregarIdentidadeLogin()` no topo do `<script setup>` (loader leve do D2 — o loader completo exigiria sessão e devolveria 401 para o visitante anônimo); as páginas declaram `definePageMeta({ layout: 'auth' })` e perdem `layout: false`.

- **Por que layout e não await duplicado nas duas páginas:** uma única fonte de hidratação; a duplicação da composição foi exatamente o que propagou o defeito para as duas telas. Navegação login ↔ esqueci-senha mantém o mesmo layout montado (monta uma vez por entrada no shell de auth).
- **Por que await de setup e não `onMounted`:** com `onMounted` o visitante veria primeiro "Publications" e a logo "pularia" depois (flash da marca errada). Await de setup atrasa o paint até o GET responder; com SSR (default ligado neste projeto — `nuxt.config.ts` não declara `ssr: false`), o HTML já sai do servidor com a logo.
- **Alternativa descartada — middleware:** `auth.global.ts` roda em **toda** navegação; esconder carga de config ali exigiria checagem de path e revalidação de estado, mais acoplamento que um layout cujo propósito é exatamente envolver essas rotas.
- **Fallback técnico (risco R1):** se o await de topo em layout gerar warning de async setup/Suspense nesta versão do Nuxt, o plano B é `useAsyncData(() => carregarIdentidadeLogin(), { immediate: true })` no mesmo layout — mesma semântica de first-paint, registrada na task de verificação.

### D2 — Endpoint público mínimo de identidade + loader leve (revisado após o 401 ao vivo)

A premissa original ("reusar `carregarConfiguracoesGlobais()`") foi invalidada na implementação: `server/middleware/auth-api.ts` bloqueia `GET /api/configuracoes` para quem não tem sessão. A decisão revisada:

- **Servidor:** novo `GET /api/configuracoes/identidade` (`server/api/configuracoes/identidade/index.get.ts`) devolvendo **somente** `{ logo_login_url }` (via `getConfiguracoes()` existente) + uma linha de exemption em `auth-api.ts` para esse caminho. Menor exposição possível: o caminho da logo é informação que a própria tela de login precisa exibir, e o arquivo já é servido publicamente via `nitro.publicAssets` (`/uploads/**`).
- **Cliente:** novo `carregarIdentidadeLogin()` (em `app/composables/useLogomarcaLogin.ts`, dono do estado que hidrata) — `GET` via `useApiFetch`, escreve em `caminho`/`preview`, `catch` silencioso mantém a marca padrão (mesma semântica de falha do loader completo).
- **Alternativas descartadas:** exempt do `GET /api/configuracoes` inteiro (vazaria `dias_retencao_auditoria`, `exigir_revisao_para_publicar`, `notificar_por_email`, banners e preferências de sidebar ao anônimo — least privilege impede); endpoint sob `/api/auth/identidade` (sob a exemption já existente, mas semanticamente é configuração de identidade, não fluxo de autenticação — manter sob `/api/configuracoes/` com exemption explícita é mais legível).
- O loader completo `carregarConfiguracoesGlobais()` permanece intacto para o shell `admin` e a página de configurações (com sessão).

### D3 — Divisão de dono: layout = fundo/container/card/cabeçalho/divisor; página = formulário

- Template do layout copia **byte a byte** as classes atuais das páginas (`relative min-h-dvh overflow-hidden bg-[#070d22]`, `w-full max-w-xs rounded-xl bg-white p-8 shadow-lg`, divisor `h-px bg-brand-focus` com `role="separator"`) e renderiza `<AuthLoginHeader subtitulo="Área Administrativa" :logo="logo" />` + `<slot />`.
- O subtítulo fica **fixo** no layout: é idêntico nas duas telas hoje e a spec `login` o define canonicamente ("Área Administrativa" em ambos os casos). Se um dia divergir, promove-se a prop com default.
- `login.vue` mantém todo o estado de `carregando`/`aoSubmeter`/redirect; `esqueci-senha.vue` fica com só o template do `AuthForgotForm`. O import de `useLogomarcaLogin` sai das duas páginas (dono = layout).
- `logo = preview || caminho` (mesma expressão das páginas hoje, preservando o preview de upload em sessão).

### D4 — Conformidade sem delta de spec; docs/08 espelha a nova estrutura

- A mudança **não** altera requirement: `login` já cobra a logomarca nas telas de autenticação (cenário "Logomarca da tela acompanha as configurações" cobre acesso direto) e `layout-navigation` já fala em "layout próprio". Por isso `skip_specs: true` no `.openspec.yaml`.
- `docs/08` §1 passa a citar `layout: 'auth'` (mantendo a nota "únicas rotas sob `/admin/**` sem shell") e §2 passa a atribuir Fundo/Container/Card/Cabeçalho/Divisor a `app/layouts/auth.vue`, com a linha de que o layout hidrata `GET /api/configuracoes/identidade` (endpoint público mínimo) no setup.

## Risks / Trade-offs

- **[R1] Await de topo em layout x Suspense no Nuxt 4** → verificação obrigatória em dev antes de fechar a implementação (task 5.1); sem warning e com HTML saindo já com a logo = aprovado; com warning, aplicar o fallback `useAsyncData` de D1.
- **[R2] Latência do DB no primeiro paint do login** → o GET é público e leve (uma linha de `configuracoes_globais`); em falha o próprio loader cai para defaults (marca padrão) sem quebrar a tela — comportamento previsto em spec. Esperar dezenas de ms é preferível a exibir a marca errada.
- **[R3] Hydration mismatch SSR ↔ cliente** → o `useState` é serializado no payload do SSR; cliente parte do mesmo valor, sem divergência. Mesmo cenário já ocorre hoje no shell `admin`.
- **[R4] Regressão visual na composição** → classes copiadas idênticas; conferência manual obrigatória nas duas rotas, desktop e 375px (task 5.2), comparando com o comportamento atual.
- **[R5] Exemption no `auth-api.ts`** → restrita ao prefixo `/api/configuracoes/identidade`; o retorno é um único campo (`logo_login_url`) já não-sensível (o arquivo da logo é público via `publicAssets`). Qualquer ampliação futura da exemption deve passar por revisão de segurança.
- **[R6] Quebra futura do loader completo exigir sessão** → já é o caso hoje; o loader leve é independente (`useLogomarcaLogin.ts`) e não depende do payload completo, então mudanças de proteção em `/api/configuracoes` não afetam o login.

## Migration Plan

Sem migrations de banco, migrations de código ou feature flags — mudança de front + um endpoint GET novo (sem mudança de schema), entregue num commit único e revertível por `git revert`. Deploy = build comum (`npm run build`); rollback = reverter o commit e redeployar.

## Open Questions

_Nenhuma — as decisões acima fecham o caminho de implementação; o único ponto técnico em aberto (R1) é coberto por verificação e fallback já definidos, sem impactar escopo, specs ou o breakdown de tasks._
