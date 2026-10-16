# Spec Delta

## ADDED Requirements

### Requirement: O botão de limpar do DatePicker tem nome acessível
O botão de limpar a data do `UiDatePicker` SHALL ter nome acessível (por exemplo
`aria-label="Limpar data"`), de modo que a ação seja anunciada por leitores de tela — como já
ocorre no `UiSelect`.

#### Scenario: Leitor de tela anuncia o limpar
- **WHEN** um `UiDatePicker` está preenchido e o usuário percorre seus controles por tecnologia assistiva
- **THEN** o botão de limpar possui um nome acessível que descreve a ação
