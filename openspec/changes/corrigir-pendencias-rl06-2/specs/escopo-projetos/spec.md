# Spec Delta

## ADDED Requirements

### Requirement: A unicidade considera apenas ciclos ativos

A unicidade de `(ano, versao)` SHALL considerar apenas registros **não arquivados**. Deve existir no máximo um escopo ativo por chave; vários escopos arquivados com a mesma chave PODEM coexistir. Uma tentativa de criar outro escopo ativo com a mesma chave SHALL responder `409`; recriar um escopo cuja única ocorrência está arquivada SHALL ser permitido e SHALL preservar o arquivado.

#### Scenario: Chave ativa duplicada
- **WHEN** já existe um Escopo ativo com o mesmo ano/versão
- **THEN** a criação responde `409` e nada é gravado

#### Scenario: Recriar após arquivar
- **WHEN** o único Escopo com o ano/versão está arquivado
- **THEN** é possível criar um novo Escopo ativo com a mesma chave

### Requirement: A visibilidade pública respeita a data de publicação

O Escopo SHALL ser considerado público somente quando estiver `Publicado`, não arquivado e com `data_publicacao` não futura. A regra vale para as futuras leituras da Área Pública e para a visibilidade das chamadas filhas.

#### Scenario: Publicação futura não aparece
- **WHEN** o Escopo está `Publicado` com `data_publicacao` posterior a hoje
- **THEN** ele não é considerado público até a data

#### Scenario: Publicação efetiva aparece
- **WHEN** o Escopo está `Publicado` e a `data_publicacao` não é futura
- **THEN** ele é considerado público