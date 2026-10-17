# Spec Delta

## MODIFIED Requirements

### Requirement: A ordenação de colunas da UiDataTable é acessível por teclado
O cabeçalho de coluna ordenável da `UiDataTable` SHALL ser focável por teclado (`Tab`) e acionável
por `Enter` ou `Space` para alternar a ordenação, e SHALL expor o estado de ordenação da coluna por
meio do atributo `aria-sort` (`ascending`, `descending` ou `none`), além de um rótulo acessível que
descreva a ação de ordenar — de modo que a ordenação não dependa exclusivamente de mouse. Somente
colunas com um cabeçalho de dados ordenável SHALL ser focáveis/ordenáveis: uma coluna sem cabeçalho
(ex.: a coluna de seleção/checkbox) NÃO SHALL receber `tabindex` nem expor `aria-sort`/rótulo de
ordenação vazio.

#### Scenario: Cabeçalho ordenável é focoável e acionável por teclado
- **WHEN** o usuário navega por teclado até o cabeçalho de uma coluna ordenável e pressiona `Enter` ou `Space`
- **THEN** a ordenação daquela coluna alterna, como ao clicar com o mouse

#### Scenario: Estado de ordenação exposto via aria-sort
- **WHEN** uma coluna está ordenada (ascendente ou descendente) ou não ordenada
- **THEN** o `th` correspondente expõe `aria-sort="ascending"`, `aria-sort="descending"` ou `aria-sort="none"`, respectivamente, e um rótulo acessível indica a ação de ordenar

#### Scenario: Coluna sem cabeçalho não é focável nem ordenável
- **WHEN** a tabela renderiza uma coluna sem cabeçalho (ex.: a coluna de seleção)
- **THEN** o `th` dessa coluna não é focável por teclado e não expõe `aria-sort` nem rótulo de ordenação

## ADDED Requirements

### Requirement: O estado vazio da tabela distingue base vazia de filtro sem resultado
O estado vazio da `UiDataTable` SHALL distinguir dois casos: **base vazia** (nenhum dado) e **conjunto filtrado sem resultados** (há dados, mas filtros/busca não retornam nada), exibindo mensagens distintas e adequadas a cada caso — nunca a mesma mensagem genérica de "filtro aplicado" para uma base vazia.

#### Scenario: Base vazia
- **WHEN** a tabela não recebe nenhum registro e nenhum filtro está ativo
- **THEN** a mensagem de estado vazio indica que não há registros

#### Scenario: Filtro sem resultados
- **WHEN** há filtros ou busca ativos e nenhum registro corresponde
- **THEN** a mensagem de estado vazio indica que nenhum resultado foi encontrado para o filtro