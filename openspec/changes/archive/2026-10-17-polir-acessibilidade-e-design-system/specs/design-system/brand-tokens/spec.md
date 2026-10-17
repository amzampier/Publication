# Spec Delta

## ADDED Requirements

### Requirement: Os dots de status e badges usam a paleta documentada
Os indicadores de status (dots do `UiBadge` e o sino de notificações do header) SHALL usar as cores semânticas documentadas do design system (`#047857`/`#be123c` e equivalentes), sem valores crus `*-500` (`emerald-500`, `rose-500`, `blue-500`, etc.) fora da paleta.

#### Scenario: Dots usam a paleta documentada
- **WHEN** os dots de status do `UiBadge` e o sino do header são inspecionados
- **THEN** as cores provêm da paleta documentada, sem classes `*-500` cruas fora dela

### Requirement: O texto secundário atende ao contraste mínimo
O texto de apoio (legendas, estados vazios, rótulos secundários) sobre superfícies claras SHALL atender ao contraste mínimo AA (razão ≥ 4,5:1), não usando tons como `slate-400` que ficam abaixo do mínimo sobre branco.

#### Scenario: Texto de apoio legível
- **WHEN** um texto de apoio é exibido sobre superfície clara
- **THEN** a cor usada atende ao contraste AA (razão ≥ 4,5:1)