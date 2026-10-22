# Spec Delta

## ADDED Requirements

### Requirement: A paleta de texto rico é uma allowlist de conteúdo documentada

O sistema SHALL documentar, para os campos de texto rico, uma allowlist de cores de **conteúdo**
distinta das cores de **estado**. A allowlist SHALL incluir uma opção sem cor e tons com contraste AA
sobre superfície clara, entre eles o **vermelho de conteúdo** `#dc2626`, que NÃO SHALL ser confundido
com o vermelho de erro `#be123c` (`rose-700`) usado em validação. A aplicação do texto rico SHALL usar
apenas valores dessa allowlist.

#### Scenario: Vermelho de conteúdo distinto do vermelho de erro

- **WHEN** a paleta de texto rico e o vermelho de erro do design system são comparados
- **THEN** o vermelho de conteúdo é `#dc2626` e o vermelho de erro permanece `#be123c`, com a distinção documentada

#### Scenario: Nenhuma cor fora da allowlist

- **WHEN** um conteúdo formatado é inspecionado
- **THEN** todas as cores de texto pertencem à allowlist documentada

#### Scenario: Documentação acompanha a paleta

- **WHEN** `docs/01 - design_system.md` §2 é lido
- **THEN** a paleta de texto rico está documentada com o vermelho de conteúdo e a distinção em relação ao erro
