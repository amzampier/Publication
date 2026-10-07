# Spec Delta — gestao-usuarios

## MODIFIED Requirements

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando o usuário aciona os controles ainda sem modal — a ação de linha de bloquear —, permanecendo nenhum `UiModal` aberto por esse controle; o botão "Novo Usuário" e a ação de editar da linha deixam de exibir toast e abrem o modal de usuário, a ação de excluir da linha deixa de exibir toast e abre o modal de confirmação de exclusão, o botão "Filtros" deixa de exibir toast e abre o modal de filtros, o ícone "Importar" da toolbar deixa de exibir toast e abre o modal de importação, e a ação de linha de enviar o convite deixa de exibir toast e abre o modal de convite.

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
- **THEN** o envio do convite não exibe toast e abre o modal de convite com aquela linha como destinatário, enquanto o bloquear mantém o toast informando que a funcionalidade estará disponível na próxima etapa, sem abrir nenhum modal

#### Scenario: Excluir deixou de avisar por toast
- **WHEN** o usuário clica no ícone de excluir (`Trash2`) de uma linha
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de confirmação de exclusão abre

### Requirement: O salvar grava em memória e o cancelar descarta
O sistema SHALL manter o CRUD de usuários inteiramente em memória: em modo de criação, "Salvar" adiciona o usuário ao conjunto vigente com Data Cadastro e Última Atualização iguais ao instante da gravação; em modo de edição, "Salvar" atualiza o registro preservando a Data Cadastro e atualizando a Última Atualização. A senha digitada no formulário (a senha provisória de acesso) SHALL ser gravada no registro em memória junto com os demais dados — na criação com o valor informado e, na edição, mantendo a senha vigente quando os campos de senha ficam vazios e substituindo-a quando um par válido é informado. Em ambos os casos o modal fecha e um toast de sucesso é exibido. "Cancelar", `Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o rascunho, sem alterar a base. As alterações SHALL sobreviver à navegação interna e serem descartadas na recarga da página, sem nenhuma requisição HTTP.

#### Scenario: Criação reflete na listagem
- **WHEN** o usuário salva um cadastro válido
- **THEN** a linha aparece na tabela com o badge de Perfil e de Status escolhidos, "Último acesso" exibindo "-" e os KPIs recalculados; um toast de sucesso confirma a criação

#### Scenario: Edição atualiza a linha
- **WHEN** o usuário altera nome, perfil ou situação de um usuário e salva
- **THEN** a linha passa a exibir os valores novos, a Última Atualização é a do instante da gravação e um toast de sucesso confirma a atualização

#### Scenario: Senha provisória fica gravada no registro
- **WHEN** o usuário cria um usuário informando a senha, ou edita um usuário sem tocar nos campos de senha e salva
- **THEN** o registro em memória guarda a senha provisória (mantida na edição), sem que ela apareça na tabela nem em nenhum outro lugar da listagem

#### Scenario: Cancelar não altera nada
- **WHEN** o usuário edita campos e aciona "Cancelar" (ou pressiona `Escape`)
- **THEN** o modal fecha, a base permanece idêntica ao estado anterior e nenhum toast de sucesso é exibido

#### Scenario: Recarga descarta as alterações
- **WHEN** a página é recarregada após criar ou editar usuários
- **THEN** a base de demonstração original volta a ser exibida

## ADDED Requirements

### Requirement: O modal de convite escolhe o canal e envia as credenciais pelo aplicativo do usuário
O sistema SHALL abrir um modal de convite (`UiModal` de largura `xl` — 1120px —, ícone `Send`, título "Enviar Convite" e subtítulo que descreve o propósito do modal) ao acionar o ícone `MailCheck` da linha, sem nenhum toast de "próxima etapa". O corpo do modal SHALL organizar-se em duas colunas em `xl` ou acima — Destinatário, Canal de Envio (com os dois cartões lado a lado) e Credenciais de Acesso à esquerda (coluna de ~420px) e Pré-visualização à direita, esticando até a altura da coluna esquerda — e em uma coluna abaixo desse breakpoint, sempre em quatro `UiModalSection`: **"Destinatário"** (avatar ou iniciais, nome, e-mail, telefone, badges de Perfil e Status), **"Canal de Envio"** (escolha única entre "E-mail" e "WhatsApp" por dois cartões `UiChoiceCard`, iniciando em E-mail; o cartão de WhatsApp SHALL chegar desabilitado, com dica explicando a ausência, quando o usuário não tiver telefone cadastrado), **"Credenciais de Acesso"** (login = e-mail do usuário e senha provisória exibidos **na mesma linha**; a senha, quando existir, aparece em modo somente-leitura com controle de visibilidade e cópia, e o botão de **redefinir**, que gera nova provisória no rascunho, fica abaixo dos campos; quando vazia, o campo de definição acompanha abaixo o botão de **gerar**, com no mínimo 8 caracteres) e **"Pré-visualização"** (apenas o template de convite renderizado conforme o canal escolhido — HTML no E-mail e texto puro no WhatsApp —, sem tarja de cabeçalho). A mensagem SHALL vir de um template pré-definido em arquivo do sistema contendo o nome, o e-mail, o link de acesso (`<origem>/admin/login`) e a senha provisória, sem edição de texto na tela. O botão "Enviar Convite" SHALL permanecer desabilitado enquanto a senha provisória estiver vazia. Acionar "Enviar Convite" SHALL gravar a senha provisória no registro em memória e disparar o canal escolhido — E-mail em simulação nesta fase: nenhum cliente de e-mail é aberto, um toast de sucesso informa tratar-se de simulação (o envio real via API do Resend é previsto para a fase de backend); WhatsApp pelo protocolo do aplicativo desktop (`whatsapp://send`), com abertura do WhatsApp Web (`wa.me`) como fallback quando o aplicativo não responder em cerca de 2 segundos —, seguido de toast de sucesso e com nada enviado até o usuário confirmar no aplicativo. Toda a operação SHALL ocorrer sem nenhuma requisição HTTP. O rodapé do modal SHALL conter a ação "Copiar mensagem" (à esquerda) e os botões "Cancelar" e "Enviar Convite". "Cancelar", `Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o rascunho (inclusive a senha gerada e ainda não enviada), e tudo SHALL ser descartado na recarga da página.

