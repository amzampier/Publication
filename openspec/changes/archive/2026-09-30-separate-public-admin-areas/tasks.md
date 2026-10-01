# Tasks — separate-public-admin-areas

## 1. Layouts

- [x] 1.1 Criar `app/layouts/admin.vue` movendo para lá o shell de `app/layouts/default.vue`
      (estado `sidebarOpen`, `<LayoutAppHeader>`, `<LayoutAppSidebar>`, `<main>` e seus estilos);
      verificar com `npm run build` e conferindo que `default.vue` não contém mais
      `LayoutAppHeader`/`LayoutAppSidebar`.
- [x] 1.2 Reescrever `app/layouts/default.vue` como layout da Área Pública (apenas `<Slot/>` sobre
      o fundo App Canvas `bg-slate-50`, sem header/sidebar); verificar com `npm run build` e grep
      confirmando zero referências a componentes de shell no arquivo.
- [x] 1.3 Atualizar `docs/03 - Header e Sidebar.md` §1 e §11: registrar os dois layouts
      (`admin.vue` = shell em `/admin/**`, `default.vue` = público), a convenção
      `definePageMeta({ layout: 'admin' })` e dar como resolvida a pendência de fronteira de áreas;
      verificar que as seções citam os dois caminhos de layout.

## 2. Páginas das duas áreas

- [x] 2.1 Criar `app/pages/admin/index.vue` com `definePageMeta({ layout: 'admin' })` contendo o
      placeholder "Painel Executivo" movido de `app/pages/index.vue`; verificar com
      `npm run build` + requisição a `http://localhost:3000/admin` retornando o shell completo
      (header + sidebar com o item raiz "Painel Executivo" fora do conteúdo).
- [x] 2.2 Reescrever `app/pages/index.vue` como placeholder da Área Pública (título/texto da área,
      sem shell); verificar com requisição a `http://localhost:3000/` confirmando ausência de
      toggle, sino, avatar e sidebar, e presença do placeholder público.
- [x] 2.3 Atualizar `docs/01 - design_system.md` §3 para identificar o shell pela rota `/admin`
      (hoje §3 diz "área atual evidente pela rota e pelo layout"); verificar que §3 menciona
      explicitamente `/admin`.

## 3. Verificação integrada

- [x] 3.1 `npm run build` completa sem erro.
- [x] 3.2 Adaptar `verify-nav.mjs` para as três rotas: `/` sem nenhum controle administrativo
      (0 toggles/0 sino/0 avatar/0 sidebar), `/admin` com shell completo (árvore
      Publicações/Cadastros/Administração + item raiz + menu Account com 6 itens/2 divisores) e
      `/design` intacto (seção 14 com `layout: false`); executar e obter todos os checks em PASS.
- [x] 3.3 `openspec validate` do change (planning) e `openspec validate --specs` (specs principais)
      passarem.
