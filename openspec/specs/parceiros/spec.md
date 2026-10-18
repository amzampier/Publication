# parceiros Specification

## Purpose

Define a tela administrativa de Parceiros (clientes, redes e distribuidoras): rota e shell, a
listagem em grade de cards, o cadastro com código `PAR-XXX` gerado pelo servidor, região derivada
da UF e logo exibida apenas no cadastro/edição, os filtros por situação/região/estado, as
exportações PDF/CSV, a exclusão e a importação por planilha — fixando o contrato que o backend
servirá.

## Requirements

### Requirement: Acesso e rota da tela de Parceiros

O sistema SHALL expor a tela de parceiros em `/admin/parceiros`, renderizada dentro do shell da Área
Administrativa (header + sidebar) como as demais rotas sob `/admin/**`. A tela SHALL ser alcançável
pelo item **Parceiros** da sessão **Cadastros** da sidebar, que passa a declarar a rota
`/admin/parceiros` e a navegar ao clique. O acesso SHALL estar sujeito à mesma guarda de sessão das
demais telas administrativas.

#### Scenario: Item Parceiros navega pela sidebar

- **WHEN** o usuário clica em "Parceiros" na sidebar
- **THEN** o navegador vai para `/admin/parceiros` e a tela é renderizada dentro do shell

#### Scenario: Item Parceiros fica ativo na própria rota

- **WHEN** a rota corrente é `/admin/parceiros`
- **THEN** o item "Parceiros" da sidebar é exibido como ativo, com `aria-current="page"`

#### Scenario: Rota protegida exige sessão

- **WHEN** um visitante sem sessão tenta abrir `/admin/parceiros`
- **THEN** ele é redirecionado para `/admin/login?redirect=/admin/parceiros`

### Requirement: Estrutura do cadastro de parceiros

Cada parceiro SHALL ser representado por um `id` (identificador interno, chave primária) e por um
**código** `codigo` no formato sequencial `PAR-XXX`, que é um identificador secundário — **não** é a
chave primária. O parceiro SHALL conter `razao_social` (obrigatória), `nome_fantasia` (obrigatória),
`cidade`, `estado` (UF), `regiao` (uma das cinco regiões do Brasil), `logo_url`, `situacao`,
`criado_em` e `atualizado_em`. `situacao` SHALL assumir `Ativo`, `Inativo` ou `Bloqueado`; `regiao`
SHALL assumir `Norte`, `Nordeste`, `Centro-Oeste`, `Sudeste` ou `Sul`. O `codigo` e os timestamps
SHALL ser gerados pelo sistema, nunca digitados; o `codigo` SHALL ser único. A região SHALL ser
**derivada da UF** informada no Estado.

#### Scenario: Parceiro com os campos do cadastro

- **WHEN** um parceiro é exibido
- **THEN** ele apresenta código, razão social, nome fantasia, cidade, estado, região, situação e os
  carimbos de criação e atualização

#### Scenario: Situação e região restritas ao domínio

- **WHEN** a situação ou a região é apresentada, escolhida ou filtrada
- **THEN** apenas os valores do domínio (situação `Ativo`/`Inativo`/`Bloqueado` e as cinco regiões)
  são oferecidos

#### Scenario: Código gerado e imutável

- **WHEN** um parceiro é incluído
- **THEN** o sistema atribui o próximo código sequencial (ex.: `PAR-001`) e o código não é editável
  na tela

#### Scenario: Região derivada da UF

- **WHEN** o usuário escolhe o Estado (UF) no cadastro/edição
- **THEN** a região correspondente à UF é preenchida automaticamente

### Requirement: Listagem de parceiros em cards

A tela SHALL carregar os parceiros de `GET /api/parceiros` e exibi-los em uma **grade de cards**
(não em tabela). Cada card SHALL apresentar o **código** (`PAR-XXX`), um `UiBadge` de **situação**,
a **razão social** como título, o **nome fantasia** como subtítulo e as linhas de **Localização**
(`cidade - UF`) e **Região**. O card SHALL oferecer, no topo direito, as ações **Editar** e
**Excluir**, que ficam visíveis no hover e no foco de teclado. A grade SHALL oferecer busca e
**paginação no cliente**. Enquanto a leitura está em voo, SHALL exibir um overlay de carregamento
sem conteúdo parcial; se a leitura falhar, SHALL exibir um aviso de erro e manter a grade **vazia**
— nunca apresentar dados de demonstração como se fossem persistidos.

