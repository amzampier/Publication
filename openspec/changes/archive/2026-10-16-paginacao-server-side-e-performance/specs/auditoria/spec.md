# Spec Delta

## MODIFIED Requirements

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

### Requirement: A exportação gera arquivos sobre os registros filtrados
O sistema SHALL oferecer no cabeçalho o menu "Exportar" com as opções "Exportar em CSV" (download dos registros que passam pelos filtros ativos, com cabeçalhos) e "Download em PDF" (gera e baixa o relatório `auditoria.pdf` em folha paisagem sobre os mesmos registros), sem abrir o diálogo de impressão do navegador. Como a listagem é paginada, a exportação SHALL obter da API o conjunto filtrado **completo** (todas as páginas) antes de gerar o arquivo.

#### Scenario: Exportar em CSV respeita os filtros
- **WHEN** há filtros ativos e o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo CSV é baixado contendo exatamente os registros filtrados (conjunto completo, não apenas a página), com linha de cabeçalho

#### Scenario: Download em PDF gera o relatório estruturado
- **WHEN** o usuário escolhe "Download em PDF"
- **THEN** o arquivo `auditoria.pdf` é baixado em folha paisagem com cabeçalho contendo a logo de login configurada (quando houver) à esquerda e o título "Relatório de Gestão de Auditoria" à direita, os filtros vigentes logo abaixo do título, uma linha divisória, as colunas data/hora, usuário, ação, recurso, detalhes e IP com os registros filtrados, e paginação com a indicação da página

#### Scenario: Sem logo de login configurada o PDF sai só com o título
- **WHEN** a logo de login está como "Marca padrão" ou é apenas um caminho sem arquivo disponível
- **THEN** o cabeçalho do PDF é gerado sem a imagem, mantendo título, filtros, colunas e paginação

#### Scenario: O PDF é baixado sem diálogo de impressão
- **WHEN** o download em PDF é acionado
- **THEN** `window.print()` não é chamado e o arquivo é salvo diretamente no dispositivo

### Requirement: A página carrega os registros pela API com carregamento no F5 e toast de erro
O sistema SHALL carregar os registros da trilha a partir de `GET /api/auditoria` na montagem da página `/admin/auditoria`, exibindo um overlay `UiLoading` (mensagem "Carregando auditoria…") enquanto a requisição estiver em voo — no mesmo padrão de Meu Perfil e Configurações Globais, sem renderizar conteúdo parcial — e um toast de erro caso a carga falhe, mantendo a tabela em estado vazio e **nunca** exibindo a base de demonstração antiga como se fosse persistida. A listagem SHALL ser **paginada no servidor**: a tabela opera em modo servidor, cada mudança de página/tamanho/ordenação/busca (com debounce) SHALL consultar a API, e a recarga da página SHALL rebuscar pela API. Os filtros estruturais SHALL permanecer em estado de sessão (preservados na navegação interna, descartados no F5).

#### Scenario: Carga inicial mostra os registros do banco
- **WHEN** o navegador abre `/admin/auditoria` com sessão válida
- **THEN** o overlay de carregamento é exibido enquanto `GET /api/auditoria` responde e, em seguida, a tabela exibe a primeira página de registros persistidos (seed da migration + operações reais registradas), ordenados do mais recente para o mais antigo

#### Scenario: Loading no F5 sem conteúdo parcial
- **WHEN** o usuário recarrega a página (F5) com o `GET /api/auditoria` em voo
- **THEN** apenas o overlay `UiLoading` com a mensagem "Carregando auditoria…" aparece na área de conteúdo — a tabela, os KPIs e os modais não são renderizados até a resposta

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição `GET /api/auditoria` falha (rede ou banco indisponível)
- **THEN** um toast de erro informa a falha de carregamento e a tabela permanece em estado vazio/erro, sem exibir a base de demonstração como se fosse persistida

#### Scenario: Paginar consulta o servidor
- **WHEN** o usuário muda de página, tamanho, ordenação ou digita na busca (com debounce)
- **THEN** a página corrente é rebuscada pela API (nenhum slicing local sobre uma página única)

#### Scenario: Recarga rebusca pela API e descarta os filtros
- **WHEN** a página é recarregada após aplicar filtros ou após operações de escrita em outros módulos
- **THEN** os filtros voltam ao estado vazio e o `GET /api/auditoria` devolve o conjunto atualizado do banco (o que foi gravado persiste; a demo antiga não retorna)

### Requirement: A API de auditoria filtra no servidor e serve as opções dos selects
O sistema SHALL expor `GET /api/auditoria` sob a sessão autenticada (sem sessão → `401`), aceitando os filtros estruturais como parâmetros de consulta opcionais (`dataInicial`, `dataFinal` em `yyyy-mm-dd`, `usuario`, `acao`, `recurso` — parâmetro ausente ou vazio equivale a "todos") **e a paginação** (`pagina`, `porPagina`), filtrando e paginando no servidor (datas como janela inclusiva do dia local) e devolvendo `{ registros, total, kpis, opcoes, pagina, porPagina }` — `registros` com os campos do registro (data/hora, usuário id+nome, ação, recurso, detalhes e IP) da **página corrente** ordenados do mais recente para o mais antigo; `total` com a contagem do conjunto filtrado; `kpis` com "Registros", "Usuários distintos" e "Última atividade" calculados sobre o conjunto filtrado (o rótulo de período fica no cliente); e `opcoes` com as listas distintas de usuários e recursos do conjunto **não** filtrado (as opções dos `UiSelect` do modal de filtros não podem sumir em razão de um filtro aplicado). A API SHALL aceitar ainda um modo **exportação** que devolve o conjunto filtrado completo (bounded por um teto de segurança) para CSV/PDF.

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
