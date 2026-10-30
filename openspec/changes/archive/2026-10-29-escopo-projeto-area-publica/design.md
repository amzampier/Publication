# Design

## Context

Ver `proposal.md` — Why. O ponto de partida técnico é:

- `app/layouts/default.vue` já carrega `usePublicoNavegacao()` em SSR e passa `escopos` para
  `PublicSidebar`; a seleção de escopo hoje é apenas estado local do componente.
- `server/utils/publico.ts` já concentra o gate público (`gatePai`), a listagem de escopos e a
  agregação de sistemas a partir de `entregas_itens_softwares` com fallback para o software
  principal.
- `entregas_itens` tem `chamada`, `titulo`, `descricao_completa`, `tipo`, `modulo`, `parceiro`,
  `tags` (JSON), `data_liberacao`, `link_manual` e `link_video`; `solucao`/`descricao_html` existem,
  mas a página pública v1 usa apenas o texto puro de `descricao_completa`.
- `anexos_midias` guarda as imagens de evidência com `legenda_alt`, `ordem_exibicao` e
  `destaque_capa`.
- `entregas_itens.situacao` foi removida; o card usa `tipo`.
- Não há página pública de conteúdo ainda. O shell público e o Painel de Destaques estão
  implementados; as rotas `/releases/[id]`, `/manuais/[id]` e `/manuais/[id]/itens/[itemId]`
  continuam pendentes.
- O projeto usa MySQL/MariaDB com SQL cru (`mysql2/promise`), Nuxt 4 (srcDir `app/`), Tailwind e o
  kit `Ui*`. Não há ORM; agregações e filtros ficam no servidor.

## Goals / Non-Goals

**Goals:**

- Entregar a primeira página pública de conteúdo, com URL compartilhável e estado de sidebar
  derivado da rota.
- Manter a leitura anônima, cacheável e restrita ao gate público, sem expor autoria, revisão ou
  auditoria.
- Reutilizar o máximo do kit e dos tokens existentes; nenhuma migration.
- Deixar a documentação (doc 21 + propagação) e a vitrine `/design` coerentes com a implementação.

**Non-Goals:**

- Páginas públicas de release e manual, busca global, deep links de release/manual, contador de
  visualizações e SEO avançado.
- Modal de detalhe da chamada com descrição/solução completas (o card mostra resumo em texto puro).
- Reintroduzir `situacao` ou qualquer campo novo no schema.
- Alterar o módulo administrativo de Escopo de Projetos, o RBAC ou o shell administrativo.
- Criar um segundo componente de botão/campo/tooltip paralelo ao kit.

## Decisions

### D1. URL como fonte da verdade da seleção

Rota: `/escopos/[id]?sistema=<nome>`; sem `sistema`, todas as chamadas do escopo. “Ver Tudo” aponta
para `/escopos/[id]`; “Voltar aos Destaques” para `/`.

`default.vue` resolve o id da rota, localiza o escopo em `usePublicoNavegacao()` e passa a seleção
para `PublicSidebar` por uma prop opcional. `PublicSidebar` sincroniza a prop com o ref interno
(`watch` com `immediate`), preservando o estado local do demo. O clique em sistema emite o payload
de sempre; o layout chama `navigateTo({ path: '/escopos/{id}', query: sistema ? { sistema } : {} })`.
`irHome` navega para `/` quando a rota atual é `/escopos/**`.

Alternativas: manter a seleção só em `useState` (não sobrevive a deep link/refresh sem sincronização
manual) e transformar os botões da sidebar em `NuxtLink` (melhor semântica, mas quebra o demo do
`/design` sem uma prop extra). A prop opcional é o menor diff e cobre deep link, voltar/avançar e
demo.

### D2. Dois endpoints públicos, com cache curto

```http
GET /api/publico/escopos/:id
GET /api/publico/escopos/:id/chamadas?sistema=&pagina=&porPagina=
```

Separar o cabeçalho da lista permite cachear o resumo por mais tempo e paginar apenas as chamadas.
O detalhe usa `public, max-age=60, stale-while-revalidate=300`; a lista usa
`public, max-age=30, stale-while-revalidate=120`. A lista também valida que o escopo é público para
não vazar existência: escopo inexistente/não público -> `404` nos dois endpoints.

Alternativa: um endpoint único com `escopo` + `itens`. Menos round-trips, porém mistura cache de
cabeçalho e paginação e repete a agregação de sistemas a cada página.

### D3. Gate, filtro de sistema e contagens no servidor

Reutilizar `gatePai` para `projetos_escopo` e criar `gateChamada` para `entregas_itens`:

