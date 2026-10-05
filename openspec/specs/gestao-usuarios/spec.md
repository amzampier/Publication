# Gestão de Usuários Specification

## Purpose

Definir o comportamento da página principal de Gestão de Usuários — listagem em memória (fase 1) com KPIs, tabela paginada com badges, exportação CSV/PDF e ações de cadastro/edição/filtros sinalizadas como pendentes para a fase dos modais — para que a Área Administrativa administre usuários conforme o modelo `usuarios`/`perfis` descrito no `docs/02`.

## Requirements

### Requirement: A página de gestão de usuários existe em /admin/gestao-usuarios dentro do shell administrativo
O sistema SHALL servir a Gestão de Usuários em `/admin/gestao-usuarios`, renderizada com o shell da Área Administrativa (header + sidebar), exibindo o título "Gestão de Usuários" com a identidade do módulo (tile do ícone `Users` na cor `#b070ef`).

#### Scenario: Rota renderiza com shell
- **WHEN** o visitante abre `/admin/gestao-usuarios`
- **THEN** a página exibe o header e a sidebar da Área Administrativa e, na área de conteúdo, o título "Gestão de Usuários" com o tile do ícone na cor do módulo

#### Scenario: Acesso direto por URL
- **WHEN** a rota é carregada diretamente pela URL (recarga)
- **THEN** a página renderiza com os usuários de demonstração e sem erro

### Requirement: Os atalhos de navegação apontam para a página
O sistema SHALL declarar a rota `/admin/gestao-usuarios` no item "Gestão de Usuários" da sidebar e no mesmo item do menu da conta, de modo que ambos naveguem para a página e o item da sidebar correspondente apareça como ativo.

#### Scenario: Item da sidebar navega e fica ativo
- **WHEN** o usuário clica em "Administração > Gestão de Usuários" na sidebar
- **THEN** o navegador navega para `/admin/gestao-usuarios` e aquele item aparece como ativo

#### Scenario: Item do menu da conta navega
- **WHEN** o usuário clica em "Gestão de Usuários" no menu da conta
- **THEN** o navegador navega para `/admin/gestao-usuarios`

### Requirement: Os KPIs derivam do conjunto de usuários vigente
O sistema SHALL exibir no topo da página os KPIs "Total de usuários" (contagem do conjunto vigente), "Ativos", "Inativos" e "Perfis distintos" (quantidade de perfis diferentes presentes no conjunto), recalculados sempre que o conjunto de usuários muda.

#### Scenario: Base completa
- **WHEN** a página é aberta sem nenhum filtro aplicado
- **THEN** os quatro KPIs refletem a base de demonstração (ex.: contagem total, quantidades de ativos e inativos e os perfis distintos presentes)

#### Scenario: Conjunto alterado recalcula os KPIs
- **WHEN** o conjunto de usuários exibido muda (por filtro do módulo)
- **THEN** "Total de usuários", "Ativos", "Inativos" e "Perfis distintos" passam a considerar apenas esse conjunto

#### Scenario: Criar ou editar usuário recalcula os KPIs
- **WHEN** o usuário salva um novo usuário ou altera um existente
- **THEN** os quatro KPIs refletem imediatamente o conjunto resultante (ex.: "Total de usuários" cresce em 1 na criação, "Ativos"/"Inativos" acompanham a Situação escolhida)

### Requirement: A tabela lista os usuários com paginação, ordenação, busca e badges
O sistema SHALL exibir os usuários em `UiDataTable` com colunas Nome, E-mail, Perfil (badge), Status (badge) e Último acesso, com paginação, ordenação e busca textual do componente, badge de Status distinguível entre "Ativo" e "Inativo" e badge de Perfil distinguível por perfil — cabendo as seis colunas (cinco de dados + Ações) **sem rolagem horizontal** na área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida), inclusive após trocar a quantidade de registros exibidos por página.

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
- **WHEN** um usuário de demonstração nunca acessou o sistema
- **THEN** a coluna "Último acesso" exibe "-" (hífen) naquela linha