#### Scenario: Conteúdo do card

- **WHEN** a grade de parceiros é exibida
- **THEN** cada card mostra código, situação (badge), razão social, nome fantasia, localização
  (`cidade - UF`) e região

#### Scenario: Ações do card acessíveis

- **WHEN** o ponteiro passa sobre o card ou as ações recebem foco de teclado
- **THEN** as ações Editar e Excluir ficam visíveis e acionáveis

#### Scenario: Carregamento sem conteúdo parcial

- **WHEN** a tela é aberta e a leitura de `GET /api/parceiros` ainda não respondeu
- **THEN** a área de conteúdo exibe apenas o overlay de carregamento (sem KPIs/grade vazios)

#### Scenario: Busca e paginação no cliente

- **WHEN** o usuário usa a busca ou troca de página
- **THEN** a grade reflete a interação sobre o conjunto vigente

#### Scenario: Falha na leitura

- **WHEN** `GET /api/parceiros` falha ou ainda não existe
- **THEN** a tela exibe um aviso de erro e a grade permanece vazia

#### Scenario: Nenhum parceiro cadastrado

- **WHEN** a leitura responde sem nenhum parceiro
- **THEN** a grade exibe seu estado vazio e nenhum dado fictício é mostrado

### Requirement: KPIs de parceiros por situação

A tela SHALL exibir indicadores derivados do conjunto vigente (o conjunto filtrado, quando houver
filtro): quantidade de parceiros **Ativos**, **Inativos** e **Bloqueados**.

#### Scenario: KPIs acompanham o conjunto vigente

- **WHEN** um filtro refina o conjunto exibido
- **THEN** os KPIs são recalculados sobre o conjunto filtrado

### Requirement: Filtros por situação, região e estado

A tela SHALL oferecer um modal de filtros acionado pela toolbar da grade, com seleções de
**Situação**, **Região** e **Estado** (vazio = todos) e os botões "Limpar Filtros", "Cancelar" e
"Aplicar". Aplicar SHALL refinar o conjunto vigente; limpar SHALL zerar os filtros e restaurar o
conjunto completo; a toolbar SHALL indicar a quantidade de filtros ativos.

#### Scenario: Aplicar filtro refina a listagem

- **WHEN** o usuário seleciona situação, região ou estado e clica em "Aplicar"
- **THEN** a grade e os KPIs passam a refletir apenas os parceiros que casam com o filtro

#### Scenario: Limpar filtros restaura o conjunto

- **WHEN** o usuário clica em "Limpar Filtros"
- **THEN** os filtros são zerados e o conjunto completo volta a ser exibido

#### Scenario: Contador de filtros ativos

- **WHEN** há filtros ativos
- **THEN** o botão "Filtros" da toolbar exibe a quantidade de filtros aplicados

#### Scenario: Cancelar descarta o rascunho

- **WHEN** o usuário altera seleções e clica em "Cancelar"
- **THEN** o modal fecha e o conjunto vigente permanece inalterado

### Requirement: Exportação do catálogo de parceiros

A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a geração da **listagem em PDF** e a
**exportação em CSV**, ambas sobre o conjunto filtrado vigente. O PDF SHALL conter o cabeçalho com a
logomarca configurada, quando houver, e as colunas do cadastro; o CSV SHALL ser emitido em `;` com
BOM UTF-8 e neutralizar fórmulas de planilha. Falhas na geração SHALL produzir aviso de erro, sem
interromper a tela.

#### Scenario: Exportar CSV do conjunto filtrado

- **WHEN** o usuário escolhe "Exportar em CSV" com um filtro aplicado
- **THEN** é baixado um arquivo CSV com os parceiros filtrados e as colunas do cadastro

#### Scenario: Gerar a listagem em PDF

- **WHEN** o usuário escolhe "Listagem em PDF"
- **THEN** é gerado um PDF com o cabeçalho (logomarca, quando houver) e os parceiros do conjunto
  filtrado

#### Scenario: Falha na exportação

