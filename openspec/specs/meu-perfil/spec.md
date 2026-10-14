# Spec

## Purpose

Definir o comportamento da página do perfil do usuário logado (`/admin/meu-perfil`) — composição, avatar, as quatro abas de edição (dados pessoais, segurança, endereço e e-mail/SMTP), troca de senha, foto e o ciclo salvar/cancelar sobre a base de demonstração — para que o próprio usuário consulte e atualize suas informações sem passar pelo modal do administrador.

## Requirements

### Requirement: A página é servida em `/admin/meu-perfil` dentro do shell da Área Administrativa
O sistema SHALL servir a tela de perfil em `/admin/meu-perfil` (`app/pages/admin/meu-perfil.vue`) com o layout administrativo (`definePageMeta({ layout: 'admin' })`), herdando header e sidebar do shell. A rota SHALL ser protegida pela guarda global de `/admin/**`: sem sessão, o usuário é redirecionado ao login com retorno à rota original.

#### Scenario: Com sessão, a página renderiza com o shell
- **WHEN** um usuário autenticado abre `/admin/meu-perfil`
- **THEN** a página exibe o shell da Área Administrativa (header com o bloco Account e sidebar) e o conteúdo do perfil

#### Scenario: Sem sessão, a guarda redireciona
- **WHEN** um visitante sem sessão abre `/admin/meu-perfil`
- **THEN** o navegador redireciona para `/admin/login` com `?redirect=` preservando o caminho solicitado

### Requirement: A página tem cabeçalho, resumo lateral com Avatar destacado e card de abas com rodapé de ações
O sistema SHALL compor a página com um cabeçalho sem container (tile com ícone `User`, título "Meu Perfil" e subtítulo "Gerencie suas informações e preferências"), um resumo lateral em card e um card de abas com o rodapé de ações. O resumo lateral SHALL exibir, nesta ordem: o Avatar, o nome do usuário, o e-mail, o badge de status ("Ativo"/"Inativo") e o badge do perfil de acesso, e as linhas informativas **E-mail**, **Último acesso** e **Conta criada em** — sem botão de foto próprio (a troca de foto é feita pelo lápis do Avatar) e sem o mini-card de segurança (que pertence à aba Segurança). O rodapé do card de abas SHALL conter "Cancelar" (outline) e "Salvar alterações" (primary).

#### Scenario: Resumo lateral reflete o usuário logado
- **WHEN** a página carrega com a sessão de um usuário da base de demonstração
- **THEN** o resumo exibe o nome, o e-mail, o status e o perfil daquele registro, o último acesso formatado (ou indicador de nunca acessou) e a data de cadastro

#### Scenario: Avatar sem foto usa iniciais
- **WHEN** o usuário logado não possui foto de perfil
- **THEN** o Avatar exibe as iniciais do nome sobre fundo cinza neutro (`slate-600`)

#### Scenario: Avatar com foto usa a imagem
- **WHEN** o usuário logado possui foto de perfil gravada no registro
- **THEN** o Avatar exibe a imagem no lugar das iniciais

### Requirement: O Avatar é o ponto de destaque visual e permite trocar a foto por upload ou câmera
O sistema SHALL exibir o Avatar com foto ou iniciais centralizadas sobre fundo cinza neutro (`slate-600`, texto branco) e um botão lápis flutuante como único ponto de entrada da troca de foto. Sem foto (iniciais), o lápis SHALL ficar sempre visível; com foto, o lápis SHALL ficar oculto e aparecer somente quando o usuário passa o mouse sobre o Avatar (e, para teclado, quando o lápis recebe foco). Acionar o lápis SHALL abrir o fluxo de troca de foto do kit — `UiUploadFiles` em forma circular com `UiCameraWeb` para captura —, atualizando a pré-visualização do rascunho; remover a foto SHALL limpar a pré-visualização e voltar às iniciais (com o lápis visível de novo). A foto alterada SHALL ser parte do rascunho: só é gravada no registro ao salvar.

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
- **THEN** o registro do usuário mantém a foto anterior (ou sem foto) na base de demonstração

