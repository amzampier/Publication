# Spec Delta

## ADDED Requirements

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
