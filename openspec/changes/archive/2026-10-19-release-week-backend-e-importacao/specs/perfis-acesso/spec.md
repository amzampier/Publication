# Spec Delta: perfis-acesso

## MODIFIED Requirements

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
  seguida, a tabela exibe os perfis persistidos (a base semeada: 4 perfis, todos Ativos, com as
  matrizes normativas do `docs/07`, ex.: Administrador 88/88)

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

### Requirement: Os KPIs refletem o conjunto vigente de perfis
O sistema SHALL exibir no topo da página os KPIs "Total de perfis" (contagem do conjunto
vigente), "Ativos", "Inativos", "Bloqueados" e "Permissões concedidas"
(`<soma das permissões verdadeiras>/<perfis × total do catálogo de funcionalidades>`), recalculados
sempre que o conjunto de perfis muda — inclusive quando um filtro do módulo o refina (o conjunto
vigente passa a ser o conjunto filtrado). O total do catálogo SHALL ser a soma das funcionalidades
de todos os módulos (para os 11 módulos atuais, **88**).

#### Scenario: Base de demonstração
- **WHEN** a página é aberta com a base de demonstração (4 perfis, todos Ativos, matriz normativa
  semeada)
- **THEN** os KPIs exibem Total de perfis 4, Ativos 4, Inativos 0, Bloqueados 0 e Permissões
  concedidas conforme a matriz normativa do `docs/07`

#### Scenario: Recalculo após mudança do conjunto
- **WHEN** o conjunto vigente de perfis muda (criação, edição, exclusão, mudança de situação
  ou edição da matriz de permissões)
- **THEN** os cinco KPIs são recalculados a partir do conjunto vigente

#### Scenario: Filtro do módulo recalcula os KPIs
- **WHEN** o usuário aplica um filtro do módulo (ex.: Status = Inativo) ou limpa os filtros
- **THEN** os cinco KPIs passam a refletir somente o conjunto filtrado (ou a base completa,
  na limpeza) imediatamente

### Requirement: As contagens de permissões e de usuários são derivadas, nunca digitadas
O sistema SHALL derivar a coluna **Permissões** da matriz de permissões servida pela API, somando as
funcionalidades concedidas em cada perfil sobre o **total do catálogo** (`docs/07` §7 e `docs/02`
§3.5) — as funcionalidades são **por módulo** (as fixas `visualizar`, `criar`, `alterar`, `excluir`
mais as específicas de cada módulo, ex.: `clonar`, `publicar`, `arquivar`, `download`, `exportar`,
`importar`, `filtrar`, `buscar`, `visualizar_itens`, `permissoes`) —, exibindo as contagens
normativas de cada perfil da base (ex.: Administrador `88/88`); e SHALL derivar a coluna
**Usuários** das contagens de vínculo servidas pela API (derivadas da tabela `usuarios`), que
refletem os usuários efetivamente cadastrados no banco. Nenhuma das duas contagens pode ser um valor
digitado ou fixado no template.

#### Scenario: Contagens derivadas da matriz e da base de usuários
- **WHEN** a tabela é renderizada após o carregamento pela API
- **THEN** a coluna Permissões exibe as contagens normativas do `docs/07` para cada perfil (ex.:
  Administrador `88/88`), e a coluna Usuários exibe a contagem de usuários vinculados a cada
  perfil na base de usuários do banco, sem valores digitados nem fixados no template

#### Scenario: Acompanha a base de usuários
- **WHEN** usuários são criados ou excluídos no sistema com vínculo àquele perfil
- **THEN** a contagem da coluna Usuários e os KPIs derivados passam a refletir a base atual
  na próxima carga da página, sem divergência entre o exibido e o banco

#### Scenario: Salvar a matriz recalcula a coluna Permissões
- **WHEN** o usuário salva alterações na matriz de permissões de um perfil
- **THEN** a coluna Permissões daquela linha exibe a nova soma sobre o total do catálogo,
  derivada da matriz gravada na API, sem valor digitado

### Requirement: O modal de permissões configura a matriz do perfil na API
O sistema SHALL abrir um modal de permissões (`UiModal` de largura `xl`) pelo controle
Permissões de qualquer linha, exibindo a matriz do perfil — **11 módulos no total,
organizados em abas pelas 4 sessões da sidebar**, cada linha com nome e descrição do
módulo —, com as funcionalidades **do módulo** (as fixas `visualizar`, `criar`, `alterar`,
`excluir` em um interruptor por célula, apenas onde o módulo as possui, e as funcionalidades
específicas do módulo — ex.: `clonar`, `publicar`, `arquivar`, `download`, `exportar`,
`importar`, `filtrar`, `buscar`, `visualizar_itens`, `permissoes` — em **chips clicáveis** na
coluna **Funcionalidades**, `UiCheckChip`, editáveis como as fixas) — **sem atalhos de seleção em
lote** —, acompanhadas de um contador `n/<total do catálogo>` global, atualizado a cada alteração
do rascunho em qualquer aba.

