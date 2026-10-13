# Spec Delta

## MODIFIED Requirements

### Requirement: O sistema serve o login em `/admin/login` sem o shell da Área Administrativa
O sistema SHALL servir a tela de login em `/admin/login` (`app/pages/admin/login.vue`) renderizada
**sem** o shell da Área Administrativa (sem header nem sidebar), como uma página de largura
integral com o `AuthBackground` (canvas animado) ao fundo e, centralizado sobre ele, um card
branco com cantos arredondados contendo o `AuthLoginHeader` (identidade — a logomarca de
Configurações > Logomarcas ou, sem personalização, a marca padrão do sistema — e o subtítulo
"Área Administrativa") e o `AuthLoginForm`. A rota SHALL ser liberada pela guarda global
mesmo sem sessão, e as rotas de autenticação — `/admin/login` e `/admin/esqueci-senha` —
SHALL ser as únicas rotas sob `/admin/**` sem o shell.

#### Scenario: Tela renderiza sem shell e com composição canônica
- **WHEN** o visitante abre `/admin/login` sem sessão
- **THEN** a página não exibe header nem sidebar da Área Administrativa, e o card centralizado
  exibe o cabeçalho (identidade e subtítulo) acima do formulário de login, sobre o canvas animado

#### Scenario: Logada, a rota de login redireciona para o painel
- **WHEN** um usuário com sessão ativa abre `/admin/login`
- **THEN** o navegador o redireciona imediatamente para `/admin`

### Requirement: A autenticação da fase 1 valida contra a base de usuários de demonstração
O login SHALL validar as credenciais contra a base `useUsuariosDemo` (fase 1, em memória): e-mail
cadastrado, senha igual à senha **vigente** do registro (a `SENHA_DEMO` `Public@2026` por padrão,
ou a senha provisória gravada pelo fluxo de recuperação) e status **Ativo**. Credenciais
incorretas (e-mail inexistente ou senha errada) SHALL exibir um **único** toast de erro genérico
—"E-mail ou senha inválidos."— sem revelar qual campo falhou. Usuário com status **Inativo** SHALL
receber toast de aviso específico ("Usuário inativo. Contate o administrador.") e não logar. Durante
a validação o botão SHALL ficar em estado de carregamento e nova submissão SHALL ser ignorada. Em
sucesso, o sistema SHALL atualizar o `ultimoAcesso` do usuário na base demo, gravar a sessão,
aplicar o "Lembrar-me" (preenchimento futuro do e-mail) e navegar para `/admin` ou para a rota
originalmente solicitada (`?redirect=`).

#### Scenario: Credenciais corretas logam e atualizam último acesso
- **WHEN** o usuário informa `ana.carolina@empresa.com.br` e `Public@2026` e envia
- **THEN** a sessão é gravada, o `ultimoAcesso` do registro na Gestão de Usuários passa a refletir
  o instante do login e o navegador vai para `/admin`

#### Scenario: Senha errada ou e-mail desconhecido produzem o mesmo erro
- **WHEN** o usuário informa um e-mail inexistente ou a senha incorreta e envia
- **THEN** um toast exibe "E-mail ou senha inválidos.", a sessão não é gravada e o usuário
  permanece no login

#### Scenario: Usuário inativo é bloqueado com aviso próprio
- **WHEN** o usuário informa o e-mail de um cadastro Inativo (ex. `camila.rocha@empresa.com.br`)
  com a senha demo
- **THEN** um toast exibe "Usuário inativo. Contate o administrador." e o login não é concluído

#### Scenario: Lembrar-me preenche o e-mail no retorno
- **WHEN** o usuário loga com "Lembrar-me" marcado e, numa próxima visita, abre `/admin/login`
  após sair da sessão
- **THEN** o campo e-mail já vem preenchido com o e-mail lembrado e a checkbox vem marcada

#### Scenario: Login com a senha provisória do fluxo de recuperação
- **WHEN** o usuário informa um e-mail cadastrado e a senha provisória gerada pelo envio em
  `/admin/esqueci-senha` e envia
