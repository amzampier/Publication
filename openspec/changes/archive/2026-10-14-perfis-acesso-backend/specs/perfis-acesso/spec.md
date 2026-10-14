# Spec Delta

## ADDED Requirements

### Requirement: A página carrega e mantém os perfis sincronizados com a API
O sistema SHALL carregar os perfis e suas matrizes de permissões a partir de `GET /api/perfis`
na montagem da página `/admin/perfis-acesso`, exibindo estado de carregamento enquanto a
requisição estiver em voo e um toast de erro caso ela falhe (sem exibir a base de
demonstração como se fosse real). Toda mutação bem-sucedida (criação, edição, exclusão,
gravação da matriz e cópia de matriz) SHALL ser refletida imediatamente na tabela, nos KPIs e
nas contagens de permissões, e uma recarga da página SHALL rebuscar os dados pela API — o que
foi gravado persiste, sem restauração da semente de demonstração.

#### Scenario: Carga inicial mostra os dados do banco
- **WHEN** o navegador abre `/admin/perfis-acesso`
- **THEN** um estado de carregamento é exibido enquanto `GET /api/perfis` responde e, em
  seguida, a tabela exibe os perfis persistidos (a base semeada: 4 perfis, todos Ativos, com
  matriz 99/99, 45/99, 21/99 e 6/99)

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição `GET /api/perfis` falha (rede ou banco indisponível)
- **THEN** um toast de erro informa a falha de carregamento e a tabela permanece em estado
  vazio/erro, sem exibir a base de demonstração como se fosse persistida

#### Scenario: Recarga preserva as alterações gravadas
- **WHEN** a página é recarregada após criação, edição, exclusão, gravação da matriz ou cópia
  de matriz
- **THEN** os dados gravados são rebuscados pela API e aparecem na tela (a semente de
  demonstração não substitui o que foi alterado)

#### Scenario: Mutação reflete sem recarregar
- **WHEN** uma criação, edição, exclusão ou gravação de matriz retorna sucesso
- **THEN** a linha, os KPIs e as contagens da tabela são atualizados imediatamente, sem
  recarga da página

### Requirement: A API de perfis valida a entrada e responde com códigos de erro consistentes
O sistema SHALL expor a API de perfis com validação de entrada e códigos de erro
observáveis: criação com dados válidos responde `201`; nome vazio ou com mais de 100
caracteres, situação fora de `Ativo`/`Inativo`/`Bloqueado`, módulo desconhecido ou ação
desconhecida na matriz respondem `400` sem gravar nada; id de perfil inexistente em edição,
exclusão ou gravação de matriz responde `404`; e exclusão de perfil com usuários vinculados
responde `409` mantendo a base intacta (a restrição de chave estrangeira do banco é a garantia
de integridade final).

#### Scenario: Nome vazio é recusado
- **WHEN** `POST /api/perfis` (ou `PUT /api/perfis/:id`) é chamado com `nome` vazio
- **THEN** a API responde `400` com mensagem de validação e nenhum registro é gravado

#### Scenario: Situação fora do enum é recusada
- **WHEN** a API recebe uma `situacao` diferente de `Ativo`, `Inativo` ou `Bloqueado`
- **THEN** a resposta é `400` e nada é gravado

#### Scenario: Perfil inexistente responde 404
- **WHEN** `PUT`, `DELETE` ou a gravação de matriz é chamada com um id que não existe
- **THEN** a API responde `404`

#### Scenario: Matriz com módulo ou ação desconhecida é recusada
- **WHEN** a gravação da matriz contém um módulo fora dos 11 módulos do sistema ou uma ação
  fora das 9 ações (`visualizar`, `criar`, `alterar`, `excluir`, `publicar`, `arquivar`,
  `download`, `exportar`, `importar`)
- **THEN** a API responde `400` e a matriz do perfil não é alterada

#### Scenario: Exclusão com vínculos responde 409
- **WHEN** `DELETE /api/perfis/:id` é chamado para um perfil com um ou mais usuários
  vinculados
- **THEN** a API responde `409` e o perfil permanece no banco

