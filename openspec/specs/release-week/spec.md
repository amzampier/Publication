# release-week Specification

## Purpose

Define a página administrativa da Release Week e o seu backend (`/api/release-week/**`): o cabeçalho
da semana persistido em `release_week`, os KPIs, a listagem com filtros e ações, a expansão dos itens
de cada release, as exportações, a importação por planilha e a navegação — com RBAC e auditoria no
servidor.

## Requirements

### Requirement: A página de Release Week existe em /admin/release-week
O sistema SHALL expor a tela de Release Week em `/admin/release-week`, renderizada dentro do shell da
Área Administrativa (header + sidebar) como as demais rotas sob `/admin/**`. A tela SHALL ser
alcançável pelo item **Release Week** da sessão **Publicações** da sidebar, que passa a declarar a
rota `/admin/release-week` e a navegar ao clique. O acesso SHALL estar sujeito à mesma guarda de
sessão das demais telas administrativas.

#### Scenario: Item Release Week navega pela sidebar
- **WHEN** o usuário clica em "Release Week" na sidebar
- **THEN** o navegador vai para `/admin/release-week` e a tela é renderizada dentro do shell

#### Scenario: Item Release Week fica ativo na própria rota
- **WHEN** a rota corrente é `/admin/release-week`
- **THEN** o item "Release Week" da sidebar é exibido como ativo, com `aria-current="page"`

#### Scenario: Rota protegida exige sessão
- **WHEN** um visitante sem sessão tenta abrir `/admin/release-week`
- **THEN** ele é redirecionado para `/admin/login?redirect=/admin/release-week`

### Requirement: A tela representa o cabeçalho da semana
Cada Release Week SHALL ser representada pelos campos do cabeçalho: `codigo`, `nome`, `versao`,
`release`, `semana` (1 a 52), `ano`, `mes` (por extenso), `data_inicio`, `data_finaliza`,
`data_publicacao`, `status` (`Aberta` | `Em Revisão` | `Aprovado` | `Publicado`), `descricao`,
`destaque_semana`, `autor_nome`, `revisor_nome`, `arquivada`, `criado_em` e `atualizado_em`. O status SHALL ser
exibido em `UiBadge` com variantes distintas para `Aberta`, `Em Revisão`, `Aprovado` e `Publicado`.
O `codigo`, os carimbos e os nomes de autor/revisor SHALL ser gerados pelo sistema, nunca digitados
na tela.

#### Scenario: Cabeçalho exibe os campos da semana
- **WHEN** uma Release Week é exibida
- **THEN** ela apresenta código, nome, semana/ano, período, status em `UiBadge`, autor e data de
  publicação, com as datas formatadas em pt-BR

#### Scenario: Status restrito ao domínio
- **WHEN** o status é apresentado ou editado
- **THEN** apenas `Aberta`, `Em Revisão`, `Aprovado` e `Publicado` são oferecidos

### Requirement: Listagem, busca, ordenação e paginação
A tela SHALL exibir as Release Weeks em uma tabela com as colunas **Código, Nome, Semana/Ano,
Período, Status, Autor, Data de publicação** e a coluna de ações, oferecendo busca, ordenação e
paginação no cliente sobre o conjunto vigente. A tela SHALL exibir o cabeçalho e os KPIs mesmo com a
lista vazia, e a tabela SHALL distinguir base vazia de filtro sem resultado.

#### Scenario: Colunas da listagem
- **WHEN** a listagem é exibida
- **THEN** a tabela mostra as colunas Código, Nome, Semana/Ano, Período, Status, Autor, Data de
  publicação e ações

#### Scenario: Busca, ordenação e paginação no cliente
- **WHEN** o usuário usa a busca, ordena uma coluna ou troca de página
- **THEN** a tabela reflete a interação sobre o conjunto vigente

#### Scenario: Base vazia
- **WHEN** não há Release Week cadastrada
- **THEN** a tabela exibe o estado vazio de base sem registros e nenhum dado fictício é mostrado

### Requirement: KPIs do conjunto vigente
A tela SHALL exibir quatro indicadores derivados do conjunto vigente (o conjunto filtrado, quando
houver filtro): **Abertas**, **Em Revisão**, **Aprovadas** e **Publicadas**.

#### Scenario: KPIs acompanham os filtros
- **WHEN** um filtro refina o conjunto exibido
- **THEN** os quatro KPIs são recalculados sobre o conjunto filtrado

### Requirement: Filtros estruturais em modal
A tela SHALL oferecer um modal de filtros acionado pela toolbar da tabela, com **Status**, **Ano**,
**Mês** e **Autor** (vazio = todos) e os botões "Limpar Filtros", "Cancelar" e "Aplicar". Aplicar
SHALL refinar o conjunto vigente; limpar SHALL zerar rascunho e estado; a toolbar SHALL indicar a
quantidade de filtros ativos no badge do botão "Filtros".

