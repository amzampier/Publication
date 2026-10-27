# Spec Delta

## MODIFIED Requirements

### Requirement: A validação impede dados inválidos

O sistema SHALL validar, no cliente, os campos antes de salvar: **Chamada** obrigatória, com no máximo 60 caracteres e sem duplicidade no conjunto carregado; **Título** obrigatório, com no máximo 255 caracteres; **Software**, **Parceiro**, **Módulo** e **Descrição completa** obrigatórios; **Módulo** com no máximo 100 caracteres; **Título do manual** com no máximo 255 caracteres; **Data de lançamento** obrigatória e qualquer data civil válida; **Data de liberação** opcional e, quando preenchida, em segunda-feira ou no próximo dia útil quando a segunda-feira da semana for feriado; links com URL `http(s)` quando informados; no máximo 12 tags, cada uma com até 30 caracteres; no máximo 100 imagens por chamada, nos formatos PNG, JPG ou WebP, com até 5 MB por arquivo, tanto por seleção quanto por colagem. A obrigatoriedade da **Descrição completa** SHALL considerar o texto puro derivado do conteúdo rico: uma descrição que renderiza vazia SHALL ser tratada como ausente. A **Solução**, quando informada, SHALL respeitar um teto de tamanho em texto puro. O primeiro erro SHALL receber foco e permanecer visível no campo.

#### Scenario: Campos obrigatórios ausentes

- **WHEN** o usuário tenta salvar sem chamada, título, software, parceiro, módulo, descrição, vínculo ou data de lançamento
- **THEN** o formulário exibe os erros, foca o primeiro campo inválido e não grava

#### Scenario: Data fora de segunda-feira

- **WHEN** a data de liberação informada não é segunda-feira nem o próximo dia útil de uma segunda-feira feriado
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

A tela SHALL oferecer a ação **Importar**, visível apenas com `lancar-chamadas`/`importar`, que aceita um arquivo `.xlsx` no modelo versionado e apresenta um preview antes de confirmar. O preview SHALL classificar cada linha como `pronto`, `já cadastrado`, `repetido` ou `inválido` e exibir os erros por linha e coluna. O servidor SHALL revalidar as linhas e os vínculos, rejeitar payload fora do contrato, limitar a importação a 500 linhas e gravar todas as linhas válidas em uma única transação. Linhas inválidas, duplicadas ou já cadastradas SHALL impedir a importação completa, sem gravação parcial. As chamadas importadas SHALL nascer com status `Revisar`, SHALL resolver release, projeto, manual, **um ou mais softwares separados por `;`** e parceiro pelos códigos da planilha, SHALL aceitar múltiplas tags separadas por `;` e NÃO SHALL importar imagens, status ou situação. As datas de lançamento e de liberação SHALL ser datas ISO válidas; a Data de lançamento SHALL aceitar qualquer data civil válida, e a Data de liberação, quando informada, SHALL seguir a validação de publicação (segunda-feira ou o próximo dia útil quando a segunda-feira da semana for feriado); uma linha com data inválida SHALL ser classificada como `inválida` e bloquear a importação completa.

#### Scenario: Importação válida

- **WHEN** o usuário importa um arquivo com linhas válidas e confirma o preview
- **THEN** todas as chamadas são criadas com status `Revisar` e os vínculos resolvidos pelos códigos

#### Scenario: Data de lançamento em qualquer dia

- **WHEN** a planilha traz uma data de lançamento válida em uma terça-feira
- **THEN** a linha é classificada como `pronto` e a chamada pode ser importada

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

- **WHEN** o arquivo contém campo obrigatório vazio, código de vínculo inexistente, data inválida ou data de liberação fora da segunda-feira/próximo dia útil permitido
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
