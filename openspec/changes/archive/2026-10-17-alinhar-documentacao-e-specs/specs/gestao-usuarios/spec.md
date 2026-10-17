# Spec Delta

## MODIFIED Requirements

### Requirement: O modal de filtros refina o conjunto vigente de usuários
O sistema SHALL abrir um modal de filtros ao acionar o botão "Filtros" da toolbar da tabela (`UiModal` de largura `sm`, com ícone no cabeçalho, título "Filtros de Usuários"), cujo corpo é organizado em duas sessões `UiModalSection`: **"Usuário"**, contendo um controle de seleção única `UiSelect` cujas opções são os nomes dos usuários da base (ordenados em pt-BR) e **"Perfil e Status"**, contendo dois `UiSelect` — um para **perfil** (os perfis cadastrados em Perfis de Acesso, Ativos) e um para **status** (Ativo, Inativo) —, em todos o estado vazio equivalendo a "todos" (placeholder "Todos os usuários"/"Todos os perfis"/"Todos os status") e a limpeza pelo `X` do select devolvendo o critério a "todos". O modal SHALL editar um rascunho sincronizado com o estado aplicado ao abrir: **"Aplicar"** grava o rascunho e fecha; **"Cancelar"**, `Escape` ou o `X` do cabeçalho fecham descartando o rascunho sem alterar o estado aplicado; **"Limpar Filtros"** (à esquerda do rodapé) zera rascunho e estado aplicado mantendo o modal aberto, com "Cancelar" e "Aplicar" à direita do rodapé. Aplicado o filtro, a tabela, os KPIs e as exportações (CSV e PDFs) SHALL refletir somente o conjunto filtrado, e o badge do botão "Filtros" SHALL indicar a quantidade de critérios ativos (0 a 3), alterada somente por "Aplicar" e "Limpar Filtros". Os filtros SHALL ser aplicados **no servidor** — enviados como parâmetros de consulta a `GET /api/usuarios`, que devolve o conjunto filtrado paginado — e descartados na recarga da página.

#### Scenario: Abertura pelo botão Filtros
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** o modal de filtros abre exibindo as sessões "Usuário" e "Perfil e Status" com os três selects no estado vigente e nenhum toast de "próxima etapa" é exibido

#### Scenario: Aplicar filtra e recalcula tudo
- **WHEN** com o modal aberto o usuário escolhe um perfil (ex.: Leitor) e aciona "Aplicar"
- **THEN** o modal fecha, a tabela lista apenas os usuários daquele perfil, os quatro KPIs refletem apenas esse conjunto, o badge do botão "Filtros" exibe 1 e o CSV e os PDFs gerados em seguida contêm somente esses usuários

#### Scenario: Perfil customizado aparece nas opções do filtro
- **WHEN** existe um perfil customizado Ativo em Perfis de Acesso e o usuário abre o modal de filtros
- **THEN** o select de perfil lista esse perfil customizado entre as opções, permitindo filtrar por ele

#### Scenario: Rascunho descartado por Cancelar
- **WHEN** com filtros já aplicados o usuário abre o modal, altera os selects e aciona "Cancelar" (ou pressiona `Escape` ou clica no `X` do cabeçalho)
- **THEN** o modal fecha, o conjunto exibido, os KPIs e o badge permanecem idênticos ao estado anterior e nenhum toast é exibido

#### Scenario: Limpar Filtros zera com o modal aberto
- **WHEN** com dois critérios aplicados o usuário aciona "Limpar Filtros" dentro do modal
- **THEN** os três selects voltam ao estado vazio ("todos"), a tabela e os KPIs voltam a refletir a base completa, o badge do botão "Filtros" desaparece (zero critérios) e o modal permanece aberto

#### Scenario: Limpeza individual pelo X do select
- **WHEN** o usuário limpa o select de Status pelo seu `X` e aciona "Aplicar"
- **THEN** o critério de status volta a "todos" e o conjunto passa a considerar apenas os demais critérios aplicados

#### Scenario: Badge conta somente o estado aplicado
- **WHEN** o usuário seleciona critérios no rascunho sem acionar "Aplicar" e depois fecha o modal
- **THEN** o badge do botão "Filtros" não muda, refletindo apenas o estado aplicado

#### Scenario: Conjunto filtrado vazio
- **WHEN** a combinação de filtros aplicados não corresponde a nenhum usuário
- **THEN** a tabela exibe seu estado vazio ("Nenhum resultado encontrado para o filtro.") e os KPIs refletem o conjunto vazio, sem erro

#### Scenario: Recarga descarta os filtros
- **WHEN** a página é recarregada com filtros aplicados
- **THEN** os filtros voltam ao estado vazio e a base completa é exibida

## RENAMED Requirements

### Requirement: A tela opera sobre a API de usuários; filtros e exportações via API
- **FROM**: A tela opera sobre a API de usuários; filtros e exportações permanecem locais
- **TO**: A tela opera sobre a API de usuários; filtros e exportações via API