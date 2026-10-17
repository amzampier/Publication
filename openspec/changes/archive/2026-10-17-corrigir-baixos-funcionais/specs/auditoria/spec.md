# Spec Delta

## ADDED Requirements

### Requirement: A exportação de auditoria informa falha ao usuário
Ao exportar a trilha (CSV ou PDF), se a consulta ou a geração do arquivo falhar, o sistema SHALL exibir um toast de erro, nunca falhando em silêncio.

#### Scenario: Falha na exportação exibe erro
- **WHEN** o usuário aciona uma opção de "Exportar" e a consulta/geração falha
- **THEN** um toast de erro é exibido informando que a exportação não foi concluída

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário na Gestão de Auditoria SHALL ser genéricas, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha de carga sem detalhe interno
- **WHEN** a carga dos registros falha
- **THEN** o toast informa apenas que não foi possível carregar os dados, sem citar banco

### Requirement: Filtro de data inválida é recusado com 400
O filtro de data da auditoria SHALL aceitar apenas datas reais (`yyyy-mm-dd` com mês 1–12 e dia válido); uma data presente porém inválida SHALL ser recusada com `400`, sem atingir o banco.

#### Scenario: Data inexistente é recusada
- **WHEN** a consulta traz uma data como `2026-13-99` (formato correto, data inexistente)
- **THEN** a API responde `400` e nenhuma consulta é executada

### Requirement: O detalhe do registro exibe o identificador da entidade
A API da auditoria SHALL expor o identificador da entidade afetada (`entidade_id`) e o detalhe do registro SHALL exibi-lo quando presente, ampliando a rastreabilidade.

#### Scenario: Detalhe mostra a entidade afetada
- **WHEN** um registro com `entidade_id` preenchido tem seu detalhe aberto
- **THEN** o identificador da entidade é exibido no detalhe