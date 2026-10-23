# Spec Delta

## Purpose

Consolidar, em uma única tela administrativa, os indicadores do ciclo editorial — publicações,
chamadas, classificação e fluxo da esteira — para apoiar decisões de liberação, priorização e
qualidade das entregas.

## ADDED Requirements

### Requirement: O Painel Executivo é a tela inicial da Área Administrativa

O sistema SHALL renderizar o **Painel Executivo** em `/admin`, dentro do shell administrativo, com
título, subtítulo, seletor de ano e ação de atualizar. O item raiz **Painel Executivo** da sidebar
SHALL navegar para `/admin` e aparecer como ativo (`aria-current="page"`) na rota. O seletor SHALL
listar apenas anos com ao menos uma chamada lançada (`entregas_itens.data_lancamento`), em ordem
decrescente; o ano inicial SHALL ser o corrente quando houver chamadas nele, senão o mais recente
com chamadas. Sem anos disponíveis, o seletor SHALL ser omitido e a tela SHALL exibir o estado vazio.
O painel SHALL ser somente leitura e acessível a qualquer sessão autenticada, sem criar novo módulo
RBAC.

#### Scenario: Abrir o painel pela sidebar

- **WHEN** o usuário autenticado clica em "Painel Executivo" na sidebar
- **THEN** o navegador vai para `/admin`, o painel é renderizado dentro do shell e o item raiz aparece como ativo

#### Scenario: Acesso por URL direta

- **WHEN** o usuário autenticado abre `/admin` diretamente
- **THEN** o painel é exibido com o ano corrente quando ele tem chamadas; caso contrário, com o mais recente com chamadas

#### Scenario: Sem sessão

- **WHEN** um visitante sem sessão abre `/admin` ou chama a API do painel
- **THEN** ele é redirecionado ao login (página) ou recebe `401` (API), sem dados do painel

#### Scenario: Ano sem chamadas não aparece no seletor

- **WHEN** o seletor de ano é exibido
- **THEN** ele lista apenas os anos que possuem ao menos uma chamada lançada, sem anos vazios anteriores ou posteriores

### Requirement: O painel apresenta os KPIs do ciclo editorial

O painel SHALL exibir, para o período selecionado, os KPIs: **Releases publicadas**, **Chamadas
lançadas**, **Chamadas liberadas**, **% do fluxo concluído**, **Lead time médio** e **Taxa de
recusa**. As definições SHALL ser:

- **Releases publicadas:** Releases Week com `status = Publicado`, agrupadas por
  `YEAR(data_publicacao)`/`MONTH(data_publicacao)`; releases arquivadas SHALL contar no histórico.
- **Chamadas lançadas:** chamadas com `data_lancamento` no período.
- **Chamadas liberadas:** chamadas com `data_liberacao` no período e não posterior a hoje.
- **% do fluxo concluído:** `(Aprovado + Publicar) / total do ciclo ativo`, com o ciclo ativo
  definido como as chamadas com ao menos um vínculo não arquivado, excluindo as em `Publicar` cujo
  pai já está `Publicado`.
- **Lead time médio:** média de `data_liberacao - data_lancamento` em dias, apenas para chamadas
  liberadas.
- **Taxa de recusa:** `Recusado / total do ciclo ativo`.

O percentual do fluxo e a taxa de recusa usam o **ciclo ativo global** (não filtrado pelo ano), a
mesma regra da tela da Esteira; o seletor de ano afeta apenas publicações, chamadas e dimensões.

#### Scenario: KPI de releases publicadas

- **WHEN** existem Releases Week com status `Publicado` no ano selecionado
- **THEN** o KPI exibe a contagem dessas releases, incluindo as arquivadas

#### Scenario: KPI de chamadas liberadas não conta o futuro

- **WHEN** uma chamada aprovada tem `data_liberacao` posterior a hoje
- **THEN** ela não entra no KPI de chamadas liberadas, embora permaneça no fluxo

#### Scenario: Fluxo sem chamadas

- **WHEN** não há chamadas no ciclo ativo
- **THEN** o percentual do fluxo e a taxa de recusa exibem `0%` (ou estado vazio), sem divisão por zero

### Requirement: O painel exibe a série mensal e anual de publicações

O painel SHALL exibir um gráfico de publicações com alternância **Mensal/Anual**. No modo mensal, o
gráfico SHALL mostrar os 12 meses do ano selecionado com as Releases Week empilhadas por status
(`Aberta`, `Em Revisão`, `Aprovado`, `Publicado`). No modo anual, o gráfico SHALL mostrar os últimos
cinco anos com a contagem de releases publicadas por ano. O eixo temporal SHALL usar
`data_publicacao` (não o rótulo textual `mes`). Meses sem dados SHALL aparecer com zero. O gráfico
SHALL ter legenda, valores acessíveis e estado vazio quando não houver publicações no período.

#### Scenario: Série mensal com meses vazios

- **WHEN** o ano selecionado tem releases em apenas dois meses
- **THEN** o gráfico mensal exibe os 12 meses, com zero nos demais e a legenda por status

#### Scenario: Alternar para anual

- **WHEN** o usuário seleciona o modo "Anual"
- **THEN** o gráfico passa a exibir a contagem de releases publicadas nos últimos cinco anos

#### Scenario: Ano sem publicações

- **WHEN** não há Releases Week no ano selecionado
- **THEN** o gráfico exibe o estado vazio sem quebrar o layout

