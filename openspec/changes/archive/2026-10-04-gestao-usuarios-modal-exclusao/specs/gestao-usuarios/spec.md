# Spec Delta

## MODIFIED Requirements

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando o usuário aciona os controles ainda sem modal — o "Importar" da toolbar (ícone à esquerda do "Filtros", com tooltip "Importar Novos Usuários"), o botão "Filtros" e as ações de linha de enviar o convite e bloquear —, permanecendo nenhum `UiModal` aberto por esses controles; o botão "Novo Usuário" e a ação de editar da linha deixam de exibir toast e abrem o modal de usuário, e a ação de excluir da linha deixa de exibir toast e abre o modal de confirmação de exclusão.

#### Scenario: Novo Usuário
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de usuário abre em modo de criação

#### Scenario: Importar na toolbar
- **WHEN** o usuário passa o mouse sobre o ícone de importar à esquerda do botão "Filtros"
- **THEN** um tooltip exibe "Importar Novos Usuários" e, ao clicar, um toast informa que a funcionalidade estará disponível na próxima etapa sem abrir modal

#### Scenario: Filtros na toolbar
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um usuário os controles de enviar o convite (ícone de e-mail confirmado) ou bloquear (cadeado) (ícones reduzidos com cores semânticas, cada um com tooltip e `aria-label` próprios)
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Excluir deixou de avisar por toast
- **WHEN** o usuário clica no ícone de excluir (`Trash2`) de uma linha
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de confirmação de exclusão abre

## ADDED Requirements

### Requirement: O modal de exclusão confirma a remoção de um usuário
O sistema SHALL abrir um modal de confirmação (`UiModal` de largura `sm`) ao acionar o "Excluir usuário" da linha, exibindo o título "Excluir Usuário", a identificação do alvo (nome e e-mail) e o aviso de que a exclusão não pode ser desfeita, com as ações "Cancelar" (secundária, `UiButton outline`) e "Excluir" (destrutiva, `UiButton danger`) no rodapé. Ao confirmar, o sistema SHALL remover o registro do conjunto vigente **em memória** — a linha sai da tabela, os KPIs recalculam e um toast de sucesso é exibido — e devolver o foco ao campo de busca da tabela, pois o botão que abriu o modal deixa de existir com a linha. "Cancelar", `Escape` ou o `X` do cabeçalho SHALL fechar o modal sem alterar a base. A exclusão SHALL ser irrestrita (qualquer perfil, sem bloqueio por papel), SHALL ocorrer sem nenhuma requisição HTTP e SHALL ser descartada na recarga da página junto com as demais alterações da fase em memória.

#### Scenario: Abertura pelo ícone da linha
- **WHEN** o usuário clica no `Trash2` de uma linha
- **THEN** o modal de exclusão abre exibindo nome e e-mail daquele usuário e nenhuma toast de "próxima etapa" é exibido

#### Scenario: Confirmação remove e recalcula
- **WHEN** com o modal aberto o usuário aciona "Excluir"
- **THEN** o modal fecha, o registro sai da tabela, os quatro KPIs refletem o conjunto sem ele e um toast de sucesso confirma a exclusão

#### Scenario: Excluir a última linha da última página mantém a tabela válida
- **WHEN** o usuário confirma a exclusão do único registro exibido na última página da tabela
- **THEN** a tabela exibe uma página válida com as linhas restantes, sem erro e sem página vazia indevida

#### Scenario: Descarte preserva a base
- **WHEN** com o modal aberto o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha, o registro permanece na tabela e nenhum toast é exibido

#### Scenario: Foco vai à busca da tabela
- **WHEN** a exclusão é confirmada e o modal fecha
- **THEN** o foco do teclado está no campo de busca da tabela, não no `body`

#### Scenario: Exclusão é irrestrita
- **WHEN** o usuário confirma a exclusão de um registro de qualquer perfil (inclusive Administrador)
- **THEN** o registro é removido normalmente, sem bloqueio nem aviso de restrição

#### Scenario: Recarga restaura a base
- **WHEN** a página é recarregada após uma exclusão
- **THEN** a base de demonstração original volta a ser exibida, com o usuário excluído presente
