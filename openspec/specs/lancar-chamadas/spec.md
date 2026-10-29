# lancar-chamadas Specification

## Purpose

Definir a tela administrativa de Lançar as Chamadas com persistência em `entregas_itens`: lançamento
e manutenção dos itens, vínculo obrigatório a Release, Projeto ou Manual, origem derivada, listagem
filtrável, KPIs por status, detalhes, aprovação, desaprovação, recusa, exclusão condicionada, importação XLSX,
upload de imagens e relatórios.

## Requirements

### Requirement: A tela de Lançar as Chamadas é acessível pela Área Administrativa

O sistema SHALL expor a tela em `/admin/lancar-chamadas`, renderizada dentro do shell da Área
Administrativa (header + sidebar). A tela SHALL ser alcançável pelo item **Lançar as Chamadas** da
sessão **Movimentos** da sidebar, que passa a declarar a rota e a exibir o estado ativo quando a rota
corrente for `/admin/lancar-chamadas`. O acesso SHALL estar sujeito à guarda de sessão das demais
telas administrativas.

#### Scenario: Navegar pelo item da sidebar

- **WHEN** o usuário autenticado aciona "Lançar as Chamadas" na sidebar
- **THEN** o navegador vai para `/admin/lancar-chamadas` e o item aparece ativo com `aria-current="page"`

#### Scenario: Chegar por URL direta

- **WHEN** o usuário autenticado abre `/admin/lancar-chamadas` diretamente
- **THEN** a tela renderiza com o shell administrativo e o item da sidebar aparece ativo

#### Scenario: Sem sessão

- **WHEN** um visitante sem sessão abre `/admin/lancar-chamadas`
- **THEN** ele é levado ao login administrativo, como nas demais rotas protegidas

### Requirement: A listagem apresenta as chamadas com busca, filtros, ordenação e paginação

A tela SHALL listar as chamadas em `UiDataTable` com as colunas **Chamada**, **Título**, **Software**,
**Módulo**, **Tipo**, **Impacto**, **Status**, **Data de lançamento** e **Data de liberação**. A busca SHALL operar sobre chamada, título, descrição, solução, software, módulo, menu
funcionalidade, parceiro, tags e código da release. A busca SHALL operar somente sobre o texto puro das
descrições, nunca sobre a marcação HTML. A listagem SHALL ser ordenada por **chamada**
(crescente, com comparação numérica natural) e a paginação SHALL ocorrer **no servidor**, com
`pagina` e `porPagina` validados e limitados; a resposta SHALL trazer a página corrente e o total do
conjunto filtrado. A listagem NÃO SHALL materializar as colunas de texto rico, solução, imagens e tags
completas: esses dados SHALL ser carregados sob demanda no detalhe. A tabela SHALL distinguir base
vazia de conjunto filtrado sem resultados.

#### Scenario: Listagem com dados

- **WHEN** a tela é aberta com chamadas no conjunto
- **THEN** as chamadas são exibidas nas colunas definidas, com as datas formatadas em `dd/mm/aaaa`

#### Scenario: Paginação no servidor

- **WHEN** o usuário troca de página ou altera a quantidade de linhas
- **THEN** a API recebe `pagina`/`porPagina`, devolve apenas a página solicitada com o total do conjunto e a tabela exibe os controles derivados desse total

#### Scenario: Ordenação por chamada

- **WHEN** a listagem é exibida sem ordenação manual do usuário
- **THEN** as chamadas aparecem em ordem crescente de `chamada`, sem considerar `ordem_apresentacao`

#### Scenario: Busca textual

- **WHEN** o usuário digita um termo que corresponde a chamada, título, descrição, solução, software, módulo, parceiro, tag ou release
- **THEN** a tabela exibe apenas as chamadas correspondentes e recalcula os KPIs

#### Scenario: Busca ignora a marcação

- **WHEN** a descrição possui formatação (negrito, cor ou tamanho) e o usuário busca por uma palavra do texto
- **THEN** a chamada é encontrada, e um termo de marcação como `strong` ou `span` não produz correspondência

#### Scenario: Base vazia

- **WHEN** não há chamadas no conjunto e nenhum filtro está ativo
- **THEN** a tabela informa que não há chamadas cadastradas

#### Scenario: Filtro sem resultado

- **WHEN** há chamadas no conjunto, mas os filtros ou a busca não retornam nenhuma
- **THEN** a tabela informa que nenhum resultado foi encontrado para o filtro

### Requirement: O modal de filtros refina a listagem e os KPIs

A tela SHALL oferecer um modal de filtros em **três colunas a partir de `sm`** com **Status**,
**Tipo**, **Impacto**, **Software**, **Parceiro**, **Origem**, **Período de lançamento** (De/Até) e
**Período de liberação** (De/Até), vazio = todos, além dos botões "Limpar Filtros", "Cancelar" e
"Aplicar". O filtro **Software** SHALL aceitar um ou mais softwares e a chamada SHALL corresponder
quando possuir ao menos um dos softwares selecionados. Os períodos SHALL
ser inclusivos e comparados com as datas civis `AAAA-MM-DD`; chamadas sem data de liberação NÃO SHALL
corresponder a um filtro de período de liberação. "Aplicar" SHALL refinar a listagem e os KPIs;
"Limpar Filtros" SHALL zerar rascunho e estado. A toolbar SHALL indicar a quantidade de filtros
ativos.

#### Scenario: Aplicar filtros

- **WHEN** o usuário seleciona filtros e aciona "Aplicar"
- **THEN** a listagem e os KPIs passam a considerar apenas as chamadas correspondentes

#### Scenario: Filtrar por múltiplos softwares

- **WHEN** o usuário seleciona dois softwares no filtro e aciona "Aplicar"
- **THEN** a listagem exibe as chamadas que possuem ao menos um dos softwares selecionados

#### Scenario: Filtrar por período de lançamento

- **WHEN** o usuário informa "De" e/ou "Até" no período de lançamento
- **THEN** a listagem exibe apenas as chamadas cuja data de lançamento está dentro do intervalo inclusivo

#### Scenario: Filtrar por período de liberação

- **WHEN** o usuário informa "De" e/ou "Até" no período de liberação
- **THEN** a listagem exibe apenas as chamadas com data de liberação dentro do intervalo inclusivo

#### Scenario: Limpar filtros

- **WHEN** o usuário aciona "Limpar Filtros"
- **THEN** todos os filtros são removidos e a listagem volta ao conjunto completo

#### Scenario: Rascunho isolado

- **WHEN** o usuário abre o modal, altera filtros e cancela
- **THEN** nenhuma alteração é aplicada ao conjunto vigente

### Requirement: A tela exibe quatro KPIs por status

A tela SHALL exibir quatro indicadores calculados sobre o conjunto vigente (filtrado, quando houver
filtro): **Total**, **Revisar**, **Aprovado** e **Recusado**. Os KPIs SHALL usar as cores e ícones do
design system e SHALL ser recalculados após busca, filtros e alterações.

#### Scenario: Contagem por status

- **WHEN** o conjunto contém chamadas em status distintos
- **THEN** cada KPI exibe a contagem correspondente e o Total exibe a soma de todas

#### Scenario: KPI acompanha o filtro

- **WHEN** o usuário aplica um filtro de status
- **THEN** os KPIs são recalculados sobre o conjunto filtrado

### Requirement: O cadastro exige vínculo e deriva a origem

O sistema SHALL exigir que toda chamada tenha pelo menos um vínculo: **Release**, **Projeto** ou
**Manual**. A origem SHALL ser derivada dos vínculos e exibida somente leitura, sem campo editável:
um vínculo com Release resulta em `Release`; com Projeto, `Projeto`; com Manual, `Manual`; dois ou
mais vínculos resultam em `Ambos`. O formulário SHALL impedir o salvamento quando nenhum vínculo for
selecionado.

#### Scenario: Apenas Release

- **WHEN** a chamada é vinculada somente a uma release
- **THEN** a origem exibida e persistida é `Release`

#### Scenario: Apenas Projeto

- **WHEN** a chamada é vinculada somente a um projeto
- **THEN** a origem exibida e persistida é `Projeto`

#### Scenario: Apenas Manual

- **WHEN** a chamada é vinculada somente a um manual
- **THEN** a origem exibida e persistida é `Manual`

#### Scenario: Dois ou mais vínculos

- **WHEN** a chamada é vinculada a duas ou mais origens
- **THEN** a origem exibida e persistida é `Ambos`

#### Scenario: Nenhum vínculo

