# Spec Delta

## ADDED Requirements

### Requirement: As demos da vitrine espelham os componentes reais
As demonstrações da vitrine `/design` SHALL espelhar fielmente os componentes reais do kit — as variantes de toast correspondem às do `ToastContainer`, o realce de accent usa o token correto, os rótulos são grafados corretamente e as dicas de upload refletem os formatos realmente aceitos (sem "SVG").

#### Scenario: Demo de toast fiel ao componente
- **WHEN** as demos de toast da seção 8 são acionadas
- **THEN** cada variante exibe a mesma cor, ícone e rótulo do `ToastContainer` real (sem variações de cor indevidas nem rótulos com erro de grafia)

#### Scenario: Dica de upload reflete os formatos aceitos
- **WHEN** a demo de upload da vitrine é exibida
- **THEN** a dica de formatos corresponde aos realmente aceitos pelo componente/servidor (sem citar SVG)

#### Scenario: Copiar HEX mostra foco
- **WHEN** o botão "Copiar HEX" de um swatch recebe foco por teclado
- **THEN** um indicador de foco visível é exibido