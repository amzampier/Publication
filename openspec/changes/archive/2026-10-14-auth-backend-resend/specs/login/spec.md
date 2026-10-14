# Spec Delta

## ADDED Requirements

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
- **WHEN** o usuário informa `ana.carolina@empresa.com.br` e `Public@2026` e envia
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

### Requirement: A sessão é mantida por cookies HttpOnly com refresh rotativo e encerrada pelo menu do Account
O sistema SHALL manter a sessão em cookie HttpOnly de acesso (JWT de curta duração, ~15
minutos) em conjunto com cookie de refresh cujo token opaco (hash) é gravado na tabela de
sessões; a renovação SHALL rotacionar o refresh (invalidando o anterior) e o logout SHALL
revogar a sessão e limpar os cookies. Em recarga de página (F5), a sessão SHALL ser restaurada
via API — renovando o accesso expirado pelo refresh, sem exibir o login. Token inválido,
expirado, adulterado ou de sessão revogada SHALL ser tratado como sem sessão. O cliente SHALL
renovar automaticamente quando uma requisição receber `401` e refazer a requisição original,
sem interromper a experiência. O item **Encerrar Sessão** do menu do Account SHALL chamar o
logout na API e navegar para `/admin/login`.

#### Scenario: F5 em página administrativa mantém o acesso
- **WHEN** o usuário com sessão ativa recarrega qualquer página `/admin/**`
- **THEN** a sessão é restaurada (renovando o accesso expirado, se necessário) e a página
  renderiza normalmente, sem redirecionamento para o login

#### Scenario: Encerrar Sessão volta para o login
- **WHEN** o usuário logado abre o menu do Account e clica em "Encerrar Sessão"
- **THEN** a sessão é revogada no servidor (cookies limpos) e o navegador vai para
  `/admin/login`

#### Scenario: Sessão expirada é renovada automaticamente
- **WHEN** o tempo de vida do accesso expira com a sessão ainda aberta e o usuário executa
  uma ação (ou recarrega a página)
- **THEN** o refresh renova os cookies silenciosamente e a ação completa normalmente, sem
  redirecionamento ao login

#### Scenario: Token inválido ou revogado não autentica
- **WHEN** o cookie de acesso for inexistente, inválido ou apontar para sessão revogada
- **THEN** o acesso é tratado como não autenticado e o navegador vai para `/admin/login`

### Requirement: A página `/admin/esqueci-senha` envia a senha provisória por e-mail
O sistema SHALL servir `/admin/esqueci-senha` com a mesma composição das telas de
autenticação (sem shell, `AuthBackground`, card com `AuthLoginHeader`, divisor e formulário),
contendo um `UiInput` de e-mail (obrigatório e com formato válido, erros no padrão do design
system) e um `UiButton` de envio com estado de carregamento. O envio SHALL chamar a API de
recuperação com resposta **sempre genérica**: para e-mail cadastrado e não cadastrado a
aparência da resposta SHALL ser idêntica (nenhuma mensagem, tempo ou sinal indica existência).
Quando o e-mail existir no banco, o servidor SHALL gerar uma senha provisória, gravar o hash
como senha vigente (marcada como provisória) e **enviá-la por e-mail via Resend** (template do
sistema) — a senha **não** é exibida na tela. O estado de sucesso do card SHALL exibir apenas
a confirmação genérica de que as instruções foram enviadas ao e-mail informado, com o botão
"Voltar ao login" e o link "Enviar para outro e-mail". O link "Esqueceu a senha?" do
`AuthLoginForm` SHALL navegar para esta rota; a rota SHALL ser livre sem sessão e, com sessão
ativa, SHALL redirecionar para `/admin`.

#### Scenario: Envio com e-mail cadastrado envia a senha provisória por e-mail
- **WHEN** o usuário informa um e-mail cadastrado no banco com formato válido e aciona o envio
- **THEN** o card exibe o estado de sucesso genérico (sem senha na tela), o e-mail sai com a
  senha provisória e aquela senha passa a autenticar o usuário no `/admin/login`

#### Scenario: E-mail não cadastrado recebe a mesma aparência de resposta
- **WHEN** o usuário envia um e-mail que não existe no banco
- **THEN** o estado de sucesso é idêntico ao de um e-mail cadastrado (mesma forma e latência),
  sem qualquer indicação de existência ou inexistência, e nenhum e-mail é enviado

#### Scenario: E-mail vazio ou inválido bloqueia o envio
- **WHEN** o usuário aciona o envio com o campo vazio ou com formato inválido (ex.: `abc`)
- **THEN** o campo exibe o erro no padrão do design system, o foco vai para ele e nenhuma
  requisição é feita

#### Scenario: O link do login leva à recuperação
- **WHEN** o usuário clica em "Esqueceu a senha?" no formulário de login
- **THEN** o navegador vai para `/admin/esqueci-senha` e nenhum toast "Funcionalidade em
  breve." é exibido

