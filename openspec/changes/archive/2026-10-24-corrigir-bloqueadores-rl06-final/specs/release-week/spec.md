# Spec Delta

## ADDED Requirements

### Requirement: A data efetiva de publicação é preservada em edições

Ao editar uma Release Week que já está `Publicado` sem alterar o status, o sistema SHALL preservar
o `publicado_em` original. O carimbo SHALL ser gravado apenas na transição para `Publicado` e limpo
ao sair dele.

#### Scenario: Edição de conteúdo já publicado
- **WHEN** o usuário edita apenas a descrição de uma Release `Publicado`
- **THEN** `publicado_em` permanece com o valor original

#### Scenario: Transição para publicado
- **WHEN** a Release muda de um status não publicado para `Publicado`
- **THEN** `publicado_em` é gravado conforme a data efetiva

#### Scenario: Saída de publicado
- **WHEN** a Release deixa de ser `Publicado`
- **THEN** `publicado_em` é limpo