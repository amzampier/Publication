# Calendário Specification

## Purpose

Definir o comportamento espacial do `UiDatePicker` e do `UiCalendar` — abertura do popover evitando corte e largura adaptativa do calendário — para que esses controles funcionem em telas estreitas, em página e dentro de modais.

## Requirements

### Requirement: O popover do DatePicker abre evitando o corte da viewport
O sistema SHALL posicionar o popover do `UiDatePicker` invertendo verticalmente (abrindo para cima) quando não houver espaço suficiente abaixo do campo, na borda da área visível, e SHALL mantê-lo abrindo para baixo quando houver espaço — mesma estratégia do `UiSelect`.

#### Scenario: Sem espaço abaixo abre para cima
- **WHEN** o campo está no fim da área visível (ex.: fim de um formulário longo ou de um modal com rolagem) e o usuário abre o calendário
- **THEN** o popover é exibido acima do campo, sem ser cortado pela borda inferior da viewport ou do contêiner com rolagem

#### Scenario: Com espaço abaixo mantém a abertura atual
- **WHEN** há espaço suficiente abaixo do campo
- **THEN** o popover abre abaixo do campo, como hoje

### Requirement: O calendário se adapta à largura disponível
O sistema SHALL renderizar o `UiCalendar` com largura que nunca excede o contêiner disponível, eliminando a largura fixa que causa overflow em telas estreitas.

#### Scenario: Calendário em 320px em página
- **WHEN** o calendário é exibido em viewport de 320px com a largura de conteúdo disponível menor que a largura mínima do componente
- **THEN** o calendário se ajusta à largura disponível, sem provocar overflow horizontal da página

#### Scenario: Calendário dentro de modal a 320px
- **WHEN** o `UiCalendar` é renderizado dentro de um `UiModal` (com padding interno) em viewport de 320px
- **THEN** ele não excede a largura do conteúdo do modal e todos os dias permanecem visíveis e clicáveis
