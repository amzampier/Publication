# Spec Delta

## ADDED Requirements

### Requirement: A matriz de permissões é aplicada pelas APIs administrativas
A matriz de permissões de um perfil SHALL determinar, no servidor, o que os usuários vinculados a
ele podem fazer nas APIs administrativas — deixando de ser apenas normativa. Após salvar a matriz
de um perfil (ou copiá-la), os usuários daquele perfil SHALL passar a ter exatamente as ações
concedidas (e a perder as revogadas) na próxima requisição, conforme a capability
`autorizacao-rbac`.

#### Scenario: Conceder uma ação passa a permitir a operação
- **WHEN** a matriz de um perfil recebe uma ação que não tinha (ex.: `criar` em `gestao-usuarios`) e a gravação é confirmada
- **THEN** os usuários daquele perfil passam a poder executar a operação correspondente

#### Scenario: Revogar uma ação passa a negar a operação
- **WHEN** a matriz de um perfil perde uma ação que tinha (ex.: `excluir` em `gestao-usuarios`) e a gravação é confirmada
- **THEN** os usuários daquele perfil passam a receber `403` na operação correspondente

### Requirement: A gravação da matriz protege contra o lockout administrativo
O sistema SHALL recusar com `409` (sem gravar) a substituição ou cópia de matriz que deixaria o
sistema **sem nenhum usuário ativo** cujo perfil conceda a ação `alterar` nos **três módulos
essenciais** (`gestao-usuarios`, `perfis-acesso` e `configuracoes-globais`), evitando que o sistema
fique sem administração possível. As demais gravações seguem permitidas, preservada a
editabilidade da matriz de qualquer perfil na abertura do modal.

#### Scenario: Retirar a última administração é recusado
- **WHEN** a gravação da matriz do único perfil cujos usuários ativos detêm `alterar` nos três módulos essenciais remove uma dessas permissões
- **THEN** a API responde `409`, a matriz permanece intacta e uma mensagem informa que a alteração deixaria o sistema sem administração

#### Scenario: Cópia que removeria a última administração é recusada
- **WHEN** "copiar para" sobrescreveria a matriz do último perfil detentor das permissões essenciais de modo a removê-las
- **THEN** a API responde `409`, a matriz do destino permanece intacta e nada é gravado

#### Scenario: Alteração permitida quando há outra administração
- **WHEN** existe ao menos um outro usuário ativo cujo perfil detém `alterar` nos três módulos essenciais
- **THEN** a gravação da matriz é aceita normalmente (200), recalculando a coluna Permissões e os KPIs