```sql
p.status = 'Publicado' AND p.arquivada = 0
AND p.publicado_em IS NOT NULL AND p.publicado_em <= NOW(6)

e.status = 'Publicado'
AND e.publicado_em IS NOT NULL AND e.publicado_em <= NOW(6)
AND e.projeto_id = ?
```

Filtro de sistema com `EXISTS` para não multiplicar linhas:

```sql
EXISTS (SELECT 1 FROM entregas_itens_softwares j
         WHERE j.entrega_item_id = e.id AND j.software_nome = ?)
OR (
  NOT EXISTS (SELECT 1 FROM entregas_itens_softwares j WHERE j.entrega_item_id = e.id)
  AND COALESCE(sw.descricao, e.software) = ?
)
```

Contagens: `COUNT(DISTINCT e.id)` no projeto e por sistema. Uma chamada com dois softwares conta nos
dois sistemas; a soma por sistema pode superar o total do projeto. O doc 19 já registra essa
semântica.

Alternativa: `JOIN` direto com a junção; descartado porque duplicaria a chamada e quebraria a
paginação/contagem.

### D4. DTO público mínimo

```ts
interface PublicoEscopoDetalhe {
  id: string; codigo: string; nome: string; versao: string; ano: number
  chamadas: number; sistemas: PublicoSistemaResumo[]; publicadoEm: string
}

interface PublicoChamadaEscopo {
  id: string; chamada: string; titulo: string; descricao: string
  solucao: string; tipo: TipoItem; impacto: ImpactoItem
  modulo: string; parceiro: string
  softwares: string[]; tags: string[]
  evidencias: { id: string; url: string; alt: string; capa: boolean }[]
  linkManual: string; linkVideo: string; dataLiberacao: string
}

interface PublicoEscopoChamadas {
  itens: PublicoChamadaEscopo[]; total: number
  pagina: number; porPagina: number; sistemaSelecionado: string
}
```

`descricao` é o texto puro de `descricao_completa`, truncado no cliente por CSS. `solucao` é o texto
puro da solução, exibido em bloco próprio no card. `impacto` é exibido como badge neutro com o valor
textual. Não expor `autor_id`, `autor_nome`, `revisor_*`, `status`, `arquivada`, `solucao_html`,
`descricao_html`, auditoria ou caminhos físicos. O badge do card usa `tipo`; o impacto usa o valor
textual, sem depender apenas de cor.

### D5. Lista, ordenação e paginação

Seis itens por página, `UiPagination`, ordenação `ordem_apresentacao ASC, chamada ASC`. A lista é
uma coluna de cards em largura total, como a referência visual. A query busca a página e o total em
paralelo; as mídias e os softwares das chamadas da página são carregados em lote (sem N+1).

`pagina` inválida -> 1; `porPagina` padrão 6, máximo 50; `sistema` inexistente -> lista vazia com
“Ver todas as chamadas”; `sistema` é comparado com o nome público derivado da junção/fallback.

### D6. Evidências e links

Miniaturas de `anexos_midias` (`tipo_mime LIKE 'image/%'`), ordenadas por `destaque_capa DESC,
ordem_exibicao ASC, criado_em ASC`, usando a variante `-320.webp` quando existir e o original como
fallback. Clique abre uma galeria em `UiModal` (padrão já usado em `lancar-chamadas/Detalhes.vue`),
com setas, `Escape`, contagem e texto alternativo. Sem imagens, o bloco não é renderizado.

“Documentação Externa” aparece quando `link_manual` existe; “Ver vídeo” quando `link_video` existe.
Ambos abrem em nova aba com `rel="noopener noreferrer"`.

### D7. Hero e identidade visual

O cabeçalho reutiliza a receita do hero do Painel:
`bg-gradient-to-br from-brand-primary via-slate-950 to-indigo-950`. O púrpura do Escopo permanece
nos chips, ícones, badges de software e tags (`purple-600/50/100/400/950`). O delta de
`brand-tokens` documenta a extensão da exceção do degradê para heros de páginas públicas.

O restante da página usa superfícies sólidas (`bg-white`/`dark:bg-slate-900`), bordas
`slate-200`/`slate-800`, foco `brand-focus` e erro `rose-700`. Nenhum `lime-500`.

### D8. Estados, 404 e acessibilidade

- Carregamento: skeleton do cabeçalho/lista com `aria-busy`.
- Vazio: “Nenhuma chamada publicada para este escopo/sistema.”, com “Ver todas as chamadas” quando
  houver filtro.
