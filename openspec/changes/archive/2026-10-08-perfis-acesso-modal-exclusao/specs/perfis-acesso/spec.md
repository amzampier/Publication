# Spec Delta

## MODIFIED Requirements

### Requirement: As ações da fase 1 avisam por toast e não abrem modal
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando
o usuário aciona o botão "Novo Perfil" do cabeçalho ou as ações de linha **Editar** e
**Permissões** (ícone `KeyRound`), permanecendo **nenhum `UiModal` aberto** por esses
controles — os modais de cadastro/edição, de filtros e de permissões pertencem à fase 2.
A ação de linha **Excluir** (`Trash2`) deixa de exibir o toast de transição e abre o modal de
confirmação de exclusão, conforme o requisito "O modal de exclusão confirma a remoção de um
perfil".

#### Scenario: Novo Perfil
- **WHEN** o usuário clica em "Novo Perfil"
- **THEN** um toast informativo de "próxima etapa" é exibido e nenhum modal é aberto

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um perfil os controles de Editar (`Pencil`) ou
  Permissões (`KeyRound`), cada um com tooltip e `aria-label` próprios
- **THEN** um toast informativo de "próxima etapa" é exibido e nenhum modal é aberto

#### Scenario: Excluir deixou de avisar por toast
- **WHEN** o usuário aciona na linha o controle Excluir (`Trash2`)
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de confirmação de exclusão
  é aberto

## ADDED Requirements

### Requirement: O modal de exclusão confirma a remoção de um perfil
O sistema SHALL abrir um modal de confirmação (`UiModal` de largura `sm`) ao acionar o
"Excluir perfil" (`Trash2`) de qualquer linha, com título "Excluir Perfil", identificação do
alvo (nome e contagem de usuários vinculados) e o aviso de que a ação não pode ser desfeita,
no rodapé as ações "Cancelar" (secundária, `UiButton outline`) e "Excluir" (destrutiva,
`UiButton danger`), habilitada desde a abertura.

Ao confirmar com **um ou mais usuários vinculados**, o sistema SHALL fechar o modal sem
alterar a base e exibir toast de bloqueio informando que o perfil possui usuários vinculados
e não pode ser excluído. Ao confirmar **sem usuários vinculados**, o sistema SHALL remover o
perfil do conjunto vigente **em memória** — a linha sai da tabela, os KPIs recalculam e um
toast de sucesso é exibido — e devolver o foco ao campo de busca da tabela, pois o botão que
abriu o modal deixa de existir com a linha. "Cancelar", `Escape` ou o `X` do cabeçalho SHALL
fechar o modal sem alterar a base. A exclusão SHALL ser irrestrita por papel (qualquer
perfil, inclusive Administrador), SHALL ocorrer sem nenhuma requisição HTTP e SHALL ser
descartada na recarga da página junto com as demais alterações da fase em memória.

#### Scenario: Abertura do modal
- **WHEN** o usuário aciona "Excluir perfil" numa linha, havendo ou não usuários vinculados
- **THEN** o modal `sm` "Excluir Perfil" abre exibindo nome, contagem de usuários vinculados e
  o aviso de irreversibilidade, com "Cancelar" (outline) e "Excluir" (danger) habilitado no
  rodapé

#### Scenario: Confirmação bloqueada por vínculo
- **WHEN** o usuário clica em "Excluir" no modal de um perfil com um ou mais usuários
  vinculados
- **THEN** o modal fecha, um toast de bloqueio informa que o perfil não pode ser excluído por
  ter usuários vinculados e a base permanece intacta (o perfil não é removido)

#### Scenario: Confirmação remove em memória
- **WHEN** o usuário clica em "Excluir" no modal de um perfil sem usuários vinculados
- **THEN** o perfil sai da tabela, os KPIs recalculam, um toast de sucesso é exibido, o modal
  fecha e o foco vai ao campo de busca da tabela

#### Scenario: Descarte preserva a base
- **WHEN** o usuário aciona "Cancelar", `Escape` ou o `X` do cabeçalho com o modal aberto
- **THEN** o modal fecha sem alterar o conjunto de perfis

#### Scenario: Excluir a última linha da última página mantém a tabela válida
- **WHEN** o perfil confirmado para exclusão era a única linha da última página exibida
- **THEN** a tabela ajusta a página corrente para uma página válida, sem estado vazio
  indevido, com os KPIs recalculados

#### Scenario: Exclusão irrestrita por papel
- **WHEN** um perfil sem usuários vinculados é confirmado para exclusão, inclusive o
  Administrador
- **THEN** ele é removido do conjunto vigente, sem bloqueio por papel

#### Scenario: Recarga restaura a base
- **WHEN** a página é recarregada após uma exclusão
- **THEN** os 4 perfis de demonstração com a matriz semeada voltam, sem nenhuma chamada de
  dados (API)
