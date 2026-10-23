# Spec Delta

## ADDED Requirements

### Requirement: As agregações do Painel são limitadas e indexadas

As consultas do Painel Executivo SHALL usar índices para os filtros e janelas de data, SHALL
agregar no banco sempre que possível e NÃO SHALL materializar a tabela inteira de chamadas em memória
para calcular indicadores. A carga de cada requisição SHALL ser limitada e executada em grupos de
paralelismo controlado, de modo que a abertura do painel não esgote o pool em concorrência moderada.

#### Scenario: Janela de data usa índice
- **WHEN** o painel consulta chamadas por `data_lancamento`/`data_liberacao` e publicações por `data_publicacao`
- **THEN** o plano de execução usa os índices de data e não uma varredura completa da tabela

#### Scenario: Indicadores calculados sem materializar o histórico
- **WHEN** o painel calcula o fluxo global e as séries do período
- **THEN** as contagens são agregadas no banco e a aplicação não recebe todas as linhas de chamadas para contar em memória

#### Scenario: Concorrência moderada preservada
- **WHEN** dez painéis são abertos simultaneamente
- **THEN** as requisições respondem `200` (ou `503` com `Retry-After` apenas sob saturação real), sem `500` de fila