#### Scenario: Aplicar refina a listagem e os KPIs
- **WHEN** o usuário seleciona filtros e clica em "Aplicar"
- **THEN** a tabela e os KPIs passam a refletir apenas as Release Weeks que casam com os filtros

#### Scenario: Limpar restaura o conjunto
- **WHEN** o usuário clica em "Limpar Filtros"
- **THEN** os filtros são zerados e a listagem completa volta a ser exibida

#### Scenario: Cancelar descarta o rascunho
- **WHEN** o usuário altera seleções e clica em "Cancelar"
- **THEN** o modal fecha e o conjunto vigente permanece inalterado

#### Scenario: Contador de filtros ativos
- **WHEN** há filtros ativos
- **THEN** o botão "Filtros" exibe a quantidade de filtros aplicados

### Requirement: Inclusão de Release Week
O sistema SHALL oferecer o botão "Nova Release Week", que abre um modal de cadastro com **Nome**
(obrigatório, até 255), **Versão**, **Release**, **Semana** (obrigatória, 1 a 52), **Ano**
(obrigatório), **Mês** (obrigatório), **Data de início**, **Data de finalização** e **Data de
publicação** (obrigatórias), **Status** (padrão `Aberta`), **Descrição** e **Destaque da semana**. O
formulário SHALL validar os campos no cliente e focar o primeiro problema; salvar SHALL incluir a
Release Week no conjunto vigente e fechar o modal com aviso de sucesso. A ação SHALL respeitar a
permissão de `criar` do módulo `release-week`.

#### Scenario: Abrir o cadastro com padrões
- **WHEN** o usuário aciona "Nova Release Week"
- **THEN** o modal abre vazio, com status `Aberta` e destaque desligado

#### Scenario: Campos obrigatórios
- **WHEN** o usuário tenta salvar sem nome, semana, ano, mês ou com uma das datas vazia
- **THEN** o primeiro campo inválido recebe o erro e o foco, e nada é incluído

#### Scenario: Inclusão com sucesso
- **WHEN** o usuário salva um formulário válido
- **THEN** a Release Week entra na listagem, o modal fecha e um aviso de sucesso é exibido

### Requirement: Edição de Release Week
O sistema SHALL oferecer a ação de linha **Editar**, que abre o mesmo modal preenchido com o registro,
em modo edição, exibindo o **Código** somente leitura e a seção **Informações de Cadastro** com
`criado_em` e `atualizado_em` desabilitados. Salvar SHALL atualizar a Release Week no conjunto e
fechar o modal com aviso de sucesso. A ação SHALL respeitar a permissão de `alterar`.

#### Scenario: Abrir edição preenchida
- **WHEN** o usuário aciona "Editar" em uma linha
- **THEN** o modal abre preenchido, com Código somente leitura e os carimbos de cadastro visíveis

#### Scenario: Atualização com sucesso
- **WHEN** o usuário salva alterações válidas
- **THEN** a linha reflete os novos dados, o modal fecha e um aviso de sucesso é exibido

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

### Requirement: Publicar e arquivar Release Week
O sistema SHALL oferecer as ações de linha **Publicar** e **Arquivar**, ambas com confirmação.
Publicar SHALL alterar o status para `Publicado`. Arquivar SHALL marcar a Release Week como
**arquivada** (`arquivada = true`), sem excluir nenhum dado, e a release arquivada SHALL deixar de
aparecer na listagem. Arquivar SHALL respeitar a permissão de `arquivar`; publicar, a de `publicar`.

#### Scenario: Publicar altera o status
- **WHEN** o usuário confirma "Publicar"
- **THEN** o status da Release Week passa a `Publicado` e a listagem/KPIs refletem a mudança

#### Scenario: Arquivar remove da listagem sem excluir
- **WHEN** o usuário confirma "Arquivar"
- **THEN** a Release Week é marcada como arquivada, deixa de aparecer na listagem e seus dados e
  itens permanecem intactos

#### Scenario: Release arquivada não aparece
- **WHEN** a listagem é exibida
- **THEN** as Release Weeks arquivadas não fazem parte do conjunto exibido nem dos KPIs

### Requirement: Exclusão condicionada de Release Week
O sistema SHALL oferecer a ação **Excluir** somente quando a Release Week **não estiver arquivada** e
**não possuir nenhum item/relacionamento** vinculado. Quando uma dessas condições falhar, a ação
SHALL ficar indisponível com a indicação acessível do motivo (release arquivada ou release com itens),
e nenhum dado SHALL ser removido. A API SHALL reaplicar a mesma guarda e responder `409` quando a
release estiver arquivada ou possuir itens, mesmo que a chamada contorne a interface. A confirmação de exclusão SHALL remover o registro do conjunto
vigente e fechar o modal com aviso de sucesso. A ação SHALL respeitar a permissão de `excluir`.

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
Título, Software, Módulo, Tipo, Impacto, Status e Data de liberação, obtidos de
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

