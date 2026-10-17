# Spec Delta

## MODIFIED Requirements

### Requirement: O sistema valida a sessão no servidor a cada requisição autenticada
O sistema SHALL validar, a cada requisição autenticada, que a sessão continua válida no servidor —
a conta existe, está **Ativa** e o token de acesso não foi revogado —, respondendo `401` quando
qualquer condição falhar, mesmo que o token de acesso ainda esteja dentro do prazo de expiração.

A validação SHALL abranger **todas** as requisições que operam sob uma sessão existente,
**inclusive** as rotas autenticadas do portal de autenticação — notadamente `GET /api/auth/seguro`
(hidratação da sessão) e `POST /api/auth/trocar-senha` (troca da própria senha). Somente as portas
que **estabelecem ou renovam** a sessão (`POST /api/auth/login`, `POST /api/auth/refresh` e
`POST /api/auth/esqueci-senha`) SHALL ficar isentas dessa validação, por não operarem sob sessão
prévia. Uma requisição a uma rota autenticada com token revogado (ex.: após logout) SHALL ser
tratada como não autenticada, sem executar a operação.

#### Scenario: Sessão válida segue
- **WHEN** um usuário ativo com token não revogado chama uma rota autenticada
- **THEN** a requisição é autorizada normalmente

#### Scenario: Token de sessão revogada não autentica
- **WHEN** o token de acesso pertence a uma sessão já revogada
- **THEN** a requisição é tratada como não autenticada (`401`)

#### Scenario: Hidratação de sessão recusa token revogado
- **WHEN** o cookie de acesso foi revogado por logout e é reutilizado em `GET /api/auth/seguro`
- **THEN** a resposta é `401` e nenhum dado de usuário é devolvido

#### Scenario: Troca de senha recusa token revogado
- **WHEN** o cookie de acesso foi revogado por logout (ainda dentro do prazo) e é reutilizado em `POST /api/auth/trocar-senha` com senha atual correta
- **THEN** a resposta é `401`, a senha não é alterada e nenhuma operação é executada
