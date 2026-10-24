# Spec Delta

## MODIFIED Requirements

### Requirement: O sistema serve o login em `/admin/login` sem o shell da Área Administrativa

O sistema SHALL servir a tela de login em `/admin/login` (`app/pages/admin/login.vue`) renderizada
**sem** o shell da Área Administrativa (sem header nem sidebar), como uma página de largura
integral com o `AuthBackground` (canvas animado) ao fundo e, centralizado sobre ele, um card
branco com cantos arredondados contendo o `AuthLoginHeader` (identidade — a logomarca de
Configurações > Logomarcas ou, sem personalização, a marca padrão do sistema — e o subtítulo
“Área Administrativa”) e o `AuthLoginForm`. A rota SHALL ser liberada pela guarda global
mesmo sem sessão, e as rotas de autenticação — `/admin/login`, `/admin/esqueci-senha` e
`/admin/primeiro-acesso` — SHALL ser as únicas rotas sob `/admin/**` sem o shell.

#### Scenario: Tela renderiza sem shell e com composição canônica

- **WHEN** o visitante abre `/admin/login` sem sessão
- **THEN** a página não exibe header nem sidebar da Área Administrativa, e o card centralizado
  exibe o cabeçalho (identidade e subtítulo) acima do formulário de login, sobre o canvas animado

#### Scenario: Logada, a rota de login redireciona para o painel

- **WHEN** um usuário com sessão ativa abre `/admin/login`
- **THEN** o navegador o redireciona imediatamente para `/admin`

#### Scenario: Primeiro acesso também fica fora do shell

- **WHEN** o usuário com senha provisória abre `/admin/primeiro-acesso`
- **THEN** a página renderiza com o layout de autenticação, sem header nem sidebar administrativa

## ADDED Requirements

### Requirement: A recuperação de senha rotula o envio da senha provisória

A tela `/admin/esqueci-senha` SHALL rotular a ação principal como envio de **senha provisória**
(ex.: “Enviar senha provisória”), e não como envio de link. A confirmação de sucesso SHALL informar
que uma senha provisória foi enviada e que a troca será exigida no primeiro acesso, sem prometer um
link de redefinição.

#### Scenario: Ação principal com rótulo correto

- **WHEN** a tela de recuperação é exibida
- **THEN** o botão principal informa que envia uma senha provisória

#### Scenario: Confirmação compatível com o mecanismo

- **WHEN** o envio é concluído
- **THEN** a mensagem confirma o envio da senha provisória e a troca obrigatória, sem mencionar link
