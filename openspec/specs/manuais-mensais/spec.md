# manuais-mensais Specification

## Purpose
Define a página administrativa e o backend do catálogo mensal de manuais: cabeçalho do mês, KPIs, listagem com filtros, ações, itens sob demanda, importação histórica por planilha, persistência, RBAC e auditoria.

## Requirements

### Requirement: A página de Manuais Mensais existe em /admin/manuais
O sistema SHALL expor a tela de Manuais Mensais em `/admin/manuais`, renderizada dentro do shell da
Área Administrativa (header + sidebar) como as demais rotas sob `/admin/**`. A tela SHALL ser
alcançável pelo item **Manuais** da sessão **Publicações** da sidebar, que passa a declarar a rota
`/admin/manuais` e a navegar ao clique. O acesso SHALL estar sujeito à mesma guarda de sessão das
demais telas administrativas.

#### Scenario: Item Manuais navega pela sidebar
- **WHEN** o usuário clica em "Manuais" na sidebar
- **THEN** o navegador vai para `/admin/manuais` e a tela é renderizada dentro do shell

#### Scenario: Item Manuais fica ativo na própria rota
- **WHEN** a rota corrente é `/admin/manuais`
- **THEN** o item "Manuais" da sidebar é exibido como ativo, com `aria-current="page"`

#### Scenario: Rota protegida exige sessão
- **WHEN** um visitante sem sessão tenta abrir `/admin/manuais`
- **THEN** ele é redirecionado para `/admin/login?redirect=/admin/manuais`

### Requirement: A tela representa o catálogo mensal de manuais
Cada catálogo mensal SHALL ser representado pelos campos do cabeçalho: `codigo` (`MAN-XX/AAAA`),
`titulo`, `descricao`, `ano`, `mes` (por extenso), `mes_numero` (1 a 12),
`status` (`Rascunho` | `Em Revisão` | `Alterações Solicitadas` | `Aprovado` | `Publicado`),
`destaque_mes`, `destaque_semana`, `total_visualizacoes`, `autor_nome`, `revisor_nome`, `arquivada`,
`criado_em`, `atualizado_em` e `data_publicacao`. O status SHALL ser exibido em `UiBadge` com
variantes distintas para os cinco valores. O `codigo`, os carimbos, a data de publicação e os nomes
de autor/revisor SHALL ser gerados pelo sistema, nunca digitados na tela.

#### Scenario: Cabeçalho exibe os campos do mês
- **WHEN** um catálogo mensal é exibido
- **THEN** ele apresenta código, título, mês/ano, status em `UiBadge`, autor e data de publicação,
  com as datas formatadas em pt-BR

#### Scenario: Status restrito ao domínio
- **WHEN** o status é apresentado ou editado
- **THEN** apenas `Rascunho`, `Em Revisão`, `Alterações Solicitadas`, `Aprovado` e `Publicado` são
  oferecidos

#### Scenario: Destaques identificados
- **WHEN** um catálogo mensal está marcado como destaque do mês ou destaque da semana
- **THEN** a listagem exibe o indicador de destaque correspondente ao lado do título

### Requirement: Listagem, busca, ordenação e paginação
A tela SHALL exibir os catálogos mensais em uma tabela com as colunas **Código, Título, Mês/Ano,
Status, Autor, Publicação** e a coluna de ações, oferecendo busca, ordenação e paginação no cliente
sobre o conjunto vigente. A tela SHALL exibir o cabeçalho e os KPIs mesmo com a lista vazia, e a
tabela SHALL distinguir base vazia de filtro sem resultado. Os catálogos arquivados NÃO SHALL fazer
parte do conjunto exibido.

#### Scenario: Colunas da listagem
- **WHEN** a listagem é exibida
- **THEN** a tabela mostra as colunas Código, Título, Mês/Ano, Status, Autor, Publicação e ações

#### Scenario: Busca, ordenação e paginação no cliente
- **WHEN** o usuário usa a busca, ordena uma coluna ou troca de página
- **THEN** a tabela reflete a interação sobre o conjunto vigente

#### Scenario: Base vazia
- **WHEN** não há catálogo mensal cadastrado
- **THEN** a tabela exibe o estado vazio de base sem registros e nenhum dado fictício é mostrado

