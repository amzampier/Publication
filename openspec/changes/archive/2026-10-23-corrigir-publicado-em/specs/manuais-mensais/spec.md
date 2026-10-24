# Spec Delta

## MODIFIED Requirements

### Requirement: A visibilidade pública respeita a data de publicação

O Manual SHALL ser considerado público somente quando estiver `Publicado`, não arquivado e com
`publicado_em` não nulo e não futuro. `publicado_em` SHALL representar a publicação efetiva: a data
agendada quando `data_publicacao` estiver no futuro, ou o instante da transição para `Publicado`
quando a data estiver ausente/passada. A regra vale para as futuras leituras da Área Pública e para
a visibilidade das chamadas filhas.

#### Scenario: Publicação futura não aparece
- **WHEN** o Manual está `Publicado` com `data_publicacao` posterior a hoje e `publicado_em` futuro
- **THEN** ele não é considerado público até a data

#### Scenario: Publicação efetiva aparece
- **WHEN** o Manual está `Publicado` e o `publicado_em` não é futuro
- **THEN** ele é considerado público

#### Scenario: Saída de Publicado limpa o carimbo
- **WHEN** o Manual deixa de estar `Publicado`
- **THEN** `publicado_em` é limpo e ele deixa de ser público
