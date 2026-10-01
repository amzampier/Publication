# Spec Delta

## MODIFIED Requirements

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
