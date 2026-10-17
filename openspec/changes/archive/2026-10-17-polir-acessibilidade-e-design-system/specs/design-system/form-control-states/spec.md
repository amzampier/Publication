# Spec Delta

## ADDED Requirements

### Requirement: Os controles de formulário expõem nome acessível
Os controles compostos do kit SHALL expor um nome acessível: o `Select` SHALL usar o `label` informado quando houver e, quando não houver `label` (ex.: filtros em modal), SHALL expor um nome acessível alternativo — o gatilho `role="combobox"` nunca pode referenciar um `id` inexistente; e o checkbox embutido no `CheckCard` SHALL ter um nome acessível (o do cartão), de modo que tecnologia assistiva o anuncie.

#### Scenario: Select sem label tem nome acessível
- **WHEN** um `UiSelect` é renderizado sem `label` (ex.: dentro do modal de filtros)
- **THEN** o gatilho `role="combobox"` expõe um nome acessível válido (não referencia um `id` inexistente)

#### Scenario: CheckCard expõe o nome do cartão ao checkbox
- **WHEN** um `CheckCard` é percorrido por tecnologia assistiva
- **THEN** o checkbox interno é anunciado com o nome do cartão

### Requirement: Os botões secundários exibem foco de teclado
Os botões secundários do kit — o limpar do `Select` e o limpar do `DatePicker` — SHALL exibir um indicador de foco visível quando alcançados por teclado, sem desenhar contorno no clique de mouse.

#### Scenario: Limpar do Select mostra foco
- **WHEN** o botão de limpar do `UiSelect` recebe foco por teclado
- **THEN** um indicador de foco visível é exibido

#### Scenario: Limpar do DatePicker mostra foco
- **WHEN** o botão de limpar do `UiDatePicker` recebe foco por teclado
- **THEN** um indicador de foco visível é exibido