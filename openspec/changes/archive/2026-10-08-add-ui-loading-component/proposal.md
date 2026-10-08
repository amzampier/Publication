# Proposal

## Why

O Publications não tem componente de feedback para operações longas (importação, export, salvamento
em andamento): o único indicador existente é o spinner inline do `UiButton` com `loading`, que só
serve dentro de um botão e não bloqueia a tela nem explica o que está acontecendo. A vitrine
`/design` e `docs/01` também não têm nenhuma seção de carregamento — o design system está sem a
peça básica de "aguarde, processando".

## What Changes

- **Novo componente `UiLoading`** (`app/components/ui/Loading.vue`): overlay montado via
  `Teleport to="body"` com backdrop escuro (mesmo padrão do `UiModal`) e uma caixa centralizada
  composta por **borda em degradê giratório** (`#112051` → `#0364f7` → `#4ed813`),
  **ícone `LoaderCircle` girando à esquerda** (cor `brand-structure`), **mensagem** explicando a
  operação e **barra de progresso opcional com contador** (props `current`/`total` — o componente
  calcula o percentual e formata o contador em pt-BR, com fill no degradê da marca). Props
  `message`, `size` (`sm|md|lg`), `current` e `total`; o consumidor controla a exibição com `v-if`.
- **CSS próprio da borda** em `app/assets/css/main.css` (classe `.ds-loading` + `@keyframes`):
  Tailwind 3 não oferece utilitário de degradê cônico, e os hexes de marca no CSS são o precedente
  já aceito do `.ds-slider` (a regra de "sem hex no componente" vale para `app/components/`).
- **Vitrine `/design` ganha a seção 18** (Loading) com demonstrações da abertura do overlay
  (simples e com barra de progresso) e auto-fecho, mais a entrada correspondente no índice de
  navegação.
- **Documentação**: `docs/01 - design_system.md` ganha o §5.17 e a linha no Sumário.
- **Fora desta fase**: uso do componente em telas reais (importação, export etc.) — fica para um
  change seguinte, após aceite visual na vitrine.

## Capabilities

### New Capabilities

- `design-system/loading`: contrato do `UiLoading` — composição (backdrop + caixa + borda em
  degradê giratório + ícone + mensagem), cores na ordem da marca, camada acima de modais e
  comportamento não-dismissível com bloqueio de interação, acessibilidade e movimento reduzido,
  tamanhos e espelhamento na vitrine `/design`.

### Modified Capabilities

- `design-system/brand-tokens`: o requisito "Botão primário e header de modal usam degradê" lista
  exhaustivamente as superfícies que podem exibir degradê; a borda do `UiLoading` e a barra de
  progresso do mesmo componente são superfícies novas e precisam entrar na lista (borda como
  degradê cônico giratório, barra como degradê horizontal na mesma paleta), sob pena de a spec
  nova contradizer a existente.

## Impact

- **Código**: `app/components/ui/Loading.vue` (novo), `app/assets/css/main.css` (`.ds-loading`),
  `app/pages/design.vue` (seção 18 + índice + import de ícone).
- **Documentação**: `docs/01 - design_system.md` (§5.17 + Sumário).
- **Specs**: nova capability `design-system/loading`; delta em `design-system/brand-tokens`.
- **API**: nenhuma API existente muda; sem novas dependências (`@lucide/vue` já instalado com
  `LoaderCircle`).
- **Comportamento em tela**: overlay em camada alta (`z` acima do modal) — toasts disparados
  durante o loading aparecem atrás do backdrop até ele fechar (comportamento documentado na spec).
