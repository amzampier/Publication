# Spec Delta

## ADDED Requirements

### Requirement: O Checkbox segue foco e erro canônicos
O `UiCheckbox` SHALL seguir os tokens canônicos do design system em qualquer variante: o estado
de **erro** SHALL usar `rose-700` (nunca `rose-600`) e o anel de **foco** SHALL usar
`brand-focus` (`#1a9e07`), e não a cor da variante.

#### Scenario: Erro no Checkbox em rose-700
- **WHEN** um `UiCheckbox` está em erro
- **THEN** o estado de erro usa `rose-700`

#### Scenario: Foco do Checkbox em brand-focus
- **WHEN** um `UiCheckbox` (de qualquer variante) recebe foco por teclado
- **THEN** o anel de foco usa `brand-focus`
