# Layout Navigation Specification

## Purpose

Definir a estrutura e o comportamento do shell da Área Administrativa — zonas do Header, ordem do
menu do Account, árvore de navegação da sidebar (item raiz e sessões) e alternância entre modo
expandido e rail — para que código, vitrine `/design`, documentação e validação de QA observem o mesmo
shell.

## Requirements

### Requirement: O header exibe as zonas canônicas com alternância e logo à esquerda
O sistema SHALL exibir no Header, na zona esquerda, o botão de alternância da sidebar seguido da
identidade do produto, **sem qualquer texto, seletor ou badge de empresa/filial** (sistema de escopo único).

#### Scenario: Identidade exibida é Publications
- **WHEN** o shell da Área Administrativa é renderizado
- **THEN** a zona esquerda mostra o botão de alternância e, ao lado, o logotipo com o nome `Publications`

#### Scenario: Nenhum rótulo de empresa ou filial no header
- **WHEN** o header é inspecionado
- **THEN** não existe texto do tipo "Matriz/Filial", nome de empresa ativa ou seletor de unidade

#### Scenario: Alternância com estado acessível
- **WHEN** a sidebar está expandida, o botão de alternância oferece `aria-label` indicando recolher e
  `aria-expanded="true"`; quando está recolhida, o rótulo indica expandir e `aria-expanded="false"`
- **THEN** o botão continua controlando a mesma sidebar (`aria-controls` aponta para ela)

### Requirement: A zona direita do header oferece notificações e o bloco Account
O sistema SHALL exibir na zona direita do header a central de notificações e o bloco Account, com o
Account ocupando o extremo direito, oposto ao botão de alternância.

#### Scenario: Account no extremo direito
- **WHEN** o header é renderizado
- **THEN** o bloco Account está à direita da central de notificações e no extremo direito da barra

#### Scenario: Menus são mutuamente exclusivos
- **WHEN** a central de notificações está aberta e o usuário abre o menu do Account (ou vice-versa)
- **THEN** o outro painel é fechado

### Requirement: O menu do Account apresenta os itens na ordem definida
O sistema SHALL exibir o menu do Account com exatamente esta ordem: **Meu Perfil**, divisor,
**Configurações Globais**, **Gestão de Usuários**, **Configuração de Perfis (RBAC)**, **Gestão de
Auditoria**, divisor, **Encerrar Sessão**.

#### Scenario: Ordem e divisores
- **WHEN** o menu do Account é aberto
- **THEN** os itens aparecem na ordem acima, com um divisor entre "Meu Perfil" e "Configurações
  Globais" e outro entre "Gestão de Auditoria" e "Encerrar Sessão"

#### Scenario: Item removido não aparece
- **WHEN** o menu do Account é aberto
- **THEN** não há entrada de troca de filial/empresa nem qualquer outro item fora da ordem definida

#### Scenario: Fechamento por teclado e clique fora
- **WHEN** o menu está aberto e o usuário pressiona `Escape` ou clica fora do bloco
- **THEN** o menu fecha

### Requirement: A sidebar apresenta o item raiz e as sessões com os itens canônicos
O sistema SHALL exibir na sidebar, acima das sessões, o item raiz **Painel Executivo** e, em seguida,
três sessões com estes itens, nesta ordem: **Publicações** (Manuais, Release Week, Escopo de Projetos),
**Cadastros** (Parceiros, Softwares) e **Administração** (Gestão de Usuários, Perfis de Acesso (RBAC),
Auditoria, Configurações Globais).

#### Scenario: Árvore completa
- **WHEN** a sidebar está expandida com todas as sessões abertas
- **THEN** são exibidos o item raiz e os nove itens das três sessões, na ordem definida

#### Scenario: Resquícios antigos ausentes
- **WHEN** a sidebar é inspecionada
- **THEN** não existem as sessões "Governança & Multi-Filiais" nem o item "Empresas & Filiais"

#### Scenario: Recolhimento individual das sessões
- **WHEN** o cabeçalho de uma sessão é ativado
- **THEN** apenas aquela sessão recolhe/expande, as demais mantêm o estado, e todas iniciam abertas

### Requirement: A sidebar alterna entre modo expandido e rail exibindo todos os ícones e preservando o estado
O sistema SHALL alternar a sidebar entre o modo expandido (títulos completos) e o modo rail (somente
ícones), exibindo no rail **todos os ícones de todas as sessões — independentemente do estado de
recolhimento das sessões**, que passa a valer apenas no modo expandido — com um divisor entre sessões
e um tooltip por item — e SHALL preservar o estado de recolhimento das sessões ao reexpandir.

#### Scenario: Rail mostra todos os ícones mesmo com todas as sessões recolhidas
- **WHEN** a sidebar é recolhida com todas as sessões em modo acordeão (recolhidas)
- **THEN** os cabeçalhos de sessão não são exibidos, todos os itens permanecem visíveis como ícones
  centralizados (inclusive os de sessões recolhidas) e há um divisor entre sessões

