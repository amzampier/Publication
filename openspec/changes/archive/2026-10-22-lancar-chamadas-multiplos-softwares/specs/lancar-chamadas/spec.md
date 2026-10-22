# Spec Delta

## MODIFIED Requirements

### Requirement: O modal de filtros refina a listagem e os KPIs

A tela SHALL oferecer um modal de filtros em **três colunas a partir de `sm`** com **Status**, **Situação**,
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

A tela SHALL oferecer a ação **Importar**, visível apenas com `lancar-chamadas`/`importar`, que aceita
um arquivo `.xlsx` no modelo versionado e apresenta um preview antes de confirmar. O preview SHALL
classificar cada linha como `pronto`, `já cadastrado`, `repetido` ou `inválido` e exibir os erros por
linha e coluna. O servidor SHALL revalidar as linhas e os vínculos, rejeitar payload fora do
contrato, limitar a importação a 500 linhas e gravar todas as linhas válidas em uma única transação.
Linhas inválidas, duplicadas ou já cadastradas SHALL impedir a importação completa, sem gravação
parcial. As chamadas importadas SHALL nascer com status `Revisar` e situação `Desenvolvimento`, SHALL resolver
release, projeto, manual, **um ou mais softwares separados por `;`** e parceiro pelos códigos da planilha, SHALL aceitar múltiplas tags
separadas por `;` e NÃO SHALL importar imagens, status ou situação.

#### Scenario: Importação válida

- **WHEN** o usuário importa um arquivo com linhas válidas e confirma o preview
- **THEN** todas as chamadas são criadas com status `Revisar`, situação `Desenvolvimento` e os vínculos resolvidos pelos códigos

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

- **WHEN** o arquivo contém campo obrigatório vazio, código de vínculo inexistente ou data inválida
- **THEN** o preview marca a linha como `inválida`, indica o erro e a importação completa é bloqueada

#### Scenario: Limite de linhas

- **WHEN** o arquivo contém mais de 500 linhas de dados
- **THEN** a importação é rejeitada antes de qualquer gravação

#### Scenario: Sem permissão de importação

- **WHEN** um perfil sem `importar` envia o arquivo para a rota de importação
- **THEN** a API responde `403` e nenhuma chamada é criada

## ADDED Requirements

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
