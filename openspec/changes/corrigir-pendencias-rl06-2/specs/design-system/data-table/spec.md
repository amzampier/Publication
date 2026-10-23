# Spec Delta

## ADDED Requirements

### Requirement: A UiDataTable expõe estado de erro com retry

A `UiDataTable` SHALL aceitar um estado de erro da carga e exibir uma mensagem persistente com uma
ação de **Tentar novamente**, distinta do estado vazio e do filtro sem resultados. O estado de erro
NÃO SHALL ser apresentado como “nenhum registro encontrado”. Quando o erro for de permissão, a
mensagem SHALL ser específica; quando for de conexão/servidor, SHALL orientar a tentar novamente.
A ação de retry SHALL emitir um evento para o chamador recarregar o conjunto.

#### Scenario: Falha de carga não parece lista vazia
- **WHEN** a carga inicial falha (rede, 500 ou 403)
- **THEN** a tabela exibe o estado de erro com a mensagem correspondente e o botão “Tentar novamente”, sem exibir o estado vazio

#### Scenario: Retry recarrega
- **WHEN** o usuário aciona “Tentar novamente”
- **THEN** o chamador é notificado e refaz a carga

#### Scenario: Permissão negada tem mensagem própria
- **WHEN** a carga falha com `403`
- **THEN** a mensagem informa que o perfil não tem permissão, sem sugerir erro de conexão

### Requirement: A busca da UiDataTable tem nome acessível

O campo de busca interno da `UiDataTable` SHALL ter um nome acessível (`label` visualmente oculto ou
`aria-label`) que descreva a ação, além do placeholder. O nome SHALL ser configurável pelo chamador e
SHALL existir mesmo quando o placeholder estiver visível.

#### Scenario: Busca anunciada por leitor de tela
- **WHEN** o foco vai para o campo de busca da tabela
- **THEN** a tecnologia assistiva anuncia um nome que identifica a busca, não apenas “edição de texto”

#### Scenario: Busca customizada mantém o nome
- **WHEN** o chamador usa a busca própria (ex.: Parceiros/Escopo) com `UiInput`
- **THEN** o campo recebe `label`/`aria-label` e continua anunciável

### Requirement: A paginação da tabela é responsiva

Os controles de paginação da `UiDataTable`/`UiPagination` SHALL permanecer acessíveis em viewports de
320–375 px, quebrando linha ou usando rolagem própria dentro do card, sem cortar botões por
`overflow-hidden` e sem produzir overflow horizontal na página.

#### Scenario: Paginação em 320px
- **WHEN** a tabela é exibida em 320px com mais de uma página
- **THEN** os botões de página continuam visíveis e acionáveis, com quebra de linha ou rolagem interna

#### Scenario: Sem overflow da página
- **WHEN** a paginação é exibida em 375px
- **THEN** a página não ganha barra de rolagem horizontal