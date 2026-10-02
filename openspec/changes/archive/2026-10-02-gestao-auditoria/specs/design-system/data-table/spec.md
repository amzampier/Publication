# Spec Delta

## Purpose

Definir o comportamento da toolbar do `UiDataTable` — busca global no padrão do controle de input do design system e botão "Filtros" opcional à direita, com contador de filtros ativos — para que qualquer página de listagem nasça com busca e filtros consistentes com o kit, sem alterar as demais capacidades da tabela (agrupamento, ordenação, paginação, totalizadores).

## ADDED Requirements

### Requirement: A busca da toolbar usa o controle de input do design system
O sistema SHALL renderizar a busca global da tabela (quando `showHeaderTop` está ativo) com o controle `UiInput` do kit — lupa à esquerda, controle de limpar à direita quando há texto e foco com o destaque canônico `brand-focus` recortado — preservando o comportamento atual: placeholder "Filtrar dados da tabela...", busca case-insensitive, estado vazio "Nenhum dado encontrado com o filtro aplicado." e limpeza que restaura a lista completa.

#### Scenario: Foco no padrão do design system
- **WHEN** o usuário foca o campo de busca da toolbar
- **THEN** o destaque de foco é o contorno `brand-focus` recortado do `UiInput` (mesmo controle dos demais campos do kit), não uma estilização própria

#### Scenario: Limpar restaura a lista
- **WHEN** há texto digitado na busca e o usuário aciona o controle de limpar
- **THEN** o campo é esvaziado e a tabela volta a exibir todos os registros

#### Scenario: Busca continua funcionando igual
- **WHEN** o usuário digita texto na busca
- **THEN** apenas os registros que contêm o texto permanecem listados, como antes da troca do controle

### Requirement: A toolbar oferece o botão Filtros opcional à direita da busca
O sistema SHALL aceitar a ativação do botão "Filtros" na toolbar da tabela (prop `showFilters`); quando ativo, exibir o botão do kit à direita do campo de busca e emitir `open-filters` ao ser acionado, exibindo ainda um badge com a quantidade de filtros ativos quando `filtersCount` for maior que zero. Com `showFilters` desativado (default), a toolbar permanece sem o botão e com o comportamento atual.

#### Scenario: Botão visível e acionável quando solicitado
- **WHEN** a tabela é renderizada com `showFilters` e o usuário clica em "Filtros"
- **THEN** o botão aparece à direita do campo de busca e o evento `open-filters` é emitido para a página (que responde, por exemplo, abrindo seu modal de filtros)

#### Scenario: Contador de filtros ativos
- **WHEN** `filtersCount` é maior que zero
- **THEN** o botão "Filtros" exibe um badge com essa quantidade; quando zero ou ausente, o botão aparece sem badge

#### Scenario: Sem showFilters a toolbar não muda
- **WHEN** a tabela é renderizada sem `showFilters` (default)
- **THEN** nenhum botão "Filtros" é renderizado e a toolbar permanece como hoje (sem regressão para os consumidores existentes)