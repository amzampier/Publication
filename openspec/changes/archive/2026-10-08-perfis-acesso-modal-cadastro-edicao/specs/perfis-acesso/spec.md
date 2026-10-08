# Spec Delta

## ADDED Requirements

### Requirement: A ação de permissões avisa por toast e não abre modal
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando
o usuário aciona a ação de linha **Permissões** (ícone `KeyRound`), permanecendo **nenhum
`UiModal` aberto** por esse controle — o modal de permissões por perfil pertence ao passo 2.
O modal de cadastro/edição abre pelo cabeçalho e pela ação Editar, e o modal de confirmação
de exclusão abre pela ação Excluir, conforme seus próprios requisitos.

#### Scenario: Permissões ainda em transição
- **WHEN** o usuário aciona na linha o controle Permissões (`KeyRound`), com tooltip e
  `aria-label` próprios
- **THEN** um toast informativo de "próxima etapa" é exibido e nenhum modal é aberto

#### Scenario: Novo e Editar deixaram de avisar por toast
- **WHEN** o usuário aciona "Novo Perfil" ou "Editar" numa linha
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de cadastro/edição é aberto

### Requirement: O modal de cadastro/edição cria e altera perfis
O sistema SHALL abrir um modal de cadastro/edição (`UiModal`, molde do modal de usuários) ao
acionar "Novo Perfil" do cabeçalho ou "Editar" (`Pencil`) de uma linha, contendo a seção
"Dados do Perfil" com os campos **Nome** (`nome_perfil`), **Situação** (`situacao`,
`UiSegmented` com as opções `Ativo`, `Inativo` e `Bloqueado`) e **Descrição** (`descricao`,
área de texto `UiTextarea`). O identificador do perfil SHALL ser um UUID gerado no salvamento da criação
(não há campo de código — a tabela alvo usa `id UUID`, `docs/02` §3.5).

Na edição, o modal SHALL exibir ainda a seção "Informações de Cadastro" com **Data
Cadastro** e **Data Alteração** desabilitados (fundo `slate-200`, somente leitura), no
formato `dd/mm/yyyy` (**sem horário**); esta seção SHALL estar ausente na criação. O
preenchimento inválido (nome vazio) SHALL impedir a
gravação, exibindo a mensagem no campo e devolvendo o foco ao primeiro campo com erro.

Ao salvar na criação, o sistema SHALL acrescentar o perfil ao conjunto vigente **em memória**
com matriz de permissões vazia (`0/99`) e zero usuários vinculados — a linha aparece, os KPIs
recalculam e um toast de sucesso é exibido. Ao salvar na edição, SHALL atualizar os campos
editáveis mantendo `criado_em` preservado e fazendo `atualizado_em` refletir a edição, com
toast de sucesso. "Cancelar", `Escape` ou o `X` do cabeçalho SHALL fechar o modal sem alterar
a base. Toda gravação SHALL ocorrer sem nenhuma requisição HTTP e SHALL ser descartada na
recarga da página junto com as demais alterações da fase em memória.

#### Scenario: Abertura em modo novo
- **WHEN** o usuário clica em "Novo Perfil"
- **THEN** o modal "Novo Perfil" abre com a seção "Dados do Perfil" (Nome vazio, Situação com
  `Ativo` pré-selecionado, Descrição), sem a seção "Informações de Cadastro", e com
  "Cancelar" (outline) e "Salvar" (primary) no rodapé

#### Scenario: Abertura em modo edição
- **WHEN** o usuário aciona "Editar" na linha de um perfil
- **THEN** o modal "Editar Perfil" abre pré-preenchido com os dados do perfil e a seção
  "Informações de Cadastro" visível com Data Cadastro e Data Alteração desabilitados

#### Scenario: Nome obrigatório
- **WHEN** o usuário salva sem informar o nome do perfil
- **THEN** nada é acrescentado à base, a mensagem de erro aparece no campo Nome e o modal
  permanece aberto

#### Scenario: Salvar cria o perfil em memória
- **WHEN** o usuário preenche os dados válidos e clica em "Salvar" na criação
- **THEN** o perfil é acrescentado ao conjunto vigente com id UUID gerado no salvamento,
  matriz vazia (0/99) e 0 usuários, a linha aparece na tabela, os KPIs recalculam (Permissões
  concedidas passa de 171/396 para 171/495), um toast de sucesso é exibido e o modal fecha