### Requirement: O conteúdo é organizado em quatro abas acessíveis pelo `UiTabs`
O sistema SHALL organizar o card de abas com exatamente estas abas, nesta ordem — **Dados Pessoais**, **Segurança**, **Endereço**, **E-mail** — usando o componente de tabs do kit (`UiTabs`), com painel `role="tabpanel"` correspondente à aba ativa. A aba padrão ao carregar SHALL ser **Dados Pessoais**. Em todas as abas, cada cabeçalho de seção (título + subtítulo) SHALL ser separado dos campos por um filete horizontal na cor verde da marca (`bg-brand-accent`).

#### Scenario: Abas na ordem canônica
- **WHEN** o card de abas é renderizado
- **THEN** os rótulos aparecem na ordem Dados Pessoais, Segurança, Endereço, E-mail, e a aba Dados Pessoais está selecionada

#### Scenario: Filete verde abaixo do subtítulo em todas as abas
- **WHEN** qualquer aba é aberta
- **THEN** o subtítulo da seção é seguido de uma linha horizontal verde da marca antes dos campos

#### Scenario: Troca de aba troca o painel
- **WHEN** o usuário seleciona a aba "Endereço"
- **THEN** o painel exibe o formulário de endereço e as demais abas ficam ocultas

### Requirement: A aba Dados Pessoais edita nome e telefone com validação, e exibe Cargo e Setor somente leitura
A aba **Dados Pessoais** SHALL conter os campos **Nome completo** (obrigatório) e **Telefone** com máscara brasileira — **sem campo de e-mail**, que é exibido somente em leitura no resumo lateral e não é editável nesta tela —, além da seção "Informações adicionais" exibindo **Cargo** e **Setor** como campos somente leitura (preenchidos pelo administrador no cadastro, não editáveis nem validados). A seção SHALL exibir o aviso informativo de que as alterações valem para todo o sistema. Erros de validação seguem o padrão do design system e são limpos ao digitar.

#### Scenario: Nome vazio bloqueia o salvamento
- **WHEN** o usuário limpa o nome e aciona "Salvar alterações"
- **THEN** o campo exibe "Informe o nome." no padrão de erro do design system e nenhuma alteração é gravada

#### Scenario: A aba não oferece edição de e-mail
- **WHEN** a aba Dados Pessoais é inspecionada
- **THEN** não há campo de e-mail no formulário; o e-mail do usuário aparece apenas em leitura no resumo lateral

#### Scenario: Cargo e Setor não são editáveis
- **WHEN** a aba Dados Pessoais é inspecionada
- **THEN** os campos Cargo e Setor aparecem desabilitados, exibindo os valores do registro, e não participam da validação nem do salvamento

### Requirement: A aba Segurança permite trocar a senha com validação contra a senha vigente
A aba **Segurança** SHALL conter **Senha atual** na primeira linha (largura de metade, sem
ocupar a tela inteira) e **Nova senha** (mínimo de 8 caracteres) **ao lado da Confirmação da
nova senha** na segunda linha, quando a largura permitir — com alternância de visibilidade, o
botão próprio "Alterar senha" e, ao final, o mini-card informativo "Sua conta está segura". A
troca SHALL ser processada pela API de troca de senha: a senha atual SHALL ser conferida no
servidor contra o hash vigente do banco (bcrypt) — a senha vigente pode ser a original, a
provisória do convite ou a provisória da recuperação, todas já persistidas como hash —, a nova
senha SHALL ter no mínimo 8 caracteres e a confirmação SHALL ser idêntica — validações de
formato no cliente, erro da conferência vindo do servidor, erros exibidos no campo
correspondente no padrão do design system, sem gravar nada. Em sucesso, a nova senha SHALL ser
gravada via API (substituindo o hash vigente; toast de sucesso e campos limpos) e passar a
autenticar no login; os demais campos da página não participam dessa operação.

#### Scenario: Senha atual incorreta
- **WHEN** o usuário informa uma senha atual diferente da vigente e aciona "Alterar senha"
- **THEN** o campo Senha atual exibe erro no padrão do design system (resposta do servidor) e
  a senha do registro não muda

#### Scenario: Confirmação divergente
- **WHEN** a nova senha e a confirmação diferem
- **THEN** o campo de confirmação exibe "As senhas não conferem." e nada é gravado

