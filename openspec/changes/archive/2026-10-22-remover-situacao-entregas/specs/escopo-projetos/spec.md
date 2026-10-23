# Spec Delta

## MODIFIED Requirements

### Requirement: Itens do projeto em modal somente leitura
O ícone **Itens** do card SHALL abrir um `UiModal` de largura `xl`, sem criar rota ou página nova,
com os itens do projeto (`entregas_itens` com `projeto_id` vinculado) em modo somente leitura no
componente **`UiDataTable`**: Chamada, Título, Software, Módulo, Tipo, Impacto, Status
(`UiBadge`) e Data de liberação. Os itens SHALL ser carregados sob demanda por
`GET /api/escopo-projetos/:id/itens`, com estados de carregamento, erro e vazio. A grade SHALL
oferecer as funcionalidades do kit — busca, agrupamento por até três colunas, ordenação
multi-coluna, redimensionamento, paginação e totalizadores. Projeto sem itens SHALL exibir o estado
vazio "Nenhum item vinculado a este projeto." O modal SHALL fechar por `Escape`, `X` ou "Fechar". O
CRUD dos itens NÃO SHALL ser oferecido nesta tela. O ícone SHALL ser exibido sob a permissão
`visualizar` do módulo (o catálogo de `escopo-projetos` não possui `visualizar_itens` nesta fase).

#### Scenario: Abrir itens de um projeto com itens
- **WHEN** o usuário aciona o ícone "Itens" de um projeto com itens
- **THEN** a API é consultada, o modal abre em largura `xl` e lista os itens no `UiDataTable`

#### Scenario: Agrupar, ordenar e buscar itens
- **WHEN** o usuário arrasta um cabeçalho para a faixa de agrupamento, clica em um cabeçalho ou usa
  a busca
- **THEN** a grade agrupa, ordena ou filtra os itens conforme a funcionalidade do `UiDataTable`

#### Scenario: Projeto sem itens
- **WHEN** a API retorna lista vazia para um projeto
- **THEN** o modal exibe o estado vazio informando que não há itens

#### Scenario: Falha ao carregar itens
- **WHEN** a API de itens falha
- **THEN** o modal exibe uma mensagem de erro e permite tentar novamente

#### Scenario: Fechar o modal
- **WHEN** o usuário aciona "Fechar", `Escape` ou o `X`
- **THEN** o modal fecha e a grade permanece no estado anterior
