# Spec Delta

## MODIFIED Requirements

### Requirement: Estrutura do catálogo de softwares

O catálogo SHALL representar cada software por um **código** (`codigo`) que é a **sua identidade e
chave primária**, no formato sequencial `SFT-001`, junto de `descricao` (nome/descrição exibido),
`categoria`, `situacao`, `criado_em` e `atualizado_em`. `categoria` SHALL assumir um dos valores
`Delphi`, `Web` ou `Delphi e Web` e `situacao` SHALL assumir `Ativo` ou `Inativo`; os timestamps e o
`codigo` SHALL ser gerados pelo sistema (criação e última atualização), nunca digitados na tela. O
`codigo` SHALL ser único e imutável após a criação.

#### Scenario: Software com os campos do catálogo

- **WHEN** um software do catálogo é exibido
- **THEN** ele apresenta código, descrição, categoria (`Delphi`, `Web` ou `Delphi e Web`), situação
  (`Ativo` ou `Inativo`) e os carimbos de criação e atualização

#### Scenario: Categoria e situação restritas ao domínio

- **WHEN** a categoria ou a situação é apresentada ou filtrada
- **THEN** apenas os valores do domínio (`Delphi`/`Web`/`Delphi e Web` e `Ativo`/`Inativo`) são
  oferecidos

#### Scenario: Código gerado e imutável

- **WHEN** um software é incluído
- **THEN** o sistema atribui o próximo código sequencial (ex.: `SFT-001`) e o código não é editável
  na tela

### Requirement: Acionamento da importação de softwares

A toolbar da tabela SHALL apresentar, imediatamente à **esquerda** do botão "Filtros", a affordância
de **importação** dos softwares a partir do modelo `.xlsx` (ícone `Import`), que SHALL abrir o modal
de importação.

#### Scenario: Affordância de importação ao lado de Filtros

- **WHEN** a toolbar da tabela é exibida
- **THEN** o botão de importação aparece imediatamente à esquerda do botão "Filtros"

#### Scenario: Acionar a importação com a execução adiada

- **WHEN** o usuário aciona a importação
- **THEN** o modal de importação de softwares é aberto para a seleção do arquivo

## ADDED Requirements

### Requirement: Backend do catálogo de softwares

O sistema SHALL servir o catálogo de softwares pela API sob a permissão do módulo `softwares`:
`GET /api/softwares` (visualizar) devolve a lista completa em ordem de `codigo`; `POST /api/softwares`
(criar) cria o software gerando o próximo `codigo`; `PUT /api/softwares/:codigo` (alterar) e
`DELETE /api/softwares/:codigo` (excluir) operam por código. As escritas SHALL validar os campos
(descrição obrigatória de até 200 caracteres; categoria e situação restritas ao domínio), responder
`404` quando o código não existir e registrar a operação na trilha de auditoria com recurso
"Softwares". A geração do código SHALL ser sequencial e resiliente a concorrência (a unicidade da
chave primária barra a corrida e a inserção é repetida).

#### Scenario: Listar o catálogo em ordem de código

- **WHEN** um usuário com `softwares`/`visualizar` chama `GET /api/softwares`
- **THEN** a resposta é a lista de softwares ordenada por `codigo`

#### Scenario: Criar gera código e registra auditoria

- **WHEN** um usuário com `softwares`/`criar` cria um software válido
- **THEN** o registro é gravado com o próximo código sequencial, a resposta é `201` e a trilha
  registra uma Inclusão do recurso "Softwares"

#### Scenario: Validação recusa campos inválidos

- **WHEN** a criação ou a edição envia descrição vazia, categoria ou situação fora do domínio
- **THEN** a API responde `400` sem gravar

#### Scenario: Código inexistente responde 404

- **WHEN** `PUT` ou `DELETE` é chamado com um `codigo` que não existe
- **THEN** a API responde `404`

#### Scenario: Sem permissão a escrita é negada

- **WHEN** um perfil sem `softwares`/`criar` (ou `alterar`/`excluir`) chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

### Requirement: Importação de softwares por planilha

O sistema SHALL importar softwares de uma planilha `.xlsx` com as colunas **Descrição, Categoria e
Situação** por `POST /api/softwares/importar`, sob a permissão `softwares`/`importar`. O servidor
SHALL revalidar cada linha contra o banco, recusar a importação inteira (`400`, com os motivos)
quando houver linha inválida, tratar descrições já cadastradas como conflito (sem gravar) e, quando
tudo estiver válido, gravar em **transação** atribuindo os códigos sequenciais. Os códigos são
gerados pelo servidor — a planilha não os informa. A importação bem-sucedida SHALL ser registrada na
trilha de auditoria.

#### Scenario: Importar linhas válidas

- **WHEN** um usuário com `softwares`/`importar` envia linhas válidas
- **THEN** cada software é gravado com um código sequencial e a resposta informa quantos foram
  importados

#### Scenario: Linha inválida recusa a importação inteira

- **WHEN** alguma linha tem descrição vazia, categoria ou situação inválida
- **THEN** a API responde `400` com os motivos e nenhum software é gravado

#### Scenario: Descrição já cadastrada é conflito

- **WHEN** a planilha traz descrição já existente na base (case-insensitive)
- **THEN** nenhum software é gravado e a resposta identifica os conflitos

#### Scenario: Importação exige a permissão de importar

- **WHEN** um perfil sem `softwares`/`importar` chama a rota de importação
- **THEN** a API responde `403` e nada é gravado
