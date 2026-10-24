# Spec Delta

## MODIFIED Requirements

### Requirement: Listagem de softwares

A tela SHALL carregar o catálogo de `GET /api/softwares` e exibi-lo em uma tabela com as colunas
**Código, Descrição, Categoria, Situação, Criado em e Atualizado em**, além da coluna de ações.
Enquanto a leitura está em voo, SHALL exibir um overlay de carregamento sem conteúdo parcial. Se a
leitura falhar, SHALL exibir um aviso de erro e manter a lista **vazia** — nunca apresentar dados de
demonstração como se fossem persistidos. A tabela SHALL oferecer busca, ordenação e paginação no
cliente, como as demais telas do kit.

#### Scenario: Carregamento sem conteúdo parcial

- **WHEN** a tela é aberta e a leitura de `GET /api/softwares` ainda não respondeu
- **THEN** a área de conteúdo exibe apenas o overlay de carregamento (sem KPIs/tabela vazios)

#### Scenario: Colunas da listagem

- **WHEN** o catálogo é exibido
- **THEN** a tabela mostra as colunas Código, Descrição, Categoria, Situação, Criado em e Atualizado em, com Categoria e Situação em `UiBadge` e o código em fonte monoespaçada

#### Scenario: Catálogo vazio

- **WHEN** a leitura responde sem nenhum software
- **THEN** a tabela exibe seu estado vazio e nenhum dado fictício é mostrado

#### Scenario: Falha na leitura

- **WHEN** `GET /api/softwares` falha ou ainda não existe
- **THEN** a tela exibe um aviso de erro e a lista permanece vazia

#### Scenario: Busca, ordenação e paginação

- **WHEN** o usuário usa a busca, ordena por uma coluna ou troca de página
- **THEN** a tabela reflete a interação sobre o conjunto vigente

### Requirement: Cadastro e edição de software

O sistema SHALL oferecer um modal de cadastro/edição acionado por "Novo Software" (criação) e pela
ação de linha "Editar" (edição), com os campos **Descrição** (obrigatória, até 200 caracteres),
**Categoria** (`Delphi` | `Web` | `Delphi e Web`) e **Situação** (`Ativo` | `Inativo`). Na criação
o registro nasce com categoria `Delphi` e situação `Ativo`; na edição o modal exibe a seção
**Informações de Cadastro** com `criado_em` e `atualizado_em` desabilitados. Salvar SHALL gravar via
`POST /api/softwares` (criação) ou `PUT /api/softwares/:codigo` (edição); o código é imutável e
identifica a rota. O sucesso fecha o modal e confirma a ação; em falha, o modal permanece aberto e o
erro é informado.

#### Scenario: Abrir cadastro com padrões

- **WHEN** o usuário aciona "Novo Software"
- **THEN** o modal "Novo Software" abre com categoria `Delphi` e situação `Ativo`, sem a seção de Informações de Cadastro

#### Scenario: Abrir edição com o registro e os carimbos de cadastro

- **WHEN** o usuário aciona "Editar" em uma linha
- **THEN** o modal "Editar Software" abre preenchido, com o Código somente leitura e Criado em/Atualizado em desabilitados

#### Scenario: Descrição obrigatória

- **WHEN** o usuário tenta salvar com a descrição vazia
- **THEN** o campo Descrição exibe o erro e recebe o foco, e nenhuma requisição é enviada

#### Scenario: Salvar com sucesso

- **WHEN** o usuário salva um formulário válido
- **THEN** o registro é gravado (POST na criação, PUT /:codigo na edição), o modal fecha e um aviso de sucesso é exibido

#### Scenario: Falha ao salvar mantém o modal

- **WHEN** a gravação falha
- **THEN** o modal permanece aberto e um aviso de erro é exibido

### Requirement: Backend do catálogo de softwares

O sistema SHALL servir o catálogo de softwares pela API sob a permissão do módulo `softwares`:
`GET /api/softwares` (visualizar; `?exportar=1` → `exportar`) devolve a lista em ordem de `codigo`;
`POST /api/softwares` (criar) cria o software gerando o próximo `codigo`; `PUT /api/softwares/:codigo`
(alterar) e `DELETE /api/softwares/:codigo` (excluir) operam por código. As escritas SHALL validar os
campos (descrição obrigatória de até 200 caracteres; categoria e situação restritas ao domínio),
responder `404` quando o código não existir, `409` quando a exclusão for bloqueada por entregas
vinculadas e registrar a operação na trilha de auditoria com recurso "Softwares". A geração do
código SHALL ser sequencial e resiliente a concorrência (a unicidade da chave primária barra a
corrida e a inserção é repetida).

#### Scenario: Listar o catálogo em ordem de código

- **WHEN** um usuário com `softwares`/`visualizar` chama `GET /api/softwares`
- **THEN** a resposta é a lista de softwares ordenada por `codigo`

#### Scenario: Guarda de exportação

- **WHEN** um perfil sem `softwares`/`exportar` chama `GET /api/softwares?exportar=1`
- **THEN** a API responde `403` e nenhum arquivo é gerado

#### Scenario: Criar gera código e registra auditoria

- **WHEN** um usuário com `softwares`/`criar` cria um software válido
- **THEN** o registro é gravado com o próximo código sequencial, a resposta é `201` e a trilha registra uma Inclusão do recurso "Softwares"

#### Scenario: Validação recusa campos inválidos

- **WHEN** a criação ou a edição envia descrição vazia, categoria ou situação fora do domínio
- **THEN** a API responde `400` sem gravar

#### Scenario: Código inexistente responde 404

- **WHEN** `PUT` ou `DELETE` é chamado com um `codigo` que não existe
- **THEN** a API responde `404`

#### Scenario: Exclusão bloqueada por vínculo
- **WHEN** `DELETE /api/softwares/:codigo` é chamado para um software referenciado por entregas
- **THEN** a API responde `409` com o motivo e nenhum registro é removido

#### Scenario: Sem permissão a escrita é negada

- **WHEN** um perfil sem `softwares`/`criar` (ou `alterar`/`excluir`) chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado