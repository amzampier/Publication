# Auditoria Specification

## Purpose

Definir o comportamento da página de Gestão de Auditoria — consulta dos registros de operações persistidos no banco e servidos pela API, com KPIs, filtros estruturais, tabela paginada, detalhe do registro e exportação CSV/PDF — e o contrato da trilha (registro de escrita via `registrarAuditoria`), para que a Área Administrativa ofereça rastreabilidade das ações conforme o modelo descrito no `docs/02`.

## Requirements

### Requirement: A página de auditoria existe em /admin/auditoria dentro do shell administrativo
O sistema SHALL servir a Gestão de Auditoria em `/admin/auditoria`, renderizada com o shell da Área Administrativa (header + sidebar), exibindo o título "Gestão de Auditoria" com identidade do módulo.

#### Scenario: Rota renderiza com shell
- **WHEN** o visitante abre `/admin/auditoria`
- **THEN** a página exibe o header e a sidebar da Área Administrativa e, na área de conteúdo, o título "Gestão de Auditoria"

#### Scenario: Acesso direto por URL
- **WHEN** a rota é carregada diretamente pela URL (recarga)
- **THEN** a página renderiza com os registros persistidos servidos pela API e sem erro

### Requirement: Os atalhos de navegação apontam para a página
O sistema SHALL declarar a rota `/admin/auditoria` no item "Gestão de Auditoria" da sidebar e no mesmo item do menu da conta, de modo que ambos naviguem para a página e o item da sidebar correspondente apareça como ativo.

#### Scenario: Item da sidebar navega e fica ativo
- **WHEN** o usuário clica em "Administração > Gestão de Auditoria" na sidebar
- **THEN** o navegador navega para `/admin/auditoria` e aquele item aparece como ativo

#### Scenario: Item do menu da conta navega
- **WHEN** o usuário clica em "Gestão de Auditoria" no menu da conta
- **THEN** o navegador navega para `/admin/auditoria`

### Requirement: Os KPIs derivam do conjunto de registros filtrado
O sistema SHALL exibir no topo da página os KPIs "Registros" (contagem do conjunto filtrado), "Período" (rótulo do período vigente), "Usuários distintos" e "Última atividade" (data/hora do registro mais recente do conjunto), calculados **no servidor** sobre o conjunto filtrado e devolvidos pela API, de modo que reflitam o banco inteiro (não apenas a página corrente) e sejam recalculados quando os filtros mudam.

#### Scenario: Sem filtros ativos
- **WHEN** a página é aberta sem nenhum filtro aplicado
- **THEN** "Registros" mostra a contagem total do conjunto (calculada no servidor) e "Última atividade" corresponde ao registro mais recente

#### Scenario: Filtro de ação recalcula os KPIs
- **WHEN** o usuário aplica o filtro de ação "Inclusão"
- **THEN** "Registros", "Usuários distintos" e "Última atividade" passam a considerar apenas os registros de Inclusão, recalculados no servidor

#### Scenario: Período vigente vira rótulo
- **WHEN** as datas inicial e final estão preenchidas (ex.: 01/10/2026 a 02/10/2026)
- **THEN** o KPI "Período" exibe o intervalo em formato `dd/mm` (ex.: "01/10 – 02/10") e, sem datas, exibe "Tudo"

### Requirement: Os filtros estruturais vivem no modal do botão Filtros
O sistema SHALL oferecer o botão "Filtros" na toolbar da tabela de auditoria (à direita do campo de busca, recurso do `UiDataTable` ativado por `showFilters`), abrindo um `UiModal` — com ícone no cabeçalho, como os demais `UiModal` do kit — cujo corpo é organizado em três sessões `UiModalSection`: **"Período"**, contendo os campos de **data inicial** e **data final** (controles `UiDatePicker`); **"Usuário"**, contendo um controle de seleção única `UiSelect` para o filtro de **usuário**; e **"Ação e Recurso"**, contendo dois controles de seleção única `UiSelect` para os filtros de **ação** e **recurso** — em todos, o estado vazio equivale a "todos" (placeholder "Todos/Todas") e a limpeza restaura "todos"; além das ações "Limpar Filtros" (à esquerda do rodapé), "Cancelar" e "Aplicar" (à direita), com o botão da toolbar indicando a quantidade de filtros ativos por badge (`filtersCount`).

#### Scenario: Modal com os cinco campos de filtro
- **WHEN** o usuário aciona o botão "Filtros" na toolbar da tabela
- **THEN** um modal abre com os campos de data inicial, data final, usuário, ação e recurso e as ações "Limpar Filtros", "Cancelar" e "Aplicar"

#### Scenario: Corpo do modal em três sessões
- **WHEN** o modal de filtros é aberto
- **THEN** o corpo exibe três containers de sessão sobre o fundo do modal: "Período" com as datas inicial e final, "Usuário" com um select de usuário e "Ação e Recurso" com os selects de ação e recurso

#### Scenario: Selecionar em um select e aplicar filtra
- **WHEN** o usuário escolhe uma ação em um dos selects e clica "Aplicar"
- **THEN** a tabela e os KPIs passam a mostrar apenas os registros que atendem ao filtro e o botão "Filtros" exibe a contagem de filtros ativos

#### Scenario: Aplicar filtra a tabela e os KPIs
- **WHEN** o usuário escolhe filtros (datas e/ou seleções) e clica "Aplicar"
- **THEN** a tabela e os KPIs passam a mostrar apenas os registros que atendem a todos os filtros e o botão "Filtros" exibe a contagem de filtros ativos

#### Scenario: Limpar restaura o estado inicial
- **WHEN** o usuário clica "Limpar Filtros" com filtros ativos
- **THEN** a tabela, os KPIs e a contagem do botão voltam ao estado sem filtros

#### Scenario: Cancelar descarta o rascunho
- **WHEN** o usuário altera campos no modal e clica "Cancelar"
- **THEN** o modal fecha sem aplicar as alterações e os filtros vigentes permanecem inalterados

#### Scenario: Escape fecha primeiro o dropdown aberto
- **WHEN** um dos selects (ou calendários) do modal está com o popup aberto e o usuário pressiona `Escape`
- **THEN** apenas o popup fecha, o modal permanece aberto e o rascunho em edição é preservado; um segundo `Escape`, com nenhum popup aberto, fecha o modal

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

### Requirement: O detalhe do registro abre por controle na coluna Ações
O sistema SHALL oferecer na coluna "Ações" da tabela um controle acessível (com texto alternativo/tooltip) que abre um `UiModal` exibindo todos os campos do registro selecionado dentro de uma sessão `UiModalSection` intitulada **"Dados do Registro"**, com fechamento pelos controles do modal.

#### Scenario: Abrir o detalhe
- **WHEN** o usuário aciona o controle de ver detalhes na linha de um registro
- **THEN** um modal abre com data/hora, usuário, ação, recurso, IP e a descrição completa dos detalhes daquele registro, apresentados em um container de sessão "Dados do Registro"

#### Scenario: Fechar o detalhe
- **WHEN** o usuário fecha o modal (botão, X ou Escape)
- **THEN** o modal fecha e a tabela permanece no mesmo estado

### Requirement: A exportação gera arquivos sobre os registros filtrados
O sistema SHALL oferecer no cabeçalho o menu "Exportar" com as opções "Exportar em CSV" (download dos registros que passam pelos filtros ativos, com cabeçalhos) e "Download em PDF" (gera e baixa o relatório `auditoria.pdf` em folha paisagem sobre os mesmos registros), sem abrir o diálogo de impressão do navegador. Como a listagem é paginada, a exportação SHALL obter da API o conjunto filtrado **completo** (todas as páginas) antes de gerar o arquivo.

#### Scenario: Exportar em CSV respeita os filtros
- **WHEN** há filtros ativos e o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo CSV é baixado contendo exatamente os registros filtrados, com linha de cabeçalho

#### Scenario: Download em PDF gera o relatório estruturado
- **WHEN** o usuário escolhe "Download em PDF"
- **THEN** o arquivo `auditoria.pdf` é baixado em folha paisagem com cabeçalho contendo a logo de login configurada (quando houver) à esquerda e o título "Relatório de Gestão de Auditoria" à direita, os filtros vigentes logo abaixo do título, uma linha divisória, as colunas data/hora, usuário, ação, recurso, detalhes e IP com os registros filtrados, e paginação com a indicação da página

#### Scenario: Sem logo de login configurada o PDF sai só com o título
- **WHEN** a logo de login está como "Marca padrão" ou é apenas um caminho sem arquivo disponível
- **THEN** o cabeçalho do PDF é gerado sem a imagem, mantendo título, filtros, colunas e paginação

#### Scenario: O PDF é baixado sem diálogo de impressão
- **WHEN** o download em PDF é acionado
- **THEN** `window.print()` não é chamado e o arquivo é salvo diretamente no dispositivo

