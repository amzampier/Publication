# Spec Delta

## MODIFIED Requirements

### Requirement: A página tem cabeçalho, resumo lateral com Avatar destacado e card de abas com rodapé de ações
O sistema SHALL compor a página com um cabeçalho sem container (tile com ícone `User`, título "Meu Perfil" e subtítulo "Gerencie suas informações e preferências"), um resumo lateral em card e um card de abas com o rodapé de ações. O resumo lateral SHALL exibir, nesta ordem: o Avatar, o nome do usuário, o e-mail, o badge de status ("Ativo"/"Inativo") e o badge do perfil de acesso, e as linhas informativas **E-mail**, **Último acesso** e **Conta criada em** — sem botão de foto próprio (a troca de foto é feita pelo lápis do Avatar) e sem o mini-card de segurança (que pertence à aba Segurança). Os dados do resumo (nome, status, perfil, último acesso, data de cadastro) SHALL vir do registro real do usuário autenticado (banco), servido pela API. O rodapé do card de abas SHALL conter "Cancelar" (outline) e "Salvar alterações" (primary).

#### Scenario: Resumo lateral reflete o usuário logado
- **WHEN** a página carrega com a sessão de um usuário autenticado
- **THEN** o resumo exibe o nome, o e-mail, o status e o perfil daquele registro (banco), o último acesso formatado (ou indicador de nunca acessou) e a data de cadastro

#### Scenario: Avatar sem foto usa iniciais
- **WHEN** o usuário logado não possui foto de perfil
- **THEN** o Avatar exibe as iniciais do nome sobre fundo cinza neutro (`slate-600`)

#### Scenario: Avatar com foto usa a imagem
- **WHEN** o usuário logado possui foto de perfil gravada no registro
- **THEN** o Avatar exibe a imagem no lugar das iniciais

### Requirement: O Avatar é o ponto de destaque visual e permite trocar a foto por upload ou câmera
O sistema SHALL exibir o Avatar com foto ou iniciais centralizadas sobre fundo cinza neutro (`slate-600`, texto branco) e um botão lápis flutuante como único ponto de entrada da troca de foto. Sem foto (iniciais), o lápis SHALL ficar sempre visível; com foto, o lápis SHALL ficar oculto e aparecer somente quando o usuário passa o mouse sobre o Avatar (e, para teclado, quando o lápis recebe foco). Acionar o lápis SHALL abrir o fluxo de troca de foto do kit — `UiUploadFiles` em forma circular com `UiCameraWeb` para captura —, atualizando a pré-visualização do rascunho; remover a foto SHALL limpar a pré-visualização e voltar às iniciais (com o lápis visível de novo). A foto alterada SHALL ser parte do rascunho: no salvar, o arquivo SHALL ser enviado ao destino de uploads de avatar e o registro SHALL passar a referenciar o arquivo gravado (não um dataURL); sem troca, o registro mantém a foto anterior (ou sem foto).

#### Scenario: Upload troca a pré-visualização
- **WHEN** o usuário seleciona uma imagem válida no fluxo de troca de foto
- **THEN** o Avatar passa a exibir a imagem escolhida e o botão "Salvar alterações" fica habilitado

#### Scenario: Câmera captura a foto
- **WHEN** o usuário captura uma foto na `UiCameraWeb`
- **THEN** a imagem capturada substitui a pré-visualização do Avatar e habilita o "Salvar alterações"

#### Scenario: Com foto o lápis aparece só no hover
- **WHEN** o Avatar exibe uma foto e o usuário passa o mouse sobre ele
- **THEN** o lápis fica visível; ao retirar o mouse, o lápis volta a ficar oculto

#### Scenario: Sem foto o lápis fica sempre visível
- **WHEN** o Avatar exibe apenas as iniciais (sem foto)
- **THEN** o lápis aparece permanentemente, sem depender de hover

#### Scenario: Foto só é persistida ao salvar
- **WHEN** o usuário troca a foto e sai da página sem salvar (ou aciona "Cancelar")
- **THEN** o registro do usuário mantém a foto anterior (ou sem foto) no banco; com salvar, a
  foto nova passa a valer (arquivo enviado e referência gravada via API)

### Requirement: A aba Dados Pessoais edita nome e telefone com validação, e exibe Cargo e Setor somente leitura
A aba **Dados Pessoais** SHALL conter os campos **Nome completo** (obrigatório) e **Telefone** com máscara brasileira — **sem campo de e-mail**, que é exibido somente em leitura no resumo lateral e não é editável nesta tela —, além da seção "Informações adicionais" exibindo **Cargo** e **Setor** como campos somente leitura (do registro real; preenchidos no cadastro de usuários, não editáveis nem validados aqui). A seção SHALL exibir o aviso informativo de que as alterações valem para todo o sistema; nome e telefone editados compõem o rascunho e são gravados via API no "Salvar alterações". Erros de validação seguem o padrão do design system e são limpos ao digitar.

#### Scenario: Nome vazio bloqueia o salvamento
- **WHEN** o usuário limpa o nome e aciona "Salvar alterações"
- **THEN** o campo exibe "Informe o nome." no padrão de erro do design system e nenhuma alteração é gravada

