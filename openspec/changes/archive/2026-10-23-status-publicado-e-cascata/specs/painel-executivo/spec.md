# Spec Delta

## MODIFIED Requirements

### Requirement: O painel apresenta os KPIs do ciclo editorial

O painel SHALL exibir, para o período selecionado, os KPIs: **Releases publicadas**, **Chamadas
lançadas**, **Chamadas liberadas**, **% do fluxo concluído**, **Lead time médio** e **Taxa de
recusa**. As definições SHALL ser:

- **Releases publicadas:** Releases Week com `status = Publicado`, agrupadas por
  `YEAR(data_publicacao)`/`MONTH(data_publicacao)`; releases arquivadas SHALL contar no histórico.
- **Chamadas lançadas:** chamadas com `data_lancamento` no período.
- **Chamadas liberadas:** chamadas com `data_liberacao` no período e não posterior a hoje.
- **% do fluxo concluído:** `(Aprovado + Publicar + Publicado) / total do universo do progresso`,
  com o universo definido como as chamadas com ao menos um vínculo não arquivado, incluindo as
  `Publicado`.
- **Lead time médio:** média de `data_liberacao - data_lancamento` em dias, apenas para chamadas
  liberadas.
- **Taxa de recusa:** `Recusado / total do universo do progresso`.

O percentual do fluxo e a taxa de recusa usam o **universo do progresso global** (não filtrado pelo
ano), a mesma regra da tela da Esteira; o seletor de ano afeta apenas publicações, chamadas e
dimensões.

#### Scenario: KPI de releases publicadas

- **WHEN** existem Releases Week com status `Publicado` no ano selecionado
- **THEN** o KPI exibe a contagem dessas releases, incluindo as arquivadas

#### Scenario: KPI de chamadas liberadas não conta o futuro

- **WHEN** uma chamada aprovada tem `data_liberacao` posterior a hoje
- **THEN** ela não entra no KPI de chamadas liberadas, embora permaneça no fluxo

#### Scenario: Percentual inclui publicados

- **WHEN** o universo do progresso tem chamadas em `Aprovado`, `Publicar`, `Publicado` e `Recusado`
- **THEN** o percentual do fluxo conta aprovados, aguardando e publicados no numerador, sem contar recusados

#### Scenario: Fluxo sem chamadas

- **WHEN** não há chamadas com vínculo ativo
- **THEN** o percentual do fluxo e a taxa de recusa exibem `0%` (ou estado vazio), sem divisão por zero
