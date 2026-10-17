# Spec Delta

## MODIFIED Requirements

### Requirement: A tabela lista os registros da trilha de auditoria com paginação, ordenação e busca
O sistema SHALL exibir os registros em `UiDataTable` com colunas de data/hora, usuário, ação (badge), recurso, detalhes e IP, ordenados do registro mais recente para o mais antigo, com paginação e busca textual do componente, e badge de ação distinguível por tipo de operação (Inclusão, Alteração, Exclusão, Homologação e **Acesso** — este último em variante neutra) — cabendo as sete colunas (seis de dados + Ações) **sem rolagem horizontal** na área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com sidebar expandida), inclusive após trocar a quantidade de registros exibidos por página. Em modo servidor, a **ordenação SHALL ser aplicada pelo servidor**: acionar uma coluna ordenável SHALL enviar a ordenação (coluna + direção) à API, que reordena o conjunto antes de paginar, sobre um conjunto **whitelisted** de colunas; uma coluna sem ordenação suportada SHALL ser ignorada, mantendo a ordenação padrão (mais recente primeiro).

#### Scenario: Colunas e ordenação
- **WHEN** a página é aberta
- **THEN** a tabela mostra as colunas data/hora, usuário, ação, recurso, detalhes e IP, com o registro mais recente no topo e paginação funcionando

#### Scenario: Ordenar consulta o servidor
- **WHEN** o usuário aciona o cabeçalho de uma coluna ordenável (ex.: Usuário)
- **THEN** a tabela consulta a API com a coluna e a direção escolhidas e exibe o conjunto reordenado pelo servidor (a paginação acompanha o novo critério), sem reordenar apenas as linhas da página corrente no cliente

#### Scenario: Badge distinto por ação
- **WHEN** os registros de Inclusão, Alteração, Exclusão, Homologação e Acesso são exibidos
- **THEN** cada tipo de ação aparece com badge de variante própria, visualmente distinguível (Acesso em variante neutra)

#### Scenario: Busca textual
- **WHEN** o usuário digita texto na busca da tabela
- **THEN** apenas os registros que contêm o texto permanecem listados

#### Scenario: Trocar a quantidade de linhas não abre rolagem horizontal
- **WHEN** o usuário altera "Linhas por página" (ex.: de 5 para 20 ou 50) numa janela ≥ ~1280px com sidebar expandida
- **THEN** a área da tabela ganha linhas sem exibir barra de rolagem horizontal, com as sete colunas visíveis

#### Scenario: Filtro de ação oferece os cinco tipos
- **WHEN** o modal de filtros é aberto
- **THEN** o select de Ação oferece Inclusão, Alteração, Exclusão, Homologação e Acesso como opções

### Requirement: A página carrega os registros pela API com carregamento no F5 e toast de erro
O sistema SHALL carregar os registros da trilha a partir de `GET /api/auditoria` na montagem da página `/admin/auditoria`, exibindo um overlay `UiLoading` (mensagem "Carregando auditoria…") enquanto a requisição estiver em voo — no mesmo padrão de Meu Perfil e Configurações Globais, sem renderizar conteúdo parcial — e um toast de erro caso a carga falhe, mantendo a tabela em estado vazio, **zerando também os KPIs, o total e as opções de filtro** (nenhum dado da carga anterior permanece) e **nunca** exibindo a base de demonstração antiga como se fosse persistida. A listagem SHALL ser **paginada no servidor**: a tabela opera em modo servidor, cada mudança de página/tamanho/ordenação/busca (com debounce) SHALL consultar a API, e a recarga da página SHALL rebuscar pela API. Os filtros estruturais SHALL permanecer em estado de sessão (preservados na navegação interna, descartados no F5).

#### Scenario: Carga inicial mostra os registros do banco
- **WHEN** o navegador abre `/admin/auditoria` com sessão válida
- **THEN** o overlay de carregamento é exibido enquanto `GET /api/auditoria` responde e, em seguida, a tabela exibe a primeira página de registros persistidos (seed da migration + operações reais registradas), ordenados do mais recente para o mais antigo

#### Scenario: Loading no F5 sem conteúdo parcial
- **WHEN** o usuário recarrega a página (F5) com o `GET /api/auditoria` em voo
- **THEN** apenas o overlay `UiLoading` com a mensagem "Carregando auditoria…" aparece na área de conteúdo — a tabela, os KPIs e os modais não são renderizados até a resposta

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição `GET /api/auditoria` falha (rede ou banco indisponível)
- **THEN** um toast de erro informa a falha de carregamento, a tabela fica vazia e os KPIs, o total e as opções de filtro são zerados, sem exibir dados da carga anterior nem a base de demonstração como se fosse persistida

#### Scenario: Paginar consulta o servidor
- **WHEN** o usuário muda de página, tamanho, ordenação ou digita na busca (com debounce)
- **THEN** a página corrente é rebuscada pela API (nenhum slicing local sobre uma página única)

#### Scenario: Recarga rebusca pela API e descarta os filtros
- **WHEN** a página é recarregada após aplicar filtros ou após operações de escrita em outros módulos
- **THEN** os filtros voltam ao estado vazio e o `GET /api/auditoria` devolve o conjunto atualizado do banco (o que foi gravado persiste; a demo antiga não retorna)