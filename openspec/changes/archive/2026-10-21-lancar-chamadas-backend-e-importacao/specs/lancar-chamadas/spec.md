# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: A fase frontend opera sem persistência

**Reason**: A tela deixa de operar com dataset em memória; todas as leituras e escritas passam a
usar `entregas_itens` pela API, com persistência após recarregar a página.

**Migration**: Substituir o seed e as mutações locais por `GET/POST/PUT/DELETE` em
`/api/lancar-chamadas`; não há dados de demonstração a migrar.

## ADDED Requirements

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