### Requirement: O rodapé informa a política de retenção com acesso às Configurações
O sistema SHALL exibir abaixo da tabela uma nota de que os registros estão sujeitos à política de retenção, com caminho de navegação para Configurações Globais.

#### Scenario: Nota e navegação
- **WHEN** a página é exibida
- **THEN** a nota sobre a política de retenção aparece sob a tabela e seu controle leva o usuário a `/admin/configuracoes-globais`

### Requirement: A página carrega os registros pela API com carregamento no F5 e toast de erro
O sistema SHALL carregar os registros da trilha a partir de `GET /api/auditoria` na montagem da página `/admin/auditoria`, exibindo um overlay `UiLoading` (mensagem "Carregando auditoria…") enquanto a requisição estiver em voo — no mesmo padrão de Meu Perfil e Configurações Globais, sem renderizar conteúdo parcial — e um toast de erro caso a carga falhe, mantendo a tabela em estado vazio, **zerando também os KPIs, o total e as opções de filtro** (nenhum dado da carga anterior permanece) e **nunca** exibindo a base de demonstração antiga como se fosse persistida. A listagem SHALL ser **paginada no servidor**: a tabela opera em modo servidor, cada mudança de página/tamanho/ordenação/busca (com debounce) SHALL consultar a API, e a recarga da página SHALL rebuscar pela API. Os filtros estruturais SHALL permanecer em estado de sessão (preservados na navegação interna, descartados no F5).

#### Scenario: Carga inicial mostra os registros do banco
- **WHEN** o navegador abre `/admin/auditoria` com sessão válida
- **THEN** o overlay de carregamento é exibido enquanto `GET /api/auditoria` responde e, em seguida, a tabela exibe a primeira página dos registros **reais** persistidos (operações de escrita e eventos de autenticação registrados), ordenados do mais recente para o mais antigo; sem operações registradas, a tabela exibe o estado vazio

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

### Requirement: A API de auditoria filtra no servidor e serve as opções dos selects
O sistema SHALL expor `GET /api/auditoria` sob a sessão autenticada (sem sessão → `401`), aceitando os filtros estruturais como parâmetros de consulta opcionais (`dataInicial`, `dataFinal` em `yyyy-mm-dd`, `usuario`, `acao`, `recurso` — parâmetro ausente ou vazio equivale a "todos") **e a paginação** (`pagina`, `porPagina`), filtrando e paginando no servidor (datas como janela inclusiva do dia local) e devolvendo `{ registros, total, kpis, opcoes, pagina, porPagina }` — `registros` com os campos do registro (data/hora, usuário id+nome, ação, recurso, detalhes e IP) da **página corrente** ordenados do mais recente para o mais antigo; `total` com a contagem do conjunto filtrado; `kpis` com "Registros", "Usuários distintos" e "Última atividade" calculados sobre o conjunto filtrado; e `opcoes` com as listas distintas de usuários e recursos do conjunto **não** filtrado (as opções dos `UiSelect` do modal de filtros não podem sumir em razão de um filtro aplicado). A API SHALL aceitar ainda um modo **exportação** que devolve o conjunto filtrado completo (bounded por um teto de segurança) para CSV/PDF.

#### Scenario: Acesso sem sessão é negado
- **WHEN** `GET /api/auditoria` é chamado sem cookie de sessão válido
- **THEN** a API responde `401` e nenhum registro é retornado

#### Scenario: Filtros estruturais chegam por query param
- **WHEN** a chamada é feita com `?acao=Inclusão&pagina=2&porPagina=20`
- **THEN** `registros` contém apenas a 2ª página de 20 registros de Inclusão, em ordem decrescente de data/hora, e `total`/`kpis` refletem o conjunto filtrado inteiro

#### Scenario: Sem parâmetros devolve o conjunto completo
- **WHEN** a chamada é feita sem nenhum parâmetro de consulta
- **THEN** `registros` contém a primeira página dos registros da trilha (dentro da política de retenção) ordenados do mais recente para o mais antigo, com `total` do conjunto

#### Scenario: Opções derivam do conjunto não filtrado
- **WHEN** a chamada é feita com um filtro de usuário aplicado
- **THEN** `registros`/`total` refletem o filtro, enquanto `opcoes.usuarios` e `opcoes.recursos` seguem listando todos os usuários e recursos distintos da trilha

