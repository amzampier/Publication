# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: A Data de liberação é limpa ao remover a Release e validada na herança

**Reason**: A Data de liberação deixa de ser exclusiva da Release e de exigir segunda-feira; passa a ser herdada de Release, Manual ou Projeto com qualquer data civil válida.

**Migration**: O comportamento é substituído pelo requisito **A Data de liberação é herdada do vínculo selecionado**, que cobre preenchimento no formulário, criação, edição, importação e aprovação. Chamadas existentes com datas fora de segunda-feira deixam de ser recusadas na aprovação.

## ADDED Requirements

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
