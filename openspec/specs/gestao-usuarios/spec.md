# Gestão de Usuários Specification

## Purpose

Definir o comportamento da página principal de Gestão de Usuários — listagem persistida via
API com KPIs, tabela paginada com badges, exportação CSV/PDF, CRUD com avatar como arquivo,
importação de planilha com commit via API, bloqueio/desbloqueio com confirmação e convites
reais —, exigindo sessão ativa nas rotas administrativas, para que a Área Administrativa
administre usuários conforme o modelo `usuarios`/`perfis` descrito no `docs/02`.

## Requirements

### Requirement: A página de gestão de usuários existe em /admin/gestao-usuarios dentro do shell administrativo
O sistema SHALL servir a Gestão de Usuários em `/admin/gestao-usuarios`, renderizada com o shell da Área Administrativa (header + sidebar), exibindo o título "Gestão de Usuários" com a identidade do módulo (tile do ícone `Users` na cor `#b070ef`).

#### Scenario: Rota renderiza com shell
- **WHEN** o visitante abre `/admin/gestao-usuarios`
- **THEN** a página exibe o header e a sidebar da Área Administrativa e, na área de conteúdo, o título "Gestão de Usuários" com o tile do ícone na cor do módulo

#### Scenario: Acesso direto por URL
- **WHEN** a rota é carregada diretamente pela URL (recarga)
- **THEN** a página renderiza os usuários persistidos retornados por `GET /api/usuarios`, sem base de demonstração

### Requirement: Os atalhos de navegação apontam para a página
O sistema SHALL declarar a rota `/admin/gestao-usuarios` no item "Gestão de Usuários" da sidebar e no mesmo item do menu da conta, de modo que ambos naveguem para a página e o item da sidebar correspondente apareça como ativo.

#### Scenario: Item da sidebar navega e fica ativo
- **WHEN** o usuário clica em "Administração > Gestão de Usuários" na sidebar
- **THEN** o navegador navega para `/admin/gestao-usuarios` e aquele item aparece como ativo

#### Scenario: Item do menu da conta navega
- **WHEN** o usuário clica em "Gestão de Usuários" no menu da conta
- **THEN** o navegador navega para `/admin/gestao-usuarios`

### Requirement: As rotas da API administrativa exigem sessão ativa
O sistema SHALL exigir sessão ativa (cookies HttpOnly válidos, validados pelo servidor) em
todas as rotas `/api/**` de administrativa — incluindo usuários, perfis, configurações e
uploads —, respondendo `401` quando não houver sessão. As rotas de `/api/auth/*` (login,
refresh, logout, seguro, recuperação e troca de senha) SHALL permanecer acessíveis sem
sessão (são a própria porta de autenticação). Com sessão estabelecida, as rotas
administrativas SHALL operar normalmente.

#### Scenario: APIs administrativas sem sessão respondem 401
- **WHEN** um visitante anônimo chama qualquer rota administrativa (ex. `GET/POST
  /api/usuarios`, `POST /api/perfis`, `PUT /api/configuracoes`) sem os cookies de sessão
- **THEN** a resposta é `401` e nada é lido nem gravado

#### Scenario: Rotas de autenticação seguem acessíveis
- **WHEN** um visitante anônimo chama `POST /api/auth/login` (ou refresh, recuperação)
- **THEN** a rota responde normalmente (é a porta de entrada sem sessão)

#### Scenario: Com sessão as APIs operam
- **WHEN** um usuário autenticado chama as rotas administrativas
- **THEN** as requisições são atendidas conforme seus contratos (sem `401` espúrio)

### Requirement: Os KPIs derivam do conjunto de usuários vigente
O sistema SHALL exibir no topo da página os KPIs "Total de usuários", "Ativos", "Inativos" e "Perfis distintos", calculados **no servidor** sobre o conjunto filtrado e devolvidos pela API, de modo que reflitam o banco inteiro (não apenas a página corrente) e sejam recalculados quando os filtros mudam ou quando o conjunto é alterado por uma escrita.

#### Scenario: Base completa
- **WHEN** a página é aberta sem nenhum filtro aplicado
- **THEN** os quatro KPIs refletem o conjunto calculado no servidor (contagem total, ativos, inativos e perfis distintos do banco)

#### Scenario: Conjunto alterado recalcula os KPIs
- **WHEN** o conjunto de usuários muda (por filtro do módulo)
- **THEN** "Total de usuários", "Ativos", "Inativos" e "Perfis distintos" passam a considerar apenas esse conjunto, recalculados no servidor

#### Scenario: Criar ou editar usuário recalcula os KPIs
- **WHEN** o usuário salva um novo usuário ou altera um existente
- **THEN** os quatro KPIs refletem imediatamente o conjunto resultante (a listagem é rebuscada pela API)

### Requirement: A tabela lista os usuários com paginação, ordenação, busca e badges
O sistema SHALL exibir os usuários em `UiDataTable` com colunas Nome, E-mail, Perfil (badge), Status (badge) e Último acesso (do `ultimo_login` real quando houver), com paginação, ordenação e busca textual do componente, badge de Status distinguível entre "Ativo" e "Inativo" e badge de Perfil distinguível por perfil — cabendo as seis colunas (cinco de dados + Ações) **sem rolagem horizontal** na área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida), inclusive após trocar a quantidade de registros exibidos por página. Em modo servidor, a **ordenação SHALL ser aplicada pelo servidor**: acionar uma coluna ordenável SHALL enviar a ordenação (coluna + direção) à API, que reordena o conjunto antes de paginar, sobre um conjunto **whitelisted** de colunas; uma coluna sem ordenação suportada SHALL ser ignorada, mantendo a ordenação padrão.

#### Scenario: Colunas e ordenação
- **WHEN** a página é aberta
- **THEN** a tabela mostra as colunas Nome, E-mail, Perfil, Status e Último acesso, com paginação funcionando

#### Scenario: Ordenar consulta o servidor
- **WHEN** o usuário aciona o cabeçalho de uma coluna ordenável (ex.: Nome)
- **THEN** a tabela consulta a API com a coluna e a direção escolhidas e exibe o conjunto reordenado pelo servidor (a paginação acompanha o novo critério), sem reordenar apenas as linhas da página corrente no cliente

#### Scenario: Badges de perfil e status
- **WHEN** usuários com perfis e status diferentes são exibidos
- **THEN** cada perfil e cada status aparecem com badge própria, visualmente distinguíveis (Ativo em destaque positivo, Inativo em tom neutro)

#### Scenario: Busca textual
- **WHEN** o usuário digita texto na busca da tabela
- **THEN** apenas os usuários que contêm o texto permanecem listados

#### Scenario: Usuário sem acesso registrado
- **WHEN** um usuário nunca acessou o sistema (`ultimo_login` nulo no banco)
- **THEN** a coluna "Último acesso" exibe "-" (hífen) naquela linha

#### Scenario: Trocar a quantidade de linhas não abre rolagem horizontal
- **WHEN** o usuário altera "Linhas por página" (ex.: de 5 para 20 ou 50) numa janela ≥ ~1280px com sidebar expandida
- **THEN** a área da tabela ganha linhas sem exibir barra de rolagem horizontal, com as seis colunas visíveis