### Requirement: KPIs do conjunto vigente
A tela SHALL exibir cinco indicadores derivados do conjunto vigente (o conjunto filtrado, quando
houver filtro): **Rascunho**, **Em Revisão**, **Alterações Solicitadas**, **Aprovado** e
**Publicado**. Os catálogos arquivados NÃO SHALL ser contados.

#### Scenario: KPIs acompanham os filtros
- **WHEN** um filtro refina o conjunto exibido
- **THEN** os cinco KPIs são recalculados sobre o conjunto filtrado

#### Scenario: Arquivado sai dos KPIs
- **WHEN** um catálogo mensal é arquivado
- **THEN** ele deixa de ser contado em todos os cinco KPIs

### Requirement: Filtros estruturais em modal
A tela SHALL oferecer um modal de filtros acionado pela toolbar da tabela, com **Status**, **Ano**,
**Mês**, **Autor** e **Destaque** (vazio = todos; o filtro de destaque oferece "Todos", "Destaque do
mês" e "Destaque da semana") e os botões "Limpar Filtros", "Cancelar" e "Aplicar". Aplicar SHALL
refinar o conjunto vigente; limpar SHALL zerar rascunho e estado; a toolbar SHALL indicar a
quantidade de filtros ativos no badge do botão "Filtros". Os filtros SHALL operar inteiramente em
memória e ser descartados na recarga da página.

#### Scenario: Aplicar refina a listagem e os KPIs
- **WHEN** o usuário seleciona filtros e clica em "Aplicar"
- **THEN** a tabela e os KPIs passam a refletir apenas os catálogos que casam com os filtros

#### Scenario: Limpar restaura o conjunto
- **WHEN** o usuário clica em "Limpar Filtros"
- **THEN** os filtros são zerados e a listagem completa volta a ser exibida

#### Scenario: Cancelar descarta o rascunho
- **WHEN** o usuário altera seleções e clica em "Cancelar"
- **THEN** o modal fecha e o conjunto vigente permanece inalterado

#### Scenario: Contador de filtros ativos
- **WHEN** há filtros ativos
- **THEN** o botão "Filtros" exibe a quantidade de filtros aplicados

### Requirement: Inclusão de catálogo mensal
O sistema SHALL oferecer o botão "Novo Manual", que abre um modal de cadastro com **Título**
(obrigatório, até 255), **Mês** (obrigatório, 1 a 12), **Ano** (obrigatório), **Descrição**,
**Status** (padrão `Rascunho`), **Destaque do mês** e **Destaque da semana**. O formulário SHALL
validar os campos no cliente, impedir a combinação `(ano, mês)` já existente no conjunto e focar o
primeiro problema; salvar SHALL persistir o catálogo via `POST /api/manuais` (201), com o código
gerado pelo servidor, o autor da sessão, a data de criação do servidor e a data de publicação
preenchida quando o status for `Publicado`, e fechar o modal com aviso de sucesso. Conflito de
`(ano, mês)` no banco SHALL responder `409` com erro no campo. A ação SHALL respeitar a permissão de
`criar` do módulo `manuais`.

#### Scenario: Abrir o cadastro com padrões
- **WHEN** o usuário aciona "Novo Manual"
- **THEN** o modal abre vazio, com status `Rascunho` e destaques desligados

#### Scenario: Campos obrigatórios
- **WHEN** o usuário tenta salvar sem título, mês ou ano
- **THEN** o primeiro campo inválido recebe o erro e o foco, e nada é incluído

#### Scenario: Mês já cadastrado
- **WHEN** o usuário tenta salvar um `(ano, mês)` que já existe no conjunto ou no banco
- **THEN** o erro é exibido no campo, a API responde `409` e nenhum segundo catálogo é criado

#### Scenario: Inclusão com sucesso
- **WHEN** o usuário salva um formulário válido
- **THEN** o catálogo é persistido pela API com o código gerado, entra na listagem, o modal fecha e
  um aviso de sucesso é exibido

### Requirement: Edição de catálogo mensal
O sistema SHALL oferecer a ação de linha **Editar**, que abre o mesmo modal preenchido com o
registro, em modo edição, exibindo o **Código** somente leitura, a **Data de publicação** somente
leitura (quando houver) e a seção **Informações de Cadastro** com `criado_em` e `atualizado_em`
desabilitados. Salvar SHALL persistir a alteração via `PUT /api/manuais/:id` (200), regenerando o
`codigo` se `mes`/`ano` mudarem e recusando conflito `(ano, mês)` com `409`, e fechar o modal com
aviso de sucesso. A ação SHALL respeitar a permissão de `alterar`.

#### Scenario: Abrir edição preenchida
- **WHEN** o usuário aciona "Editar" em uma linha
- **THEN** o modal abre preenchido, com Código e carimbos de cadastro somente leitura

#### Scenario: Atualização com sucesso
- **WHEN** o usuário salva alterações válidas
- **THEN** a linha reflete os novos dados persistidos pela API, o modal fecha e um aviso de sucesso
  é exibido

#### Scenario: Mês/ano em conflito na edição
- **WHEN** a edição tenta usar um `(ano, mês)` já ocupado por outro catálogo
- **THEN** o erro é exibido no campo, a API responde `409` e nada é alterado

### Requirement: Clonagem de catálogo mensal
O sistema SHALL oferecer a ação de linha **Clonar**, que abre o modal de cadastro em modo criação com
**Título**, **Descrição**, **Destaque do mês** e **Destaque da semana** preenchidos a partir do
registro de origem. Os demais campos — **Código**, **Mês**, **Ano**, datas, **Status** e os
**itens/anexos** — SHALL abrir em branco (status volta ao padrão `Rascunho`). A clonagem NÃO SHALL
copiar os itens nem os anexos, nem gravar nada antes de o usuário salvar. A ação SHALL ser exibida
somente quando o perfil conceder **`clonar`**; a gravação SHALL usar a mesma criação e exigir
**`criar`** no servidor.

#### Scenario: Clonar abre o formulário parcialmente preenchido
- **WHEN** o usuário aciona "Clonar" em um catálogo mensal
- **THEN** o modal abre com Título, Descrição e Destaques copiados, os demais campos vazios e status
  `Rascunho`, sem criar um novo registro ainda

#### Scenario: Clonar não copia itens nem anexos
- **WHEN** o catálogo de origem possui itens ou anexos vinculados
- **THEN** o formulário de clonagem não os traz e o novo registro nasce sem itens/anexos

#### Scenario: Sem a permissão de clonar a ação não aparece
- **WHEN** o perfil do usuário não concede `manuais`/`clonar`
- **THEN** a ação "Clonar" não é oferecida na linha

#### Scenario: Clonar sem criar é recusado
- **WHEN** um perfil concede `clonar` mas não `criar` e tenta gravar a clonagem
- **THEN** a gravação é recusada e nenhum catálogo é criado

### Requirement: Publicar e arquivar catálogo mensal
O sistema SHALL oferecer as ações de linha **Publicar** e **Arquivar**, ambas com confirmação.
Publicar SHALL chamar `PUT /api/manuais/:id/publicar`, alterar o status para `Publicado` e preencher
a **Data de publicação** (`COALESCE(data_publicacao, CURRENT_DATE)`), preservando uma data histórica
já existente. Arquivar SHALL chamar `PUT /api/manuais/:id/arquivar`, marcar o catálogo como
**arquivado** (`arquivada = true`), sem excluir nenhum dado, e o catálogo arquivado SHALL deixar de
aparecer na listagem/KPIs. Arquivar SHALL respeitar a permissão de `arquivar`; publicar, a de
`publicar`.

#### Scenario: Publicar altera o status
- **WHEN** o usuário confirma "Publicar"
- **THEN** o status passa a `Publicado`, a data de publicação é preenchida (se vazia) e a
  listagem/KPIs refletem a mudança

#### Scenario: Publicação preserva data histórica
- **WHEN** o catálogo já possui uma `data_publicacao` vinda da importação
- **THEN** a publicação mantém essa data em vez de sobrescrevê-la

#### Scenario: Arquivar remove da listagem sem excluir
- **WHEN** o usuário confirma "Arquivar"
- **THEN** o catálogo é marcado como arquivado, deixa de aparecer na listagem e seus dados e itens
  permanecem intactos

#### Scenario: Catálogo arquivado não aparece
- **WHEN** a listagem é exibida
- **THEN** os catálogos arquivados não fazem parte do conjunto exibido nem dos KPIs

### Requirement: Exclusão condicionada de catálogo mensal
O sistema SHALL oferecer a ação **Excluir** somente quando o catálogo **não estiver arquivado** e
**não possuir nenhum item/relacionamento** vinculado. Quando uma dessas condições falhar, a ação
SHALL ficar indisponível com a indicação acessível do motivo (catálogo arquivado, com itens ou com
anexos), e nenhum dado SHALL ser removido. A confirmação SHALL chamar `DELETE /api/manuais/:id`; a
API SHALL reaplicar a guarda e responder `409` mesmo que a chamada contorne a interface. A exclusão
bem-sucedida SHALL remover o registro do conjunto vigente e fechar o modal com aviso de sucesso. A
ação SHALL respeitar a permissão de `excluir`.

#### Scenario: Excluir catálogo sem vínculos
- **WHEN** o catálogo não está arquivado e não possui itens/anexos, e o usuário confirma a exclusão
- **THEN** o registro é removido pela API, sai da listagem e um aviso de sucesso é exibido

#### Scenario: Catálogo com itens não pode ser excluído
- **WHEN** o catálogo possui itens vinculados
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

#### Scenario: Catálogo arquivado não pode ser excluído
- **WHEN** o catálogo está arquivado
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

#### Scenario: A API recusa a exclusão bloqueada
- **WHEN** `DELETE /api/manuais/:id` é chamado para um catálogo arquivado ou com itens/anexos
- **THEN** a API responde `409` com o motivo e nenhum registro é removido

### Requirement: Flag de itens e expansão somente leitura
A tabela SHALL oferecer um **controle no cabeçalho** que habilita a visualização dos itens. Enquanto
habilitado, cada catálogo mensal SHALL exibir um sinal **"+"**; ao acioná-lo, a linha SHALL expandir
e revelar os **itens do manual** (`entregas_itens` com `manual_id` vinculado) em modo somente
leitura, com Chamada, Título, Software, Módulo, Tipo, Impacto, Status e Data de liberação,
obtidos sob demanda de `GET /api/manuais/:id/itens`. Acionar novamente recolhe a linha. Catálogo sem
itens SHALL exibir um estado vazio próprio dentro da expansão. A coluna de expansão não SHALL afetar
ordenação, busca ou paginação. A flag, a expansão e o endpoint de itens SHALL exigir a permissão
**`manuais`/`visualizar_itens`**; sem ela, a flag não é exibida e a API responde `403`.

#### Scenario: Habilitar a flag revela o sinal de "+"
- **WHEN** o usuário marca a flag de itens no cabeçalho da tabela
- **THEN** cada catálogo mensal passa a exibir um sinal "+" para expandir

#### Scenario: Expandir mostra os itens do manual
- **WHEN** o usuário aciona o "+" de um catálogo com itens
- **THEN** a linha expande e exibe os itens daquele manual em modo somente leitura

#### Scenario: Catálogo sem itens
- **WHEN** o usuário expande um catálogo sem itens
- **THEN** a expansão exibe um estado vazio informando que não há itens

#### Scenario: Recolher a expansão
- **WHEN** o usuário aciona novamente o controle de uma linha expandida
- **THEN** a linha recolhe e os itens deixam de ser exibidos

#### Scenario: Itens exigem a permissão própria
- **WHEN** o perfil não concede `manuais`/`visualizar_itens`
- **THEN** a flag de itens não é exibida na tabela e `GET /api/manuais/:id/itens` responde `403`

### Requirement: Exportações PDF e CSV
A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a **listagem em PDF** e a **exportação em
CSV** do conjunto filtrado vigente, com as colunas da listagem. Antes de gerar, a tela SHALL chamar
`GET /api/manuais?exportar=1` como guarda da permissão `exportar`. O CSV SHALL usar `;` com BOM
UTF-8 e neutralizar fórmulas de planilha; falhas na geração ou na guarda SHALL produzir aviso de erro
sem interromper a tela. Em caso de lista vazia, a exportação SHALL informar que não há dados.

#### Scenario: Exportar o conjunto filtrado
- **WHEN** o usuário escolhe "Exportar em CSV" ou "Listagem em PDF"
- **THEN** a guarda de `exportar` é validada na API e o arquivo é gerado com os catálogos do conjunto
  filtrado e as colunas da listagem

#### Scenario: Falha na exportação
- **WHEN** a geração ou a guarda de permissão falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

### Requirement: A tela carrega e persiste Manuais pela API
A tela SHALL carregar os catálogos de `GET /api/manuais` na montagem e exibir um overlay
`UiLoading` ("Carregando Manuais Mensais…") enquanto a requisição estiver em voo, sem conteúdo
parcial; em falha, SHALL exibir toast de erro e manter a tabela vazia. Toda mutação bem-sucedida
(inclusão, edição, clonagem, publicação, arquivamento, exclusão e importação) SHALL ser refletida na
tabela e nos KPIs, e a recarga da página SHALL rebuscar pela API — o que foi gravado persiste, sem
base de demonstração. A listagem SHALL usar o `itensCount` devolvido pela API para a contagem de
itens e a guarda visual de exclusão.

#### Scenario: Carga inicial pela API
- **WHEN** o navegador abre `/admin/manuais`
- **THEN** o overlay de carregamento é exibido enquanto `GET /api/manuais` responde e, em seguida, a
  tabela exibe os catálogos persistidos (ou o estado vazio)

#### Scenario: Falha na carga não simula dados
- **WHEN** `GET /api/manuais` falha
- **THEN** um toast de erro é exibido e a tabela permanece vazia, sem dados de demonstração

#### Scenario: Mutação persiste e a recarga a mantém
- **WHEN** o usuário inclui, edita, clona, publica, arquiva, exclui ou importa catálogos e recarrega
- **THEN** a mudança persiste e volta da API com os valores gravados

### Requirement: Backend dos Manuais
O sistema SHALL servir `/api/manuais/**` sob a permissão do módulo `manuais`:
`GET /api/manuais` (visualizar; `?exportar=1` → exportar) devolve os catálogos não arquivados com
`itensCount`; `GET /api/manuais/:id/itens` (visualizar_itens) devolve os itens; `POST /api/manuais`
(criar) cria; `PUT /api/manuais/:id` (alterar) edita; `PUT /api/manuais/:id/publicar` (publicar)
muda o status para `Publicado` e preenche a `data_publicacao` sem sobrescrever uma data histórica;
`PUT /api/manuais/:id/arquivar` (arquivar) marca `arquivada`; `DELETE /api/manuais/:id` (excluir)
remove; `POST /api/manuais/importar` (importar) importa. O servidor SHALL gerar o `codigo`
`MAN-XX/AAAA` a partir de `mes`/`ano` (na criação e **regenerar** na edição quando `mes`/`ano`
mudarem), recusando com `409` a duplicidade de `codigo`/`(ano, mes_numero)`. O servidor SHALL
validar título, mês, ano e status; derivar `autorNome`/`revisorNome` de `usuarios`; gravar
`autor_id` da sessão e `data_criacao` (histórica ou atual); aplicar a guarda de exclusão (arquivada,
com itens ou com anexos → `409`); e registrar a operação na trilha de auditoria com recurso
**"Manuais Mensais"**.

A transição de status para `Publicado` SHALL exigir a permissão `publicar` em **qualquer** caminho:
no endpoint dedicado, na criação com `status=Publicado` e na edição que altere o status para
`Publicado`. Sem essa permissão, a operação SHALL ser recusada com `403` e nenhum dado SHALL ser
alterado — mesmo que o perfil possua `criar` ou `alterar`. Quando a transição para `Publicado` for
autorizada pela edição ou criação, o servidor SHALL preencher `data_publicacao` (preservando uma
data histórica existente) e SHALL auditar a operação como **"Homologação"**, não como simples
"Alteração".

#### Scenario: Criar gera código e registra auditoria
- **WHEN** um usuário com `manuais`/`criar` cria um catálogo válido
- **THEN** o registro é gravado com `codigo` derivado de `mes`/`ano`, a resposta é `201` e a trilha registra uma Inclusão do recurso "Manuais Mensais"

#### Scenario: Mês/ano duplicado responde 409
- **WHEN** a criação ou edição tenta usar um `(ano, mes_numero)` já existente
- **THEN** a API responde `409` com o erro no campo `mes` e nada é gravado

#### Scenario: Edição regenera o código
- **WHEN** a edição altera `mes` ou `ano`
- **THEN** o `codigo` é regenerado e a unicidade é validada

#### Scenario: Publicar e arquivar
- **WHEN** o usuário publica ou arquiva um catálogo
- **THEN** o status/`arquivada` são gravados, a data histórica é preservada e a trilha registra a operação

#### Scenario: Exclusão bloqueada no servidor
- **WHEN** `DELETE /api/manuais/:id` é chamado para um catálogo arquivado ou com itens/anexos
- **THEN** a API responde `409` com o motivo e nenhum registro é removido

#### Scenario: Sem permissão a escrita é negada
- **WHEN** um perfil sem a funcionalidade exigida chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

#### Scenario: Edição não publica sem a permissão publicar
- **WHEN** um perfil com `manuais`/`alterar` e sem `publicar` envia `PUT /api/manuais/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece inalterado e nenhuma chamada filha é publicada

#### Scenario: Criação não publica sem a permissão publicar
- **WHEN** um perfil com `manuais`/`criar` e sem `publicar` envia `POST /api/manuais` com `status=Publicado`
- **THEN** a API responde `403` e nenhum catálogo é criado

#### Scenario: Edição autorizada publica e homologa
- **WHEN** um perfil com `publicar` envia `PUT /api/manuais/:id` mudando o status para `Publicado`
- **THEN** o status passa a `Publicado`, `data_publicacao` é preenchida se vazia, a cascata publica as filhas em `Publicar` e a trilha registra "Homologação"

### Requirement: Importação de Manuais por planilha

O sistema SHALL importar catálogos mensais de uma planilha `.xlsx` com as colunas **Título, Mês, Ano, Descrição, Status, Data de Criação, Data de Publicação, Destaque do mês e Destaque da semana** por `POST /api/manuais/importar`, sob a permissão `manuais`/`importar`. O parser SHALL classificar cada linha como `pronto`, `já cadastrado`, `repetido no arquivo` ou `inválida`. O servidor SHALL revalidar título, mês, ano, status e datas (formato civil válido), recusar o status `Publicado`, tratar `(ano, mes_numero)` já cadastrado como conflito (sem gravar) e recusar a importação inteira (`400`, com os motivos) quando houver linha inválida ou duplicada. Quando tudo estiver válido, SHALL gravar em **transação** (códigos gerados, autor = usuário da sessão, `data_criacao` e `data_publicacao` da planilha) e registrar auditoria com a contagem. O limite SHALL ser de 500 linhas. O autor histórico NÃO SHALL ser preservado por esta importação: todos os registros ficam com o usuário que executa a importação.

#### Scenario: Importar linhas válidas

- **WHEN** um usuário com `manuais`/`importar` envia linhas válidas com status diferente de `Publicado`
- **THEN** cada catálogo é gravado com o código gerado, as datas históricas e a resposta informa quantos foram importados

#### Scenario: Publicação histórica sem data é inválida

- **WHEN** uma linha tem status `Publicado`, com ou sem Data de Publicação preenchida
- **THEN** a linha é marcada como inválida, a API responde `400` e a importação não grava nada

#### Scenario: Linha inválida recusa a importação inteira

- **WHEN** alguma linha tem campo obrigatório vazio, mês/ano/status inválido ou data inválida
- **THEN** a API responde `400` com os motivos e nada é gravado

#### Scenario: Mês já cadastrado é conflito

- **WHEN** a planilha traz um `(ano, mês)` já existente na base (inclusive arquivado)
- **THEN** nenhum catálogo é gravado e a resposta identifica os conflitos

#### Scenario: Importação exige a permissão de importar

- **WHEN** um perfil sem `manuais`/`importar` chama a rota de importação
- **THEN** a API responde `403` e nada é gravado

### Requirement: A publicação do catálogo mensal publica as chamadas filhas

Ao publicar um catálogo mensal, o sistema SHALL, na mesma transação, alterar para `Publicado` as
chamadas vinculadas por `manual_id` que estejam em `Publicar`. Chamadas em `Revisar`, `Aprovado` ou
`Recusado` NÃO SHALL ser publicadas pela cascata. Cada chamada alterada SHALL receber uma linha em
`historico_esteira_revisao` com status anterior `Publicar`, novo status `Publicado`, o responsável
pela publicação do catálogo e parecer indicando a publicação automática pelo conteúdo pai. A
auditoria SHALL ser registrada uma única vez na publicação do catálogo. A `data_liberacao` das
chamadas SHALL ser preservada. Quando o catálogo deixar de estar `Publicado` por edição ou
reabertura, as chamadas filhas em `Publicado` que não tenham outro vínculo ativo publicado SHALL
voltar para `Publicar` e receber a transição no histórico. Arquivar o catálogo NÃO SHALL alterar o
status das chamadas filhas; a visibilidade pública passa a exigir que o conteúdo pai esteja
`Publicado` e não arquivado.

#### Scenario: Publicar com chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em um catálogo mensal que possui chamadas filhas em `Publicar`
- **THEN** o catálogo passa a `Publicado`, as filhas passam a `Publicado` e cada uma recebe histórico

#### Scenario: Publicar sem chamadas aguardando

- **WHEN** o usuário confirma "Publicar" em um catálogo mensal sem chamadas em `Publicar`
- **THEN** o catálogo passa a `Publicado` e nenhuma chamada é alterada

#### Scenario: Chamada em revisão não é publicada

- **WHEN** o catálogo é publicado e possui chamadas filhas em `Revisar`, `Aprovado` ou `Recusado`
- **THEN** essas chamadas preservam o status e não ficam visíveis no portal

#### Scenario: Reabrir o catálogo despublica as filhas

- **WHEN** o catálogo deixa de estar `Publicado` por edição ou reabertura
- **THEN** as chamadas filhas em `Publicado` sem outro pai publicado voltam para `Publicar` e recebem histórico

#### Scenario: Múltiplos vínculos preservam a filha publicada

- **WHEN** uma chamada em `Publicado` tem vínculos com o catálogo reaberto e com outro conteúdo pai ainda `Publicado`
- **THEN** a chamada permanece em `Publicado`

#### Scenario: Arquivar não altera as filhas

- **WHEN** o catálogo é arquivado
- **THEN** o status das chamadas filhas é preservado e a visibilidade pública passa a considerá-las fora do portal por o pai estar arquivado

### Requirement: A unicidade considera apenas ciclos ativos

A unicidade de `(ano, mes_numero)` SHALL considerar apenas registros **não arquivados**. Deve existir no máximo um catálogo ativo por chave; vários catálogos arquivados com a mesma chave PODEM coexistir. Uma tentativa de criar outro catálogo ativo com a mesma chave SHALL responder `409`; recriar um catálogo cuja única ocorrência está arquivada SHALL ser permitido e SHALL preservar o arquivado.

#### Scenario: Chave ativa duplicada
- **WHEN** já existe um Manual ativo com o mesmo mês/ano
- **THEN** a criação responde `409` e nada é gravado

#### Scenario: Recriar após arquivar
- **WHEN** o único Manual com o mês/ano está arquivado
- **THEN** é possível criar um novo Manual ativo com a mesma chave

### Requirement: A visibilidade pública respeita a data de publicação

O Manual SHALL ser considerado público somente quando estiver `Publicado`, não arquivado e com
`publicado_em` não nulo e não futuro. `publicado_em` SHALL representar a publicação efetiva: a data
agendada quando `data_publicacao` estiver no futuro, ou o instante da transição para `Publicado`
quando a data estiver ausente/passada. A regra vale para as futuras leituras da Área Pública e para
a visibilidade das chamadas filhas.

#### Scenario: Publicação futura não aparece
- **WHEN** o Manual está `Publicado` com `data_publicacao` posterior a hoje e `publicado_em` futuro
- **THEN** ele não é considerado público até a data

#### Scenario: Publicação efetiva aparece
- **WHEN** o Manual está `Publicado` e o `publicado_em` não é futuro
- **THEN** ele é considerado público

#### Scenario: Saída de Publicado limpa o carimbo
- **WHEN** o Manual deixa de estar `Publicado`
- **THEN** `publicado_em` é limpo e ele deixa de ser público

### Requirement: A data efetiva de publicação é preservada em edições

Ao editar um conteúdo que já está `Publicado` sem alterar o status, o sistema SHALL preservar o
`publicado_em` original. O carimbo SHALL ser gravado apenas na transição para `Publicado` e limpo
ao sair dele.

#### Scenario: Edição de conteúdo já publicado
- **WHEN** o usuário edita apenas a descrição de um conteúdo `Publicado`
- **THEN** `publicado_em` permanece com o valor original

#### Scenario: Transição para publicado
- **WHEN** o conteúdo muda de um status não publicado para `Publicado`
- **THEN** `publicado_em` é gravado conforme a data efetiva

#### Scenario: Saída de publicado
- **WHEN** o conteúdo deixa de ser `Publicado`
- **THEN** `publicado_em` é limpo
