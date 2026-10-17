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
`POST /api/auth/esqueci-senha`) SHALL ficar isentas da validação por requisição, por não operarem
sob sessão prévia. Ainda assim, `POST /api/auth/refresh` SHALL confirmar, antes de emitir novos
tokens, que a sessão de refresh continua válida no servidor (não revogada) e que a conta — e o seu
perfil — permanecem **ativos**, respondendo `401` quando qualquer condição falhar. Uma requisição a
uma rota autenticada com token revogado (ex.: após logout) SHALL ser tratada como não autenticada,
sem executar a operação.

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

#### Scenario: Refresh não renova sessão revogada
- **WHEN** o refresh token de uma sessão cujo acesso foi revogado (por logout, desativação do usuário ou inativação do perfil) é utilizado em `POST /api/auth/refresh`
- **THEN** a resposta é `401` e nenhum novo token é emitido

### Requirement: Desativar ou excluir um usuário derruba as sessões abertas
Ao marcar um usuário como **Inativo** ou **excluí-lo**, por **qualquer** caminho de escrita da
situação — inclusive a edição geral do usuário (`PUT /api/usuarios/:id`) e a rota dedicada de
situação —, o sistema SHALL encerrar a validade das sessões abertas daquele usuário (access **e**
refresh), de modo que as requisições seguintes com os tokens vigentes sejam tratadas como não
autenticadas (`401`), sem esperar a expiração do token de acesso. Reativar o usuário **não** SHALL
revalidar tokens emitidos antes da desativação.

#### Scenario: Usuário desativado perde acesso imediato
- **WHEN** um usuário é marcado como Inativo enquanto possui sessão aberta
- **THEN** a próxima requisição autenticada dele responde `401`

#### Scenario: Desativação pela edição geral também revoga
- **WHEN** a situação do usuário é alterada para Inativo pela edição geral (`PUT /api/usuarios/:id`) enquanto ele possui sessão aberta
- **THEN** a próxima requisição autenticada dele responde `401` e o refresh deixa de renovar a sessão

#### Scenario: Reativar não reaviva o token anterior
- **WHEN** um usuário é desativado e depois reativado dentro da janela do token de acesso, reutilizando-se o cookie capturado antes da desativação
- **THEN** a requisição continua respondendo `401` (o token anterior permanece revogado)

#### Scenario: Usuário excluído perde acesso imediato
- **WHEN** um usuário é excluído e seu token de acesso ainda está dentro do prazo
- **THEN** a próxima requisição autenticada dele responde `401`