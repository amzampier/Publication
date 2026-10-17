# Spec Delta

## ADDED Requirements

### Requirement: A liberação de bloqueio é idempotente
A ação de liberar o bloqueio de uma conta (`POST /api/seguranca/liberar` com `usuarioId`) SHALL
responder sucesso (`200`) quando a conta existe, independentemente de a conta estar com falhas ou
bloqueio vigente — inclusive quando a conta já está limpa (zero falhas e sem bloqueio) —, e SHALL
responder `404` somente quando a conta não existe. Liberações repetidas ou concorrentes da mesma
conta não SHALL gerar erro nem mensagem de "não encontrado".

#### Scenario: Liberar conta já limpa responde sucesso
- **WHEN** a conta existe e já está sem falhas e sem bloqueio (ex.: dupla liberação ou liberação concorrente)
- **THEN** a API responde `200` (`{ ok: true }`), não `404`

#### Scenario: Liberar conta inexistente responde 404
- **WHEN** o `usuarioId` não corresponde a nenhuma conta cadastrada
- **THEN** a API responde `404` com mensagem de usuário não encontrado
