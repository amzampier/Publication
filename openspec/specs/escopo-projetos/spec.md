# escopo-projetos Specification

## Purpose

Define a tela administrativa de Escopo de Projetos com persistência no banco, API/RBAC/auditoria,
grade de cards, KPIs, filtros, formulário, itens em modal somente leitura, publicar/arquivar,
exclusão condicionada, exportações e importação XLSX de escopos. O módulo nasce vazio, sem seed, e
os softwares contemplados são derivados das chamadas.

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

### Requirement: Persistência no banco e módulo vazio
O módulo SHALL persistir os escopos na tabela `projetos_escopo` e NÃO SHALL depender do dataset em
memória. A migration do módulo NÃO SHALL inserir escopos, softwares, itens ou qualquer registro de
demonstração: no primeiro acesso a listagem SHALL estar vazia. As inclusões, edições, publicações,
arquivamentos, exclusões e importações SHALL ser gravadas no banco e SHALL sobreviver ao recarregar
a página.

#### Scenario: Primeiro acesso sem lançamentos
- **WHEN** a tela é acessada com o banco recém-provisionado
- **THEN** a grade exibe o estado vazio e nenhum escopo de demonstração é apresentado

#### Scenario: Alteração persiste após recarregar
- **WHEN** o usuário cria, edita, publica, arquiva ou exclui um escopo
- **THEN** a alteração é gravada no banco e continua visível após um F5

#### Scenario: Migration sem seed
- **WHEN** as migrations são aplicadas
- **THEN** nenhum registro é inserido em `projetos_escopo` ou em `entregas_itens` pelo módulo

### Requirement: API de Escopo de Projetos
A API SHALL expor a listagem, criação, edição, publicação, arquivamento, exclusão, leitura de itens e
importação de escopos. A listagem SHALL retornar apenas escopos não arquivados, com `itensCount` e
`softwaresContemplados` derivados de `entregas_itens`. Todas as rotas SHALL aplicar a permissão
correspondente do módulo `escopo-projetos`; as escritas SHALL registrar auditoria no recurso
**"Escopo de Projetos"**. Conflitos de unicidade ou de guarda SHALL responder `409`; entradas
inválidas, `400`; ausência de sessão, `401`; permissão insuficiente, `403`.

#### Scenario: Listagem da API
- **WHEN** um usuário com `visualizar` consulta `GET /api/escopo-projetos`
- **THEN** recebe os escopos não arquivados com contagem de itens e softwares derivados

#### Scenario: Escrita sem permissão
- **WHEN** um perfil sem `criar`, `alterar`, `excluir`, `publicar`, `arquivar` ou `importar` tenta a
  ação correspondente
- **THEN** a API responde `403` e não grava nada

#### Scenario: Auditoria das escritas
- **WHEN** um escopo é incluído, alterado, publicado, arquivado, excluído ou importado
- **THEN** um evento é registrado no recurso "Escopo de Projetos"

### Requirement: Importação XLSX de escopos
A tela SHALL oferecer a importação de escopos por planilha `.xlsx`, sob a permissão `importar`. A
planilha SHALL conter somente dados do escopo — Nome, Versão, Ano, Data de Início, Data Final, Data
de Previsão, Data de Publicação, Status e Descrição Geral — sem itens, softwares ou Código. O
servidor SHALL gerar o código `PE-<ano>.<sequencial>` e SHALL considerar `(ano, versao)` como chave
de unicidade. O preview no cliente SHALL classificar as linhas como pronta, já cadastrada, repetida
ou inválida. O commit SHALL ser transacional: se qualquer linha for inválida ou conflitar com o
arquivo ou com a base, nada SHALL ser gravado. O limite SHALL ser de 500 linhas por importação;
linhas totalmente vazias SHALL ser ignoradas.

#### Scenario: Importação válida
- **WHEN** o usuário envia uma planilha com linhas válidas e sem duplicidade
- **THEN** os escopos são gravados em transação, com código gerado, e aparecem na grade

#### Scenario: Duplicidade no arquivo ou na base
- **WHEN** duas linhas têm o mesmo `(ano, versao)` ou uma linha já existe na base
- **THEN** a importação é recusada com `400`/`409`, com os conflitos informados, e nada é gravado

