# Proposal — separate-public-admin-areas

## Why

`docs/02 - Guia de Arquitetura` §2.1 define que a **raiz é Área Pública** (leitura anônima de Releases,
Manuais e Escopos) e que a **Área Administrativa vive em `/admin/**`** — mas na prática o shell
administrativo (Header Dark + Sidebar) renderiza em `localhost:3000/`, porque não existe
`app/pages/admin/` e o layout `default` é aplicado a todas as páginas. A fronteira entre as áreas está
invertida e é apenas visual: qualquer visitante da raiz vê o painel administrativo. Esta mudança
corrigige o lugar de cada layout, sem tocar em autenticação.

## What Changes

- **BREAKING (rotas)** — o shell administrativo deixa de renderizar em `/` e passa a renderizar em
  **`/admin`**: o layout `default` deixa de ser o shell.
- **`app/layouts/admin.vue` (novo)** — recebe o shell atual (LayoutAppHeader + LayoutAppSidebar +
  área de conteúdo), movido de `app/layouts/default.vue`.
- **`app/layouts/default.vue` (reescrito)** — vira o layout da **Área Pública**: apenas conteúdo com
  fundo App Canvas (`#f8fafc`), **sem header e sem sidebar**.
- **`app/pages/admin/index.vue` (novo)** — tela inicial da Área Administrativa (placeholder "Painel
  Executivo", hoje em `/`), com `definePageMeta({ layout: 'admin' })`. **Convenção:** toda página em
  `app/pages/admin/**` declara `layout: 'admin'` (Nuxt não seleciona layout por prefixo de rota).
- **`app/pages/index.vue` (reescrito)** — passa a ser o placeholder da **Área Pública**, sem shell.
- **Documentação** — `docs/03 - Header e Sidebar.md` §1 e §11 (pendência de fronteira resolvida +
  seção dos layouts) e `docs/01 - design_system.md` §3 (o shell identifica-se pela rota `/admin`).
- **Sem mudança** no conteúdo dos layouts de shell: header, sidebar, navegação, vitrine §14, tokens e
  componentes `ui/` permanecem idênticos.

## Capabilities

### New Capabilities
*(nenhuma)*

### Modified Capabilities
- `design-system/layout-navigation`: novos requisitos sobre a **fronteira por rota** — o shell
  administrativo só é exibido sob `/admin/**`, a rota raiz renderiza a Área Pública sem o shell, e
  `/design` continua sem shell (`layout: false`).

## Impact

- **Código:** `app/layouts/admin.vue` (novo), `app/layouts/default.vue`, `app/pages/admin/index.vue`
  (novo), `app/pages/index.vue`. Intocados: `AppHeader.vue`, `AppSidebar.vue`, `config/navigation.ts`,
  `design.vue`, `app.vue`, componentes `ui/`.
- **Documentação:** `docs/03` §1/§11, `docs/01` §3.
- **Especificação:** delta em `design-system/layout-navigation` (spec principal já existente).
- **Sem impacto** em servidor, banco, API, dependências ou tokens — **sem autenticação** (a guarda
  JWT/RBAC de `docs/02` §2.1/§3 continua fora do escopo, num change próprio).
- **Conhecido e aceito:** os itens da sidebar ainda não têm rota (`itemAtivo` é mock — clicar marca,
  não navega); só existe a tela `/admin`. A Área Pública continua sem conteúdo real.
