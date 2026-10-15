# Proposal

## Why

A tela de login não exibe a logomarca configurada em Configurações > Logomarcas quando o visitante chega por acesso direto (URL digitada, F5, aba anônima): a hidratação `GET /api/configuracoes` acontece apenas no layout `admin` (`onMounted`) e na página de configurações, mas as telas de autenticação usam `definePageMeta({ layout: false })` e nunca buscam a logo — o `useState` de `useLogomarcaLogin` inicia vazio e o `AuthLoginHeader` cai na marca padrão ("Publications"). A implementação diverge dos requirements já existentes das specs `login` ("logomarca escolhida em Configurações > Logomarcas… ou marca padrão") e `design-system/layout-navigation` ("telas de autenticação… com layout próprio"). A duplicação da composição (fundo + card + cabeçalho + divisor) entre `/admin/login` e `/admin/esqueci-senha` é a razão estrutural do defeito ter aparecido nas duas telas.

## What Changes

- Novo layout `app/layouts/auth.vue` que unifica a composição das telas de autenticação (fundo `AuthBackground`, card centralizado, `AuthLoginHeader` com logo de `useLogomarcaLogin`, divisor) e hidrata a identidade do login no `<script setup>` — a logo já está no primeiro paint (sem flash da marca padrão), inclusive no HTML do SSR.
- **Correção de premissa descoberta na implementação:** o `GET /api/configuracoes` completo é bloqueado para o visitante anônimo pelo middleware `server/middleware/auth-api.ts` (exige sessão em todo `/api/**` exceto `/api/auth/*`). Portanto a hidratação do login usa um novo **endpoint público mínimo** `GET /api/configuracoes/identidade` (retorna somente `{ logo_login_url }`, com linha de exemption no `auth-api.ts`) consumido pelo novo loader leve `carregarIdentidadeLogin()` — o restante da configuração continua protegido.
- `/admin/login` e `/admin/esqueci-senha` passam de `layout: false` para `layout: 'auth'` e ficam donas apenas do próprio formulário (`AuthLoginForm` / `AuthForgotForm`); o import e o estado local de logo saem das páginas (donos agora são o layout).
- Atualização de `docs/08 - Login de Autenticação.md` (§1 rota/layout, §2 estrutura — fundo/container/card/cabeçalho/divisor passam a ser dono do layout `auth`).
- Bugfix de comportamento já coberto por spec: acesso direto/F5 em `/admin/login` e `/admin/esqueci-senha` com logomarca salva exibe aquela logomarca (hoje só exibe após passar por uma rota `/admin/**` com shell na mesma sessão SPA).

## Capabilities

### New Capabilities

_Nenhuma — a mudança não introduz comportamento novo._

### Modified Capabilities

_Nenhuma — os requirements já existentes descrevem o comportamento alvo:_

- `login` já exige a identidade com "a logomarca escolhida em Configurações > Logomarcas (`useLogomarcaLogin`, preview ou caminho) quando personalizada, ou — sem personalização — a marca padrão do sistema" nas telas de autenticação (cenário "Logomarca da tela acompanha as configurações" cobre o acesso direto).
- `design-system/layout-navigation` já formaliza as rotas de autenticação como "rotas sob `/admin/**` sem o shell com **layout próprio**".

A mudança é correção de implementação (bugfix) + refatoração de composição + documentação: o código passa a estar em conformidade com as specs; nenhum texto de requirement muda. Por isso o change declara `skip_specs: true`.

## Impact

- **Código:** `app/layouts/auth.vue` (novo), `app/pages/admin/login.vue`, `app/pages/admin/esqueci-senha.vue`, `app/composables/useLogomarcaLogin.ts` (novo loader leve `carregarIdentidadeLogin()`).
- **API:** novo endpoint público `GET /api/configuracoes/identidade` (`server/api/configuracoes/identidade/index.get.ts`) retornando **somente** `{ logo_login_url }` — dispensa de sessão para esse caminho em `server/middleware/auth-api.ts`; `GET /api/configuracoes` completo permanece protegido.
- **Docs:** `docs/08 - Login de Autenticação.md` (§1 rota/layout, §2 estrutura — fundo/container/card/cabeçalho/divisor passam a ser dono do layout `auth` + endpoint público de identidade).
- **Sem mudança de specs, migrations, tokens de design ou componentes do kit** (`AuthLoginHeader`/`AuthBackground` permanecem intactos).
- **Risco de regressão:** baixo e visual — classes da composição são copiadas idênticas das páginas atuais; verificação manual em `/admin/login` e `/admin/esqueci-senha` (desktop e 375px) + `npm run build`.