### Requirement: Todas as ações da tela abrem os fluxos reais
O sistema SHALL orientar todas as ações da página pelos fluxos reais, sem toasts de
"próxima etapa": "Novo Usuário" abre o modal de usuário em modo criação; o lápis da linha
abre o modal em edição; "Filtros" abre o modal de filtros; o ícone "Importar" da toolbar
(com tooltip "Importar Novos Usuários") abre o modal de importação; o ícone de convite
(`MailCheck`) abre o modal de convite; o ícone de exclusão (`Trash2`) abre o modal de
confirmação de exclusão; e o ícone de bloquear (cadeado, com tooltip e `aria-label`
próprios) SHALL abrir um modal de confirmação (`UiModal` de largura `sm`) identificando o
alvo (nome e e-mail) — **"Bloquear Usuário"** para contas Ativas e **"Desbloquear Usuário"**
para contas não Ativas (Inativas ou Bloqueadas) — e, ao confirmar, alternar a situação via
API (Ativo ↔ Inativo; desbloqueio devolve a Ativo), com toast de sucesso e atualização
imediata da linha, dos badges e dos KPIs; **"Cancelar"**, `Escape` ou o `X` do cabeçalho
SHALL fechar o modal de confirmação sem alterar nada.

#### Scenario: Novo Usuário
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de usuário abre em modo de criação

#### Scenario: Importar na toolbar
- **WHEN** o usuário passa o mouse sobre o ícone de importar à esquerda do botão "Filtros"
- **THEN** um tooltip exibe "Importar Novos Usuários" e, ao clicar, nenhum toast de "próxima
  etapa" é exibido e o modal de importação abre

#### Scenario: Filtros na toolbar
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de filtros abre

#### Scenario: Convite abre o modal
- **WHEN** o usuário aciona o controle de enviar convite (`MailCheck`) de uma linha
- **THEN** o modal de convite abre com aquela linha como destinatário, sem toast de
  "próxima etapa"

#### Scenario: Excluir abre o modal de confirmação
- **WHEN** o usuário clica no ícone de excluir (`Trash2`) de uma linha
- **THEN** o modal de confirmação de exclusão abre, sem toast de "próxima etapa"

#### Scenario: Bloquear confirma e alterna a situação
- **WHEN** o usuário aciona o cadeado de uma linha Ativa e confirma no modal "Bloquear
  Usuário"
- **THEN** a API alterna a situação para Inativo, a linha exibe o badge Inativo, os KPIs
  recalculam e um toast de sucesso é exibido

#### Scenario: Desbloquear devolve a Ativo
- **WHEN** o usuário aciona o cadeado de uma linha Inativa (ou Bloqueada) e confirma no
  modal "Desbloquear Usuário"
- **THEN** a API devolve a situação a Ativo, a linha e os KPIs atualizam e um toast de
  sucesso é exibido

#### Scenario: Confirmação de bloqueio descarta com Cancelar
- **WHEN** com o modal de confirmação de bloqueio aberto o usuário aciona "Cancelar",
  pressiona `Escape` ou clica no `X`
- **THEN** o modal fecha sem nenhuma requisição e a situação do usuário permanece a mesma

### Requirement: A exportação gera arquivos sobre o conjunto de usuários vigente
O sistema SHALL oferecer no cabeçalho o menu "Relatórios" (posicionado à esquerda do botão "Novo Usuário") com as opções "Ficha Cadastral" (gera um PDF em folha retrato com uma ficha por página para cada usuário do conjunto vigente), "Relação Completa" (gera e baixa o relatório `usuarios.pdf` em folha paisagem sobre os mesmos usuários) e "Exportar em CSV" (download do conjunto vigente com cabeçalhos), com um divisor separando as opções em PDF do CSV, sem abrir o diálogo de impressão do navegador. Como a listagem é paginada, a exportação SHALL obter da API o conjunto filtrado **completo** (todas as páginas) antes de gerar o arquivo.

#### Scenario: Exportar em CSV
- **WHEN** o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo CSV é baixado contendo o conjunto vigente de usuários, com linha de cabeçalho (Nome, E-mail, Perfil, Status, Último acesso)

#### Scenario: Relação Completa gera o relatório estruturado
- **WHEN** o usuário escolhe "Relação Completa"
- **THEN** o arquivo `usuarios.pdf` é baixado em folha paisagem com cabeçalho contendo a logo de login configurada (quando houver) à esquerda e o título "Relatório de Gestão de Usuários" à direita, as colunas Nome, E-mail, Perfil, Status e Último acesso com os usuários do conjunto, e paginação com a indicação da página

#### Scenario: Ficha Cadastral gera uma ficha por usuário
- **WHEN** o usuário escolhe "Ficha Cadastral"
- **THEN** o arquivo `ficha-cadastral.pdf` é baixado em folha retrato com uma página por usuário do conjunto, contendo identificador, nome, e-mail, perfil, status e último acesso, com a mesma identidade visual (logo, faixas navy e rodapé) dos demais relatórios

#### Scenario: Os relatórios são baixados sem diálogo de impressão
- **WHEN** qualquer das opções em PDF do menu "Relatórios" é acionada
- **THEN** `window.print()` não é chamado e o arquivo é salvo diretamente no dispositivo

### Requirement: O modal de filtros refina o conjunto vigente de usuários
O sistema SHALL abrir um modal de filtros ao acionar o botão "Filtros" da toolbar da tabela (`UiModal` de largura `sm`, com ícone no cabeçalho, título "Filtros de Usuários"), cujo corpo é organizado em duas sessões `UiModalSection`: **"Usuário"**, contendo um controle de seleção única `UiSelect` cujas opções são os nomes dos usuários da base (ordenados em pt-BR) e **"Perfil e Status"**, contendo dois `UiSelect` — um para **perfil** (os perfis cadastrados em Perfis de Acesso, Ativos) e um para **status** (Ativo, Inativo) —, em todos o estado vazio equivalendo a "todos" (placeholder "Todos os usuários"/"Todos os perfis"/"Todos os status") e a limpeza pelo `X` do select devolvendo o critério a "todos". O modal SHALL editar um rascunho sincronizado com o estado aplicado ao abrir: **"Aplicar"** grava o rascunho e fecha; **"Cancelar"**, `Escape` ou o `X` do cabeçalho fecham descartando o rascunho sem alterar o estado aplicado; **"Limpar Filtros"** (à esquerda do rodapé) zera rascunho e estado aplicado mantendo o modal aberto, com "Cancelar" e "Aplicar" à direita do rodapé. Aplicado o filtro, a tabela, os KPIs e as exportações (CSV e PDFs) SHALL refletir somente o conjunto filtrado, e o badge do botão "Filtros" SHALL indicar a quantidade de critérios ativos (0 a 3), alterada somente por "Aplicar" e "Limpar Filtros". Os filtros SHALL ser aplicados **no servidor** — enviados como parâmetros de consulta a `GET /api/usuarios`, que devolve o conjunto filtrado paginado — e descartados na recarga da página.

#### Scenario: Abertura pelo botão Filtros
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** o modal de filtros abre exibindo as sessões "Usuário" e "Perfil e Status" com os três selects no estado vigente e nenhum toast de "próxima etapa" é exibido

#### Scenario: Aplicar filtra e recalcula tudo
- **WHEN** com o modal aberto o usuário escolhe um perfil (ex.: Leitor) e aciona "Aplicar"
- **THEN** o modal fecha, a tabela lista apenas os usuários daquele perfil, os quatro KPIs refletem apenas esse conjunto, o badge do botão "Filtros" exibe 1 e o CSV e os PDFs gerados em seguida contêm somente esses usuários

