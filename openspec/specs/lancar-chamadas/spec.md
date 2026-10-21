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
**Módulo**, **Tipo**, **Impacto**, **Status**, **Data de lançamento** e **Data de liberação**. A busca SHALL operar sobre chamada, título, descrição, software, módulo, menu
funcionalidade, parceiro, tags e código da release. A listagem SHALL ser ordenada por **chamada**
(crescente, com comparação numérica natural) e a paginação SHALL ocorrer no cliente. A tabela SHALL
distinguir base vazia de conjunto filtrado sem resultados.

#### Scenario: Listagem com dados

- **WHEN** a tela é aberta com chamadas no conjunto
- **THEN** as chamadas são exibidas nas colunas definidas, paginadas, com as datas formatadas em `dd/mm/aaaa`

#### Scenario: Ordenação por chamada

- **WHEN** a listagem é exibida sem ordenação manual do usuário
- **THEN** as chamadas aparecem em ordem crescente de `chamada`, sem considerar `ordem_apresentacao`

#### Scenario: Busca textual

- **WHEN** o usuário digita um termo que corresponde a chamada, título, software, módulo, parceiro, tag ou release
- **THEN** a tabela exibe apenas as chamadas correspondentes e recalcula os KPIs

#### Scenario: Base vazia

- **WHEN** não há chamadas no conjunto e nenhum filtro está ativo
- **THEN** a tabela informa que não há chamadas cadastradas

#### Scenario: Filtro sem resultado

- **WHEN** há chamadas no conjunto, mas os filtros ou a busca não retornam nenhuma
- **THEN** a tabela informa que nenhum resultado foi encontrado para o filtro

### Requirement: O modal de filtros refina a listagem e os KPIs

A tela SHALL oferecer um modal de filtros em **três colunas a partir de `sm`** com **Status**, **Situação**,
**Tipo**, **Impacto**, **Software**, **Parceiro**, **Origem**, **Período de lançamento** (De/Até) e
**Período de liberação** (De/Até), vazio = todos, além dos botões "Limpar Filtros", "Cancelar" e
"Aplicar". Os períodos SHALL
ser inclusivos e comparados com as datas civis `AAAA-MM-DD`; chamadas sem data de liberação NÃO SHALL
corresponder a um filtro de período de liberação. "Aplicar" SHALL refinar a listagem e os KPIs;
"Limpar Filtros" SHALL zerar rascunho e estado. A toolbar SHALL indicar a quantidade de filtros
ativos.

#### Scenario: Aplicar filtros

- **WHEN** o usuário seleciona filtros e aciona "Aplicar"
- **THEN** a listagem e os KPIs passam a considerar apenas as chamadas correspondentes

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
funcionalidade**, **Tipo**, **Impacto**, **Descrição completa**, **Título do manual**, **Link do
manual**, **Link do vídeo**, **Tags** e **Imagens**. O campo **Situação**
NÃO SHALL ser exibido no formulário; o valor existente é preservado e novas chamadas usam
`Desenvolvimento` como valor interno. As tags SHALL ficar na etapa **Classificação**. O autor SHALL
ser preenchido a partir da sessão e exibido somente leitura. Os campos de texto `release`, `software`
e `parceiro` SHALL ser derivados dos catálogos selecionados, nunca digitados em paralelo. Ao
selecionar uma Release, a **Data de liberação** SHALL ser preenchida com a `dataPublicacao` da release
selecionada, permanecendo editável. Novas chamadas SHALL nascer com status `Revisar`; o status NÃO
SHALL ser editável no formulário.

#### Scenario: Nova chamada

- **WHEN** o usuário abre "Nova Chamada" e preenche os dados obrigatórios
- **THEN** o formulário inicia com status `Revisar`, tipo `Correção` e impacto `Médio`, sem campo Situação

#### Scenario: Edição

- **WHEN** o usuário abre uma chamada existente para editar
- **THEN** o formulário vem preenchido, preserva a situação existente, o status aparece somente leitura e a seção de cadastro exibe autor, criação e atualização

#### Scenario: Textos derivados dos catálogos

