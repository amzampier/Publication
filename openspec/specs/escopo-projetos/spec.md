# escopo-projetos Specification

## Purpose

Define a tela administrativa de Escopo de Projetos na fase frontend: rota/shell, grade de cards,
KPIs, filtros, formulário, itens em modal somente leitura, publicar/arquivar mockados, exclusão
condicionada, exportações e importação como affordance, operando sobre um dataset em memória.

## Requirements

### Requirement: A página de Escopo de Projetos existe em /admin/escopo-projetos
O sistema SHALL expor a tela de Escopo de Projetos em `/admin/escopo-projetos`, renderizada dentro
do shell da Área Administrativa (header + sidebar) como as demais rotas sob `/admin/**`. A tela
SHALL ser alcançável pelo item **Escopo de Projetos** da sessão **Publicações** da sidebar, que passa
a declarar a rota `/admin/escopo-projetos` e a navegar ao clique. O acesso SHALL estar sujeito à
mesma guarda de sessão das demais telas administrativas.

#### Scenario: Item Escopo de Projetos navega pela sidebar
- **WHEN** o usuário clica em "Escopo de Projetos" na sidebar
- **THEN** o navegador vai para `/admin/escopo-projetos` e a tela é renderizada dentro do shell

#### Scenario: Item Escopo de Projetos fica ativo na própria rota
- **WHEN** a rota corrente é `/admin/escopo-projetos`
- **THEN** o item "Escopo de Projetos" da sidebar é exibido como ativo, com `aria-current="page"`

#### Scenario: Rota protegida exige sessão
- **WHEN** um visitante sem sessão tenta abrir `/admin/escopo-projetos`
- **THEN** ele é redirecionado para `/admin/login?redirect=/admin/escopo-projetos`

### Requirement: A tela representa o escopo de projeto
Cada escopo SHALL ser representado pelos campos: `codigo` (`PE-<ano>.<sequencial>` no mock),
`nome`, `versao`, `ano`, `dataInicio`, `dataFinal`, `dataPrevisao`, `dataPublicacao`,
`status` (`Em Andamento` | `Homologação` | `Concluído` | `Publicado`),
`softwaresContemplados` (lista **derivada** dos itens/chamadas — ver requisito próprio),
`descricaoGeral`, `totalVisualizacoes`, `itensCount`, `arquivada` (somente no dataset mock nesta
fase), `criadoEm` e `atualizadoEm`. O status
SHALL ser exibido em `UiBadge` com variantes distintas para os quatro valores. O `codigo`, os
carimbos e a contagem de itens SHALL ser gerados pelo sistema, nunca digitados; o código SHALL ser
único.

#### Scenario: Card exibe os campos do escopo
- **WHEN** um escopo é exibido na grade
- **THEN** o card apresenta código, status, nome, versão, ano, período, quantidade de itens
  vinculados e visualizações

#### Scenario: Status restrito ao domínio
- **WHEN** o status é apresentado, editado ou filtrado
- **THEN** apenas `Em Andamento`, `Homologação`, `Concluído` e `Publicado` são oferecidos

#### Scenario: Itens vinculados exibidos
- **WHEN** um escopo é exibido na grade
- **THEN** o card exibe a quantidade de itens vinculados (`itensCount`), inclusive zero

### Requirement: Softwares contemplados derivados das chamadas
Os **softwares contemplados** NÃO SHALL ser selecionados no formulário. Eles SHALL ser derivados
dos itens vinculados ao escopo, um por software distinto das chamadas, e SHALL aparecer no
formulário somente quando houver pelo menos um item (o card exibe a quantidade de itens, não os
softwares). Na inclusão, o escopo nasce sem softwares; eles são preenchidos quando as chamadas são
lançadas no módulo "Lançar as Chamadas". Na edição, a lista é somente leitura. O filtro por
**Software** SHALL oferecer apenas os softwares presentes no conjunto.