#### Scenario: Perfil customizado aparece nas opções do filtro
- **WHEN** existe um perfil customizado Ativo em Perfis de Acesso e o usuário abre o modal de filtros
- **THEN** o select de perfil lista esse perfil customizado entre as opções, permitindo filtrar por ele

#### Scenario: Rascunho descartado por Cancelar
- **WHEN** com filtros já aplicados o usuário abre o modal, altera os selects e aciona "Cancelar" (ou pressiona `Escape` ou clica no `X` do cabeçalho)
- **THEN** o modal fecha, o conjunto exibido, os KPIs e o badge permanecem idênticos ao estado anterior e nenhum toast é exibido

#### Scenario: Limpar Filtros zera com o modal aberto
- **WHEN** com dois critérios aplicados o usuário aciona "Limpar Filtros" dentro do modal
- **THEN** os três selects voltam ao estado vazio ("todos"), a tabela e os KPIs voltam a refletir a base completa, o badge do botão "Filtros" desaparece (zero critérios) e o modal permanece aberto

#### Scenario: Limpeza individual pelo X do select
- **WHEN** o usuário limpa o select de Status pelo seu `X` e aciona "Aplicar"
- **THEN** o critério de status volta a "todos" e o conjunto passa a considerar apenas os demais critérios aplicados

#### Scenario: Badge conta somente o estado aplicado
- **WHEN** o usuário seleciona critérios no rascunho sem acionar "Aplicar" e depois fecha o modal
- **THEN** o badge do botão "Filtros" não muda, refletindo apenas o estado aplicado

#### Scenario: Conjunto filtrado vazio
- **WHEN** a combinação de filtros aplicados não corresponde a nenhum usuário
- **THEN** a tabela exibe seu estado vazio ("Nenhum resultado encontrado para o filtro.") e os KPIs refletem o conjunto vazio, sem erro

#### Scenario: Recarga descarta os filtros
- **WHEN** a página é recarregada com filtros aplicados
- **THEN** os filtros voltam ao estado vazio e a base completa é exibida