### Requirement: O modal de cadastro/edição cria e altera perfis persistidos via API
O sistema SHALL abrir um modal de cadastro/edição (`UiModal`, molde do modal de usuários) ao
acionar "Novo Perfil" do cabeçalho ou "Editar" (`Pencil`) de uma linha, contendo a seção
"Dados do Perfil" com os campos **Nome** (`nome_perfil`), **Situação** (`situacao`,
`UiSegmented` com as opções `Ativo`, `Inativo` e `Bloqueado`) e **Descrição** (`descricao`,
área de texto `UiTextarea`). O identificador do perfil SHALL ser um UUID gerado pelo banco na
criação (a tabela alvo usa `id UUID`, `docs/02` §3.5; não há campo de código).

Na edição, o modal SHALL exibir ainda a seção "Informações de Cadastro" com **Data
Cadastro** e **Data Alteração** desabilitados (fundo `slate-200`, somente leitura), no
formato `dd/mm/yyyy` (**sem horário**); esta seção SHALL estar ausente na criação. O
preenchimento inválido (nome vazio) SHALL impedir a gravação, exibindo a mensagem no campo e
devolvendo o foco ao primeiro campo com erro — tanto na validação do cliente quanto na da API
(`400`).

Ao salvar na criação, o sistema SHALL criar o perfil pela API com matriz de permissões vazia
(`0/99`) e zero usuários vinculados — a linha aparece, os KPIs recalculam e um toast de
sucesso é exibido. Ao salvar na edição, SHALL atualizar os campos editáveis mantendo
`criado_em` preservado e fazendo `atualizado_em` refletir a edição. "Cancelar", `Escape` ou
`X` do cabeçalho SHALL fechar o modal sem nenhuma requisição. Toda gravação SHALL persistir
via API e sobreviver à recarga da página.

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
- **THEN** nada é gravado na API, a mensagem de erro aparece no campo Nome e o modal
  permanece aberto

#### Scenario: Salvar cria o perfil na API
- **WHEN** o usuário preenche os dados válidos e clica em "Salvar" na criação
- **THEN** o perfil é criado pela API com id UUID gerado no banco, matriz vazia (0/99) e 0
  usuários, a linha aparece na tabela, os KPIs recalculam (Permissões concedidas passa de
  171/396 para 171/495), um toast de sucesso é exibido e o modal fecha

#### Scenario: Salvar edição preserva criado_em e atualiza atualizado_em
- **WHEN** o usuário altera nome, descrição ou situação e clica em "Salvar" na edição
- **THEN** os campos refletem a alteração persistida na API, Data Cadastro mantém o valor
  original, Data Alteração passa a refletir a edição, um toast de sucesso é exibido, o modal
  fecha e os KPIs recalculam quando a situação muda

#### Scenario: Situação de três estados
- **WHEN** o usuário seleciona `Bloqueado` na Situação e salva
- **THEN** a linha exibe o badge `Bloqueado` (variante `blocked`) e os KPIs "Ativos",
  "Inativos" e "Bloqueados" recalculam a partir do conjunto vigente

#### Scenario: Descarte preserva a base
- **WHEN** o usuário aciona "Cancelar", `Escape` ou o `X` do cabeçalho com o modal aberto
- **THEN** o modal fecha sem nenhuma requisição e o conjunto de perfis permanece intacto

#### Scenario: Gravação persiste e a recarga a mantém
- **WHEN** um perfil é criado ou editado e depois a página é recarregada
- **THEN** o perfil criado/alterado aparece na listagem vindo da API, sem restauração da
  base de demonstração original

### Requirement: O modal de exclusão confirma a remoção de um perfil via API
O sistema SHALL abrir um modal de confirmação (`UiModal` de largura `sm`) ao acionar o
"Excluir perfil" (`Trash2`) de qualquer linha, com título "Excluir Perfil", identificação do
alvo (nome e contagem de usuários vinculados) e o aviso de que a ação não pode ser desfeita,
no rodapé as ações "Cancelar" (secundária, `UiButton outline`) e "Excluir" (destrutiva,
`UiButton danger`), habilitada desde a abertura.

Ao confirmar com **um ou mais usuários vinculados**, o sistema SHALL fechar o modal sem
alterar a base (a API responde `409`) e exibir toast de bloqueio informando que o perfil
possui usuários vinculados e não pode ser excluído. Ao confirmar **sem usuários vinculados**,
o sistema SHALL remover o perfil via API — a linha sai da tabela, os KPIs recalculam e um
toast de sucesso é exibido — e devolver o foco ao campo de busca da tabela, pois o botão que
abriu o modal deixa de existir com a linha. "Cancelar", `Escape` ou `X` do cabeçalho SHALL
fechar o modal sem nenhuma requisição. A exclusão SHALL ser irrestrita por papel (qualquer
perfil sem vínculos, inclusive Administrador) e SHALL persistir: a recarga não restaura o
perfil excluído.