- **WHEN** o usuário tenta salvar sem Release, Projeto ou Manual
- **THEN** o formulário exibe erro no campo de vínculo, mantém o modal aberto e não grava a chamada

### Requirement: O cadastro e a edição usam um wizard em quatro etapas

O formulário de cadastro/edição SHALL ser organizado em um wizard de quatro etapas, nesta ordem:
**Vínculos e origem**, **Identificação**, **Classificação** e **Conteúdo e mídias**. A primeira etapa
SHALL ser sempre Vínculos e origem. O usuário SHALL avançar somente quando os campos obrigatórios da
etapa atual estiverem válidos, SHALL poder voltar às etapas anteriores sem perder o rascunho e SHALL
salvar apenas na última etapa. O indicador de etapas SHALL expor a etapa corrente de forma acessível.

#### Scenario: Abertura na primeira etapa

- **WHEN** o usuário abre "Nova Chamada" ou "Editar"
- **THEN** o wizard inicia na etapa "Vínculos e origem" e exibe o indicador "Etapa 1 de 4"

#### Scenario: Avançar com a etapa válida

- **WHEN** o usuário preenche os campos obrigatórios da etapa atual e aciona "Próximo"
- **THEN** o wizard avança para a próxima etapa

#### Scenario: Bloqueio por erro na etapa

- **WHEN** a etapa atual possui erro de validação e o usuário aciona "Próximo"
- **THEN** o wizard permanece na etapa, exibe o erro e foca o primeiro campo inválido

#### Scenario: Navegar pelo indicador de etapas

- **WHEN** o usuário aciona o indicador de qualquer etapa, inclusive uma etapa posterior
- **THEN** o wizard vai diretamente para a etapa escolhida, sem exigir o clique em "Próximo", mantendo os valores preenchidos

#### Scenario: Voltar sem perder o rascunho

- **WHEN** o usuário aciona "Anterior"
- **THEN** o wizard retorna à etapa anterior mantendo os valores preenchidos

#### Scenario: Salvar na última etapa

- **WHEN** o usuário está na etapa "Conteúdo e mídias" e aciona "Salvar Chamada"
- **THEN** o formulário valida todas as etapas e, se não houver erro, grava a chamada

### Requirement: O formulário cobre os campos de `entregas_itens`

O formulário SHALL permitir informar **Chamada**, **Título**, **Data de lançamento**, **Data de
liberação**, **Release**, **Projeto**, **Manual**, **Software**, **Parceiro**, **Módulo**, **Menu
funcionalidade**, **Tipo**, **Impacto**, **Descrição completa**, **Solução**, **Título do manual**,
**Link do manual**, **Link do vídeo**, **Tags** e **Imagens**. O campo **Situação** NÃO SHALL ser
exibido nem enviado no formulário. As tags SHALL ficar na etapa **Classificação**. O autor SHALL
ser preenchido a partir da sessão e exibido somente leitura. Os campos de texto `release`, `software`
e `parceiro` SHALL ser derivados dos catálogos selecionados, nunca digitados em paralelo. Ao
selecionar uma Release, a **Data de liberação** SHALL ser preenchida com a `dataPublicacao` da release
selecionada, permanecendo **somente leitura**. Novas chamadas SHALL nascer com status `Revisar`; o status NÃO
SHALL ser editável no formulário. A **Descrição completa** e a **Solução** SHALL ficar na etapa
**Conteúdo e mídias** e SHALL aceitar formatação de texto rico; a **Solução** SHALL ser opcional.

#### Scenario: Nova chamada

- **WHEN** o usuário abre "Nova Chamada" e preenche os dados obrigatórios
- **THEN** o formulário inicia com status `Revisar`, tipo `Correção` e impacto `Médio`

#### Scenario: Edição

- **WHEN** o usuário abre uma chamada existente para editar
- **THEN** o formulário vem preenchido, o status aparece somente leitura e a seção de cadastro exibe autor, criação e atualização

#### Scenario: Textos derivados dos catálogos

- **WHEN** o usuário seleciona release, software e parceiro
- **THEN** os textos correspondentes são preenchidos a partir das opções selecionadas e não podem ser editados separadamente

#### Scenario: Data de liberação herdada da Release

- **WHEN** o usuário seleciona uma Release que possui data de publicação
- **THEN** o campo Data de liberação é preenchido com essa data e permanece somente leitura

#### Scenario: Tags na classificação

- **WHEN** o usuário abre a etapa Classificação
- **THEN** o campo de Tags está disponível nessa etapa, e não em Conteúdo e mídias

#### Scenario: Título do manual no conteúdo

- **WHEN** o usuário abre a etapa Conteúdo e mídias
- **THEN** o formulário exibe os campos "Descrição completa", "Solução" e "Título do manual" junto dos links

#### Scenario: Solução é opcional

- **WHEN** o usuário preenche os demais campos obrigatórios e deixa a Solução vazia
- **THEN** o formulário salva a chamada sem erro no campo Solução

#### Scenario: Colar imagem da área de transferência

- **WHEN** o usuário copia uma imagem e pressiona `Ctrl` + `V` em qualquer ponto da etapa Conteúdo e mídias
- **THEN** a imagem é validada e incorporada à galeria sem exigir gravação local ou seleção de arquivo

### Requirement: A validação impede dados inválidos

O sistema SHALL validar, no cliente, os campos antes de salvar: **Chamada** obrigatória, com no máximo 60 caracteres e sem duplicidade no conjunto carregado; **Título** obrigatório, com no máximo 255 caracteres; **Software**, **Parceiro**, **Módulo** e **Descrição completa** obrigatórios; **Módulo** com no máximo 100 caracteres; **Título do manual** com no máximo 255 caracteres; **Data de lançamento** obrigatória e qualquer data civil válida; **Data de liberação** opcional e, quando preenchida, qualquer data civil válida — sem exigência de segunda-feira ou próximo dia útil; links com URL `http(s)` quando informados; no máximo 12 tags, cada uma com até 30 caracteres; no máximo 100 imagens por chamada, nos formatos PNG, JPG ou WebP, com até 5 MB por arquivo, tanto por seleção quanto por colagem. A obrigatoriedade da **Descrição completa** SHALL considerar o texto puro derivado do conteúdo rico: uma descrição que renderiza vazia SHALL ser tratada como ausente. A **Solução**, quando informada, SHALL respeitar um teto de tamanho em texto puro. O primeiro erro SHALL receber foco e permanecer visível no campo.

#### Scenario: Campos obrigatórios ausentes

- **WHEN** o usuário tenta salvar sem chamada, título, software, parceiro, módulo, descrição, vínculo ou data de lançamento
- **THEN** o formulário exibe os erros, foca o primeiro campo inválido e não grava

#### Scenario: Data fora de segunda-feira

- **WHEN** a Data de liberação informada é uma terça, quinta, sexta, sábado ou domingo válidos, ou seja, fora de segunda-feira
- **THEN** o campo é aceito e o formulário permite gravar

#### Scenario: Data de liberação malformada

- **WHEN** a Data de liberação informada não é uma data civil válida
- **THEN** o campo exibe erro e o formulário não grava

#### Scenario: Descrição formatada vazia

- **WHEN** o usuário aplica apenas formatação sem digitar texto na Descrição completa
- **THEN** o formulário acusa a Descrição completa como obrigatória e não grava

#### Scenario: Chamada duplicada

- **WHEN** o usuário informa uma chamada já existente no conjunto carregado
- **THEN** o formulário exibe erro de duplicidade e não grava

#### Scenario: Link inválido

- **WHEN** o usuário informa um link que não é `http(s)`
- **THEN** o campo exibe erro e o formulário não grava

#### Scenario: Limites de tags e imagens

- **WHEN** o usuário ultrapassa 12 tags, 30 caracteres por tag, 100 imagens ou envia imagem fora dos formatos/tamanho aceitos
- **THEN** o formulário informa o limite e não incorpora o excedente

### Requirement: O cadastro e a edição atualizam a listagem

Salvar uma nova chamada SHALL incluí-la no topo da listagem; salvar uma edição SHALL substituir o
registro correspondente. Em ambos os casos, os KPIs SHALL ser recalculados e o modal SHALL fechar com
aviso de sucesso. Cancelar SHALL fechar o modal sem alterar o conjunto.

#### Scenario: Inclusão

- **WHEN** o usuário salva uma nova chamada válida
- **THEN** a chamada aparece na listagem, os KPIs são recalculados e o modal fecha com aviso de sucesso

#### Scenario: Edição

