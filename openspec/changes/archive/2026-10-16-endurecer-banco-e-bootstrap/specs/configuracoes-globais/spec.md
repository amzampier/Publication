# Spec Delta

## ADDED Requirements

### Requirement: A gravação das configurações é atômica
O sistema SHALL gravar a atualização das configurações de forma atômica entre as tabelas envolvidas
(`configuracoes_globais` e `configuracoes_limite_requisicao`): se qualquer escrita falhar, nenhuma
alteração SHALL persistir e o cliente SHALL receber erro, sem estado parcial gravado.

#### Scenario: Falha parcial não deixa estado inconsistente
- **WHEN** um `PUT /api/configuracoes` altera as duas superfícies e a gravação de uma delas falha
- **THEN** nenhuma configuração muda (rollback) e a API responde com erro, mantendo os valores anteriores
