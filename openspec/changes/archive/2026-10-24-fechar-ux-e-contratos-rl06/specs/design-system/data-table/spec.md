# Spec Delta

## MODIFIED Requirements

### Requirement: A UiDataTable opera em modo servidor

O `UiDataTable` SHALL suportar um **modo servidor** (habilitado por uma prop) em que: (a) renderiza as linhas recebidas como a **página corrente** (sem filtrar, ordenar ou paginar localmente); (b) deriva o total de páginas e os controles de navegação do valor `total` recebido por prop; (c) emite eventos para o chamador quando o usuário muda de **página**, altera **linhas por página**, **ordena** uma coluna ou **busca** — e, nesse modo, a busca SHALL ser **debounced**. A ordenação SHALL refazer a consulta (ou ser desabilitada de forma explícita) para que `aria-sort` e a ordem real coincidam. No modo padrão (cliente), o comportamento atual SHALL permanecer inalterado.

#### Scenario: Página renderizada vem do servidor
- **WHEN** a tabela está em modo servidor e recebe um conjunto de linhas com um `total`
- **THEN** ela exibe exatamente aquelas linhas como a página corrente e mostra "Página X de Y" com Y derivado do `total`

#### Scenario: Navegação emite evento
- **WHEN** o usuário muda de página, altera "Linhas por página", ordena uma coluna ou digita na busca (modo servidor)
- **THEN** a tabela emite o evento correspondente e a busca é emitida após o debounce, sem processar o conjunto localmente

#### Scenario: Ordenação coerente no modo servidor
- **WHEN** o usuário ordena uma coluna no modo servidor
- **THEN** a consulta é refeita com a ordenação solicitada (ou o affordance é removido) e a ordem exibida coincide com `aria-sort`

#### Scenario: Modo cliente inalterado
- **WHEN** a tabela é usada sem o modo servidor
- **THEN** filtro, ordenação e paginação continuam ocorrendo no cliente sobre a prop `data`

### Requirement: O estado vazio da tabela distingue base vazia de filtro sem resultado

O estado vazio da `UiDataTable` SHALL distinguir dois casos: **base vazia** (nenhum dado) e **conjunto filtrado sem resultados** (há dados, mas filtros/busca não retornam nada), exibindo mensagens distintas e adequadas a cada caso — nunca a mesma mensagem genérica de "filtro aplicado" para uma base vazia. O estado vazio e o estado de erro SHALL ser renderizados também quando o agrupamento hierárquico estiver ativo.

#### Scenario: Base vazia
- **WHEN** a tabela não recebe nenhum registro e nenhum filtro está ativo
- **THEN** a mensagem de estado vazio indica que não há registros

#### Scenario: Filtro sem resultados
- **WHEN** há filtros ou busca ativos e nenhum registro corresponde
- **THEN** a mensagem de estado vazio indica que nenhum resultado foi encontrado para o filtro

#### Scenario: Agrupamento ativo sem resultados
- **WHEN** há colunas agrupadas e a busca/filtro não retorna registros
- **THEN** a mensagem de filtro sem resultado é exibida, em vez de um corpo vazio

### Requirement: A busca da UiDataTable tem nome acessível

O campo de busca interno da `UiDataTable` SHALL ter um nome acessível (`label` visualmente oculto ou `aria-label`) que descreva a ação, além do placeholder. O nome SHALL ser configurável pelo chamador e SHALL existir mesmo quando o placeholder estiver visível, aplicado ao `<input>` real.

#### Scenario: Busca anunciada por leitor de tela
- **WHEN** o foco vai para o campo de busca da tabela
- **THEN** a tecnologia assistiva anuncia um nome que identifica a busca, não apenas "edição de texto"

#### Scenario: Busca customizada mantém o nome
- **WHEN** o chamador usa a busca própria (ex.: Parceiros/Escopo) com `UiInput`
- **THEN** o campo recebe `label`/`aria-label` e continua anunciável

## ADDED Requirements

### Requirement: Os grupos da UiDataTable são operáveis por teclado

Cada cabeçalho de grupo da `UiDataTable` SHALL ser focável, acionável por `Enter`/`Espaço` e expor `aria-expanded` refletindo o estado. O controle "Remover agrupamento" SHALL identificar a coluna no nome acessível.

#### Scenario: Expandir/recolher por teclado
- **WHEN** o usuário foca um cabeçalho de grupo e pressiona `Enter` ou `Espaço`
- **THEN** o grupo alterna entre expandido e recolhido e `aria-expanded` reflete o estado

#### Scenario: Remover agrupamento identificado
- **WHEN** o usuário navega até o controle de remover agrupamento
- **THEN** o nome acessível informa qual coluna será removida
