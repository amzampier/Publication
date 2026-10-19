# Spec Delta: release-week

## MODIFIED Requirements

### Requirement: A tela representa o cabeçalho da semana
Cada Release Week SHALL ser representada pelos campos do cabeçalho: `codigo`, `nome`, `versao`,
`release`, `semana` (1 a 52), `ano`, `mes` (por extenso), `data_inicio`, `data_finaliza`,
`data_publicacao`, `status` (`Aberta` | `Em Revisão` | `Aprovado` | `Publicado`), `descricao`,
`destaque_semana`, `autor_nome`, `revisor_nome`, `arquivada`, `criado_em` e `atualizado_em`. O
status SHALL ser exibido em `UiBadge` com variantes distintas para `Aberta`, `Em Revisão`,
`Aprovado` e `Publicado`. O `codigo`, os carimbos e os nomes de autor/revisor SHALL ser gerados pelo
sistema, nunca digitados na tela.

#### Scenario: Cabeçalho exibe os campos da semana
- **WHEN** uma Release Week é exibida
- **THEN** ela apresenta código, nome, semana/ano, período, status em `UiBadge`, autor e data de
  publicação, com as datas formatadas em pt-BR

#### Scenario: Status restrito ao domínio
- **WHEN** o status é apresentado ou editado
- **THEN** apenas `Aberta`, `Em Revisão`, `Aprovado` e `Publicado` são oferecidos

### Requirement: Clonagem de Release Week
O sistema SHALL oferecer a ação de linha **Clonar**, que abre o modal de cadastro em modo criação com
apenas **Versão**, **Release** e **Destaque da semana** preenchidos a partir do registro de origem. Os
demais campos — **Código**, **Nome**, **Semana**, **Ano**, **Mês**, datas, **Status** e **Descrição**
— SHALL abrir em branco (status volta ao padrão `Aberta`). A clonagem NÃO SHALL copiar os itens da
release nem gravar nada antes de o usuário salvar. A ação SHALL ser exibida somente quando o perfil
conceder **`clonar`**; a gravação SHALL usar `POST /api/release-week` (a mesma criação) e exigir
**`criar`** no servidor.

#### Scenario: Clonar abre o formulário parcialmente preenchido
- **WHEN** o usuário aciona "Clonar" em uma Release Week
- **THEN** o modal abre com Versão, Release e Destaque copiados, os demais campos vazios e status
  `Aberta`, sem criar um novo registro ainda

#### Scenario: Clonar não copia itens
- **WHEN** a Release Week de origem possui itens vinculados
- **THEN** o formulário de clonagem não traz itens e o novo registro nasce sem itens

#### Scenario: Sem a permissão de clonar a ação não aparece
- **WHEN** o perfil do usuário não concede `release-week`/`clonar`
- **THEN** a ação "Clonar" não é oferecida na linha

#### Scenario: Clonar sem criar é recusado
- **WHEN** um perfil concede `clonar` mas não `criar` e tenta gravar a clonagem
- **THEN** a API responde `403` e nenhuma Release Week é criada

### Requirement: Exclusão condicionada de Release Week
O sistema SHALL oferecer a ação **Excluir** somente quando a Release Week **não estiver arquivada** e
**não possuir nenhum item/relacionamento** vinculado. Quando uma dessas condições falhar, a ação
SHALL ficar indisponível com a indicação acessível do motivo (release arquivada ou release com itens),
e nenhum dado SHALL ser removido. A API SHALL reaplicar a mesma guarda e responder `409` quando a
release estiver arquivada ou possuir itens, mesmo que a chamada contorne a interface. A confirmação
de exclusão SHALL remover o registro do conjunto vigente e fechar o modal com aviso de sucesso. A
ação SHALL respeitar a permissão de `excluir`.

#### Scenario: Excluir release sem vínculos
- **WHEN** a Release Week não está arquivada e não possui itens, e o usuário confirma a exclusão
- **THEN** o registro é removido da listagem e um aviso de sucesso é exibido

#### Scenario: Release com itens não pode ser excluída
- **WHEN** a Release Week possui itens vinculados
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

#### Scenario: Release arquivada não pode ser excluída
- **WHEN** a Release Week está arquivada
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

