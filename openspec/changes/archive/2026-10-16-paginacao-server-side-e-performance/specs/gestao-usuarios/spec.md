# Spec Delta

## MODIFIED Requirements

### Requirement: Os KPIs derivam do conjunto de usuários vigente
O sistema SHALL exibir no topo da página os KPIs "Total de usuários", "Ativos", "Inativos" e "Perfis distintos", calculados **no servidor** sobre o conjunto filtrado e devolvidos pela API, de modo que reflitam o banco inteiro (não apenas a página corrente) e sejam recalculados quando os filtros mudam ou quando o conjunto é alterado por uma escrita.

#### Scenario: Base completa
- **WHEN** a página é aberta sem nenhum filtro aplicado
- **THEN** os quatro KPIs refletem o conjunto calculado no servidor (contagem total, ativos, inativos e perfis distintos do banco)

#### Scenario: Conjunto alterado recalcula os KPIs
- **WHEN** o conjunto de usuários muda (por filtro do módulo)
- **THEN** "Total de usuários", "Ativos", "Inativos" e "Perfis distintos" passam a considerar apenas esse conjunto, recalculados no servidor

#### Scenario: Criar ou editar usuário recalcula os KPIs
- **WHEN** o usuário salva um novo usuário ou altera um existente
- **THEN** os quatro KPIs refletem imediatamente o conjunto resultante (a listagem é rebuscada pela API)

### Requirement: A exportação gera arquivos sobre o conjunto de usuários vigente
O sistema SHALL oferecer no cabeçalho o menu "Relatórios" (posicionado à esquerda do botão "Novo Usuário") com as opções "Ficha Cadastral" (gera um PDF em folha retrato com uma ficha por página para cada usuário do conjunto vigente), "Relação Completa" (gera e baixa o relatório `usuarios.pdf` em folha paisagem sobre os mesmos usuários) e "Exportar em CSV" (download do conjunto vigente com cabeçalhos), com um divisor separando as opções em PDF do CSV, sem abrir o diálogo de impressão do navegador. Como a listagem é paginada, a exportação SHALL obter da API o conjunto filtrado **completo** (todas as páginas) antes de gerar o arquivo.

#### Scenario: Exportar em CSV
- **WHEN** o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo CSV é baixado contendo o conjunto vigente de usuários (conjunto completo, não apenas a página), com linha de cabeçalho (Nome, E-mail, Perfil, Status, Último acesso)

#### Scenario: Relação Completa gera o relatório estruturado
- **WHEN** o usuário escolhe "Relação Completa"
- **THEN** o arquivo `usuarios.pdf` é baixado em folha paisagem com cabeçalho contendo a logo de login configurada (quando houver) à esquerda e o título "Relatório de Gestão de Usuários" à direita, as colunas Nome, E-mail, Perfil, Status e Último acesso com os usuários do conjunto, e paginação com a indicação da página

#### Scenario: Ficha Cadastral gera uma ficha por usuário
- **WHEN** o usuário escolhe "Ficha Cadastral"
- **THEN** o arquivo `ficha-cadastral.pdf` é baixado em folha retrato com uma página por usuário do conjunto, contendo identificador, nome, e-mail, perfil, status e último acesso, com a mesma identidade visual (logo, faixas navy e rodapé) dos demais relatórios

#### Scenario: Os relatórios são baixados sem diálogo de impressão
- **WHEN** qualquer das opções em PDF do menu "Relatórios" é acionada
- **THEN** `window.print()` não é chamado e o arquivo é salvo diretamente no dispositivo

### Requirement: A tela opera sobre a API de usuários; filtros e exportações permanecem locais
O sistema SHALL carregar a listagem de usuários de `GET /api/usuarios` na montagem da página e a cada mudança de página/tamanho/ordenação/busca (com debounce), exibindo estado de carregamento e toast de erro na falha (sem simular dados). CRUD, importação, exclusão, bloqueio e convite SHALL operar via API, com as mutações refletidas imediatamente (a listagem é rebuscada). Filtros, busca, paginação e KPIs SHALL ser processados **no servidor** sobre o conjunto filtrado; a exportação SHALL buscar o conjunto filtrado completo pela API. Os filtros SHALL continuar sendo descartados na recarga.

#### Scenario: Carga inicial mostra os usuários do banco
- **WHEN** o navegador abre `/admin/gestao-usuarios` com sessão ativa
- **THEN** um estado de carregamento é exibido enquanto `GET /api/usuarios` responde, e em seguida a tabela exibe a primeira página de usuários persistidos no banco (ex.: o administrador provisionado e as contas criadas por convite)

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição de listagem falha (rede, banco ou sessão expirada sem refresh)
- **THEN** um toast de erro informa a falha e a tabela permanece em estado vazio/erro, sem exibir a base de demonstração antiga

#### Scenario: Recarga rebusca o banco
- **WHEN** a página é recarregada após criar, editar, importar, excluir, bloquear ou convidar
- **THEN** a listagem vem da API com os dados persistentes (nada volta a uma base demo)

#### Scenario: Filtro e exportação não fazem requisição
- **WHEN** o usuário aplica filtros, busca na tabela (com debounce), muda de página ou gera CSV/PDF
- **THEN** a aplicação consulta a API uma vez por interação (filtro/página) — sem uma requisição por tecla — e a exportação obtém o conjunto filtrado completo para montar o arquivo

#### Scenario: Exportação busca o conjunto completo
- **WHEN** o usuário gera CSV ou PDF
- **THEN** a aplicação obtém da API o conjunto filtrado completo (todas as páginas) e gera o arquivo sobre ele