- **WHEN** a geração do PDF ou do CSV falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

### Requirement: Cadastro e edição de parceiro

O sistema SHALL oferecer um modal de cadastro/edição acionado por "Novo Parceiro" (criação) e pela
ação "Editar" do card (edição), com os campos **Razão Social** (obrigatória), **Nome Fantasia**
(obrigatória), **Cidade**, **Estado** (UF), **Região** (derivada da UF), **Situação**
(`Ativo`|`Inativo`|`Bloqueado`) e **Logo**. O campo **Logo** SHALL ser exibido **apenas** neste modal
(cadastro/edição), nunca no card. Na criação o registro nasce com situação `Ativo`; na edição o modal
exibe a seção **Informações de Cadastro** com código (somente leitura) e `criado_em`/`atualizado_em`
desabilitados. Salvar SHALL gravar via `POST /api/parceiros` (criação) ou `PUT /api/parceiros/:id`
(edição); o sucesso fecha o modal e confirma a ação; em falha, o modal permanece aberto e o erro é
informado.

#### Scenario: Abrir cadastro com padrões

- **WHEN** o usuário aciona "Novo Parceiro"
- **THEN** o modal "Novo Parceiro" abre com situação `Ativo` e sem a seção de Informações de Cadastro

#### Scenario: Abrir edição com o registro

- **WHEN** o usuário aciona "Editar" em um card
- **THEN** o modal abre preenchido, com código somente leitura e Criado em/Atualizado em desabilitados

#### Scenario: Campos obrigatórios

- **WHEN** o usuário tenta salvar sem razão social ou sem nome fantasia
- **THEN** o campo exibe o erro e recebe o foco, e nenhuma requisição é enviada

#### Scenario: Logo apenas no cadastro/edição

- **WHEN** o cadastro/edição é exibido
- **THEN** o campo de Logo está presente no modal e ausente do card da listagem

#### Scenario: Salvar com sucesso

- **WHEN** o usuário salva um formulário válido
- **THEN** o registro é gravado (POST na criação, PUT na edição), o modal fecha e um aviso de sucesso
  é exibido

#### Scenario: Falha ao salvar mantém o modal

- **WHEN** a gravação falha
- **THEN** o modal permanece aberto e um aviso de erro é exibido

### Requirement: Exclusão de parceiro

O sistema SHALL oferecer a ação **Excluir** no card, que abre um modal de confirmação com a
identificação do parceiro. Confirmar SHALL remover o registro via `DELETE /api/parceiros/:id`; o
sucesso fecha o modal, retira o card da grade e confirma a ação; em falha, um aviso de erro é exibido
com a grade intacta. A exclusão de um parceiro vinculado a entregas SHALL ser recusada.

#### Scenario: Abrir a confirmação de exclusão

- **WHEN** o usuário aciona "Excluir" em um card
- **THEN** o modal de confirmação abre exibindo a identificação do parceiro

#### Scenario: Confirmar exclusão

- **WHEN** o usuário confirma a exclusão
- **THEN** o registro é removido via `DELETE`, o card sai da grade e um aviso de sucesso é exibido

#### Scenario: Parceiro vinculado a entregas não é excluído

- **WHEN** o parceiro possui entregas vinculadas
- **THEN** a exclusão é recusada, um aviso é exibido e a grade permanece intacta

### Requirement: Acionamento da importação de parceiros

A toolbar da grade SHALL apresentar, imediatamente à **esquerda** do botão "Filtros", a affordância
de **importação** dos parceiros a partir do modelo `.xlsx` (ícone `Import`), que SHALL abrir o modal
de importação.

#### Scenario: Affordância de importação ao lado de Filtros

- **WHEN** a toolbar da grade é exibida
- **THEN** o botão de importação aparece imediatamente à esquerda do botão "Filtros"

#### Scenario: Acionar a importação

- **WHEN** o usuário aciona a importação
- **THEN** o modal de importação de parceiros é aberto para a seleção do arquivo

### Requirement: Modelo de importação versionado

O projeto SHALL manter o modelo oficial de importação de parceiros versionado em
`docs/modelos/modelo-importacao-parceiros.xlsx`, com as colunas **Razão Social, Nome Fantasia,
Cidade, Estado, Região e Situação**. A logo não faz parte da importação (é informada apenas no
cadastro/edição).

