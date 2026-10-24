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

### Requirement: O estado vazio da tabela distingue base vazia de filtro sem resultado
O estado vazio da `UiDataTable` SHALL distinguir dois casos: **base vazia** (nenhum dado) e **conjunto filtrado sem resultados** (há dados, mas filtros/busca não retornam nada), exibindo mensagens distintas e adequadas a cada caso — nunca a mesma mensagem genérica de "filtro aplicado" para uma base vazia.

#### Scenario: Base vazia
- **WHEN** a tabela não recebe nenhum registro e nenhum filtro está ativo
- **THEN** a mensagem de estado vazio indica que não há registros

#### Scenario: Filtro sem resultados
- **WHEN** há filtros ou busca ativos e nenhum registro corresponde
- **THEN** a mensagem de estado vazio indica que nenhum resultado foi encontrado para o filtro

### Requirement: A UiDataTable suporta expansão de linha opcional
O `UiDataTable` SHALL suportar, de forma **opcional e desligada por padrão**, a expansão de uma linha
de dados. Quando habilitada, cada linha SHALL expor um controle de expansão acessível (com
`aria-expanded` refletindo o estado) e, ao ser acionado, SHALL renderizar o conteúdo expandido em uma
linha de largura total imediatamente abaixo da linha correspondente, fornecido por um slot dedicado
recebendo a linha. O cabeçalho da coluna de expansão SHALL permitir que o chamador forneça seu próprio
controle (ex.: uma flag que habilita a exibição dos controles). A expansão SHALL ser independente por
linha (expandir uma não recolhe as demais) e recolher SHALL ocultar o conteúdo. A funcionalidade
SHALL NOT alterar o modo servidor, a ordenação acessível, o agrupamento hierárquico, a paginação, a
busca, os filtros, a coluna de ações nem o estado vazio existentes.

#### Scenario: Expandir uma linha mostra o conteúdo do slot
- **WHEN** a tabela está com a expansão habilitada e o usuário aciona o controle de uma linha
- **THEN** uma linha de largura total é renderizada logo abaixo, com o conteúdo fornecido pelo slot
  de expansão para aquela linha, e o controle passa a indicar expandido

#### Scenario: Recolher oculta o conteúdo
- **WHEN** o usuário aciona novamente o controle de uma linha expandida
- **THEN** a linha expandida é removida e o controle volta a indicar recolhido

#### Scenario: Expansão independente por linha
- **WHEN** o usuário expande uma linha e depois expande outra
- **THEN** as duas permanecem expandidas, cada uma com seu próprio conteúdo

#### Scenario: Expansão desligada preserva o comportamento atual
- **WHEN** a tabela é usada sem habilitar a expansão
- **THEN** nenhuma coluna ou controle de expansão é renderizado e todas as funções existentes
  (modo servidor, ordenação, agrupamento, paginação, busca, filtros, ações e estado vazio) seguem
  inalteradas

#### Scenario: A expansão não interfere na ordenação nem na paginação
- **WHEN** a expansão está habilitada e o usuário ordena uma coluna, busca ou troca de página
- **THEN** a ordenação/busca/paginação continuam operando sobre os dados normalmente, com a coluna de
  expansão fora da ordenação

### Requirement: A UiDataTable expõe estado de erro com retry

A `UiDataTable` SHALL aceitar um estado de erro da carga e exibir uma mensagem persistente com uma
ação de **Tentar novamente**, distinta do estado vazio e do filtro sem resultados. O estado de erro
NÃO SHALL ser apresentado como “nenhum registro encontrado”. Quando o erro for de permissão, a
mensagem SHALL ser específica; quando for de conexão/servidor, SHALL orientar a tentar novamente.
A ação de retry SHALL emitir um evento para o chamador recarregar o conjunto.

#### Scenario: Falha de carga não parece lista vazia
- **WHEN** a carga inicial falha (rede, 500 ou 403)
- **THEN** a tabela exibe o estado de erro com a mensagem correspondente e o botão “Tentar novamente”, sem exibir o estado vazio

#### Scenario: Retry recarrega
- **WHEN** o usuário aciona “Tentar novamente”
- **THEN** o chamador é notificado e refaz a carga

#### Scenario: Permissão negada tem mensagem própria
- **WHEN** a carga falha com `403`
- **THEN** a mensagem informa que o perfil não tem permissão, sem sugerir erro de conexão

### Requirement: A busca da UiDataTable tem nome acessível

O campo de busca interno da `UiDataTable` SHALL ter um nome acessível (`label` visualmente oculto ou
`aria-label`) que descreva a ação, além do placeholder. O nome SHALL ser configurável pelo chamador e
SHALL existir mesmo quando o placeholder estiver visível.

#### Scenario: Busca anunciada por leitor de tela
- **WHEN** o foco vai para o campo de busca da tabela
- **THEN** a tecnologia assistiva anuncia um nome que identifica a busca, não apenas “edição de texto”

#### Scenario: Busca customizada mantém o nome
- **WHEN** o chamador usa a busca própria (ex.: Parceiros/Escopo) com `UiInput`
- **THEN** o campo recebe `label`/`aria-label` e continua anunciável

### Requirement: A paginação da tabela é responsiva

Os controles de paginação da `UiDataTable`/`UiPagination` SHALL permanecer acessíveis em viewports de
320–375 px, quebrando linha ou usando rolagem própria dentro do card, sem cortar botões por
`overflow-hidden` e sem produzir overflow horizontal na página.

#### Scenario: Paginação em 320px
- **WHEN** a tabela é exibida em 320px com mais de uma página
- **THEN** os botões de página continuam visíveis e acionáveis, com quebra de linha ou rolagem interna

#### Scenario: Sem overflow da página
- **WHEN** a paginação é exibida em 375px
- **THEN** a página não ganha barra de rolagem horizontal

### Requirement: O rótulo da paginação é neutro e configurável

O resumo da paginação SHALL usar um rótulo neutro por padrão (ex.: “registros exibidos”) e SHALL
permitir que o chamador informe o rótulo do conjunto (ex.: “chamadas exibidas”, “parceiros
exibidos”). O componente NÃO SHALL usar um rótulo fixo de outro módulo quando o chamador não o
informar.

#### Scenario: Rótulo padrão neutro

- **WHEN** a paginação é exibida sem um rótulo customizado
- **THEN** o resumo usa “registros” e não um termo específico de outro módulo

#### Scenario: Rótulo customizado

- **WHEN** o chamador informa o rótulo do conjunto
- **THEN** o resumo usa exatamente esse rótulo, com pluralização coerente
