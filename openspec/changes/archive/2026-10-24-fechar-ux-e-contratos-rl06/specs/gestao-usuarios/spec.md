# Spec Delta

## ADDED Requirements

### Requirement: A busca de e-mails trata o termo como literal

O endpoint `GET /api/usuarios/emails` SHALL tratar `%` e `_` como caracteres literais e SHALL
encontrar e-mail/nome que comece **ou** contenha o termo, mantendo `q` mínimo de 2 caracteres,
paginação limitada e as permissões já definidas.

#### Scenario: Curinga literal
- **WHEN** o usuário consulta `q=%%` ou `q=_%`
- **THEN** a API não devolve a base inteira e aplica o termo como literal

#### Scenario: Busca por conteúdo
- **WHEN** o usuário consulta `q=teo` e existe `@teorema.inf.br`
- **THEN** o registro é encontrado

#### Scenario: Paginação preservada
- **WHEN** o cliente pede `porPagina=500`
- **THEN** a resposta é limitada a 20 itens