- **WHEN** o usuário seleciona release, software e parceiro
- **THEN** os textos correspondentes são preenchidos a partir das opções selecionadas e não podem ser editados separadamente

#### Scenario: Data de liberação herdada da Release

- **WHEN** o usuário seleciona uma Release que possui data de publicação
- **THEN** o campo Data de liberação é preenchido com essa data e permanece editável

#### Scenario: Tags na classificação

- **WHEN** o usuário abre a etapa Classificação
- **THEN** o campo de Tags está disponível nessa etapa, e não em Conteúdo e mídias

#### Scenario: Título do manual no conteúdo

- **WHEN** o usuário abre a etapa Conteúdo e mídias
- **THEN** o formulário exibe o campo "Título do manual" junto da descrição e dos links

#### Scenario: Colar imagem da área de transferência

- **WHEN** o usuário copia uma imagem e pressiona `Ctrl` + `V` em qualquer ponto da etapa Conteúdo e mídias
- **THEN** a imagem é validada e incorporada à galeria sem exigir gravação local ou seleção de arquivo

### Requirement: A validação impede dados inválidos

O sistema SHALL validar, no cliente, os campos antes de salvar: **Chamada** obrigatória, com no
máximo 60 caracteres e sem duplicidade no conjunto carregado; **Título** obrigatório, com no máximo
255 caracteres; **Software**, **Parceiro**, **Módulo** e **Descrição completa** obrigatórios;
**Módulo** com no máximo 100 caracteres; **Título do manual** com no máximo 255 caracteres; **Data de
lançamento** obrigatória e **Data de liberação** opcional, ambas válidas e, quando preenchidas, em
segunda-feira; links com URL `http(s)` quando informados; no máximo 12 tags, cada uma com até 30
caracteres; imagens nos formatos PNG, JPG ou WebP, com até 5 MB por arquivo, tanto por seleção quanto
por colagem. O primeiro erro SHALL receber foco e permanecer visível no campo.

#### Scenario: Campos obrigatórios ausentes

- **WHEN** o usuário tenta salvar sem chamada, título, software, parceiro, módulo, descrição, vínculo ou data de lançamento
- **THEN** o formulário exibe os erros, foca o primeiro campo inválido e não grava

#### Scenario: Chamada duplicada

- **WHEN** o usuário informa uma chamada já existente no conjunto carregado
- **THEN** o formulário exibe erro de duplicidade e não grava

#### Scenario: Data fora de segunda-feira

- **WHEN** a data de lançamento ou de liberação não é segunda-feira
- **THEN** o campo exibe erro e o formulário não grava

#### Scenario: Link inválido

- **WHEN** o usuário informa um link que não é `http(s)`
- **THEN** o campo exibe erro e o formulário não grava

#### Scenario: Limites de tags e imagens

- **WHEN** o usuário ultrapassa 12 tags, 30 caracteres por tag ou envia imagem fora dos formatos/tamanho aceitos
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

- **WHEN** a chamada está com status `Aprovado`, `Recusado` ou `Publicar`
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

- **WHEN** a chamada está com status `Aprovado`, `Recusado` ou `Publicar`
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

- **WHEN** a chamada está em `Aprovado`, `Recusado` ou `Publicar`
- **THEN** a ação de excluir fica desabilitada e informa que a chamada já avançou na esteira

#### Scenario: Exclusão bloqueada por histórico

- **WHEN** a chamada possui histórico na esteira de revisão
- **THEN** a ação de excluir fica desabilitada e informa o motivo

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`excluir`
- **THEN** a ação não é exibida

### Requirement: Os detalhes exibem a chamada em modo somente leitura

A tela SHALL oferecer a ação **Detalhes**, que abre um modal `xl` somente leitura com identificação,
classificação, vínculos/origem, descrição completa, título do manual, links, tags, imagens, autor e
timestamps. O modal SHALL fechar por `Escape`, pelo `X` ou por "Fechar".

#### Scenario: Abrir detalhes

- **WHEN** o usuário aciona "Detalhes" em uma chamada
- **THEN** o modal exibe todos os dados da chamada sem campos editáveis

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

### Requirement: O backend persiste as chamadas em `entregas_itens`

