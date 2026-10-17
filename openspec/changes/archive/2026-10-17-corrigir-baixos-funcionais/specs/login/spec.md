# Spec Delta

## ADDED Requirements

### Requirement: O evento de recuperação reflete o resultado do envio
O evento registrado na trilha para a solicitação de recuperação de senha SHALL refletir o resultado real do envio: quando o e-mail de recuperação for entregue, o detalhe informa que a senha provisória foi enviada; quando o envio falhar, o detalhe SHALL indicar a falha — nunca afirmar "enviada" em um envio malsucedido.

#### Scenario: Detalhe reflete o envio bem-sucedido
- **WHEN** a recuperação é solicitada e o e-mail de recuperação é entregue
- **THEN** o evento da trilha descreve que a senha provisória foi enviada

#### Scenario: Detalhe reflete a falha de envio
- **WHEN** a recuperação é solicitada e o provedor de e-mail falha
- **THEN** o evento da trilha indica que o envio falhou (sem afirmar que a senha provisória foi enviada)