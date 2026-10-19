# Spec Delta: design-system/action-menu

## Purpose

Definir o `UiActionMenu`, componente de kit para agrupar as ações de linha de uma tabela em um menu
suspenso acessível por mouse e teclado, com foco canônico, fechamento previsível e itens
habilitados/desabilitados com motivo.

## ADDED Requirements

### Requirement: O UiActionMenu agrupa ações de linha em um menu suspenso
O `UiActionMenu` SHALL renderizar um botão de acionamento (ícone) que abre um menu de ações
posicionado junto ao gatilho. O gatilho SHALL expor `aria-haspopup="menu"` e `aria-expanded`
refletindo o estado aberto/fechado; o menu SHALL usar `role="menu"` e cada ação `role="menuitem"`.
O componente SHALL aceitar uma lista de ações com rótulo, ícone, variante de perigo e estado
habilitado/desabilitado. Quando o espaço disponível for insuficiente, o menu SHALL reposicionar-se
para permanecer visível na viewport.

#### Scenario: Abrir o menu pelo gatilho
- **WHEN** o usuário clica no botão de ações de uma linha
- **THEN** o menu abre junto ao gatilho, com as ações da linha e `aria-expanded="true"` no botão

#### Scenario: Ação dispara o evento da linha
- **WHEN** o usuário aciona um item habilitado do menu
- **THEN** o menu fecha, o foco retorna ao gatilho e a ação correspondente é emitida com a linha

#### Scenario: Item desabilitado informa o motivo
- **WHEN** uma ação está desabilitada (ex.: exclusão bloqueada)
- **THEN** o item é exibido como indisponível, não dispara ação e comunica o motivo de forma acessível

### Requirement: O UiActionMenu é operável por teclado
O `UiActionMenu` SHALL permitir abrir o menu com `Enter`/`Space` no gatilho, percorrer os itens com as
setas `ArrowUp`/`ArrowDown` (com navegação cíclica), acionar com `Enter`/`Space`, fechar com `Escape`
devolvendo o foco ao gatilho e fechar ao clicar fora. O foco dos itens SHALL seguir o padrão visual
canônico (`brand-focus` recortado) do design system.

#### Scenario: Abrir e navegar por teclado
- **WHEN** o gatilho está focado e o usuário pressiona `Enter` ou `Space` e depois as setas
- **THEN** o menu abre e o foco percorre os itens na ordem exibida

#### Scenario: Fechar com Escape devolve o foco
- **WHEN** o menu está aberto e o usuário pressiona `Escape`
- **THEN** o menu fecha e o foco volta ao botão de acionamento

#### Scenario: Clique fora fecha o menu
- **WHEN** o menu está aberto e o usuário clica fora dele
- **THEN** o menu fecha sem disparar nenhuma ação
