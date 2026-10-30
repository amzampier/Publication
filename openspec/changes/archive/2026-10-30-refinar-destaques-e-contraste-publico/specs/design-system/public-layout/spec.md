# Spec Delta

## ADDED Requirements

### Requirement: O tema escuro do shell público mantém hierarquia de superfícies

O shell público SHALL usar `bg-slate-800` na página e `bg-slate-900` no header, na sidebar e nos
cards, de modo que as superfícies se destaquem do fundo. O hover de opções com vínculo SHALL usar
`slate-700` ou tints `indigo-500/20`/`emerald-500/20`, mantendo contraste AA com o texto e sem
confundir o estado de hover com a superfície em repouso.

#### Scenario: Página e superfícies no tema escuro

- **WHEN** o shell público é exibido no tema escuro
- **THEN** a página usa `bg-slate-800` e header, sidebar e cards usam `bg-slate-900`, formando
  níveis visuais distintos

#### Scenario: Hover de opção com vínculo

- **WHEN** o visitante passa o mouse em uma opção de release, manual, escopo ou sistema na sidebar
- **THEN** o item exibe `slate-700` ou o tint `/20` correspondente, com contraste visível em relação
  ao estado de repouso
