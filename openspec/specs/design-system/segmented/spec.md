# Design System — Controle Segmentado Specification

## Purpose

Definir o comportamento do controle segmentado (`UiSegmented`): escolha única entre poucas opções
exibidas como segmentos em uma única linha, com foco e erro no padrão do kit e navegação por teclado
de radiogroup — usado pelo campo Status (Ativo/Inativo) no lugar de um select.

## Requirements

### Requirement: O controle segmentado mostra todas as opções em uma linha
O sistema SHALL exibir as opções de uma escolha única como segmentos alinhados em uma única linha,
com um único segmento marcado (ou nenhum, quando o valor inicial é vazio) e os demais desmarcados;
acionar um segmento SHALL marcá-lo, desmarcar os demais e emitir o valor escolhido.

#### Scenario: Selecionar Ativo
- **WHEN** com o campo Status sem seleção o usuário clica no segmento "Ativo"
- **THEN** "Ativo" fica marcado com o destaque do seu tom e nenhum outro segmento permanece marcado

#### Scenario: Trocar a opção escolhida
- **WHEN** com "Ativo" marcado o usuário clica em "Inativo"
- **THEN** a marcação muda para "Inativo" e o valor emitido passa a ser "Inativo"

### Requirement: O controle segmentado navega por teclado como radiogroup
O sistema SHALL expor o controle como `radiogroup` com um único ponto de parada de `Tab` (o segmento
marcado, ou o primeiro quando não há seleção); as teclas de seta e `Home`/`End` SHALL mover a seleção
entre os segmentos acompanhando o foco, e `Enter`/`Space` SHALL acionar o segmento focado.

#### Scenario: Tab entra em um único ponto de parada
- **WHEN** o usuário navega por `Tab` até o controle
- **THEN** o foco cai no segmento marcado (ou no primeiro, quando vazio) e o `Tab` seguinte segue direto
  para o próximo campo, sem parar nos demais segmentos

#### Scenario: Setas trocam a opção
- **WHEN** com o foco no segmento "Ativo" o usuário pressiona a seta para baixo ou para a direita
- **THEN** a seleção muda para "Inativo" e o foco acompanha o segmento escolhido

### Requirement: O controle segmentado obedece aos estados de foco e erro do design system
O sistema SHALL aplicar ao controle o recorte de foco `brand-focus` (apenas os cantos inferiores)
quando ele está focado e, quando há erro, o recorte sobreposto em `rose-700` com o rótulo em
`rose-700`, o ícone `AlertCircle` exibindo a mensagem e a própria mensagem disponível como região
viva `sr-only` referenciada por `aria-describedby`.

#### Scenario: Erro de validação no Status
- **WHEN** o usuário tenta salvar sem escolher o Status
- **THEN** o controle exibe o recorte em `rose-700`, o rótulo "Status" em vermelho, o ícone com a
  mensagem de erro e o foco vai ao segmento do controle

#### Scenario: Foco no controle
- **WHEN** o usuário dá `Tab` até o controle
- **THEN** o recorte de foco `brand-focus` aparece nos cantos inferiores, nos moldes dos demais
  campos do kit
