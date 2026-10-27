# Spec Delta

## MODIFIED Requirements

### Requirement: O sistema serve o login em `/admin/login` sem o shell da Área Administrativa

O sistema SHALL servir a tela de login em `/admin/login` (`app/pages/admin/login.vue`) renderizada
**sem** o shell da Área Administrativa (sem header nem sidebar), como uma página de largura
integral com o `AuthBackground` (canvas animado) ao fundo e, centralizado sobre ele, um card
branco com cantos arredondados contendo o `AuthLoginHeader` (identidade — a logomarca de
Configurações > Logomarcas ou, sem personalização, a marca padrão do sistema) e o `AuthLoginForm`.
O cabeçalho do card SHALL exibir somente a identidade, sem subtítulo ou texto auxiliar abaixo da
logomarca. A rota SHALL ser liberada pela guarda global
mesmo sem sessão, e as rotas de autenticação — `/admin/login`, `/admin/esqueci-senha` e
`/admin/primeiro-acesso` — SHALL ser as únicas rotas sob `/admin/**` sem o shell.

#### Scenario: Tela renderiza sem shell e com composição canônica

- **WHEN** o visitante abre `/admin/login` sem sessão
- **THEN** a página não exibe header nem sidebar da Área Administrativa, e o card centralizado
  exibe o cabeçalho (somente a identidade, sem subtítulo) acima do formulário de login, sobre o canvas animado

#### Scenario: Logada, a rota de login redireciona para o painel

- **WHEN** um usuário com sessão ativa abre `/admin/login`
- **THEN** o navegador o redireciona imediatamente para `/admin`

#### Scenario: Primeiro acesso também fica fora do shell

- **WHEN** o usuário com senha provisória abre `/admin/primeiro-acesso`
- **THEN** a página renderiza com o layout de autenticação, sem header nem sidebar administrativa

### Requirement: O bloco Account exibe o usuário autenticado e a identidade das telas de autenticação

O bloco Account do header SHALL exibir nome, perfil e iniciais do usuário logado (derivados da sessão), e não mais valores fixos. O cabeçalho do card de qualquer tela de autenticação (`/admin/login`, `/admin/esqueci-senha`, `/admin/primeiro-acesso`) SHALL exibir a identidade do sistema no lugar do título: a logomarca escolhida em Configurações > Logomarcas (`useLogomarcaLogin`, preview ou caminho) quando personalizada, ou — sem personalização — a marca padrão do sistema (ícone `Building2` + nome "Publications", idêntica ao cabeçalho do shell), sem subtítulo ou texto auxiliar abaixo da identidade. O `AuthBackground` SHALL usar a paleta do design system (azuis `#112051`/`#0364f7`/`#50a1ff` e verde `#4ed813`/`#1a9e07`), substituindo a paleta teal/ciano original.

#### Scenario: Header reflete o usuário logado

- **WHEN** usuário diferente de Ana Carolina (ex. `rafael.souza@empresa.com.br`, Editor) está logado e abre qualquer página administrativa
- **THEN** o bloco Account exibe "Rafael Souza" e o perfil Editor, com as iniciais "RS"

#### Scenario: Logomarca da tela acompanha as configurações

- **WHEN** uma logomarca foi configurada em Configurações > Logomarcas e o visitante abre `/admin/login`
- **THEN** o cabeçalho do card exibe aquela logomarca; sem personalização, exibe a marca padrão do sistema (ícone `Building2` + nome "Publications"), sem subtítulo abaixo

#### Scenario: Cabeçalho idêntico na tela de recuperação

- **WHEN** o visitante abre `/admin/esqueci-senha`
- **THEN** o card exibe a mesma identidade, sem subtítulo, do card de login

#### Scenario: Cabeçalho idêntico no primeiro acesso

- **WHEN** o usuário com senha provisória abre `/admin/primeiro-acesso`
- **THEN** o card exibe a mesma identidade, sem subtítulo, do card de login
