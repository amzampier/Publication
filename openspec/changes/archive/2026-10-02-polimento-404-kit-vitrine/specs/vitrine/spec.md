# Spec Delta

## Purpose

Definir o contrato da vitrine `/design` como referência viva do sistema — uso exclusivo do kit nos formulários, integridade dos cabeçalhos e ausência de overflow horizontal — para que a demonstração seja exemplar em qualquer largura.

## ADDED Requirements

### Requirement: Os formulários da vitrine usam exclusivamente o kit de componentes
O sistema SHALL construir os formulários de demonstração da vitrine `/design` (em especial a seção 8 "Toasts & Alertas") com os componentes do kit (`UiInput`, `UiSelect`, `UiButton`), sem `<input>`, `<select>` ou `<button>` estilizados manualmente — a vitrine é a referência viva do sistema e não pode ensinar padrões paralelos.

#### Scenario: Seção 8 sem controles nativos paralelos
- **WHEN** o formulário da seção 8 da vitrine é inspecionado
- **THEN** os campos são `UiInput`/`UiSelect` e as ações são `UiButton`; nenhum campo ou botão de formulário usa estilos próprios (menus e ícones de navegação continuam aceitáveis)

#### Scenario: Demonstração permanece funcional
- **WHEN** o usuário preenche o formulário da seção 8 e aciona o disparo
- **THEN** o toast correspondente aparece no canto superior direito, como antes da troca

### Requirement: A vitrine não produz overflow horizontal entre 320px e 1440px
O sistema SHALL renderizar a página `/design` sem `scrollWidth` maior que a largura da viewport em qualquer largura de 320px a 1440px, com os cabeçalhos de seção (título + badge `Componente: …`) quebrando linha em vez de empurrar o layout.

#### Scenario: Larguras estreitas sem rolagem lateral
- **WHEN** `/design` é aberto em 375px, 768px ou 1024px
- **THEN** `document.scrollWidth` não excede `innerWidth` (nenhuma barra de rolagem horizontal)

#### Scenario: Cabeçalhos de seção com badge não estouram o layout
- **WHEN** seções com badge `Componente: …` (ex.: `Checkbox`, `Toast`) renderizam em qualquer largura
- **THEN** o container do cabeçalho quebra em linha (`flex-wrap`) e o badge não empurra a página para fora da viewport

#### Scenario: Larga sem regressão
- **WHEN** `/design` é aberto em 1440px
- **THEN** todos os cabeçalhos e seções permanecem em uma linha quando cabem, sem mudança visível em relação ao layout atual

### Requirement: O cabeçalho da vitrine se adapta a telas estreitas
O sistema SHALL exibir o cabeçalho da página `/design` (identidade + badge de versão + ações) sem corte nem sobreposição em 320–375px, quebrando em linhas quando os blocos não couberem em uma.

#### Scenario: Cabeçalho íntegro a 375px
- **WHEN** `/design` é aberto em 375px
- **THEN** título, badge de versão e ações ("Imprimir Guia", "Home") exibem sem corte de texto nem sobreposição, e a página não ganha overflow horizontal por causa do cabeçalho

#### Scenario: Cabeçalho em telas largas
- **WHEN** `/design` é aberto em 1024px ou mais
- **THEN** o cabeçalho continua em uma única linha, como hoje
