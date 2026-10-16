# Spec Delta

## ADDED Requirements

### Requirement: O gatilho do Account tem nome acessível
O botão que abre o menu da conta no header SHALL ter nome acessível que descreva a ação,
inclusive quando o nome e o perfil do usuário estiverem ocultos em telas pequenas.

#### Scenario: Leitor de tela identifica o menu da conta
- **WHEN** o usuário percorre o header por tecnologia assistiva numa viewport pequena
- **THEN** o gatilho do Account possui um nome acessível que descreve a ação

### Requirement: A central de notificações não exibe dados de demonstração
O painel de notificações do header SHALL NOT exibir conteúdo fictício de outro domínio; sem
notificações reais, SHALL apresentar o estado vazio ("Nenhuma notificação nova.").

#### Scenario: Estado vazio sem conteúdo fictício
- **WHEN** o usuário abre a central de notificações sem notificações
- **THEN** o painel exibe o estado vazio e nenhum texto de demonstração