- **WHEN** o usuário salva alterações de uma chamada existente
- **THEN** a linha correspondente reflete os novos dados e o modal fecha com aviso de sucesso

#### Scenario: Cancelar

- **WHEN** o usuário cancela o formulário
- **THEN** o modal fecha e nenhum dado é alterado

### Requirement: A aprovação altera o status da chamada

A tela SHALL oferecer a ação **Aprovar**, com confirmação, que altera o status da chamada para
`Aprovado`. A ação SHALL ser exibida sob a permissão `publicar` (única funcionalidade de fluxo do
catálogo atual) e SHALL ficar desabilitada com motivo quando o status não for `Revisar`.

#### Scenario: Aprovar chamada

- **WHEN** o usuário confirma a aprovação de uma chamada com status `Revisar`
- **THEN** o status passa a `Aprovado` e a listagem é atualizada

#### Scenario: Já aprovada, recusada ou publicada

- **WHEN** a chamada está com status `Aprovado`, `Recusado`, `Publicar` ou `Publicado`
- **THEN** a ação fica desabilitada e informa o motivo

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`publicar`
- **THEN** a ação não é exibida

### Requirement: A recusa altera o status da chamada

A tela SHALL oferecer a ação **Recusar**, com confirmação, que altera o status da chamada para
`Recusado`. A ação SHALL ser exibida sob a permissão `alterar` e SHALL ficar desabilitada com motivo
quando o status não for `Revisar`.

#### Scenario: Recusar chamada

- **WHEN** o usuário confirma a recusa de uma chamada com status `Revisar`
- **THEN** o status passa a `Recusado` e a listagem é atualizada

#### Scenario: Já aprovada, recusada ou publicada

- **WHEN** a chamada está com status `Aprovado`, `Recusado`, `Publicar` ou `Publicado`
- **THEN** a ação fica desabilitada e informa o motivo

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`alterar`
- **THEN** a ação não é exibida

### Requirement: A exclusão é condicionada ao status e ao histórico

A tela SHALL permitir excluir uma chamada somente quando o status for `Revisar` e a chamada não
possuir histórico na esteira de revisão. Caso contrário, a ação SHALL ficar desabilitada com motivo
acessível. A exclusão SHALL exigir confirmação e, quando concluída, remover a chamada da listagem e
recalcular os KPIs.

#### Scenario: Exclusão permitida

- **WHEN** a chamada está em `Revisar` e sem histórico e o usuário confirma a exclusão
- **THEN** a chamada é removida da listagem e os KPIs são recalculados

#### Scenario: Exclusão bloqueada por status

- **WHEN** a chamada está em `Aprovado`, `Recusado`, `Publicar` ou `Publicado`
- **THEN** a ação de excluir fica desabilitada e informa que a chamada já avançou na esteira

#### Scenario: Exclusão bloqueada por histórico

- **WHEN** a chamada possui histórico na esteira de revisão
- **THEN** a ação de excluir fica desabilitada e informa o motivo

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`excluir`
- **THEN** a ação não é exibida

### Requirement: Os detalhes exibem a chamada em modo somente leitura

A tela SHALL oferecer a ação **Detalhes**, que abre um modal `xl` somente leitura com identificação,
classificação, vínculos/origem, descrição completa, solução, título do manual, links, tags, imagens,
autor e timestamps. A descrição e a solução SHALL ser exibidas com a formatação salva, a partir do
HTML sanitizado, caindo para o texto puro quando não houver HTML. O modal SHALL fechar por `Escape`,
pelo `X` ou por "Fechar".

#### Scenario: Abrir detalhes

- **WHEN** o usuário aciona "Detalhes" em uma chamada
- **THEN** o modal exibe todos os dados da chamada sem campos editáveis

#### Scenario: Detalhes com texto formatado

- **WHEN** a chamada possui Descrição ou Solução com formatação rica
- **THEN** o modal exibe o texto com negrito, cor e tamanho preservados

#### Scenario: Detalhes de registro legado

- **WHEN** a chamada não possui HTML salvo (registro anterior ou importado)
- **THEN** o modal exibe o texto puro preservando as quebras de linha

#### Scenario: Fechar detalhes

- **WHEN** o usuário pressiona `Escape`, aciona o `X` ou "Fechar"
- **THEN** o modal fecha e o foco retorna ao acionador

### Requirement: A tela oferece relatórios PDF e CSV

A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a listagem em **PDF** e a exportação em
**CSV** do conjunto vigente, com as colunas da listagem. As ações SHALL ser exibidas sob a permissão
`download`. O CSV SHALL usar `;` com BOM UTF-8 e neutralizar fórmulas de planilha. Com o conjunto
vazio, a tela SHALL informar que não há dados e não gerar arquivo.

#### Scenario: Exportar PDF

- **WHEN** o usuário aciona "Listagem em PDF" com dados no conjunto
- **THEN** um arquivo PDF é gerado com o título do módulo, a data, a contagem e as colunas da listagem

#### Scenario: Exportar CSV

- **WHEN** o usuário aciona "Exportar em CSV" com dados no conjunto
- **THEN** um arquivo CSV é gerado com separador `;`, BOM UTF-8 e fórmulas neutralizadas

#### Scenario: Conjunto vazio

- **WHEN** o usuário aciona uma exportação sem dados
- **THEN** a tela informa que não há dados e nenhum arquivo é gerado

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`download`
- **THEN** o menu "Relatórios" não é exibido

### Requirement: A interface respeita a matriz RBAC do módulo

A tela SHALL usar o helper reativo `.can('lancar-chamadas', ação)` para exibir ou ocultar as ações:
**criar** (Nova Chamada), **alterar** (Editar e Recusar), **excluir** (Excluir), **publicar** (Aprovar),
**download** (Relatórios), **filtrar** (Filtros), **buscar** (campo de busca) e **importar**
(Importar). A tela SHALL ser acessível apenas com **visualizar**, e o item da sidebar SHALL seguir a
mesma regra. As rotas de API do módulo SHALL validar as mesmas permissões no servidor, incluindo
`importar` para a importação XLSX e `download` para a exportação.

#### Scenario: Perfil com visualizar e sem criar

- **WHEN** o perfil concede `visualizar` mas não `criar`
- **THEN** a tela abre e o botão "Nova Chamada" não é exibido

#### Scenario: Perfil sem filtrar ou buscar

- **WHEN** o perfil não concede `filtrar` ou `buscar`
- **THEN** o botão de filtros ou o campo de busca correspondente não é exibido

#### Scenario: Perfil sem importar

- **WHEN** o perfil concede `visualizar` mas não `importar`
- **THEN** a ação "Importar" não é exibida e a rota de importação responde `403`

#### Scenario: Perfil sem visualizar

- **WHEN** o perfil não concede `lancar-chamadas`/`visualizar`
- **THEN** o item da sidebar não é exibido e a tela não é acessível por esse perfil

### Requirement: A tela é utilizável em telas estreitas

A tela SHALL manter a tabela com rolagem horizontal quando as colunas não couberem, SHALL empilhar os
KPIs e os campos do formulário em uma coluna em telas estreitas, e SHALL manter os modais utilizáveis
sem overflow horizontal na viewport.

#### Scenario: Tabela em tela estreita

- **WHEN** a tela é exibida em 375px
- **THEN** a tabela permite rolagem horizontal e as ações continuam acessíveis

#### Scenario: Formulário em tela estreita

- **WHEN** o formulário é aberto em 375px
- **THEN** os campos ficam em uma coluna e os botões de salvar/cancelar permanecem visíveis

### Requirement: A coluna de Ações permanece visível na rolagem horizontal

A listagem de Lançar as Chamadas SHALL manter a coluna **Ações** fixa à direita enquanto a tabela for rolada horizontalmente, preservando o acesso a Detalhes, Editar, Excluir e ao menu de demais ações sem exigir rolagem até o fim da grade. O cabeçalho, as linhas e o rodapé da coluna SHALL permanecer alinhados, com fundo opaco e separação visual sutil do conteúdo rolado, e a fixação NÃO SHALL introduzir rolagem horizontal na página.

#### Scenario: Ações visíveis em desktop com rolagem horizontal

- **WHEN** a listagem é exibida em uma largura em que as colunas não cabem e o usuário rola a tabela horizontalmente
- **THEN** a coluna Ações permanece visível à direita, com os controles de cada linha alinhados e acionáveis

#### Scenario: Ações visíveis em tela estreita

- **WHEN** a listagem é exibida em 375px e o usuário rola a tabela horizontalmente
- **THEN** a coluna Ações continua visível à direita e seus controles permanecem alcançáveis por toque e teclado

