# Spec Delta

## Purpose

Define a tela administrativa do catálogo de softwares: rota e shell, a listagem (descrição, categoria, situação e timestamps), os filtros por categoria/situação, as exportações PDF/CSV e o modelo de importação versionado — fixando o contrato de leitura que o backend servirá depois.

## ADDED Requirements

### Requirement: Acesso e rota da tela de Softwares

O sistema SHALL expor a tela do catálogo de softwares em `/admin/softwares`, renderizada dentro do
shell da Área Administrativa (header + sidebar) como as demais rotas sob `/admin/**`. A tela SHALL
ser alcançável pelo item **Softwares** da sessão **Cadastros** da sidebar, que passa a declarar a
rota `/admin/softwares` e a navegar ao clique. O acesso SHALL estar sujeito à mesma guarda de sessão
das demais telas administrativas.

#### Scenario: Item Softwares navega pela sidebar

- **WHEN** o usuário clica em "Softwares" na sidebar
- **THEN** o navegador vai para `/admin/softwares` e a tela é renderizada dentro do shell

#### Scenario: Item Softwares fica ativo na própria rota

- **WHEN** a rota corrente é `/admin/softwares`
- **THEN** o item "Softwares" da sidebar é exibido como ativo, com `aria-current="page"`

#### Scenario: Rota protegida exige sessão

- **WHEN** um visitante sem sessão tenta abrir `/admin/softwares`
- **THEN** ele é redirecionado para `/admin/login?redirect=/admin/softwares`

### Requirement: Estrutura do catálogo de softwares

O catálogo SHALL representar cada software pelos campos `descricao` (nome/descrição exibido),
`categoria`, `situacao`, `criado_em` e `atualizado_em`. `categoria` SHALL assumir um dos valores
`Delphi`, `Web` ou `Delphi e Web` e `situacao` SHALL assumir `Ativo` ou `Inativo`; os timestamps
SHALL ser gerados pelo sistema (criação e última atualização), nunca digitados na tela.

#### Scenario: Software com os campos do catálogo

- **WHEN** um software do catálogo é exibido
- **THEN** ele apresenta descrição, categoria (`Delphi`, `Web` ou `Delphi e Web`), situação
  (`Ativo` ou `Inativo`) e os carimbos de criação e atualização

#### Scenario: Categoria e situação restritas ao domínio

- **WHEN** a categoria ou a situação é apresentada ou filtrada
- **THEN** apenas os valores do domínio (`Delphi`/`Web`/`Delphi e Web` e `Ativo`/`Inativo`) são
  oferecidos

### Requirement: Listagem de softwares

A tela SHALL carregar o catálogo de `GET /api/softwares` e exibi-lo em uma tabela com as colunas
**Descrição, Categoria, Situação, Criado em e Atualizado em**, além da coluna de ações. Enquanto a
leitura está em voo, SHALL exibir um overlay de carregamento sem conteúdo parcial. Se a leitura
falhar, SHALL exibir um aviso de erro e manter a lista **vazia** — nunca apresentar dados de
demonstração como se fossem persistidos. A tabela SHALL oferecer busca, ordenação e paginação no
cliente, como as demais telas do kit.

#### Scenario: Carregamento sem conteúdo parcial

- **WHEN** a tela é aberta e a leitura de `GET /api/softwares` ainda não respondeu
- **THEN** a área de conteúdo exibe apenas o overlay de carregamento (sem KPIs/tabela vazios)

#### Scenario: Colunas da listagem

- **WHEN** o catálogo é exibido
- **THEN** a tabela mostra as colunas Descrição, Categoria, Situação, Criado em e Atualizado em,
  com Categoria e Situação em `UiBadge`

#### Scenario: Catálogo vazio

- **WHEN** a leitura responde sem nenhum software
- **THEN** a tabela exibe seu estado vazio e nenhum dado fictício é mostrado

#### Scenario: Falha na leitura

- **WHEN** `GET /api/softwares` falha ou ainda não existe
- **THEN** a tela exibe um aviso de erro e a lista permanece vazia

#### Scenario: Busca, ordenação e paginação

- **WHEN** o usuário usa a busca, ordena por uma coluna ou troca de página
- **THEN** a tabela reflete a interação sobre o conjunto vigente

### Requirement: KPIs do catálogo de softwares

A tela SHALL exibir indicadores derivados do conjunto vigente (o conjunto filtrado, quando houver
filtro): total de softwares, quantidade de **Ativos**, quantidade de **Inativos** e a quebra por
**Categoria** (`Delphi`, `Web`, `Delphi e Web`).

#### Scenario: KPIs acompanham o conjunto vigente

- **WHEN** um filtro refina o conjunto exibido
- **THEN** os KPIs são recalculados sobre o conjunto filtrado

### Requirement: Filtros por categoria e situação

A tela SHALL oferecer um modal de filtros acionado pela toolbar da tabela, com seleções de
**Categoria** e **Situação** (vazio = todos) e os botões "Limpar Filtros", "Cancelar" e "Aplicar".
Aplicar SHALL refinar o conjunto vigente; limpar SHALL zerar os filtros e restaurar o conjunto
completo; a toolbar SHALL indicar a quantidade de filtros ativos.

#### Scenario: Aplicar filtro refina a listagem

- **WHEN** o usuário seleciona uma categoria ou situação no modal e clica em "Aplicar"
- **THEN** a tabela e os KPIs passam a refletir apenas os softwares que casam com o filtro

#### Scenario: Limpar filtros restaura o conjunto

- **WHEN** o usuário clica em "Limpar Filtros"
- **THEN** os filtros são zerados e o catálogo completo volta a ser exibido

