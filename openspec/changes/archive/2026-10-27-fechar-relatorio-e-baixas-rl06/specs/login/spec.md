# Spec Delta

## MODIFIED Requirements

### Requirement: O bloco Account exibe o usuário autenticado e a identidade das telas de autenticação

O bloco Account do header SHALL exibir nome, perfil e iniciais do usuário logado (derivados da sessão), e não mais valores fixos. O cabeçalho do card de qualquer tela de autenticação (`/admin/login`, `/admin/esqueci-senha`, `/admin/primeiro-acesso`) SHALL exibir a identidade do sistema no lugar do título: a logomarca escolhida em Configurações > Logomarcas (`useLogomarcaLogin`, preview ou caminho) quando personalizada, ou — sem personalização — a marca padrão do sistema (ícone `Building2` + nome "Publications", idêntica ao cabeçalho do shell), com o subtítulo "Área Administrativa" abaixo em ambos os casos. O `AuthBackground` SHALL usar a paleta do design system (azuis `#112051`/`#0364f7`/`#50a1ff` e verde `#4ed813`/`#1a9e07`), substituindo a paleta teal/ciano original.

#### Scenario: Header reflete o usuário logado

- **WHEN** usuário diferente de Ana Carolina (ex. `rafael.souza@empresa.com.br`, Editor) está logado e abre qualquer página administrativa
- **THEN** o bloco Account exibe "Rafael Souza" e o perfil Editor, com as iniciais "RS"

#### Scenario: Logomarca da tela acompanha as configurações

- **WHEN** uma logomarca foi configurada em Configurações > Logomarcas e o visitante abre `/admin/login`
- **THEN** o cabeçalho do card exibe aquela logomarca; sem personalização, exibe a marca padrão do sistema (ícone `Building2` + nome "Publications") — sempre com o subtítulo "Área Administrativa" abaixo

#### Scenario: Cabeçalho idêntico na tela de recuperação

- **WHEN** o visitante abre `/admin/esqueci-senha`
- **THEN** o card exibe a mesma identidade e o subtítulo "Área Administrativa" do card de login

#### Scenario: Cabeçalho idêntico no primeiro acesso

- **WHEN** o usuário com senha provisória abre `/admin/primeiro-acesso`
- **THEN** o card exibe a mesma identidade e o subtítulo "Área Administrativa" do card de login