#### Scenario: Salvar edição preserva criado_em e atualiza atualizado_em
- **WHEN** o usuário altera nome, descrição ou situação e clica em "Salvar" na edição
- **THEN** os campos refletem a alteração, Data Cadastro mantém o valor original, Data
  Alteração passa a refletir a edição, um toast de sucesso é exibido, o modal fecha e os KPIs
  recalculam quando a situação muda

#### Scenario: Situação de três estados
- **WHEN** o usuário seleciona `Bloqueado` na Situação e salva
- **THEN** a linha exibe o badge `Bloqueado` (variante `blocked`) e os KPIs "Ativos",
  "Inativos" e "Bloqueados" recalculam a partir do conjunto vigente

#### Scenario: Descarte preserva a base
- **WHEN** o usuário aciona "Cancelar", `Escape` ou o `X` do cabeçalho com o modal aberto
- **THEN** o modal fecha sem alterar o conjunto de perfis

#### Scenario: Gravação é em memória e a recarga restaura
- **WHEN** um perfil é criado ou editado e depois a página é recarregada
- **THEN** a base volta aos 4 perfis de demonstração com a matriz semeada, sem nenhuma
  requisição de dados (API)

## MODIFIED Requirements

### Requirement: Os KPIs refletem o conjunto vigente de perfis
O sistema SHALL exibir no topo da página os KPIs "Total de perfis" (contagem do conjunto
vigente), "Ativos", "Inativos", "Bloqueados" e "Permissões concedidas"
(`<soma das permissões verdadeiras>/<perfis × 99>`), recalculados sempre que o conjunto de
perfis muda.

#### Scenario: Base de demonstração
- **WHEN** a página é aberta com a base de demonstração (4 perfis, todos Ativos, matriz semeada)
- **THEN** os KPIs exibem Total de perfis 4, Ativos 4, Inativos 0, Bloqueados 0 e Permissões
  concedidas 171/396

#### Scenario: Recalculo após mudança do conjunto
- **WHEN** o conjunto vigente de perfis muda (criação, edição, exclusão ou mudança de situação)
- **THEN** os cinco KPIs são recalculados a partir do conjunto vigente

### Requirement: A listagem exibe perfis em UiDataTable com seis colunas
O sistema SHALL exibir os perfis em `UiDataTable` com colunas **Nome**, **Descrição**,
**Usuários** (contagem), **Permissões** (`n/99`), **Status** (badge) e **Ações**, com paginação,
ordenação e busca textual do componente, badge de Status distinguível entre "Ativo", "Inativo"
e "Bloqueado" — cabendo as seis colunas (cinco de dados + Ações) **sem rolagem horizontal** na
área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida),
inclusive após trocar a quantidade de registros exibidos por página.

#### Scenario: Colunas e badges
- **WHEN** a tabela é renderizada com a base de demonstração
- **THEN** as seis colunas aparecem na ordem Nome, Descrição, Usuários, Permissões, Status,
  Ações, com badge de Status distinguível entre Ativo, Inativo e Bloqueado

#### Scenario: Sem rolagem horizontal
- **WHEN** a janela está em ~1280px ou mais com a sidebar expandida, inclusive após mudar a
  página da tabela
- **THEN** a área da tabela não apresenta rolagem horizontal

#### Scenario: Busca textual
- **WHEN** o usuário digita no campo de busca da tabela
- **THEN** apenas os perfis correspondentes são exibidos na tabela, sem alterar o conjunto
  vigente nem os KPIs (a busca é visual, recurso do componente)

## REMOVED Requirements

### Requirement: As ações da fase 1 avisam por toast e não abrem modal
**Reason**: "Novo Perfil" e "Editar" passaram a abrir o modal de cadastro/edição (requisito
"O modal de cadastro/edição cria e altera perfis"); apenas a ação Permissões permanece em
transição por toast.
**Migration**: O aviso de "próxima etapa" passa a valer somente para a ação de linha
**Permissões** (`KeyRound`), coberta pelo requisito "A ação de permissões avisa por toast e
não abre modal"; o modal de exclusão permanece coberto pelo seu próprio requisito.