#### Scenario: Ação desconhecida não quebra a consulta
- **WHEN** o parâmetro `acao` contém valor fora dos cinco tipos (Inclusão, Alteração, Exclusão, Homologação e Acesso)
- **THEN** a API responde normalmente e o filtro por ação resulta em conjunto vazio (nenhum registro tem aquela ação)

### Requirement: As operações de escrita registram a trilha de auditoria
O sistema SHALL registrar em `auditoria` um evento, via helper `registrarAuditoria`, após cada gravação bem-sucedida nas rotas administrativas de escrita — criação, alteração, alteração de situação, exclusão, importação, edição do próprio perfil, gestão de perfis (incluindo matriz de permissões e cópia), configurações globais, upload de logomarca, convite de usuário e liberação de bloqueio —, preenchendo o tipo da operação (Inclusão, Alteração, Exclusão ou Homologação), o recurso afetado, o identificador da entidade quando houver, o usuário da sessão (id, nome e perfil), o IP do cliente e os detalhes textuais da operação. A falha na gravação do registro de auditoria SHALL ser isolada: nunca interrompe nem altera a resposta da operação principal. Os eventos de autenticação não participam deste requirement — registram como **Acesso** no requirement próprio abaixo (e seguem também no log de segurança da aba Segurança de Configurações Globais).

#### Scenario: Criação de usuário gera registro de Inclusão
- **WHEN** `POST /api/usuarios` completa com sucesso
- **THEN** um registro de Inclusão do recurso "Usuários" aparece na trilha com o usuário da sessão, o IP da requisição e detalhes descrevendo a criação

#### Scenario: Exclusão e alteração geram registros próprios
- **WHEN** `DELETE /api/usuarios/:id` ou `PUT /api/usuarios/:id` completam com sucesso
- **THEN** a trilha recebe, respectivamente, um registro de Exclusão e um de Alteração do recurso "Usuários", com o identificador do registro afetado nos detalhes

#### Scenario: Gravação falhada não gera registro
- **WHEN** uma operação de escrita falha (validação, conflito ou erro de banco) e não grava nada
- **THEN** nenhum registro de auditoria é inserido para aquela operação

#### Scenario: Falha no log de auditoria não derruba a operação principal
- **WHEN** a gravação do registro de auditoria falha (banco indisponível, constraint, timeout)
- **THEN** a resposta da operação administrativa permanece a de sucesso e a falha é apenas logada no console do servidor

#### Scenario: Recurso e tipo refletem a operação
- **WHEN** qualquer rota de escrita auditada completa
- **THEN** o tipo gravado é um dos tipos de escrita (Inclusão, Alteração, Exclusão ou Homologação) e o recurso identifica o módulo afetado (ex.: "Usuários", "Perfis de Acesso", "Configurações Globais", "Logomarcas", "Rate Limits"), de modo que o badge de ação da tabela distingue visualmente cada tipo

### Requirement: Os eventos de autenticação registram na trilha como Acesso
O sistema SHALL registrar na trilha `auditoria`, com tipo **Acesso** e recurso **"Autenticação"**, cada evento das rotas de autenticação: **login** bem-sucedido (com a conta autenticada — id, nome e perfil —, identificada explicitamente pois os cookies pertencem à resposta), **logout** (somente quando há sessão identificada no request — o logout idempotente sem cookie não gera evento), **troca de senha** (do usuário autenticado) e **solicitação de recuperação de senha** (com o e-mail alvo, em qualquer um dos dois caminhos — conta ativa ou não — preservada a resposta genérica anti-enumeração). Cada registro SHALL conter o IP do cliente e detalhes textuais do evento. **Tentativas de credencial inválidas NÃO geram evento Acesso na trilha** — elas seguem exclusivamente no log de segurança (`seguranca_eventos_login`), que permanece a fonte da aba Segurança.

#### Scenario: Login registra Acesso com a conta correta
- **WHEN** `POST /api/auth/login` autentica com sucesso
- **THEN** um registro de Acesso do recurso "Autenticação" entra na trilha com `usuario_id` e nome da conta autenticada (nunca "Desconhecido"), o IP e detalhes informando o login e o perfil

#### Scenario: Tentativa inválida não gera Acesso
- **WHEN** `POST /api/auth/login` falha com credencial inválida (401)
- **THEN** nenhum registro de Acesso é inserido na trilha (o evento fica no log de segurança como senha inválida)

#### Scenario: Logout registra Acesso quando há sessão
- **WHEN** `POST /api/auth/logout` é chamado com cookies de sessão válidos
- **THEN** um registro de Acesso com detalhes de encerramento de sessão entra na trilha com o usuário identificado; chamado sem nenhum cookie, o logout idempotente não insere evento

