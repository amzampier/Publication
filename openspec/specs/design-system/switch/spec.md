# Switch Specification

## Purpose

Entregar ao design system um interruptor binário (`UiSwitch`) para estados ligado/desligado —
permissões, preferências e flags — com a mesma identidade de foco/erro, teclado e
espelhamento na vitrine `/design` dos demais controles, para que formulários como o modal de
permissões de perfis configurem a matriz sem recriar checkbox ou toggle paralelo.

## Requirements

### Requirement: O UiSwitch expõe um interruptor binário com modelo, rótulo e estado desabilitado
O sistema SHALL expor o componente `UiSwitch` (auto-import `UiSwitch`) com `modelValue`
(binário) acessível por `v-model`, `label` opcional exibido ao lado, `disabled` e
semântica nativa `role="switch"` com `aria-checked` refletindo o estado; a trilha do
interruptor SHALL mostrar o estado de forma inequívoca — desligado em tom neutro e ligado no
verde canônico `brand.focus` (`#1a9e07`) com knob branco deslizante.

#### Scenario: Renderização ligado e desligado
- **WHEN** `UiSwitch` é renderizado com `modelValue` `false` e depois `true`
- **THEN** o `aria-checked` acompanha o estado, a trilha muda do tom neutro para o verde
  `#1a9e07` e o knob ocupa a posição correspondente

#### Scenario: Modelo bidirecional
- **WHEN** o usuário alterna o interruptor ou um valor externo é atribuído ao `v-model`
- **THEN** o estado visual e o `aria-checked` refletem o valor sempre

#### Scenario: Rótulo associado
- **WHEN** `UiSwitch` é renderizado com `label`
- **THEN** o rótulo aparece ao lado do interruptor e o clique nele também alterna o
  interruptor (mesma associação `for`/`id` dos demais controles)

#### Scenario: Desabilitado não alterna
- **WHEN** `UiSwitch` é renderizado com `disabled`
- **THEN** o controle não alterna por clique nem por teclado, fica fora do Tab e exibe o
  tom de somente leitura

### Requirement: O UiSwitch respeita foco e alternância por teclado
O sistema SHALL alternar o `UiSwitch` com as teclas **Space** e **Enter** quando focado e
SHALL exibir o foco visível com o verde canônico `brand.focus` (`#1a9e07`), na mesma
identidade dos demais controles do kit.

#### Scenario: Teclado alterna o interruptor
- **WHEN** o usuário foca o `UiSwitch` e pressiona Space (ou Enter)
- **THEN** o estado alterna e o `aria-checked` é atualizado

#### Scenario: Foco visível
- **WHEN** o `UiSwitch` recebe foco por teclado
- **THEN** o anel/destaque de foco aparece em `#1a9e07`, distinguindo o controle focado dos
  demais

#### Scenario: Vitrine espelha o componente
- **WHEN** a seção do `UiSwitch` na vitrine `/design` é renderizada
- **THEN** ela exibe os estados ligado, desligado e desabilitado idênticos ao componente
  real, conforme a regra de espelhamento de `design-system`
