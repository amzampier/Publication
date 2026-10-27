# Spec Delta

## MODIFIED Requirements

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

### Requirement: A importação XLSX cria chamadas em lote

A tela SHALL oferecer a ação **Importar**, visível apenas com `lancar-chamadas`/`importar`, que aceita
um arquivo `.xlsx` no modelo versionado e apresenta um preview antes de confirmar. O preview SHALL
classificar cada linha como `pronto`, `já cadastrado`, `repetido` ou `inválido` e exibir os erros por
linha e coluna. O servidor SHALL revalidar as linhas e os vínculos, rejeitar payload fora do
contrato, limitar a importação a 500 linhas e gravar todas as linhas válidas em uma única transação.
Linhas inválidas, duplicadas ou já cadastradas SHALL impedir a importação completa, sem gravação
parcial. As chamadas importadas SHALL nascer com status `Revisar`, SHALL resolver
release, projeto, manual, **um ou mais softwares separados por `;`** e parceiro pelos códigos da planilha, SHALL aceitar múltiplas tags
separadas por `;` e NÃO SHALL importar imagens, status ou situação. As datas de lançamento e de
liberação SHALL seguir a mesma validação da criação, incluindo segunda-feira ou o próximo dia útil
quando a segunda-feira da semana for feriado; uma linha com data fora dessa regra SHALL ser
classificada como `inválida` e bloquear a importação completa.

#### Scenario: Importação válida

- **WHEN** o usuário importa um arquivo com linhas válidas e confirma o preview
- **THEN** todas as chamadas são criadas com status `Revisar` e os vínculos resolvidos pelos códigos

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

- **WHEN** o arquivo contém campo obrigatório vazio, código de vínculo inexistente, data inválida ou data fora da segunda-feira/próximo dia útil permitido
- **THEN** o preview marca a linha como `inválida`, indica o erro e a importação completa é bloqueada

#### Scenario: Limite de linhas

- **WHEN** o arquivo contém mais de 500 linhas de dados
- **THEN** a importação é rejeitada antes de qualquer gravação

#### Scenario: Sem permissão de importação

- **WHEN** um perfil sem `importar` envia o arquivo para a rota de importação
- **THEN** a API responde `403` e nenhuma chamada é criada