#### Scenario: Novo escopo sem softwares
- **WHEN** o usuário abre "Novo Escopo"
- **THEN** não há campo de seleção de softwares e a lista de softwares contemplados não é exibida

#### Scenario: Itens preenchem os softwares
- **WHEN** o escopo recebe chamadas com softwares distintos
- **THEN** a lista de softwares contemplados é preenchida automaticamente, sem repetição

#### Scenario: Edição somente leitura dos softwares
- **WHEN** o usuário edita um escopo que já possui itens
- **THEN** os softwares contemplados aparecem como texto/badges, sem permitir alteração manual

### Requirement: Listagem em grade de cards
A tela SHALL exibir os escopos em uma **grade de cards** (não em tabela), com busca textual,
ordenação e paginação no cliente sobre o conjunto vigente (`UiPagination`, 6 cards por página). A
tela SHALL exibir o cabeçalho e os KPIs mesmo com a lista vazia e SHALL distinguir base vazia de
filtro sem resultado. Os escopos arquivados NÃO SHALL fazer parte do conjunto exibido.

#### Scenario: Grade de cards
- **WHEN** a tela é exibida
- **THEN** os escopos aparecem em cards responsivos, com paginação no cliente

#### Scenario: Busca e paginação
- **WHEN** o usuário digita na busca ou troca de página
- **THEN** a grade reflete a busca sobre o conjunto filtrado e a página é ajustada

#### Scenario: Base vazia e filtro sem resultado
- **WHEN** não há escopo cadastrado ou o filtro não retorna resultados
- **THEN** a grade exibe a mensagem correspondente, sem dados fictícios além do dataset mock da fase

### Requirement: KPIs do conjunto vigente
A tela SHALL exibir quatro indicadores derivados do conjunto vigente (filtrado, quando houver
filtro): **Em Andamento**, **Homologação**, **Concluído** e **Publicado**. Os escopos arquivados NÃO
SHALL ser contados.

#### Scenario: KPIs acompanham os filtros
- **WHEN** um filtro refina o conjunto exibido
- **THEN** os quatro KPIs são recalculados sobre o conjunto filtrado

#### Scenario: Arquivado sai dos KPIs
- **WHEN** um escopo é arquivado
- **THEN** ele deixa de ser contado em todos os quatro KPIs

### Requirement: Filtros estruturais em modal
A tela SHALL oferecer um modal de filtros acionado pela toolbar da grade, com **Status**, **Ano**,
**Versão** e **Software** (vazio = todos) e os botões "Limpar Filtros", "Cancelar" e "Aplicar".
Aplicar SHALL refinar o conjunto vigente; limpar SHALL zerar rascunho e estado; a toolbar SHALL
indicar a quantidade de filtros ativos no badge do botão "Filtros". Os filtros SHALL operar
inteiramente em memória e ser descartados na recarga da página.

#### Scenario: Aplicar refina a grade e os KPIs
- **WHEN** o usuário seleciona filtros e clica em "Aplicar"
- **THEN** a grade e os KPIs passam a refletir apenas os escopos que casam com os filtros

#### Scenario: Limpar restaura o conjunto
- **WHEN** o usuário clica em "Limpar Filtros"
- **THEN** os filtros são zerados e o conjunto completo volta a ser exibido

#### Scenario: Cancelar descarta o rascunho
- **WHEN** o usuário altera seleções e clica em "Cancelar"
- **THEN** o modal fecha e o conjunto vigente permanece inalterado

#### Scenario: Contador de filtros ativos
- **WHEN** há filtros ativos
- **THEN** o botão "Filtros" exibe a quantidade de filtros aplicados

### Requirement: Ações do card
Cada card SHALL oferecer as ações **Itens** (`ListChecks`), **Editar** (`Pencil`), **Excluir**
(`Trash2`) e um `UiActionMenu` com **Publicar** e **Arquivar**. As ações SHALL ficar visíveis no
hover/foco do card, permanecer focáveis por teclado e respeitar as permissões do módulo. **Excluir**
SHALL ficar desabilitado com motivo acessível quando o escopo possuir itens vinculados. **Publicar**
SHALL ficar desabilitado quando o status já for `Publicado`.

