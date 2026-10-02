# Spec Delta

## ADDED Requirements

### Requirement: Métricas e colunas numéricas usam monoespaçada com dígitos tabulares
O sistema SHALL exibir valores numéricos de métricas (`UiKpi`) e células de colunas numéricas da `UiDataTable` com `font-mono tabular-nums`, em **qualquer** alinhamento (esquerda, centro ou direita), de modo que dígitos alinhem verticalmente em qualquer apresentação tabular.

#### Scenario: Valor do Kpi em mono tabular
- **WHEN** um cartão `UiKpi` renderiza seu valor (métrica)
- **THEN** o valor usa `font-mono` com `tabular-nums`, aplicando a identidade monoespaçada oficial

#### Scenario: Coluna numérica centralizada tem dígitos tabulares
- **WHEN** uma coluna numérica da `UiDataTable` é renderizada com alinhamento central (ex.: coluna "Tentativas" da aba Segurança)
- **THEN** as células exibem `tabular-nums`, independentemente do alinhamento

#### Scenario: Qualquer alinhamento numérico é tabular
- **WHEN** uma coluna com `isNumeric` é renderizada com alinhamento à esquerda, ao centro ou à direita
- **THEN** todas as células da coluna recebem `tabular-nums`
