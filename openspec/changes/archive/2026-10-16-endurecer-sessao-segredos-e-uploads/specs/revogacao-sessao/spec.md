# Spec Delta

## Purpose

Garantir que a sessão de acesso seja revogada no servidor: logout, desativação e exclusão deixam
de autenticar imediatamente, mesmo antes de o token de acesso expirar.

## ADDED Requirements

### Requirement: O sistema valida a sessão no servidor a cada requisição autenticada
O sistema SHALL validar, a cada requisição autenticada, que a sessão continua válida no servidor —
a conta existe, está **Ativa** e o token de acesso não foi revogado —, respondendo `401` quando
qualquer condição falhar, mesmo que o token de acesso ainda esteja dentro do prazo de expiração.

#### Scenario: Sessão válida segue
- **WHEN** um usuário ativo com token não revogado chama uma rota autenticada
- **THEN** a requisição é autorizada normalmente

#### Scenario: Token de sessão revogada não autentica
- **WHEN** o token de acesso pertence a uma sessão já revogada
- **THEN** a requisição é tratada como não autenticada (`401`)

### Requirement: O logout revoga a sessão de acesso no servidor
O logout SHALL invalidar a sessão de acesso no servidor, de modo que o token de acesso em uso (ou
copiado) deixe de autenticar imediatamente após o encerramento, além de revogar o refresh e limpar
os cookies.

#### Scenario: Cookie de acesso reutilizado após o logout não autentica
- **WHEN** o cookie de acesso é capturado antes do logout e reutilizado depois em uma rota autenticada
- **THEN** a resposta é `401` e nenhum dado é acessado

### Requirement: Desativar ou excluir um usuário derruba as sessões abertas
Ao marcar um usuário como **Inativo** ou **excluí-lo**, o sistema SHALL encerrar a validade das
sessões abertas daquele usuário, de modo que as requisições seguintes com os tokens vigentes sejam
tratadas como não autenticadas (`401`), sem esperar a expiração do token de acesso.

#### Scenario: Usuário desativado perde acesso imediato
- **WHEN** um usuário é marcado como Inativo enquanto possui sessão aberta
- **THEN** a próxima requisição autenticada dele responde `401`

#### Scenario: Usuário excluído perde acesso imediato
- **WHEN** um usuário é excluído e seu token de acesso ainda está dentro do prazo
- **THEN** a próxima requisição autenticada dele responde `401`
