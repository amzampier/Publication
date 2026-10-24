# Spec Delta

## ADDED Requirements

### Requirement: A seção 27 da vitrine está no índice e íntegra

A vitrine `/design` SHALL incluir a seção **27. Gráficos** no índice de navegação rápida e SHALL
renderizar seus rótulos, `aria-label` e textos auxiliares sem caracteres corrompidos. O índice SHALL
listar as seções de 1 a 27, e a documentação do design system SHALL usar a mesma faixa.

#### Scenario: Índice lista a seção 27

- **WHEN** o índice da vitrine é renderizado
- **THEN** ele contém a entrada “27. Gráficos” e todas as seções anteriores, sem saltos

#### Scenario: Seção 27 sem texto corrompido

- **WHEN** a seção 27 é inspecionada
- **THEN** títulos, rótulos de acessibilidade e textos auxiliares estão legíveis, sem `?` ou
  caracteres de substituição

#### Scenario: Documentação usa a mesma faixa

- **WHEN** `docs/01 - design_system.md` e `AGENTS.md` descrevem a vitrine
- **THEN** ambos informam a faixa de 27 seções
