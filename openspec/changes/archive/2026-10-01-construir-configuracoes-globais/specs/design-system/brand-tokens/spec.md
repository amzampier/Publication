# Spec Delta

## MODIFIED Requirements

### Requirement: Botão primário e header de modal usam degradê
O sistema SHALL renderizar com degradê horizontal, da esquerda para a direita: o botão na variante `primary` e o cabeçalho do modal (do `brand.primary` ao `brand.structure`) e a região preenchida do slider `UiSlider` (de `#112051` por `#0364f7` até `#4ed813`, esticada da origem até o thumb).

#### Scenario: Degradê no botão primário
- **WHEN** um `Button` com `variant="primary"` é renderizado
- **THEN** o fundo é um degradê de `#112051` (esquerda) até `#0364f7` (direita)

#### Scenario: Degradê no cabeçalho do modal
- **WHEN** um modal é aberto
- **THEN** o seu cabeçalho exibe o mesmo degradê horizontal, preservando o filete de accent de 2,5px na borda esquerda

#### Scenario: Degradê na trilha do slider
- **WHEN** um `UiSlider` é renderizado com um valor intermediário
- **THEN** a região preenchida da track exibe o degradê `#112051` → `#0364f7` → `#4ed813` terminando junto ao thumb, e a região não preenchida é `slate-200`

#### Scenario: Demais superfícies primárias continuam sólidas
- **WHEN** superfícies como o cabeçalho da `DataTable`, tooltip, checkbox marcada, dia selecionado do calendário e menus dark são renderizadas
- **THEN** receem fundo sólido do `brand.primary`, sem degradê

#### Scenario: Hover e active preservam o degradê
- **WHEN** o botão primário recebe hover ou é pressionado
- **THEN** o degradê permanece e apenas o brilho do fundo varia, sem trocar para uma cor plana
