# Perfis de Acesso (RBAC) Specification

## Purpose

Definir o comportamento da página principal de Perfis de Acesso (RBAC) — listagem em memória
(fase 1) com KPIs de 3 estados, tabela com a contagem de permissões e de usuários vinculados,
modal de cadastro/edição (id UUID, situação de 3 estados), modal de exclusão com guarda de
vínculo e apenas a ação Permissões ainda sinalizada como pendente —, declarando o `docs/07`
como fonte normativa
da matriz de permissões, para que a Área Administrativa visualize e administre os perfis de
acesso conforme o modelo `perfis`/`perfil_permissoes` descrito no `docs/02` §3.5.

## Requirements

### Requirement: A página é servida em /admin/perfis-acesso com a identidade do módulo
O sistema SHALL servir a Perfis de Acesso (RBAC) em `/admin/perfis-acesso`, renderizada com o
shell da Área Administrativa (header + sidebar), exibindo o título "Perfis de Acesso (RBAC)" com
a identidade do módulo (tile do ícone `ShieldCheck` na cor `#f5b302`) e um subtítulo que descreve
a finalidade da tela (administração dos perfis e suas permissões).

#### Scenario: Renderização com o shell
- **WHEN** o navegador abre `/admin/perfis-acesso`
- **THEN** a página renderiza dentro do shell da Área Administrativa (header com as zonas
  canônicas e sidebar com a sessão Administração), com título "Perfis de Acesso (RBAC)" e tile
  `ShieldCheck` `#f5b302`

#### Scenario: Página fora do shell não se aplica
- **WHEN** qualquer rota sob `/admin/**` é renderizada
- **THEN** nenhuma marcação própria de shell é necessária — a página usa apenas o layout
  declarado (`admin`), como as demais telas administrativas