#### Scenario: Senha nova curta
- **WHEN** a nova senha tem menos de 8 caracteres
- **THEN** o campo exibe "A senha deve ter pelo menos 8 caracteres." e nada é gravado

#### Scenario: Troca bem-sucedida reflete no login
- **WHEN** o usuário troca a senha com todos os campos válidos
- **THEN** o servidor grava o novo hash no lugar do vigente, um toast confirma a troca e as
  próximas autenticações usam a nova senha

### Requirement: A aba Endereço edita o endereço completo com o mesmo contrato do cadastro de usuários
A aba **Endereço** SHALL conter os campos CEP (com máscara e botão de busca ViaCEP), Endereço, Número, Complemento, Bairro, Cidade, Estado (seleção de UFs) e Região (seleção de regiões) — o mesmo contrato do modal de Gestão de Usuários. A busca de CEP na fase 1 SHALL exibir o aviso de disponibilidade futura (stub) sem preencher os campos. O endereço editado SHALL compor o mesmo rascunho do salvamento da página.

#### Scenario: Campos espelham o contrato do modal
- **WHEN** a aba Endereço é aberta
- **THEN** os oito campos aparecem com rótulos, máscaras, seleções e dicas idênticos aos do modal de usuários

#### Scenario: Busca de CEP na fase 1 é um stub
- **WHEN** o usuário aciona o botão de busca de CEP
- **THEN** um toast informa que a busca ViaCEP fica para a próxima etapa e nenhum campo é preenchido automaticamente

### Requirement: A aba E-mail expõe a configuração SMTP pessoal com teste simulado de conexão
A aba **E-mail** SHALL conter a configuração SMTP do usuário (e-mail SMTP, senha SMTP, provedor, servidor, segurança e porta) com o mesmo comportamento do bloco de configurações de e-mail do modal de Gestão de Usuários, do qual é extraída: a segurança sugerindo a porta quando digitada à mão não a sobrescreve, qualquer alteração zera o status para "Não testado", o botão "Testar conexão" simula o teste e o "Enviar teste" só habilita com status "Conectado", com o badge de status correspondente. O objeto SMTP editado SHALL compor o mesmo rascunho do salvamento da página.

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
O sistema SHALL manter um rascunho em memória clonado do registro do usuário logado na base de demonstração (fase 1, sem backend). "Salvar alterações" SHALL nascer desabilitado e habilitar quando qualquer aba alterar o rascunho; ao salvar, o sistema SHALL validar os dados pessoais, gravar o rascunho no registro (dados, endereço, SMTP e foto), atualizar a data da última atualização, exibir toast de sucesso e desabilitar o botão novamente. "Cancelar" SHALL restaurar o rascunho a partir do registro, limpar erros e desabilitar o salvamento.

#### Scenario: Salvar grava todas as abas de uma vez
- **WHEN** o usuário altera telefone (aba Dados Pessoais), bairro (aba Endereço) e servidor SMTP (aba E-mail) e aciona "Salvar alterações"
- **THEN** um único salvamento grava as três alterações no registro, exibe toast de sucesso e o resumo lateral reflete os dados atualizados

#### Scenario: Salvar habilita só após alteração
- **WHEN** a página carrega ou após um salvamento bem-sucedido
- **THEN** o botão "Salvar alterações" está desabilitado

#### Scenario: Cancelar descarta as alterações
- **WHEN** o usuário altera campos em qualquer aba e aciona "Cancelar"
- **THEN** os campos voltam aos valores do registro, os erros são limpos e o "Salvar alterações" volta a ficar desabilitado

### Requirement: A tela de Meu Perfil é documentada no `docs/09`
O sistema SHALL manter o documento `docs/09 - Meu Perfil.md` documentando a página (rota, estrutura componentizada, avatar, as quatro abas, salvar/cancelar, navegação pelo menu da conta, credenciais de demonstração aplicáveis e pendências de fase futura), na mesma estrutura dos demais documentos de tela; as mudanças visuais do avatar SHALL refletir também em `docs/01 - design_system.md` e a navegação do item do menu da conta em `docs/03 - Header e Sidebar.md`.

#### Scenario: Documento existe e bate com a tela
- **WHEN** o `docs/09` é consultado
- **THEN** ele descreve rota, componentes, abas, comportamento de salvar/cancelar e navegação coerentes com a página implementada
