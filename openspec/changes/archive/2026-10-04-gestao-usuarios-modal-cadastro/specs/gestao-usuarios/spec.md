# Spec Delta

## MODIFIED Requirements

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando o usuário aciona os controles ainda sem modal — o "Importar" da toolbar (ícone à esquerda do "Filtros", com tooltip "Importar Novos Usuários"), o botão "Filtros" e as ações de linha de enviar o convite, bloquear e excluir —, permanecendo nenhum `UiModal` aberto por esses controles; o botão "Novo Usuário" e a ação de editar da linha deixam de exibir toast e abrem o modal de usuário.

#### Scenario: Novo Usuário
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de usuário abre em modo de criação

#### Scenario: Importar na toolbar
- **WHEN** o usuário passa o mouse sobre o ícone de importar à esquerda do botão "Filtros"
- **THEN** um tooltip exibe "Importar Novos Usuários" e, ao clicar, um toast informa que a funcionalidade estará disponível na próxima etapa sem abrir modal

#### Scenario: Filtros na toolbar
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um usuário os controles de enviar o convite (ícone de e-mail confirmado), bloquear (cadeado) ou excluir (ícones reduzidos com cores semânticas, cada um com tooltip e `aria-label` próprios)
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

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

## ADDED Requirements

### Requirement: O modal de usuário reúne os blocos de cadastro
O sistema SHALL exibir um único modal de usuário, aberto em modo de criação pelo botão "Novo Usuário" do cabeçalho e em modo de edição pelo lápis da linha, com quatro blocos: **Dados do Usuário** (avatar, Nome, E-mail, Telefone, Função, Departamento e, numa linha própria de largura total começando abaixo do avatar, Status — em controle segmentado Ativo/Inativo, sem dropdown —, Perfil, Senha e Confirmar Senha — sem seção/cabeçalho próprio de "Acesso ao Sistema"), **Endereço** (CEP, Endereço, Número, Complemento, Bairro, Cidade, Estado, Região), **Configurações de E-mail** (E-mail SMTP, Senha SMTP, Provedor, Servidor SMTP, Porta, Segurança, ações de teste e Status da Configuração) e **Informações de Cadastro** (Data Cadastro e Última Atualização, ambos desabilitados).

#### Scenario: Abertura em modo de criação
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** o modal abre vazio, com Perfil e Situação sem seleção e com Data Cadastro e Última Atualização desabilitados exibindo "-" e o texto auxiliar "Preenchidos ao salvar"

#### Scenario: Abertura em modo de edição
- **WHEN** o usuário clica no lápis de uma linha
- **THEN** o modal abre preenchido com os dados daquele usuário — incluindo Data Cadastro e Última Atualização formatadas (dd/mm/aaaa HH:mm) — e com os campos de Senha vazios

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
