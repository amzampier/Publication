# Spec Delta

## ADDED Requirements

### Requirement: O nome do perfil é único
O sistema SHALL garantir a unicidade do nome do perfil no banco (`perfis_acesso.nome_perfil`): criar
um perfil ou renomear um perfil para um nome já existente SHALL responder `409` sem gravar,
preservando o registro existente. A restrição de unicidade do banco é a garantia de integridade
final.

#### Scenario: Criação com nome duplicado é recusada
- **WHEN** `POST /api/perfis` é chamado com um `nome_perfil` já existente
- **THEN** a API responde `409` e nenhum perfil é criado

#### Scenario: Edição para nome existente é recusada
- **WHEN** `PUT /api/perfis/:id` renomeia um perfil para o nome de outro perfil já existente
- **THEN** a API responde `409` e nenhum nome é alterado