#### Scenario: Sem overflow na página

- **WHEN** a coluna Ações está fixa e a tabela é rolada até os extremos
- **THEN** a página não ganha rolagem horizontal própria e o conteúdo da última coluna de dados não fica oculto de forma permanente pela coluna fixa

### Requirement: O backend persiste as chamadas em `entregas_itens`

A tela SHALL ler e gravar as chamadas pela API, sem dataset em memória. A API SHALL listar as
chamadas persistidas, criar com status inicial `Revisar`, editar, aprovar para `Aprovado`, recusar
para `Recusado` e excluir somente quando o status permitir. A API SHALL persistir as transições de
publicação realizadas pela Esteira ou pela cascata do conteúdo pai, que podem resultar em `Publicar`
(aguardando pai) ou `Publicado`. A gravação SHALL preencher os campos de `entregas_itens`, incluindo
`manual_titulo`, `descricao_html`, `solucao` e `solucao_html`, e SHALL manter os textos derivados de
release, projeto, manual, software, parceiro, módulo e menu como snapshot da chamada. O HTML recebido
SHALL ser sanitizado no servidor e o texto puro de `descricao_completa` e `solucao` SHALL ser
derivado desse HTML, preservando as quebras de linha; sem HTML, o servidor SHALL usar o texto puro
recebido. O valor de `chamada` SHALL ser único; duplicatas SHALL ser rejeitadas com `409`, e registros
inexistentes com `404`. Toda escrita SHALL gerar auditoria com o recurso e a ação correspondentes.

#### Scenario: Cadastro persiste e sobrevive ao recarregamento

- **WHEN** o usuário cria uma chamada válida e recarrega a página
- **THEN** a chamada aparece na listagem com os mesmos dados, status `Revisar` e a data de criação

#### Scenario: Formatação persiste

- **WHEN** o usuário salva uma chamada com Descrição ou Solução formatadas e recarrega a página
- **THEN** o HTML sanitizado e o texto puro correspondente são relidos e a formatação é exibida novamente

#### Scenario: Conteúdo malicioso é neutralizado

- **WHEN** o payload de gravação contém marcação fora da allowlist (ex.: `script`, evento ou `style` não permitido)
- **THEN** o servidor grava apenas a marcação permitida e o conteúdo executável é removido

#### Scenario: Edição persiste

- **WHEN** o usuário altera uma chamada existente e salva
- **THEN** a listagem e os detalhes exibem os novos valores após recarregar a página

#### Scenario: Aprovação e recusa persistem

- **WHEN** o usuário aprova, recusa ou publica uma chamada
- **THEN** o novo status é gravado no banco e permanece após recarregar a página

#### Scenario: Chamada duplicada

- **WHEN** o usuário tenta salvar uma chamada com um número de `chamada` já existente
- **THEN** a API responde `409` e a tela exibe a mensagem de duplicidade sem perder os dados do formulário

#### Scenario: Chamada inexistente

- **WHEN** a API recebe edição, aprovação, recusa, publicação ou exclusão de um id inexistente
- **THEN** responde `404` e não altera nenhum registro

### Requirement: O backend expõe catálogos e resolve os vínculos

A API SHALL oferecer uma rota de opções com as releases, projetos, manuais, softwares e parceiros
disponíveis. Ao criar ou editar, a API SHALL resolver os vínculos por id, incluindo **um ou mais
softwares por código**, derivar a origem
(`Release`, `Projeto`, `Manual` ou `Ambos`) a partir dos vínculos, herdar a data de liberação da
release quando ela não for informada, e rejeitar com `400` vínculos inexistentes ou incompatíveis. A resposta SHALL conter os dados necessários para a listagem, os KPIs, os detalhes e
os relatórios.

#### Scenario: Catálogos disponíveis

- **WHEN** a tela carrega com `visualizar`
- **THEN** a API retorna as opções ativas usadas pelos filtros e pelo formulário

#### Scenario: Origem derivada

- **WHEN** o usuário seleciona apenas um projeto
- **THEN** a chamada é gravada com a origem derivada `Projeto`

#### Scenario: Múltiplos softwares resolvidos

- **WHEN** a chamada informa dois códigos de software existentes
- **THEN** a API resolve ambos e grava a chamada com os dois vínculos

#### Scenario: Data de liberação herdada

- **WHEN** o usuário seleciona uma release e deixa a data de liberação vazia
- **THEN** a chamada é gravada com a data de publicação da release

#### Scenario: Vínculo inválido

- **WHEN** a API recebe um id de release, projeto, manual, software ou parceiro inexistente
- **THEN** responde `400` e não grava a chamada

### Requirement: A importação XLSX cria chamadas em lote

A tela SHALL oferecer a ação **Importar**, visível apenas com `lancar-chamadas`/`importar`, que aceita um arquivo `.xlsx` no modelo versionado e apresenta um preview antes de confirmar. O preview SHALL classificar cada linha como `pronto`, `já cadastrado`, `repetido` ou `inválido` e exibir os erros por linha e coluna. O servidor SHALL revalidar as linhas e os vínculos, rejeitar payload fora do contrato, limitar a importação a 500 linhas e gravar todas as linhas válidas em uma única transação. Linhas inválidas, duplicadas ou já cadastradas SHALL impedir a importação completa, sem gravação parcial. As chamadas importadas SHALL nascer com status `Revisar`, SHALL resolver release, projeto, manual, **um ou mais softwares separados por `;`** e parceiro pelos códigos da planilha, SHALL aceitar múltiplas tags separadas por `;` e NÃO SHALL importar imagens, status ou situação. As datas de lançamento e de liberação SHALL ser datas ISO válidas; a Data de lançamento e a Data de liberação SHALL aceitar qualquer data civil válida, sem regra de segunda-feira; quando a Data de liberação vier vazia, o preview SHALL herdá-la da `data_publicacao` do vínculo selecionado na ordem Release, Manual e Projeto; uma linha com data inválida SHALL ser classificada como `inválida` e bloquear a importação completa.

#### Scenario: Importação válida

- **WHEN** o usuário importa um arquivo com linhas válidas e confirma o preview
- **THEN** todas as chamadas são criadas com status `Revisar` e os vínculos resolvidos pelos códigos

#### Scenario: Data de lançamento em qualquer dia

- **WHEN** a planilha traz uma data de lançamento válida em uma terça-feira
- **THEN** a linha é classificada como `pronto` e a chamada pode ser importada

#### Scenario: Data de liberação em qualquer dia

- **WHEN** a planilha traz uma Data de liberação válida em uma terça-feira
- **THEN** a linha é classificada como `pronto` e a chamada pode ser importada

#### Scenario: Liberação herdada do vínculo na planilha

- **WHEN** a linha vem sem Data de liberação e o vínculo selecionado possui `data_publicacao`
- **THEN** o preview preenche a Data de liberação com essa data, priorizando Release, depois Manual e depois Projeto

#### Scenario: Software múltiplo na planilha

- **WHEN** a coluna Software da linha traz dois códigos separados por `;`
- **THEN** a chamada é criada com os dois softwares vinculados

#### Scenario: Linha já cadastrada

- **WHEN** o arquivo contém um número de `chamada` já existente no banco
- **THEN** o preview marca a linha como `já cadastrado` e a confirmação não grava nenhuma linha

#### Scenario: Linhas repetidas no arquivo

- **WHEN** o arquivo contém o mesmo número de `chamada` em mais de uma linha
- **THEN** o preview marca as ocorrências como `repetido` e a importação é bloqueada

#### Scenario: Linha inválida

- **WHEN** o arquivo contém campo obrigatório vazio, código de vínculo inexistente ou data malformada
- **THEN** o preview marca a linha como `inválida`, indica o erro e a importação completa é bloqueada

#### Scenario: Limite de linhas

- **WHEN** o arquivo contém mais de 500 linhas de dados
- **THEN** a importação é rejeitada antes de qualquer gravação

#### Scenario: Sem permissão de importação

- **WHEN** um perfil sem `importar` envia o arquivo para a rota de importação
- **THEN** a API responde `403` e nenhuma chamada é criada

### Requirement: O upload de imagens grava em `uploads/chamadas/<ano>/<mes>/`