A tela SHALL ler e gravar as chamadas pela API, sem dataset em memória. A API SHALL listar as
chamadas persistidas, criar com status inicial `Revisar`, editar, aprovar para `Aprovado`, recusar
para `Recusado` e excluir somente quando o status permitir. A gravação SHALL preencher os campos de
`entregas_itens`, incluindo `manual_titulo`, e SHALL manter os textos derivados de release, projeto,
manual, software, parceiro, módulo e menu como snapshot da chamada. O valor de `chamada` SHALL ser
único; duplicatas SHALL ser rejeitadas com `409`, e registros inexistentes com `404`. Toda escrita
SHALL gerar auditoria com o recurso e a ação correspondentes.

#### Scenario: Cadastro persiste e sobrevive ao recarregamento

- **WHEN** o usuário cria uma chamada válida e recarrega a página
- **THEN** a chamada aparece na listagem com os mesmos dados, status `Revisar` e a data de criação

#### Scenario: Edição persiste

- **WHEN** o usuário altera uma chamada existente e salva
- **THEN** a listagem e os detalhes exibem os novos valores após recarregar a página

#### Scenario: Aprovação e recusa persistem

- **WHEN** o usuário aprova ou recusa uma chamada
- **THEN** o novo status é gravado no banco e permanece após recarregar a página

#### Scenario: Chamada duplicada

- **WHEN** o usuário tenta salvar uma chamada com um número de `chamada` já existente
- **THEN** a API responde `409` e a tela exibe a mensagem de duplicidade sem perder os dados do formulário

#### Scenario: Chamada inexistente

- **WHEN** a API recebe edição, aprovação, recusa ou exclusão de um id inexistente
- **THEN** responde `404` e não altera nenhum registro

### Requirement: O backend expõe catálogos e resolve os vínculos

A API SHALL oferecer uma rota de opções com as releases, projetos, manuais, softwares e parceiros
disponíveis. Ao criar ou editar, a API SHALL resolver os vínculos por id, derivar a origem
(`Release`, `Projeto`, `Manual` ou `Ambos`) a partir dos vínculos, herdar a data de liberação da
release quando ela não for informada, e rejeitar com `400` vínculos inexistentes ou incompatíveis. A resposta SHALL conter os dados necessários para a listagem, os KPIs, os detalhes e
os relatórios.

#### Scenario: Catálogos disponíveis

- **WHEN** a tela carrega com `visualizar`
- **THEN** a API retorna as opções ativas usadas pelos filtros e pelo formulário

#### Scenario: Origem derivada

- **WHEN** o usuário seleciona apenas um projeto
- **THEN** a chamada é gravada com a origem derivada `Projeto`

#### Scenario: Data de liberação herdada

- **WHEN** o usuário seleciona uma release e deixa a data de liberação vazia
- **THEN** a chamada é gravada com a data de publicação da release

#### Scenario: Vínculo inválido

- **WHEN** a API recebe um id de release, projeto, manual, software ou parceiro inexistente
- **THEN** responde `400` e não grava a chamada

### Requirement: A importação XLSX cria chamadas em lote

A tela SHALL oferecer a ação **Importar**, visível apenas com `lancar-chamadas`/`importar`, que aceita
um arquivo `.xlsx` no modelo versionado e apresenta um preview antes de confirmar. O preview SHALL
classificar cada linha como `pronto`, `já cadastrado`, `repetido` ou `inválido` e exibir os erros por
linha e coluna. O servidor SHALL revalidar as linhas e os vínculos, rejeitar payload fora do
contrato, limitar a importação a 500 linhas e gravar todas as linhas válidas em uma única transação.
Linhas inválidas, duplicadas ou já cadastradas SHALL impedir a importação completa, sem gravação
parcial. As chamadas importadas SHALL nascer com status `Revisar` e situação `Desenvolvimento`, SHALL resolver
release, projeto, manual, software e parceiro pelos códigos da planilha, SHALL aceitar múltiplas tags
separadas por `;` e NÃO SHALL importar imagens, status ou situação.

#### Scenario: Importação válida

