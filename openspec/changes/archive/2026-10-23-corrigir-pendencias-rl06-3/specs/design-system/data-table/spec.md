# Spec Delta

## ADDED Requirements

### Requirement: O rótulo da paginação é neutro e configurável

O resumo da paginação SHALL usar um rótulo neutro por padrão (ex.: “registros exibidos”) e SHALL
permitir que o chamador informe o rótulo do conjunto (ex.: “chamadas exibidas”, “parceiros
exibidos”). O componente NÃO SHALL usar um rótulo fixo de outro módulo quando o chamador não o
informar.

#### Scenario: Rótulo padrão neutro

- **WHEN** a paginação é exibida sem um rótulo customizado
- **THEN** o resumo usa “registros” e não um termo específico de outro módulo

#### Scenario: Rótulo customizado

- **WHEN** o chamador informa o rótulo do conjunto
- **THEN** o resumo usa exatamente esse rótulo, com pluralização coerente