#### Scenario: Trocar a quantidade de linhas não abre rolagem horizontal
- **WHEN** o usuário altera "Linhas por página" (ex.: de 5 para 20 ou 50) numa janela ≥ ~1280px com sidebar expandida
- **THEN** a área da tabela ganha linhas sem exibir barra de rolagem horizontal, com as seis colunas visíveis

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando o usuário aciona os controles ainda sem modal — as ações de linha de enviar o convite e bloquear —, permanecendo nenhum `UiModal` aberto por esses controles; o botão "Novo Usuário" e a ação de editar da linha deixam de exibir toast e abrem o modal de usuário, a ação de excluir da linha deixa de exibir toast e abre o modal de confirmação de exclusão, o botão "Filtros" deixa de exibir toast e abre o modal de filtros, e o ícone "Importar" da toolbar deixa de exibir toast e abre o modal de importação.

#### Scenario: Novo Usuário
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de usuário abre em modo de criação

#### Scenario: Importar na toolbar
- **WHEN** o usuário passa o mouse sobre o ícone de importar à esquerda do botão "Filtros"
- **THEN** um tooltip exibe "Importar Novos Usuários" e, ao clicar, nenhum toast de "próxima etapa" é exibido e o modal de importação abre

#### Scenario: Filtros na toolbar
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de filtros abre

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um usuário os controles de enviar o convite (ícone de e-mail confirmado) ou bloquear (cadeado) (ícones reduzidos com cores semânticas, cada um com tooltip e `aria-label` próprios)
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Excluir deixou de avisar por toast
- **WHEN** o usuário clica no ícone de excluir (`Trash2`) de uma linha
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de confirmação de exclusão abre

### Requirement: A exportação gera arquivos sobre o conjunto de usuários vigente
O sistema SHALL oferecer no cabeçalho o menu "Relatórios" (posicionado à esquerda do botão "Novo Usuário") com as opções "Ficha Cadastral" (gera um PDF em folha retrato com uma ficha por página para cada usuário do conjunto vigente), "Relação Completa" (gera e baixa o relatório `usuarios.pdf` em folha paisagem sobre os mesmos usuários) e "Exportar em CSV" (download do conjunto vigente com cabeçalhos), com um divisor separando as opções em PDF do CSV, sem abrir o diálogo de impressão do navegador.

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
O sistema SHALL abrir um modal de filtros ao acionar o botão "Filtros" da toolbar da tabela (`UiModal` de largura `sm`, com ícone no cabeçalho, título "Filtros de Usuários"), cujo corpo é organizado em duas sessões `UiModalSection`: **"Usuário"**, contendo um controle de seleção única `UiSelect` cujas opções são os nomes dos usuários da base (ordenados em pt-BR) e **"Perfil e Status"**, contendo dois `UiSelect` — um para **perfil** (Administrador, Editor, Revisor, Leitor) e um para **status** (Ativo, Inativo) —, em todos o estado vazio equivalendo a "todos" (placeholder "Todos os usuários"/"Todos os perfis"/"Todos os status") e a limpeza pelo `X` do select devolvendo o critério a "todos". O modal SHALL editar um rascunho sincronizado com o estado aplicado ao abrir: **"Aplicar"** grava o rascunho e fecha; **"Cancelar"**, `Escape` ou o `X` do cabeçalho fecham descartando o rascunho sem alterar o estado aplicado; **"Limpar Filtros"** (à esquerda do rodapé) zera rascunho e estado aplicado mantendo o modal aberto, com "Cancelar" e "Aplicar" à direita do rodapé. Aplicado o filtro, a tabela, os KPIs e as exportações (CSV e PDFs) SHALL refletir somente o conjunto filtrado, e o badge do botão "Filtros" SHALL indicar a quantidade de critérios ativos (0 a 3), alterada somente por "Aplicar" e "Limpar Filtros". Os filtros SHALL operar inteiramente em memória, sem nenhuma requisição HTTP, e serem descartados na recarga da página.

#### Scenario: Abertura pelo botão Filtros
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** o modal de filtros abre exibindo as sessões "Usuário" e "Perfil e Status" com os três selects no estado vigente e nenhum toast de "próxima etapa" é exibido

