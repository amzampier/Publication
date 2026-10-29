# Spec Delta

## ADDED Requirements

### Requirement: A Data de Publicação não exige dia da semana

O Escopo de Projetos SHALL aceitar qualquer data civil válida em `data_publicacao`, sem exigir segunda-feira, dia útil ou o próximo dia útil de um feriado. A regra SHALL valer para a inclusão, a edição, a publicação e a importação XLSX, que SHALL usar a data informada quando presente e SHALL rejeitar apenas datas malformadas. A ação **Publicar** SHALL continuar preenchendo `data_publicacao` com a data corrente, também sem restrição de dia da semana. A visibilidade pública SHALL continuar regida por `publicado_em`, e não pela regra de segunda-feira da Release Week.

#### Scenario: Inclusão em dia diferente de segunda

- **WHEN** o usuário inclui um Escopo com Data de Publicação em uma terça, quinta, sexta, sábado ou domingo válidos
- **THEN** o escopo é gravado com a data informada e entra na grade

#### Scenario: Edição em dia diferente de segunda

- **WHEN** o usuário altera a Data de Publicação de um Escopo para uma data fora de segunda-feira
- **THEN** a alteração é aceita e persistida

#### Scenario: Importação com data fora de segunda

- **WHEN** a planilha traz uma Data de Publicação válida em um dia diferente de segunda-feira
- **THEN** a linha é classificada como `pronto` e o escopo é importado com a data informada

#### Scenario: Publicação usa a data corrente

- **WHEN** o usuário confirma "Publicar" em qualquer dia da semana
- **THEN** o status passa a `Publicado`, `data_publicacao` recebe a data corrente e a visibilidade pública segue `publicado_em`

#### Scenario: Data malformada é recusada

- **WHEN** o usuário ou a planilha informa uma Data de Publicação que não é uma data civil válida
- **THEN** a operação é recusada com erro no campo e nada é gravado
