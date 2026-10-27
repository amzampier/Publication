# Spec Delta

## ADDED Requirements

### Requirement: O PDF de Chamadas tem limite operacional

A exportação **PDF** do conjunto filtrado SHALL ter um limite de **5.000 chamadas** por geração. Acima do limite, a tela SHALL informar que é necessário refinar os filtros e NÃO SHALL gerar um PDF parcial silencioso. A exportação **CSV** NÃO SHALL ser afetada por esse teto e SHALL continuar em streaming/keyset.

#### Scenario: PDF dentro do limite

- **WHEN** o usuário gera o PDF com até 5.000 chamadas no conjunto filtrado
- **THEN** o arquivo é gerado com a contagem e as colunas da listagem

#### Scenario: PDF acima do limite

- **WHEN** o conjunto filtrado excede 5.000 chamadas
- **THEN** a tela informa que é necessário refinar os filtros e nenhum PDF parcial é gerado

#### Scenario: CSV não é limitado pelo teto do PDF

- **WHEN** o conjunto filtrado excede 5.000 chamadas e o usuário exporta CSV
- **THEN** o CSV continua sendo gerado em streaming

### Requirement: A Data de liberação é limpa ao remover a Release e validada na herança

Ao remover a Release selecionada, o formulário SHALL limpar a **Data de liberação** herdada. Ao aprovar uma chamada sem data de liberação, o servidor SHALL herdar a data do vínculo pai (Release, Manual ou Escopo) e SHALL validá-la como data de publicação (segunda-feira ou próximo dia útil quando a segunda for feriado). Data herdada inválida SHALL impedir a aprovação com erro claro; uma data já existente SHALL ser preservada.

#### Scenario: Remover a Release limpa a data

- **WHEN** o usuário seleciona uma Release e depois volta para “Nenhuma release”
- **THEN** a Data de liberação herdada é limpa

#### Scenario: Aprovação herda data válida

- **WHEN** a chamada está sem Data de liberação e o vínculo pai possui data de publicação válida
- **THEN** a aprovação grava essa data e a chamada avança para `Aprovado`

#### Scenario: Aprovação recusa data herdada inválida

- **WHEN** a chamada está sem Data de liberação e o vínculo pai possui data fora da regra de publicação
- **THEN** a aprovação é recusada com mensagem clara e a chamada permanece em `Revisar`

#### Scenario: Data existente é preservada

- **WHEN** a chamada já possui Data de liberação
- **THEN** a aprovação preserva a data existente
