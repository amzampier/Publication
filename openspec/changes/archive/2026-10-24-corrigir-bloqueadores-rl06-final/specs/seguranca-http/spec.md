# Spec Delta

## ADDED Requirements

### Requirement: A saturação do pool responde 503 com Retry-After

Quando a fila do pool de conexões estiver saturada (`Queue limit reached` ou `ER_CON_COUNT_ERROR`),
a aplicação SHALL responder `503` com `Retry-After`, inclusive quando a falha ocorrer na validação
de sessão, no carregamento do RBAC ou em listagens, e NÃO SHALL responder `500` genérico para esse
caso.

#### Scenario: Saturação na sessão
- **WHEN** a primeira consulta de sessão de uma requisição encontra a fila do pool cheia
- **THEN** a resposta é `503` com `Retry-After`

#### Scenario: Saturação no RBAC/listagem
- **WHEN** a saturação ocorre ao carregar permissões ou ao executar uma listagem
- **THEN** a resposta é `503` com `Retry-After`, não `500`

#### Scenario: Erro não relacionado
- **WHEN** o erro não é de fila/conexão
- **THEN** a resposta continua sendo o erro original (ex.: `500`), sem mascaramento