#### Scenario: Linha inválida cancela o lote
- **WHEN** qualquer linha tem campo obrigatório, data, ano ou status inválido
- **THEN** o lote inteiro é recusado e nenhum escopo é gravado

#### Scenario: Código gerado na importação
- **WHEN** uma linha válida é importada
- **THEN** o servidor gera o código `PE-<ano>.<sequencial>` e o devolve no escopo criado

#### Scenario: Limite de linhas
- **WHEN** a planilha excede 500 linhas de dados
- **THEN** a importação é recusada sem gravar registros

### Requirement: A tela representa o escopo de projeto
Cada escopo SHALL ser representado pelos campos: `codigo` (`PE-<ano>.<sequencial>`, gerado pelo
servidor), `nome`, `versao`, `ano`, `dataInicio`, `dataFinal`, `dataPrevisao`, `dataPublicacao`,
`status` (`Em Andamento` | `Homologação` | `Concluído` | `Publicado`),
`softwaresContemplados` (nomes derivados dos itens/chamadas), `descricaoGeral`,
`totalVisualizacoes`, `itensCount` (derivado de `entregas_itens`), `arquivada` (persistida no banco),
`criadoEm` e `atualizadoEm`. O status SHALL ser exibido em `UiBadge` com variantes distintas para os
quatro valores. O `codigo`, os carimbos e a contagem de itens SHALL ser gerados pelo sistema, nunca
digitados; o código SHALL ser único.

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

#### Scenario: Arquivamento persiste no banco
- **WHEN** um escopo é arquivado
- **THEN** a marca `arquivada` é gravada no banco e o escopo deixa de ser retornado pela listagem

### Requirement: Softwares contemplados derivados das chamadas
Os **softwares contemplados** NÃO SHALL ser selecionados no formulário. Eles SHALL ser derivados
dos itens vinculados ao escopo, um por software distinto das chamadas — considerando **todos** os
softwares de cada chamada —, e SHALL aparecer no
formulário somente quando houver pelo menos um item (o card exibe a quantidade de itens, não os
softwares). Na inclusão/importação, o escopo nasce sem softwares; eles são preenchidos quando as
chamadas são lançadas no módulo "Lançar as Chamadas". Na edição, a lista é somente leitura e vem da
API com os nomes dos softwares. O JSON `softwares_contemplados` NÃO SHALL ser fonte de verdade; o
backend SHALL derivar a lista de `entregas_itens`/`softwares`. O filtro por **Software** SHALL
oferecer apenas os softwares presentes no conjunto.

#### Scenario: Novo escopo sem softwares
- **WHEN** o usuário abre "Novo Escopo"
- **THEN** não há campo de seleção de softwares e a lista de softwares contemplados não é exibida

#### Scenario: Itens preenchem os softwares
- **WHEN** o escopo recebe chamadas com softwares distintos
- **THEN** a lista de softwares contemplados é preenchida automaticamente, sem repetição

#### Scenario: Chamada com múltiplos softwares
- **WHEN** o escopo recebe uma chamada vinculada a dois softwares
- **THEN** ambos os softwares entram na lista de softwares contemplados, sem repetição

#### Scenario: Edição somente leitura dos softwares
- **WHEN** o usuário edita um escopo que já possui itens
- **THEN** os softwares contemplados aparecem como texto/badges com os nomes retornados pela API,
  sem permitir alteração manual

### Requirement: Listagem em grade de cards
A tela SHALL exibir os escopos em uma **grade de cards** (não em tabela), com busca textual,
ordenação e paginação no cliente sobre o conjunto vigente retornado pela API (`UiPagination`, 6
cards por página). A tela SHALL exibir o cabeçalho e os KPIs mesmo com a lista vazia e SHALL
distinguir base vazia de filtro sem resultado. Os escopos arquivados NÃO SHALL fazer parte do
conjunto exibido. A listagem SHALL ter estados de carregamento e de erro; em falha, a base local
SHALL ficar vazia, sem dados de demonstração.

#### Scenario: Grade de cards
- **WHEN** a tela é exibida com escopos retornados pela API
- **THEN** os escopos aparecem em cards responsivos, com paginação no cliente

#### Scenario: Busca e paginação
- **WHEN** o usuário digita na busca ou troca de página
- **THEN** a grade reflete a busca sobre o conjunto filtrado e a página é ajustada

