# Spec Delta

## ADDED Requirements

### Requirement: As APIs de usuários não expõem a senha do SMTP
O sistema SHALL NOT devolver a senha do SMTP nas respostas das APIs de usuários (listagem, criação
e edição): no lugar do valor, a API SHALL informar apenas se há senha cadastrada, e a senha SHALL
ser gravada **cifrada em repouso**. Em uma edição enviada sem nova senha SMTP, a senha já
armazenada SHALL ser preservada.

#### Scenario: Listagem não traz a senha
- **WHEN** `GET /api/usuarios` é chamado
- **THEN** cada usuário traz um indicador de existência de senha SMTP e **nunca** o valor em claro

#### Scenario: Senha vazia preserva a existente
- **WHEN** uma edição de usuário é enviada sem uma nova senha SMTP
- **THEN** a senha SMTP armazenada permanece inalterada (a edição não a apaga)

#### Scenario: Nova senha é gravada cifrada
- **WHEN** uma edição envia uma nova senha SMTP
- **THEN** o valor é gravado de forma cifrada, sem que a leitura da API o devolva em claro