- **THEN** o login é aceito normalmente (sessão gravada, `ultimoAcesso` atualizado, navegação
  para `/admin`), com a `Public@2026` deixando de valer para aquele registro enquanto a
  provisória estiver vigente

### Requirement: A guarda global protege a Área Administrativa e libera a Área Pública
O sistema SHALL aplicar `app/middleware/auth.global.ts` em toda navegação: rotas da Área Pública
(raiz e demais rotas fora de `/admin/**`), `/admin/login` e `/admin/esqueci-senha` são livres;
qualquer outra rota `/admin/**` SHALL exigir sessão ativa e, sem ela, redirecionar para
`/admin/login?redirect=<rota originalmente solicitada>`. Após login bem-sucedido com `?redirect=`
apontando para uma rota `/admin/**`, o usuário SHALL ser levado à rota solicitada em vez de
`/admin`.

#### Scenario: Acesso sem sessão redireciona preservando o destino
- **WHEN** um visitante sem sessão abre `/admin/perfis-acesso` diretamente pelo endereço
- **THEN** o navegador o leva para `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`

#### Scenario: Login com redirect volta à rota pretendida
- **WHEN** o usuário se autentica a partir de `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`
- **THEN** o navegador vai para `/admin/perfis-acesso`

#### Scenario: Área Pública permanece anônima
- **WHEN** o visitante abre `/` sem sessão
- **THEN** a página renderiza normalmente, sem redirecionamento para o login

#### Scenario: A rota de recuperação é livre sem sessão
- **WHEN** um visitante sem sessão abre `/admin/esqueci-senha`
- **THEN** a página renderiza normalmente, sem exigir sessão e sem redirecionamento

#### Scenario: Logada, a rota de recuperação manda para o painel
- **WHEN** um usuário com sessão ativa abre `/admin/esqueci-senha`
- **THEN** o navegador o redireciona imediatamente para `/admin` (mesmo tratamento de `/admin/login`)

### Requirement: A tela de login é documentada no `docs/08`
O sistema SHALL manter o documento `docs/08 - Login de Autenticação.md` documentando a página
(rota, componentes, composição e comportamento), o fluxo de recuperação com senha provisória
(rota `/admin/esqueci-senha`, geração e exibição da senha, login com a provisória), o fluxo de
sessão fake e a guarda, as credenciais de demonstração (incluindo a senha demo, a provisória e o
bloqueio de Inativos) e as pendências da fase com backend (JWT/HttpOnly, `useApiFetch`, envio
real de e-mail, persistência da senha, troca no Meu Perfil, rate limit), na mesma estrutura dos
demais documentos de tela.

#### Scenario: Documento existe e bate com a tela
- **WHEN** o `docs/08` é consultado
- **THEN** ele descreve rota, componentes, fluxos (inclusive o de recuperação com senha
  provisória), credenciais demo e pendências coerentes com o comportamento implementado

## REMOVED Requirements

### Requirement: O bloco Account exibe o usuário autenticado e a tela usa a logomarca configurada
**Reason**: O link "Esqueceu a senha?" deixou de exibir o toast "Funcionalidade em breve." e
passou a navegar para `/admin/esqueci-senha` — o requirement, tal como escrito, especificava um
comportamento que deixa de existir.
**Migration**: Bloco Account, identidade/logomarca das telas de autenticação e paleta do
`AuthBackground` foram reespecificados no requirement ADDED "O bloco Account exibe o usuário
autenticado e a identidade das telas de autenticação"; o novo comportamento do link está no
requirement ADDED "A página `/admin/esqueci-senha` coleta o e-mail e envia a senha provisória".

## ADDED Requirements

### Requirement: O bloco Account exibe o usuário autenticado e a identidade das telas de autenticação
O bloco Account do header SHALL exibir nome, perfil e iniciais do usuário logado (derivados da
sessão), e não mais valores fixos. O cabeçalho do card de qualquer tela de autenticação
(`/admin/login`, `/admin/esqueci-senha`) SHALL exibir a identidade do sistema no lugar do título:
a logomarca escolhida em Configurações > Logomarcas (`useLogomarcaLogin`, preview ou caminho)
quando personalizada, ou — sem personalização — a marca padrão do sistema (ícone `Building2` +
nome "Publications", idêntica ao cabeçalho do shell), com o subtítulo "Área Administrativa"
abaixo em ambos os casos. O `AuthBackground` SHALL usar a paleta do design system (azuis
`#112051`/`#0364f7`/`#50a1ff` e verde `#4ed813`/`#1a9e07`), substituindo a paleta teal/ciano
original.