#### Scenario: Modelo com as colunas oficiais

- **WHEN** o modelo de importação é aberto
- **THEN** o cabeçalho apresenta as colunas Razão Social, Nome Fantasia, Cidade, Estado, Região e
  Situação

### Requirement: Backend do cadastro de parceiros

O sistema SHALL servir o cadastro de parceiros pela API sob a permissão do módulo `parceiros`:
`GET /api/parceiros` (visualizar) devolve a lista completa; `POST /api/parceiros` (criar) cria o
parceiro gerando o próximo `codigo` `PAR-XXX`; `PUT /api/parceiros/:id` (alterar) e
`DELETE /api/parceiros/:id` (excluir) operam por `id`. As escritas SHALL validar os campos (razão
social e nome fantasia obrigatórios; situação e região restritas ao domínio; região coerente com a
UF do estado), responder `404` quando o `id` não existir e registrar a operação na trilha de
auditoria com recurso "Parceiros". A geração do código SHALL ser sequencial e resiliente a
concorrência (a unicidade do `codigo` barra a corrida e a inserção é repetida). A exclusão de um
parceiro com entregas vinculadas SHALL responder `409` sem remover o registro.

#### Scenario: Listar o cadastro de parceiros

- **WHEN** um usuário com `parceiros`/`visualizar` chama `GET /api/parceiros`
- **THEN** a resposta é a lista de parceiros do cadastro

#### Scenario: Criar gera código e registra auditoria

- **WHEN** um usuário com `parceiros`/`criar` cria um parceiro válido
- **THEN** o registro é gravado com o próximo código sequencial `PAR-XXX`, a resposta é `201` e a
  trilha registra uma Inclusão do recurso "Parceiros"

#### Scenario: Validação recusa campos inválidos

- **WHEN** a criação ou a edição envia razão social/nome fantasia vazios, situação ou região fora do
  domínio, ou região incoerente com a UF
- **THEN** a API responde `400` sem gravar

#### Scenario: Identificador inexistente responde 404

- **WHEN** `PUT` ou `DELETE` é chamado com um `id` que não existe
- **THEN** a API responde `404`

#### Scenario: Exclusão com entregas vinculadas responde 409

- **WHEN** `DELETE` é chamado para um parceiro com entregas vinculadas
- **THEN** a API responde `409` e o registro permanece

#### Scenario: Sem permissão a escrita é negada

- **WHEN** um perfil sem `parceiros`/`criar` (ou `alterar`/`excluir`) chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

### Requirement: Importação de parceiros por planilha

O sistema SHALL importar parceiros de uma planilha `.xlsx` com as colunas **Razão Social, Nome
Fantasia, Cidade, Estado, Região e Situação** por `POST /api/parceiros/importar`, sob a permissão
`parceiros`/`importar`. O servidor SHALL revalidar cada linha contra o banco, recusar a importação
inteira (`400`, com os motivos) quando houver linha inválida, tratar razão social já cadastrada como
conflito (case-insensitive, sem gravar) e, quando tudo estiver válido, gravar em **transação**
atribuindo os códigos sequenciais. Os códigos são gerados pelo servidor — a planilha não os informa;
a logo não é importada. A importação bem-sucedida SHALL ser registrada na trilha de auditoria.

#### Scenario: Importar linhas válidas

- **WHEN** um usuário com `parceiros`/`importar` envia linhas válidas
- **THEN** cada parceiro é gravado com um código sequencial e a resposta informa quantos foram
  importados

#### Scenario: Linha inválida recusa a importação inteira

- **WHEN** alguma linha tem razão social/nome fantasia vazio, situação ou região inválida
- **THEN** a API responde `400` com os motivos e nenhum parceiro é gravado

#### Scenario: Razão social já cadastrada é conflito

- **WHEN** a planilha traz razão social já existente na base (case-insensitive)
- **THEN** nenhum parceiro é gravado e a resposta identifica os conflitos

#### Scenario: Importação exige a permissão de importar

- **WHEN** um perfil sem `parceiros`/`importar` chama a rota de importação
- **THEN** a API responde `403` e nada é gravado
