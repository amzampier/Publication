# Spec Delta

## ADDED Requirements

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

### Requirement: A tela opera sobre a API de usuários; filtros e exportações permanecem locais
O sistema SHALL carregar a listagem de usuários (e, com ela, os dados que alimentam KPIs,
tabela, filtros e exportações) a partir de `GET /api/usuarios` na montagem da página,
exibindo estado de carregamento e toast de erro na falha (sem simular dados). CRUD,
importação, exclusão, bloqueio e convite SHALL operar via API, com as mutações refletidas
imediatamente no conjunto vigente. Filtros, busca, paginação, KPIs derivados e exportações
CSV/PDF SHALL permanecer processados no cliente sobre o conjunto carregado, sem requisição
por filtro ou exportação; os filtros SHALL continuar sendo descartados na recarga.

#### Scenario: Carga inicial mostra os usuários do banco
- **WHEN** o navegador abre `/admin/gestao-usuarios` com sessão ativa
- **THEN** um estado de carregamento é exibido enquanto `GET /api/usuarios` responde, e em
  seguida a tabela exibe os usuários persistidos no banco (ex.: o administrador provisionado
  e as contas criadas por convite)

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição de listagem falha (rede, banco ou sessão expirada sem refresh)
- **THEN** um toast de erro informa a falha e a tabela permanece em estado vazio/erro, sem
  exibir a base de demonstração antiga

#### Scenario: Recarga rebusca o banco
- **WHEN** a página é recarregada após criar, editar, importar, excluir, bloquear ou convidar
- **THEN** a listagem vem da API com os dados persistentes (nada volta a uma base demo)

#### Scenario: Filtro e exportação não fazem requisição
- **WHEN** o usuário aplica filtros, busca na tabela ou gera CSV/PDF
- **THEN** nenhuma requisição de rede é emitida por essas operações (elas processam o
  conjunto já carregado)

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

### Requirement: A importação grava os registros selecionados via API
O sistema SHALL abrir um modal de importação de usuários ao acionar o ícone "Importar" da
toolbar da tabela, aceitando somente arquivos `.xlsx` cujo cabeçalho corresponda ao modelo
oficial de quatro colunas obrigatórias — **Nome**, **E-mail**, **Perfil**, **Status** —,
modelo versionado no repositório (`docs/modelos/`) para consulta da equipe. Um arquivo com
cabeçalho divergente ou ilegível SHALL exibir erro no modal sem montar a pré-visualização.
Com arquivo válido, o modal SHALL exibir uma tabela temporária de pré-visualização com
coluna de seleção e a coluna **Situação** de cada linha, em quatro estados: **"Pronto para
importar"** (linha válida e e-mail ausente da base vigente), **"E-mail já cadastrado"**
(e-mail presente na base vigente, comparado sem distinção de maiúsculas), **"Repetido no
arquivo"** (segunda ocorrência do mesmo e-mail entre as linhas válidas do arquivo) e
**"Linha inválida"** (nome ou e-mail ausentes, e-mail malformado ou Perfil/Status fora dos
valores permitidos, com o motivo exibido) — as três últimas com seleção desabilitada. As
linhas "Pronto para importar" SHALL chegar pré-selecionadas, e o rodapé SHALL exibir a
contagem de selecionados no botão "Importar (n)", desabilitado quando n for zero.
Confirmar SHALL enviar as linhas selecionadas à API de importação, que as revalida contra o
banco (unicidade de e-mail, perfil existente) e grava em transação os registros selecionados
— nascendo **sem senha autenticável** (a ser atribuída pelo envio manual de convite), com a
situação da planilha e os demais campos vazios —, devolvendo a contagem gravada; o cliente
recalcula os KPIs, exibe toast de sucesso com a contagem e fecha o modal. **"Cancelar"**,
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

#### Scenario: Linhas com problemas ganham Situação própria e ficam não selecionáveis
- **WHEN** o arquivo contém um e-mail já existente na base, um e-mail repetido no arquivo e uma linha com Perfil fora dos valores permitidos
- **THEN** essas linhas exibem, respectivamente, "E-mail já cadastrado", "Repetido no arquivo" e "Linha inválida" (com o motivo) na coluna Situação e seus checkboxes permanecem desabilitados

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

#### Scenario: Descarte por Cancelar
- **WHEN** com arquivo carregado o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha sem nenhuma requisição, a base permanece idêntica ao estado anterior e nenhum toast de sucesso é exibido

#### Scenario: Filtros preservados na importação
- **WHEN** com filtros aplicados o usuário importa registros que não atendem ao filtro vigente
- **THEN** os filtros e o badge permanecem como estavam e os registros importados só passam a aparecer na tabela e nos KPIs quando o filtro for limpo

#### Scenario: Recarga mantém os registros importados
- **WHEN** a página é recarregada após uma importação
- **THEN** a listagem da API exibe também os registros importados (nada é descartado)