#### Scenario: A API recusa a exclusão bloqueada
- **WHEN** `DELETE /api/release-week/:id` é chamado para uma release arquivada ou com itens
- **THEN** a API responde `409` com o motivo e nenhum registro é removido

### Requirement: Flag de itens e expansão somente leitura
A tabela SHALL oferecer um **controle no cabeçalho** que habilita a visualização dos itens. Enquanto
habilitado, cada Release Week SHALL exibir um sinal **"+"**; ao acioná-lo, a linha SHALL expandir e
revelar os **itens da release** (`entregas_itens` vinculados) em modo somente leitura, com Chamada,
Título, Software, Módulo, Tipo, Impacto, Situação, Status e Data de liberação, obtidos de
`GET /api/release-week/:id/itens` sob demanda. Acionar novamente recolhe a linha. Release sem itens
SHALL exibir um estado vazio próprio dentro da expansão. A coluna de expansão não SHALL afetar
ordenação, busca ou paginação. A flag, a expansão e o endpoint de itens SHALL exigir a permissão
**`release-week`/`visualizar_itens`**; sem ela, a flag não é exibida e a API responde `403`.

#### Scenario: Habilitar a flag revela o sinal de "+"
- **WHEN** o usuário marca a flag de itens no cabeçalho da tabela
- **THEN** cada Release Week passa a exibir um sinal "+" para expandir

#### Scenario: Expandir mostra os itens da release
- **WHEN** o usuário aciona o "+" de uma Release Week com itens
- **THEN** a linha expande e exibe os itens daquela release em modo somente leitura

#### Scenario: Release sem itens
- **WHEN** o usuário expande uma Release Week sem itens
- **THEN** a expansão exibe um estado vazio informando que não há itens

#### Scenario: Recolher a expansão
- **WHEN** o usuário aciona novamente o controle de uma linha expandida
- **THEN** a linha recolhe e os itens deixam de ser exibidos

#### Scenario: Itens exigem a permissão própria
- **WHEN** um perfil sem `release-week`/`visualizar_itens` chama `GET /api/release-week/:id/itens`
- **THEN** a API responde `403` e nenhum item é retornado

## REMOVED Requirements

### Requirement: Dataset em memória de rascunho

**Reason**: A fase frontend sobre dataset em memória foi substituída pela persistência real no banco
via API; os dados de exemplo deixam de existir.

**Migration**: `release-week-backend-e-importacao` — a tela passa a carregar/gravar em
`/api/release-week/**`, sem seed de Release Weeks (banco novo começa vazio).

### Requirement: Affordância de importação

**Reason**: A importação deixou de ser apenas um ícone e passa a ser funcional (modal, parser,
modelo `.xlsx` e endpoint transacional).

**Migration**: `release-week-backend-e-importacao` — usar `POST /api/release-week/importar` e o
modelo `docs/modelos/modelo-importacao-release-week.xlsx`.

## ADDED Requirements

### Requirement: A tela carrega e persiste Release Weeks pela API
A tela SHALL carregar as Release Weeks de `GET /api/release-week` na montagem e exibir um overlay
`UiLoading` ("Carregando Release Week…") enquanto a requisição estiver em voo, sem conteúdo parcial;
em falha, SHALL exibir toast de erro e manter a tabela vazia. Toda mutação bem-sucedida (inclusão,
edição, clonagem, publicação, arquivamento e exclusão) SHALL ser refletida na tabela e nos KPIs, e a
recarga da página SHALL rebuscar pela API — o que foi gravado persiste, sem base de demonstração.

#### Scenario: Carga inicial pela API
- **WHEN** o navegador abre `/admin/release-week`
- **THEN** o overlay de carregamento é exibido enquanto `GET /api/release-week` responde e, em
  seguida, a tabela exibe as Release Weeks persistidas (ou o estado vazio)

#### Scenario: Falha na carga não simula dados
- **WHEN** `GET /api/release-week` falha
- **THEN** um toast de erro é exibido e a tabela permanece vazia, sem dados de demonstração

#### Scenario: Mutação persiste e a recarga a mantém
- **WHEN** o usuário inclui, edita, clona, publica, arquiva ou exclui uma Release Week e recarrega
- **THEN** a mudança persiste e volta da API com os valores gravados