#### Scenario: Header reflete o usuário logado
- **WHEN** usuário diferente de Ana Carolina (ex. `rafael.souza@empresa.com.br`, Editor) está
  logado e abre qualquer página administrativa
- **THEN** o bloco Account exibe "Rafael Souza" e o perfil Editor, com as iniciais "RS"

#### Scenario: Logomarca da tela acompanha as configurações
- **WHEN** uma logomarca foi configurada em Configurações > Logomarcas e o visitante abre
  `/admin/login`
- **THEN** o cabeçalho do card exibe aquela logomarca; sem personalização, exibe a marca padrão
  do sistema (ícone `Building2` + nome "Publications") — sempre com o subtítulo "Área
  Administrativa" abaixo

#### Scenario: Cabeçalho idêntico na tela de recuperação
- **WHEN** o visitante abre `/admin/esqueci-senha`
- **THEN** o card exibe a mesma identidade e o subtítulo "Área Administrativa" do card de login

### Requirement: A página `/admin/esqueci-senha` coleta o e-mail e envia a senha provisória
O sistema SHALL servir `/admin/esqueci-senha` com a mesma composição das telas de autenticação
(sem shell, `AuthBackground`, card `max-w-xs` com `AuthLoginHeader`, divisor e formulário),
contendo um `UiInput` de e-mail (obrigatório e com formato válido, erros no padrão do design
system) e um `UiButton` de envio com estado de carregamento. O envio SHALL ser **simulado**
(fase 1, sem backend): o sistema SHALL gerar uma senha provisória aleatória e, quando o e-mail
existir na base demo, registrá-la como a senha vigente do registro (substituindo a
`SENHA_DEMO` até nova alteração). A resposta SHALL ser **genérica**: o sistema nunca SHALL
indicar, por mensagem, tempo ou qualquer outro sinal, se o e-mail informado existe — para
e-mail cadastrado e não cadastrado a aparência da resposta SHALL ser idêntica (a senha exibida
para e-mail não cadastrado simplesmente não autentica). Como a fase 1 não envia e-mail real, o
estado de sucesso SHALL exibir a senha provisória gerada, com instrução de usá-la no login. O
link "Esqueceu a senha?" do `AuthLoginForm` SHALL navegar para esta rota, e a página SHALL
oferecer retorno ao `/admin/login`.

#### Scenario: Envio com e-mail cadastrado exibe a senha provisória que autentica
- **WHEN** o usuário informa um e-mail cadastrado na base demo com formato válido e aciona o
  envio
- **THEN** o card exibe o estado de sucesso com uma senha provisória aleatória e a instrução
  de usá-la no login, e aquela senha passa a autenticar o usuário no `/admin/login`

#### Scenario: E-mail não cadastrado recebe a mesma aparência de resposta
- **WHEN** o usuário envia um e-mail que não existe na base demo
- **THEN** o estado de sucesso é idêntico ao de um e-mail cadastrado (mesma forma, senha
  exibida), sem qualquer indicação de existência ou inexistência do cadastro; a senha exibida
  não autentica e o login responde com o erro genérico usual

#### Scenario: E-mail vazio ou inválido bloqueia o envio
- **WHEN** o usuário aciona o envio com o campo vazio ou com formato inválido (ex.: `abc`)
- **THEN** o campo exibe o erro no padrão do design system, o foco vai para ele e nenhum
  envio é simulado

#### Scenario: O link do login leva à recuperação
- **WHEN** o usuário clica em "Esqueceu a senha?" no formulário de login
- **THEN** o navegador vai para `/admin/esqueci-senha` e nenhum toast "Funcionalidade em
  breve." é exibido

#### Scenario: Retorno ao login
- **WHEN** o usuário aciona o retorno em `/admin/esqueci-senha`
- **THEN** o navegador vai para `/admin/login`