### Requirement: A exclusão confirma a remoção de um usuário via API
O sistema SHALL abrir um modal de confirmação (`UiModal` de largura `sm`) ao acionar o
"Excluir usuário" da linha, exibindo o título "Excluir Usuário", a identificação do alvo
(nome e e-mail) e o aviso de que a exclusão não pode ser desfeita, com as ações "Cancelar"
(secundária, `UiButton outline`) e "Excluir" (destrutiva, `UiButton danger`) no rodapé. Ao
confirmar, o sistema SHALL remover o registro via API — a linha sai da tabela, os KPIs
recalculam e um toast de sucesso é exibido — e devolver o foco ao campo de busca da tabela,
pois o botão que abriu o modal deixa de existir com a linha. "Cancelar", `Escape` ou o `X`
do cabeçalho SHALL fechar o modal sem nenhuma requisição. A exclusão SHALL ser irrestrita
(qualquer perfil, sem bloqueio por papel) e SHALL persistir: a recarga não restaura o
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
- **THEN** o registro é removido normalmente pela API, sem bloqueio nem aviso de restrição

#### Scenario: Recarga mantém a exclusão
- **WHEN** a página é recarregada após uma exclusão
- **THEN** a listagem da API não exibe mais o usuário excluído (nada é restaurado)

## MODIFIED Requirements

### Requirement: A página de gestão de usuários existe em /admin/gestao-usuarios dentro do shell administrativo
O sistema SHALL servir a Gestão de Usuários em `/admin/gestao-usuarios`, renderizada com o shell da Área Administrativa (header + sidebar), exibindo o título "Gestão de Usuários" com a identidade do módulo (tile do ícone `Users` na cor `#b070ef`).

#### Scenario: Rota renderiza com shell
- **WHEN** o visitante abre `/admin/gestao-usuarios`
- **THEN** a página exibe o header e a sidebar da Área Administrativa e, na área de conteúdo, o título "Gestão de Usuários" com o tile do ícone na cor do módulo

#### Scenario: Acesso direto por URL
- **WHEN** a rota é carregada diretamente pela URL (recarga), com sessão ativa
- **THEN** a página renderiza e carrega os usuários pela API, sem erro

### Requirement: Os KPIs derivam do conjunto de usuários vigente
O sistema SHALL exibir no topo da página os KPIs "Total de usuários" (contagem do conjunto vigente), "Ativos", "Inativos" e "Perfis distintos" (quantidade de perfis diferentes presentes no conjunto), recalculados sempre que o conjunto de usuários muda — o conjunto vem da API e, com filtro aplicado, passa a ser o conjunto filtrado.

#### Scenario: Base completa
- **WHEN** a página é aberta sem nenhum filtro aplicado
- **THEN** os quatro KPIs refletem os usuários servidos pela API (ex.: contagem total, quantidades de ativos e inativos e os perfis distintos presentes no banco)

#### Scenario: Conjunto alterado recalcula os KPIs
- **WHEN** o conjunto de usuários exibido muda (por filtro do módulo)
- **THEN** "Total de usuários", "Ativos", "Inativos" e "Perfis distintos" passam a considerar apenas esse conjunto

#### Scenario: Criar ou editar usuário recalcula os KPIs
- **WHEN** o usuário salva um novo usuário ou altera um existente
- **THEN** os quatro KPIs refletem imediatamente o conjunto resultante (ex.: "Total de usuários" cresce em 1 na criação, "Ativos"/"Inativos" acompanham a Situação escolhida)

### Requirement: A tabela lista os usuários com paginação, ordenação, busca e badges
O sistema SHALL exibir os usuários em `UiDataTable` com colunas Nome, E-mail, Perfil (badge), Status (badge) e Último acesso (do `ultimo_login` real quando houver), com paginação, ordenação e busca textual do componente, badge de Status distinguível entre "Ativo" e "Inativo" e badge de Perfil distinguível por perfil — cabendo as seis colunas (cinco de dados + Ações) **sem rolagem horizontal** na área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida), inclusive após trocar a quantidade de registros exibidos por página.

#### Scenario: Colunas e ordenação
- **WHEN** a página é aberta
- **THEN** a tabela mostra as colunas Nome, E-mail, Perfil, Status e Último acesso, com paginação funcionando

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
cadastrado), **"Credenciais de Acesso"** (login = e-mail do usuário e senha provisória
exibidos **na mesma linha**; a senha, quando existir, aparece em modo somente-leitura com
controle de visibilidade e cópia, e o botão de **redefinir**, que gera nova provisória no
rascunho, fica abaixo dos campos; quando vazia, o campo de definição acompanha abaixo do botão
de **gerar**, com no mínimo 8 caracteres) e **"Pré-visualização"** (apenas o template de
convite renderizado conforme o canal escolhido — HTML no E-mail e texto puro no WhatsApp —,
sem tarja de cabeçalho). A mensagem SHALL vir de um template pré-definido do sistema
compartilhado entre cliente e servidor, contendo o nome, o e-mail, o link de acesso
(`<origem>/admin/login`) e a senha provisória, sem edição de texto na tela. O botão "Enviar
Convite" SHALL permanecer desabilitado enquanto a senha provisória estiver vazia.