- Erro transitório: `UiErrorState` com “Tentar novamente”; não reutilizar dados antigos.
- Escopo inexistente/não público: `404` (global) ou estado 404 da página, sem quebrar o shell.
- `h1` do escopo, `h2` da lista, `h3` por card; contagens com `aria-label`; tags em lista; evidências
  em botões; links externos com `rel` seguro; `aria-live` para o total da lista.
- Galeria com foco controlado e fechamento por `Escape`.
- Sem overflow horizontal entre 320px e 1440px; drawer da sidebar independente.

### D9. Componentização e arquivos

```
app/pages/escopos/[id].vue
app/composables/usePublicoEscopo.ts
app/components/publico/EscopoCabecalho.vue
app/components/publico/EscopoChamadaCard.vue
app/components/publico/EscopoEvidencias.vue
```

`usePublicoEscopo` faz as duas leituras, reage a `sistema`/`pagina` da rota, expõe `carregando`,
`erro`, `recarregar` e a ação de trocar página/sistema (atualizando a query). O cabeçalho e os cards
são componentes de apresentação; a galeria fica isolada no `EscopoEvidencias`.

Reutilizar `UiButton`, `UiBadge`, `UiPagination`, `UiLoading`, `UiErrorState`, `UiModal` e
`UiTooltip`. Não criar botão/campo/tooltip paralelos.

### D10. Documentação e verificação

- Criar `docs/21 - Módulo Escopo Projeto Área Pública.md` com o contrato visual e de dados.
- Atualizar `docs/01` (§2.1 e §3.6), `docs/18` (§4.6 e §12), `docs/19` (endpoints/DTOs),
  `AGENTS.md` e a seção 30 da vitrine `/design`.
- Testes puros em `tests/publico-escopo.test.ts`: normalização de `sistema`/`pagina`/`porPagina`,
  contagem por sistema, rótulos (incluindo impacto), seleção de sistema inválido e montagem do
  resumo.
- Manual: gate, contagens, filtro, paginação, URL direta, "Ver Tudo", voltar, 404, vazio, erro,
  mobile, tema escuro, galeria, descrição/solução e impacto no card.
- Gates: `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`.

## Risks / Trade-offs

- **Cache de navegação x detalhe** -> O cabeçalho usa o endpoint de detalhe (60 s) e a sidebar usa a
  navegação (60 s); uma publicação recente pode levar até 60 s para aparecer. Mitigação: manter o
  cache curto e documentar o trade-off; o `stale-while-revalidate` evita bloqueio.
- **Contagem por sistema maior que o total** -> Comportamento esperado para chamadas multi-software.
  Mitigação: documentar no doc 21 e no doc 19; não somar sistemas para obter o total.
- **Sistema inválido na URL** -> Pode gerar uma página vazia. Mitigação: estado vazio com “Ver todas
  as chamadas”, sem 404 e sem quebrar o cabeçalho.
- **`situacao` removida** -> A referência visual original não tem fonte. Mitigação: usar o `tipo` no
  badge; não reintroduzir a coluna.
- **HTML/XSS na descrição** -> `descricao_completa` é texto puro; não renderizar `descricao_html` sem
  sanitização. Mitigação: interpolar como texto e truncar por CSS.
- **Performance da lista** -> `EXISTS` na junção evita multiplicação; mídias/softwares em lote. O
  índice `idx_entregas_proj` + `idx_entregas_publicado_em` atende o filtro; se o `EXPLAIN` mostrar
  full scan, avaliar índice composto `(projeto_id, status, publicado_em)` em migration aditiva.
- **Sincronização da sidebar** -> A prop opcional precisa de teste de deep link e voltar/avançar.
  Mitigação: cobrir no QA manual e no teste de helpers da URL.
- **Galeria no mobile** -> Foco e fechamento precisam funcionar no drawer. Mitigação: reutilizar o
  padrão do modal existente e testar teclado/`Escape`.

## Migration Plan

- Não há migration de banco.
- Deploy: código (shared/server/app) + rotas públicas + docs/vitrine. O middleware já libera
  `GET`/`HEAD` em `/api/publico/**`.
- Rollback: remover as rotas `/escopos/**`, as duas rotas de API e os links da sidebar; nenhum dado é
  alterado, então não há rollback de banco.
- Compatibilidade: a página é aditiva; o shell administrativo, o RBAC e o módulo de Escopo não
  mudam.

## Open Questions

Nenhuma pendente. As decisões de rota, badge, hero, paginação/ordenação e alcance da documentação
foram confirmadas antes deste change.
