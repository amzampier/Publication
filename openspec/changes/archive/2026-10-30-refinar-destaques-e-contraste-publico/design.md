# Design

## Context

Ver `proposal.md` — Why. O card do Escopo já destacava `Crítico` em rose e o painel listava até três
chamadas críticas em `/escopos/{id}`. O tema escuro usava a mesma superfície para página, header,
sidebar e cards, e o hash da chamada não era tratado porque o shell rola dentro do `<main>` e o
`scrollBehavior` do Nuxt rodava na navegação SPA.

## Goals / Non-Goals

**Goals:**

- Dar ao impacto `Alto` o mesmo tipo de destaque do crítico, em laranja, no card do Escopo.
- Incluir `Alto` no card de destaques do painel, sem perder a prioridade das críticas.
- Abrir a chamada em destaque já posicionada no card, inclusive na navegação SPA.
- Separar visualmente página, superfícies e hover no tema escuro.

**Non-Goals:**

- Criar uma página pública de detalhe da chamada.
- Criar um feed global de chamadas de alto impacto fora do escopo em destaque.
- Alterar o schema, criar migration ou novo endpoint.
- Mudar a Área Administrativa.

## Decisions

### D1. `Alto` usa a variante `alto` do `UiBadge` e o mesmo tratamento do crítico

`varianteImpacto` passa a mapear `Crítico → critico`, `Alto → alto` e os demais → `neutral`.
A variante `alto` usa `orange-50/200/700`, `Gauge` e as classes escuras
`dark:bg-orange-950/40 dark:border-orange-900 dark:text-orange-300`. No card, o impacto alto recebe
moldura/barra laranja na borda esquerda (`orange-300`/`orange-600`), anel e sombra, com o texto
“Impacto: Alto”. A alternativa de manter o badge neutro foi descartada porque o pedido é o mesmo
destaque do crítico, apenas em outra cor.

### D2. O card do painel lista `Crítico` e `Alto` juntos

A consulta do painel passa a filtrar `impacto IN ('Crítico', 'Alto')`, ordenando
`CASE WHEN impacto = 'Crítico' THEN 0 ELSE 1 END, ordem_apresentacao, chamada`, com `LIMIT 3`. O
título do card passa a **“Chamadas em destaque”**. O campo público `chamadasCriticas` foi mantido
para não quebrar o contrato já publicado; a documentação passa a defini-lo como a lista de destaques
(`Crítico` e `Alto`). O badge de cada item usa `varianteImpacto`/`rotuloImpacto`.

### D3. Âncora por chamada e scroll no `<main>`

Cada `EscopoChamadaCard` recebe `id="chamada-{id}"` e `scroll-mt-24`. Os itens do painel apontam para
`/escopos/{id}#chamada-{id}`. Como o shell público rola dentro do `<main>` (`overflow-y-auto`), a
página calcula o offset do card em relação a esse container e aplica `scrollTop` imediatamente e
novamente após 300 ms — a segunda aplicação é necessária porque a transição de página desmonta o
conteúdo antigo e zera o scroll. `app/router.options.ts` retorna `false` para esse hash em
`/escopos/*`, evitando que o scrollBehavior padrão devolva a página ao topo. Nenhum anel/borda extra é
aplicado.

### D4. Hierarquia do tema escuro

A página usa `bg-slate-800`; header, sidebar e cards usam `bg-slate-900`. O hover neutro sobe para
`slate-700` e as opções com vínculo usam tints `indigo-500/20`/`emerald-500/20`. Isso cria três
níveis (fundo, superfície, hover) e resolve a falta de contraste sem alterar a paleta editorial.

## Risks / Trade-offs

- **Chamada em destaque fora da página 1** → a âncora só existe no DOM da página atual; o conjunto
  atual cabe na página 1. Evolução futura: incluir a página no DTO de destaques para montar
  `?pagina=N#chamada-{id}`.
- **Scroll após transição** → o segundo `scrollTop` em 300 ms cobre a desmontagem; se o layout
  demorar mais, o retry de 50 ms até 10 vezes cobre a ausência do card.
- **Campo `chamadasCriticas` com nome legado** → mantido por compatibilidade; docs e tipos explicam
  que a lista inclui `Crítico` e `Alto`.

## Migration Plan

Sem migration. As alterações são de UI, contrato de leitura e documentação; rollback é reverter o
commit.

## Open Questions

Nenhuma.
