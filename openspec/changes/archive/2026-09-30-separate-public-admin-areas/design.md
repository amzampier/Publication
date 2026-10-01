# Design — separate-public-admin-areas

## Context

Hoje o shell (Header Dark + Sidebar) vive em `app/layouts/default.vue`, que o Nuxt aplica a toda
página sem `layout` próprio; `app/pages/` só tem `index.vue` e `design.vue` (esta com
`layout: false`). Não existe `app/pages/admin/`. Motivação e escopo estão em `proposal.md`;
os requisitos observáveis, em `specs/design-system/layout-navigation/spec.md` (delta desta change).
`app/app.vue` já renderiza `<NuxtLayout><NuxtPage /></NuxtLayout>`, então trocar de layout por página
funciona sem tocar nele.

## Goals / Non-Goals

**Goals:** mapear rotas → áreas conforme `docs/02` §2.1 (raiz = Área Pública, `/admin/**` = Área
Administrativa); manter o shell idêntico ao atual (mesmos componentes, tokens e comportamento);
garantir um padrão seguro: página sem decisão explícita nunca exibe chrome administrativo.

**Non-Goals:** autenticação/JWT/RBAC/middleware; rotas ou conteúdo real da Área Pública; fazer os
itens da sidebar navegarem (`itemAtivo` segue mock); redirects; qualquer mudança em servidor/API;
mudanças visuais no shell ou na vitrine.

## Decisions

### D1 — Shell vai para `app/layouts/admin.vue`; `default.vue` vira o layout público
O shell inteiro (refs de estado, `<LayoutAppHeader>`, `<LayoutAppSidebar>`, `<main>`) é movido para
`admin.vue`; `default.vue` passa a ser apenas `<slot />` sobre o fundo App Canvas.
**Por quê:** `default` é o layout implícito do Nuxt — fazê-lo ser o público significa que uma página
que "esquecer" o meta renderiza **sem** chrome (falha segura: nunca vaza o painel administrativo).
**Alternativa descartada:** manter o shell no `default` e criar um `public.vue` — aí toda página
pública futura teria que se declarar, e o esquecimento vaza o shell, que é exatamente o bug atual.

### D2 — Seleção de layout por `definePageMeta({ layout: 'admin' })` em cada página admin
O Nuxt escolhe layout apenas por `definePageMeta` ou `<NuxtLayout>` — não há seleção automática por
prefixo de rota. **Por quê:** declaração estática, uma linha, analisável e documentável como convenção
(`docs/03` §11). **Alternativa descartada:** plugin/middleware que troca o layout conforme a rota —
lógica em runtime, corrida com a hidratação e invisível na leitura da página.

### D3 — Home administrativa em `/admin`, sem redirect na raiz
O placeholder "Painel Executivo" vira `app/pages/admin/index.vue` (rota `/admin`). A raiz `/` não
redireciona para lugar nenhum: ela **é** a Área Pública (placeholder próprio). **Por quê:** redirect
configuraria comportamento de autenticação sem existir autenticação (Non-Goal).

### D4 — Estado do shell vive no layout e persiste entre páginas admin
`sidebarOpen` (e o restante do estado do header/sidebar) passa a pertencer a `admin.vue`. O Nuxt
reutiliza o mesmo layout entre rotas de mesmo layout, então o estado sobrevive a navegações em
`/admin/**` e reseta ao sair para a Área Pública. **Por quê:** comportamento natural do Nuxt, alinhado
ao requisito "estado das sessões preservado"; não há necessidade de store global.

### D5 — Imprensa, `app.vue` e vitrine intocados
As regras de print em `app/assets/css/main.css` (escondem `header/aside/nav`) continuam corretas — em
páginas públicas não há esses elementos. `app.vue` já está correto. `/design` mantém
`layout: false` (requisito existente "A vitrine de design continua fora do shell").

## Risks / Trade-offs

- **Esquecer `layout: 'admin'` numa nova tela admin** → a tela renderiza sem shell. Mitigação:
  convenção documentada em `docs/03` §11 + cenário do spec; QA futuro pode varrer a pasta.
- **Troca de layout desmonta o shell** ao ir de `/admin` para `/` (e vice-versa) → estado reseta
  (aceito, D4). Não há layout transitivo a resolver.
- **Área Pública sem conteúdo** continua placeholder → aceito e registrado em proposal.md (Impact).

## Migration Plan

Mudança local de uma aplicação em dev: editar 4 arquivos de páginas/layouts, build, verificação
visual. Rollback = reverter o commit (nenhum dado, dependência ou migração envolvidos).

## Open Questions

*(nenhuma — as decisões acima não alteram specs nem quebra de tarefas; o restante é implementação.)*