### Requirement: Os itens de navegação de perfis ganham rota e rótulo unificado
O sistema SHALL declarar a rota `/admin/perfis-acesso` no item "Perfis de Acesso (RBAC)" da
sidebar e no item homônimo do menu da conta (rótulo do conta unificado: era "Configuração de
Perfis (RBAC)"), de modo que ambos naveguem para a página, o menu da conta feche após a
navegação e o item da sidebar correspondente apareça como ativo na rota.

#### Scenario: Navegação pela sidebar
- **WHEN** o usuário clica em "Perfis de Acesso (RBAC)" na sessão Administração da sidebar
- **THEN** o navegador vai para `/admin/perfis-acesso` e aquele item aparece como ativo
  (`aria-current="page"`)

#### Scenario: Navegação pelo menu da conta
- **WHEN** o usuário abre o menu da conta e clica em "Perfis de Acesso (RBAC)"
- **THEN** o navegador vai para `/admin/perfis-acesso` e o menu é fechado, exibindo o mesmo
  rótulo do item homônimo da sidebar

#### Scenario: URL direta marca o item
- **WHEN** o usuário abre `/admin/perfis-acesso` diretamente pelo endereço
- **THEN** o item "Perfis de Acesso (RBAC)" da sidebar aparece como ativo

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

### Requirement: O modal de permissões copia a matriz entre perfis
O sistema SHALL oferecer no rodapé do modal de permissões, **alinhadas ao lado esquerdo**
(grupo próprio à esquerda; `Cancelar` e `Salvar` permanecem à direita), duas ações de cópia
identificadas por ícone com tooltip e `aria-label` próprios:

- **Copiar de outro perfil** (`ClipboardPaste`): abre um modal filho com a lista de perfis da
  base (exceto o perfil corrente) e SHALL **substituir o rascunho** pela matriz escolhida
  (clone integral, sem mescla com o que havia no rascunho, sem alterar a base) — o contador
  "n/99" acompanha e a cópia **só vale após Salvar**, nos mesmos moldes das edições de célula.
- **Copiar para outro perfil** (`ClipboardCopy`): abre o mesmo modal filho e SHALL gravar
  **imediatamente** no perfil escolhido a **matriz salva** do perfil corrente (nunca o
  rascunho, mesmo com alterações não salvas), com toast de sucesso — a linha do perfil alvo
  e os KPIs recalculam na hora, e o descarte do modal corrente (Cancelar/Escape/X) **não
  desfaz** a cópia já feita no alvo.

O modal filho SHALL listar cada perfil candidato como escolha única com nome, descrição e
sua contagem `n/99`; o perfil corrente SHALL estar sempre ausente da lista, e, sem
candidatos (base com um único perfil), o modal filho SHALL exibir estado vazio com a ação
de descarte. Ao fechar o modal filho, o foco SHALL voltar ao botão de ícone que o abriu, com
o modal de permissões subjacente intacto (pilha de modais). Nenhuma das duas cópias SHALL
fazer requisição HTTP, e ambas SHALL ser descartadas na recarga junto da base em memória.

#### Scenario: Rodapé com as ações de cópia à esquerda
- **WHEN** o modal de permissões é aberto
- **THEN** o rodapé exibe os ícones `ClipboardPaste` e `ClipboardCopy` (com tooltip e
  `aria-label` próprios) agrupados à esquerda, e `Cancelar` e `Salvar` seguem à direita

#### Scenario: Importar substitui só o rascunho
- **WHEN** com o modal do Editor aberto (matriz salva 45/99) o usuário escolhe "copiar de"
  outro perfil cuja matriz tem 6/99 e confirma
- **THEN** o rascunho passa a 6/99 (substituído por inteiro), a coluna Permissões e os KPIs
  permanecem intactos até **Salvar**; ao salvar, a linha do Editor exibe `6/99` e o KPI de
  Permissões concedidas recalcula para `132/396`, com toast de sucesso

#### Scenario: Descartar após importar preserva a base
- **WHEN** o usuário importa a matriz de outro perfil e, sem salvar, aciona "Cancelar",
  `Escape` ou o `X` do cabeçalho
- **THEN** o modal fecha e matriz, coluna Permissões e KPIs permanecem idênticos ao estado
  anterior à importação

#### Scenario: Exportar grava imediatamente no perfil alvo
- **WHEN** com o modal do Editor aberto (matriz salva 45/99) o usuário escolhe "copiar
  para" o Leitor e confirma
- **THEN** a matriz do Leitor passa a ser a salva do Editor, sua linha exibe `45/99` (era
  `6/99`), o KPI de Permissões concedidas recalcula para `210/396` e um toast de sucesso é
  exibido; fechar em seguida o modal corrente não desfaz a cópia no Leitor

#### Scenario: Exportar usa a matriz salva, não o rascunho
- **WHEN** o usuário altera células do rascunho sem salvar e depois exporta o perfil corrente
  para outro perfil
- **THEN** o destino recebe a matriz **salva** do perfil corrente (a anterior às alterações
  descartáveis), não o conteúdo editado do rascunho

#### Scenario: O seletor exclui o perfil corrente
- **WHEN** qualquer uma das duas ações de cópia abre o modal filho
- **THEN** a lista apresenta somente os demais perfis da base como escolhas únicas com nome,
  descrição e contagem `n/99`; o perfil corrente nunca aparece e, sem candidatos, um estado
  vazio é exibido com a ação de descarte

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

### Requirement: A base de perfis vive em memória e se restaura na recarga
O sistema SHALL manter os perfis e suas permissões inteiramente em memória (`useState`),
restaurando os 4 perfis de demonstração com a matriz semeada a cada recarga da página, sem
nenhuma requisição de dados (API).

#### Scenario: Recarga restaura a base
- **WHEN** a página é recarregada
- **THEN** os 4 perfis de demonstração e as contagens 99/99, 45/99, 21/99 e 6/99 voltam a ser
  exibidos, sem nenhuma chamada de dados (API)

### Requirement: O docs/07 é a fonte normativa da matriz de permissões
O sistema SHALL manter o documento `docs/07 - Perfis de Acesso (RBAC).md` documentando a
página (rota, componentes e comportamento) e a **matriz de permissões normativa** — 4 perfis ×
11 módulos da sidebar × 9 ações — com exatamente as mesmas contagens exibidas na tela, e
declarando-se a fonte que o modal de permissões da fase 2 SHALL implementar.

#### Scenario: Consistência documento ↔ tela
- **WHEN** o `docs/07` e a página são comparados
- **THEN** as regras por perfil do documento produzem as mesmas contagens da tabela
  (99/99, 45/99, 21/99, 6/99) e do KPI de Permissões concedidas (171/396)

#### Scenario: Escopo do modal futuro declarado
- **WHEN** o `docs/07` é lido
- **THEN** ele identifica a matriz como fonte normativa para o modal de permissões por perfil
  da fase 2 e documenta os gatilhos da fase 1 como pendência de modal