#### Scenario: Aplicar filtra e recalcula tudo
- **WHEN** com o modal aberto o usuário escolhe um perfil (ex.: Leitor) e aciona "Aplicar"
- **THEN** o modal fecha, a tabela lista apenas os usuários daquele perfil, os quatro KPIs refletem apenas esse conjunto, o badge do botão "Filtros" exibe 1 e o CSV e os PDFs gerados em seguida contêm somente esses usuários

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
- **THEN** a tabela exibe seu estado vazio ("Nenhum dado encontrado com o filtro aplicado.") e os KPIs refletem o conjunto vazio, sem erro

#### Scenario: Recarga descarta os filtros
- **WHEN** a página é recarregada com filtros aplicados
- **THEN** os filtros voltam ao estado vazio e a base completa é exibida

### Requirement: O modal de importação carrega usuários de uma planilha modelo
O sistema SHALL abrir um modal de importação de usuários ao acionar o ícone "Importar" da toolbar da tabela, aceitando somente arquivos `.xlsx` cujo cabeçalho corresponda ao modelo oficial de quatro colunas obrigatórias — **Nome**, **E-mail**, **Perfil**, **Status** —, modelo esse versionado no repositório (`docs/modelos/`) para consulta da equipe. Um arquivo com cabeçalho divergente ou ilegível SHALL exibir erro no modal sem montar a pré-visualização. Com arquivo válido, o modal SHALL exibir uma tabela temporária de pré-visualização com coluna de seleção e a coluna **Situação** de cada linha, em quatro estados: **"Pronto para importar"** (linha válida e e-mail ausente da base vigente), **"E-mail já cadastrado"** (e-mail presente na base vigente, comparado sem distinção de maiúsculas), **"Repetido no arquivo"** (segunda ocorrência do mesmo e-mail entre as linhas válidas do arquivo) e **"Linha inválida"** (nome ou e-mail ausentes, e-mail malformado ou Perfil/Status fora dos valores permitidos, com o motivo exibido) — as três últimas com seleção desabilitada. As linhas "Pronto para importar" SHALL chegar pré-selecionadas, e o rodapé SHALL exibir a contagem de selecionados no botão "Importar (n)", desabilitado quando n for zero. Confirmar SHALL adicionar à base em memória somente os registros selecionados — nascendo **sem senha** (a ser atribuída pelo envio manual de convite numa próxima etapa), com Data Cadastro e Última Atualização iguais ao instante da gravação, Status conforme o valor da planilha e os demais campos vazios — recalcular os KPIs, exibir toast de sucesso com a contagem e fechar o modal. **"Cancelar"**, `Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o arquivo carregado sem alterar a base. Filtros aplicados SHALL permanecer intactos pela importação: registros fora do filtro vigente só passam a aparecer na tabela e nos KPIs quando o filtro for limpo. Toda a operação SHALL ocorrer sem nenhuma requisição HTTP e ser descartada na recarga da página.

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
- **THEN** somente os registros selecionados entram na base em memória sem senha e com as datas do instante da gravação, os KPIs recalculam, um toast de sucesso confirma a contagem importada e o modal fecha

#### Scenario: Seleção zerada desabilita o botão
- **WHEN** nenhum registro está selecionado
- **THEN** o botão exibe "Importar (0)" e fica desabilitado

#### Scenario: Reimportar o mesmo arquivo marca tudo como já cadastrado
- **WHEN** após importar o usuário carrega novamente o mesmo arquivo
- **THEN** todas as linhas cujo e-mail consta na base exibem "E-mail já cadastrado" (as demais mantêm sua situação de validação) e nenhuma fica selecionada

#### Scenario: Descarte por Cancelar
- **WHEN** com arquivo carregado o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha, a base permanece idêntica ao estado anterior e nenhum toast de sucesso é exibido

#### Scenario: Filtros preservados na importação
- **WHEN** com filtros aplicados o usuário importa registros que não atendem ao filtro vigente
- **THEN** os filtros e o badge permanecem como estavam e os registros importados só passam a aparecer na tabela e nos KPIs quando o filtro for limpo

#### Scenario: Recarga restaura a base
- **WHEN** a página é recarregada após uma importação
- **THEN** a base de demonstração original volta a ser exibida, sem os registros importados

### Requirement: A fase 1 opera sem persistência e sem chamadas de rede
O sistema SHALL manter os usuários, perfis e exportações inteiramente em memória, restaurando os dados de demonstração a cada recarga da página, sem requisições HTTP.

#### Scenario: Recarga restaura o estado inicial
- **WHEN** a página é recarregada
- **THEN** a base de usuários de demonstração aparece novamente, sem alterações preservadas

### Requirement: O modal de usuário reúne os blocos de cadastro
O sistema SHALL exibir um único modal de usuário, aberto em modo de criação pelo botão "Novo Usuário" do cabeçalho e em modo de edição pelo lápis da linha, com os blocos **Dados do Usuário** (avatar, Nome, E-mail, Telefone, Função, Departamento e, numa linha própria de largura total começando abaixo do avatar, Status — em controle segmentado Ativo/Inativo, sem dropdown —, Perfil, Senha e Confirmar Senha — sem seção/cabeçalho próprio de "Acesso ao Sistema"), **Endereço** (CEP, Endereço, Número, Complemento, Bairro, Cidade, Estado, Região) e **Configurações de E-mail** (E-mail SMTP, Senha SMTP, Provedor, Servidor SMTP, Porta, Segurança, ações de teste e Status da Configuração) nos dois modos, acrescidos do bloco **Informações de Cadastro** (Data Cadastro e Última Atualização, ambos desabilitados) **somente em modo de edição** — o modo de criação SHALL abrir o modal apenas com os três blocos anteriores, sem a seção "Informações de Cadastro" e sem os campos de data.

#### Scenario: Abertura em modo de criação
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** o modal abre vazio, com Perfil e Situação sem seleção, exibindo somente os blocos "Dados do Usuário", "Endereço" e "Configurações de E-mail" — sem a seção "Informações de Cadastro" e sem os campos "Data Cadastro" e "Última Atualização"

#### Scenario: Abertura em modo de edição
- **WHEN** o usuário clica no lápis de uma linha
- **THEN** o modal abre preenchido com os dados daquele usuário — incluindo o bloco "Informações de Cadastro" com Data Cadastro e Última Atualização formatadas (dd/mm/aaaa HH:mm) — e com os campos de Senha vazios

#### Scenario: Máscara de CEP, telefone e porta
- **WHEN** o usuário digita em CEP, Telefone ou Porta
- **THEN** o valor é exibido com máscara (99999-999 no CEP) e o valor gravado corresponde ao conteúdo digitado

#### Scenario: Ícone de busca de CEP não preenche nada nesta etapa
- **WHEN** o usuário clica no ícone ao lado direito do campo CEP
- **THEN** um toast informa que a integração com o ViaCEP estará disponível na próxima etapa e nenhum campo de endereço é preenchido

#### Scenario: Avatar com câmera
- **WHEN** o usuário aciona a câmera no bloco de Dados do Usuário e confirma a captura
- **THEN** a pré-visualização circular do avatar é atualizada, o modal de usuário permanece aberto com os demais campos intactos e o modal de câmera é encerrado

### Requirement: O formulário de usuário valida antes de gravar
O sistema SHALL recusar o salvamento e manter o modal aberto quando: Nome, E-mail, Perfil ou Situação estiverem vazios; o E-mail estiver em formato inválido ou já pertencer a outro usuário da base vigente; na criação, Senha ou Confirmar Senha estiverem vazias, com menos de 8 caracteres ou divergentes entre si; na edição, exatamente um dos dois campos de senha estiver preenchido ou os dois divergirem. Cada campo inválido SHALL exibir a mensagem de erro de forma persistente abaixo do campo (label e recorte em `rose-700`) e o foco SHALL ir ao primeiro campo inválido.

#### Scenario: E-mail duplicado
- **WHEN** em modo de criação o usuário informa um e-mail já existente na base e tenta salvar
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

### Requirement: O salvar grava em memória e o cancelar descarta
O sistema SHALL manter o CRUD de usuários inteiramente em memória: em modo de criação, "Salvar" adiciona o usuário ao conjunto vigente com Data Cadastro e Última Atualização iguais ao instante da gravação; em modo de edição, "Salvar" atualiza o registro preservando a Data Cadastro e atualizando a Última Atualização. Em ambos os casos o modal fecha e um toast de sucesso é exibido. "Cancelar", `Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o rascunho, sem alterar a base. As alterações SHALL sobreviver à navegação interna e serem descartadas na recarga da página, sem nenhuma requisição HTTP.

