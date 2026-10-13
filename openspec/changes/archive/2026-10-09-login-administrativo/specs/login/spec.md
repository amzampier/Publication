# Spec Delta

## Purpose

Definir o comportamento da tela de login da Área Administrativa em fase 1 (fake, sem backend) —
rota, composição, validação de credenciais contra a base de demonstração, sessão por cookie,
guarda global das rotas `/admin/**`, logout e identidade do usuário logado — para que o acesso à
Área Administrativa exija autenticação mesmo antes da existência do servidor.

## ADDED Requirements

### Requirement: O sistema serve o login em `/admin/login` sem o shell da Área Administrativa
O sistema SHALL servir a tela de login em `/admin/login` (`app/pages/admin/login.vue`) renderizada
**sem** o shell da Área Administrativa (sem header nem sidebar), como uma página de largura
integral com o `AuthBackground` (canvas animado) ao fundo e, centralizado sobre ele, um card
branco com cantos arredondados contendo o `AuthLoginHeader` (identidade — a logomarca de
Configurações > Logomarcas ou, sem personalização, a marca padrão do sistema — e o subtítulo
"Área Administrativa") e o `AuthLoginForm`. A rota SHALL ser liberada pela guarda global
mesmo sem sessão, e `/admin/login` SHALL ser a única rota sob `/admin/**` sem o shell.

#### Scenario: Tela renderiza sem shell e com composição canônica
- **WHEN** o visitante abre `/admin/login` sem sessão
- **THEN** a página não exibe header nem sidebar da Área Administrativa, e o card centralizado
  exibe o cabeçalho (identidade e subtítulo) acima do formulário de login, sobre o canvas animado

#### Scenario: Logada, a rota de login redireciona para o painel
- **WHEN** um usuário com sessão ativa abre `/admin/login`
- **THEN** o navegador o redireciona imediatamente para `/admin`

### Requirement: O formulário de login usa os componentes do design system e valida os campos no cliente
O formulário SHALL conter um `UiInput` de e-mail (`autocomplete="username"`, ícone `Mail` à
esquerda), um `UiInput` de senha (`autocomplete="current-password"`, ícone `Lock` à esquerda), a
checkbox `UiCheckbox` "Lembrar-me", o link "Esqueceu a senha?" e o `UiButton` de envio
("Entrar no Portal", com spinner durante o carregamento) — todos consumindo os componentes do kit
conforme seus contratos (`leftIcon`/`rightIcon` e slots de ícone), sem paralelos. A submissão
SHALL validar no cliente: e-mail obrigatório com formato válido e senha obrigatória, exibindo os
erros com o padrão do design system (`error` no controle = recorte `rose-700`, ícone `AlertCircle`
e mensagem em tooltip + região viva) e devolvendo o foco ao **primeiro** campo inválido; erros
SHALL ser limpos ao digitar no campo correspondente. Enquanto houver erro de validação, nenhuma
tentativa de autenticação SHALL ocorrer.

#### Scenario: Campos vazios bloqueiam a submissão e focam o primeiro erro
- **WHEN** o usuário aciona "Entrar no Portal" com e-mail e senha vazios
- **THEN** o e-mail recebe o erro "Informe o e-mail.", o foco vai para o campo e-mail e nenhuma
  autenticação é tentada

#### Scenario: E-mail com formato inválido
- **WHEN** o usuário informa `abc` no e-mail e uma senha e envia
- **THEN** o campo e-mail exibe "Informe um e-mail válido." no padrão de erro do design system

#### Scenario: Digitar limpa o erro do campo
- **WHEN** um campo está em erro e o usuário digita nele
- **THEN** o erro daquele campo desaparece imediatamente

### Requirement: A autenticação da fase 1 valida contra a base de usuários de demonstração
O login SHALL validar as credenciais contra a base `useUsuariosDemo` (fase 1, em memória): e-mail
cadastrado, senha igual à `SENHA_DEMO` (`Public@2026`) e status **Ativo**. Credenciais
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

