# Spec Delta

## ADDED Requirements

### Requirement: A ação de permissões abre o modal de configuração
O sistema SHALL abrir o modal de permissões (`UiModal`) ao acionar a ação de linha
**Permissões** (ícone `KeyRound`, com tooltip e `aria-label` próprios), exibindo a matriz do
perfil daquela linha, **sem** nenhum toast de "próxima etapa" — o modal de cadastro/edição
continua abrindo pelo cabeçalho e pela ação Editar, e o de exclusão pela ação Excluir,
conforme seus próprios requisitos.

#### Scenario: Permissões abre o modal
- **WHEN** o usuário aciona na linha o controle Permissões (`KeyRound`)
- **THEN** o modal de permissões abre com a matriz daquele perfil e nenhum toast de
  "próxima etapa" é exibido

### Requirement: O modal de permissões configura a matriz do perfil
O sistema SHALL abrir um modal de permissões (`UiModal` de largura `xl`) pelo controle
Permissões de qualquer linha, exibindo a matriz do perfil — **11 módulos no total,
organizados em abas pelas 4 sessões da sidebar**, cada linha com nome e descrição do
módulo —, com as **4 ações fixas** (`visualizar`, `criar`, `alterar`, `excluir`) em um
interruptor por célula e as **5 ações extras** (`publicar`, `arquivar`, `download`,
`exportar`, `importar`) de cada módulo em **chips clicáveis** na coluna
**Funcionalidades** (`UiCheckChip`, editáveis como as fixas) — **sem atalhos de seleção em
lote** —, acompanhadas de um contador "n/99" global, atualizado a cada alteração do
rascunho em qualquer aba.

Alterações valem apenas no rascunho até **Salvar**, que SHALL gravar a matriz no perfil
**em memória** (clone, sem nenhuma requisição HTTP) — a coluna Permissões da linha e os KPIs
recalculam e um toast de sucesso é exibido —; **"Cancelar"**, `Escape` ou o `X` do cabeçalho
SHALL descartar o rascunho sem alterar a base, e a recarga SHALL restaurar a matriz semeada.
A matriz do perfil **Administrador é editável como as demais**, e um perfil novo (matriz
vazia, `0/99`) SHALL poder ser configurado no mesmo modal.

#### Scenario: Abertura pela ação Permissões
- **WHEN** o usuário aciona "Configurar permissões" na linha de um perfil
- **THEN** o modal "Permissões" abre exibindo o nome do perfil, as abas das 4 sessões da
  sidebar com os módulos da primeira sessão (nome + descrição em cada linha), os
  interruptores das 4 ações fixas, os chips de Funcionalidades e o contador "n/99" global

#### Scenario: Abas particionam os módulos por sessão
- **WHEN** o usuário troca de aba (ex.: "Movimentos")
- **THEN** a tabela passa a exibir somente os módulos daquela sessão (com os mesmos
  interruptores e chips), enquanto o contador "n/99" segue refletindo a matriz completa do
  perfil

#### Scenario: Interruptor de célula altera só o rascunho
- **WHEN** o usuário liga ou desliga um interruptor de uma das 4 ações fixas de um módulo
- **THEN** o contador "n/99" do modal é atualizado imediatamente e a base permanece
  intacta (a linha da tabela e os KPIs só mudam após Salvar)

#### Scenario: Chips de Funcionalidades editam as ações extras
- **WHEN** o usuário clica num chip da coluna Funcionalidades de um módulo
- **THEN** o estado do chip (marcado/desmarcado) e o contador "n/99" acompanham o
  rascunho e a base permanece intacta até Salvar — os chips refletem as ações extras
  (`permissoes_extras`) daquele módulo

#### Scenario: Salvar grava em memória e recalcula
- **WHEN** com alterações no rascunho o usuário clica em "Salvar"
- **THEN** a matriz salva é refletida na coluna Permissões da linha e nos KPIs (ex.:
  Editor `45/99` muda conforme as células alteradas), um toast de sucesso é exibido e o
  modal fecha, sem nenhuma requisição HTTP

#### Scenario: Cancelar, Escape ou X descartam o rascunho
- **WHEN** o usuário altera células e aciona "Cancelar", pressiona `Escape` ou clica no `X`
  do cabeçalho
- **THEN** o modal fecha e a matriz, a coluna Permissões e os KPIs permanecem idênticos ao
  estado anterior

#### Scenario: Recarga restaura a matriz semeada
- **WHEN** a página é recarregada após salvar alterações de permissões
- **THEN** a matriz volta à semente original (99/99, 45/99, 21/99, 6/99), sem persistência

#### Scenario: Administrador editável e perfil novo configurável
- **WHEN** o usuário abre o modal do Administrador ou de um perfil recém-criado (0/99)
- **THEN** a matriz é editável como a de qualquer outro perfil, sem trava por papel

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
- **WHEN** o conjunto vigente de perfis muda (criação, edição, exclusão, mudança de situação
  ou edição da matriz de permissões)
- **THEN** os cinco KPIs são recalculados a partir do conjunto vigente

### Requirement: As contagens de permissões e de usuários são derivadas, nunca digitadas
O sistema SHALL derivar a coluna **Permissões** de uma matriz de permissões semeada em memória
(4 perfis × 11 módulos × 9 ações — as 4 ações fixas `visualizar`, `criar`, `alterar`, `excluir`
mais os 5 `permissoes_extras` `publicar`, `arquivar`, `download`, `exportar`, `importar`
descritos no `docs/02` §3.5), exibindo `99/99` para Administrador, `45/99` para Editor,
`21/99` para Revisor e `6/99` para Leitor; e SHALL derivar a coluna **Usuários** da base de
usuários vigente (`useUsuariosDemo`), exibindo 2, 5, 4 e 5 respectivamente. Nenhuma das duas
contagens pode ser um valor digitado ou fixado no template.

#### Scenario: Contagens derivadas da matriz e da base de usuários
- **WHEN** a tabela é renderizada com a base de demonstração
- **THEN** a coluna Permissões exibe 99/99, 45/99, 21/99 e 6/99 e a coluna Usuários exibe
  2, 5, 4 e 5 para Administrador, Editor, Revisor e Leitor

#### Scenario: Acompanha a base de usuários
- **WHEN** a base de usuários muda por navegação interna (ex.: usuário excluído em
  `/admin/gestao-usuarios`)
- **THEN** a contagem da coluna Usuários e os KPIs derivados passam a refletir a base atual,
  sem recarregar a página

#### Scenario: Salvar a matriz recalcula a coluna Permissões
- **WHEN** o usuário salva alterações na matriz de permissões de um perfil
- **THEN** a coluna Permissões daquela linha exibe a nova soma sobre 99 derivada da matriz
  gravada, sem valor digitado

## REMOVED Requirements

### Requirement: A ação de permissões avisa por toast e não abre modal
**Reason**: O passo 2 chegou: "Configurar permissões" (`KeyRound`) passa a abrir o modal de
permissões com a matriz editável — o contrato de transição ("nenhum `UiModal`", toast de
"próxima etapa") ficou obsoleto para esse controle.
**Migration**: Coberto pelos requisitos "A ação de permissões abre o modal de configuração"
e "O modal de permissões configura a matriz do perfil"; os modais de cadastro/edição e de
exclusão permanecem cobertos pelos seus próprios requisitos.
