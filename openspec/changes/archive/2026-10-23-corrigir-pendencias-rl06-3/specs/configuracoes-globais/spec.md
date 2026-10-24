# Spec Delta

## MODIFIED Requirements

### Requirement: Os textos derivados do valor de retenção atualizam-se com ele

O sistema SHALL derivar do valor vigente de retenção o subtítulo “Registros com mais de N dias são
removidos pela rotina de expurgo”, um resumo em linguagem natural da rotina e a query técnica
correspondente. O resumo SHALL explicar que os registros são removidos (não apenas marcados) e a
query SHALL ficar disponível em um detalhe técnico expansível/recolhido, sem expor SQL bruto como
texto principal do banner.

#### Scenario: Subtítulo dinâmico

- **WHEN** o valor vigente é 365
- **THEN** o subtítulo lê “Registros com mais de 365 dias são removidos pela rotina de expurgo”

#### Scenario: Resumo natural

- **WHEN** o painel de retenção é exibido
- **THEN** o banner apresenta a rotina em linguagem natural, sem exigir leitura de SQL para entendê-la

#### Scenario: Query dinâmica

- **WHEN** o valor vigente é 180 e o detalhe técnico é expandido
- **THEN** a query exibida contém `INTERVAL 180 DAY` e permanece recolhida por padrão
