# Proposal

## Why

A Área Pública hoje é apenas um placeholder em `/`: não existe header, sidebar, tema nem navegação
para o conteúdo publicado. Visitantes anônimos não conseguem explorar Releases Week, Manuais Mensais
ou Escopo de Projetos. Além disso, a spec `design-system/layout-navigation` afirma explicitamente que
a Área Pública é renderizada sem sidebar, o que impede a implementação do shell documentado sem um
delta de comportamento.

## What Changes

- Adicionar o shell público em `/` (`app/layouts/default.vue`) com `PublicHeader` e
  `PublicSidebar`, sem alterar o shell administrativo de `/admin/**`.
- Header público branco com:
  - logo da tela de login (`logo_login_url`) + nome fixo **“Dicas Teorema”**;
  - fallback com badge `Building2` + “Dicas Teorema” quando não houver logo;
  - input visual de pesquisa global (sem painel de resultados nesta change);
  - botão de tema claro/escuro exclusivo da Área Pública;
  - ação **“Entrar”** apontando para `/admin/login`.
- Sidebar pública fixa em `w-72` no desktop, sem rail, com:
  - atalho **“Painel de Destaques & Busca”**;
  - **Releases Week** (Ano -> Mês -> Semana), com versão, selo “NOVA”, contagem de chamadas e
    `Rel:`;
  - **Manuais Mensais** (Ano -> Mês, sem terceiro nível), com mês selecionado e contagem de manuais;
  - **Escopo de Projetos** (Projeto -> Sistemas contemplados), com “Ver Tudo”, contagem de sistemas e
    de chamadas por sistema.
- Adicionar `GET /api/publico/navegacao` como leitura anônima de resumos publicados (sem detalhes de
  conteúdo), incluindo contagens de chamadas e sistemas; liberar apenas `/api/publico/**` no
  middleware de sessão.
- Implementar tema claro/escuro público com persistência e prevenção de flash, sem afetar `/admin`.
- Implementar drawer abaixo de `lg`, foco controlado, `Escape`, backdrop e retorno de foco.
- Atualizar documentação visual (`docs/01`, `docs/03`, `docs/18`) e a vitrine `/design` quando a
  implementação existir.
- **BREAKING**: a raiz `/` deixa de ser um placeholder sem navegação e passa a renderizar o shell
  público; a requirement que declara a Área Pública “sem sidebar” é substituída por uma requirement
  de shell público próprio.

## Capabilities

### New Capabilities

- `design-system/public-layout`: comportamento do shell da Área Pública — zonas do header, árvore da
  sidebar, estados visuais, tema claro/escuro, responsividade, acessibilidade e fonte de navegação
  pública.

### Modified Capabilities

- `design-system/layout-navigation`: o shell administrativo continua restrito a `/admin/**`; a Área
  Pública passa a ter header e sidebar próprios, deixando de ser “conteúdo sem sidebar”.
- `design-system/brand-tokens`: a paleta editorial da Área Pública (indigo, esmeralda e púrpura sobre
  `slate`) passa a ser uma exceção permitida e documentada, mantendo foco `brand-focus`, erro
  `rose-700` e a Área Administrativa nos tokens atuais.

## Impact

- **Frontend:** `app/layouts/default.vue`, novos componentes em `app/components/layout/`
  (`PublicHeader`, `PublicSidebar`, `PublicSearch`, `PublicThemeToggle` e seções), composables de
  tema/navegação, `app/pages/index.vue`, `app/assets/css/main.css` e `tailwind.config.js`.
- **Backend:** `server/api/publico/navegacao.get.ts`, DTO público em `shared/publico.ts`, reuso de
  `server/utils/visibilidade-publica.ts` e liberação de `/api/publico/**` em
  `server/middleware/auth-api.ts`.
- **Banco:** nenhuma migration; leitura das tabelas existentes com o gate
  `Publicado + não arquivado + publicado_em <= NOW()`.
- **Dependências:** nenhuma nova; usa `@lucide/vue`, Tailwind e o kit `Ui*` existentes.
- **Documentação:** `docs/01 - design_system.md`, `docs/03 - Header e Sidebar.md`,
  `docs/18 - Sidebar e Header Area Publica.md` e a seção correspondente em `app/pages/design.vue`.
- **Testes:** testes unitários do DTO/agrupamento e do gate de visibilidade; verificação manual de
  responsividade, tema e acessibilidade.
- **Fora de escopo:** páginas de conteúdo (destaques, release, mês de manual, escopo/sistema),
  painel de resultados da busca, busca server-side, deep links, contagem de visualizações e
  alterações no shell administrativo.
