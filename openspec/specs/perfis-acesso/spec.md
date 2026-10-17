# Perfis de Acesso (RBAC) Specification

## Purpose

Definir o comportamento da página principal de Perfis de Acesso (RBAC) — listagem persistida
via API (`GET /api/perfis`) com KPIs de 3 estados, tabela com a contagem de permissões e de
usuários vinculados, modal de cadastro/edição (id UUID, situação de 3 estados), modal de
exclusão com guarda de vínculo imposta no servidor (`409`) e modal de configuração da matriz
de permissões —, declarando o `docs/07` como fonte normativa
da matriz de permissões, para que a Área Administrativa visualize e administre os perfis de
acesso conforme o modelo `perfis_acesso`/`permissoes_perfil` descrito no `docs/02` §3.5.

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

### Requirement: Os KPIs refletem o conjunto vigente de perfis
O sistema SHALL exibir no topo da página os KPIs "Total de perfis" (contagem do conjunto
vigente), "Ativos", "Inativos", "Bloqueados" e "Permissões concedidas"
(`<soma das permissões verdadeiras>/<perfis × 99>`), recalculados sempre que o conjunto de
perfis muda — inclusive quando um filtro do módulo o refina (o conjunto vigente passa a ser
o conjunto filtrado).

#### Scenario: Base de demonstração
- **WHEN** a página é aberta com a base de demonstração (4 perfis, todos Ativos, matriz semeada)
- **THEN** os KPIs exibem Total de perfis 4, Ativos 4, Inativos 0, Bloqueados 0 e Permissões
  concedidas 171/396

#### Scenario: Recalculo após mudança do conjunto
- **WHEN** o conjunto vigente de perfis muda (criação, edição, exclusão, mudança de situação
  ou edição da matriz de permissões)
- **THEN** os cinco KPIs são recalculados a partir do conjunto vigente

#### Scenario: Filtro do módulo recalcula os KPIs
- **WHEN** o usuário aplica um filtro do módulo (ex.: Status = Inativo) ou limpa os filtros
- **THEN** os cinco KPIs passam a refletir somente o conjunto filtrado (ou a base completa,
  na limpeza) imediatamente

### Requirement: O modal de filtros refina o conjunto vigente de perfis
O sistema SHALL abrir um modal de filtros ao acionar o botão "Filtros" da toolbar da tabela
(`UiModal` de largura `sm`, com ícone no cabeçalho, título "Filtros de Perfis"), cujo corpo
é organizado em duas sessões `UiModalSection`: **"Perfil"**, contendo um controle de seleção
única `UiSelect` cujas opções são os nomes dos perfis da base (ordenados em pt-BR) e
**"Status"**, contendo um `UiSelect` com os estados Ativo, Inativo e Bloqueado —, em ambos o
estado vazio equivalendo a "todos" (placeholder "Todos os perfis"/"Todos os status") e a
limpeza pelo `X` do select devolvendo o critério a "todos". O modal SHALL editar um rascunho
sincronizado com o estado aplicado ao abrir: **"Aplicar"** grava o rascunho e fecha;
**"Cancelar"**, `Escape` ou o `X` do cabeçalho fecham descartando o rascunho sem alterar o
estado aplicado; **"Limpar Filtros"** (à esquerda do rodapé) zera rascunho e estado aplicado
mantendo o modal aberto, com "Cancelar" e "Aplicar" à direita do rodapé. Aplicado o filtro, a
tabela, os KPIs e as exportações (CSV e PDF) SHALL refletir somente o conjunto filtrado, e o
badge do botão "Filtros" SHALL indicar a quantidade de critérios ativos (0 a 2), alterada
somente por "Aplicar" e "Limpar Filtros". Os filtros SHALL operar inteiramente em memória,
sem nenhuma requisição HTTP, e serem descartados na recarga da página.

#### Scenario: Abertura pelo botão Filtros
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** o modal de filtros abre exibindo as sessões "Perfil" e "Status" com os dois
  selects no estado vigente e nenhum toast de "próxima etapa" é exibido

