# Spec Delta

## ADDED Requirements

### Requirement: A migration de publicação efetiva reconcilia os carimbos

A migration SHALL adicionar `publicado_em DATETIME(6) NULL` em `release_week`,
`manuais_mensal`, `projetos_escopo` e `entregas_itens`, com índice de leitura pública. Para
registros existentes em `Publicado`, SHALL preencher `publicado_em` a partir da data agendada
(`data_publicacao` ou `data_liberacao`) quando ela existir; sem data, SHALL usar a data de criação
como referência histórica. Registros fora de `Publicado` SHALL permanecer com `publicado_em` nulo.
A migration SHALL ser idempotente e ter rollback documentado.

#### Scenario: Coluna e índice presentes
- **WHEN** a migration termina
- **THEN** as quatro tabelas possuem `publicado_em` e o índice de leitura pública

#### Scenario: Publicado existente recebe carimbo
- **WHEN** a base já contém um registro `Publicado` com `data_publicacao`/`data_liberacao`
- **THEN** `publicado_em` é preenchido com a data agendada, inclusive quando ela é futura

#### Scenario: Registro não publicado fica sem carimbo
- **WHEN** a base contém registro em status diferente de `Publicado`
- **THEN** `publicado_em` permanece nulo

#### Scenario: Reaplicação não altera carimbos
- **WHEN** a migration é executada novamente em uma base já reconciliada
- **THEN** nenhum carimbo existente é sobrescrito
