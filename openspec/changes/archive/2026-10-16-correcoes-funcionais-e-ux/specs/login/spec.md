# Spec Delta

## ADDED Requirements

### Requirement: O login recusa perfis não ativos
O sistema SHALL recusar a autenticação de um usuário cujo **perfil** esteja **Inativo** ou
**Bloqueado**, exibindo um aviso próprio e sem estabelecer sessão — além da checagem já existente
da situação do próprio usuário.

#### Scenario: Perfil inativo bloqueia o login
- **WHEN** o usuário informa credenciais corretas de um cadastro cujo perfil está Inativo (ou Bloqueado)
- **THEN** o login é recusado com aviso de perfil não ativo e a sessão não é criada
