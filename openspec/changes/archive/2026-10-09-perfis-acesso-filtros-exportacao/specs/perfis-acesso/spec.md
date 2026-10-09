# Spec Delta

## ADDED Requirements

### Requirement: A exportação gera arquivos sobre o conjunto de perfis vigente
O sistema SHALL oferecer no cabeçalho o menu "Relatórios" (posicionado à esquerda do botão
"Novo Perfil") com as opções "Relação de perfis" (gera e baixa o relatório `perfis.pdf` em
folha paisagem sobre o conjunto vigente, com logo de login configurada quando houver e as
colunas Nome, Descrição, Status, Usuários e Permissões) e "Exportar em CSV" (download do
conjunto vigente em `perfis.csv`, com `;` como separador, BOM UTF-8 e linha de cabeçalho),
com um divisor separando a opção em PDF do CSV, sem abrir o diálogo de impressão do
navegador. Quando houver filtro do módulo aplicado, ambas as opções SHALL considerar
somente o conjunto filtrado.

#### Scenario: Exportar em CSV
- **WHEN** o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo `perfis.csv` é baixado contendo o conjunto vigente de perfis, com
  linha de cabeçalho (Nome, Descrição, Status, Usuários, Permissões)

#### Scenario: Relação de perfis gera o relatório estruturado
- **WHEN** o usuário escolhe "Relação de perfis"
- **THEN** o arquivo `perfis.pdf` é baixado em folha paisagem com cabeçalho contendo a logo
  de login configurada (quando houver) e o título do relatório, as colunas Nome, Descrição,
  Status, Usuários e Permissões com os perfis do conjunto vigente, e paginação com a
  indicação da página

#### Scenario: Os relatórios são baixados sem diálogo de impressão
- **WHEN** a opção em PDF do menu "Relatórios" é acionada
- **THEN** `window.print()` não é chamado e o arquivo é salvo diretamente no dispositivo

#### Scenario: Exporta o conjunto filtrado
- **WHEN** com um filtro do módulo aplicado o usuário escolhe qualquer das opções do menu
  "Relatórios"
- **THEN** o arquivo gerado contém somente os perfis do conjunto filtrado

### Requirement: O modal de filtros refina o conjunto vigente de perfis
O sistema SHALL abrir um modal de filtros ao acionar o botão "Filtros" da toolbar da tabela
(`UiModal` de largura `sm`, com ícone no cabeçalho, título "Filtros de Perfis"), cujo corpo
é organizado em duas sessões `UiModalSection`: **"Perfil"**, contendo um controle de seleção
única `UiSelect` cujas opções são os nomes dos perfis da base (ordenados em pt-BR) e
**"Status"**, contendo um `UiSelect` com os estados Ativo, Inativo e Bloqueado —, em ambos o
estado vazio equivalendo a "todos" (placeholder "Todos os perfis"/"Todos os status") e a
limpeza pelo `X` do select devolvendo o critério a "todos". O modal SHALL editar um rascunho
sincronizado com o estado aplicado ao abrir: **"Aplicar"** grava o rascunho e fecha;
**"Cancelar"**, `Escape` ou o `X` do cabeçalho fecham descartando o rascunho sem alterar o
estado aplicado; **"Limpar Filtros"** (à esquerda do rodapé) zera rascunho e estado aplicado
mantendo o modal aberto, com "Cancelar" e "Aplicar" à direita do rodapé. Aplicado o filtro, a
tabela, os KPIs e as exportações (CSV e PDF) SHALL refletir somente o conjunto filtrado, e o
badge do botão "Filtros" SHALL indicar a quantidade de critérios ativos (0 a 2), alterada
somente por "Aplicar" e "Limpar Filtros". Os filtros SHALL operar inteiramente em memória,
sem nenhuma requisição HTTP, e serem descartados na recarga da página.

