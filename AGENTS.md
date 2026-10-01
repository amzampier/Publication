# AGENTS.md

## What this repo is

Fresh Nuxt 4.5.2 + Vue 3 starter named `Publications` (single package, not a monorepo).
The README is stock Nuxt boilerplate: it lists pnpm/yarn/bun, but the repo uses **npm**
(`package-lock.json`, lockfileVersion 3). Ignore the README's package-manager variants.

Dependencies beyond Nuxt/Vue/router: `@nuxtjs/tailwindcss` (styling) and `@lucide/vue` (icons,
imported as named components, e.g. `import { Bell } from '@lucide/vue'`). No test, lint, format,
state-management, auth, or DB tooling exists yet — don't assume any of it.

## Commands

- `npm install` — `postinstall` runs `nuxt prepare`, which generates `.nuxt/`
- `npm run dev` — dev server at `http://localhost:3000`
- `npm run build` — the **only** real verification step; there is no lint/test/typecheck script
- `npm run generate` / `npm run preview`
- Type check (optional): `npx nuxt typecheck`. No checker is installed, so it exits 1 with
  install instructions until you `npm i -D vue-tsc typescript`
- Node must match nuxt's `engines`: `^22.19.0 || ^24.11.0 || >=26.0.0`. No `.nvmrc`.

## Directory layout (Nuxt 4 rules — differs from Nuxt 3)

- `app/` is the srcDir: `app.vue` lives there, and so must `app/pages/`, `app/components/`,
  `app/composables/`, `app/layouts/`, `app/plugins/` (Nuxt 3 root-level `pages/` style is wrong here)
- `server/` (API routes) and `shared/` (shared types/utils) go at the **repo root** — neither exists yet
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
  `app/components/layout/*` (`AppHeader`, `AppSidebar` — shell de `app/layouts/default.vue`).
  Nunca crie botão/campo/tooltip paralelos. A vitrine `app/pages/design.vue` (seções 1-15,
  `layout: false`) deve espelhar os componentes reais.
- **Cores (tokens `brand.*` em `tailwind.config.js`):**
  - foco/abertura de controle = `brand-focus` `#1a9e07` — nunca `lime-500`
  - erro/validação = `rose-700` `#be123c` (overlay, label e ícone) — nunca `rose-500/600` nem `#b91c1c`
  - accent = `brand-accent` `#4ed813` — nunca `lime-400`
  - degradê só no `Button variant="primary"` e no header do modal; demais superfícies sólidas
- **Foco/erro recortado:** overlay `absolute -inset-[1px] rounded-lg border-2` com a classe
  `.ds-bottom-clip` (definida em `app/assets/css/main.css`, servida graças ao
  `tailwindcss.cssPath` em `nuxt.config.ts` — não remova essa linha; sem ela o CSS some em silêncio).
- **Tipografia:** valores de `Input`/`Select`/`DatePicker` em `font-normal` (campo `mono` em
  `font-medium`); menu da conta em `font-light`; rótulos/legendas em `font-medium`.
- **Verificação:** `npm run build` + conferência visual em `http://localhost:3000/design`
  (não existe lint/test — a build e o olho são o gate).

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
- `nuxt.config.ts` is minimal (`compatibilityDate: '2025-07-15'`, devtools, tailwind module only).
  New Nuxt features go here as `modules` entries.
- `.env` / `.env.*` are gitignored (`!.env.example` allowed, but no `.env.example` exists yet);
  no environment variables are read anywhere yet.
