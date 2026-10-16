# Spec Delta

## ADDED Requirements

### Requirement: A API do próprio registro não devolve a senha do SMTP
O sistema SHALL NOT devolver a senha do SMTP em claro nas respostas de `GET/PATCH /api/usuarios/eu`:
a resposta SHALL informar apenas se há senha cadastrada, e o armazenamento SHALL ser cifrado em
repouso.

#### Scenario: Leitura do próprio perfil não traz a senha
- **WHEN** o usuário lê o próprio registro
- **THEN** a senha SMTP não aparece no corpo (apenas um indicador de existência)

#### Scenario: Gravação sem nova senha preserva a existente
- **WHEN** o usuário salva os dados do próprio perfil sem informar uma nova senha SMTP
- **THEN** a senha SMTP armazenada permanece inalterada
