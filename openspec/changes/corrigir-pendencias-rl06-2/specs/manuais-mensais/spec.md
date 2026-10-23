# Spec Delta

## ADDED Requirements

### Requirement: A unicidade considera apenas ciclos ativos

A unicidade de `(ano, mes_numero)` SHALL considerar apenas registros **não arquivados**. Deve existir no máximo um catálogo ativo por chave; vários catálogos arquivados com a mesma chave PODEM coexistir. Uma tentativa de criar outro catálogo ativo com a mesma chave SHALL responder `409`; recriar um catálogo cuja única ocorrência está arquivada SHALL ser permitido e SHALL preservar o arquivado.

#### Scenario: Chave ativa duplicada
- **WHEN** já existe um Manual ativo com o mesmo mês/ano
- **THEN** a criação responde `409` e nada é gravado

#### Scenario: Recriar após arquivar
- **WHEN** o único Manual com o mês/ano está arquivado
- **THEN** é possível criar um novo Manual ativo com a mesma chave

### Requirement: A visibilidade pública respeita a data de publicação

O Manual SHALL ser considerado público somente quando estiver `Publicado`, não arquivado e com `data_publicacao` não futura. A regra vale para as futuras leituras da Área Pública e para a visibilidade das chamadas filhas.

#### Scenario: Publicação futura não aparece
- **WHEN** o Manual está `Publicado` com `data_publicacao` posterior a hoje
- **THEN** ele não é considerado público até a data

#### Scenario: Publicação efetiva aparece
- **WHEN** o Manual está `Publicado` e a `data_publicacao` não é futura
- **THEN** ele é considerado público