As imagens do formulário SHALL ser enviadas ao salvar a chamada, e não no clique da imagem. O upload SHALL usar a pasta `chamadas` e as subpastas `<ano>/<mes>` derivadas de `data_lancamento`, SHALL validar tipo e tamanho, e SHALL retornar URLs públicas em `/uploads/chamadas/<ano>/<mes>/<arquivo>`. O destino `chamadas` SHALL ser informado na query (`?pasta=chamadas`) para autorização antes do parse do multipart; `ano` e `mes` SHALL acompanhar o multipart. As URLs SHALL ser persistidas em `anexos_midias` conforme o requisito de mídias relacionais; a tela SHALL exibir as imagens salvas após recarregar a página. O envio SHALL exigir `criar` ou `alterar` no módulo.

#### Scenario: Upload no salvar

- **WHEN** o usuário adiciona imagens e salva uma chamada
- **THEN** os arquivos são gravados em `uploads/chamadas/<ano>/<mes>/` e as URLs são persistidas em `anexos_midias`

#### Scenario: Colagem envia o destino na query

- **WHEN** o usuário cola uma imagem com `Ctrl` + `V` e salva a chamada
- **THEN** o cliente envia `POST /api/uploads?pasta=chamadas` com ano, mês e arquivo, e o upload não retorna `400` por destino ausente

#### Scenario: Pasta derivada da data de lançamento

- **WHEN** a chamada tem `data_lancamento` em outro ano ou mês
- **THEN** o upload usa o ano e o mês dessa data, não a data do servidor

#### Scenario: Imagens permanecem após recarregar

- **WHEN** o usuário recarrega a página após salvar uma chamada com imagens
- **THEN** as imagens são exibidas a partir das URLs persistidas em `anexos_midias`

#### Scenario: Arquivo inválido

- **WHEN** o arquivo enviado tem tipo ou tamanho não permitido
- **THEN** o upload é rejeitado e a chamada não é gravada com a imagem inválida

#### Scenario: Ordem e capa

- **WHEN** a chamada é salva com mais de uma imagem
- **THEN** a ordem de seleção é preservada em `ordem_exibicao` e a primeira imagem fica como capa

### Requirement: A exclusão e a edição limpam imagens vinculadas

Após confirmar a exclusão de uma chamada, o sistema SHALL remover os arquivos de imagem vinculados que
estejam sob `uploads/chamadas/`. Na edição, as imagens retiradas do array SHALL ter seus arquivos
removidos e as linhas correspondentes de `anexos_midias` SHALL ser eliminadas na mesma transação da
chamada. A limpeza SHALL ocorrer somente depois da confirmação no banco, SHALL ser best-effort (uma
falha de remoção não desfaz a operação) e SHALL preservar arquivos referenciados por outra chamada,
consultando `anexos_midias` por URL. Se a exclusão da chamada for bloqueada pelo status ou histórico,
nenhum arquivo SHALL ser removido.

#### Scenario: Exclusão remove imagens

- **WHEN** o usuário exclui uma chamada permitida que possui imagens
- **THEN** o registro e as linhas de `anexos_midias` são removidos e os arquivos vinculados sob `uploads/chamadas/` são apagados

#### Scenario: Edição remove imagem retirada

- **WHEN** o usuário remove uma imagem do array e salva a chamada
- **THEN** a linha correspondente sai de `anexos_midias` e o arquivo correspondente é apagado

#### Scenario: Imagem compartilhada é preservada

- **WHEN** a mesma URL de imagem está referenciada por outra chamada em `anexos_midias`
- **THEN** o arquivo não é apagado

#### Scenario: Exclusão bloqueada não limpa arquivos

- **WHEN** a exclusão da chamada é recusada pelo backend
- **THEN** nenhum arquivo de imagem é removido

### Requirement: A Descrição e a Solução aceitam texto rico

A etapa **Conteúdo e mídias** SHALL oferecer os campos **Descrição completa** e **Solução** com um
editor de texto rico que permite aplicar **negrito**, **cor de fonte** e **tamanho de fonte** ao texto
selecionado. A formatação SHALL usar somente a allowlist do design system (paleta de texto e escala de
tamanhos); nenhuma cor ou tamanho fora da allowlist SHALL ser persistido. Ao carregar uma chamada
existente, o editor SHALL apresentar o HTML salvo; quando não houver HTML, SHALL apresentar o texto
puro convertido, preservando as quebras de linha. As duas representações SHALL permanecer coerentes: o
texto puro corresponde ao conteúdo sem marcação e o HTML corresponde ao conteúdo formatado.

#### Scenario: Aplicar negrito

- **WHEN** o usuário seleciona um trecho da Descrição e aciona o botão de negrito
- **THEN** o trecho passa a ser exibido em negrito e o valor salvo contém a marcação correspondente

#### Scenario: Aplicar cor e tamanho

- **WHEN** o usuário seleciona um trecho e escolhe uma cor ou um tamanho da lista permitida
- **THEN** o trecho assume a cor ou o tamanho escolhidos

#### Scenario: Cor fora da allowlist é descartada

- **WHEN** um payload tenta gravar uma cor ou tamanho que não pertence à allowlist
- **THEN** o valor não é persistido e a formatação inválida não é aplicada

#### Scenario: Editar chamada com formatação

- **WHEN** o usuário abre para editar uma chamada cuja Descrição ou Solução possui formatação
- **THEN** o editor carrega o conteúdo formatado e uma nova edição preserva a formatação existente

#### Scenario: Editar registro sem HTML

- **WHEN** o usuário abre uma chamada sem HTML salvo
- **THEN** o editor apresenta o texto puro com as quebras de linha preservadas, pronto para formatação

#### Scenario: Solução vazia

- **WHEN** o usuário não digita nada na Solução
- **THEN** a Solução é gravada vazia e nenhum HTML de Solução é produzido

### Requirement: A chamada vincula um ou mais softwares

O cadastro e a edição SHALL permitir selecionar **um ou mais softwares** do catálogo ativo, com no
mínimo um obrigatório. A seleção SHALL usar um campo de escolha múltipla com busca e chips. O sistema
SHALL persistir todos os softwares da chamada em uma tabela de junção própria e SHALL manter, para
compatibilidade, o **software principal** (o primeiro selecionado) nos campos de vínculo único
existentes. A busca textual e a listagem SHALL considerar os nomes de **todos** os softwares da
chamada, e os detalhes SHALL exibir a lista completa. Registros anteriores (um único software) SHALL
ser lidos como uma lista de um item.

#### Scenario: Selecionar múltiplos softwares

- **WHEN** o usuário seleciona dois softwares e salva a chamada
- **THEN** a chamada é gravada com os dois softwares e ambos aparecem na listagem e nos detalhes

#### Scenario: Ao menos um software

- **WHEN** o usuário tenta salvar sem nenhum software
- **THEN** o formulário exibe o erro no campo de softwares e não grava a chamada

#### Scenario: Software principal preservado

- **WHEN** a chamada é gravada com mais de um software
- **THEN** o primeiro software selecionado permanece nos campos de vínculo único, mantendo listas e relatórios existentes

#### Scenario: Busca considera todos os softwares

- **WHEN** o usuário busca pelo nome de um software que não é o principal da chamada
- **THEN** a chamada correspondente é encontrada

#### Scenario: Registro anterior com um software

- **WHEN** uma chamada gravada antes desta mudança é aberta
- **THEN** ela é exibida com o seu único software como uma lista de um item

### Requirement: As transições de status registram histórico, parecer e critérios

As ações **Aprovar**, **Recusar** e **Desaprovar** de Lançar as Chamadas SHALL usar a mesma regra de
transição da Esteira de Revisão e SHALL gravar uma linha em `historico_esteira_revisao` com status
anterior, novo status, responsável (id, nome e perfil), parecer, critérios de aceite, tempo no estágio
e data/hora, além de atualizar o status da chamada na mesma transação. A aprovação SHALL preservar a
`data_liberacao` existente e herdar a `data_publicacao` do conteúdo pai (Release Week, Manual ou
Escopo, nesta ordem) somente quando ela estiver vazia.
A recusa NÃO SHALL alterar a `data_liberacao` e SHALL exigir parecer não vazio. A desaprovação SHALL
voltar a chamada para `Revisar` a partir de `Aprovado` ou `Recusado`, limpar a `data_liberacao` e gravar a transição. A ação SHALL ser
recusada com conflito quando o status da chamada tiver mudado desde a leitura.

#### Scenario: Aprovar grava histórico

- **WHEN** o usuário confirma a aprovação de uma chamada em `Revisar`
- **THEN** o status passa a `Aprovado`, a `data_liberacao` existente é preservada (ou herdada do conteúdo pai quando vazia) e o histórico registra a transição

#### Scenario: Recusar exige parecer e grava histórico

