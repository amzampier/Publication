# Spec Delta

## MODIFIED Requirements

### Requirement: Botão primário e header de modal usam degradê
O sistema SHALL renderizar com degradê: o botão na variante `primary`, o cabeçalho do modal (do
`brand.primary` ao `brand.structure`), a região preenchida do slider `UiSlider` (de `#112051`
por `#0364f7` até `#4ed813`, esticada da origem até o thumb) e a região preenchida da barra de
progresso do `UiLoading` (de `#112051` por `#0364f7` até `#4ed813`, da origem até a posição
atual) com degradê horizontal, da esquerda para a direita; e a borda da caixa do `UiLoading` com
degradê cônico giratório percorrendo as
mesmas três cores na mesma ordem (`#112051` → `#0364f7` → `#4ed813`) ao redor da caixa.

#### Scenario: Degradê no botão primário
- **WHEN** um `Button` com `variant="primary"` é renderizado
- **THEN** o fundo é um degradê de `#112051` (esquerda) até `#0364f7` (direita)

#### Scenario: Degradê no cabeçalho do modal
- **WHEN** um modal é aberto
- **THEN** o seu cabeçalho exibe o mesmo degradê horizontal, preservando o filete de accent de 2,5px na borda esquerda

#### Scenario: Degradê na trilha do slider
- **WHEN** um `UiSlider` é renderizado com um valor intermediário
- **THEN** a região preenchida da track exibe o degradê `#112051` → `#0364f7` → `#4ed813` terminando junto ao thumb, e a região não preenchida é `slate-200`

#### Scenario: Degradê na barra de progresso do UiLoading
- **WHEN** o `UiLoading` é renderizado com `current`/`total` informados
- **THEN** a região preenchida da barra exibe o degradê `#112051` → `#0364f7` → `#4ed813` da esquerda até a posição atual, e a trilha não preenchida é `slate-200`

#### Scenario: Degradê na borda do UiLoading
- **WHEN** o overlay do `UiLoading` está aberto
- **THEN** a borda da caixa exibe o degradê giratório `#112051` → `#0364f7` → `#4ed813` na mesma ordem das demais superfícies de degradê da marca

#### Scenario: Demais superfícies primárias continuam sólidas
- **WHEN** superfícies como o cabeçalho da `DataTable`, tooltip, checkbox marcada, dia selecionado do calendário e menus dark são renderizadas
- **THEN** receem fundo sólido do `brand.primary`, sem degradê

#### Scenario: Hover e active preservam o degradê
- **WHEN** o botão primário recebe hover ou é pressionado
- **THEN** o degradê permanece e apenas o brilho do fundo varia, sem trocar para uma cor plana
