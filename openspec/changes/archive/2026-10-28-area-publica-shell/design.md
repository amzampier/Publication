# Design

## Context

Hoje `app/layouts/default.vue` renderiza apenas `<slot />` sobre `bg-slate-50`; `app/pages/index.vue`
é um placeholder. O shell administrativo vive em `app/layouts/admin.vue` e não deve ser reutilizado.
A Área Pública não tem navegação, tema nem leitura anônima de conteúdo.

Restrições que moldam a solução:

- Nuxt 4.5.2, Vue 3, Tailwind e o kit `Ui*`; ícones de `@lucide/vue`.
- `server/middleware/auth-api.ts` exige sessão em todo `/api/**`, exceto `/api/auth/*` e
  `/api/configuracoes/identidade`.
- O gate de visibilidade pública já existe em `server/utils/visibilidade-publica.ts`:
  `Publicado`, não arquivado, `publicado_em` não nulo e não futuro.
- `GET /api/configuracoes/identidade` já expõe `logo_login_url` sem sessão; é a fonte da logo do
  header.
- Não há dark mode no sistema; `ESC-TEMAS` ainda é roadmap.
- A spec `design-system/layout-navigation` determina hoje que a Área Pública não tem sidebar; o
  delta deste change substitui essa requirement.
- A referência visual é `docs/18 - Sidebar e Header Area Publica.md` e o DT01.

## Goals / Non-Goals

**Goals:**

- Entregar o shell público documentado, com dados reais de navegação publicados.
- Manter a Área Administrativa intacta, inclusive no tema e no comportamento.
- Garantir que nenhum conteúdo em rascunho, revisão, arquivado ou agendado vaze para o anônimo.
- Ter uma primeira implementação responsiva, acessível e testável sem migration.

**Non-Goals:**

- Páginas de conteúdo (destaques, release, mês de manual, escopo/sistema).
- Painel de resultados e busca server-side; o campo existe apenas visualmente.
- Deep links e seleção persistida por URL.
- Contagem de visualizações, comentários ou favoritos.
- Alterações no shell administrativo, no `/design` além da nova seção de vitrine e no tema do
  `/admin`.
- Novas migrations ou alterações de schema.

## Decisions

### D1 — O shell público vive em `default.vue` e em componentes próprios

`app/layouts/default.vue` passa a montar `PublicHeader` + `PublicSidebar` + `<main>`. O
`admin.vue` não é tocado. `design.vue` continua com `layout: false`; as telas de autenticação
continuam com `layout: auth`.

Componentes propostos em `app/components/layout/`:

```
PublicHeader.vue
PublicSearch.vue
PublicThemeToggle.vue
PublicSidebar.vue
PublicSidebarSecao.vue
PublicSidebarReleases.vue
PublicSidebarManuais.vue
PublicSidebarEscopos.vue
```

Composables:

```
usePublicoNavegacao.ts   -> fetch, agrupamento, seleção e estados
useTemaPublico.ts        -> tema, cookie/localStorage e aplicação do escuro
```

**Por que:** segue a organização de layout já existente, aproveita o auto-import do Nuxt e evita
colocar navegação dentro de `index.vue`. Um layout `public.vue` separado seria redundante, porque
`default.vue` já é o layout público.

**Alternativas:** sidebar direto em `index.vue` (rejeitada: a navegação deve valer para futuras
rotas públicas); reutilizar `AppSidebar` (rejeitada: é navy, retrátil e acoplada ao RBAC).

### D2 — Uma leitura pública agregada para a sidebar

Novo endpoint anônimo:

```
GET /api/publico/navegacao
```

Retorna apenas resumos publicados:

```ts
interface PublicoNavegacao {
  releases: PublicoReleaseResumo[]
  manuais: PublicoManualResumo[]
  escopos: PublicoEscopoResumo[]
}

interface PublicoReleaseResumo {
  id: string
  ano: number
  mes: string
  semana: number
  versao: string
  release: string
  destaqueSemana: boolean
  chamadas: number
  publicadoEm: string
}

interface PublicoManualResumo {
  id: string
  ano: number
  mes: string
  mesNumero: number
  titulo: string
  publicadoEm: string
}

interface PublicoSistemaResumo {
  nome: string
  chamadas: number
}

interface PublicoEscopoResumo {
  id: string
  codigo: string
  nome: string
  versao: string
  ano: number
  chamadas: number
  sistemas: PublicoSistemaResumo[]
  publicadoEm: string
}
```

