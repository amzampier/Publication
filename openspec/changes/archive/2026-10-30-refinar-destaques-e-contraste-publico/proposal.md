# Proposal

## Why

Depois da primeira versão dos destaques do Escopo público, quatro lacunas ficaram visíveis: o impacto
**Alto** não tinha o mesmo destaque visual do **Crítico**, não aparecia no card “Chamadas em destaque”
do painel, o clique em uma chamada em destaque abria o Escopo mas não posicionava a página nela, e o
tema escuro deixava página, header, sidebar e cards no mesmo tom (sem hierarquia e com hover fraco).

## What Changes

- Destacar o impacto **Alto** nos cards do Escopo com o mesmo tratamento do crítico, em **laranja**:
  moldura/barra na borda esquerda, anel/sombra e badge `alto` com `Gauge` e “Impacto: Alto”.
- Incluir chamadas com impacto `Alto` no card **“Chamadas em destaque”** do Painel de Destaques,
  junto com as críticas, com as críticas antes das altas e limite total de três.
- Ancorar cada card do Escopo (`chamada-{id}`) e fazer o item em destaque abrir
  `/escopos/{id}#chamada-{id}` já posicionado no card, inclusive na navegação SPA (sem borda/anel
  extra).
- Ajustar o contraste do tema escuro do shell público: página `slate-800`, header/sidebar/cards
  `slate-900`, hover `slate-700` e tints `/20` nas opções com vínculo.
- Atualizar specs, docs e a vitrine; sem migration e sem novo endpoint.

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `escopo-publico`: destaque do impacto alto, badge laranja e âncora por chamada.
- `painel-publico`: card de destaques inclui `Crítico` e `Alto`, com link para a âncora da chamada.
- `design-system/public-layout`: hierarquia de superfícies e hovers do tema escuro do shell público.

## Impact

- **Shared/Server:** `shared/publico.ts` (`varianteImpacto`), `server/utils/publico.ts` (consulta de
  `Crítico`/`Alto` e ordem).
- **App:** `Badge.vue` (variante `alto`), `EscopoChamadaCard.vue` (moldura/âncora),
  `PainelEscopoDestaque.vue` (lista combinada), `app/pages/escopos/[id].vue` (scroll da âncora),
  `app/router.options.ts` (não interferir no hash), `app/layouts/default.vue` e componentes do shell
  (contraste do tema escuro).
- **Docs/specs:** `docs/01`, `docs/18`, `docs/19`, `docs/20`, `docs/21` e specs principais.
- **Testes:** `tests/publico-escopo.test.ts`.
- **Dependências:** nenhuma nova; sem migration.