Alterações valem apenas no rascunho até **Salvar**, que SHALL gravar a matriz no perfil
**via API** (substituição integral da matriz daquele perfil) — a coluna Permissões da linha e
os KPIs recalculam e um toast de sucesso é exibido —; **"Cancelar"**, `Escape` ou o `X` do
cabeçalho SHALL descartar o rascunho sem nenhuma requisição; e a recarga SHALL restaurar a
matriz gravada na API. A matriz do perfil **Administrador é editável como as demais**, e um
perfil novo (matriz vazia, `0/88`) SHALL poder ser configurado no mesmo modal.

#### Scenario: Abertura pela ação Permissões
- **WHEN** o usuário aciona "Configurar permissões" na linha de um perfil
- **THEN** o modal "Permissões" abre exibindo o nome do perfil, as abas das 4 sessões da
  sidebar com os módulos da primeira sessão (nome + descrição em cada linha), os
  interruptores das funcionalidades fixas aplicáveis, os chips das Funcionalidades do módulo e o
  contador `n/88` global

#### Scenario: Abas particionam os módulos por sessão
- **WHEN** o usuário troca de aba (ex.: "Movimentos")
- **THEN** a tabela passa a exibir somente os módulos daquela sessão (com os mesmos
  interruptores e chips), enquanto o contador global segue refletindo a matriz completa do
  perfil

#### Scenario: Chips de Funcionalidades editam as ações extras
- **WHEN** o usuário visualiza as funcionalidades de Perfis de Acesso e de Gestão de Auditoria
- **THEN** cada módulo oferece apenas as suas funcionalidades (ex.: Perfis com `permissoes`,
  `exportar`, `filtrar`; Auditoria com `exportar`, `filtrar`) — sem `clonar`/`publicar`/`arquivar`/`download`
  onde não existem —, e o estado dos chips acompanha o rascunho até Salvar

#### Scenario: Interruptor de célula altera só o rascunho
- **WHEN** o usuário liga ou desliga um interruptor de uma das funcionalidades fixas de um módulo
- **THEN** o contador global do modal é atualizado imediatamente e a base permanece intacta
  (a linha da tabela e os KPIs só mudam após Salvar)

#### Scenario: Salvar grava via API e recalcula
- **WHEN** com alterações no rascunho o usuário clica em "Salvar"
- **THEN** a matriz salva é gravada pela API, refletida na coluna Permissões da linha e nos
  KPIs, um toast de sucesso é exibido e o modal fecha

#### Scenario: Cancelar, Escape ou X descartam o rascunho
- **WHEN** o usuário altera células e aciona "Cancelar", pressiona `Escape` ou clica no `X`
  do cabeçalho
- **THEN** o modal fecha sem nenhuma requisição e a matriz, a coluna Permissões e os KPIs
  permanecem idênticos ao estado anterior

#### Scenario: Recarga restaura a matriz gravada
- **WHEN** a página é recarregada após salvar alterações de permissões
- **THEN** a matriz vinda da API reflete o que foi gravado (sem volta à semente original)

#### Scenario: Administrador editável e perfil novo configurável
- **WHEN** o usuário abre o modal do Administrador ou de um perfil recém-criado (`0/88`)
- **THEN** a matriz é editável como a de qualquer outro perfil, sem trava por papel

### Requirement: O modal de permissões copia a matriz entre perfis
O sistema SHALL oferecer no rodapé do modal de permissões, **alinhadas ao lado esquerdo**
(grupo próprio à esquerda; `Cancelar` e `Salvar` permanecem à direita), duas ações de cópia
identificadas por ícone com tooltip e `aria-label` próprios:

- **Copiar de outro perfil** (`ClipboardPaste`): abre um modal filho com a lista de perfis da
  base (exceto o perfil corrente) e SHALL **substituir o rascunho** pela matriz escolhida
  (clone integral, sem mescla com o que havia no rascunho, sem alterar a base) — o contador
  acompanha e a cópia **só vale após Salvar**, nos mesmos moldes das edições de célula.
- **Copiar para outro perfil** (`ClipboardCopy`): abre o mesmo modal filho e SHALL gravar
  **imediatamente, via API**, no perfil escolhido a **matriz salva** do perfil corrente
  (nunca o rascunho, mesmo com alterações não salvas), com toast de sucesso — a linha do
  perfil alvo e os KPIs recalculam na hora, a cópia **persiste na recarga**, e o descarte do
  modal corrente (Cancelar/Escape/X) **não desfaz** a cópia já feita no alvo.