**Por que um endpoint:** a sidebar precisa das três seções no primeiro paint; uma requisição evita
três estados de carregamento independentes e reduz o custo de coordenação. O payload é pequeno
(resumos, não itens completos).

**Alternativas:** três endpoints (`releases`, `manuais`, `escopos`) seriam mais granulares, porém
multiplicam requests e estados; reutilizar os endpoints administrativos vazaria campos internos e
exigiria RBAC, incompatível com o anônimo.

**Segurança:** o DTO não inclui autor, revisor, descrição, auditoria, anexos nem status interno.
IDs são mantidos apenas para seleção futura e não são exibidos. O endpoint é somente leitura.

**Cache:** `Cache-Control: public, max-age=60, stale-while-revalidate=300` na resposta. O conteúdo
publicado pode levar até 60 s para refletir uma publicação; aceitável para o portal e suficiente para
absorver acessos repetidos. Alternativa `no-store` daria atualização imediata ao custo de bater no
banco a cada visita.

### D3 — SQL com o gate único de visibilidade

As três listas usam o mesmo predicado de pai público:

```sql
status = 'Publicado'
AND arquivada = 0
AND publicado_em IS NOT NULL
AND publicado_em <= NOW(6)
```

Contagens:

- **Release:** `COUNT(*)` de `entregas_itens` com `release_id = r.id`, `status = 'Publicado'` e
  `publicado_em <= NOW(6)`.
- **Manual:** a sidebar conta **manuais publicados por mês**, não chamadas. A lista de manuais já
  fornece a contagem por agrupamento.
- **Escopo:** `COUNT(*)` de chamadas públicas do projeto e, para cada sistema, `COUNT(DISTINCT
  e.id)` a partir de `entregas_itens_softwares` (todos os softwares da chamada), com fallback para
  `software_id`/`software` quando não houver linha na junção — o mesmo critério já usado por
  `server/utils/escopo-projetos.ts`.
- **Chamada com múltiplos softwares:** conta em cada sistema, então a soma dos sistemas pode ser
  maior que o total de chamadas do projeto; são agregados diferentes e isso deve ficar explícito na
  UI/comentário.

**Por que:** reaproveita o gate já testado, os índices existentes (`idx_entregas_*`,
`idx_entregas_publicado_em`, FKs) e o padrão de softwares do admin. Não há migration.

**Alternativas:** uma view pública dedicada seria mais isolada, mas adiciona migration e manutenção;
consultas no cliente sobre os endpoints administrativos seriam inseguras e pesadas.

### D4 — Tema escuro escopado no shell público

- `tailwind.config.js` recebe `darkMode: 'class'`.
- A raiz do `default.vue` recebe `data-publico-shell` e a classe `dark` quando o tema for escuro.
  A classe fica **no container público**, não em `<html>`, para não vazar para `/admin`.
- `useTemaPublico` lê/escreve o cookie `publico-tema` (`claro` | `escuro`) e o estado reativo. O
  cookie permite SSR já com o tema correto da segunda visita em diante.
- Primeira visita sem cookie: um script inline mínimo (em `app.vue` ou `nuxt.config.ts`) lê
  `prefers-color-scheme`, aplica `dark` em `[data-publico-shell]` e grava o cookie antes da
  hidratação, evitando o flash.
- O botão usa `Moon` no claro e `Sun` no escuro, com `aria-pressed` e rótulo dinâmico.
- O tema escuro usa `slate-900/950` para superfícies e `indigo-400`/`emerald-400`/`purple-400`/
  `amber-400` para acentos; o foco permanece `brand-focus` e o erro `rose-700`.

**Por que:** atende o comportamento aprovado (tema público, admin intocado) sem instalar
`@nuxtjs/color-mode` e sem propagar `dark` para o shell administrativo.

**Alternativas:** `html.dark` global (rejeitada: afetaria o admin e exigiria reset de rota); tema
apenas em memória (rejeitada: perde a preferência no F5); placeholder sem função (rejeitada: o doc 18
define o toggle como funcional).

### D5 — Drawer reaproveitando o padrão do shell administrativo

- `default.vue` mantém `sidebarAberta` (estado do drawer) e renderiza o backdrop abaixo de `lg`.
- `PublicSidebar` recebe `aberta` e emite `fechar`. Usa `matchMedia('(max-width: 1023px)')` para
  saber quando é drawer, como `AppSidebar`.