#### Scenario: Abertura do modal
- **WHEN** o usuário aciona "Excluir perfil" numa linha, havendo ou não usuários vinculados
- **THEN** o modal `sm` "Excluir Perfil" abre exibindo nome, contagem de usuários vinculados e
  o aviso de irreversibilidade, com "Cancelar" (outline) e "Excluir" (danger) habilitado no
  rodapé

#### Scenario: Confirmação bloqueada por vínculo
- **WHEN** o usuário clica em "Excluir" no modal de um perfil com um ou mais usuários
  vinculados
- **THEN** o modal fecha, a API responde `409` sem remover o registro, um toast de bloqueio
  informa que o perfil não pode ser excluído por ter usuários vinculados e a base permanece
  intacta

#### Scenario: Confirmação remove via API
- **WHEN** o usuário clica em "Excluir" no modal de um perfil sem usuários vinculados
- **THEN** o perfil é removido pela API, sai da tabela, os KPIs recalculam, um toast de
  sucesso é exibido, o modal fecha e o foco vai ao campo de busca da tabela

#### Scenario: Descarte preserva a base
- **WHEN** com o modal aberto o usuário aciona "Cancelar", pressiona `Escape` ou clica no
  `X` do cabeçalho
- **THEN** o modal fecha sem nenhuma requisição e o conjunto de perfis permanece intacto

#### Scenario: Excluir a última linha da última página mantém a tabela válida
- **WHEN** o perfil confirmado para exclusão era a única linha da última página exibida
- **THEN** a tabela ajusta a página corrente para uma página válida, sem estado vazio
  indevido, com os KPIs recalculados

#### Scenario: Exclusão irrestrita por papel
- **WHEN** um perfil sem usuários vinculados é confirmado para exclusão, inclusive o
  Administrador
- **THEN** ele é removido pela API, sem bloqueio por papel

#### Scenario: Recarga mantém a exclusão
- **WHEN** a página é recarregada após uma exclusão
- **THEN** o perfil excluído não aparece (a lista vem da API), sem restauração da base de
  demonstração

### Requirement: O modal de permissões configura a matriz do perfil na API
O sistema SHALL abrir um modal de permissões (`UiModal` de largura `xl`) pelo controle
Permissões de qualquer linha, exibindo a matriz do perfil — **11 módulos no total,
organizados em abas pelas 4 sessões da sidebar**, cada linha com nome e descrição do
módulo —, com as **4 ações fixas** (`visualizar`, `criar`, `alterar`, `excluir`) em um
interruptor por célula e as **5 ações extras** (`publicar`, `arquivar`, `download`,
`exportar`, `importar`) de cada módulo em **chips clicáveis** na coluna
**Funcionalidades** (`UiCheckChip`, editáveis como as fixas) — **sem atalhos de seleção em
lote** —, acompanhadas de um contador "n/99" global, atualizado a cada alteração do rascunho
em qualquer aba.

Alterações valem apenas no rascunho até **Salvar**, que SHALL gravar a matriz no perfil
**via API** (substituição integral da matriz daquele perfil) — a coluna Permissões da linha e
os KPIs recalculam e um toast de sucesso é exibido —; **"Cancelar"**, `Escape` ou o `X` do
cabeçalho SHALL descartar o rascunho sem nenhuma requisição; e a recarga SHALL restaurar a
matriz gravada na API. A matriz do perfil **Administrador é editável como as demais**, e um
perfil novo (matriz vazia, `0/99`) SHALL poder ser configurado no mesmo modal.

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
- **THEN** o contador "n/99" do modal é atualizado imediatamente e a base permanece intacta
  (a linha da tabela e os KPIs só mudam após Salvar)

#### Scenario: Chips de Funcionalidades editam as ações extras
- **WHEN** o usuário clica num chip da coluna Funcionalidades de um módulo
- **THEN** o estado do chip (marcado/desmarcado) e o contador "n/99" acompanham o rascunho e
  a base permanece intacta até Salvar — os chips refletem as ações extras
  (`permissoes_extras`) daquele módulo

