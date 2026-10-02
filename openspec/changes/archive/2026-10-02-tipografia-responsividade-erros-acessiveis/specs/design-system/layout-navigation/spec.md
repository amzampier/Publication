# Spec Delta

## ADDED Requirements

### Requirement: O shell administrativo se adapta à largura da viewport
O sistema SHALL adaptar o shell da Área Administrativa à largura da viewport: abaixo de `lg` (1024px), com a sidebar expandida, esta é exibida como drawer sobreposto ao conteúdo com backdrop, e a área de conteúdo ocupa 100% da largura disponível; a partir de `lg`, o shell mantém o comportamento atual (sidebar expandida `w-52` ou rail deslocando o conteúdo). Em nenhuma largura a área de conteúdo pode produzir overflow horizontal.

#### Scenario: Drawer abaixo de lg
- **WHEN** a viewport tem menos de 1024px e o usuário expande a sidebar
- **THEN** a sidebar aparece como sobreposição com backdrop sobre o conteúdo e o `main` permanece com largura total, sem barra de rolagem horizontal

#### Scenario: Configurações Globais utilizável a 375px
- **WHEN** `/admin/configuracoes-globais` é aberto em viewport de 375px com a sidebar no estado padrão
- **THEN** o conteúdo é utilizável sem overflow horizontal, o cabeçalho quebra em linhas (`flex-wrap`) e o botão "Salvar Alterações Globais" permanece visível sem corte

#### Scenario: Telas intermediárias permanecem íntegras
- **WHEN** as telas administrativas são exibidas em 768px e 1024px
- **THEN** abas, cards e tabela renderizam íntegros — com rolagem horizontal na barra de abas quando os rótulos não couberem

#### Scenario: A partir de lg o shell atual é preservado
- **WHEN** a viewport tem 1024px ou mais
- **THEN** a sidebar expandida ocupa sua largura ao lado do conteúdo e o rail recolhido continua comportando como hoje, com tooltip por item

### Requirement: A sidebar inicia recolhida em telas estreitas preservando a escolha manual
O sistema SHALL inicializar a sidebar recolhida em telas estreitas (menores que `lg`) na primeira carga, SHALL respeitar qualquer alternância manual do usuário na sessão como preferência prevalente sobre a largura e SHALL manter em qualquer largura a semântica de alternância (`aria-expanded`/`aria-controls`) e a preservação do estado das sessões definidas em `layout-navigation`.

#### Scenario: Primeira carga em tela estreita começa recolhida
- **WHEN** a aplicação é carregada pela primeira vez em viewport menor que `lg`
- **THEN** a sidebar inicia recolhida (sem empurrar o conteúdo), em vez de expandida

#### Scenario: Alternância manual prevalece sobre a largura
- **WHEN** o usuário expande ou recolhe a sidebar manualmente na sessão
- **THEN** o estado segue a escolha manual, não sendo sobreescrito por redimensionamentos subsequentes da janela

#### Scenario: Semântica de alternância preservada em qualquer largura
- **WHEN** o botão de alternância é acionado em qualquer largura
- **THEN** ele atualiza `aria-expanded`, mantém `aria-controls` apontando para a sidebar e alterna para o modo definido (drawer abaixo de `lg`; expandido/rail a partir de `lg`)

#### Scenario: Tooltips do rail não são cortados em telas estreitas
- **WHEN** a sidebar está em rail em viewport estreita e o usuário interage com um item
- **THEN** o tooltip do rótulo é exibido sem ser cortado pelas bordas da viewport ou da sidebar