### Requirement: Exportações PDF e CSV
A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a **listagem em PDF** e a **exportação em
CSV** do conjunto filtrado vigente, com as colunas da listagem. O CSV SHALL usar `;` com BOM UTF-8 e
neutralizar fórmulas de planilha; falhas na geração SHALL produzir aviso de erro sem interromper a
tela. Em caso de lista vazia, a exportação SHALL informar que não há dados.

#### Scenario: Exportar o conjunto filtrado
- **WHEN** o usuário escolhe "Exportar em CSV" ou "Listagem em PDF"
- **THEN** o arquivo é gerado com as Release Weeks do conjunto filtrado e as colunas da listagem

#### Scenario: Falha na exportação
- **WHEN** a geração falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

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
SHALL validar os campos obrigatórios, exigir que **`data_publicacao`** caia em uma segunda-feira ou,
quando a segunda-feira for feriado nacional, no próximo dia útil (`400` caso contrário; as demais
datas não têm essa restrição), aplicar a guarda de exclusão (arquivada ou com itens → `409`) e
registrar a operação na trilha de auditoria com recurso **"Release Week"**. A listagem e os itens
SHALL refletir o banco, e a release arquivada SHALL deixar de aparecer na listagem.

A transição de status para `Publicado` SHALL exigir a permissão `publicar` em **qualquer** caminho:
no endpoint dedicado, na criação com `status=Publicado` e na edição que altere o status para
`Publicado`. Sem essa permissão, a operação SHALL ser recusada com `403` e nenhum dado SHALL ser
alterado — mesmo que o perfil possua `criar` ou `alterar`. Quando a transição para `Publicado` for
autorizada pela edição ou criação, o servidor SHALL gravar `data_aprovacao` e SHALL auditar a
operação como **"Homologação"**, não como simples "Alteração". Quando a release deixar de estar
`Publicado`, o servidor SHALL limpar `data_aprovacao`.

#### Scenario: Criar gera código e registra auditoria
- **WHEN** um usuário com `release-week`/`criar` cria uma release válida
- **THEN** o registro é gravado com `codigo` derivado de `semana`/`ano`, a resposta é `201` e a trilha registra uma Inclusão do recurso "Release Week"

#### Scenario: Semana duplicada responde 409
- **WHEN** a criação ou edição tenta usar um `(ano, semana)` já existente
- **THEN** a API responde `409` sem gravar

#### Scenario: Data de publicação fora de segunda-feira é recusada
- **WHEN** a criação ou edição envia `data_publicacao` que não é segunda-feira nem o próximo dia útil de uma segunda-feira que seja feriado nacional
- **THEN** a API responde `400` e nada é gravado

#### Scenario: Próximo dia útil após feriado na segunda-feira
- **WHEN** a criação ou edição envia `data_publicacao` no próximo dia útil de uma segunda-feira que é feriado nacional (ex.: 03/11/2026, após 02/11/2026 — Finados)
- **THEN** a API aceita a data e grava a release

#### Scenario: Edição regenera o código
- **WHEN** a edição altera `semana` ou `ano`
- **THEN** o `codigo` é regenerado e a unicidade é validada

#### Scenario: Publicar e arquivar
- **WHEN** o usuário publica ou arquiva uma release
- **THEN** o status/`arquivada` são gravados e a trilha registra a operação

#### Scenario: Sem permissão a escrita é negada
- **WHEN** um perfil sem a funcionalidade exigida chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