### Requirement: Backend da Release Week
O sistema SHALL servir `/api/release-week/**` sob a permissão do módulo `release-week`:
`GET /api/release-week` (visualizar) devolve as releases não arquivadas com `itensCount`;
`GET /api/release-week/:id/itens` (visualizar_itens) devolve os itens; `POST /api/release-week`
(criar) cria; `PUT /api/release-week/:id` (alterar) edita; `PUT /api/release-week/:id/publicar`
(publicar) muda o status para `Publicado` e grava `data_aprovacao`; `PUT /api/release-week/:id/arquivar`
(arquivar) marca `arquivada`; `DELETE /api/release-week/:id` (excluir) remove. O servidor SHALL gerar
o `codigo` `RW-XX/AAAA` a partir de `semana`/`ano` (na criação e **regenerar** na edição quando
`semana`/`ano` mudarem), recusando com `409` a duplicidade de `codigo`/`(ano, semana)`. O servidor
SHALL validar os campos obrigatórios, exigir que **`data_publicacao`** caia em uma segunda-feira
(`400` caso contrário; as demais datas não têm essa restrição), aplicar a guarda de exclusão
(arquivada ou com itens → `409`) e registrar a operação na trilha de auditoria com recurso
**"Release Week"**. A listagem e os itens SHALL refletir o banco, e a release arquivada SHALL deixar
de aparecer na listagem.

#### Scenario: Criar gera código e registra auditoria
- **WHEN** um usuário com `release-week`/`criar` cria uma release válida
- **THEN** o registro é gravado com `codigo` derivado de `semana`/`ano`, a resposta é `201` e a
  trilha registra uma Inclusão do recurso "Release Week"

#### Scenario: Semana duplicada responde 409
- **WHEN** a criação ou edição tenta usar um `(ano, semana)` já existente
- **THEN** a API responde `409` sem gravar

#### Scenario: Data de publicação fora de segunda-feira é recusada
- **WHEN** a criação ou edição envia `data_publicacao` que não é segunda-feira
- **THEN** a API responde `400` e nada é gravado

#### Scenario: Edição regenera o código
- **WHEN** a edição altera `semana` ou `ano`
- **THEN** o `codigo` é regenerado e a unicidade é validada

#### Scenario: Publicar e arquivar
- **WHEN** o usuário publica ou arquiva uma release
- **THEN** o status/`arquivada` são gravados e a trilha registra a operação

#### Scenario: Sem permissão a escrita é negada
- **WHEN** um perfil sem a funcionalidade exigida chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

### Requirement: Importação de Release Weeks por planilha
O sistema SHALL importar Release Weeks de uma planilha `.xlsx` com as colunas **Nome, Semana, Ano,
Mês, Data Início, Data Finaliza, Data Publicação, Status, Versão, Release, Descrição e Destaque** por
`POST /api/release-week/importar`, sob a permissão `release-week`/`importar`. O servidor SHALL
revalidar cada linha (campos obrigatórios, semana 1–52, mês do domínio, datas `AAAA-MM-DD` e
`data_publicacao` em segunda-feira), recusar a importação inteira (`400`, com os motivos) quando
houver linha inválida, tratar `(ano, semana)` já cadastrado como conflito (sem gravar) e, quando tudo
estiver válido, gravar em **transação** gerando os códigos. A importação bem-sucedida SHALL ser
registrada na trilha de auditoria.

#### Scenario: Importar linhas válidas
- **WHEN** um usuário com `release-week`/`importar` envia linhas válidas
- **THEN** cada Release Week é gravada com o código gerado e a resposta informa quantas foram importadas

#### Scenario: Linha inválida recusa a importação inteira
- **WHEN** alguma linha tem campo obrigatório vazio, semana fora de 1–52 ou data inválida
- **THEN** a API responde `400` com os motivos e nada é gravado

#### Scenario: Semana já cadastrada é conflito
- **WHEN** a planilha traz um `(ano, semana)` já existente na base
- **THEN** nenhuma release é gravada e a resposta identifica os conflitos

#### Scenario: Importação exige a permissão de importar
- **WHEN** um perfil sem `release-week`/`importar` chama a rota de importação
- **THEN** a API responde `403` e nada é gravado