#### Scenario: Menu de ações da linha
- **WHEN** o usuário aciona o `UiActionMenu` de um card
- **THEN** o menu exibe "Publicar" e "Arquivar" com as permissões e estados correspondentes

#### Scenario: Itens abre o modal somente leitura
- **WHEN** o usuário aciona o ícone "Itens" de um card
- **THEN** o modal de itens é aberto com os itens daquele projeto, sem navegar para outra rota

#### Scenario: Excluir bloqueado por itens
- **WHEN** o escopo possui itens vinculados
- **THEN** a ação "Excluir" fica desabilitada e informa o motivo

#### Scenario: Publicar desabilitado quando já publicado
- **WHEN** o status do escopo é `Publicado`
- **THEN** a ação "Publicar" fica desabilitada com o motivo informado

### Requirement: Inclusão de escopo de projeto
O sistema SHALL oferecer o botão "Novo Escopo", que abre um modal de cadastro com **Nome**
(obrigatório, até 255), **Código** (gerado pelo mock no padrão `PE-<ano>.<sequencial>`, único,
somente leitura), **Versão** (obrigatória, até 50), **Ano** (obrigatório, 1900–2100), **Status**
(padrão `Em Andamento`), **Data de Início**, **Data Final**, **Data de Previsão**, **Data de
Publicação** (obrigatórias) e **Descrição Geral**. Os softwares contemplados não são digitados:
são derivados dos itens (requisito próprio). O formulário SHALL validar os campos, a ordem
`dataFinal >= dataInicio`, o ano e a unicidade do código, focando o primeiro problema; salvar SHALL
incluir o escopo no dataset com status/ano padrão, código único gerado e timestamps do mock, e
fechar o modal com aviso de sucesso.

#### Scenario: Abrir o cadastro com padrões
- **WHEN** o usuário aciona "Novo Escopo"
- **THEN** o modal abre com status `Em Andamento`, ano atual e sem softwares selecionáveis

#### Scenario: Campos obrigatórios
- **WHEN** o usuário tenta salvar sem nome, versão, ano ou datas
- **THEN** o primeiro campo inválido recebe o erro e o foco, e nada é incluído

#### Scenario: Ordem das datas
- **WHEN** a data final é anterior à data de início
- **THEN** o erro é exibido no campo e o escopo não é incluído

#### Scenario: Inclusão com sucesso
- **WHEN** o usuário salva um formulário válido
- **THEN** o escopo entra na grade com o código gerado, o modal fecha e um aviso de sucesso é
  exibido

### Requirement: Edição de escopo de projeto
O sistema SHALL oferecer a ação de linha **Editar**, que abre o mesmo modal preenchido com o
registro, em modo edição, exibindo o **Código** somente leitura e a seção **Informações de Cadastro**
com `criadoEm` e `atualizadoEm` desabilitados. Salvar SHALL atualizar o escopo no dataset e fechar o
modal com aviso de sucesso, mantendo o código e os carimbos de criação. A ação SHALL respeitar a
permissão de `alterar`.

#### Scenario: Abrir edição preenchida
- **WHEN** o usuário aciona "Editar" em um card
- **THEN** o modal abre preenchido, com Código e carimbos de cadastro somente leitura

#### Scenario: Atualização com sucesso
- **WHEN** o usuário salva alterações válidas
- **THEN** o card reflete os novos dados, o modal fecha e um aviso de sucesso é exibido

#### Scenario: Código imutável na edição
- **WHEN** o usuário edita um escopo
- **THEN** o código permanece o mesmo e não é editável

