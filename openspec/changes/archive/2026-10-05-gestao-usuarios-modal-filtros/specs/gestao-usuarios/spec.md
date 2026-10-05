# Spec Delta

## MODIFIED Requirements

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando o usuário aciona os controles ainda sem modal — o "Importar" da toolbar (ícone à esquerda do "Filtros", com tooltip "Importar Novos Usuários") e as ações de linha de enviar o convite e bloquear —, permanecendo nenhum `UiModal` aberto por esses controles; o botão "Novo Usuário" e a ação de editar da linha deixam de exibir toast e abrem o modal de usuário, a ação de excluir da linha deixa de exibir toast e abre o modal de confirmação de exclusão, e o botão "Filtros" deixa de exibir toast e abre o modal de filtros.

#### Scenario: Novo Usuário
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de usuário abre em modo de criação

#### Scenario: Importar na toolbar
- **WHEN** o usuário passa o mouse sobre o ícone de importar à esquerda do botão "Filtros"
- **THEN** um tooltip exibe "Importar Novos Usuários" e, ao clicar, um toast informa que a funcionalidade estará disponível na próxima etapa sem abrir modal

#### Scenario: Filtros na toolbar
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de filtros abre

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um usuário os controles de enviar o convite (ícone de e-mail confirmado) ou bloquear (cadeado) (ícones reduzidos com cores semânticas, cada um com tooltip e `aria-label` próprios)
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Excluir deixou de avisar por toast
- **WHEN** o usuário clica no ícone de excluir (`Trash2`) de uma linha
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de confirmação de exclusão abre

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

## ADDED Requirements

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
