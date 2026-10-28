# AGENTS.md

## What this repo is

`Publications` (Dicas Teorema) — Nuxt 4.5.2 + Vue 3 (single package, not a monorepo). Single-tenant app with an anonymous Public Area and an authenticated Administrative Area (RBAC).
The README is stock Nuxt boilerplate: it lists pnpm/yarn/bun, but the repo uses **npm**
(`package-lock.json`, lockfileVersion 3). Ignore the README's package-manager variants.

Dependencies beyond Nuxt/Vue/router: `@nuxtjs/tailwindcss` (styling), `@lucide/vue` (icons,
imported as named components, e.g. `import { Bell } from '@lucide/vue'`), `mysql2/promise` (MariaDB,
raw SQL — no ORM), `bcrypt` + `jose` (auth) and `resend` (e-mail). Lint/test/typecheck gates exist
(`eslint.config.mjs`, `tests/`, `vitest.config.ts`) — see Commands.

## Commands

- `npm install` — `postinstall` runs `nuxt prepare`, which generates `.nuxt/`
- `npm run dev` — dev server at `http://localhost:3000`
- `npm run build` — build gate (empacota o app; a verificação estrutural)
- `npm run lint` — ESLint (flat config em `eslint.config.mjs`) — **gate**
- `npm run test` — Vitest (`tests/`, ambiente node) — **gate**
- `npm run typecheck` — `nuxt typecheck` (vue-tsc, estrito) — **gate**.
- `npm run generate` / `npm run preview`
- Node must match nuxt's `engines`: `^22.19.0 || ^24.11.0 || >=26.0.0`. No `.nvmrc`.

## Directory layout (Nuxt 4 rules — differs from Nuxt 3)

- `app/` is the srcDir: `app.vue` lives there, and so must `app/pages/`, `app/components/`,
  `app/composables/`, `app/layouts/`, `app/plugins/` (Nuxt 3 root-level `pages/` style is wrong here)
- `server/` (API routes, utils, migrations, plugins, middleware) and `shared/` (shared types/utils) live at the **repo root**
- `public/` (static assets) and config files (`nuxt.config.ts`, `tailwind.config.js`,
  `tsconfig.json`) stay at the root
- Aliases: `~` and `@` → `app/`, `~~` and `@@` → repo root, plus `#server`, `#shared`, `#app`

## Design system — seguir sempre

- **Fonte da verdade (visual):** [`docs/01 - design_system.md`](docs/01%20-%20design_system.md) —
  cores, tipografia, espaçamento, estados e o que cada componente faz. Toda mudança visual
  atualiza a seção correspondente desse arquivo no mesmo change.
- **Fonte da verdade (comportamento):** `openspec/specs/design-system/*` (`brand-tokens`,
  `form-control-states`) — valide com `openspec validate --specs`. Mudança de comportamento
  passa pelo fluxo OpenSpec (`/opsx-propose` → apply → `/opsx-sync` → `/opsx-archive`).
- **Componentes:** use sempre `app/components/ui/*` (auto-import `Ui*`) e
  `app/components/layout/*` (`AppHeader`, `AppSidebar` — shell de `app/layouts/admin.vue`; `app/layouts/default.vue` é o layout da Área Pública).
  Nunca crie botão/campo/tooltip paralelos. A vitrine `app/pages/design.vue` (seções 1-29,
  `layout: false`) deve espelhar os componentes reais, incluindo o shell público e o Painel de
  Destaques da Área Pública.
- **Cores (tokens `brand.*` em `tailwind.config.js`):**
  - foco/abertura de controle = `brand-focus` `#1a9e07` — nunca `lime-500`
  - erro/validação = `rose-700` `#be123c` (overlay, label e ícone) — nunca `rose-500/600` nem `#b91c1c`
  - accent = `brand-accent` `#4ed813` — nunca `lime-400`
  - degradê só no `Button variant="primary"`, no header do modal, na trilha/barra preenchida do
  `UiSlider`/`UiLoading` (`#112051` → `#0364f7` → `#4ed813`), no card de resumo do Meu Perfil
  (`brand-structure` diluído → branco, vertical) e no hero do Painel de Destaques da Área Pública
  (`from-brand-primary via-slate-950 to-indigo-950`); demais superfícies sólidas