O modal filho SHALL listar cada perfil candidato como escolha única com nome, descrição e
sua contagem `n/88`; o perfil corrente SHALL estar sempre ausente da lista, e, sem
candidatos (base com um único perfil), o modal filho SHALL exibir estado vazio com a ação
de descarte. Ao fechar o modal filho, o foco SHALL voltar ao botão de ícone que o abriu, com
o modal de permissões subjacente intacto (pilha de modais). A ação "copiar de" não emite
nenhuma requisição (vale até Salvar); a ação "copiar para" grava via API.

#### Scenario: Rodapé com as ações de cópia à esquerda
- **WHEN** o modal de permissões é aberto
- **THEN** o rodapé exibe os ícones `ClipboardPaste` e `ClipboardCopy` (com tooltip e
  `aria-label` próprios) agrupados à esquerda, e `Cancelar` e `Salvar` seguem à direita

#### Scenario: Importar substitui só o rascunho
- **WHEN** com o modal de um perfil aberto o usuário escolhe "copiar de" outro perfil e confirma
- **THEN** o rascunho é substituído por inteiro pela matriz escolhida e a coluna Permissões e os
  KPIs permanecem intactos até **Salvar**; ao salvar, a linha reflete a nova soma sobre o total do
  catálogo e o KPI de Permissões concedidas recalcula, com toast de sucesso

#### Scenario: Descartar após importar preserva a base
- **WHEN** o usuário importa a matriz de outro perfil e, sem salvar, aciona "Cancelar",
  `Escape` ou o `X` do cabeçalho
- **THEN** o modal fecha e matriz, coluna Permissões e KPIs permanecem idênticos ao estado
  anterior à importação

#### Scenario: Exportar grava imediatamente no perfil alvo
- **WHEN** o usuário escolhe "copiar para" outro perfil e confirma
- **THEN** a matriz do alvo passa a ser a salva do perfil corrente, gravada via API (persistindo
  na recarga), sua linha reflete a nova soma, o KPI de Permissões concedidas recalcula e um toast
  de sucesso é exibido; fechar em seguida o modal corrente não desfaz a cópia no alvo

#### Scenario: Exportar usa a matriz salva, não o rascunho
- **WHEN** o usuário altera células do rascunho sem salvar e depois exporta o perfil corrente
  para outro perfil
- **THEN** o destino recebe a matriz **salva** do perfil corrente (a anterior às alterações
  descartáveis), não o conteúdo editado do rascunho

#### Scenario: O seletor exclui o perfil corrente
- **WHEN** qualquer uma das duas ações de cópia abre o modal filho
- **THEN** a lista apresenta somente os demais perfis da base como escolhas únicas com nome,
  descrição e contagem `n/88`; o perfil corrente nunca aparece e, sem candidatos, um estado
  vazio é exibido com a ação de descarte

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
(`0/88`) e zero usuários vinculados — a linha aparece, os KPIs recalculam e um toast de
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
- **THEN** o perfil é criado pela API com id UUID gerado no banco, matriz vazia (`0/88`) e 0
  usuários, a linha aparece na tabela, os KPIs recalculam (o denominador de Permissões concedidas
  passa a considerar o novo perfil), um toast de sucesso é exibido e o modal fecha

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

### Requirement: O docs/07 é a fonte normativa da matriz de permissões
O sistema SHALL manter o documento `docs/07 - Perfis de Acesso (RBAC).md` documentando a
página (rota, componentes e comportamento) e a **matriz de permissões normativa** — 4 perfis ×
11 módulos da sidebar, com **funcionalidades por módulo** (catálogo) — com exatamente as mesmas
contagens exibidas na tela, e declarando-se a fonte que o modal de permissões SHALL implementar.

#### Scenario: Consistência documento ↔ tela
- **WHEN** o `docs/07` e a página são comparados
- **THEN** as regras por perfil do documento produzem as mesmas contagens da tabela (ex.:
  Administrador `88/88`) e do KPI de Permissões concedidas

#### Scenario: Escopo do modal futuro declarado
- **WHEN** o `docs/07` é lido
- **THEN** ele identifica a matriz como fonte normativa e documenta as funcionalidades por módulo
  que o modal de permissões implementa

## ADDED Requirements

### Requirement: A matriz exige criar para conceder clonar
A validação da matriz de permissões SHALL recusar (`400`) uma configuração que conceda `clonar` no
módulo `release-week` sem conceder `criar` no mesmo módulo, pois a clonagem grava por
`POST /api/release-week` e exige `criar` no servidor. A recusa SHALL valer tanto na gravação da
matriz (`PUT /api/perfis/:id/permissoes` e cópia) quanto na validação do cliente.

#### Scenario: Clonar sem criar é recusado
- **WHEN** uma matriz concede `release-week`/`clonar` e não concede `release-week`/`criar`
- **THEN** a API responde `400` e a matriz não é gravada

#### Scenario: Clonar com criar é aceito
- **WHEN** uma matriz concede `release-week`/`clonar` e `release-week`/`criar`
- **THEN** a matriz é válida e pode ser gravada