### Requirement: Publicar e arquivar escopo
O sistema SHALL oferecer as ações **Publicar** e **Arquivar**, ambas com confirmação. Publicar SHALL
alterar o status para `Publicado` e preencher a **Data de Publicação** com a data atual no mock.
Arquivar SHALL marcar o escopo como **arquivado** (`arquivada = true` no dataset mock), sem excluir
dados ou itens, e o escopo arquivado SHALL deixar de aparecer na grade/KPIs. Publicar SHALL respeitar
a permissão de `publicar`; arquivar, a de `arquivar`. Nesta fase não há coluna `arquivada` no banco;
o `docs/14` registra a futura migration.

#### Scenario: Publicar altera o status
- **WHEN** o usuário confirma "Publicar"
- **THEN** o status passa a `Publicado`, a data de publicação é preenchida e a grade/KPIs refletem a
  mudança

#### Scenario: Arquivar remove da grade sem excluir
- **WHEN** o usuário confirma "Arquivar"
- **THEN** o escopo é marcado como arquivado, deixa de aparecer na grade e seus dados e itens
  permanecem no dataset

#### Scenario: Escopo arquivado não aparece
- **WHEN** a grade é exibida
- **THEN** os escopos arquivados não fazem parte do conjunto exibido nem dos KPIs

### Requirement: Exclusão condicionada de escopo
O sistema SHALL oferecer a ação **Excluir** somente quando o escopo não possuir itens/relacionamentos
vinculados (`itensCount = 0`). Quando houver itens, a ação SHALL ficar indisponível com a indicação
acessível do motivo e nenhum dado SHALL ser removido. A confirmação SHALL remover o registro do
dataset e fechar o modal com aviso de sucesso. A ação SHALL respeitar a permissão de `excluir`.

#### Scenario: Excluir escopo sem itens
- **WHEN** o escopo não possui itens e o usuário confirma a exclusão
- **THEN** o registro é removido da grade e um aviso de sucesso é exibido

#### Scenario: Escopo com itens não pode ser excluído
- **WHEN** o escopo possui itens vinculados
- **THEN** a ação de exclusão fica desabilitada com o motivo informado e nada é removido

#### Scenario: Arquivado não aparece para exclusão
- **WHEN** o escopo está arquivado
- **THEN** ele não aparece na grade e não há ação de exclusão disponível

### Requirement: Itens do projeto em modal somente leitura
O ícone **Itens** do card SHALL abrir um `UiModal` de largura `xl`, sem criar rota ou página nova,
com os itens do projeto (`entregas_itens` com `projeto_id` vinculado) em modo somente leitura no
componente **`UiDataTable`**: Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status
(`UiBadge`) e Data de liberação. A grade SHALL oferecer as funcionalidades do kit — busca,
agrupamento por até três colunas (arrastando cabeçalhos para a faixa de agrupamento), ordenação
multi-coluna, redimensionamento de colunas, paginação e totalizadores no rodapé. Projeto sem itens
SHALL exibir o estado vazio "Nenhum item vinculado a este projeto." O modal SHALL fechar por
`Escape`, `X` ou "Fechar". O CRUD dos itens NÃO SHALL ser oferecido nesta tela. O ícone SHALL ser
exibido sob a permissão `visualizar` do módulo (o catálogo de `escopo-projetos` não possui
`visualizar_itens` nesta fase).

#### Scenario: Abrir itens de um projeto com itens
- **WHEN** o usuário aciona o ícone "Itens" de um projeto com itens
- **THEN** o modal abre em largura `xl` e lista os itens no `UiDataTable`, sem sair da tela

#### Scenario: Agrupar, ordenar e buscar itens
- **WHEN** o usuário arrasta um cabeçalho para a faixa de agrupamento, clica em um cabeçalho ou usa
  a busca
- **THEN** a grade agrupa, ordena ou filtra os itens conforme a funcionalidade do `UiDataTable`

#### Scenario: Projeto sem itens
- **WHEN** o usuário abre os itens de um projeto sem itens
- **THEN** o modal exibe o estado vazio informando que não há itens

