# Spec Delta

## MODIFIED Requirements

### Requirement: A tabela lista os usuários com paginação, ordenação, busca e badges
O sistema SHALL exibir os usuários em `UiDataTable` com colunas Nome, E-mail, Perfil (badge), Status (badge) e Último acesso (do `ultimo_login` real quando houver), com paginação, ordenação e busca textual do componente, badge de Status distinguível entre "Ativo" e "Inativo" e badge de Perfil distinguível por perfil — cabendo as seis colunas (cinco de dados + Ações) **sem rolagem horizontal** na área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida), inclusive após trocar a quantidade de registros exibidos por página. Em modo servidor, a **ordenação SHALL ser aplicada pelo servidor**: acionar uma coluna ordenável SHALL enviar a ordenação (coluna + direção) à API, que reordena o conjunto antes de paginar, sobre um conjunto **whitelisted** de colunas; uma coluna sem ordenação suportada SHALL ser ignorada, mantendo a ordenação padrão.

#### Scenario: Colunas e ordenação
- **WHEN** a página é aberta
- **THEN** a tabela mostra as colunas Nome, E-mail, Perfil, Status e Último acesso, com paginação funcionando

#### Scenario: Ordenar consulta o servidor
- **WHEN** o usuário aciona o cabeçalho de uma coluna ordenável (ex.: Nome)
- **THEN** a tabela consulta a API com a coluna e a direção escolhidas e exibe o conjunto reordenado pelo servidor (a paginação acompanha o novo critério), sem reordenar apenas as linhas da página corrente no cliente

#### Scenario: Badges de perfil e status
- **WHEN** usuários com perfis e status diferentes são exibidos
- **THEN** cada perfil e cada status aparecem com badge própria, visualmente distinguíveis (Ativo em destaque positivo, Inativo em tom neutro)

#### Scenario: Busca textual
- **WHEN** o usuário digita texto na busca da tabela
- **THEN** apenas os usuários que contêm o texto permanecem listados

#### Scenario: Usuário sem acesso registrado
- **WHEN** um usuário nunca acessou o sistema (`ultimo_login` nulo no banco)
- **THEN** a coluna "Último acesso" exibe "-" (hífen) naquela linha

#### Scenario: Trocar a quantidade de linhas não abre rolagem horizontal
- **WHEN** o usuário altera "Linhas por página" (ex.: de 5 para 20 ou 50) numa janela ≥ ~1280px com sidebar expandida
- **THEN** a área da tabela ganha linhas sem exibir barra de rolagem horizontal, com as seis colunas visíveis

### Requirement: A tela opera sobre a API de usuários; filtros e exportações permanecem locais
O sistema SHALL carregar a listagem de usuários de `GET /api/usuarios` na montagem da página e a cada mudança de página/tamanho/ordenação/busca (com debounce), exibindo estado de carregamento e toast de erro na falha (sem simular dados). CRUD, importação, exclusão, bloqueio e convite SHALL operar via API, com as mutações refletidas imediatamente (a listagem é rebuscada). Em caso de falha da carga, além da tabela vazia, o sistema SHALL zerar também os **KPIs, o total e as opções de filtro**, de modo que nenhum dado da carga anterior permaneça visível. Filtros, busca, paginação e KPIs SHALL ser processados **no servidor** sobre o conjunto filtrado; a exportação SHALL buscar o conjunto filtrado completo pela API. Os filtros SHALL continuar sendo descartados na recarga.

#### Scenario: Carga inicial mostra os usuários do banco
- **WHEN** o navegador abre `/admin/gestao-usuarios` com sessão ativa
- **THEN** um estado de carregamento é exibido enquanto `GET /api/usuarios` responde, e em seguida a tabela exibe a primeira página de usuários persistidos no banco (ex.: o administrador provisionado e as contas criadas por convite)

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição de listagem falha (rede, banco ou sessão expirada sem refresh)
- **THEN** um toast de erro informa a falha, a tabela fica vazia e os KPIs, o total e as opções de filtro são zerados, sem exibir dados da carga anterior nem a base de demonstração antiga

#### Scenario: Recarga rebusca o banco
- **WHEN** a página é recarregada após criar, editar, importar, excluir, bloquear ou convidar
- **THEN** a listagem vem da API com os dados persistentes (nada volta a uma base demo)

#### Scenario: Filtro e exportação consultam o servidor
- **WHEN** o usuário aplica filtros, busca na tabela (com debounce), muda de página ou gera CSV/PDF
- **THEN** a aplicação consulta a API uma vez por interação (filtro/página) — sem uma requisição por tecla — e a exportação obtém o conjunto filtrado completo para montar o arquivo

#### Scenario: Exportação busca o conjunto completo
- **WHEN** o usuário gera CSV ou PDF
- **THEN** a aplicação obtém da API o conjunto filtrado completo (todas as páginas) e gera o arquivo sobre ele