### Requirement: A sessão fake sobrevive à recarga por cookie e é encerrada pelo menu do Account
A sessão SHALL ser mantida em estado reativo e persistida em cookie fino (`COOKIE_SESSAO`)
contendo apenas o identificador do usuário da base demo — sem token, sem backend. Em recarga de
página (F5), a guarda SHALL restaurar a sessão a partir do cookie consultando a base demo; cookie
sem usuário correspondente SHALL ser tratado como sem sessão. O item **Encerrar Sessão** do menu
do Account SHALL limpar o estado e o cookie e navegar para `/admin/login`.

#### Scenario: F5 em página administrativa mantém o acesso
- **WHEN** o usuário com sessão ativa recarrega qualquer página `/admin/**`
- **THEN** a sessão é restaurada a partir do cookie e a página renderiza normalmente, sem
  redirecionamento para o login

#### Scenario: Encerrar Sessão volta para o login
- **WHEN** o usuário logado abre o menu do Account e clica em "Encerrar Sessão"
- **THEN** a sessão é encerrada (estado e cookie) e o navegador vai para `/admin/login`

#### Scenario: Cookie órfão não autentica
- **WHEN** o cookie de sessão referencia um usuário que não existe mais na base demo
- **THEN** o acesso é tratado como não autenticado e o navegador vai para `/admin/login`

### Requirement: A guarda global protege a Área Administrativa e libera a Área Pública
O sistema SHALL aplicar `app/middleware/auth.global.ts` em toda navegação: rotas da Área Pública
(raiz e demais rotas fora de `/admin/**`) e `/admin/login` são livres; qualquer outra rota
`/admin/**` SHALL exigir sessão ativa e, sem ela, redirecionar para `/admin/login?redirect=<rota
originalmente solicitada>`. Após login bem-sucedido com `?redirect=` apontando para uma rota
`/admin/**`, o usuário SHALL ser levado à rota solicitada em vez de `/admin`.

#### Scenario: Acesso sem sessão redireciona preservando o destino
- **WHEN** um visitante sem sessão abre `/admin/perfis-acesso` diretamente pelo endereço
- **THEN** o navegador o leva para `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`

#### Scenario: Login com redirect volta à rota pretendida
- **WHEN** o usuário se autentica a partir de `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`
- **THEN** o navegador vai para `/admin/perfis-acesso`

#### Scenario: Área Pública permanece anônima
- **WHEN** o visitante abre `/` sem sessão
- **THEN** a página renderiza normalmente, sem redirecionamento para o login

### Requirement: O bloco Account exibe o usuário autenticado e a tela usa a logomarca configurada
O bloco Account do header SHALL exibir nome, perfil e iniciais do usuário logado (derivados da
sessão), e não mais valores fixos. O cabeçalho do card de login SHALL exibir a identidade do
sistema no lugar do título: a logomarca escolhida em Configurações > Logomarcas
(`useLogomarcaLogin`, preview ou caminho) quando personalizada, ou — sem personalização — a
marca padrão do sistema (ícone `Building2` + nome "Publications", idêntica ao cabeçalho do
shell), com o subtítulo "Área Administrativa" abaixo em ambos os casos. O link "Esqueceu a
senha?" SHALL exibir `toast.info` com a mensagem "Funcionalidade em breve." sem navegar. O
`AuthBackground` SHALL usar a paleta do design system (azuis `#112051`/`#0364f7`/`#50a1ff` e
verde `#4ed813`/`#1a9e07`), substituindo a paleta teal/ciano original.

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

#### Scenario: Esqueci a senha avisa sem navegar
- **WHEN** o usuário clica em "Esqueceu a senha?"
- **THEN** um `toast.info` exibe "Funcionalidade em breve." e o navegador permanece em
  `/admin/login`

### Requirement: A tela de login é documentada no `docs/08`
O sistema SHALL manter o documento `docs/08 - Login de Autenticação.md` documentando a página
(rota, componentes, composição e comportamento), o fluxo de sessão fake e a guarda, as credenciais
de demonstração (incluindo a senha demo e o bloqueio de Inativos) e as pendências da fase com
backend (JWT/HttpOnly, `useApiFetch`, esqueci-senha, rate limit), na mesma estrutura dos demais
documentos de tela.

#### Scenario: Documento existe e bate com a tela
- **WHEN** o `docs/08` é consultado
- **THEN** ele descreve rota, componentes, fluxos, credenciais demo e pendências coerentes com o
  comportamento implementado