### Requirement: O painel exibe chamadas lançadas e liberadas ao longo do tempo

O painel SHALL exibir uma série temporal de **chamadas lançadas** (por `data_lancamento`) e
**chamadas liberadas** (por `data_liberacao`, limitada a hoje), no mesmo eixo mensal do ano
selecionado, com legenda e valores acessíveis. A série SHALL deixar explícito que a data de liberação
é herdada do conteúdo pai e pode representar uma liberação prevista.

#### Scenario: Duas séries no mesmo eixo

- **WHEN** existem chamadas lançadas e liberadas no período
- **THEN** o gráfico exibe as duas séries no mesmo eixo mensal, distinguíveis por cor e legenda

#### Scenario: Liberação futura

- **WHEN** uma chamada tem `data_liberacao` em um mês futuro
- **THEN** ela aparece na série de lançadas, mas não na de liberadas

### Requirement: O painel lista as chamadas por publicação

O painel SHALL exibir uma tabela de **chamadas por publicação** com abas **Release Week**,
**Manuais** e **Escopo de Projetos**. Cada linha SHALL mostrar código, nome/título, data de
publicação, status, total de chamadas e um indicador de progresso do fluxo. A contagem SHALL usar as
chaves estrangeiras `release_id`, `manual_id` e `projeto_id`; uma chamada com mais de um vínculo
(origem `Ambos`) SHALL contar em cada aba correspondente, de modo que a soma das abas pode superar o
total de chamadas. Publicações arquivadas SHALL aparecer no histórico do ano selecionado.

#### Scenario: Chamadas de uma release

- **WHEN** a aba Release Week é exibida
- **THEN** cada release do período mostra o total de chamadas vinculadas e o progresso do fluxo

#### Scenario: Chamada com dois vínculos

- **WHEN** uma chamada está vinculada a uma release e a um manual
- **THEN** ela é contada na aba Release Week e na aba Manuais

#### Scenario: Publicação sem chamadas

- **WHEN** uma publicação do período não tem chamadas
- **THEN** a linha exibe zero e não é omitida da tabela

### Requirement: O painel apresenta dimensões editoriais

O painel SHALL exibir os **softwares mais atendidos** (contagem pela relação N:N de softwares da
chamada) e a distribuição por **tipo** e por **impacto**. Softwares e parceiros SHALL entrar apenas
como dimensões das chamadas, não como KPIs de cadastro. O bloco visual de fluxo da esteira (aging,
aguardando pai, no portal e tempo médio por estágio) NÃO SHALL ser exibido no v1.

#### Scenario: Ranking de softwares

- **WHEN** existem chamadas com softwares vinculados no período
- **THEN** o painel exibe os softwares ordenados pela contagem de chamadas

#### Scenario: Distribuição por tipo e impacto

- **WHEN** existem chamadas lançadas no período
- **THEN** o painel exibe as contagens por tipo e por impacto

### Requirement: A API do painel agrega os dados no servidor

O sistema SHALL servir `GET /api/painel-executivo` sob sessão autenticada, aceitando o parâmetro
opcional `ano` (`AAAA`) e devolvendo, no mínimo: `periodo`, `anosDisponiveis`, `kpis`, `serieMensal`,
`serieAnual`, `porPublicacao`, `porSoftware`, `porTipo` e `porImpacto`. As agregações SHALL ser feitas
no servidor, com queries parametrizadas e sem depender da paginação das telas de módulo. Ano ausente
SHALL usar o ano corrente quando ele tiver chamadas; caso contrário, o ano mais recente com chamadas
(sem chamadas, o ano corrente). Ano inválido SHALL responder `400`. O endpoint NÃO SHALL exigir um
novo módulo de permissão além da sessão válida.

#### Scenario: Consulta sem ano

- **WHEN** a tela chama `GET /api/painel-executivo` sem `ano`
- **THEN** a API responde `200` com o ano corrente (se tiver chamadas) ou o mais recente com chamadas, todos os blocos do contrato e `anosDisponiveis` em ordem decrescente

#### Scenario: Ano específico

- **WHEN** a tela chama `GET /api/painel-executivo?ano=2025`
- **THEN** a API responde `200` com os dados de 2025

#### Scenario: Ano inválido

- **WHEN** a API recebe `ano=abc` ou um ano fora de quatro dígitos
- **THEN** responde `400` e não consulta o banco

#### Scenario: Sem sessão

- **WHEN** a API é chamada sem sessão
- **THEN** responde `401` e não devolve dados

### Requirement: O painel trata carregamento, erro e vazio

A tela SHALL exibir `UiLoading` durante a carga inicial, sem renderizar números parciais. Em falha,
SHALL exibir toast de erro e zerar KPIs, séries e tabelas (não reutilizar a carga anterior). Cada
bloco SHALL ter estado vazio próprio quando não houver dados no período. A troca de ano SHALL
recarregar os dados da API e manter o seletor utilizável.

#### Scenario: Carga inicial

- **WHEN** a tela é aberta no primeiro acesso
- **THEN** o `UiLoading` cobre o conteúdo até a API responder

#### Scenario: Falha de carga

- **WHEN** a API responde erro
- **THEN** um toast de erro é exibido e KPIs/séries/tabelas ficam zerados, sem dados antigos

#### Scenario: Troca de ano

- **WHEN** o usuário seleciona outro ano
- **THEN** a tela recarrega os dados do ano escolhido e atualiza todos os blocos