- Uma única instância do `<aside>`: estática em `lg` (`sticky top-16 h-[calc(100vh-4rem)] w-72`) e
  drawer abaixo de `lg` (`fixed left-0 top-16 bottom-0 z-30`), com `translate-x` para abrir/fechar.
- No modo drawer: `role="dialog"`, `aria-modal="true"`, nome “Navegação da Área Pública”, foco preso,
  `Escape`, clique no backdrop e retorno do foco ao botão de menu.
- O header tem o botão de menu apenas abaixo de `lg`; no desktop não há toggle (a sidebar é fixa).

**Por que:** o comportamento já existe e é testado no admin; reutilizar o padrão reduz risco e
mantém a semântica de drawer consistente.

**Alternativas:** sidebar colapsável com rail (rejeitada: o doc 18 e a imagem fixam `w-72` sem rail);
drawer com `UiModal` (rejeitada: o modal tem chrome e centralização inadequados para navegação).

### D6 — Estado local determinístico, sem URL

- Seções começam abertas; o ano mais recente e o mês mais recente de cada seção começam expandidos,
  derivados dos dados (não de `new Date()`), para evitar diferença SSR/cliente.
- Home é o item ativo até uma seleção.
- Selecionar release, mês ou sistema atualiza apenas o estado local e o destaque visual.
- Não há `?release=`, `?manual=` ou `?escopo=` nesta change; deep links ficam para a change de
  conteúdo.

**Por que:** o objetivo é o shell; introduzir URL agora exigiria páginas de conteúdo e contrato de
navegação que ainda não existem. O estado local é suficiente para validar a hierarquia e os estados.

### D7 — Fetch SSR com estados explícitos

`usePublicoNavegacao` usa `useAsyncData('publico-navegacao', () => $fetch('/api/publico/navegacao'))`
no layout/sidebar, com `pending`, `error` e `refresh` para “Tentar novamente”. O SSR busca os dados
para o primeiro paint; a sidebar mostra skeleton/loading quando a promise ainda está pendente e um
estado de erro com retry quando falha.

**Por que:** o shell é a primeira coisa visível; buscar no cliente deixaria a sidebar vazia no F5 e
pioraria a percepção. O endpoint é leve e cacheável.

### D8 — Acessibilidade sem árvore ARIA formal

A sidebar usa `<nav aria-label="Navegação da Área Pública">` com listas e botões, `aria-expanded`/
`aria-controls` nas seções e `aria-current` no item ativo. `Tab` percorre todos os controles;
`Enter`/`Space` acionam; `Escape` fecha o drawer. Não há `role="tree"` nem roving tabindex nesta
primeira versão.

**Por que:** uma árvore ARIA completa adiciona complexidade de teclado e risco de regressão sem
ganho para uma navegação de três seções. Botões nativos em listas são previsíveis e testáveis.

**Alternativas:** `role="tree"` com setas (mais “correto” para árvore, porém mais código e mais
pontos de falha); links reais (não se aplicam enquanto não há páginas de destino).

### D9 — Paleta editorial pública sem novos tokens

O shell usa as classes padrão do Tailwind (`indigo-*`, `emerald-*`, `purple-*`, `amber-*`, `slate-*`),
com o mapeamento documentado no doc 18. Não são criados tokens `publico.*` no `tailwind.config.js`
nesta change.

**Por que:** as cores já existem na paleta do Tailwind e o uso é localizado no shell; criar aliases
adicionais aumentaria a superfície do design system sem necessidade. A exceção fica registrada na
spec `design-system/brand-tokens` e no doc 01.

**Alternativas:** tokens `publico.*` (mais semânticos, porém mais uma camada a manter); reutilizar
apenas navy/verde (perde a paridade visual aprovada).

### D10 — Sem nova dependência

Não entra `@nuxtjs/color-mode`, biblioteca de árvore, ícones alternativos nem cliente HTTP novo.
Tudo usa Nuxt/Vue, Tailwind, `@lucide/vue`, `Ui*` e o MySQL existente.

## Risks / Trade-offs

- **Vazamento de conteúdo não publicado** → o endpoint usa o gate único `visibilidade-publica` e o
  DTO não inclui campos internos; testes cobrem os filtros puros e a revisão manual compara a
  sidebar com o admin.
- **Flash de tema no primeiro acesso** → cookie + script inline antes da hidratação; a segunda
  visita já sai correta do SSR. Se o script falhar, o padrão claro é seguro.