#### Scenario: Aplicar filtra e recalcula tudo
- **WHEN** com o modal aberto o usuário escolhe um perfil (ex.: Leitor) e aciona "Aplicar"
- **THEN** o modal fecha, a tabela lista apenas aquele perfil, os cinco KPIs refletem apenas
  esse conjunto, o badge do botão "Filtros" exibe 1 e o CSV e o PDF gerados em seguida
  contêm somente esse perfil

#### Scenario: Rascunho descartado por Cancelar
- **WHEN** com filtros já aplicados o usuário abre o modal, altera os selects e aciona
  "Cancelar" (ou pressiona `Escape` ou clica no `X` do cabeçalho)
- **THEN** o modal fecha, o conjunto exibido, os KPIs e o badge permanecem idênticos ao
  estado anterior e nenhum toast é exibido

#### Scenario: Limpar Filtros zera com o modal aberto
- **WHEN** com dois critérios aplicados o usuário aciona "Limpar Filtros" dentro do modal
- **THEN** os dois selects voltam ao estado vazio ("todos"), a tabela e os KPIs voltam a
  refletir a base completa, o badge do botão "Filtros" desaparece (zero critérios) e o modal
  permanece aberto

#### Scenario: Limpeza individual pelo X do select
- **WHEN** o usuário limpa o select de Status pelo seu `X` e aciona "Aplicar"
- **THEN** o critério de status volta a "todos" e o conjunto passa a considerar apenas os
  demais critérios aplicados

#### Scenario: Badge conta somente o estado aplicado
- **WHEN** o usuário seleciona critérios no rascunho sem acionar "Aplicar" e depois fecha o
  modal
- **THEN** o badge do botão "Filtros" não muda, refletindo apenas o estado aplicado

#### Scenario: Conjunto filtrado vazio
- **WHEN** a combinação de filtros aplicados não corresponde a nenhum perfil (ex.: Status =
  Bloqueado sobre a base de demonstração)
- **THEN** a tabela exibe seu estado vazio ("Nenhum dado encontrado com o filtro aplicado.")
  e os KPIs refletem o conjunto vazio (Total de perfis 0 e Permissões concedidas 0/0), sem
  erro

#### Scenario: Recarga descarta os filtros
- **WHEN** a página é recarregada com filtros aplicados
- **THEN** os filtros voltam ao estado vazio e a base completa é exibida

### Requirement: A exportação gera arquivos sobre o conjunto de perfis vigente
O sistema SHALL oferecer no cabeçalho o menu "Relatórios" (posicionado à esquerda do botão
"Novo Perfil") com as opções "Relação de perfis" (gera e baixa o relatório `perfis.pdf` em
folha paisagem sobre o conjunto vigente, com logo de login configurada quando houver e as
colunas Nome, Descrição, Status, Usuários e Permissões) e "Exportar em CSV" (download do
conjunto vigente em `perfis.csv`, com `;` como separador, BOM UTF-8 e linha de cabeçalho),
com um divisor separando a opção em PDF do CSV, sem abrir o diálogo de impressão do
navegador. Quando houver filtro do módulo aplicado, ambas as opções SHALL considerar
somente o conjunto filtrado.

#### Scenario: Exportar em CSV
- **WHEN** o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo `perfis.csv` é baixado contendo o conjunto vigente de perfis, com
  linha de cabeçalho (Nome, Descrição, Status, Usuários, Permissões)

#### Scenario: Relação de perfis gera o relatório estruturado
- **WHEN** o usuário escolhe "Relação de perfis"
- **THEN** o arquivo `perfis.pdf` é baixado em folha paisagem com cabeçalho contendo a logo
  de login configurada (quando houver) e o título do relatório, as colunas Nome, Descrição,
  Status, Usuários e Permissões com os perfis do conjunto vigente, e paginação com a
  indicação da página

#### Scenario: Os relatórios são baixados sem diálogo de impressão
- **WHEN** a opção em PDF do menu "Relatórios" é acionada
- **THEN** `window.print()` não é chamado e o arquivo é salvo diretamente no dispositivo

#### Scenario: Exporta o conjunto filtrado
- **WHEN** com um filtro do módulo aplicado o usuário escolhe qualquer das opções do menu
  "Relatórios"
