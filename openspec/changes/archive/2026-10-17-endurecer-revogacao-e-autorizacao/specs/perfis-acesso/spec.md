# Spec Delta

## MODIFIED Requirements

### Requirement: A gravação da matriz protege contra o lockout administrativo
O sistema SHALL recusar com `409` (sem gravar) a substituição ou cópia de matriz que deixaria o
sistema **sem nenhum usuário ativo** cujo perfil conceda a ação `alterar` nos **três módulos
essenciais** (`gestao-usuarios`, `perfis-acesso` e `configuracoes-globais`), evitando que o sistema
fique sem administração possível. A mesma guarda SHALL recusar (`409`, sem gravar) a **desativação**
e a **exclusão** do último usuário ativo com essas permissões essenciais, de modo que a proteção
cubra também a gestão de usuários e não apenas a matriz. As respostas de recusa SHALL trazer uma
mensagem que explique a causa (que a alteração deixaria o sistema sem administração), e o cliente
SHALL exibir essa mensagem ao operador, não um erro genérico. As demais gravações seguem permitidas,
preservada a editabilidade da matriz de qualquer perfil na abertura do modal.

#### Scenario: Retirar a última administração é recusado
- **WHEN** a gravação da matriz do único perfil cujos usuários ativos detêm `alterar` nos três módulos essenciais remove uma dessas permissões
- **THEN** a API responde `409`, a matriz permanece intacta e uma mensagem informa que a alteração deixaria o sistema sem administração

#### Scenario: Cópia que removeria a última administração é recusada
- **WHEN** "copiar para" sobrescreveria a matriz do último perfil detentor das permissões essenciais de modo a removê-las
- **THEN** a API responde `409`, a matriz do destino permanece intacta e nada é gravado

#### Scenario: Alteração permitida quando há outra administração
- **WHEN** existe ao menos um outro usuário ativo cujo perfil detém `alterar` nos três módulos essenciais
- **THEN** a gravação da matriz é aceita normalmente (200), recalculando a coluna Permissões e os KPIs

#### Scenario: Desativar o último administrador é recusado
- **WHEN** a desativação de um usuário removeria a última administração essencial ativa
- **THEN** a API responde `409`, a situação do usuário permanece e uma mensagem informa que a alteração deixaria o sistema sem administração

#### Scenario: Excluir o último administrador é recusado
- **WHEN** a exclusão de um usuário removeria a última administração essencial ativa
- **THEN** a API responde `409`, o usuário permanece e nada é gravado

#### Scenario: Mensagem do lockout é exibida ao operador
- **WHEN** a gravação da matriz é recusada com `409` por lockout administrativo
- **THEN** o cliente exibe a mensagem devolvida pelo servidor, em vez de um erro genérico de conexão

### Requirement: A situação do perfil controla o acesso e a atribuição
O sistema SHALL impedir o login de um usuário cujo perfil esteja **Inativo** ou **Bloqueado**
(aviso próprio, sem autenticar) e SHALL recusar a atribuição de um perfil não-Ativo na criação,
na edição e no convite de usuários. Tornar um perfil **não-Ativo** SHALL ainda derrubar as sessões
vigentes dos usuários vinculados a ele: a validação de sessão e a renovação (`POST /api/auth/refresh`)
SHALL tratar essas sessões como não autenticadas enquanto o perfil permanecer não-Ativo, sem
depender de novo login.

#### Scenario: Usuário de perfil não-Ativo não loga
- **WHEN** um usuário com credenciais válidas cujo perfil está Inativo ou Bloqueado tenta autenticar
- **THEN** o login é recusado com aviso de que o perfil não está ativo e nenhuma sessão é criada

#### Scenario: Perfil não-Ativo não é atribuível
- **WHEN** uma criação, edição ou convite tenta atribuir um perfil Inativo ou Bloqueado
- **THEN** a operação é recusada (`400`) e nada é gravado

#### Scenario: Inativar o perfil derruba as sessões dos seus usuários
- **WHEN** um perfil passa a Inativo (ou Bloqueado) enquanto usuários vinculados possuem sessão aberta
- **THEN** as requisições seguintes desses usuários respondem `401` e o refresh não renova a sessão, sem novo login