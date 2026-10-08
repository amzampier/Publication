# Spec Delta

## ADDED Requirements

### Requirement: Controles desabilitados mostram-se somente leitura de forma inequívoca
O sistema SHALL exibir os controles desabilitados de formulário (`Input`, `Textarea`,
`Select`, `DatePicker` e `Segmented`) com fundo `slate-200` atenuado (`opacity-60`), cursor
`not-allowed` e **sem** estados de hover nem de foco (borda e fundo de repouso inalterados, e
gatilho fora do Tab), de modo que o estado somente leitura seja visível de imediato e o
controle não pareça interativo.

#### Scenario: Fundo cinza visível nos cinco controles
- **WHEN** `Input`, `Textarea`, `Select`, `DatePicker` ou `Segmented` é renderizado com
  `disabled`
- **THEN** o controle exibe fundo `slate-200` (distinguível do fundo branco do campo ativo e
  do corpo `slate-100` dos modais), `cursor-not-allowed` e `opacity-60`

#### Scenario: Sem hover nem foco indevido
- **WHEN** um controle desabilitado é passado pelo mouse ou alcançado por teclado
- **THEN** nenhuma borda ou fundo de hover/foco é aplicado (em especial, nenhum destaque
  `brand.focus`) e o controle não recebe foco pelo `Tab`

#### Scenario: Seleção do Segmented continua legível
- **WHEN** um `Segmented` desabilitado tem uma opção selecionada
- **THEN** a track usa `slate-200` **sem** `opacity` no grupo e a seleção aparece como pílula
  `bg-white`, mantendo a opção escolhida distinguível

#### Scenario: Controles habilitados não são afetados
- **WHEN** o mesmo controle é renderizado sem `disabled`
- **THEN** ele mantém o fundo de repouso (branco ou `slate-100` da track), o hover e o foco
  canônicos, sem nenhum vestígio do estado desabilitado
