# Spec Delta

## ADDED Requirements

### Requirement: A publicação do escopo publica as chamadas filhas

Ao publicar um escopo de projetos, o sistema SHALL, na mesma transação, alterar para `Publicado` as
chamadas vinculadas por `projeto_id` que estejam em `Publicar`. Chamadas em `Revisar`, `Aprovado` ou
`Recusado` NÃO SHALL ser publicadas pela cascata. Cada chamada alterada SHALL receber uma linha em
`historico_esteira_revisao` com status anterior `Publicar`, novo status `Publicado`, o responsável
pela publicação do escopo e parecer indicando a publicação automática pelo conteúdo pai. A auditoria
SHALL ser registrada uma única vez na publicação do escopo. A `data_liberacao` das chamadas SHALL ser
preservada. Quando o escopo deixar de estar `Publicado` por edição ou reabertura, as chamadas filhas
em `Publicado` que não tenham outro vínculo ativo publicado SHALL voltar para `Publicar` e receber a
transição no histórico. Arquivar o escopo NÃO SHALL alterar o status das chamadas filhas; a
visibilidade pública passa a exigir que o conteúdo pai esteja `Publicado` e não arquivado.

#### Scenario: Publicar com chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em um escopo que possui chamadas filhas em `Publicar`
- **THEN** o escopo passa a `Publicado`, as filhas passam a `Publicado` e cada uma recebe histórico

#### Scenario: Publicar sem chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em um escopo sem chamadas em `Publicar`
- **THEN** o escopo passa a `Publicado` e nenhuma chamada é alterada

#### Scenario: Chamada em revisão não é publicada

- **WHEN** o escopo é publicado e possui chamadas filhas em `Revisar`, `Aprovado` ou `Recusado`
- **THEN** essas chamadas preservam o status e não ficam visíveis no portal

#### Scenario: Reabrir o escopo despublica as filhas

- **WHEN** o escopo deixa de estar `Publicado` por edição ou reabertura
- **THEN** as chamadas filhas em `Publicado` sem outro pai publicado voltam para `Publicar` e recebem histórico

#### Scenario: Múltiplos vínculos preservam a filha publicada

- **WHEN** uma chamada em `Publicado` tem vínculos com o escopo reaberto e com outro conteúdo pai ainda `Publicado`
- **THEN** a chamada permanece em `Publicado`

#### Scenario: Arquivar não altera as filhas

- **WHEN** o escopo é arquivado
- **THEN** o status das chamadas filhas é preservado e a visibilidade pública passa a considerá-las fora do portal por o pai estar arquivado
