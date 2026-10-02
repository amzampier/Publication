# Spec Delta

## Purpose

Definir o comportamento da página de Gestão de Auditoria — consulta dos registros das operações (fase 1 em memória) com KPIs, filtros estruturais, tabela paginada, detalhe do registro e exportação CSV/PDF — para que a Área Administrativa ofereça rastreabilidade das ações conforme o modelo `registrarAuditoria` descrito no `docs/02`.

## ADDED Requirements

### Requirement: A página de auditoria existe em /admin/auditoria dentro do shell administrativo
O sistema SHALL servir a Gestão de Auditoria em `/admin/auditoria`, renderizada com o shell da Área Administrativa (header + sidebar), exibindo o título "Gestão de Auditoria" com identidade do módulo.

#### Scenario: Rota renderiza com shell
- **WHEN** o visitante abre `/admin/auditoria`
- **THEN** a página exibe o header e a sidebar da Área Administrativa e, na área de conteúdo, o título "Gestão de Auditoria"

#### Scenario: Acesso direto por URL
- **WHEN** a rota é carregada diretamente pela URL (recarga)
- **THEN** a página renderiza com os registros de demonstração e sem erro

### Requirement: Os atalhos de navegação apontam para a página
O sistema SHALL declarar a rota `/admin/auditoria` no item "Gestão de Auditoria" da sidebar e no mesmo item do menu da conta, de modo que ambos naviguem para a página e o item da sidebar correspondente apareça como ativo.

#### Scenario: Item da sidebar navega e fica ativo
- **WHEN** o usuário clica em "Administração > Gestão de Auditoria" na sidebar
- **THEN** o navegador navega para `/admin/auditoria` e aquele item aparece como ativo

#### Scenario: Item do menu da conta navega
- **WHEN** o usuário clica em "Gestão de Auditoria" no menu da conta
- **THEN** o navegador navega para `/admin/auditoria`

### Requirement: Os KPIs derivam do conjunto de registros filtrado
O sistema SHALL exibir no topo da página os KPIs "Registros" (contagem do conjunto filtrado), "Período" (rótulo do período vigente), "Usuários distintos" e "Última atividade" (data/hora do registro mais recente do conjunto), recalculados sempre que os filtros mudam.

#### Scenario: Sem filtros ativos
- **WHEN** a página é aberta sem nenhum filtro aplicado
- **THEN** "Registros" mostra a contagem total da base de demonstração e "Última atividade" corresponde ao registro mais recente

#### Scenario: Filtro de ação recalcula os KPIs
- **WHEN** o usuário aplica o filtro de ação "Inclusão"
- **THEN** "Registros", "Usuários distintos" e "Última atividade" passam a considerar apenas os registros de Inclusão

#### Scenario: Período vigente vira rótulo
- **WHEN** as datas inicial e final estão preenchidas (ex.: 01/10/2026 a 02/10/2026)
- **THEN** o KPI "Período" exibe o intervalo em formato `dd/mm` (ex.: "01/10 – 02/10") e, sem datas, exibe "Tudo"

### Requirement: Os filtros estruturais vivem no modal do botão Filtros
O sistema SHALL oferecer o botão "Filtros" na toolbar da tabela de auditoria (à direita do campo de busca, recurso do `UiDataTable` ativado por `showFilters`), abrindo um `UiModal` — com ícone no cabeçalho, como os demais `UiModal` do kit — contendo cinco campos: **data inicial** e **data final** (controles `UiDatePicker`) e os filtros de **usuário**, **ação** e **recurso** como listas de chips de seleção única (sem menu suspenso), além das ações "Limpar Filtros" (à esquerda do rodapé), "Cancelar" e "Aplicar" (à direita), com o botão da toolbar indicando a quantidade de filtros ativos por badge (`filtersCount`).

#### Scenario: Modal com os cinco campos de filtro
- **WHEN** o usuário aciona o botão "Filtros" na toolbar da tabela
- **THEN** um modal abre com os campos de data inicial, data final, usuário, ação e recurso e as ações "Limpar Filtros", "Cancelar" e "Aplicar"