#### Scenario: Salvar grava via API e recalcula
- **WHEN** com alterações no rascunho o usuário clica em "Salvar"
- **THEN** a matriz salva é gravada pela API, refletida na coluna Permissões da linha e nos
  KPIs (ex.: Editor `45/99` muda conforme as células alteradas), um toast de sucesso é
  exibido e o modal fecha

#### Scenario: Cancelar, Escape ou X descartam o rascunho
- **WHEN** o usuário altera células e aciona "Cancelar", pressiona `Escape` ou clica no `X`
  do cabeçalho
- **THEN** o modal fecha sem nenhuma requisição e a matriz, a coluna Permissões e os KPIs
  permanecem idênticos ao estado anterior

#### Scenario: Recarga restaura a matriz gravada
- **WHEN** a página é recarregada após salvar alterações de permissões
- **THEN** a matriz vinda da API reflete o que foi gravado (sem volta à semente original)

#### Scenario: Administrador editável e perfil novo configurável
- **WHEN** o usuário abre o modal do Administrador ou de um perfil recém-criado (0/99)
- **THEN** a matriz é editável como a de qualquer outro perfil, sem trava por papel

## MODIFIED Requirements

### Requirement: As contagens de permissões e de usuários são derivadas, nunca digitadas
O sistema SHALL derivar a coluna **Permissões** da matriz de permissões servida pela API
(4 perfis × 11 módulos × 9 ações — as 4 ações fixas `visualizar`, `criar`, `alterar`,
`excluir` mais os 5 `permissoes_extras` `publicar`, `arquivar`, `download`, `exportar`,
`importar` descritos no `docs/02` §3.5), exibindo `99/99` para Administrador, `45/99` para
Editor, `21/99` para Revisor e `6/99` para Leitor; e SHALL derivar a coluna **Usuários** das
contagens de vínculo servidas pela API (derivadas da tabela `usuarios`), que refletem os
usuários efetivamente cadastrados no banco. Nenhuma das duas contagens pode ser um valor
digitado ou fixado no template.

#### Scenario: Contagens derivadas da matriz e da base de usuários
- **WHEN** a tabela é renderizada após o carregamento pela API
- **THEN** a coluna Permissões exibe 99/99, 45/99, 21/99 e 6/99 para Administrador, Editor,
  Revisor e Leitor, e a coluna Usuários exibe a contagem de usuários vinculados a cada
  perfil na base de usuários do banco (ex.: 2 para Administrador — os administradores
  cadastrados — e 0 para os demais), sem valores digitados nem fixados no template

#### Scenario: Acompanha a base de usuários
- **WHEN** usuários são criados ou excluídos no sistema com vínculo àquele perfil
- **THEN** a contagem da coluna Usuários e os KPIs derivados passam a refletir a base atual
  na próxima carga da página, sem divergência entre o exibido e o banco

#### Scenario: Salvar a matriz recalcula a coluna Permissões
- **WHEN** o usuário salva alterações na matriz de permissões de um perfil
- **THEN** a coluna Permissões daquela linha exibe a nova soma sobre 99 derivada da matriz
  gravada na API, sem valor digitado

### Requirement: O modal de permissões copia a matriz entre perfis
O sistema SHALL oferecer no rodapé do modal de permissões, **alinhadas ao lado esquerdo**
(grupo próprio à esquerda; `Cancelar` e `Salvar` permanecem à direita), duas ações de cópia
identificadas por ícone com tooltip e `aria-label` próprios:

- **Copiar de outro perfil** (`ClipboardPaste`): abre um modal filho com a lista de perfis da
  base (exceto o perfil corrente) e SHALL **substituir o rascunho** pela matriz escolhida
  (clone integral, sem mescla com o que havia no rascunho, sem alterar a base) — o contador
  "n/99" acompanha e a cópia **só vale após Salvar**, nos mesmos moldes das edições de célula.
- **Copiar para outro perfil** (`ClipboardCopy`): abre o mesmo modal filho e SHALL gravar
  **imediatamente, via API**, no perfil escolhido a **matriz salva** do perfil corrente
  (nunca o rascunho, mesmo com alterações não salvas), com toast de sucesso — a linha do
  perfil alvo e os KPIs recalculam na hora, a cópia **persiste na recarga**, e o descarte do
  modal corrente (Cancelar/Escape/X) **não desfaz** a cópia já feita no alvo.

