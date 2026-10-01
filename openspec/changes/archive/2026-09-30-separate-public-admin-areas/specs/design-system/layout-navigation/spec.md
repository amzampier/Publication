# Spec Delta

## ADDED Requirements

### Requirement: O shell administrativo é restrito às rotas da Área Administrativa
O sistema SHALL exibir o shell (Header Dark + Sidebar) apenas nas rotas sob `/admin/**` e SHALL
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