#### Scenario: Fechar o modal
- **WHEN** o usuário aciona "Fechar", `Escape` ou o `X`
- **THEN** o modal fecha e a grade permanece no estado anterior

### Requirement: Exportações PDF e CSV
A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a **listagem em PDF** e a **exportação em
CSV** do conjunto filtrado vigente, com as colunas Código, Nome, Versão, Ano, Status, Período,
Softwares e Visualizações. O CSV SHALL usar `;` com BOM UTF-8 e neutralizar fórmulas de planilha;
falhas na geração SHALL produzir aviso de erro sem interromper a tela. Em caso de lista vazia, a
exportação SHALL informar que não há dados. A exportação SHALL respeitar a permissão de `exportar`.

#### Scenario: Exportar o conjunto filtrado
- **WHEN** o usuário escolhe "Exportar em CSV" ou "Listagem em PDF"
- **THEN** o arquivo é gerado com os escopos do conjunto filtrado e as colunas da grade

#### Scenario: Falha na exportação
- **WHEN** a geração falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

### Requirement: Dataset em memória de rascunho
Nesta fase, a tela SHALL operar sobre um **dataset em memória** (`useState`) com escopos, softwares e
itens de exemplo. O dataset NÃO SHALL ser persistido: recarregar a página restaura o conjunto inicial
e nenhum registro SHALL ser gravado no banco. As inclusões, edições, publicações, arquivamentos e
exclusões SHALL atualizar apenas esse conjunto. O contrato de leitura futura (`GET
/api/escopo-projetos`) e a coluna `arquivada` SHALL ser documentados no `docs/14` como a substituição
desse dataset na fase backend.

#### Scenario: Ações operam sobre o conjunto em memória
- **WHEN** o usuário inclui, edita, publica, arquiva ou exclui um escopo
- **THEN** a grade e os KPIs refletem a mudança imediatamente, sem requisição ao servidor

#### Scenario: Recarregar descarta as mudanças
- **WHEN** o usuário recarrega a página
- **THEN** o dataset volta ao conjunto inicial em memória e nada foi persistido

### Requirement: Affordância de importação
A toolbar da grade SHALL apresentar o ícone de **importação** imediatamente à **esquerda** do botão
"Filtros", sob a permissão de `importar`. Nesta fase o ícone SHALL ser apenas uma affordance:
acioná-lo NÃO SHALL abrir modal, executar leitura de planilha nem disparar requisição. A execução da
importação SHALL permanecer como pendência para a fase backend.

#### Scenario: Ícone de importação visível ao lado de Filtros
- **WHEN** a toolbar da grade é exibida para um perfil com `importar`
- **THEN** o ícone de importação aparece imediatamente à esquerda do botão "Filtros"

#### Scenario: Importação não executa nesta fase
- **WHEN** o usuário aciona o ícone de importação
- **THEN** nenhum modal é aberto e nenhuma requisição é disparada

### Requirement: A matriz RBAC controla a interface
A tela SHALL usar o helper reativo `.can('escopo-projetos', acao)` para exibir/ocultar as ações:
Editar (`alterar`), Excluir (`excluir`), Publicar (`publicar`), Arquivar (`arquivar`), Exportar
(`exportar`), Importar (`importar`), Filtros (`filtrar`), busca (`buscar`) e o ícone de Itens
(`visualizar`). A matriz SHALL ser a mesma do catálogo atual do módulo `escopo-projetos`; nenhuma
funcionalidade nova de RBAC é criada nesta fase.

#### Scenario: Ação não concedida fica oculta
- **WHEN** o perfil não concede a ação correspondente no módulo
- **THEN** o controle/ação não é exibido na tela

#### Scenario: Itens exigem visualizar
- **WHEN** o perfil não concede `escopo-projetos`/`visualizar`
- **THEN** o ícone de itens não é exibido
