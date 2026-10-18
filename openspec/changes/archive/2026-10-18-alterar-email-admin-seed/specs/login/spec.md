# Spec Delta

## MODIFIED Requirements

### Requirement: A autenticação valida as credenciais no banco e reflete o estado da conta
O sistema SHALL validar as credenciais contra a base de usuários do banco via
`POST /api/auth/login`: e-mail cadastrado, senha conferida com bcrypt contra o `hash_senha`
vigente e situação **Ativo**. Credenciais incorretas (e-mail inexistente ou senha errada)
SHALL exibir um **único** toast de erro genérico — "E-mail ou senha inválidos."— sem revelar
qual campo falhou. Situação **Inativo** SHALL receber toast de aviso específico ("Usuário
inativo. Contate o administrador.") e não logar. Conta com bloqueio de tentativas ativo SHALL
receber o aviso de bloqueio temporário e não logar. Durante a validação o botão SHALL ficar em
estado de carregamento e nova submissão SHALL ser ignorada. Em sucesso, o sistema SHALL
atualizar o último acesso do usuário no banco, estabelecer a sessão (cookies HttpOnly), aplicar
o "Lembrar-me" (apenas o e-mail) e navegar para `/admin` ou para a rota originalmente
solicitada (`?redirect=`).

#### Scenario: Credenciais corretas logam e atualizam o último acesso
- **WHEN** o usuário informa `admin@empresa.com.br` e `Public@2026` e envia
- **THEN** a sessão é estabelecida, o último acesso do registro no banco passa a refletir o
  instante do login e o navegador vai para `/admin`

#### Scenario: Senha errada ou e-mail desconhecido produzem o mesmo erro
- **WHEN** o usuário informa um e-mail inexistente no banco ou a senha incorreta e envia
- **THEN** um toast exibe "E-mail ou senha inválidos.", a sessão não é gravada e o usuário
  permanece no login

#### Scenario: Usuário inativo é bloqueado com aviso próprio
- **WHEN** o usuário informa o e-mail de um cadastro cuja situação no banco é Inativo com a
  senha correta
- **THEN** um toast exibe "Usuário inativo. Contate o administrador." e o login não é concluído

#### Scenario: Lembrar-me preenche o e-mail no retorno
- **WHEN** o usuário loga com "Lembrar-me" marcado e, numa próxima visita, abre
  `/admin/login` após sair da sessão
- **THEN** o campo e-mail já vem preenchido com o e-mail lembrado e a checkbox vem marcada

#### Scenario: Login com a senha provisória do fluxo de recuperação
- **WHEN** o usuário informa um e-mail cadastrado e a senha provisória enviada por e-mail pelo
  fluxo `/admin/esqueci-senha` (hash gravado no banco) e envia
- **THEN** o login é aceito normalmente (sessão estabelecida, último acesso atualizado,
  navegação para `/admin`), com a senha anterior deixando de valer para aquele registro
