# Spec Delta

## MODIFIED Requirements

### Requirement: O shell administrativo é restrito às rotas da Área Administrativa
O sistema SHALL exibir o shell administrativo (Header + Sidebar) apenas nas rotas sob `/admin/**` e
SHALL renderizar a raiz (`/`) como Área Pública com o shell público definido em
`design-system/public-layout`, sem qualquer elemento do shell administrativo.

#### Scenario: Raiz renderiza sem o shell
- **WHEN** o visitante abre `/`
- **THEN** a página não exibe o botão de alternância, o logo `Publications`, a central de
  notificações, o bloco Account nem a sidebar/rail administrativos, e exibe o header e a sidebar
  públicos

#### Scenario: Rota administrativa renderiza com o shell
- **WHEN** o visitante abre `/admin`
- **THEN** a página exibe o shell completo (header com as zonas canônicas e a sidebar com o item
  raiz e as sessões)

#### Scenario: A vitrine de design continua fora do shell
- **WHEN** o visitante abre `/design`
- **THEN** a página renderiza sem o shell das áreas (mantém seu layout próprio), como já faz hoje

### Requirement: A Área Pública renderiza sem chrome administrativo
O sistema SHALL renderizar a Área Pública com o shell público próprio definido em
`design-system/public-layout` e SHALL NOT exibir chrome administrativo (header administrativo,
sidebar/rail administrativos, toggle, sino ou avatar).

#### Scenario: Conteúdo público sem controles administrativos
- **WHEN** a raiz é renderizada
- **THEN** o fundo é o App Canvas, o header e a sidebar públicos são exibidos, e não há controles
  administrativos (toggle, sino, avatar) nem navegação lateral administrativa

#### Scenario: O shell aparece somente após navegar para /admin
- **WHEN** o usuário navega de `/` para `/admin` na mesma sessão
- **THEN** o shell administrativo passa a ser exibido a partir de `/admin` e a raiz permanece com o
  shell público ao voltar

#### Scenario: O shell público não aparece na Área Administrativa
- **WHEN** o visitante abre `/admin`
- **THEN** o header e a sidebar públicos não são exibidos