#### Scenario: Aplicar filtra a tabela e os KPIs
- **WHEN** o usuário escolhe filtros (datas e/ou seleções) e clica "Aplicar"
- **THEN** a tabela e os KPIs passam a mostrar apenas os registros que atendem a todos os filtros e o botão "Filtros" exibe a contagem de filtros ativos

#### Scenario: Limpar restaura o estado inicial
- **WHEN** o usuário clica "Limpar Filtros" com filtros ativos
- **THEN** a tabela, os KPIs e a contagem do botão voltam ao estado sem filtros

#### Scenario: Cancelar descarta o rascunho
- **WHEN** o usuário altera campos no modal e clica "Cancelar"
- **THEN** o modal fecha sem aplicar as alterações e os filtros vigentes permanecem inalterados

### Requirement: A tabela lista os registros da trilha de auditoria com paginação, ordenação e busca
O sistema SHALL exibir os registros em `UiDataTable` com colunas de data/hora, usuário, ação (badge), recurso, detalhes e IP, ordenados do registro mais recente para o mais antigo, com paginação e busca textual do componente, e badge de ação distinguível por tipo de operação (Inclusão, Alteração, Exclusão, Homologação).

#### Scenario: Colunas e ordenação
- **WHEN** a página é aberta
- **THEN** a tabela mostra as colunas data/hora, usuário, ação, recurso, detalhes e IP, com o registro mais recente no topo e paginação funcionando

#### Scenario: Badge distinto por ação
- **WHEN** os registros de Inclusão, Alteração, Exclusão e Homologação são exibidos
- **THEN** cada tipo de ação aparece com badge de variante própria, visualmente distinguível

#### Scenario: Busca textual
- **WHEN** o usuário digita texto na busca da tabela
- **THEN** apenas os registros que contêm o texto permanecem listados

### Requirement: O detalhe do registro abre por controle na coluna Ações
O sistema SHALL oferecer na coluna "Ações" da tabela um controle acessível (com texto alternativo/tooltip) que abre um `UiModal` exibindo todos os campos do registro selecionado, com fechamento pelos controles do modal.

#### Scenario: Abrir o detalhe
- **WHEN** o usuário aciona o controle de ver detalhes na linha de um registro
- **THEN** um modal abre com data/hora, usuário, ação, recurso, IP e a descrição completa dos detalhes daquele registro

#### Scenario: Fechar o detalhe
- **WHEN** o usuário fecha o modal (botão, X ou Escape)
- **THEN** o modal fecha e a tabela permanece no mesmo estado

### Requirement: A exportação opera sobre os registros filtrados
O sistema SHALL oferecer no cabeçalho o menu "Exportar" com as opções "Exportar em CSV" (gera download dos registros que passam pelos filtros ativos, com cabeçalhos) e "Listar em PDF" (abre a impressão do navegador da listagem vigente, sem o shell da aplicação).

#### Scenario: Exportar em CSV respeita os filtros
- **WHEN** há filtros ativos e o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo CSV é baixado contendo exatamente os registros filtrados, com linha de cabeçalho

#### Scenario: Listar em PDF usa a listagem vigente
- **WHEN** o usuário escolhe "Listar em PDF"
- **THEN** o diálogo de impressão do navegador é aberto com a listagem de registros e sem header, sidebar ou botões da aplicação

### Requirement: A fase 1 opera sem persistência e sem chamadas de rede
O sistema SHALL manter os registros, filtros e exportações inteiramente em memória, restaurando os dados de demonstração a cada recarga da página, sem requisições HTTP.

#### Scenario: Recarga restaura o estado inicial
- **WHEN** a página é recarregada após filtrar
- **THEN** a base de registros de demonstração aparece novamente, sem filtros aplicados

### Requirement: O rodapé informa a política de retenção com acesso às Configurações
O sistema SHALL exibir abaixo da tabela uma nota de que os registros estão sujeitos à política de retenção, com caminho de navegação para Configurações Globais.

#### Scenario: Nota e navegação
- **WHEN** a página é exibida
- **THEN** a nota sobre a política de retenção aparece sob a tabela e seu controle leva o usuário a `/admin/configuracoes-globais`