- **WHEN** o usuário confirma a recusa de uma chamada em `Revisar` com parecer
- **THEN** o status passa a `Recusado`, a `data_liberacao` não é alterada e o histórico registra o parecer

#### Scenario: Recusar sem parecer é bloqueado

- **WHEN** o usuário tenta recusar uma chamada sem preencher o parecer
- **THEN** o formulário exibe erro, mantém o modal aberto e não grava a transição

#### Scenario: Desaprovar/Reabrir limpa a data de liberação

- **WHEN** o usuário confirma a desaprovação de uma chamada em `Aprovado`
- **THEN** o status volta a `Revisar`, a `data_liberacao` é limpa e o histórico registra a transição

#### Scenario: Conflito de status

- **WHEN** a chamada já avançou na esteira antes da confirmação
- **THEN** a API responde com conflito e a transição não é gravada

#### Scenario: Histórico compartilhado com a Esteira

- **WHEN** uma chamada é aprovada ou recusada em Lançar as Chamadas
- **THEN** a Esteira de Revisão exibe o novo status e o histórico correspondente

### Requirement: O vínculo move o conteúdo pai para revisão

Ao criar, importar ou alterar os vínculos de uma chamada, o sistema SHALL atualizar o status de cada
conteúdo pai vinculado para `Em Revisão` (Release Week e Manuais) ou `Homologação` (Escopo de
Projetos), quando ele ainda não estiver nesse status. A atualização SHALL ocorrer na mesma transação
da gravação da chamada e SHALL ser idempotente. Conteúdos pai em `Aprovado` ou `Publicado` também
SHALL ser reabertos para o status de revisão; a publicação do conteúdo pai permanece uma ação
explícita do módulo correspondente. Quando a reabertura retirar o pai de `Publicado`, as chamadas
filhas em `Publicado` que não tenham outro vínculo ativo publicado SHALL voltar para `Publicar` e
receber a transição no histórico. Filhas em `Publicado` que ainda tenham outro pai ativo publicado
SHALL permanecer em `Publicado`.

#### Scenario: Chamada criada com Release Week

- **WHEN** uma chamada é criada vinculada a uma Release Week
- **THEN** a Release Week passa a `Em Revisão`

#### Scenario: Chamada criada com Manual

- **WHEN** uma chamada é criada vinculada a um Manual Mensal
- **THEN** o Manual passa a `Em Revisão`

#### Scenario: Chamada criada com Escopo de Projetos

- **WHEN** uma chamada é criada vinculada a um Escopo de Projetos
- **THEN** o Escopo passa a `Homologação`

#### Scenario: Importação move os pais

- **WHEN** uma importação XLSX cria chamadas vinculadas a Release Week, Manuais ou Escopo
- **THEN** todos os conteúdos pai vinculados são movidos para o status de revisão na mesma transação

#### Scenario: Edição com novo vínculo

- **WHEN** uma chamada existente é editada e o vínculo é adicionado ou trocado
- **THEN** o novo conteúdo pai é movido para o status de revisão

#### Scenario: Pai já em revisão

- **WHEN** o conteúdo pai já está em `Em Revisão` (ou `Homologação` no Escopo)
- **THEN** o status é preservado, sem reescrita desnecessária

#### Scenario: Pai publicado é reaberto

- **WHEN** uma chamada é vinculada a um conteúdo pai `Publicado`
- **THEN** o pai volta para `Em Revisão` (ou `Homologação`) e as filhas em `Publicado` sem outro pai publicado voltam para `Publicar`

#### Scenario: Múltiplos vínculos preservam a publicação

- **WHEN** uma filha em `Publicado` tem dois pais e apenas um deles é reaberto
- **THEN** a filha permanece em `Publicado` porque o outro vínculo ativo continua `Publicado`

### Requirement: Só conteúdos pai em status vinculável aparecem nas opções

O formulário de Lançar as Chamadas SHALL oferecer para vínculo apenas conteúdos pai com status
compatível com o fluxo: **Release Week** em `Aberta` ou `Em Revisão`; **Manuais** em `Rascunho` ou
`Em Revisão` (o Manual não possui o status `Aberta`; `Rascunho` é o equivalente inicial); **Escopo de
Projetos** em `Em Andamento` ou `Homologação`. A importação XLSX SHALL rejeitar linhas que referenciem
conteúdo pai fora desses status. O vínculo já existente de uma chamada em edição SHALL continuar
visível mesmo que o pai tenha mudado de status.

#### Scenario: Release fora do status vinculável

- **WHEN** uma Release Week está em `Aprovado` ou `Publicado`
- **THEN** ela não aparece nas opções de vínculo do formulário

#### Scenario: Manual fora do status vinculável

- **WHEN** um Manual está em `Alterações Solicitadas`, `Aprovado` ou `Publicado`
- **THEN** ele não aparece nas opções de vínculo do formulário

#### Scenario: Escopo fora do status vinculável

- **WHEN** um Escopo está em `Concluído` ou `Publicado`
- **THEN** ele não aparece nas opções de vínculo do formulário

#### Scenario: Importação com pai fora do status

- **WHEN** uma linha da planilha referencia uma Release, Manual ou Escopo fora dos status vinculáveis
- **THEN** a linha é marcada como inválida e a importação não grava nada

#### Scenario: Edição preserva o vínculo atual

- **WHEN** uma chamada existente é aberta para edição e o pai atual não está mais em status vinculável
- **THEN** o vínculo atual continua exibido, mas novos vínculos seguem a lista filtrada

### Requirement: A chamada possui o status Publicado

O sistema SHALL representar a chamada já publicada no portal com o status `Publicado`, distinto de
`Publicar` (aguardando a publicação do conteúdo pai). Uma chamada SHALL assumir `Publicado` quando o
conteúdo pai vinculado for publicado e a chamada estiver em `Publicar`, ou quando a ação **Publicar
Item** for confirmada e ao menos um vínculo ativo já apontar para conteúdo pai `Publicado`. O status
`Publicado` NÃO SHALL ser editável no formulário de Lançar as Chamadas nem na importação XLSX. A
listagem, os detalhes, os filtros e os relatórios SHALL exibir `Publicado` com o mesmo tratamento
visual dos demais status. A chamada em `Publicado` SHALL permanecer visível no portal somente
enquanto ao menos um vínculo ativo apontar para conteúdo pai `Publicado` e não arquivado.

#### Scenario: Chamada publicada por cascata

- **WHEN** o conteúdo pai vinculado passa a `Publicado` e a chamada está em `Publicar`
- **THEN** a chamada passa a `Publicado`, o histórico registra a transição e ela fica visível no portal

#### Scenario: Publicar item com pai já publicado

- **WHEN** o usuário confirma Publicar Item em uma chamada `Aprovado` cujo vínculo ativo já aponta para conteúdo pai `Publicado`
- **THEN** a chamada passa diretamente a `Publicado` e fica visível no portal

#### Scenario: Chamada em revisão não é publicada pela cascata

- **WHEN** o conteúdo pai é publicado e a chamada está em `Revisar`, `Aprovado` ou `Recusado`
- **THEN** o status da chamada é preservado e ela não fica visível no portal

#### Scenario: Status não editável

- **WHEN** o formulário de Lançar as Chamadas é aberto para criar ou editar uma chamada
- **THEN** o status `Publicado` não é oferecido como campo editável

### Requirement: As imagens da chamada são persistidas em `anexos_midias`

Cada imagem da chamada SHALL ser persistida como uma linha em `anexos_midias`, vinculada por
`entrega_item_id` com `ON DELETE CASCADE`, contendo a URL pública, o nome do arquivo, o tipo MIME, a
ordem de exibição, a indicação de capa e a legenda alternativa quando informada. A primeira imagem
SHALL ser a capa (`destaque_capa = 1`) e as demais SHALL manter a ordem de seleção. A leitura da
chamada SHALL devolver `midias` com os metadados e SHALL manter `imagens` como a lista derivada de
URLs, na mesma ordem, para compatibilidade com as telas atuais. A coluna JSON
`entregas_itens.imagens` SHALL permanecer como snapshot legado nesta change, sem ser a fonte de
verdade. A leitura SHALL usar `anexos_midias` e, apenas para registros ainda não backfilled, poderá
cair para o JSON legado. A tabela SHALL ter unicidade por `(entrega_item_id, url_arquivo)` e índice
por `url_arquivo` para a checagem de compartilhamento.

#### Scenario: Salvar cria as linhas relacionais

