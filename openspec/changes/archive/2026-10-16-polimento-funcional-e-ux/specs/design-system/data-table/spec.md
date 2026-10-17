# Spec Delta

## ADDED Requirements

### Requirement: A ordenação de colunas da UiDataTable é acessível por teclado
O cabeçalho de coluna ordenável da `UiDataTable` SHALL ser focoável por teclado (`Tab`) e acionável
por `Enter` ou `Space` para alternar a ordenação, e SHALL expor o estado de ordenação da coluna por
meio do atributo `aria-sort` (`ascending`, `descending` ou `none`), além de um rótulo acessível que
descreva a ação de ordenar — de modo que a ordenação não dependa exclusivamente de mouse.

#### Scenario: Cabeçalho ordenável é focoável e acionável por teclado
- **WHEN** o usuário navega por teclado até o cabeçalho de uma coluna ordenável e pressiona `Enter` ou `Space`
- **THEN** a ordenação daquela coluna alterna, como ao clicar com o mouse

#### Scenario: Estado de ordenação exposto via aria-sort
- **WHEN** uma coluna está ordenada (ascendente ou descendente) ou não ordenada
- **THEN** o `th` correspondente expõe `aria-sort="ascending"`, `aria-sort="descending"` ou `aria-sort="none"`, respectivamente, e um rótulo acessível indica a ação de ordenar
