# Spec Delta

## ADDED Requirements

### Requirement: A publicação da Release Week publica as chamadas filhas

Ao publicar uma Release Week, o sistema SHALL, na mesma transação, alterar para `Publicado` as
chamadas vinculadas por `release_id` que estejam em `Publicar`. Chamadas em `Revisar`, `Aprovado` ou
`Recusado` NÃO SHALL ser publicadas pela cascata. Cada chamada alterada SHALL receber uma linha em
`historico_esteira_revisao` com status anterior `Publicar`, novo status `Publicado`, o responsável
pela publicação da Release Week e parecer indicando a publicação automática pelo conteúdo pai. A
auditoria SHALL ser registrada uma única vez na publicação da Release Week. A `data_liberacao` das
chamadas SHALL ser preservada. Quando a Release Week deixar de estar `Publicado` por edição ou
reabertura, as chamadas filhas em `Publicado` que não tenham outro vínculo ativo publicado SHALL
voltar para `Publicar` e receber a transição no histórico. Arquivar a Release Week NÃO SHALL alterar
o status das chamadas filhas; a visibilidade pública passa a exigir que o conteúdo pai esteja
`Publicado` e não arquivado.

#### Scenario: Publicar com chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em uma Release Week que possui chamadas filhas em `Publicar`
- **THEN** a Release Week passa a `Publicado`, as filhas passam a `Publicado` e cada uma recebe histórico

#### Scenario: Publicar sem chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em uma Release Week sem chamadas em `Publicar`
- **THEN** a Release Week passa a `Publicado` e nenhuma chamada é alterada

#### Scenario: Chamada em revisão não é publicada

- **WHEN** a Release Week é publicada e possui chamadas filhas em `Revisar`, `Aprovado` ou `Recusado`
- **THEN** essas chamadas preservam o status e não ficam visíveis no portal

#### Scenario: Reabrir a Release Week despublica as filhas

- **WHEN** a Release Week deixa de estar `Publicado` por edição ou reabertura
- **THEN** as chamadas filhas em `Publicado` sem outro pai publicado voltam para `Publicar` e recebem histórico

#### Scenario: Múltiplos vínculos preservam a filha publicada

- **WHEN** uma chamada em `Publicado` tem vínculos com a Release Week reaberta e com outro conteúdo pai ainda `Publicado`
- **THEN** a chamada permanece em `Publicado`

#### Scenario: Arquivar não altera as filhas

- **WHEN** a Release Week é arquivada
- **THEN** o status das chamadas filhas é preservado e a visibilidade pública passa a considerá-las fora do portal por o pai estar arquivado