### Requirement: A importação grava os registros selecionados via API
O sistema SHALL abrir um modal de importação de usuários ao acionar o ícone "Importar" da
toolbar da tabela, aceitando somente arquivos `.xlsx` cujo cabeçalho corresponda ao modelo
oficial de quatro colunas obrigatórias — **Nome**, **E-mail**, **Perfil**, **Status** —,
modelo versionado no repositório (`docs/modelos/`) para consulta da equipe. Um arquivo com
cabeçalho divergente ou ilegível SHALL exibir erro no modal sem montar a pré-visualização.
Com arquivo válido, o modal SHALL exibir uma tabela temporária de pré-visualização com
coluna de seleção e a coluna **Situação** de cada linha, em quatro estados: **"Pronto para
importar"** (linha válida e e-mail ausente da base), **"E-mail já cadastrado"**
(e-mail presente na base, comparado sem distinção de maiúsculas), **"Repetido no
arquivo"** (segunda ocorrência do mesmo e-mail entre as linhas válidas do arquivo) e
**"Linha inválida"** (nome ou e-mail ausentes, e-mail malformado ou Perfil/Status fora dos
valores permitidos, com o motivo exibido) — as três últimas com seleção desabilitada. A
avaliação das situações SHALL considerar a **base completa (todas as páginas)**, e não apenas o
conjunto de usuários atualmente carregado na tabela (que pode estar paginado ou filtrado);
"Pronto para importar" exige, portanto, que o e-mail não exista em nenhuma página da base. As
linhas "Pronto para importar" SHALL chegar pré-selecionadas, e o rodapé SHALL exibir a
contagem de selecionados no botão "Importar (n)", desabilitado quando n for zero. Cada checkbox
de linha SHALL ter um **nome acessível** que identifique o registro (o e-mail/nome da linha),
de modo que a seleção seja operável sem depender da visão da tabela.
Confirmar SHALL enviar as linhas selecionadas à API de importação, que as revalida contra o
banco (unicidade de e-mail, perfil existente) e grava em transação os registros selecionados
— nascendo **sem senha autenticável** (a ser atribuída pelo envio manual de convite), com a
situação da planilha e os demais campos vazios —, devolvendo a contagem gravada; o cliente
recalcula os KPIs, exibe toast de sucesso com a contagem e fecha o modal. Quando a API reportar
no commit que um ou mais e-mails já constam na base (ex.: cadastro concorrente entre a
pré-visualização e a gravação), as linhas correspondentes SHALL passar à situação **"E-mail já
cadastrado"** e ser desmarcadas na própria pré-visualização, mantendo o arquivo carregado e as
demais linhas, de modo que a correção seja refletida e o reenvio das linhas restantes seja
possível. **"Cancelar"**,
`Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o arquivo carregado sem
nenhuma requisição. Filtros aplicados SHALL permanecer intactos pela importação: registros
fora do filtro vigente só passam a aparecer na tabela e nos KPIs quando o filtro for limpo.
Os registros importados SHALL persistir na recarga.

#### Scenario: Abertura pelo ícone Importar
- **WHEN** o usuário clica no ícone "Importar" da toolbar (com tooltip "Importar Novos Usuários")
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de importação abre vazio, sem tabela de pré-visualização

#### Scenario: Arquivo válido monta a pré-visualização com linhas prontas selecionadas
- **WHEN** o usuário seleciona um `.xlsx` cujo cabeçalho corresponde ao modelo e cujas linhas são válidas com e-mails fora da base
- **THEN** a tabela temporária é montada exibindo Nome, E-mail, Perfil, Status e a Situação "Pronto para importar" em cada linha, com seus checkboxes já marcados

#### Scenario: Checkbox de linha tem nome acessível
- **WHEN** a pré-visualização é percorrida por tecnologia assistiva
- **THEN** cada checkbox de linha é anunciado com um nome que identifica o registro (nome/e-mail), e não como um controle sem nome

#### Scenario: Linhas com problemas ganham Situação própria e ficam não selecionáveis
- **WHEN** o arquivo contém um e-mail já existente na base, um e-mail repetido no arquivo e uma linha com Perfil fora dos valores permitidos
- **THEN** essas linhas exibem, respectivamente, "E-mail já cadastrado", "Repetido no arquivo" e "Linha inválida" (com o motivo) na coluna Situação e seus checkboxes permanecem desabilitados

#### Scenario: E-mail existente fora da página carregada é marcado como já cadastrado
- **WHEN** a tabela exibe apenas a primeira página (20 usuários) e o arquivo traz um e-mail que existe na base, porém em outra página
- **THEN** a linha exibe "E-mail já cadastrado" com o checkbox desabilitado, e não é pré-selecionada

#### Scenario: Arquivo fora do modelo
- **WHEN** o usuário seleciona um arquivo cujo cabeçalho não corresponde ao modelo oficial ou que não pode ser lido
- **THEN** o modal exibe uma mensagem de erro e a tabela de pré-visualização não é montada

#### Scenario: Selecionar todos os prontos
- **WHEN** na pré-visualização o usuário aciona o checkbox "Selecionar todos os prontos"
- **THEN** todas as linhas "Pronto para importar" são marcadas (ou desmarcadas, quando já estavam todas marcadas), as demais permanecem desmarcadas e o checkbox fica desabilitado quando não há linhas prontas

#### Scenario: Arquivo com cabeçalho válido e nenhuma linha de dados
- **WHEN** o usuário seleciona um `.xlsx` cujo cabeçalho corresponde ao modelo mas que não contém nenhuma linha de dados
- **THEN** o modal exibe a mensagem "O arquivo não contém nenhuma linha de dados." e a tabela de pré-visualização não é montada

#### Scenario: Importar grava os selecionados e fecha
- **WHEN** com "n" registros selecionados o usuário aciona "Importar (n)"
- **THEN** somente os registros selecionados são enviados à API, revalidados e gravados no
  banco sem senha autenticável, os KPIs recalculam, um toast de sucesso confirma a contagem
  importada e o modal fecha

#### Scenario: Seleção zerada desabilita o botão
- **WHEN** nenhum registro está selecionado
- **THEN** o botão exibe "Importar (0)" e fica desabilitado

#### Scenario: Reimportar o mesmo arquivo marca como já cadastrado as linhas cujo e-mail consta na base
- **WHEN** após importar o usuário carrega novamente o mesmo arquivo
- **THEN** todas as linhas cujo e-mail consta na base exibem "E-mail já cadastrado" (as demais mantêm sua situação de validação) e nenhuma fica selecionada

#### Scenario: Conflito reportado pela API é refletido na pré-visualização
- **WHEN** o commit é recusado porque um e-mail passou a existir na base entre a pré-visualização e a gravação
- **THEN** as linhas daquele e-mail passam à situação "E-mail já cadastrado" e são desmarcadas, o arquivo permanece carregado e as demais linhas continuam disponíveis para um novo envio

#### Scenario: Descarte por Cancelar
- **WHEN** com arquivo carregado o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha sem nenhuma requisição, a base permanece idêntica ao estado anterior e nenhum toast de sucesso é exibido

#### Scenario: Filtros preservados na importação
- **WHEN** com filtros aplicados o usuário importa registros que não atendem ao filtro vigente
- **THEN** os filtros e o badge permanecem como estavam e os registros importados só passam a aparecer na tabela e nos KPIs quando o filtro for limpo

#### Scenario: Recarga mantém os registros importados
- **WHEN** a página é recarregada após uma importação
- **THEN** a listagem da API exibe também os registros importados (nada é descartado)

### Requirement: A importação exibe os registros em andamento
Enquanto o envio das linhas selecionadas à API estiver em voo, o modal de importação SHALL exibir um painel de progresso no lugar da pré-visualização, listando cada registro selecionado (nome e e-mail) com indicador de carregamento e a contagem "Importando N registro(s)", e o botão "Importar" SHALL exibir estado de carregamento. Nenhum registro SHALL ser marcado como concluído antes da resposta da API (sem simulação de progresso). Em sucesso, o comportamento já existente permanece (recálculo dos KPIs, toast com a contagem e fechamento); em falha, o painel desaparece e a pré-visualização volta exibindo o erro.

#### Scenario: Painel lista os registros em voo
- **WHEN** o usuário aciona "Importar (N)" e a requisição ainda está em andamento
- **THEN** a pré-visualização é substituída por um painel com contagem "Importando N registro(s)" e a lista dos nomes/e-mails selecionados com indicador de carregamento, e o botão "Importar" exibe loading

#### Scenario: Falha devolve a pré-visualização com erro
- **WHEN** o envio falha (linhas inválidas, e-mails já cadastrados ou erro de rede)
- **THEN** o painel de progresso some, a tabela de pré-visualização volta a ser exibida com o erro e nenhuma linha é marcada como importada

#### Scenario: Sucesso fecha com toast
- **WHEN** a API responde com a contagem de importados
- **THEN** o painel é encerrado, o modal fecha, os KPIs e a tabela refletem os registros gravados e um toast de sucesso exibe a contagem

### Requirement: A tela opera sobre a API de usuários; filtros e exportações via API
O sistema SHALL carregar a listagem de usuários de `GET /api/usuarios` na montagem da página e a cada mudança de página/tamanho/ordenação/busca (com debounce), exibindo estado de carregamento e toast de erro na falha (sem simular dados). CRUD, importação, exclusão, bloqueio e convite SHALL operar via API, com as mutações refletidas imediatamente (a listagem é rebuscada). Em caso de falha da carga, além da tabela vazia, o sistema SHALL zerar também os **KPIs, o total e as opções de filtro**, de modo que nenhum dado da carga anterior permaneça visível. Filtros, busca, paginação e KPIs SHALL ser processados **no servidor** sobre o conjunto filtrado; a exportação SHALL buscar o conjunto filtrado completo pela API. Os filtros SHALL continuar sendo descartados na recarga.

#### Scenario: Carga inicial mostra os usuários do banco
- **WHEN** o navegador abre `/admin/gestao-usuarios` com sessão ativa
- **THEN** um estado de carregamento é exibido enquanto `GET /api/usuarios` responde, e em seguida a tabela exibe a primeira página de usuários persistidos no banco (ex.: o administrador provisionado e as contas criadas por convite)

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição de listagem falha (rede, banco ou sessão expirada sem refresh)
- **THEN** um toast de erro informa a falha, a tabela fica vazia e os KPIs, o total e as opções de filtro são zerados, sem exibir dados da carga anterior nem a base de demonstração antiga

#### Scenario: Recarga rebusca o banco
- **WHEN** a página é recarregada após criar, editar, importar, excluir, bloquear ou convidar
- **THEN** a listagem vem da API com os dados persistentes (nada volta a uma base demo)

#### Scenario: Filtro e exportação consultam o servidor
- **WHEN** o usuário aplica filtros, busca na tabela (com debounce), muda de página ou gera CSV/PDF
- **THEN** a aplicação consulta a API uma vez por interação (filtro/página) — sem uma requisição por tecla — e a exportação obtém o conjunto filtrado completo para montar o arquivo

#### Scenario: Exportação busca o conjunto completo
- **WHEN** o usuário gera CSV ou PDF
- **THEN** a aplicação obtém da API o conjunto filtrado completo (todas as páginas) e gera o arquivo sobre ele

### Requirement: O modal de usuário reúne os blocos de cadastro com busca de CEP
O sistema SHALL exibir um único modal de usuário, aberto em modo de criação pelo botão "Novo Usuário" do cabeçalho e em modo de edição pelo lápis da linha, com os blocos **Dados do Usuário** (avatar, Nome, E-mail, Telefone, Função, Departamento e, numa linha própria de largura total começando abaixo do avatar, Status — em controle segmentado Ativo/Inativo, sem dropdown —, Perfil, Senha e Confirmar Senha — sem seção/cabeçalho próprio de "Acesso ao Sistema"), **Endereço** (CEP, Endereço, Número, Complemento, Bairro, Cidade, Estado, Região) e **Configurações de E-mail** (E-mail SMTP, Senha SMTP, Provedor, Servidor SMTP, Porta, Segurança, ações de teste e Status da Configuração) nos dois modos, acrescidos do bloco **Informações de Cadastro** (Data Cadastro e Última Atualização, ambos desabilitados) **somente em modo de edição** — o modo de criação SHALL abrir o modal apenas com os três blocos anteriores, sem a seção "Informações de Cadastro" e sem os campos de data. O ícone de busca de CEP SHALL consultar a ViaCEP e preencher o endereço conforme a capability `busca-cep` (com estado de carregamento, feedback de falha e bloqueio de cliques), sem nenhum toast de "próxima etapa".

#### Scenario: Abertura em modo de criação
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** o modal abre vazio, com Perfil e Situação sem seleção, exibindo somente os blocos "Dados do Usuário", "Endereço" e "Configurações de E-mail" — sem a seção "Informações de Cadastro" e sem os campos "Data Cadastro" e "Última Atualização"

#### Scenario: Abertura em modo de edição
- **WHEN** o usuário clica no lápis de uma linha
- **THEN** o modal abre preenchido com os dados daquele usuário — incluindo o bloco "Informações de Cadastro" com Data Cadastro e Última Atualização formatadas (dd/mm/aaaa HH:mm) — e com os campos de Senha vazios

#### Scenario: Máscara de CEP, telefone e porta
- **WHEN** o usuário digita em CEP, Telefone ou Porta
- **THEN** o valor é exibido com máscara (99999-999 no CEP) e o valor gravado corresponde ao conteúdo digitado

#### Scenario: Ícone de busca de CEP preenche o endereço
- **WHEN** o usuário clica no ícone ao lado direito do campo CEP com um CEP válido e a ViaCEP responde
- **THEN** os campos de endereço são preenchidos conforme a `busca-cep` (sem toast de sucesso), Número e Complemento digitados são preservados e nenhum toast de "próxima etapa" é exibido

#### Scenario: Falha da busca não altera o modal
- **WHEN** a busca falha (CEP incompleto, não encontrado ou falha de rede)
- **THEN** o toast da `busca-cep` é exibido com o título "Gestão de Usuários", nenhum campo de endereço muda e o modal permanece aberto

#### Scenario: Avatar com câmera
- **WHEN** o usuário aciona a câmera no bloco de Dados do Usuário e confirma a captura
- **THEN** a pré-visualização circular do avatar é atualizada, o modal de usuário permanece aberto com os demais campos intactos e o modal de câmera é encerrado

### Requirement: Usuário criado sem endereço nasce com número vazio
O campo **Número** do endereço SHALL nascer vazio (`''`) quando nenhum campo de endereço é informado — na criação manual pelo modal, na importação por planilha e em qualquer outra rota de criação de usuário —, e não com o valor legado `S/N`. A migration correspondente SHALL alterar o default da coluna `usuarios.numero` para `''` e limpar o `S/N` dos registros existentes cujo endereço esteja inteiramente vazio (sem CEP, logradouro, bairro e cidade); registros com endereço parcialmente preenchido mantêm o `S/N`, que ali é o "sem número" legítimo.

#### Scenario: Importação grava número vazio
- **WHEN** uma linha selecionada é importada pela planilha sem dados de endereço
- **THEN** o registro criado tem `numero` vazio (e os demais campos de endereço vazios), não `S/N`

#### Scenario: Cadastro manual com endereço vazio mantém número vazio
- **WHEN** o usuário cria um usuário pelo modal sem preencher nenhum campo de endereço e salva
- **THEN** o registro gravado tem `numero` vazio

#### Scenario: Registro legado com endereço vazio é limpo na migration
- **WHEN** o servidor inicializa com a nova migration e existe um registro com `numero = 'S/N'` e endereço inteiramente vazio
- **THEN** o `numero` do registro passa a vazio e o campo exibe vazio no modal de edição

#### Scenario: S/N legítimo junto a endereço preenchido é preservado
- **WHEN** existe um registro com `numero = 'S/N'` e logradouro/CEP/bairro/cidade preenchidos
- **THEN** a migration não altera o `numero` desse registro

### Requirement: O formulário de usuário valida antes de gravar
O sistema SHALL recusar o salvamento e manter o modal aberto quando: Nome, E-mail, Perfil ou Situação estiverem vazios; o E-mail estiver em formato inválido ou já pertencer a outro usuário no banco (validação do cliente e da API, que responde conflito para e-mail duplicado); na criação, Senha ou Confirmar Senha estiverem vazias, com menos de 8 caracteres ou divergentes entre si; na edição, exatamente um dos dois campos de senha estiver preenchido ou os dois divergirem. Cada campo inválido SHALL exibir o erro de forma persistente — ícone `AlertCircle` `rose-700` à direita dentro do campo com a mensagem em tooltip no hover, e a mensagem no DOM como região viva (`role="alert"`) associada ao controle —, com label e recorte em `rose-700`, e o foco SHALL ir ao primeiro campo inválido.

#### Scenario: E-mail duplicado
- **WHEN** em modo de criação o usuário informa um e-mail já existente no banco e tenta salvar
- **THEN** o modal permanece aberto, o campo E-mail exibe erro persistente apontando a duplicidade e o foco vai ao E-mail

#### Scenario: Senha inválida na criação
- **WHEN** em modo de criação a senha tem menos de 8 caracteres ou não confere com a confirmação
- **THEN** o modal permanece aberto e os campos de senha exibem erro persistente com o foco no primeiro deles

#### Scenario: Senha parcial na edição
- **WHEN** em modo de edição apenas um dos campos de senha é preenchido
- **THEN** o modal permanece aberto e o campo de senha vazio (ou a confirmação) exibe erro, sem apagar os demais dados digitados

#### Scenario: Formulário válido grava
- **WHEN** todas as regras estão satisfeitas e o usuário aciona "Salvar"
- **THEN** as validações não bloqueiam o fechamento e a gravação ocorre

### Requirement: O salvar grava via API e o cancelar descarta
O sistema SHALL gravar o formulário de usuário via API: em modo de criação, "Salvar" cria o
registro no banco (bcrypt da senha provisória informada, situação e perfil escolhidos,
endereço/SMTP opcionais, avatar como arquivo quando houver) com datas de criação e
atualização iguais ao instante da gravação; em modo de edição, "Salvar" atualiza o registro
preservando a data de criação e refletindo a alteração na última atualização. A senha SHALL
ser obrigatória na criação (mínimo de 8 caracteres) e opcional na edição (par completo
substitui o hash; campos vazios mantêm a senha vigente). Em ambos os casos o modal fecha e um
toast de sucesso é exibido, com a linha e os KPIs atualizados imediatamente. "Cancelar",
`Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o rascunho, sem nenhuma
requisição. As alterações SHALL persistir na recarga.