#### Scenario: Abertura pelo botão Filtros
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** o modal de filtros abre exibindo as sessões "Perfil" e "Status" com os dois
  selects no estado vigente e nenhum toast de "próxima etapa" é exibido

#### Scenario: Aplicar filtra e recalcula tudo
- **WHEN** com o modal aberto o usuário escolhe um perfil (ex.: Leitor) e aciona "Aplicar"
- **THEN** o modal fecha, a tabela lista apenas aquele perfil, os cinco KPIs refletem apenas
  esse conjunto, o badge do botão "Filtros" exibe 1 e o CSV e o PDF gerados em seguida
  contêm somente esse perfil

#### Scenario: Rascunho descartado por Cancelar
- **WHEN** com filtros já aplicados o usuário abre o modal, altera os selects e aciona
  "Cancelar" (ou pressiona `Escape` ou clica no `X` do cabeçalho)
- **THEN** o modal fecha, o conjunto exibido, os KPIs e o badge permanecem idênticos ao
  estado anterior e nenhum toast é exibido

#### Scenario: Limpar Filtros zera com o modal aberto
- **WHEN** com dois critérios aplicados o usuário aciona "Limpar Filtros" dentro do modal
- **THEN** os dois selects voltam ao estado vazio ("todos"), a tabela e os KPIs voltam a
  refletir a base completa, o badge do botão "Filtros" desaparece (zero critérios) e o modal
  permanece aberto

#### Scenario: Limpeza individual pelo X do select
- **WHEN** o usuário limpa o select de Status pelo seu `X` e aciona "Aplicar"
- **THEN** o critério de status volta a "todos" e o conjunto passa a considerar apenas os
  demais critérios aplicados

#### Scenario: Badge conta somente o estado aplicado
- **WHEN** o usuário seleciona critérios no rascunho sem acionar "Aplicar" e depois fecha o
  modal
- **THEN** o badge do botão "Filtros" não muda, refletindo apenas o estado aplicado

#### Scenario: Conjunto filtrado vazio
- **WHEN** a combinação de filtros aplicados não corresponde a nenhum perfil (ex.: Status =
  Bloqueado sobre a base de demonstração)
- **THEN** a tabela exibe seu estado vazio ("Nenhum dado encontrado com o filtro aplicado.")
  e os KPIs refletem o conjunto vazio (Total de perfis 0 e Permissões concedidas 0/0), sem
  erro

#### Scenario: Recarga descarta os filtros
- **WHEN** a página é recarregada com filtros aplicados
- **THEN** os filtros voltam ao estado vazio e a base completa é exibida

## MODIFIED Requirements

### Requirement: Os KPIs refletem o conjunto vigente de perfis
O sistema SHALL exibir no topo da página os KPIs "Total de perfis" (contagem do conjunto
vigente), "Ativos", "Inativos", "Bloqueados" e "Permissões concedidas"
(`<soma das permissões verdadeiras>/<perfis × 99>`), recalculados sempre que o conjunto de
perfis muda — inclusive quando um filtro do módulo o refina (o conjunto vigente passa a ser
o conjunto filtrado).

#### Scenario: Base de demonstração
- **WHEN** a página é aberta com a base de demonstração (4 perfis, todos Ativos, matriz semeada)
- **THEN** os KPIs exibem Total de perfis 4, Ativos 4, Inativos 0, Bloqueados 0 e Permissões
  concedidas 171/396

#### Scenario: Recalculo após mudança do conjunto
- **WHEN** o conjunto vigente de perfis muda (criação, edição, exclusão, mudança de situação
  ou edição da matriz de permissões)
- **THEN** os cinco KPIs são recalculados a partir do conjunto vigente

#### Scenario: Filtro do módulo recalcula os KPIs
- **WHEN** o usuário aplica um filtro do módulo (ex.: Status = Inativo) ou limpa os filtros
- **THEN** os cinco KPIs passam a refletir somente o conjunto filtrado (ou a base completa,
  na limpeza) imediatamente
