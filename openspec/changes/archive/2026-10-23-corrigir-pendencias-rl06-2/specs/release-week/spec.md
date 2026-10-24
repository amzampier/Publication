# Spec Delta

## ADDED Requirements

### Requirement: A unicidade considera apenas ciclos ativos

A unicidade de (ano, semana) SHALL considerar apenas registros **não arquivados**. Deve existir no máximo um ciclo ativo por chave; vários ciclos arquivados com a mesma chave PODEM coexistir. Uma tentativa de criar outro ciclo ativo com a mesma chave SHALL responder `409`; recriar um ciclo cuja única ocorrência está arquivada SHALL ser permitido e SHALL preservar o arquivado.

#### Scenario: Chave ativa duplicada
- **WHEN** já existe uma Release Week ativa com a mesma semana/ano
- **THEN** a criação responde `409` e nada é gravado

#### Scenario: Recriar após arquivar
- **WHEN** a única Release Week com a semana/ano está arquivada
- **THEN** é possível criar uma nova Release Week ativa com a mesma chave

### Requirement: A visibilidade pública respeita a data de publicação

A Release Week SHALL ser considerada pública somente quando estiver `Publicado`, não arquivada e com `data_publicacao` não futura. A regra vale para as futuras leituras da Área Pública e para a visibilidade das chamadas filhas.

#### Scenario: Publicação futura não aparece
- **WHEN** a Release Week está `Publicado` com `data_publicacao` posterior a hoje
- **THEN** ela não é considerada pública até a data

#### Scenario: Publicação efetiva aparece
- **WHEN** a Release Week está `Publicado` e a `data_publicacao` não é futura
- **THEN** ela é considerada pública