# Spec Delta

## ADDED Requirements

### Requirement: A situação do perfil controla o acesso e a atribuição
O sistema SHALL impedir o login de um usuário cujo perfil esteja **Inativo** ou **Bloqueado**
(aviso próprio, sem autenticar) e SHALL recusar a atribuição de um perfil não-Ativo na criação,
na edição e no convite de usuários.

#### Scenario: Usuário de perfil não-Ativo não loga
- **WHEN** um usuário com credenciais válidas cujo perfil está Inativo ou Bloqueado tenta autenticar
- **THEN** o login é recusado com aviso de que o perfil não está ativo e nenhuma sessão é criada

#### Scenario: Perfil não-Ativo não é atribuível
- **WHEN** uma criação, edição ou convite tenta atribuir um perfil Inativo ou Bloqueado
- **THEN** a operação é recusada (`400`) e nada é gravado

### Requirement: A edição do perfil preserva campos omitidos
O sistema SHALL atualizar o perfil de forma **parcial**: um campo ausente no corpo do
`PUT /api/perfis/:id` SHALL manter o valor vigente (não apagar). Em particular, omitir a
`descricao` SHALL preservar a descrição atual.

#### Scenario: Omitir a descrição não a apaga
- **WHEN** `PUT /api/perfis/:id` é chamado apenas com `nome` (sem `descricao`)
- **THEN** a descrição do perfil permanece inalterada

#### Scenario: Enviar a descrição a altera
- **WHEN** `PUT /api/perfis/:id` é chamado com `descricao` preenchida
- **THEN** a descrição é atualizada para o valor enviado