- **WHEN** o usuário importa um arquivo com linhas válidas e confirma o preview
- **THEN** todas as chamadas são criadas com status `Revisar`, situação `Desenvolvimento` e os vínculos resolvidos pelos códigos

#### Scenario: Linha já cadastrada

- **WHEN** o arquivo contém um número de `chamada` já existente no banco
- **THEN** o preview marca a linha como `já cadastrado` e a confirmação não grava nenhuma linha

#### Scenario: Linhas repetidas no arquivo

- **WHEN** o arquivo contém o mesmo número de `chamada` em mais de uma linha
- **THEN** o preview marca as ocorrências como `repetido` e a importação é bloqueada

#### Scenario: Linha inválida

- **WHEN** o arquivo contém campo obrigatório vazio, código de vínculo inexistente ou data inválida
- **THEN** o preview marca a linha como `inválida`, indica o erro e a importação completa é bloqueada

#### Scenario: Limite de linhas

- **WHEN** o arquivo contém mais de 500 linhas de dados
- **THEN** a importação é rejeitada antes de qualquer gravação

#### Scenario: Sem permissão de importação

- **WHEN** um perfil sem `importar` envia o arquivo para a rota de importação
- **THEN** a API responde `403` e nenhuma chamada é criada

### Requirement: O upload de imagens grava em `uploads/chamadas/<ano>/<mes>/`

As imagens do formulário SHALL ser enviadas ao salvar a chamada, e não no clique da imagem. O upload
SHALL usar a pasta `chamadas` e as subpastas `<ano>/<mes>` derivadas de `data_lancamento`, SHALL
validar tipo e tamanho, e SHALL retornar URLs públicas em `/uploads/chamadas/<ano>/<mes>/<arquivo>`.
As URLs SHALL ser persistidas no campo JSON `entregas_itens.imagens`; a tela SHALL exibir as imagens
salvas após recarregar a página. O envio SHALL exigir `criar` ou `alterar` no módulo.

#### Scenario: Upload no salvar

- **WHEN** o usuário adiciona imagens e salva uma chamada
- **THEN** os arquivos são gravados em `uploads/chamadas/<ano>/<mes>/` e as URLs ficam no JSON da chamada

#### Scenario: Pasta derivada da data de lançamento

- **WHEN** a chamada tem `data_lancamento` em outro ano ou mês
- **THEN** o upload usa o ano e o mês dessa data, não a data do servidor

#### Scenario: Imagens permanecem após recarregar

- **WHEN** o usuário recarrega a página após salvar uma chamada com imagens
- **THEN** as imagens são exibidas a partir das URLs persistidas

#### Scenario: Arquivo inválido

- **WHEN** o arquivo enviado tem tipo ou tamanho não permitido
- **THEN** o upload é rejeitado e a chamada não é gravada com a imagem inválida

### Requirement: A exclusão e a edição limpam imagens vinculadas

Após confirmar a exclusão de uma chamada, o sistema SHALL remover os arquivos de imagem vinculados que
estejam sob `uploads/chamadas/`. Na edição, as imagens retiradas do array SHALL ter seus arquivos
removidos. A limpeza SHALL ocorrer somente depois da confirmação no banco, SHALL ser best-effort (uma
falha de remoção não desfaz a operação) e SHALL preservar arquivos referenciados por outra chamada. Se
a exclusão da chamada for bloqueada pelo status ou histórico, nenhum arquivo SHALL ser removido.

#### Scenario: Exclusão remove imagens

- **WHEN** o usuário exclui uma chamada permitida que possui imagens
- **THEN** o registro é removido e os arquivos vinculados sob `uploads/chamadas/` são apagados

#### Scenario: Edição remove imagem retirada

- **WHEN** o usuário remove uma imagem do array e salva a chamada
- **THEN** a URL sai do JSON e o arquivo correspondente é apagado

#### Scenario: Imagem compartilhada é preservada

- **WHEN** a mesma URL de imagem está referenciada por outra chamada
- **THEN** o arquivo não é apagado

#### Scenario: Exclusão bloqueada não limpa arquivos

- **WHEN** a exclusão da chamada é recusada pelo backend
- **THEN** nenhum arquivo de imagem é removido