#### Scenario: Base vazia e filtro sem resultado
- **WHEN** não há escopo cadastrado ou o filtro não retorna resultados
- **THEN** a grade exibe a mensagem correspondente, sem dados fictícios

#### Scenario: Falha ao carregar
- **WHEN** a API de listagem falha
- **THEN** a tela exibe aviso de erro e a grade fica vazia

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
(obrigatório, até 255), **Código** (gerado no servidor no padrão `PE-<ano>.<sequencial>`, único,
somente leitura), **Versão** (obrigatória, até 50), **Ano** (obrigatório, 1900–2100), **Status**
(padrão `Em Andamento`), **Data de Início**, **Data Final**, **Data de Previsão**, **Data de
Publicação** (obrigatórias) e **Descrição Geral**. Os softwares contemplados não são digitados:
são derivados dos itens. O formulário SHALL validar os campos, a ordem `dataFinal >= dataInicio`, o
ano e a unicidade `(ano, versao)`; salvar SHALL chamar a API, incluir o escopo persistido com código
gerado e timestamps do banco, e fechar o modal com aviso de sucesso. Conflito `409` SHALL ser
exibido no campo correspondente.

#### Scenario: Abrir o cadastro com padrões
- **WHEN** o usuário aciona "Novo Escopo"
- **THEN** o modal abre com status `Em Andamento`, ano atual e sem softwares selecionáveis

#### Scenario: Campos obrigatórios
- **WHEN** o usuário tenta salvar sem nome, versão, ano ou datas
- **THEN** o primeiro campo inválido recebe o erro e o foco, e nada é incluído

#### Scenario: Ordem das datas
- **WHEN** a data final é anterior à data de início
- **THEN** o erro é exibido no campo e o escopo não é incluído

#### Scenario: Unicidade ano/versão
- **WHEN** já existe um escopo com o mesmo ano e a mesma versão
- **THEN** a API responde `409` e o formulário exibe o conflito sem incluir o registro

#### Scenario: Inclusão com sucesso
- **WHEN** o usuário salva um formulário válido
- **THEN** o escopo é gravado no banco, entra na grade com o código gerado, o modal fecha e um aviso
  de sucesso é exibido

### Requirement: Edição de escopo de projeto
O sistema SHALL oferecer a ação de linha **Editar**, que abre o mesmo modal preenchido com o
registro, em modo edição, exibindo o **Código** somente leitura e a seção **Informações de Cadastro**
com `criadoEm` e `atualizadoEm` desabilitados. Salvar SHALL chamar a API, atualizar o escopo
persistido e fechar o modal com aviso de sucesso, mantendo o código e os carimbos de criação.
Conflito `409` de `(ano, versao)` SHALL ser exibido no campo correspondente. A ação SHALL respeitar
a permissão de `alterar`.

#### Scenario: Abrir edição preenchida
- **WHEN** o usuário aciona "Editar" em um card
- **THEN** o modal abre preenchido, com Código e carimbos de cadastro somente leitura

#### Scenario: Atualização com sucesso
- **WHEN** o usuário salva alterações válidas
- **THEN** o card reflete os novos dados persistidos, o modal fecha e um aviso de sucesso é exibido

#### Scenario: Código imutável na edição
- **WHEN** o usuário edita um escopo
- **THEN** o código permanece o mesmo e não é editável

#### Scenario: Conflito de ano/versão na edição
- **WHEN** a alteração colide com outro escopo do mesmo ano e versão
- **THEN** a API responde `409` e o formulário exibe o conflito

### Requirement: Publicar e arquivar escopo
O sistema SHALL oferecer as ações **Publicar** e **Arquivar**, ambas com confirmação. Publicar SHALL
alterar o status para `Publicado` e preencher a **Data de Publicação** com a data atual. Arquivar
SHALL marcar o escopo como **arquivado** (`arquivada = true`), sem excluir dados ou itens, e o
escopo arquivado SHALL deixar de aparecer na grade/KPIs. Ambas as ações SHALL chamar a API e
persistir no banco. Publicar SHALL respeitar a permissão de `publicar`; arquivar, a de `arquivar`.

#### Scenario: Publicar altera o status
- **WHEN** o usuário confirma "Publicar"
- **THEN** o status passa a `Publicado`, a data de publicação é preenchida e a grade/KPIs refletem a
  mudança persistida