#### Scenario: Contador de filtros ativos

- **WHEN** há filtros ativos
- **THEN** o botão "Filtros" da toolbar exibe a quantidade de filtros aplicados

#### Scenario: Cancelar descarta o rascunho

- **WHEN** o usuário altera seleções e clica em "Cancelar"
- **THEN** o modal fecha e o conjunto vigente permanece inalterado

### Requirement: Exportação do catálogo de softwares

A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a geração da **listagem em PDF** e a
**exportação em CSV**, ambas sobre o conjunto filtrado vigente (o mesmo exibido na tabela).
O PDF SHALL conter o cabeçalho com a logomarca configurada, quando houver, e as colunas do
catálogo; o CSV SHALL ser emitido em `;` com BOM UTF-8 e neutralizar fórmulas de planilha. Falhas
na geração SHALL produzir aviso de erro, sem interromper a tela.

#### Scenario: Exportar CSV do conjunto filtrado

- **WHEN** o usuário escolhe "Exportar em CSV" com um filtro aplicado
- **THEN** é baixado um arquivo CSV com os softwares filtrados e as colunas do catálogo

#### Scenario: Gerar a listagem em PDF

- **WHEN** o usuário escolhe "Listagem em PDF"
- **THEN** é gerado um PDF com o cabeçalho (logomarca, quando houver) e os softwares do conjunto
  filtrado

#### Scenario: Falha na exportação

- **WHEN** a geração do PDF ou do CSV falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

### Requirement: Modelo de importação versionado

O projeto SHALL manter o modelo oficial de importação de softwares versionado em
`docs/modelos/modelo-importacao-softwares.xlsx`, com as colunas **Descrição, Categoria e Situação**,
servindo de referência para a futura funcionalidade de importação. A execução da importação
(seleção, leitura da planilha e gravação) **não** faz parte desta capability nesta mudança.

#### Scenario: Modelo com as colunas oficiais

- **WHEN** o modelo de importação é aberto
- **THEN** o cabeçalho apresenta as colunas Descrição, Categoria e Situação

### Requirement: Cadastro e edição de software

O sistema SHALL oferecer um modal de cadastro/edição acionado por "Novo Software" (criação) e pela
ação de linha "Editar" (edição), com os campos **Descrição** (obrigatória, até 200 caracteres),
**Categoria** (`Delphi` | `Web` | `Delphi e Web`) e **Situação** (`Ativo` | `Inativo`). Na criação
o registro nasce com categoria `Delphi` e situação `Ativo`; na edição o modal exibe a seção
**Informações de Cadastro** com `criado_em` e `atualizado_em` desabilitados. Salvar SHALL gravar via
`POST /api/softwares` (criação) ou `PUT /api/softwares/:id` (edição); o sucesso fecha o modal e
confirma a ação; em falha, o modal permanece aberto e o erro é informado.

#### Scenario: Abrir cadastro com padrões

- **WHEN** o usuário aciona "Novo Software"
- **THEN** o modal "Novo Software" abre com categoria `Delphi` e situação `Ativo`, sem a seção de
  Informações de Cadastro

#### Scenario: Abrir edição com o registro e os carimbos de cadastro

- **WHEN** o usuário aciona "Editar" em uma linha
- **THEN** o modal "Editar Software" abre preenchido e exibe Criado em/Atualizado em desabilitados

#### Scenario: Descrição obrigatória

- **WHEN** o usuário tenta salvar com a descrição vazia
- **THEN** o campo Descrição exibe o erro e recebe o foco, e nenhuma requisição é enviada

#### Scenario: Salvar com sucesso

- **WHEN** o usuário salva um formulário válido
- **THEN** o registro é gravado (POST na criação, PUT na edição), o modal fecha e um aviso de
  sucesso é exibido

#### Scenario: Falha ao salvar mantém o modal

- **WHEN** a gravação falha
- **THEN** o modal permanece aberto e um aviso de erro é exibido

### Requirement: Exclusão de software

O sistema SHALL oferecer a ação de linha **Excluir**, que abre um modal de confirmação com a
descrição do software. Confirmar SHALL remover o registro via `DELETE /api/softwares/:id`; o sucesso
fecha o modal, retira a linha da listagem e confirma a ação; em falha, um aviso de erro é exibido com
a listagem intacta.

#### Scenario: Abrir a confirmação de exclusão

- **WHEN** o usuário aciona "Excluir" em uma linha
- **THEN** o modal de confirmação abre exibindo a descrição e a categoria do software

#### Scenario: Confirmar exclusão

- **WHEN** o usuário confirma a exclusão
- **THEN** o registro é removido via `DELETE`, a linha sai da listagem e um aviso de sucesso é
  exibido

#### Scenario: Falha na exclusão

- **WHEN** a exclusão falha
- **THEN** um aviso de erro é exibido e a listagem permanece intacta

### Requirement: Acionamento da importação de softwares

A toolbar da tabela SHALL apresentar, imediatamente à **esquerda** do botão "Filtros", a affordância
de **importação** dos softwares a partir do modelo `.xlsx` (ícone `Import`). Nesta fase a execução da
importação (modal, parser e gravação) é adiada: acioná-la SHALL informar o usuário de que a
importação será habilitada com o backend, sem navegação.

#### Scenario: Affordância de importação ao lado de Filtros

- **WHEN** a toolbar da tabela é exibida
- **THEN** o botão de importação aparece imediatamente à esquerda do botão "Filtros"

#### Scenario: Acionar a importação com a execução adiada

- **WHEN** o usuário aciona a importação
- **THEN** o sistema informa que a importação será habilitada com o backend, sem navegar
