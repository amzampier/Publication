# Spec Delta: design-system/data-table

## ADDED Requirements

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
