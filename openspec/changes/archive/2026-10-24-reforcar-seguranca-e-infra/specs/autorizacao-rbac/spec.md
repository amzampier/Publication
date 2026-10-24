# Spec Delta

## ADDED Requirements

### Requirement: A busca de e-mails usa a permissão de Gestão de Usuários

O catálogo de autorização SHALL mapear `GET /api/usuarios/emails` para o módulo
`gestao-usuarios`, exigindo `visualizar` para a consulta base e `buscar` quando houver termo. A rota
SHALL rejeitar requisições sem sessão (`401`) e perfis sem a permissão (`403`), sem revelar e-mails.

#### Scenario: Rota protegida no catálogo
- **WHEN** a matriz de permissões é consultada
- **THEN** a rota de e-mails aparece sob `gestao-usuarios`

#### Scenario: Perfil sem permissão
- **WHEN** um perfil sem `gestao-usuarios`/`visualizar` chama a rota
- **THEN** a resposta é `403` e nenhum e-mail é retornado
