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

### Requirement: A sidebar alterna entre modo expandido e rail preservando o estado
O sistema SHALL alternar a sidebar entre o modo expandido (títulos completos) e o modo rail (somente
ícones), mantendo visíveis no rail apenas as sessões abertas, com divisor entre elas e um tooltip por
item — e SHALL preservar o estado de recolhimento das sessões ao reexpandir.

#### Scenario: Rail mostra apenas ícones de sessões abertas
- **WHEN** a sidebar é recolhida
- **THEN** os cabeçalhos de sessão não são exibidos, os itens aparecem como ícones centralizados e há
  um divisor entre sessões abertas

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