- **THEN** o arquivo gerado contém somente os perfis do conjunto filtrado

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
- **THEN** o modal fecha e matriz, coluna Permissões e KPIs permanecem idênticos ao estado
  anterior à importação

#### Scenario: Exportar grava imediatamente no perfil alvo
- **WHEN** com o modal do Editor aberto (matriz salva 45/99) o usuário escolhe "copiar
  para" o Leitor e confirma
- **THEN** a matriz do Leitor passa a ser a salva do Editor, gravada via API (persistindo na
  recarga), sua linha exibe `45/99` (era `6/99`), o KPI de Permissões concedidas recalcula
  para `210/396` e um toast de sucesso é exibido; fechar em seguida o modal corrente não
  desfaz a cópia no Leitor

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

### Requirement: A matriz de permissões é aplicada pelas APIs administrativas
A matriz de permissões de um perfil SHALL determinar, no servidor, o que os usuários vinculados a
ele podem fazer nas APIs administrativas — deixando de ser apenas normativa. Após salvar a matriz
de um perfil (ou copiá-la), os usuários daquele perfil SHALL passar a ter exatamente as ações
concedidas (e a perder as revogadas) na próxima requisição, conforme a capability
`autorizacao-rbac`.

#### Scenario: Conceder uma ação passa a permitir a operação
- **WHEN** a matriz de um perfil recebe uma ação que não tinha (ex.: `criar` em `gestao-usuarios`) e a gravação é confirmada
- **THEN** os usuários daquele perfil passam a poder executar a operação correspondente

#### Scenario: Revogar uma ação passa a negar a operação
- **WHEN** a matriz de um perfil perde uma ação que tinha (ex.: `excluir` em `gestao-usuarios`) e a gravação é confirmada
- **THEN** os usuários daquele perfil passam a receber `403` na operação correspondente

### Requirement: A gravação da matriz protege contra o lockout administrativo
O sistema SHALL recusar com `409` (sem gravar) a substituição ou cópia de matriz que deixaria o
sistema **sem nenhum usuário ativo** cujo perfil conceda a ação `alterar` nos **três módulos
essenciais** (`gestao-usuarios`, `perfis-acesso` e `configuracoes-globais`), evitando que o sistema
fique sem administração possível. A mesma guarda SHALL recusar (`409`, sem gravar) a **desativação** e a **exclusão** do último usuário ativo com essas permissões essenciais, bem como a
**inativação/bloqueio do perfil** que sustenta essa administração, de modo que a proteção
cubra também a gestão de usuários e não apenas a matriz. As respostas de recusa SHALL trazer uma
mensagem que explique a causa (que a alteração deixaria o sistema sem administração), e o cliente
SHALL exibir essa mensagem ao operador, não um erro genérico. As demais gravações seguem permitidas,
preservada a editabilidade da matriz de qualquer perfil na abertura do modal.

#### Scenario: Retirar a última administração é recusado
- **WHEN** a gravação da matriz do único perfil cujos usuários ativos detêm `alterar` nos três módulos essenciais remove uma dessas permissões
- **THEN** a API responde `409`, a matriz permanece intacta e uma mensagem informa que a alteração deixaria o sistema sem administração

#### Scenario: Cópia que removeria a última administração é recusada
- **WHEN** "copiar para" sobrescreveria a matriz do último perfil detentor das permissões essenciais de modo a removê-las
- **THEN** a API responde `409`, a matriz do destino permanece intacta e nada é gravado

#### Scenario: Alteração permitida quando há outra administração
- **WHEN** existe ao menos um outro usuário ativo cujo perfil detém `alterar` nos três módulos essenciais
- **THEN** a gravação da matriz é aceita normalmente (200), recalculando a coluna Permissões e os KPIs

#### Scenario: Desativar o último administrador é recusado
- **WHEN** a desativação de um usuário removeria a última administração essencial ativa
- **THEN** a API responde `409`, a situação do usuário permanece e uma mensagem informa que a alteração deixaria o sistema sem administração