Acionar "Enviar Convite" SHALL chamar a API de convite com **find-or-create por e-mail**: se
a conta não existir no banco, ela SHALL ser criada com os dados do destinatário e o hash da
senha provisória; se existir, a senha provisória SHALL substituir o hash vigente. Para o canal
**E-mail**, o servidor SHALL enviar a mensagem real via **Resend** (toast de sucesso de envio
real; falha do provedor → toast de erro, modal permanece aberto). Para **WhatsApp**, a senha
SHALL ser gravada no banco (mesmo find-or-create) e o aplicativo SHALL ser aberto pelo
protocolo client-side como hoje. A conta criada/alterada SHALL persistir na recarga, e a
listagem da tela — que vem do banco — reflete a conta real na sua linha.

#### Scenario: Abertura pela linha
- **WHEN** o usuário clica no `MailCheck` de uma linha
- **THEN** o modal de convite abre exibindo as quatro seções (com Destinatário, Canal de Envio
  e Credenciais à esquerda e Pré-visualização à direita em telas `xl` ou maiores), subtítulo
  descritivo e canal "E-mail" já selecionado, sem nenhum toast de "próxima etapa"

#### Scenario: WhatsApp desabilitado sem telefone
- **WHEN** o modal de convite é aberto para um usuário sem telefone cadastrado
- **THEN** o cartão de WhatsApp aparece desabilitado com dica de que o telefone não está
  cadastrado, e a seleção permanece em "E-mail"

#### Scenario: Pré-visualização acompanha o canal
- **WHEN** com o modal aberto o usuário troca o canal de "E-mail" para "WhatsApp"
- **THEN** a pré-visualização passa a exibir a versão em texto da mensagem e volta a exibir a
  versão HTML quando o canal volta a "E-mail"

#### Scenario: Senha vazia bloqueia o envio e pode ser gerada
- **WHEN** o modal é aberto para um usuário sem senha provisória (ex.: importado)
- **THEN** o botão "Enviar Convite" está desabilitado com aviso, e a ação de gerar preenche uma
  senha provisória válida (no mínimo 8 caracteres) habilitando o envio

#### Scenario: Redefinir senha antes do envio
- **WHEN** com senha já existente no registro o usuário aciona "Redefinir senha"
- **THEN** uma nova senha provisória válida (no mínimo 8 caracteres) substitui a atual no
  rascunho e no campo somente-leitura, a ação pode ser repetida antes do envio e a nova senha
  só é gravada no banco ao enviar — descartada se o modal for fechado

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

#### Scenario: Recarga mantém a conta criada pelo convite
- **WHEN** a página é recarregada após um envio de convite
- **THEN** a listagem da API exibe o usuário normalmente e a conta (e a sua senha) seguem no
  banco — ela continua autenticando no login

## REMOVED Requirements

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
**Reason**: Não resta nenhuma ação pendente de "próxima etapa": o Bloquear passou a ser real
(modal de confirmação + alternância de situação via API) e todas as demais ações já abrem
seus fluxos — substituído pelo ADDED "Todas as ações da tela abrem os fluxos reais".
**Migration**: O toast de transição do cadeado sai de cena; o controle passa a abrir o modal
"Bloquear/Desbloquear Usuário".

### Requirement: O modal de importação carrega usuários de uma planilha modelo
**Reason**: O commit da importação deixa de ser "em memória, sem requisição HTTP, descartado
na recarga" e passa a ser um POST com revalidação server-side e gravação persistente —
substituído pelo ADDED "A importação grava os registros selecionados via API" (a UI do modal
— modelo de colunas, estados de Situação, seleção e descarte — é preservada).
**Migration**: "Importar (n)" chama `POST /api/usuarios/importar`; a recarga mantém os
registros importados.

### Requirement: As operações da tela permanecem em memória; só o convite usa a rede
**Reason**: Com CRUD, importação, exclusão, bloqueio e listagem todos pela API, a vedação
"só o convite usa a rede" ficou falsa — substituído pelo ADDED "A tela opera sobre a API
de usuários; filtros e exportações permanecem locais", que preserva o regime local apenas
para filtros/busca/KPIs/exportações.
**Migration**: A listagem nasce da API (sem seed: admin provisionado + contas convidadas);
filtros e exportações continuam locais sobre o conjunto carregado.

### Requirement: O salvar grava em memória e o cancelar descarta
**Reason**: O CRUD grava no banco via API (bcrypt, datas do servidor, avatar como arquivo) e
as alterações persistem na recarga — substituído pelo ADDED "O salvar grava via API e o
cancelar descarta", que mantém o ciclo do modal e a descartabilidade do Cancelar.
**Migration**: "Salvar" chama `POST/PUT /api/usuarios`; "Cancelar" segue sem requisição.

### Requirement: O modal de exclusão confirma a remoção de um usuário
**Reason**: A remoção passou de "em memória, sem requisição HTTP, descartada na recarga" para
exclusão real via API com persistência (e sessões do usuário excluído deixam de autenticar)
— substituído pelo ADDED "A exclusão confirma a remoção de um usuário via API", preservando o
modal, a identificação e a exclusão irrestrita.
**Migration**: "Excluir" chama `DELETE /api/usuarios/:id`; a recarga não restaura o usuário.
