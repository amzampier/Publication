# Spec Delta

## ADDED Requirements

### Requirement: A exportação de perfis informa falha ao usuário
Ao gerar um relatório de perfis (CSV ou PDF), se a geração do arquivo falhar, o sistema SHALL exibir um toast de erro, nunca falhando em silêncio.

#### Scenario: Falha na exportação exibe erro
- **WHEN** o usuário aciona um item de "Relatórios" e a geração do arquivo falha
- **THEN** um toast de erro é exibido informando que a exportação não foi concluída

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário em Perfis de Acesso SHALL ser genéricas, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha sem detalhe interno
- **WHEN** uma carga/cópia/gravação falha
- **THEN** a mensagem informa apenas que a operação não foi concluída, sem citar banco