- **WHEN** uma chamada é criada ou editada com imagens
- **THEN** cada URL gera/atualiza uma linha em `anexos_midias`, com ordem e capa coerentes com o array

#### Scenario: Leitura devolve mídias e URLs

- **WHEN** a chamada é lida pela API
- **THEN** a resposta contém `midias` com os metadados e `imagens` com as mesmas URLs na ordem de exibição

#### Scenario: Compatibilidade com registros antigos

- **WHEN** uma chamada ainda não possui linhas em `anexos_midias`
- **THEN** a leitura usa o JSON legado como fallback, sem quebrar a tela

#### Scenario: Backfill dos registros existentes

- **WHEN** a migration 30 é aplicada
- **THEN** cada URL do JSON legado vira uma linha em `anexos_midias`, preservando a ordem e a primeira imagem como capa

#### Scenario: Remoção da chamada limpa as linhas

- **WHEN** a chamada é excluída
- **THEN** as linhas de `anexos_midias` são removidas por `ON DELETE CASCADE`

### Requirement: As mídias da chamada têm acesso controlado

As imagens persistidas em `anexos_midias` SHALL ser exibidas na Área Administrativa para usuários com
`lancar-chamadas`/`visualizar` e SHALL permanecer inacessíveis a visitantes anônimos enquanto a
chamada não estiver publicada. Uma mídia de chamada SHALL ser considerada pública somente quando:
- a chamada estiver com status `Publicado` e `publicado_em` não nulo e não futuro; e
- ao menos um vínculo ativo da chamada apontar para conteúdo pai com status `Publicado`,
  `publicado_em` não nulo e não futuro, e `arquivada = 0`.

A URL da mídia SHALL ser servida pela aplicação com `nosniff` e sem possibilidade de execução; quando
o acesso não for permitido, a resposta SHALL ser `404` (ou `401`/`403`), sem revelar se o arquivo
existe. A listagem, os detalhes, a galeria e os relatórios administrativos SHALL continuar exibindo
as mídias para os perfis autorizados, inclusive de chamadas em revisão.

#### Scenario: Mídia de chamada em revisão não é pública
- **WHEN** uma chamada em `Revisar`, `Aprovado` ou `Publicar` possui imagens e um visitante anônimo abre a URL de uma delas
- **THEN** a imagem não é servida

#### Scenario: Mídia de chamada publicada é pública
- **WHEN** a chamada está `Publicado` com `publicado_em` efetivo, o pai está `Publicado` com `publicado_em` efetivo e não arquivado, e um visitante anônimo abre a URL da mídia
- **THEN** a imagem é servida com `nosniff`

#### Scenario: Mídia de chamada com pai arquivado não é pública
- **WHEN** a chamada está `Publicado`, mas o único vínculo ativo aponta para um pai arquivado, e um visitante anônimo abre a URL da mídia
- **THEN** a imagem não é servida

#### Scenario: Mídia com múltiplos vínculos e um pai publicado
- **WHEN** a chamada está `Publicado` e possui dois vínculos, um com pai publicado e não arquivado e outro com pai arquivado
- **THEN** a mídia é pública pelo vínculo ativo publicado

#### Scenario: Admin consulta mídia em revisão
- **WHEN** um usuário com `lancar-chamadas`/`visualizar` abre a galeria de uma chamada em revisão
- **THEN** as imagens são exibidas normalmente na Área Administrativa

#### Scenario: Perfil sem permissão de chamadas não consulta mídia em revisão
- **WHEN** um usuário autenticado sem `lancar-chamadas`/`visualizar` requisita a URL de uma mídia em revisão
- **THEN** a mídia não é servida

#### Scenario: Mídia com publicação efetiva futura não é pública
- **WHEN** a chamada ou o pai está `Publicado`, mas o `publicado_em` correspondente é futuro
- **THEN** a mídia não é servida anonimamente até a data efetiva

### Requirement: A galeria usa miniaturas e carregamento sob demanda

A galeria de imagens da chamada SHALL exibir miniaturas leves em vez do arquivo original em tamanho
de exibição, com `loading="lazy"`, `decoding="async"`, dimensões reservadas e `srcset` quando houver
variante. O servimento de mídia de chamada publicada SHALL permitir cache público reutilizável; a
pré-visualização administrativa SHALL permanecer privada. Uma variante reduzida (aprox. 320 px, WebP)
SHALL ser gerada no upload, com fallback para o original quando a geração não estiver disponível.

#### Scenario: Miniatura leve na galeria
- **WHEN** o usuário abre a galeria de uma chamada com imagens
- **THEN** a galeria usa a variante reduzida (ou a original como fallback) com `loading="lazy"` e sem baixar todas as imagens antes da rolagem

#### Scenario: Imagem publicada com cache
- **WHEN** uma mídia de chamada publicada é servida anonimamente
- **THEN** a resposta permite cache público reutilizável e mantém `nosniff`

### Requirement: A visibilidade pública de mídia respeita a data de liberação

Uma mídia de chamada NÃO SHALL ser considerada pública antes da publicação efetiva. Além de a
chamada estar `Publicado` e de ao menos um pai estar `Publicado` e não arquivado, a visibilidade
anônima SHALL exigir que `publicado_em` da chamada e `publicado_em` do pai sejam não nulos e não
futuros. `publicado_em` SHALL ser derivado da `data_liberacao`/`data_publicacao` quando ela estiver
no futuro, ou do instante da transição para `Publicado` quando a data estiver ausente/passada. A
regra vale para o servimento de mídia e para as futuras leituras públicas.

#### Scenario: Chamada publicada com liberação futura
- **WHEN** uma chamada está `Publicado`, o pai está publicado e o `publicado_em` da chamada é posterior a agora
- **THEN** a mídia não é servida anonimamente até a data de liberação

#### Scenario: Pai com publicação futura
- **WHEN** o pai está `Publicado`, mas o `publicado_em` do pai é posterior a agora
- **THEN** a mídia não é servida anonimamente até a data de publicação

#### Scenario: Data efetiva liberada
- **WHEN** a chamada e o pai estão publicados e os `publicado_em` não são futuros
- **THEN** a mídia é servida anonimamente

### Requirement: O detalhe da chamada é carregado sob demanda

A listagem SHALL ser enxuta e o detalhe completo da chamada (descrição/solução em HTML, mídias,
tags, links e autor) SHALL ser obtido por `GET /api/lancar-chamadas/:id` quando o usuário abrir
Detalhes/Editar. A rota SHALL exigir `lancar-chamadas`/`visualizar`, responder `404` para id
inexistente e devolver o mesmo contrato do registro usado pelo formulário. A listagem NÃO SHALL
depender desse payload completo para renderizar as colunas.

#### Scenario: Abrir detalhe busca o registro completo
- **WHEN** o usuário aciona "Detalhes" em uma chamada
- **THEN** o cliente consulta `GET /api/lancar-chamadas/:id` e exibe o HTML sanitizado/mídias retornados

#### Scenario: Detalhe de id inexistente
- **WHEN** `GET /api/lancar-chamadas/:id` recebe um UUID inexistente
- **THEN** a API responde `404` e a tela informa o erro sem abrir dados parciais

#### Scenario: Listagem não carrega o HTML
- **WHEN** a listagem é carregada
- **THEN** a resposta da página não inclui o HTML completo de descrição/solução nem a lista completa de mídias

### Requirement: O parecer da recusa é obrigatório e o botão explica a indisponibilidade

No modal de recusa, o parecer SHALL ser marcado como obrigatório e validado no clique de
confirmação, com mensagem persistente e foco no campo quando vazio. O botão de confirmação NÃO SHALL
ficar silenciosamente desabilitado: enquanto a ação estiver disponível, o clique SHALL revelar a
validação; se o botão estiver desabilitado por outro motivo, o motivo SHALL ser acessível por
tooltip/`aria-describedby`.

#### Scenario: Parecer vazio revela a validação

- **WHEN** o usuário aciona “Recusar” com o parecer vazio
- **THEN** o modal permanece aberto, exibe o erro de obrigatoriedade e leva o foco ao parecer

#### Scenario: Parecer preenchido confirma

- **WHEN** o usuário informa um parecer válido e confirma
- **THEN** a recusa é enviada e o modal fecha após o sucesso

#### Scenario: Indisponibilidade explicada

- **WHEN** o botão de recusa está desabilitado por permissão ou estado
- **THEN** o motivo é anunciado de forma acessível, sem deixar o usuário supor falta de permissão

### Requirement: A importação grava chamadas em lote

