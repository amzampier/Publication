# Spec Delta

## MODIFIED Requirements

### Requirement: Os textos derivados do valor de retenção atualizam-se com ele
O sistema SHALL derivar do valor vigente de retenção o subtítulo "Registros com mais de N dias são marcados para expurgo" e a query de expurgo exibida no banner informativo, sem valores fixos, aplicada à tabela canônica de auditoria (`auditoria`).

#### Scenario: Subtítulo dinâmico
- **WHEN** o valor vigente é 365
- **THEN** o subtítulo lê "Registros com mais de 365 dias são marcados para expurgo"

#### Scenario: Query dinâmica
- **WHEN** o valor vigente é 180
- **THEN** o banner "Rotina de Expurgo Automático" exibe `INTERVAL 180 DAY` na query

#### Scenario: Query usa o nome canônico da tabela
- **WHEN** o banner "Rotina de Expurgo Automático" é exibido
- **THEN** a query de expurgo referencia a tabela `auditoria` (não `logs_auditoria`)