#### Scenario: Abertura pela linha
- **WHEN** o usuário clica no `MailCheck` de uma linha
- **THEN** o modal de convite abre exibindo as quatro seções (com Destinatário, Canal de Envio e Credenciais à esquerda e Pré-visualização à direita em telas `xl` ou maiores), subtítulo descritivo e canal "E-mail" já selecionado, sem nenhum toast de "próxima etapa"

#### Scenario: WhatsApp desabilitado sem telefone
- **WHEN** o modal de convite é aberto para um usuário sem telefone cadastrado
- **THEN** o cartão de WhatsApp aparece desabilitado com dica de que o telefone não está cadastrado, e a seleção permanece em "E-mail"

#### Scenario: Pré-visualização acompanha o canal
- **WHEN** com o modal aberto o usuário troca o canal de "E-mail" para "WhatsApp"
- **THEN** a pré-visualização passa a exibir a versão em texto da mensagem e volta a exibir a versão HTML quando o canal volta a "E-mail"

#### Scenario: Senha vazia bloqueia o envio e pode ser gerada
- **WHEN** o modal é aberto para um usuário sem senha provisória (ex.: importado)
- **THEN** o botão "Enviar Convite" está desabilitado com aviso, e a ação de gerar preenche uma senha provisória válida (no mínimo 8 caracteres) habilitando o envio

#### Scenario: Redefinir senha antes do envio
- **WHEN** com senha já existente no registro o usuário aciona "Redefinir senha"
- **THEN** uma nova senha provisória válida (no mínimo 8 caracteres) substitui a atual no rascunho e no campo somente-leitura, a ação pode ser repetida antes do envio e a nova senha só é gravada no registro ao enviar — descartada se o modal for fechado

#### Scenario: Envio por E-mail
- **WHEN** com senha preenchida o usuário mantém o canal "E-mail" e aciona "Enviar Convite"
- **THEN** nenhum cliente de e-mail é aberto, um toast de sucesso informa que o envio está em simulação (envio real via API na fase de backend), a senha provisória fica gravada no registro em memória e o modal fecha

#### Scenario: Envio por WhatsApp pelo aplicativo desktop
- **WHEN** com telefone cadastrado e senha preenchida o usuário escolhe "WhatsApp" e aciona "Enviar Convite"
- **THEN** o aplicativo WhatsApp Desktop abre via protocolo com o número normalizado (55 + dígitos) e a mensagem já preenchida, um toast de sucesso é exibido e a senha provisória fica gravada no registro em memória

#### Scenario: Fallback do WhatsApp
- **WHEN** o protocolo do aplicativo não é respondido em cerca de 2 segundos
- **THEN** o WhatsApp Web (`wa.me`) é aberto com a mesma mensagem, sem erro e sem duplicar o envio

#### Scenario: Descarte do rascunho
- **WHEN** com senha recém-gerada no modal o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha, a senha gerada não é gravada em nenhum registro e a base permanece idêntica ao estado anterior

#### Scenario: Recarga descarta tudo
- **WHEN** a página é recarregada após um envio de convite
- **THEN** a base de demonstração original volta a ser exibida, sem senha provisória gravada pelo modal