#### Scenario: Criação reflete na listagem
- **WHEN** o usuário salva um cadastro válido
- **THEN** a linha aparece na tabela com o badge de Perfil e de Status escolhidos, "Último
  acesso" exibindo "-" e os KPIs recalculados; um toast de sucesso confirma a criação

#### Scenario: Edição atualiza a linha
- **WHEN** o usuário altera nome, perfil ou situação de um usuário e salva
- **THEN** a linha passa a exibir os valores novos gravados na API e um toast de sucesso
  confirma a atualização

#### Scenario: Senha provisória fica gravada no registro
- **WHEN** o usuário cria um usuário informando a senha, ou edita um usuário sem tocar nos
  campos de senha e salva
- **THEN** o registro no banco guarda o hash da senha provisória (mantida na edição), sem
  que ela apareça na tabela nem em nenhum outro lugar da listagem

#### Scenario: Cancelar não altera nada
- **WHEN** o usuário edita campos e aciona "Cancelar" (ou pressiona `Escape`)
- **THEN** o modal fecha sem nenhuma requisição, a base permanece idêntica ao estado
  anterior e nenhum toast de sucesso é exibido

#### Scenario: Recarga mantém as alterações
- **WHEN** a página é recarregada após criar ou editar usuários
- **THEN** a listagem da API reflete os registros criados/alterados (nada é descartado)

