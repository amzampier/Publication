# Spec Delta

## MODIFIED Requirements

### Requirement: A visibilidade pública respeita a data de publicação

A Release Week SHALL ser considerada pública somente quando estiver `Publicado`, não arquivada e com
`publicado_em` não nulo e não futuro. `publicado_em` SHALL representar a publicação efetiva: a data
agendada quando `data_publicacao` estiver no futuro, ou o instante da transição para `Publicado`
quando a data estiver ausente/passada. A regra vale para as futuras leituras da Área Pública e para
a visibilidade das chamadas filhas.

#### Scenario: Publicação futura não aparece
- **WHEN** a Release Week está `Publicado` com `data_publicacao` posterior a hoje e `publicado_em` futuro
- **THEN** ela não é considerada pública até a data

#### Scenario: Publicação efetiva aparece
- **WHEN** a Release Week está `Publicado` e o `publicado_em` não é futuro
- **THEN** ela é considerada pública

#### Scenario: Saída de Publicado limpa o carimbo
- **WHEN** a Release Week deixa de estar `Publicado`
- **THEN** `publicado_em` é limpo e ela deixa de ser pública