#### Scenario: A aba não oferece edição de e-mail
- **WHEN** a aba Dados Pessoais é inspecionada
- **THEN** não há campo de e-mail no formulário; o e-mail do usuário aparece apenas em leitura no resumo lateral

#### Scenario: Cargo e Setor não são editáveis
- **WHEN** a aba Dados Pessoais é inspecionada
- **THEN** os campos Cargo e Setor aparecem desabilitados, exibindo os valores do registro, e não participam da validação nem do salvamento

### Requirement: A aba Endereço edita o endereço completo com o mesmo contrato do cadastro de usuários
A aba **Endereço** SHALL conter os campos CEP (com máscara e botão de busca ViaCEP), Endereço, Número, Complemento, Bairro, Cidade, Estado (seleção de UFs) e Região (seleção de regiões) — o mesmo contrato do modal de Gestão de Usuários. A busca de CEP SHALL exibir o aviso de disponibilidade futura (stub) sem preencher os campos. O endereço editado compõe o rascunho e é gravado via API no "Salvar alterações".

#### Scenario: Campos espelham o contrato do modal
- **WHEN** a aba Endereço é aberta
- **THEN** os oito campos aparecem com rótulos, máscaras, seleções e dicas idênticos aos do modal de usuários

#### Scenario: Busca de CEP na fase 1 é um stub
- **WHEN** o usuário aciona o botão de busca de CEP
- **THEN** um toast informa que a busca ViaCEP fica para a próxima etapa e nenhum campo é preenchido automaticamente

### Requirement: A aba E-mail expõe a configuração SMTP pessoal com teste simulado de conexão
A aba **E-mail** SHALL conter a configuração SMTP do usuário (e-mail SMTP, senha SMTP, provedor, servidor, segurança e porta) com o mesmo comportamento do bloco de configurações de e-mail do modal de Gestão de Usuários, do qual é extraída: a segurança sugerindo a porta quando digitada à mão não a sobrescreve, qualquer alteração zera o status para "Não testado", o botão "Testar conexão" simula o teste e o "Enviar teste" só habilita com status "Conectado", com o badge de status correspondente. O objeto SMTP editado compõe o rascunho e é gravado via API no "Salvar alterações".

#### Scenario: Segurança sugere a porta
- **WHEN** o usuário seleciona uma opção de segurança sem ter editado a porta à mão
- **THEN** a porta correspondente à segurança é preenchida automaticamente

#### Scenario: Alterar campo zera o status
- **WHEN** o status está "Conectado" e o usuário altera qualquer campo SMTP
- **THEN** o status volta para "Não testado" e o "Enviar teste" fica desabilitado

#### Scenario: Teste simulado com porta válida conecta
- **WHEN** o usuário informa servidor, porta válida e e-mail SMTP e aciona "Testar conexão"
- **THEN** após a simulação o badge exibe "Conectado" e o "Enviar teste" habilita

### Requirement: Salvar e Cancelar regem o rascunho inteiro da página
O sistema SHALL manter um rascunho em memória clonado do registro real do usuário
autenticado (servido pela API a partir da sessão). "Salvar alterações" SHALL nascer
desabilitado e habilitar quando qualquer aba alterar o rascunho; ao salvar, o sistema SHALL
validar os dados pessoais e gravar o rascunho via API no registro do logado (dados, endereço,
SMTP e, quando houver troca, a foto como arquivo), exibir toast de sucesso e desabilitar o
botão novamente. "Cancelar" SHALL restaurar o rascunho a partir do registro, limpar erros e
desabilitar o salvamento.

#### Scenario: Salvar grava todas as abas de uma vez
- **WHEN** o usuário altera telefone (aba Dados Pessoais), bairro (aba Endereço) e servidor SMTP (aba E-mail) e aciona "Salvar alterações"
- **THEN** um único salvamento grava as três alterações no registro via API, exibe toast de sucesso e o resumo lateral reflete os dados atualizados

#### Scenario: Salvar habilita só após alteração
- **WHEN** a página carrega ou após um salvamento bem-sucedido
- **THEN** o botão "Salvar alterações" está desabilitado

#### Scenario: Cancelar descarta as alterações
- **WHEN** o usuário altera campos em qualquer aba e aciona "Cancelar"
- **THEN** os campos voltam aos valores do registro (banco), os erros são limpos e o "Salvar alterações" volta a ficar desabilitado

### Requirement: A tela de Meu Perfil é documentada no `docs/09`
O sistema SHALL manter o documento `docs/09 - Meu Perfil.md` documentando a página (rota, estrutura componentizada, avatar com foto como arquivo, as quatro abas — com a Segurança via API e os demais dados gravados via API no registro real —, salvar/cancelar sobre o rascunho do registro do banco, navegação pelo menu da conta e pendências remanescentes: ViaCEP e RBAC), na mesma estrutura dos demais documentos de tela; as mudanças visuais do avatar SHALL refletir também em `docs/01 - design_system.md` e a navegação do item do menu da conta em `docs/03 - Header e Sidebar.md`.

#### Scenario: Documento existe e bate com a tela
- **WHEN** o `docs/09` é consultado
- **THEN** ele descreve rota, componentes, abas, comportamento de salvar/cancelar (sobre o registro real) e navegação coerentes com a página implementada