#### Scenario: Desativar ou bloquear o perfil do último administrador essencial é recusado
- **WHEN** a inativação ou o bloqueio de um perfil removeria a última administração essencial ativa
- **THEN** a API responde `409`, a situação do perfil permanece e uma mensagem informa que a alteração deixaria o sistema sem administração
#### Scenario: Excluir o último administrador é recusado
- **WHEN** a exclusão de um usuário removeria a última administração essencial ativa
- **THEN** a API responde `409`, o usuário permanece e nada é gravado

#### Scenario: Mensagem do lockout é exibida ao operador
- **WHEN** a gravação da matriz é recusada com `409` por lockout administrativo
- **THEN** o cliente exibe a mensagem devolvida pelo servidor, em vez de um erro genérico de conexão

### Requirement: O nome do perfil é único
O sistema SHALL garantir a unicidade do nome do perfil no banco (`perfis_acesso.nome_perfil`): criar
um perfil ou renomear um perfil para um nome já existente SHALL responder `409` sem gravar,
preservando o registro existente. A restrição de unicidade do banco é a garantia de integridade
final.

#### Scenario: Criação com nome duplicado é recusada
- **WHEN** `POST /api/perfis` é chamado com um `nome_perfil` já existente
- **THEN** a API responde `409` e nenhum perfil é criado

#### Scenario: Edição para nome existente é recusada
- **WHEN** `PUT /api/perfis/:id` renomeia um perfil para o nome de outro perfil já existente
- **THEN** a API responde `409` e nenhum nome é alterado

### Requirement: A situação do perfil controla o acesso e a atribuição
O sistema SHALL impedir o login de um usuário cujo perfil esteja **Inativo** ou **Bloqueado**
(aviso próprio, sem autenticar) e SHALL recusar a atribuição de um perfil não-Ativo na criação,
na edição e no convite de usuários. Tornar um perfil **não-Ativo** SHALL ainda derrubar as sessões
vigentes dos usuários vinculados a ele: a validação de sessão e a renovação (`POST /api/auth/refresh`)
SHALL tratar essas sessões como não autenticadas enquanto o perfil permanecer não-Ativo, sem
depender de novo login.

#### Scenario: Usuário de perfil não-Ativo não loga
- **WHEN** um usuário com credenciais válidas cujo perfil está Inativo ou Bloqueado tenta autenticar
- **THEN** o login é recusado com aviso de que o perfil não está ativo e nenhuma sessão é criada

#### Scenario: Perfil não-Ativo não é atribuível
- **WHEN** uma criação, edição ou convite tenta atribuir um perfil Inativo ou Bloqueado
- **THEN** a operação é recusada (`400`) e nada é gravado

#### Scenario: Inativar o perfil derruba as sessões dos seus usuários
- **WHEN** um perfil passa a Inativo (ou Bloqueado) enquanto usuários vinculados possuem sessão aberta
- **THEN** as requisições seguintes desses usuários respondem `401` e o refresh não renova a sessão, sem novo login

### Requirement: A edição do perfil preserva campos omitidos
O sistema SHALL atualizar o perfil de forma **parcial**: um campo ausente no corpo do
`PUT /api/perfis/:id` SHALL manter o valor vigente (não apagar). Em particular, omitir a
`descricao` SHALL preservar a descrição atual.

#### Scenario: Omitir a descrição não a apaga
- **WHEN** `PUT /api/perfis/:id` é chamado apenas com `nome` (sem `descricao`)
- **THEN** a descrição do perfil permanece inalterada

#### Scenario: Enviar a descrição a altera
- **WHEN** `PUT /api/perfis/:id` é chamado com `descricao` preenchida
- **THEN** a descrição é atualizada para o valor enviado

### Requirement: A exportação de perfis informa falha ao usuário
Ao gerar um relatório de perfis (CSV ou PDF), se a geração do arquivo falhar, o sistema SHALL exibir um toast de erro, nunca falhando em silêncio.

#### Scenario: Falha na exportação exibe erro
- **WHEN** o usuário aciona um item de "Relatórios" e a geração do arquivo falha
- **THEN** um toast de erro é exibido informando que a exportação não foi concluída

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário em Perfis de Acesso SHALL ser genéricas, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha sem detalhe interno
- **WHEN** uma carga/cópia/gravação falha
- **THEN** a mensagem informa apenas que a operação não foi concluída, sem citar banco