#### Scenario: Retorno ao login
- **WHEN** o usuário aciona o retorno em `/admin/esqueci-senha`
- **THEN** o navegador vai para `/admin/login`

### Requirement: A proteção contra força bruta bloqueia temporariamente a conta
O sistema SHALL contar as falhas consecutivas de login por usuário e, ao alcançar 5 falhas,
bloquear a conta temporariamente por 15 minutos: enquanto o bloqueio estiver vigente, o login
SHALL recusar qualquer tentativa (mesmo com a senha correta) com aviso de conta bloqueada
temporariamente, sem autenticar. O bloqueio expira sozinho ao fim do período e uma tentativa
bem-sucedida SHALL zerar o contador de falhas.

#### Scenario: Bloqueio após falhas consecutivas
- **WHEN** o usuário erra a senha 5 vezes seguidas e, na 6ª tentativa, informa a senha correta
  dentro do período de bloqueio
- **THEN** um toast informa que a conta está bloqueada temporariamente, o login não é concluído
  e a sessão não é gravada

#### Scenario: Bloqueio expira e o login volta a funcionar
- **WHEN** o período de bloqueio expira e o usuário informa credenciais corretas
- **THEN** o login é aceito normalmente e o contador de falhas volta a zero

### Requirement: As rotas de autenticação respeitam o limite de requisições
O sistema SHALL aplicar às rotas de autenticação (login, refresh, recuperação, troca de senha
e convite) um limite de requisições por IP, derivado da configuração global de limite de
requisições do sistema, respondendo `429` com mensagem genérica quando excedido e sem executar
a operação.

#### Scenario: Exceder o limite responde 429
- **WHEN** um mesmo IP dispara mais requisições de login do que o limite permitido por minuto
- **THEN** as requisições excedentes respondem `429` e o cliente exibe toast de erro genérico
  (nenhuma validação de credencial é executada nas excedentes)

#### Scenario: Uso normal não é afetado pelo limite
- **WHEN** o usuário opera login/recuperação dentro do volume normal do limite configurado
- **THEN** nenhuma requisição é rejeitada por 429 e os fluxos funcionam como esperado

## MODIFIED Requirements

### Requirement: A tela de login é documentada no `docs/08`
O sistema SHALL manter o documento `docs/08 - Login de Autenticação.md` documentando a página
(rota, componentes, composição e comportamento), o fluxo de recuperação com envio **real** da
senha provisória por e-mail (rota `/admin/esqueci-senha`, chamada da API, estado de sucesso
genérico sem senha na tela, login com a provisória), a sessão real (cookies HttpOnly, refresh
rotativo, lockout e rate limit), a guarda das rotas, as credenciais de demonstração aplicáveis
(apenas o administrador provisionado; demais contas entram pelo convite da Gestão de Usuários) e
a arquitetura do backend de autenticação (endpoints, cookies, Resend), na mesma estrutura dos
demais documentos de tela.

#### Scenario: Documento existe e bate com a tela
- **WHEN** o `docs/08` é consultado
- **THEN** ele descreve rota, componentes, fluxos (inclusive o de recuperação por e-mail e a
  sessão com refresh), credenciais vigentes e a arquitetura de autenticação coerentes com o
  comportamento implementado

## REMOVED Requirements

### Requirement: A autenticação da fase 1 valida contra a base de usuários de demonstração
**Reason**: A autenticação fase 1 validava contra `useUsuariosDemo` em memória; com o backend
de auth, as credenciais são conferidas no banco (bcrypt, situação, lockout) via API — a nova
regra de comportamento é o ADDED "A autenticação valida as credenciais no banco e reflete o
estado da conta".
**Migration**: Todo o fluxo de login migra para `POST /api/auth/login`; as credenciais demo
que não existem no banco deixam de autenticar (contas novas entram pelo convite).

### Requirement: A sessão fake sobrevive à recarga por cookie e é encerrada pelo menu do Account
**Reason**: A sessão fake guardava apenas o id demo num cookie de JS; a sessão real usa cookies
HttpOnly com access JWT + refresh rotativo revogável no servidor — substituída pelo ADDED "A
sessão é mantida por cookies HttpOnly com refresh rotativo e encerrada pelo menu do Account".
**Migration**: `useAuth` passa a restaurar a sessão via API; o cookie fino `auth-sessao` deixa
de ser fonte de verdade (só o cookie de "lembrar-me" permanece no cliente).

### Requirement: A página `/admin/esqueci-senha` coleta o e-mail e envia a senha provisória
**Reason**: A fase 1 gerava e **exibia** a senha provisória na tela (não havia envio de
e-mail); com o backend + Resend, a senha sai por e-mail e o card vira estado genérico —
substituída pelo ADDED "A página `/admin/esqueci-senha` envia a senha provisória por e-mail".
**Migration**: O estado de sucesso deixa de exibir `<code>` com a senha e passa a confirmar o
envio; o comportamento anti-enumeração é preservado.