- **Foco/erro recortado:** overlay `absolute -inset-[1px] rounded-lg border-2` com a classe
  `.ds-bottom-clip` (definida em `app/assets/css/main.css`, servida graças ao
  `tailwindcss.cssPath` em `nuxt.config.ts` — não remova essa linha; sem ela o CSS some em silêncio).
- **Tipografia:** valores de `Input`/`Select`/`DatePicker` em `font-normal` (campo `mono` em
  `font-medium`); menu da conta em `font-light`; rótulos/legendas em `font-medium`.
- **Verificação:** `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` (gates) + conferência visual em `http://localhost:3000/design`.

## Gotchas worth knowing before you edit

- `app/app.vue` renders `<NuxtRouteAnnouncer />` + `<NuxtLayout><NuxtPage /></NuxtLayout>` (the stock
  `<NuxtWelcome />` is gone; without `<NuxtLayout>` the shell in `app/layouts/` silently never renders
  — NUXT_E4007). Pages live in `app/pages/`; `/design` opts out of the shell with
  `definePageMeta({ layout: false })`.
- `.nuxt/` is generated and gitignored; the root `tsconfig.json` only contains references to
  `.nuxt/tsconfig.*.json`. After a clean checkout or deleting `.nuxt/`, run `npx nuxt prepare`
  or TypeScript/editor resolution breaks.
- Tailwind is wired via the `@nuxtjs/tailwindcss` module in `nuxt.config.ts`; the module injects
  content globs itself. The empty `content: []` in root `tailwind.config.js` is normal — don't
  "fix" it by hardcoding paths.
- `nuxt.config.ts` has grown past "minimal": `runtimeConfig` (DB_*), `nitro.publicAssets` and
  `nitro.hooks.compiled` and `routeRules` live there — see comments in the file before touching it.
- Uploads go to `uploads/<pasta>/` at the project root (gitignored; `.gitkeep` keeps the
  structure), served at runtime via `nitro.publicAssets` (`/uploads/**`) in both dev and
  production. Do NOT put runtime uploads in `public/uploads/` — `public/` is copied only at
  build time, so files created while the app runs would be invisible in production.
- `.env` / `.env.*` are gitignored; `.env.example` exists and is committed (`!.env.example`). The
  app reads `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` (see `runtimeConfig` in
  `nuxt.config.ts`; defaults target `publications` on localhost:3306). Dev requires MariaDB 11.8+
  running locally: the Nitro plugin `server/plugins/migration.ts` provisions the schema from
  `server/migration/*.sql` on boot and bootstraps the admin user — if MariaDB is down or
  unreachable, `npm run dev`/production boot fails fast by design.

- **Trilha imutável (RL06-3):** a migration 32 cria gatilhos que rejeitam UPDATE/DELETE em uditoria e historico_esteira_revisao; o expurgo da auditoria usa @rl06_permitir_auditoria no EVENT. O rollback está documentado no SQL. O runner aceita DELIMITER para blocos de trigger/event.\n
- **Publicação efetiva (B-05):** publicado_em é o gate público; status Publicado sozinho não expõe conteúdo agendado. A migration 33 adiciona/backfilla o carimbo nas quatro tabelas. Não reintroduza comparações de data_publicacao/data_liberacao nas leituras públicas sem o carimbo.

- **Segurança HTTP (RL06):** headers globais/CSRF e rate limit persistente. Escritas por cookie exigem Origin/Referer same-origin ou `X-CSRF-Token`; o contador vive em `rate_limit_contadores` (migration 34) com fallback local.

- **Busca e entrega (escalar):** FULLTEXT cobre Chamadas/Auditoria/Usuários (migration 35; termos 3+), CSV de exportação usa streaming e assets /_nuxt/** têm cache imutável. Não reintroduza LIKE '%termo%' nesses campos sem avaliar o índice.