### Requirement: O bloco de Configurações de E-mail testa conexão de forma simulada
O sistema SHALL tratar o bloco de Configurações de E-mail como opcional e totalmente simulado: o Status da Configuração inicia em "Não testado", "Testar conexão" fica habilitado somente com Servidor SMTP, Porta e E-mail do SMTP preenchidos, e "Enviar teste" somente com o Status em "Conectado". Acionar o teste SHALL percorrer o estado "Testando" por cerca de 1,2 segundo com os botões desabilitados e terminar em "Conectado" quando a Porta for 25, 465 ou 587, ou em "Falha" nos demais casos. Acionar "Enviar teste" com Status "Conectado" SHALL exibir toast informativo de envio simulado. Editar qualquer campo do bloco SHALL devolver o Status a "Não testado". Nenhuma requisição de rede SHALL ser emitida, e "Salvar" SHALL não exigir o teste.

#### Scenario: Provedor e segurança sugerem a porta
- **WHEN** o usuário troca a Segurança do e-mail
- **THEN** a Porta é automaticamente sugerida (Nenhuma → 25, STARTTLS → 587, SSL/TLS → 465) e permanece editável

#### Scenario: Teste com sucesso
- **WHEN** com servidor, porta 587 e e-mail preenchidos o usuário aciona "Testar conexão"
- **THEN** o Status passa por "Testando" e termina em "Conectado", habilitando "Enviar teste"

#### Scenario: Teste com falha por porta inválida
- **WHEN** com servidor e e-mail preenchidos o usuário informa a porta 250 e aciona "Testar conexão"
- **THEN** o Status termina em "Falha" e "Enviar teste" permanece desabilitado

#### Scenario: Alterar o bloco reseta o Status
- **WHEN** o Status está "Conectado" e o usuário altera o Servidor SMTP
- **THEN** o Status volta a "Não testado" e "Enviar teste" fica desabilitado

#### Scenario: Envio de teste simulado
- **WHEN** com Status "Conectado" o usuário aciona "Enviar teste"
- **THEN** um toast informa que o e-mail de teste foi enviado em simulação e nenhum request é feito

### Requirement: A exclusão confirma a remoção de um usuário via API
O sistema SHALL abrir um modal de confirmação (`UiModal` de largura `sm`) ao acionar o
"Excluir usuário" da linha, exibindo o título "Excluir Usuário", a identificação do alvo
(nome e e-mail) e o aviso de que a exclusão não pode ser desfeita, com as ações "Cancelar"
(secundária, `UiButton outline`) e "Excluir" (destrutiva, `UiButton danger`) no rodapé. Ao
confirmar, o sistema SHALL remover o registro via API — a linha sai da tabela, os KPIs
recalculam e um toast de sucesso é exibido — e devolver o foco ao campo de busca da tabela,
pois o botão que abriu o modal deixa de existir com a linha. "Cancelar", `Escape` ou o `X`
do cabeçalho SHALL fechar o modal sem nenhuma requisição. A exclusão SHALL ser irrestrita quanto ao perfil do alvo
(não há bloqueio por papel), ressalvada a guarda anti-lockout que responde `409` quando removeria a última administração essencial ativa (`perfis-acesso`) e SHALL persistir: a recarga não restaura o
usuário excluído. Sessões abertas do usuário excluído deixam de autenticar.

#### Scenario: Abertura pelo ícone da linha
- **WHEN** o usuário clica no `Trash2` de uma linha
- **THEN** o modal de exclusão abre exibindo nome e e-mail daquele usuário e nenhuma toast de "próxima etapa" é exibido

#### Scenario: Confirmação remove e recalcula
- **WHEN** com o modal aberto o usuário aciona "Excluir"
- **THEN** o modal fecha, o registro é removido pela API, os quatro KPIs refletem o conjunto sem ele e um toast de sucesso confirma a exclusão

#### Scenario: Excluir a última linha da última página mantém a tabela válida
- **WHEN** o usuário confirma a exclusão do único registro exibido na última página da tabela
- **THEN** a tabela exibe uma página válida com as linhas restantes, sem erro e sem página vazia indevida

#### Scenario: Descarte preserva a base
- **WHEN** com o modal aberto o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha sem nenhuma requisição, o registro permanece na tabela e nenhum toast é exibido

#### Scenario: Foco vai à busca da tabela
- **WHEN** a exclusão é confirmada e o modal fecha
- **THEN** o foco do teclado está no campo de busca da tabela, não no `body`

#### Scenario: Exclusão é irrestrita
- **WHEN** o usuário confirma a exclusão de um registro de qualquer perfil (inclusive Administrador)
- **THEN** o registro é removido normalmente pela API, sem bloqueio por papel nem aviso de restrição (exceto o último administrador essencial ativo, cuja remoção responde `409` e preserva o registro)

#### Scenario: Recarga mantém a exclusão
- **WHEN** a página é recarregada após uma exclusão
- **THEN** a listagem da API não exibe mais o usuário excluído (nada é restaurado)

### Requirement: O modal de convite escolhe o canal e envia as credenciais reais
O sistema SHALL abrir um modal de convite (`UiModal` de largura `xl` — 1120px —, ícone
`Send`, título "Enviar Convite" e subtítulo que descreve o propósito do modal) ao acionar o
ícone `MailCheck` da linha, sem nenhum toast de "próxima etapa". O corpo do modal SHALL
organizar-se em duas colunas em `xl` ou acima — Destinatário, Canal de Envio (com os dois
cartões lado a lado) e Credenciais de Acesso à esquerda (coluna de ~420px) e Pré-visualização à
direita, esticando até a altura da coluna esquerda — e em uma coluna abaixo desse breakpoint,
sempre em quatro `UiModalSection`: **"Destinatário"** (avatar ou iniciais, nome, e-mail,
telefone, badges de Perfil e Status), **"Canal de Envio"** (escolha única entre "E-mail" e
"WhatsApp" por dois cartões `UiChoiceCard`, iniciando em E-mail; o cartão de WhatsApp SHALL
chegar desabilitado, com dica explicando a ausência, quando o usuário não tiver telefone
cadastrado), **"Credenciais de Acesso"** (login = e-mail do usuário e a **senha provisória do
envio** — o sistema **nunca** devolve a senha vigente, pois guarda apenas o hash, então o campo
de senha vem **vazio** e um botão **Gerar** produz uma nova provisória no rascunho, com no
mínimo 8 caracteres; não há exibição da senha antiga) e **"Pré-visualização"** (apenas o template de
convite renderizado conforme o canal escolhido — HTML no E-mail e texto puro no WhatsApp —,
sem tarja de cabeçalho). A mensagem SHALL vir de um template pré-definido do sistema
compartilhado entre cliente e servidor, contendo o nome, o e-mail, o link de acesso
(`<origem>/admin/login`) e a senha provisória, sem edição de texto na tela. O botão "Enviar
Convite" SHALL permanecer desabilitado enquanto a senha provisória estiver vazia.