#### Scenario: Arquivar remove da grade sem excluir
- **WHEN** o usuário confirma "Arquivar"
- **THEN** o escopo é marcado como arquivado no banco, deixa de aparecer na grade e seus dados e
  itens permanecem

#### Scenario: Escopo arquivado não aparece
- **WHEN** a grade é exibida
- **THEN** os escopos arquivados não fazem parte do conjunto retornado nem dos KPIs

### Requirement: Exclusão condicionada de escopo
O sistema SHALL oferecer a ação **Excluir** somente quando o escopo não possuir itens/relacionamentos
vinculados (`itensCount = 0`) e não estiver arquivado. Quando houver itens ou arquivamento, a ação
SHALL ficar indisponível com a indicação acessível do motivo e a API SHALL responder `409` se a
exclusão for tentada. A confirmação SHALL remover o registro persistido e fechar o modal com aviso
de sucesso. A ação SHALL respeitar a permissão de `excluir`.

#### Scenario: Excluir escopo sem itens
- **WHEN** o escopo não possui itens, não está arquivado e o usuário confirma a exclusão
- **THEN** o registro é removido do banco, sai da grade e um aviso de sucesso é exibido

#### Scenario: Escopo com itens não pode ser excluído
- **WHEN** o escopo possui itens vinculados
- **THEN** a ação de exclusão fica desabilitada com o motivo informado e a API recusa com `409`

#### Scenario: Arquivado não aparece para exclusão
- **WHEN** o escopo está arquivado
- **THEN** ele não aparece na grade e a API recusa a exclusão com `409`

### Requirement: Itens do projeto em modal somente leitura
O ícone **Itens** do card SHALL abrir um `UiModal` de largura `xl`, sem criar rota ou página nova,
com os itens do projeto (`entregas_itens` com `projeto_id` vinculado) em modo somente leitura no
componente **`UiDataTable`**: Chamada, Título, Software, Módulo, Tipo, Impacto, Status
(`UiBadge`) e Data de liberação. Os itens SHALL ser carregados sob demanda por
`GET /api/escopo-projetos/:id/itens`, com estados de carregamento, erro e vazio. A grade SHALL
oferecer as funcionalidades do kit — busca, agrupamento por até três colunas, ordenação
multi-coluna, redimensionamento, paginação e totalizadores. Projeto sem itens SHALL exibir o estado
vazio "Nenhum item vinculado a este projeto." O modal SHALL fechar por `Escape`, `X` ou "Fechar". O
CRUD dos itens NÃO SHALL ser oferecido nesta tela. O ícone SHALL ser exibido sob a permissão
`visualizar` do módulo (o catálogo de `escopo-projetos` não possui `visualizar_itens` nesta fase).

#### Scenario: Abrir itens de um projeto com itens
- **WHEN** o usuário aciona o ícone "Itens" de um projeto com itens
- **THEN** a API é consultada, o modal abre em largura `xl` e lista os itens no `UiDataTable`

#### Scenario: Agrupar, ordenar e buscar itens
- **WHEN** o usuário arrasta um cabeçalho para a faixa de agrupamento, clica em um cabeçalho ou usa
  a busca
- **THEN** a grade agrupa, ordena ou filtra os itens conforme a funcionalidade do `UiDataTable`

#### Scenario: Projeto sem itens
- **WHEN** a API retorna lista vazia para um projeto
- **THEN** o modal exibe o estado vazio informando que não há itens

#### Scenario: Falha ao carregar itens
- **WHEN** a API de itens falha
- **THEN** o modal exibe uma mensagem de erro e permite tentar novamente

#### Scenario: Fechar o modal
- **WHEN** o usuário aciona "Fechar", `Escape` ou o `X`
- **THEN** o modal fecha e a grade permanece no estado anterior

### Requirement: Exportações PDF e CSV
A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a **listagem em PDF** e a **exportação em
CSV** do conjunto retornado pela API, com as colunas Código, Nome, Versão, Ano, Status, Período,
Softwares e Visualizações. Antes de gerar, a tela SHALL consultar `GET /api/escopo-projetos?exportar=1`
para validar a permissão `exportar`. O CSV SHALL usar `;` com BOM UTF-8 e neutralizar fórmulas de
planilha; falhas na geração SHALL produzir aviso de erro sem interromper a tela. Em caso de lista
vazia, a exportação SHALL informar que não há dados.