#### Scenario: Criação reflete na listagem
- **WHEN** o usuário salva um cadastro válido
- **THEN** a linha aparece na tabela com o badge de Perfil e de Status escolhidos, "Último acesso" exibindo "-" e os KPIs recalculados; um toast de sucesso confirma a criação

#### Scenario: Edição atualiza a linha
- **WHEN** o usuário altera nome, perfil ou situação de um usuário e salva
- **THEN** a linha passa a exibir os valores novos, a Última Atualização é a do instante da gravação e um toast de sucesso confirma a atualização

#### Scenario: Cancelar não altera nada
- **WHEN** o usuário edita campos e aciona "Cancelar" (ou pressiona `Escape`)
- **THEN** o modal fecha, a base permanece idêntica ao estado anterior e nenhum toast de sucesso é exibido

#### Scenario: Recarga descarta as alterações
- **WHEN** a página é recarregada após criar ou editar usuários
- **THEN** a base de demonstração original volta a ser exibida

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

### Requirement: O modal de exclusão confirma a remoção de um usuário
O sistema SHALL abrir um modal de confirmação (`UiModal` de largura `sm`) ao acionar o "Excluir usuário" da linha, exibindo o título "Excluir Usuário", a identificação do alvo (nome e e-mail) e o aviso de que a exclusão não pode ser desfeita, com as ações "Cancelar" (secundária, `UiButton outline`) e "Excluir" (destrutiva, `UiButton danger`) no rodapé. Ao confirmar, o sistema SHALL remover o registro do conjunto vigente **em memória** — a linha sai da tabela, os KPIs recalculam e um toast de sucesso é exibido — e devolver o foco ao campo de busca da tabela, pois o botão que abriu o modal deixa de existir com a linha. "Cancelar", `Escape` ou o `X` do cabeçalho SHALL fechar o modal sem alterar a base. A exclusão SHALL ser irrestrita (qualquer perfil, sem bloqueio por papel), SHALL ocorrer sem nenhuma requisição HTTP e SHALL ser descartada na recarga da página junto com as demais alterações da fase em memória.

