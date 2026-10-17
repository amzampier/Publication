# Spec Delta

## MODIFIED Requirements

### Requirement: O botão de limpar do DatePicker tem nome acessível
O botão de limpar a data do `UiDatePicker` SHALL ter nome acessível (por exemplo
`aria-label="Limpar data"`), de modo que a ação seja anunciada por leitores de tela — como já
ocorre no `UiSelect` —, e SHALL exibir um indicador de foco visível quando alcançado por teclado.

#### Scenario: Leitor de tela anuncia o limpar
- **WHEN** um `UiDatePicker` está preenchido e o usuário percorre seus controles por tecnologia assistiva
- **THEN** o botão de limpar possui um nome acessível que descreve a ação

#### Scenario: Limpar mostra foco
- **WHEN** o botão de limpar do `UiDatePicker` recebe foco por teclado
- **THEN** um indicador de foco visível é exibido

## ADDED Requirements

### Requirement: Os controles de navegação do calendário exibem foco de teclado
Os botões de navegação do `UiCalendar` (mês anterior/seguinte e atalho "Hoje") e o alternador de
mês/ano SHALL exibir um indicador de foco visível quando alcançados por teclado.

#### Scenario: Navegação mostra foco
- **WHEN** um botão de navegação do calendário (mês anterior/seguinte ou "Hoje") recebe foco por teclado
- **THEN** um indicador de foco visível é exibido