Acionar "Enviar Convite" SHALL chamar a API de convite com **find-or-create por e-mail**: se
a conta não existir no banco, ela SHALL ser criada com os dados do destinatário e o hash da
senha provisória; se existir, a senha provisória SHALL substituir o hash vigente somente quando a conta-alvo estiver **Ativa** e o solicitante detiver também a ação `alterar` de `gestao-usuarios` (reenviar convite redefine uma credencial existente); conta Inativa/Bloqueada SHALL ser recusada com `400`. Para o canal
**E-mail**, o servidor SHALL enviar a mensagem real via **Resend** (toast de sucesso de envio
real; falha do provedor → toast de erro, modal permanece aberto). Para **WhatsApp**, a senha
SHALL ser gravada no banco (mesmo find-or-create) e o aplicativo SHALL ser aberto pelo
protocolo client-side como hoje. A conta criada/alterada SHALL persistir na recarga, e a
listagem da tela — que vem do banco — reflete a conta real na sua linha.

#### Scenario: Abertura pela linha
- **WHEN** o usuário clica no `MailCheck` de uma linha
- **THEN** o modal de convite abre exibindo as quatro seções (com Destinatário, Canal de Envio
  e Credenciais à esquerda e Pré-visualização à direita em telas `xl` ou maiores), subtítulo
  descritivo, canal "E-mail" já selecionado e o campo de senha provisória vazio, sem nenhum
  toast de "próxima etapa"

#### Scenario: WhatsApp desabilitado sem telefone
- **WHEN** o modal de convite é aberto para um usuário sem telefone cadastrado
- **THEN** o cartão de WhatsApp aparece desabilitado com dica de que o telefone não está
  cadastrado, e a seleção permanece em "E-mail"

#### Scenario: Pré-visualização acompanha o canal
- **WHEN** com o modal aberto o usuário troca o canal de "E-mail" para "WhatsApp"
- **THEN** a pré-visualização passa a exibir a versão em texto da mensagem e volta a exibir a
  versão HTML quando o canal volta a "E-mail"

#### Scenario: Senha vazia bloqueia o envio e pode ser gerada
- **WHEN** o modal é aberto (o campo de senha sempre parte vazio)
- **THEN** o botão "Enviar Convite" está desabilitado com aviso, e a ação de gerar preenche uma
  senha provisória válida (no mínimo 8 caracteres) habilitando o envio

#### Scenario: Redefinir senha antes do envio
- **WHEN** o usuário aciona "Gerar" (ou redefine) a senha provisória no rascunho
- **THEN** uma nova senha provisória válida (no mínimo 8 caracteres) substitui a do rascunho, a
  ação pode ser repetida antes do envio e a nova senha só é gravada no banco ao enviar —
  descartada se o modal for fechado; a senha vigente do registro nunca é exibida

#### Scenario: Convite cria a conta quando ela não existe no banco
- **WHEN** o usuário aciona "Enviar Convite" numa linha que ainda não tem conta no banco
- **THEN** a API cria a conta (find-or-create por e-mail) com o hash da senha provisória e os
  dados do destinatário, e aquela senha passa a autenticar no `/admin/login`

#### Scenario: Envio por E-mail
- **WHEN** com senha preenchida o usuário mantém o canal "E-mail" e aciona "Enviar Convite"
- **THEN** nenhum cliente de e-mail é aberto, a API grava a senha (hash) e envia o convite
  real via Resend, um toast de sucesso confirma o envio e o modal fecha; falha no envio
  exibe toast de erro e o modal permanece aberto

#### Scenario: Envio por WhatsApp pelo aplicativo desktop
- **WHEN** com telefone cadastrado e senha preenchida o usuário escolhe "WhatsApp" e aciona
  "Enviar Convite"
- **THEN** a senha provisória é gravada no banco (find-or-create), o aplicativo WhatsApp
  Desktop abre via protocolo com o número normalizado (55 + dígitos) e a mensagem já
  preenchida, e um toast de sucesso é exibido

#### Scenario: Fallback do WhatsApp
- **WHEN** o protocolo do aplicativo não é respondido em cerca de 2 segundos
- **THEN** o WhatsApp Web (`wa.me`) é aberto com a mesma mensagem, sem erro e sem duplicar o
  envio

#### Scenario: Descarte do rascunho
- **WHEN** com senha recém-gerada no modal o usuário aciona "Cancelar", pressiona `Escape` ou
  clica no `X` do cabeçalho
- **THEN** o modal fecha, a senha gerada não é gravada em nenhum registro e a base permanece
  idêntica ao estado anterior

#### Scenario: Convite a conta existente exige Ativo e a ação alterar
- **WHEN** o convite é acionado para um e-mail que já possui conta não-Ativa, ou por um perfil com `criar` mas sem `alterar`
- **THEN** a API responde `400` (conta não-Ativa) ou `403` (sem `alterar`), nenhuma senha é redefinida e nenhuma sessão é emitida
#### Scenario: Recarga mantém a conta criada pelo convite
- **WHEN** a página é recarregada após um envio de convite
- **THEN** a listagem da API exibe o usuário normalmente e a conta (e a sua senha) seguem no
  banco — ela continua autenticando no login

### Requirement: As APIs de usuários não expõem a senha do SMTP
O sistema SHALL NOT devolver a senha do SMTP nas respostas das APIs de usuários (listagem, criação
e edição): no lugar do valor, a API SHALL informar apenas se há senha cadastrada, e a senha SHALL
ser gravada **cifrada em repouso**. Em uma edição enviada sem nova senha SMTP, a senha já
armazenada SHALL ser preservada.

#### Scenario: Listagem não traz a senha
- **WHEN** `GET /api/usuarios` é chamado
- **THEN** cada usuário traz um indicador de existência de senha SMTP e **nunca** o valor em claro

#### Scenario: Senha vazia preserva a existente
- **WHEN** uma edição de usuário é enviada sem uma nova senha SMTP
- **THEN** a senha SMTP armazenada permanece inalterada (a edição não a apaga)

#### Scenario: Nova senha é gravada cifrada
- **WHEN** uma edição envia uma nova senha SMTP
- **THEN** o valor é gravado de forma cifrada, sem que a leitura da API o devolva em claro

### Requirement: Perfis customizados são atribuíveis e importáveis na Gestão de Usuários
O sistema SHALL derivar as opções de **Perfil** do modal de usuário (criação e edição), as opções
do filtro de Perfil e a validação de Perfil da planilha de importação do cadastro de perfis de
acesso (`perfis_acesso`), e não de uma lista fixa: perfis customizados **Ativos** SHALL poder ser
selecionados como perfil de um usuário no modal, oferecidos no filtro e aceitos como valor de Perfil
nas linhas da planilha de importação. Somente perfis **Ativos** SHALL ser oferecidos ou aceitos —
perfis Inativos ou Bloqueados não SHALL aparecer como opção (no modal ou no filtro) nem constar da
lista de perfis válidos da importação, de modo que a UI não ofereça um caminho que o servidor
rejeitaria. Perfis sem badge mapeado SHALL exibir um badge genérico do design system, sem quebrar a
renderização.

