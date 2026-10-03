# Spec Delta

## MODIFIED Requirements

### Requirement: Os filtros estruturais vivem no modal do botão Filtros
O sistema SHALL oferecer o botão "Filtros" na toolbar da tabela de auditoria (à direita do campo de busca, recurso do `UiDataTable` ativado por `showFilters`), abrindo um `UiModal` — com ícone no cabeçalho, como os demais `UiModal` do kit — cujo corpo é organizado em três sessões `UiModalSection`: **"Período"**, contendo os campos de **data inicial** e **data final** (controles `UiDatePicker`); **"Usuário"**, contendo um controle de seleção única `UiSelect` para o filtro de **usuário**; e **"Ação e Recurso"**, contendo dois controles de seleção única `UiSelect` para os filtros de **ação** e **recurso** — em todos, o estado vazio equivale a "todos" (placeholder "Todos/Todas") e a limpeza restaura "todos"; além das ações "Limpar Filtros" (à esquerda do rodapé), "Cancelar" e "Aplicar" (à direita), com o botão da toolbar indicando a quantidade de filtros ativos por badge (`filtersCount`).

#### Scenario: Modal com os cinco campos de filtro
- **WHEN** o usuário aciona o botão "Filtros" na toolbar da tabela
- **THEN** um modal abre com os campos de data inicial, data final, usuário, ação e recurso e as ações "Limpar Filtros", "Cancelar" e "Aplicar"

#### Scenario: Corpo do modal em três sessões
- **WHEN** o modal de filtros é aberto
- **THEN** o corpo exibe três containers de sessão sobre o fundo do modal: "Período" com as datas inicial e final, "Usuário" com um select de usuário e "Ação e Recurso" com os selects de ação e recurso

#### Scenario: Selecionar em um select e aplicar filtra
- **WHEN** o usuário escolhe uma ação em um dos selects e clica "Aplicar"
- **THEN** a tabela e os KPIs passam a mostrar apenas os registros que atendem ao filtro e o botão "Filtros" exibe a contagem de filtros ativos

#### Scenario: Aplicar filtra a tabela e os KPIs
- **WHEN** o usuário escolhe filtros (datas e/ou seleções) e clica "Aplicar"
- **THEN** a tabela e os KPIs passam a mostrar apenas os registros que atendem a todos os filtros e o botão "Filtros" exibe a contagem de filtros ativos

#### Scenario: Limpar restaura o estado inicial
- **WHEN** o usuário clica "Limpar Filtros" com filtros ativos
- **THEN** a tabela, os KPIs e a contagem do botão voltam ao estado sem filtros

#### Scenario: Cancelar descarta o rascunho
- **WHEN** o usuário altera campos no modal e clica "Cancelar"
- **THEN** o modal fecha sem aplicar as alterações e os filtros vigentes permanecem inalterados

#### Scenario: Escape fecha primeiro o dropdown aberto
- **WHEN** um dos selects (ou calendários) do modal está com o popup aberto e o usuário pressiona `Escape`
- **THEN** apenas o popup fecha, o modal permanece aberto e o rascunho em edição é preservado; um segundo `Escape`, com nenhum popup aberto, fecha o modal

### Requirement: A tabela lista os registros da trilha de auditoria com paginação, ordenação e busca
O sistema SHALL exibir os registros em `UiDataTable` com colunas de data/hora, usuário, ação (badge), recurso, detalhes e IP, ordenados do registro mais recente para o mais antigo, com paginação e busca textual do componente, e badge de ação distinguível por tipo de operação (Inclusão, Alteração, Exclusão, Homologação) — cabendo as sete colunas (seis de dados + Ações) **sem rolagem horizontal** na área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida), inclusive após trocar a quantidade de registros exibidos por página.

#### Scenario: Colunas e ordenação
- **WHEN** a página é aberta
- **THEN** a tabela mostra as colunas data/hora, usuário, ação, recurso, detalhes e IP, com o registro mais recente no topo e paginação funcionando

#### Scenario: Badge distinto por ação
- **WHEN** os registros de Inclusão, Alteração, Exclusão e Homologação são exibidos
- **THEN** cada tipo de ação aparece com badge de variante própria, visualmente distinguível

#### Scenario: Busca textual
- **WHEN** o usuário digita texto na busca da tabela
- **THEN** apenas os registros que contêm o texto permanecem listados

#### Scenario: Trocar a quantidade de linhas não abre rolagem horizontal
- **WHEN** o usuário altera "Linhas por página" (ex.: de 5 para 20 ou 50) numa janela ≥ ~1280px com sidebar expandida
- **THEN** a área da tabela ganha linhas sem exibir barra de rolagem horizontal, com as sete colunas visíveis

### Requirement: O detalhe do registro abre por controle na coluna Ações
O sistema SHALL oferecer na coluna "Ações" da tabela um controle acessível (com texto alternativo/tooltip) que abre um `UiModal` exibindo todos os campos do registro selecionado dentro de uma sessão `UiModalSection` intitulada **"Dados do Registro"**, com fechamento pelos controles do modal.

#### Scenario: Abrir o detalhe
- **WHEN** o usuário aciona o controle de ver detalhes na linha de um registro
- **THEN** um modal abre com data/hora, usuário, ação, recurso, IP e a descrição completa dos detalhes daquele registro, apresentados em um container de sessão "Dados do Registro"

#### Scenario: Fechar o detalhe
- **WHEN** o usuário fecha o modal (botão, X ou Escape)
- **THEN** o modal fecha e a tabela permanece no mesmo estado