#### Scenario: Troca de senha registra Acesso
- **WHEN** `POST /api/auth/trocar-senha` troca a senha do autenticado
- **THEN** um registro de Acesso com detalhes da alteração de senha entra na trilha com o usuário autenticado

#### Scenario: Recuperação de senha registra nos dois caminhos
- **WHEN** `POST /api/auth/esqueci-senha` é chamado com e-mail de conta ativa e depois com e-mail inexistente
- **THEN** ambos os casos inserem um registro de Acesso identificando o e-mail alvo, e a resposta HTTP continua sendo o mesmo `{ ok: true }` genérico nos dois casos

### Requirement: O IP registrado na trilha é o da conexão, salvo proxy confiável
O sistema SHALL registrar na trilha de auditoria o IP real da conexão do cliente; o cabeçalho
`X-Forwarded-For` SHALL ser considerado **somente** quando a implantação declarar uma lista de
proxies confiáveis (por configuração), de modo que o IP da trilha não possa ser forjado por um
cliente arbitrário.

#### Scenario: IP da conexão é o registrado sem proxy confiável
- **WHEN** uma operação de escrita é registrada sem proxies confiáveis configurados e a requisição traz um `X-Forwarded-For` forjado
- **THEN** a trilha registra o IP da conexão, não o valor do cabeçalho

### Requirement: A exportação de auditoria informa falha ao usuário
Ao exportar a trilha (CSV ou PDF), se a consulta ou a geração do arquivo falhar, o sistema SHALL exibir um toast de erro, nunca falhando em silêncio.

#### Scenario: Falha na exportação exibe erro
- **WHEN** o usuário aciona uma opção de "Exportar" e a consulta/geração falha
- **THEN** um toast de erro é exibido informando que a exportação não foi concluída

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário na Gestão de Auditoria SHALL ser genéricas, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha de carga sem detalhe interno
- **WHEN** a carga dos registros falha
- **THEN** o toast informa apenas que não foi possível carregar os dados, sem citar banco

### Requirement: Filtro de data inválida é recusado com 400
O filtro de data da auditoria SHALL aceitar apenas datas reais (`yyyy-mm-dd` com mês 1–12 e dia válido); uma data presente porém inválida SHALL ser recusada com `400`, sem atingir o banco.

#### Scenario: Data inexistente é recusada
- **WHEN** a consulta traz uma data como `2026-13-99` (formato correto, data inexistente)
- **THEN** a API responde `400` e nenhuma consulta é executada

### Requirement: O detalhe do registro exibe o identificador da entidade
A API da auditoria SHALL expor o identificador da entidade afetada (`entidade_id`) e o detalhe do registro SHALL exibi-lo quando presente, ampliando a rastreabilidade.

#### Scenario: Detalhe mostra a entidade afetada
- **WHEN** um registro com `entidade_id` preenchido tem seu detalhe aberto
- **THEN** o identificador da entidade é exibido no detalhe

### Requirement: A trilha de auditoria nasce vazia em um banco recém-provisionado
O provisionamento do banco SHALL NOT inserir qualquer registro de demonstração na tabela `auditoria`: um banco recém-criado SHALL conter zero registros na trilha até que operações reais as gravem. Registros com identificadores de seed (`log-seed-%`) SHALL NOT existir, e uma migração de provisionamento SHALL remover esses resquícios de bancos já existentes sem excluir nenhum registro real (operações de escrita ou eventos de autenticação).

#### Scenario: Banco novo nasce sem registros de seed
- **WHEN** o servidor sobe contra um banco sem tabelas e todas as migrations são aplicadas
- **THEN** `SELECT COUNT(*) FROM auditoria` retorna `0` e nenhum registro `log-seed-%` existe; a primeira operação autenticada (o login, gravado como `Acesso`) é o único conteúdo da trilha

#### Scenario: Bancos existentes com seed são reconciliados
- **WHEN** um banco já provisionado contém registros `log-seed-%` e recebe as migrations pendentes
- **THEN** apenas esses registros de seed são removidos, e todos os registros reais da trilha permanecem intactos

#### Scenario: Operações reais continuam registrando
- **WHEN** uma rota administrativa de escrita ou um evento de autenticação é concluído com sucesso após a limpeza
- **THEN** a trilha recebe o registro correspondente, agora o único conteúdo da tabela