- **Drawer com foco preso e sidebar estática no mesmo componente** → uma única instância com classes
  responsivas e `matchMedia`, seguindo o padrão já usado no admin; testes manuais em 1024/768/390.
- **Contagem de sistemas divergir do total de chamadas** → documentar que a soma por sistema pode
  exceder o total quando uma chamada tem vários softwares; a UI mostra os dois números com rótulos
  distintos.
- **Cache de 60 s** → uma publicação pode demorar até 1 min para aparecer; aceitável para o portal.
  Se a operação exigir tempo real, trocar para `no-store` é uma mudança de uma linha.
- **Conflito com a spec atual** → o delta de `layout-navigation` resolve a requirement; sem ele, a
  implementação violaria a spec vigente.
- **Sem páginas de conteúdo** → a seleção destaca o item, mas a área principal continua um
  placeholder; isso é intencional nesta change e deve ficar explícito na revisão.

## Migration Plan

1. **Sem migration de banco.** O endpoint é aditivo e lê tabelas existentes.
2. **Deploy do backend** (`/api/publico/navegacao` + liberação no middleware) antes ou junto do
   frontend; o frontend tolera falha com estado de erro.
3. **Deploy do frontend**: `default.vue` passa a renderizar o shell público. Como `/` era um
   placeholder, não há dados de usuário a migrar.
4. **Rollback:** reverter `default.vue` e os componentes para o placeholder anterior e remover o
   endpoint/allowlist. Nenhum dado é alterado.
5. **Documentação e vitrine** podem ir no mesmo deploy; se a seção `/design` atrasar, o shell real
   não depende dela.

## Open Questions

- O campo de busca deve, no futuro, navegar para uma rota de resultados ou abrir um painel sobre o
  conteúdo? Fica para a change de busca global; nesta change ele é apenas um campo acessível.
- A seleção deve virar deep link (`?release=`, `?manual=`, `?escopo=`) quando as páginas de conteúdo
  existirem? Sim, provavelmente; a decisão pertence à change de conteúdo.
- O endpoint público deve expor IDs? Mantidos nesta change para seleção futura; se houver objeção de
  privacidade, a chave pode ser composta por ano/mês/semana sem impacto visual.

## Verification (implementação)

- **Gates:** `npm run lint`, `npm run test` (328/328), `npm run typecheck` e `npm run build` verdes.
- **API pública:** `GET /api/publico/navegacao` responde `200` sem cookie; `/api/release-week` responde
  `401` sem sessão. Release e manual temporariamente publicados apareceram com os campos públicos;
  `publicado_em` futuro e `arquivada = 1` esconderam o conteúdo; os dados de teste foram restaurados.
- **Sistemas do escopo:** cenário temporário com dois itens e três sistemas (um item vinculado a dois
  softwares + um item de fallback) retornou `chamadas: 2` e os três sistemas com contagem `1`,
  validando a junção `entregas_itens_softwares` e o fallback `software_id`/`software`.
- **SSR/headless:** `/` renderiza o header branco com a logo de login, “Dicas Teorema”, busca, tema e
  “Entrar”, além da sidebar `w-72` com Home, Releases Week (`Rocket`), Manuais Mensais e Escopo de
  Projetos. `/design` §29 renderiza o shell de demonstração; `/admin/login` não herda o shell público.
  Cookie `publico-tema=escuro` aplica `dark` em `[data-publico-shell]` desde o SSR.
- **Interação (CDP, viewport 390):** menu abre o drawer (`aria-expanded="true"`, `role="dialog"`,
  `aria-modal="true"`, foco no Home), `Escape` fecha, o foco volta ao botão de menu e o drawer fechado
  fica `inert`; o toggle de tema altera a classe `dark`, o cookie e `aria-pressed`. Sem avisos de
  hidratação após a remoção do `Teleport` do painel de busca. O screenshot real em 390px não apresenta
  overflow horizontal; a emulação mobile do CDP foi descartada por alterar o layout viewport.
- **Acessibilidade:** inspeção estática/headless de `aria-expanded`, `aria-controls`, `aria-current`,
  `aria-pressed`, nomes acessíveis e anéis de foco; teclado do drawer validado. Textos de apoio no
  claro usam `slate-500` (AA), mantendo `brand-focus` no foco e `rose-700` no erro.
- **Fora de escopo confirmado:** páginas de conteúdo, painel de resultados, busca server-side e deep
  links permanecem para as próximas changes.
