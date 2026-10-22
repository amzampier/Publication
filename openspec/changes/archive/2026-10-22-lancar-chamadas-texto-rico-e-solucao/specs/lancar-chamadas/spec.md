# Spec Delta

## MODIFIED Requirements

### Requirement: A listagem apresenta as chamadas com busca, filtros, ordenação e paginação

A tela SHALL listar as chamadas em `UiDataTable` com as colunas **Chamada**, **Título**, **Software**,
**Módulo**, **Tipo**, **Impacto**, **Status**, **Data de lançamento** e **Data de liberação**. A busca SHALL operar sobre chamada, título, descrição, solução, software, módulo, menu
funcionalidade, parceiro, tags e código da release. A busca SHALL operar somente sobre o texto puro das
descrições, nunca sobre a marcação HTML. A listagem SHALL ser ordenada por **chamada**
(crescente, com comparação numérica natural) e a paginação SHALL ocorrer no cliente. A tabela SHALL
distinguir base vazia de conjunto filtrado sem resultados.

#### Scenario: Listagem com dados

- **WHEN** a tela é aberta com chamadas no conjunto
- **THEN** as chamadas são exibidas nas colunas definidas, paginadas, com as datas formatadas em `dd/mm/aaaa`

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

### Requirement: O formulário cobre os campos de `entregas_itens`

O formulário SHALL permitir informar **Chamada**, **Título**, **Data de lançamento**, **Data de
liberação**, **Release**, **Projeto**, **Manual**, **Software**, **Parceiro**, **Módulo**, **Menu
funcionalidade**, **Tipo**, **Impacto**, **Descrição completa**, **Solução**, **Título do manual**,
**Link do manual**, **Link do vídeo**, **Tags** e **Imagens**. O campo **Situação**
NÃO SHALL ser exibido no formulário; o valor existente é preservado e novas chamadas usam
`Desenvolvimento` como valor interno. As tags SHALL ficar na etapa **Classificação**. O autor SHALL
ser preenchido a partir da sessão e exibido somente leitura. Os campos de texto `release`, `software`
e `parceiro` SHALL ser derivados dos catálogos selecionados, nunca digitados em paralelo. Ao
selecionar uma Release, a **Data de liberação** SHALL ser preenchida com a `dataPublicacao` da release
selecionada, permanecendo editável. Novas chamadas SHALL nascer com status `Revisar`; o status NÃO
SHALL ser editável no formulário. A **Descrição completa** e a **Solução** SHALL ficar na etapa
**Conteúdo e mídias** e SHALL aceitar formatação de texto rico; a **Solução** SHALL ser opcional.

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
- **THEN** o formulário exibe os campos "Descrição completa", "Solução" e "Título do manual" junto dos links

#### Scenario: Solução é opcional

- **WHEN** o usuário preenche os demais campos obrigatórios e deixa a Solução vazia
- **THEN** o formulário salva a chamada sem erro no campo Solução

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
por colagem. A obrigatoriedade da **Descrição completa** SHALL considerar o texto puro derivado do
conteúdo rico: uma descrição que renderiza vazia SHALL ser tratada como ausente. A **Solução**, quando
informada, SHALL respeitar um teto de tamanho em texto puro. O primeiro erro SHALL receber foco e
permanecer visível no campo.

#### Scenario: Campos obrigatórios ausentes

- **WHEN** o usuário tenta salvar sem chamada, título, software, parceiro, módulo, descrição, vínculo ou data de lançamento
- **THEN** o formulário exibe os erros, foca o primeiro campo inválido e não grava

#### Scenario: Descrição formatada vazia

- **WHEN** o usuário aplica apenas formatação sem digitar texto na Descrição completa
- **THEN** o formulário acusa a Descrição completa como obrigatória e não grava

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

### Requirement: O backend persiste as chamadas em `entregas_itens`

A tela SHALL ler e gravar as chamadas pela API, sem dataset em memória. A API SHALL listar as
chamadas persistidas, criar com status inicial `Revisar`, editar, aprovar para `Aprovado`, recusar
para `Recusado` e excluir somente quando o status permitir. A gravação SHALL preencher os campos de
`entregas_itens`, incluindo `manual_titulo`, `descricao_html`, `solucao` e `solucao_html`, e SHALL
manter os textos derivados de release, projeto, manual, software, parceiro, módulo e menu como
snapshot da chamada. O HTML recebido SHALL ser sanitizado no servidor e o texto puro de
`descricao_completa` e `solucao` SHALL ser derivado desse HTML, preservando as quebras de linha; sem
HTML, o servidor SHALL usar o texto puro recebido. O valor de `chamada` SHALL ser
único; duplicatas SHALL ser rejeitadas com `409`, e registros inexistentes com `404`. Toda escrita
SHALL gerar auditoria com o recurso e a ação correspondentes.

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

- **WHEN** o usuário aprova ou recusa uma chamada
- **THEN** o novo status é gravado no banco e permanece após recarregar a página

#### Scenario: Chamada duplicada

- **WHEN** o usuário tenta salvar uma chamada com um número de `chamada` já existente
- **THEN** a API responde `409` e a tela exibe a mensagem de duplicidade sem perder os dados do formulário

#### Scenario: Chamada inexistente

- **WHEN** a API recebe edição, aprovação, recusa ou exclusão de um id inexistente
- **THEN** responde `404` e não altera nenhum registro

## ADDED Requirements

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