#### Scenario: Tooltip por item no rail
- **WHEN** a sidebar está em rail e o usuário interage com um item
- **THEN** seu rótulo é exibido em tooltip sem ser cortado pela borda da sidebar, e o tooltip não
  aparece no modo expandido

#### Scenario: Estado preservado ao reexpandir
- **WHEN** uma sessão é recolhida, a sidebar vai para o rail e volta a expandir
- **THEN** a sessão continua recolhida e as demais mantêm seus estados

### Requirement: Shell e vitrine `/design` observam a mesma navegação
O sistema SHALL manter a árvore de navegação e o menu do Account definidos em um único ponto de
configuração, de modo que a seção 14 da vitrine `/design` exiba exatamente os mesmos grupos, itens,
ícone/rotulo do item raiz, ordem do menu e larguras do shell real.

#### Scenario: Fonte única
- **WHEN** um item é adicionado, renomeado ou removido na configuração de navegação
- **THEN** a sidebar real e a seção 14 do `/design` refletem a mudança sem edição manual em duas fontes

#### Scenario: Vitrine espelha o item raiz e o menu
- **WHEN** a seção 14 do `/design` é renderizada
- **THEN** ela mostra o item raiz "Painel Executivo" acima das três sessões e o menu do Account com a
  mesma ordem e divisores do shell real

### Requirement: O shell administrativo é restrito às rotas da Área Administrativa
O sistema SHALL exibir o shell (Header + Sidebar) apenas nas rotas sob `/admin/**` e SHALL
renderizar a raiz (`/`) como Área Pública, sem qualquer elemento do shell.

#### Scenario: Raiz renderiza sem o shell
- **WHEN** o visitante abre `/`
- **THEN** a página não exibe o botão de alternância, o logo `Publications`, a central de
  notificações, o bloco Account nem a sidebar/rail

#### Scenario: Rota administrativa renderiza com o shell
- **WHEN** o visitante abre `/admin`
- **THEN** a página exibe o shell completo (header com as zonas canônicas e a sidebar com o item
  raiz e as sessões)

#### Scenario: A vitrine de design continua fora do shell
- **WHEN** o visitante abre `/design`
- **THEN** a página renderiza sem o shell das áreas (mantém seu layout próprio), como já faz hoje

### Requirement: A Área Pública renderiza sem chrome administrativo
O sistema SHALL renderizar a Área Pública como conteúdo sobre o fundo App Canvas, sem header
administrativo, sidebar ou rail.

#### Scenario: Conteúdo público sem controles administrativos
- **WHEN** a raiz é renderizada
- **THEN** o fundo é o App Canvas e não há controles administrativos (toggle, sino, avatar) nem
  navegação lateral

#### Scenario: O shell aparece somente após navegar para /admin
- **WHEN** o usuário navega de `/` para `/admin` na mesma sessão
- **THEN** o shell passa a ser exibido a partir de `/admin` e a raiz permanece sem ele ao voltar

### Requirement: Toda rota sob /admin/** é renderizada com o shell da Área Administrativa
O sistema SHALL renderizar qualquer rota futura criada sob a Área Administrativa com o mesmo shell,
sem exceção, de modo que a adição de telas administrativas não dependa de marcação ou estilos próprios
por página.

#### Scenario: Tela inicial em /admin
- **WHEN** a tela inicial da Área Administrativa é servida em `/admin`
- **THEN** ela renderiza dentro do shell, exibindo o placeholder "Painel Executivo" na área de conteúdo

#### Scenario: Novas telas administrativas herdam o shell
- **WHEN** uma nova página é adicionada sob `/admin/`
- **THEN** ela renderiza com o mesmo header e sidebar, sem configuração visual adicional na página

#### Scenario: Páginas públicas não herdam o shell
- **WHEN** uma página fora de `/admin/**` é renderizada sem o layout administrativo declarado
- **THEN** ela não exibe header nem sidebar da Área Administrativa

### Requirement: Itens de navegação podem declarar rota e o ativo reflete a rota atual
Os itens da sidebar e do menu do Account SHALL poder declarar uma rota opcional (`to`); quando declarada, o clique do usuário navega para essa rota, e o item da sidebar correspondente à rota corrente é exibido como ativo. Itens sem rota continuam apenas marcando estado visual, como hoje.

#### Scenario: Item com rota navega
- **WHEN** o usuário clica em "Configurações Globais" na sidebar ou no menu do Account
- **THEN** o navegador vai para `/admin/configuracoes-globais` e o menu do Account é fechado

#### Scenario: Item ativo acompanha a rota
- **WHEN** a rota corrente corresponde à rota declarada de um item da sidebar
- **THEN** aquele item é exibido como ativo (mesmo estilo do item selecionado hoje), com `aria-current="page"`

#### Scenario: Item sem rota preserva o comportamento atual
- **WHEN** o usuário clica em um item sem rota declarada (ex.: Manuais)
- **THEN** apenas o estado visual de item ativo muda, sem navegação, como no comportamento atual

#### Scenario: Chegar por URL direta também marca o item
- **WHEN** o usuário abre `/admin/configuracoes-globais` diretamente pelo endereço
- **THEN** o item "Configurações Globais" da sidebar aparece como ativo

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
