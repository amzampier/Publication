# Spec Delta

## ADDED Requirements

### Requirement: A ação de ícone do controle é acionável por teclado

Quando um controle de formulário exibe uma ação em ícone à direita do campo (ex.: revelar senha,
limpar busca ou abrir seletor), essa ação SHALL ser um controle focável com papel de botão, nome
acessível e acionamento por `Enter` e `Space`, além do clique. Ela NÃO SHALL ser um elemento
apenas clicável sem equivalente de teclado. Quando desabilitada, a ação SHALL expor o estado
desabilitado de forma acessível e não SHALL disparar o evento.

#### Scenario: Foco e acionamento por teclado

- **WHEN** o usuário navega por `Tab` até a ação de ícone e pressiona `Enter` ou `Space`
- **THEN** a ação é disparada como no clique e o foco permanece visível no controle

#### Scenario: Nome acessível

- **WHEN** a ação de ícone recebe foco
- **THEN** a tecnologia assistiva anuncia um nome que descreve a ação, não apenas “ícone” ou “botão”

#### Scenario: Ação desabilitada

- **WHEN** a ação de ícone está desabilitada
- **THEN** ela é anunciada como desabilitada e não dispara o evento ao clique ou teclado
