# Spec Delta

## MODIFIED Requirements

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
mínimo 8 caracteres; não há exibição da senha antiga) e **"Pré-visualização"** (apenas o
template de convite renderizado conforme o canal escolhido — HTML no E-mail e texto puro no
WhatsApp —, sem tarja de cabeçalho). A mensagem SHALL vir de um template pré-definido do sistema
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

#### Scenario: Recarga mantém a conta criada pelo convite
- **WHEN** a página é recarregada após um envio de convite
- **THEN** a listagem da API exibe o usuário normalmente e a conta (e a sua senha) seguem no
  banco — ela continua autenticando no login