#### Scenario: Edição não publica sem a permissão publicar
- **WHEN** um perfil com `release-week`/`alterar` e sem `publicar` envia `PUT /api/release-week/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece inalterado e nenhuma chamada filha é publicada

#### Scenario: Criação não publica sem a permissão publicar
- **WHEN** um perfil com `release-week`/`criar` e sem `publicar` envia `POST /api/release-week` com `status=Publicado`
- **THEN** a API responde `403` e nenhuma release é criada

#### Scenario: Edição autorizada publica e homologa
- **WHEN** um perfil com `publicar` envia `PUT /api/release-week/:id` mudando o status para `Publicado`
- **THEN** o status passa a `Publicado`, `data_aprovacao` é gravada, a cascata publica as filhas em `Publicar` e a trilha registra "Homologação"

#### Scenario: Reabrir limpa a aprovação
- **WHEN** uma release `Publicado` é editada para outro status
- **THEN** `data_aprovacao` é limpa e as filhas em `Publicado` sem outro pai publicado voltam para `Publicar`

### Requirement: Importação de Release Weeks por planilha
O sistema SHALL importar Release Weeks de uma planilha `.xlsx` com as colunas **Nome, Semana, Ano,
Mês, Data Início, Data Finaliza, Data Publicação, Status, Versão, Release, Descrição e Destaque** por
`POST /api/release-week/importar`, sob a permissão `release-week`/`importar`. O servidor SHALL
revalidar cada linha (campos obrigatórios, semana 1–52, mês do domínio, datas `AAAA-MM-DD` e
`data_publicacao` em segunda-feira ou no próximo dia útil de uma segunda-feira que seja feriado
nacional), recusar a importação inteira (`400`, com os motivos) quando houver linha inválida, tratar
`(ano, semana)` já cadastrado como conflito (sem gravar) e, quando tudo estiver válido, gravar em
**transação** gerando os códigos. A importação bem-sucedida SHALL ser registrada na trilha de
auditoria.

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

### Requirement: A publicação da Release Week publica as chamadas filhas

Ao publicar uma Release Week, o sistema SHALL, na mesma transação, alterar para `Publicado` as
chamadas vinculadas por `release_id` que estejam em `Publicar`. Chamadas em `Revisar`, `Aprovado` ou
`Recusado` NÃO SHALL ser publicadas pela cascata. Cada chamada alterada SHALL receber uma linha em
`historico_esteira_revisao` com status anterior `Publicar`, novo status `Publicado`, o responsável
pela publicação da Release Week e parecer indicando a publicação automática pelo conteúdo pai. A
auditoria SHALL ser registrada uma única vez na publicação da Release Week. A `data_liberacao` das
chamadas SHALL ser preservada. Quando a Release Week deixar de estar `Publicado` por edição ou
reabertura, as chamadas filhas em `Publicado` que não tenham outro vínculo ativo publicado SHALL
voltar para `Publicar` e receber a transição no histórico. Arquivar a Release Week NÃO SHALL alterar
o status das chamadas filhas; a visibilidade pública passa a exigir que o conteúdo pai esteja
`Publicado` e não arquivado.

#### Scenario: Publicar com chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em uma Release Week que possui chamadas filhas em `Publicar`
- **THEN** a Release Week passa a `Publicado`, as filhas passam a `Publicado` e cada uma recebe histórico

#### Scenario: Publicar sem chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em uma Release Week sem chamadas em `Publicar`
- **THEN** a Release Week passa a `Publicado` e nenhuma chamada é alterada

#### Scenario: Chamada em revisão não é publicada

- **WHEN** a Release Week é publicada e possui chamadas filhas em `Revisar`, `Aprovado` ou `Recusado`
- **THEN** essas chamadas preservam o status e não ficam visíveis no portal

#### Scenario: Reabrir a Release Week despublica as filhas

- **WHEN** a Release Week deixa de estar `Publicado` por edição ou reabertura
- **THEN** as chamadas filhas em `Publicado` sem outro pai publicado voltam para `Publicar` e recebem histórico

#### Scenario: Múltiplos vínculos preservam a filha publicada

- **WHEN** uma chamada em `Publicado` tem vínculos com a Release Week reaberta e com outro conteúdo pai ainda `Publicado`
- **THEN** a chamada permanece em `Publicado`

#### Scenario: Arquivar não altera as filhas

- **WHEN** a Release Week é arquivada
- **THEN** o status das chamadas filhas é preservado e a visibilidade pública passa a considerá-las fora do portal por o pai estar arquivado

### Requirement: A unicidade considera apenas ciclos ativos

A unicidade de (ano, semana) SHALL considerar apenas registros **não arquivados**. Deve existir no máximo um ciclo ativo por chave; vários ciclos arquivados com a mesma chave PODEM coexistir. Uma tentativa de criar outro ciclo ativo com a mesma chave SHALL responder `409`; recriar um ciclo cuja única ocorrência está arquivada SHALL ser permitido e SHALL preservar o arquivado.

#### Scenario: Chave ativa duplicada
- **WHEN** já existe uma Release Week ativa com a mesma semana/ano
- **THEN** a criação responde `409` e nada é gravado

#### Scenario: Recriar após arquivar
- **WHEN** a única Release Week com a semana/ano está arquivada
- **THEN** é possível criar uma nova Release Week ativa com a mesma chave

### Requirement: A visibilidade pública respeita a data de publicação

A Release Week SHALL ser considerada pública somente quando estiver `Publicado`, não arquivada e com `data_publicacao` não futura. A regra vale para as futuras leituras da Área Pública e para a visibilidade das chamadas filhas.

#### Scenario: Publicação futura não aparece
- **WHEN** a Release Week está `Publicado` com `data_publicacao` posterior a hoje
- **THEN** ela não é considerada pública até a data

#### Scenario: Publicação efetiva aparece
- **WHEN** a Release Week está `Publicado` e a `data_publicacao` não é futura
- **THEN** ela é considerada pública