O modal filho SHALL listar cada perfil candidato como escolha única com nome, descrição e
sua contagem `n/99`; o perfil corrente SHALL estar sempre ausente da lista, e, sem
candidatos (base com um único perfil), o modal filho SHALL exibir estado vazio com a ação
de descarte. Ao fechar o modal filho, o foco SHALL voltar ao botão de ícone que o abriu, com
o modal de permissões subjacente intacto (pilha de modais). A ação "copiar de" não emite
nenhuma requisição (vale até Salvar); a ação "copiar para" grava via API.

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
- **THEN** o modal fecha sem nenhuma requisição e matriz, coluna Permissões e KPIs
  permanecem idênticos ao estado anterior à importação

#### Scenario: Exportar grava imediatamente no perfil alvo
- **WHEN** com o modal do Editor aberto (matriz salva 45/99) o usuário escolhe "copiar
  para" o Leitor e confirma
- **THEN** a matriz do Leitor passa a ser a salva do Editor, gravada via API (persistindo na
  recarga), sua linha exibe `45/99` (era `6/99`), o KPI de Permissões concedidas recalcula
  para `210/396` e um toast de sucesso é exibido; fechar em seguida o modal corrente não
  desfaz a cópia no Leitor

#### Scenario: Exportar usa a matriz salva, não o rascunho
- **WHEN** o usuário altera células do rascunho sem salvar e depois exporta o perfil
  corrente para outro perfil
- **THEN** o destino recebe a matriz **salva** do perfil corrente (a anterior às alterações
  descartáveis), não o conteúdo editado do rascunho

#### Scenario: O seletor exclui o perfil corrente
- **WHEN** qualquer uma das duas ações de cópia abre o modal filho
- **THEN** a lista apresenta somente os demais perfis da base como escolhas únicas com nome,
  descrição e contagem `n/99`; o perfil corrente nunca aparece e, sem candidatos, um estado
  vazio é exibido com a ação de descarte

## REMOVED Requirements

### Requirement: A base de perfis vive em memória e se restaura na recarga
**Reason**: A fase 1 (base demo em `useState`, descartada na recarga) é substituída pela
persistência real em MariaDB via API — as tabelas `perfis_acesso`/`permissoes_perfil` já
existem e a change `perfis-acesso-backend` conecta a página a elas; o comportamento passa a
ser o oposto: gravações sobrevivem à recarga e a base volta do banco (não da semente).
**Migration**: O carregamento passa a ser `GET /api/perfis` (ver requisito "A página carrega
e mantém os perfis sincronizados com a API"); a base inicial continua sendo a semente
`02_seed.sql`, que reproduz os 4 perfis canônicos e a matriz 99/45/21/99.

### Requirement: O modal de cadastro/edição cria e altera perfis
**Reason**: O requisito da fase 1 mandava gravar "em memória, sem nenhuma requisição HTTP,
descartado na recarga" — substituído pela versão persistida via API, com o mesmo contrato de
UI (aberturas, validação de nome, seção de datas só na edição) e gravação que sobrevive à
recarga.
**Migration**: Ver requisito ADDED "O modal de cadastro/edição cria e altera perfis
persistidos via API", que mantém todos os cenários de UI e troca os de persistência.

### Requirement: O modal de exclusão confirma a remoção de um perfil
**Reason**: O requisito da fase 1 removia o perfil "em memória, sem nenhuma requisição HTTP,
descartado na recarga" — substituído pela exclusão via API com guarda de vínculo no servidor
(`409`), mantendo o mesmo modal, a mesma mensagem de bloqueio e a irrestritividade por papel.
**Migration**: Ver requisito ADDED "O modal de exclusão confirma a remoção de um perfil via
API", que preserva os cenários de UI e troca os de persistência.

### Requirement: O modal de permissões configura a matriz do perfil
**Reason**: O requisito da fase 1 gravava a matriz "em memória (clone, sem nenhuma
requisição HTTP)" e mandava a recarga "restaurar a matriz semeada" — substituído pela
gravação via API e recarga que restaura o que foi gravado; a UI (abas, interruptores, chips,
contador, rascunho) permanece igual.
**Migration**: Ver requisito ADDED "O modal de permissões configura a matriz do perfil na
API", que preserva os cenários de UI e troca os de persistência.
