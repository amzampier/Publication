# Tasks

## 1. Contrato e leitura pública

- [x] 1.1 Criar `shared/publico.ts` com os tipos `PublicoNavegacao`, resumos de release/manual/escopo/sistema e funções puras de agrupamento e ordenação. Verificar: `npm run typecheck` e testes unitários em `tests/publico-navegacao.test.ts`.
- [x] 1.2 Criar `server/utils/publico.ts` com as consultas de releases, manuais, escopos e sistemas públicos, aplicando `status = 'Publicado'`, `arquivada = 0`, `publicado_em IS NOT NULL` e `publicado_em <= NOW(6)` em pais e chamadas. Verificar: revisão do SQL contra o schema e execução contra o banco local.
- [x] 1.3 Criar `server/api/publico/navegacao.get.ts` retornando o DTO e o cabeçalho `Cache-Control: public, max-age=60, stale-while-revalidate=300`. Verificar: `GET /api/publico/navegacao` responde `200` sem cookie e não retorna autor, revisor, descrição, anexos ou auditoria.
- [x] 1.4 Liberar apenas `/api/publico/` em `server/middleware/auth-api.ts` e confirmar que as APIs administrativas continuam exigindo sessão. Verificar: chamada anônima à rota pública retorna `200`; chamada anônima a `/api/release-week` retorna `401`.
- [x] 1.5 Cobrir agrupamento, ordenação, contagem por sistema e casos de conteúdo não publicado em `tests/publico-navegacao.test.ts`; estender `tests/visibilidade-publica.test.ts` se a leitura reutilizar os helpers. Verificar: `npm run test`.
- [x] 1.6 Documentar o contrato em `docs/19 - API Pública de Navegação.md` (rota, DTO, gate de visibilidade, cache e exemplos) e apontar para ele no `docs/18` §12.3. Verificar: exemplos do doc batem com a resposta real e os links funcionam.

## 2. Shell, header e tema

- [x] 2.1 Transformar `app/layouts/default.vue` no shell público (`PublicHeader` + `PublicSidebar` + `<main>`), buscando `GET /api/publico/navegacao` no SSR e expondo `pending`, `error` e `refresh`. Verificar: `/` renderiza header/sidebar no F5 e `/admin` continua com o shell administrativo.
- [x] 2.2 Criar `PublicHeader.vue` com a logo de `logo_login_url` + “Dicas Teorema”, fallback `Building2`, busca, tema e “Entrar”; abaixo de `lg`, menu, busca e “Entrar” em ícone. Verificar: conferência visual em 1440/1024/390 e navegação de “Entrar” para `/admin/login`.
- [x] 2.3 Criar `PublicSearch.vue` com campo acessível no desktop e painel/overlay no mobile, sem painel de resultados nesta change. Verificar: `aria-label`, `type="search"`, foco, fechamento por `Escape` e ausência de chamada de busca.
- [x] 2.4 Criar `useTemaPublico.ts`, `PublicThemeToggle.vue`, `darkMode: 'class'` no Tailwind e o script anti-flash; aplicar o escuro em `[data-publico-shell]`, não em `<html>`. Verificar: alternância, persistência no F5, primeira pintura sem flash e `/admin` inalterado.
- [x] 2.5 Testar a resolução pura do tema (cookie, preferência salva e padrão claro) em `tests/publico-tema.test.ts`. Verificar: `npm run test`.
- [x] 2.6 Atualizar `docs/01 - design_system.md` (§2.1 com a exceção de paleta e §3 com o shell público), `docs/03 - Header e Sidebar.md` (§1 apontando para o doc 18) e o status do `docs/18`. Verificar: referências cruzadas e links corretos.

## 3. Sidebar e seções

- [x] 3.1 Criar `PublicSidebar.vue` + `PublicSidebarSecao.vue` com Home, cabeçalhos, contadores, abertura independente, `aria-expanded`/`aria-controls`, loading, erro e vazio. Verificar: navegação por teclado e estados visíveis.
- [x] 3.2 Criar `PublicSidebarReleases.vue` com ano -> mês -> card da release, versão, “NOVA”, contagem de chamadas e `Rel:`. Verificar: dados reais, agrupamento e ordenação cobertos por teste.
- [x] 3.3 Criar `PublicSidebarManuais.vue` com ano -> mês, contagem de manuais e sem terceiro nível. Verificar: contagem por mês, estado selecionado e ausência de manuais aninhados.
- [x] 3.4 Criar `PublicSidebarEscopos.vue` com card do projeto, “Ver Tudo”, sistemas contemplados e contagens. Verificar: projeto com zero sistemas/chamadas e com múltiplos sistemas.
- [x] 3.5 Implementar a seleção visual local (Home, release, mês, sistema), sem alterar a URL. Verificar: apenas um item ativo por nível e Home ativo quando não há seleção.
- [x] 3.6 Implementar o drawer abaixo de `lg` com backdrop, `role="dialog"`, `aria-modal`, foco preso, `Escape`, clique no backdrop, retorno de foco e ausência de overflow horizontal. Verificar: 1024/768/390 e navegação por teclado.
- [x] 3.7 Adicionar a seção do shell público em `app/pages/design.vue` (nova seção 29), espelhando o header e a sidebar reais. Verificar: `/design` renderiza a seção e o build não quebra.

## 4. Integração, segurança e gates

- [x] 4.1 Verificar que rascunho, revisão, arquivado e agendado não aparecem na sidebar e que as contagens excluem chamadas não publicadas. Verificar: cenário manual no banco e teste de visibilidade.
- [x] 4.2 Verificar acessibilidade: landmarks, `aria-expanded`/`aria-controls`/`aria-current`/`aria-pressed`, foco visível, contraste e nomes acessíveis. Verificar: inspeção por teclado e DevTools; registrar o resultado no change.
- [x] 4.3 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`. Verificar: todos os gates verdes.
- [x] 4.4 Conferência manual final: `/` no claro/escuro, desktop/mobile, todas as seções, estados vazios, erro/retry, `/admin` intacto e `/design` com a seção nova. Verificar: checklist do `docs/18` §11.
