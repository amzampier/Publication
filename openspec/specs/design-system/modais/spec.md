# Design System — Modais Specification

## Purpose

Definir o comportamento de teclado e empilhamento do `UiModal` quando vários diálogos estão abertos ao
mesmo tempo — Escape e a armadilha de Tab destinados somente ao modal do topo — para que um modal filho
(ex.: câmera sobre um formulário) não feche nem roube o foco do modal subjacente.

## Requirements

### Requirement: Escape fecha somente o modal do topo
O sistema SHALL direcionar a tecla `Escape` apenas ao modal mais recentemente aberto quando há dois ou
mais modais empilhados, mantendo abertos e com o rascunho intacto os modais subjacentes; com um único
modal aberto, `Escape` SHALL mantê-lo comportamento atual de fechamento.

#### Scenario: Escape com modal filho aberto
- **WHEN** com o modal de usuário aberto e o modal de câmera aberto por cima dele, o usuário pressiona `Escape`
- **THEN** apenas o modal de câmera fecha e o modal de usuário permanece aberto com todos os campos preservados

#### Scenario: Escape com modal único
- **WHEN** há um único modal aberto e o usuário pressiona `Escape`
- **THEN** aquele modal fecha, como hoje

### Requirement: A armadilha de Tab fica restrita ao modal do topo
O sistema SHALL restringir a navegação de `Tab` e `Shift+Tab` aos elementos focáveis do modal do topo
quando há empilhamento, sem mover o foco para dentro dos modais subjacentes.

#### Scenario: Tab percorre apenas o modal filho
- **WHEN** com o modal de usuário sob o modal de câmera, o usuário pressiona `Tab` repetidamente
- **THEN** o foco circula somente entre os controles do modal de câmera e nunca salta para o formulário subjacente

### Requirement: Fechar o topo restaura o foco no modal subjacente
O sistema SHALL devolver o foco ao elemento que abriu o modal do topo — que pertence ao modal subjacente —
quando aquele topo fecha, sem que o modal subjacente seja fechado ou perca seu estado.

#### Scenario: Fechar a câmera devolve o foco ao formulário
- **WHEN** o usuário fecha o modal de câmera com o modal de usuário aberto por baixo
- **THEN** o foco volta ao controle do avatar dentro do modal de usuário e o modal de usuário permanece aberto

### Requirement: O modal entrega o foco inicial ao primeiro controle do corpo
O sistema SHALL mover o foco inicial, ao abrir, ao primeiro elemento focável do corpo ou do
rodapé do diálogo, ignorando o botão `X` do cabeçalho — de modo que um modal de formulário
nasça no primeiro campo e um diálogo de confirmação nasça na ação segura do rodapé —, com
fallback para o botão `X` do cabeçalho quando corpo e rodapé não tiverem elementos focáveis.

#### Scenario: Modal de formulário foca o primeiro campo
- **WHEN** um modal com campos de formulário é aberto
- **THEN** o foco inicial está no primeiro campo do corpo, e pressionar `Enter` com esse foco
  não aciona o fechamento do diálogo

#### Scenario: Diálogo de confirmação foca a ação do rodapé
- **WHEN** um modal de confirmação cujo corpo não tem controles focáveis é aberto
- **THEN** o foco inicial está no primeiro botão do rodapé (ex.: "Cancelar"), e não no `X` do
  cabeçalho

#### Scenario: X segue alcançável pelo teclado
- **WHEN** com o foco inicial no primeiro campo do corpo o usuário pressiona `Shift+Tab`
- **THEN** o foco vai ao botão `X` do cabeçalho, permanecendo dentro da armadilha de Tab do
  diálogo

#### Scenario: Sem focáveis no corpo nem no rodapé
- **WHEN** um modal cujo corpo e rodapé não têm elementos focáveis é aberto
- **THEN** o foco inicial vai ao botão `X` do cabeçalho, mantendo o comportamento anterior
  como fallback