#### Scenario: Perfil customizado é oferecido no modal de usuário
- **WHEN** existe um perfil customizado Ativo em Perfis de Acesso e o usuário abre o modal de usuário (novo ou edição)
- **THEN** o select de Perfil lista esse perfil customizado entre as opções, permitindo atribuí-lo ao usuário

#### Scenario: Perfil customizado é aceito na importação de planilha
- **WHEN** a planilha traz uma linha com um Perfil customizado Ativo cadastrado no sistema
- **THEN** a linha não é marcada como "Linha inválida" por esse motivo e permanece válida para importação

#### Scenario: Perfil Inativo não é oferecido nem aceito
- **WHEN** existe um perfil Inativo (ou Bloqueado) e um usuário abre o modal de usuário, o filtro de Perfil ou carrega uma planilha que o utilize
- **THEN** o perfil inativo não aparece como opção no modal nem no filtro, e a linha da planilha que o utiliza é classificada como "Linha inválida"

### Requirement: A exportação informa falha ao usuário
Ao gerar um relatório (CSV ou PDF), se a busca do conjunto ou a geração do arquivo falhar, o sistema SHALL exibir um toast de erro informando a falha — nunca falhar em silêncio (sem apenas registrar no console) — e SHALL indicar carregamento na ação enquanto a exportação estiver em andamento.

#### Scenario: Falha na exportação exibe erro
- **WHEN** o usuário aciona um item de "Relatórios" e a busca do conjunto ou a geração do arquivo falha
- **THEN** um toast de erro é exibido e o usuário sabe que a exportação não foi concluída

#### Scenario: Exportação em andamento indica carregamento
- **WHEN** o usuário aciona uma exportação
- **THEN** a ação exibe estado de carregamento até concluir

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário na Gestão de Usuários SHALL ser genéricas e acionáveis, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha de carga sem detalhe interno
- **WHEN** a carga dos usuários falha
- **THEN** o toast informa apenas que não foi possível carregar os dados, sem citar banco ou detalhes internos

### Requirement: A listagem trata recarga concorrente e reflete o termo de busca
A listagem SHALL aplicar uma recarga solicitada mesmo que haja uma carga em andamento (a recarga pendente SHALL ser executada após a atual concluir, sem ser descartada), e o termo de busca vigente SHALL aparecer no campo de busca da tabela — de modo que o filtro efetivo e o campo exibido nunca divirjam.

#### Scenario: Recarga durante carga em voo é aplicada
- **WHEN** o usuário salva/importa e a listagem é rebuscada enquanto uma carga anterior ainda está em andamento
- **THEN** a recarga pendente é executada após a primeira concluir, refletindo o estado atual (nenhuma atualização é perdida)

#### Scenario: Campo de busca reflete o termo vigente
- **WHEN** o usuário navega de volta à listagem com um termo de busca vigente no estado
- **THEN** o campo de busca da tabela exibe aquele termo, coerente com o conjunto filtrado

### Requirement: A criação concorrente de e-mail duplicado responde 409
Quando a criação de um usuário colidir com um e-mail já existente por uma condição de corrida (violação de unicidade no banco, `errno 1062`), a API SHALL responder `409` com a mensagem de e-mail já cadastrado, e não `500`.

#### Scenario: Corrida de unicidade vira 409
- **WHEN** duas criações com o mesmo e-mail concorrem e a segunda viola a unicidade no banco
- **THEN** a segunda responde `409` ("e-mail já cadastrado"), sem erro genérico `500`

### Requirement: O convite só atribui credenciais a usuário Ativo
O convite SHALL recusar (`400`) a geração/envio de credenciais para um usuário cuja situação não seja **Ativo**, de modo que não sejam entregues credenciais que o login bloquearia.

#### Scenario: Convite a Inativo é recusado
- **WHEN** um convite é solicitado com situação Inativo (ou Bloqueado)
- **THEN** a API responde `400` e nenhuma credencial é gerada/entregue

### Requirement: A atribuição de perfil respeita a hierarquia

Ao criar ou editar um usuário, o sistema SHALL permitir que o ator atribua apenas perfis cujo
conjunto de permissões não exceda o do seu próprio perfil. Um perfil intermediário com
`gestao-usuarios`/`criar` ou `alterar` NÃO SHALL criar ou promover uma conta Administrador, nem
atribuir um perfil com privilégios superiores aos seus. A tentativa SHALL responder `403` sem
gravar o usuário. Um ator com controle sobre perfis (`perfis-acesso`/`alterar` ou `permissoes`) e
perfil Administrador permanece autorizado.

#### Scenario: Perfil intermediário não cria Administrador
- **WHEN** um perfil com `gestao-usuarios`/`criar`, mas sem controle de perfis, envia `POST /api/usuarios` com perfil Administrador
- **THEN** a API responde `403` e nenhum usuário é criado

#### Scenario: Perfil intermediário não promove a superior
- **WHEN** um perfil intermediário envia `PUT /api/usuarios/:id` trocando o perfil de um usuário para um perfil superior ao seu
- **THEN** a API responde `403` e o perfil do alvo permanece inalterado

#### Scenario: Administrador mantém a atribuição
- **WHEN** um Administrador com controle de perfis cria ou edita um usuário com qualquer perfil ativo
- **THEN** a operação é autorizada

### Requirement: A listagem devolve os carimbos de cadastro

A listagem de usuários SHALL devolver, para cada registro, `dataCadastro` e `atualizadoEm`
derivados de `criado_em`/`atualizado_em`, de modo que o contrato da listagem não devolva campos
nulos quando o banco possui os carimbos. O detalhe do usuário continua sendo a fonte dos campos
completos, mas a listagem e a exportação SHALL refletir as datas reais.

#### Scenario: Datas presentes na listagem
- **WHEN** `GET /api/usuarios` devolve um usuário existente
- **THEN** `dataCadastro` e `atualizadoEm` vêm preenchidos com os carimbos do banco

#### Scenario: Exportação usa as datas reais
- **WHEN** o usuário exporta a listagem em CSV/PDF
- **THEN** as datas de cadastro/atualização correspondem ao banco

### Requirement: A busca de e-mails de usuários é dedicada e paginada

O sistema SHALL oferecer `GET /api/usuarios/emails` para autocomplete, retornando apenas `id`,
`email` e `nome`, com `q` de no mínimo 2 caracteres, paginação (`pagina`/`porPagina`) limitada a 20
itens e ordenação estável por e-mail. A rota SHALL exigir sessão e a permissão de
`gestao-usuarios`/`visualizar` (e `buscar` quando houver termo), NÃO SHALL devolver a lista completa
sem termo e NÃO SHALL expor hash, perfil, situação ou dados de contato além de nome/e-mail.

#### Scenario: Busca com termo
- **WHEN** um perfil autorizado consulta `q=ana`
- **THEN** a resposta traz até 20 usuários cujo e-mail/nome começa ou contém o termo, com apenas id, e-mail e nome

#### Scenario: Termo curto é recusado
- **WHEN** `q` tem menos de 2 caracteres
- **THEN** a API responde `400` e não varre a tabela

#### Scenario: Sem permissão
- **WHEN** um perfil sem `gestao-usuarios`/`visualizar` chama a rota
- **THEN** a API responde `403` sem retornar e-mails

#### Scenario: Paginação limitada
- **WHEN** o cliente pede `porPagina=500`
- **THEN** a API limita o tamanho da página e informa o total do conjunto filtrado