A importação XLSX de Chamadas SHALL gravar os itens em blocos (multi-row) e os softwares em upsert
multi-row, dentro de uma única transação, mantendo a atomicidade e o limite de 500 linhas.

#### Scenario: Importação de 500 linhas
- **WHEN** o usuário importa 500 chamadas válidas
- **THEN** a gravação usa lotes, conclui em tempo compatível com as demais importações e não deixa registro parcial

#### Scenario: Falha no meio
- **WHEN** uma linha falha durante a gravação em lote
- **THEN** a transação é revertida integralmente

### Requirement: A validação de unicidade usa a chave única

A criação/edição de chamada SHALL verificar duplicidade por `WHERE chamada = ?` (ou pela UK),
tratando `1062` como conflito, sem ler a tabela inteira para montar um conjunto em memória.

#### Scenario: Chamada duplicada
- **WHEN** o usuário tenta gravar uma chamada já existente
- **THEN** a API responde `409` sem varrer a tabela

#### Scenario: Gravação concorrente
- **WHEN** duas requisições criam a mesma chamada ao mesmo tempo
- **THEN** uma vence e a outra recebe `409`

### Requirement: As confirmações de Chamadas bloqueiam duplo envio

As confirmações de aprovar, desaprovar, recusar e excluir chamadas SHALL exibir `loading` e desabilitar a ação enquanto a requisição estiver em voo, evitando requisições duplicadas.

#### Scenario: Duplo clique em aprovar
- **WHEN** o usuário clica duas vezes em "Aprovar"
- **THEN** apenas uma requisição é enviada e o botão permanece desabilitado até a resposta

#### Scenario: Falha restaura o botão
- **WHEN** a requisição falha
- **THEN** o botão volta ao estado habilitado e a mensagem de erro é exibida

### Requirement: A listagem indica recarga no modo servidor

Ao trocar de página, buscar ou aplicar filtros no modo servidor, a listagem de Chamadas SHALL exibir um indicador de carregamento sem remover a tabela da tela.

#### Scenario: Troca de página
- **WHEN** o usuário muda de página
- **THEN** um indicador de carregamento é exibido até a nova página chegar

### Requirement: O PDF de Chamadas tem limite operacional

A exportação **PDF** do conjunto filtrado SHALL ter um limite de **5.000 chamadas** por geração. Acima do limite, a tela SHALL informar que é necessário refinar os filtros e NÃO SHALL gerar um PDF parcial silencioso. A exportação **CSV** NÃO SHALL ser afetada por esse teto e SHALL continuar em streaming/keyset.

#### Scenario: PDF dentro do limite

- **WHEN** o usuário gera o PDF com até 5.000 chamadas no conjunto filtrado
- **THEN** o arquivo é gerado com a contagem e as colunas da listagem

#### Scenario: PDF acima do limite

- **WHEN** o conjunto filtrado excede 5.000 chamadas
- **THEN** a tela informa que é necessário refinar os filtros e nenhum PDF parcial é gerado

#### Scenario: CSV não é limitado pelo teto do PDF

- **WHEN** o conjunto filtrado excede 5.000 chamadas e o usuário exporta CSV
- **THEN** o CSV continua sendo gerado em streaming

### Requirement: A Data de liberação é herdada do vínculo selecionado

O formulário SHALL preencher a **Data de liberação** com a `data_publicacao` do vínculo selecionado, com precedência **Release > Manual > Projeto**, sempre que a data estiver vazia ou vier da herança do próprio formulário; o campo permanece somente leitura. Ao selecionar ou remover um vínculo, o formulário SHALL recomputar a data a partir dos vínculos restantes e SHALL limpá-la quando nenhum vínculo com data de publicação permanecer. O servidor SHALL aplicar a mesma herança, na mesma ordem, quando a chamada for criada, atualizada ou importada sem Data de liberação. Ao aprovar uma chamada sem Data de liberação, o servidor SHALL herdá-la do vínculo pai e SHALL aceitar qualquer data civil válida, sem regra de segunda-feira ou próximo dia útil. Uma data já existente SHALL ser preservada. A Data de liberação informada ou herdada SHALL ser uma data civil válida.

#### Scenario: Projeto único preenche a data

- **WHEN** o usuário seleciona apenas um Projeto com `data_publicacao` e ainda não há Data de liberação
- **THEN** o formulário preenche a Data de liberação com a publicação do Projeto

#### Scenario: Manual preenche quando não há Release

- **WHEN** o usuário seleciona um Manual com `data_publicacao` e não há Release selecionada
- **THEN** o formulário preenche a Data de liberação com a publicação do Manual

#### Scenario: Release tem precedência

- **WHEN** Release, Manual e Projeto estão selecionados
- **THEN** a Data de liberação usa a publicação da Release

#### Scenario: Remover vínculo recomputa a data

- **WHEN** o usuário remove a Release e restam Manual ou Projeto com `data_publicacao`
- **THEN** o formulário recomputa a Data de liberação pelo vínculo restante de maior precedência

#### Scenario: Sem vínculo com data a liberação é limpa

- **WHEN** o usuário remove todos os vínculos que possuíam `data_publicacao`
- **THEN** o formulário limpa a Data de liberação

#### Scenario: Criação deriva a data no servidor

- **WHEN** uma chamada é criada sem Data de liberação e o vínculo possui `data_publicacao`
- **THEN** o servidor grava a data herdada, aceitando qualquer dia da semana

#### Scenario: Aprovação herda data válida

- **WHEN** a chamada está sem Data de liberação e o vínculo pai possui data de publicação em qualquer dia da semana
- **THEN** a aprovação grava essa data e a chamada avança para `Aprovado`

#### Scenario: Data existente é preservada

- **WHEN** a chamada já possui Data de liberação
- **THEN** a aprovação preserva a data existente

### Requirement: A tela oferece um filtro rápido de origem

A tela de Lançar as Chamadas SHALL oferecer, na barra de ferramentas da listagem e imediatamente à esquerda do botão **Filtros**, um seletor rápido de **Origem** com as opções `Release`, `Projeto`, `Manual` e `Ambos`, além do estado sem filtro ("Todas as origens"). A seleção SHALL refinar a listagem e os KPIs pelo campo `origem`, SHALL ser contabilizada no badge de filtros ativos e SHALL ser limpa pelo `X` do próprio seletor ou por "Limpar Filtros". O controle SHALL respeitar a permissão `lancar-chamadas`/`filtrar`. A escolha SHALL coexistir com os demais filtros do modal, sem substituí-los.

#### Scenario: Filtrar por origem

- **WHEN** o usuário escolhe `Projeto` no seletor rápido de Origem
- **THEN** a listagem e os KPIs passam a exibir apenas as chamadas com origem `Projeto`

#### Scenario: Origem combinada com o modal

- **WHEN** o usuário já aplicou filtros no modal e escolhe uma origem no seletor rápido
- **THEN** os dois filtros são aplicados em conjunto e o badge de filtros ativos reflete a soma

#### Scenario: Limpar a origem

- **WHEN** o usuário aciona o `X` do seletor ou "Limpar Filtros"
- **THEN** o filtro de origem volta a "Todas as origens" e a listagem/KPIs refletem o conjunto sem esse recorte

#### Scenario: Sem permissão de filtro

- **WHEN** o perfil não concede `lancar-chamadas`/`filtrar`
- **THEN** o seletor rápido de Origem não é exibido

### Requirement: A tela oferece limpeza rápida de busca e filtros

A tela de Lançar as Chamadas SHALL oferecer, imediatamente à direita do botão **Filtros**, um botão de limpar com ícone `X`, visível somente quando houver busca ou filtro ativo. O acionamento SHALL zerar a busca e todos os filtros (inclusive a origem rápida), SHALL refazer a listagem e os KPIs sem recorte e SHALL fechar nenhum modal — a limpeza ocorre direto na toolbar. O controle SHALL respeitar a permissão `lancar-chamadas`/`filtrar`.

#### Scenario: Limpar direto na toolbar

- **WHEN** há busca ou qualquer filtro ativo e o usuário aciona o `X` ao lado do botão Filtros
- **THEN** a busca e todos os filtros são zerados, a listagem/KPIs voltam ao conjunto completo e o badge de filtros ativos desaparece

#### Scenario: Botão oculto sem filtros ativos

- **WHEN** não há busca nem filtro ativo
- **THEN** o botão de limpar não é exibido

#### Scenario: Limpar não abre o modal

- **WHEN** o usuário aciona o `X` de limpeza rápida
- **THEN** o modal de Filtros não é aberto e a grade permanece na tela
