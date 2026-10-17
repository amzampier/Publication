# data-table Specification

## Purpose

Permitir que o `UiDataTable` opere em **modo servidor**: em vez de filtrar, ordenar e paginar todo
o conjunto no cliente, a tabela renderiza a página já processada pelo servidor, deriva o total de
páginas de um `total` externo e emite eventos de navegação/busca/ordenação para o chamador
consultar a API.

## Requirements

### Requirement: A UiDataTable opera em modo servidor
O `UiDataTable` SHALL suportar um **modo servidor** (habilitado por uma prop) em que: (a) renderiza
as linhas recebidas como a **página corrente** (sem filtrar, ordenar ou paginar localmente); (b)
deriva o total de páginas e os controles de navegação do valor `total` recebido por prop; (c) emite
eventos para o chamador quando o usuário muda de **página**, altera **linhas por página**, **ordena**
uma coluna ou **busca** — e, nesse modo, a busca SHALL ser **debounced** (não emitir a cada tecla).
No modo padrão (cliente), o comportamento atual SHALL permanecer inalterado.

#### Scenario: Página renderizada vem do servidor
- **WHEN** a tabela está em modo servidor e recebe um conjunto de linhas com um `total`
- **THEN** ela exibe exatamente aquelas linhas como a página corrente e mostra "Página X de Y" com Y derivado do `total`

#### Scenario: Navegação emite evento
- **WHEN** o usuário muda de página, altera "Linhas por página", ordena uma coluna ou digita na busca (modo servidor)
- **THEN** a tabela emite o evento correspondente (página/tamanho/ordenação) e a busca é emitida após o debounce, sem processar o conjunto localmente

#### Scenario: Modo cliente inalterado
- **WHEN** a tabela é usada sem o modo servidor
- **THEN** filtro, ordenação e paginação continuam ocorrendo no cliente sobre a prop `data`

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