#### Scenario: Abertura pelo ícone da linha
- **WHEN** o usuário clica no `Trash2` de uma linha
- **THEN** o modal de exclusão abre exibindo nome e e-mail daquele usuário e nenhuma toast de "próxima etapa" é exibido

#### Scenario: Confirmação remove e recalcula
- **WHEN** com o modal aberto o usuário aciona "Excluir"
- **THEN** o modal fecha, o registro sai da tabela, os quatro KPIs refletem o conjunto sem ele e um toast de sucesso confirma a exclusão

#### Scenario: Excluir a última linha da última página mantém a tabela válida
- **WHEN** o usuário confirma a exclusão do único registro exibido na última página da tabela
- **THEN** a tabela exibe uma página válida com as linhas restantes, sem erro e sem página vazia indevida

#### Scenario: Descarte preserva a base
- **WHEN** com o modal aberto o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha, o registro permanece na tabela e nenhum toast é exibido

#### Scenario: Foco vai à busca da tabela
- **WHEN** a exclusão é confirmada e o modal fecha
- **THEN** o foco do teclado está no campo de busca da tabela, não no `body`

#### Scenario: Exclusão é irrestrita
- **WHEN** o usuário confirma a exclusão de um registro de qualquer perfil (inclusive Administrador)
- **THEN** o registro é removido normalmente, sem bloqueio nem aviso de restrição

#### Scenario: Recarga restaura a base
- **WHEN** a página é recarregada após uma exclusão
- **THEN** a base de demonstração original volta a ser exibida, com o usuário excluído presente
