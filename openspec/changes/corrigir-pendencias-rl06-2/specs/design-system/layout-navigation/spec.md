# Spec Delta

## ADDED Requirements

### Requirement: O drawer mobile é um diálogo com foco controlado

Quando a sidebar é exibida como drawer abaixo de `lg`, ela SHALL ter semântica de diálogo
(`role="dialog"`, `aria-modal="true"`, nome acessível), SHALL fechar com `Escape`, SHALL manter o
foco preso dentro do drawer enquanto aberto e SHALL devolver o foco ao gatilho ao fechar. O backdrop
SHALL fechar o drawer ao clique. A navegação por teclado SHALL percorrer os itens do drawer sem
escapar para o conteúdo de trás.

#### Scenario: Escape fecha o drawer e devolve foco
- **WHEN** o drawer mobile está aberto e o usuário pressiona `Escape`
- **THEN** o drawer fecha e o foco retorna ao botão de alternância

#### Scenario: Foco preso no drawer
- **WHEN** o drawer está aberto e o usuário navega por `Tab`
- **THEN** o foco circula apenas entre os controles do drawer e não alcança o conteúdo de trás

#### Scenario: Backdrop fecha
- **WHEN** o usuário clica no backdrop do drawer
- **THEN** o drawer fecha sem navegar