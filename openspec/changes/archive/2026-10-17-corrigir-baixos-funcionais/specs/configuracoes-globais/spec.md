# Spec Delta

## ADDED Requirements

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário em Configurações Globais SHALL ser genéricas, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha de gravação sem detalhe interno
- **WHEN** salvar as configurações falha
- **THEN** o toast informa apenas que não foi possível salvar, sem citar banco