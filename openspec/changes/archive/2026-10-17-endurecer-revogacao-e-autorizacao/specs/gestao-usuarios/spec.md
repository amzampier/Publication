# Spec Delta

## MODIFIED Requirements

### Requirement: Perfis customizados são atribuíveis e importáveis na Gestão de Usuários
O sistema SHALL derivar as opções de **Perfil** do modal de usuário (criação e edição), as opções
do filtro de Perfil e a validação de Perfil da planilha de importação do cadastro de perfis de
acesso (`perfis_acesso`), e não de uma lista fixa: perfis customizados **Ativos** SHALL poder ser
selecionados como perfil de um usuário no modal, oferecidos no filtro e aceitos como valor de Perfil
nas linhas da planilha de importação. Somente perfis **Ativos** SHALL ser oferecidos ou aceitos —
perfis Inativos ou Bloqueados não SHALL aparecer como opção (no modal ou no filtro) nem constar da
lista de perfis válidos da importação, de modo que a UI não ofereça um caminho que o servidor
rejeitaria. Perfis sem badge mapeado SHALL exibir um badge genérico do design system, sem quebrar a
renderização.

#### Scenario: Perfil customizado é oferecido no modal de usuário
- **WHEN** existe um perfil customizado Ativo em Perfis de Acesso e o usuário abre o modal de usuário (novo ou edição)
- **THEN** o select de Perfil lista esse perfil customizado entre as opções, permitindo atribuí-lo ao usuário

#### Scenario: Perfil customizado é aceito na importação de planilha
- **WHEN** a planilha traz uma linha com um Perfil customizado Ativo cadastrado no sistema
- **THEN** a linha não é marcada como "Linha inválida" por esse motivo e permanece válida para importação

#### Scenario: Perfil Inativo não é oferecido nem aceito
- **WHEN** existe um perfil Inativo (ou Bloqueado) e um usuário abre o modal de usuário, o filtro de Perfil ou carrega uma planilha que o utilize
- **THEN** o perfil inativo não aparece como opção no modal nem no filtro, e a linha da planilha que o utiliza é classificada como "Linha inválida"