#### Scenario: Exportar o conjunto filtrado
- **WHEN** o usuário escolhe "Exportar em CSV" ou "Listagem em PDF"
- **THEN** a API valida a permissão e o arquivo é gerado com os escopos do conjunto filtrado e as
  colunas da grade

#### Scenario: Exportação sem permissão
- **WHEN** o perfil não possui `exportar`
- **THEN** o menu de relatórios não é exibido ou a API responde `403`

#### Scenario: Falha na exportação
- **WHEN** a geração falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

### Requirement: A matriz RBAC controla a interface
A tela SHALL usar o helper reativo `.can('escopo-projetos', acao)` para exibir/ocultar as ações:
Editar (`alterar`), Excluir (`excluir`), Publicar (`publicar`), Arquivar (`arquivar`), Exportar
(`exportar`), Importar (`importar`), Filtros (`filtrar`), busca (`buscar`) e o ícone de Itens
(`visualizar`). A mesma matriz SHALL ser aplicada pela API em cada rota. A matriz SHALL ser a mesma
do catálogo atual do módulo `escopo-projetos`; nenhuma funcionalidade nova de RBAC é criada nesta
fase.

#### Scenario: Ação não concedida fica oculta
- **WHEN** o perfil não concede a ação correspondente no módulo
- **THEN** o controle/ação não é exibido na tela e a API recusa a operação com `403`

#### Scenario: Itens exigem visualizar
- **WHEN** o perfil não concede `escopo-projetos`/`visualizar`
- **THEN** o ícone de itens não é exibido e a API de itens recusa a consulta

### Requirement: A publicação do escopo publica as chamadas filhas

Ao publicar um escopo de projetos, o sistema SHALL, na mesma transação, alterar para `Publicado` as
chamadas vinculadas por `projeto_id` que estejam em `Publicar`. Chamadas em `Revisar`, `Aprovado` ou
`Recusado` NÃO SHALL ser publicadas pela cascata. Cada chamada alterada SHALL receber uma linha em
`historico_esteira_revisao` com status anterior `Publicar`, novo status `Publicado`, o responsável
pela publicação do escopo e parecer indicando a publicação automática pelo conteúdo pai. A auditoria
SHALL ser registrada uma única vez na publicação do escopo. A `data_liberacao` das chamadas SHALL ser
preservada. Quando o escopo deixar de estar `Publicado` por edição ou reabertura, as chamadas filhas
em `Publicado` que não tenham outro vínculo ativo publicado SHALL voltar para `Publicar` e receber a
transição no histórico. Arquivar o escopo NÃO SHALL alterar o status das chamadas filhas; a
visibilidade pública passa a exigir que o conteúdo pai esteja `Publicado` e não arquivado.

#### Scenario: Publicar com chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em um escopo que possui chamadas filhas em `Publicar`
- **THEN** o escopo passa a `Publicado`, as filhas passam a `Publicado` e cada uma recebe histórico

#### Scenario: Publicar sem chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em um escopo sem chamadas em `Publicar`
- **THEN** o escopo passa a `Publicado` e nenhuma chamada é alterada

#### Scenario: Chamada em revisão não é publicada

- **WHEN** o escopo é publicado e possui chamadas filhas em `Revisar`, `Aprovado` ou `Recusado`
- **THEN** essas chamadas preservam o status e não ficam visíveis no portal

#### Scenario: Reabrir o escopo despublica as filhas

- **WHEN** o escopo deixa de estar `Publicado` por edição ou reabertura
- **THEN** as chamadas filhas em `Publicado` sem outro pai publicado voltam para `Publicar` e recebem histórico

#### Scenario: Múltiplos vínculos preservam a filha publicada

- **WHEN** uma chamada em `Publicado` tem vínculos com o escopo reaberto e com outro conteúdo pai ainda `Publicado`
- **THEN** a chamada permanece em `Publicado`

#### Scenario: Arquivar não altera as filhas

- **WHEN** o escopo é arquivado
- **THEN** o status das chamadas filhas é preservado e a visibilidade pública passa a considerá-las fora do portal por o pai estar arquivado
