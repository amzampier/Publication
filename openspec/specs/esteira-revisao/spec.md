# esteira-revisao Specification

## Purpose

Definir a tela administrativa da Esteira de Revisão como um board de homologação das chamadas de
Release Week, Manuais e Escopo de Projetos, com progresso do fluxo, revisão com parecer, publicação
e histórico imutável das transições.

## Requirements

### Requirement: A Esteira de Revisão é acessível pela Área Administrativa

O sistema SHALL expor a tela em `/admin/esteira-revisao`, renderizada dentro do shell da Área
Administrativa (header + sidebar). A tela SHALL ser alcançável pelo item **Esteira de Revisão** da
sessão **Movimentos** da sidebar, que passa a declarar a rota e a exibir o estado ativo quando a rota
corrente for `/admin/esteira-revisao`. O acesso SHALL estar sujeito à guarda de sessão das demais
telas administrativas e à permissão `visualizar` do módulo `esteira-revisao`. O cabeçalho SHALL
oferecer a ação **Ver Portal Público**, que abre a Área Pública em uma nova aba.

#### Scenario: Navegar pelo item da sidebar

- **WHEN** o usuário autenticado aciona "Esteira de Revisão" na sidebar
- **THEN** o navegador vai para `/admin/esteira-revisao` e o item aparece ativo com `aria-current="page"`

#### Scenario: Chegar por URL direta

- **WHEN** o usuário autenticado abre `/admin/esteira-revisao` diretamente
- **THEN** a tela renderiza com o shell administrativo e o item da sidebar aparece ativo

#### Scenario: Sem sessão

- **WHEN** um visitante sem sessão abre `/admin/esteira-revisao`
- **THEN** ele é levado ao login administrativo, como nas demais rotas protegidas

#### Scenario: Sem permissão de visualizar

- **WHEN** o perfil do usuário não concede `esteira-revisao`/`visualizar`
- **THEN** o item da sidebar não é exibido e a tela não é acessível por esse perfil

#### Scenario: Ver Portal Público

- **WHEN** o usuário aciona "Ver Portal Público" no cabeçalho
- **THEN** a Área Pública é aberta em uma nova aba, sem sair da Esteira

### Requirement: A tela exibe KPIs no topo e o painel compacto de progresso junto às origens

A tela SHALL exibir no topo quatro KPIs do conjunto filtrado: **No filtro**, **Em revisão**,
**Aprovadas** e **Recusadas**. Abaixo dos KPIs, na segunda faixa da barra de ferramentas do board, a
tela SHALL exibir o painel **Progresso da Esteira** ao lado do filtro **Demandas por origem**
(abas compactas **Todas**, **Releases**, **Manuais** e **Escopo**, com a contagem global de cada
origem). O painel SHALL ser compacto (percentual em `text-lg`, contagens em linha e barra `h-1.5`) e
NÃO SHALL ocupar 100% da largura; em telas estreitas, painel e origem SHALL empilhar. O painel SHALL
ser calculado sobre o **ciclo ativo**: chamadas cujo ao menos um vínculo aponte para Release Week,
Manual ou Escopo de Projetos **não arquivado**, exceto as chamadas em `Publicar` cujo ao menos um
vínculo ativo aponte para conteúdo pai `Publicado` — já visíveis no portal e, por isso, fora do
ciclo. Itens em `Revisar`, `Aprovado` ou `Recusado` permanecem no ciclo mesmo com o pai publicado. O
painel SHALL apresentar o percentual do fluxo (`(Aprovado + Publicar) / total`), as contagens
**a revisar**, **aprovados** e **publicados**, e uma barra segmentada com as cores sólidas de Revisar
(`#f59e0b`), Aprovado (`#1a9e07`), Publicar (`#0364f7`) e Recusado (`#be123c`). O painel SHALL ser **global** e NÃO SHALL
mudar quando os filtros do board forem aplicados, inclusive quando o filtro de vínculo revelar no
board chamadas já publicadas. Quando houver chamadas recusadas, o painel SHALL
exibir um acionador **recusadas** que mostra ou oculta a faixa de recusadas do board. Com total zero,
o painel SHALL exibir estado vazio sem divisão por zero. A barra SHALL expor `role="progressbar"`
com `aria-valuenow`, `aria-valuemin`, `aria-valuemax` e rótulo textual.

#### Scenario: Layout do topo

- **WHEN** a tela é exibida em desktop
- **THEN** os quatro KPIs aparecem no topo e, abaixo, o painel compacto de progresso fica ao lado do filtro Demandas por origem na segunda faixa da barra de ferramentas

#### Scenario: KPIs do conjunto filtrado

- **WHEN** o usuário aplica origem, busca ou filtro avançado
- **THEN** os quatro KPIs (No filtro, Em revisão, Aprovadas e Recusadas) refletem o conjunto filtrado

#### Scenario: Progresso com chamadas em estágios distintos

- **WHEN** o ciclo ativo contém chamadas em `Revisar`, `Aprovado`, `Publicar` e `Recusado`
- **THEN** o painel exibe o percentual do fluxo e as contagens de cada estágio, com a barra segmentada proporcional

#### Scenario: Percentual do fluxo

- **WHEN** o ciclo ativo tem 15 chamadas, sendo 1 aprovada e 2 publicadas
- **THEN** o painel exibe 20% (3 de 15 avançaram no fluxo), independentemente das recusadas

#### Scenario: Painel global não segue os filtros

- **WHEN** o usuário aplica um filtro de origem, busca ou filtro avançado no board
- **THEN** o painel mantém os números globais do ciclo ativo e apenas o board é refinado

#### Scenario: Acionador de recusadas

- **WHEN** há chamadas recusadas e o usuário aciona o indicador "recusadas" no painel
- **THEN** a faixa de recusadas é exibida abaixo das três colunas e o acionador passa a indicar o estado aberto

#### Scenario: Ciclo ativo vazio

- **WHEN** não há chamadas de conteúdo ativo
- **THEN** o painel exibe "Nenhuma chamada no fluxo" e os percentuais ficam zerados, sem divisão por zero

#### Scenario: Item em Publicar com pai publicado sai do ciclo

- **WHEN** uma chamada está em `Publicar` e ao menos um vínculo ativo aponta para conteúdo pai `Publicado`
- **THEN** a chamada fica fora do board por padrão e não entra no painel de progresso; ao filtrar o vínculo publicado, ela aparece na coluna Publicados

#### Scenario: Item em revisão ou aprovado com pai publicado permanece

- **WHEN** uma chamada está em `Revisar`, `Aprovado` ou `Recusado` e o conteúdo pai está `Publicado`
- **THEN** a chamada continua no board e no painel de progresso

### Requirement: O board organiza as chamadas em estágios do fluxo

A tela SHALL organizar as chamadas do ciclo ativo em um board com três colunas principais:
**1. Em Revisão** (`Revisar`), **2. Homologados** (`Aprovado`) e **3. Publicados** (`Publicar`).
Cada coluna SHALL exibir título, descrição, contagem do conjunto filtrado e os cards das chamadas.
A coluna **Publicados** SHALL conter, por padrão, apenas chamadas em `Publicar` que ainda aguardam a
publicação do conteúdo pai; quando o pai é publicado, a chamada sai do board. Quando o usuário filtra
um vínculo específico (Release Week, Manual ou Escopo), a coluna SHALL incluir também as chamadas em
`Publicar` daquele vínculo já visíveis no portal, para consulta. As chamadas `Recusado` SHALL ficar em
uma faixa separada **Recusadas**, exibida sob demanda pelo
acionador do painel de progresso. A barra de ferramentas do board SHALL seguir o padrão das demais
telas: card branco com título, subtítulo, campo de busca, seletor **Pacote de Origem** à esquerda do
botão **Filtros** (com badge de critérios ativos) e limpeza rápida. Na segunda faixa do mesmo card,
a tela SHALL oferecer as abas de origem — **Todas**, **Releases**, **Manuais** e **Escopo** — com a
contagem global de cada origem, ao lado do painel compacto de progresso. O modal de filtros SHALL
complementar com **Status**, **Tipo**, **Impacto**, **Software**, **Parceiro / Cliente**,
**Períodos de lançamento/liberação** e os vínculos específicos, com "Limpar Filtros", "Cancelar" e
"Aplicar". Quando mais de um vínculo específico (Release Week, Manual ou Escopo) for selecionado, o
board SHALL combinar os critérios por **união** (qualquer um dos vínculos), não pela interseção. A
busca SHALL operar somente sobre o texto puro das descrições, nunca sobre a marcação
HTML, e SHALL cobrir chamada, título, descrição, solução, software, módulo, menu, parceiro, tags e
códigos/nomes dos vínculos. O board SHALL distinguir ciclo vazio, estágio vazio e conjunto filtrado
sem resultados.

#### Scenario: Colunas do fluxo

- **WHEN** a tela é aberta
- **THEN** o board exibe as colunas Em Revisão, Homologados e Publicados, cada uma com sua contagem e seus cards

#### Scenario: Abas de origem

- **WHEN** o usuário aciona "Releases Week", "Manuais" ou "Projetos Escopo"
- **THEN** o board exibe apenas as chamadas com vínculo ativo naquela origem, mantendo as três colunas de estágio

#### Scenario: Filtro por vínculo publicado revela Publicados

- **WHEN** o usuário seleciona no filtro de vínculo uma Release Week, Manual ou Escopo já publicado
- **THEN** as chamadas em `Publicar` desse vínculo aparecem na coluna Publicados, com "No Portal" habilitado

#### Scenario: Múltiplos vínculos filtrados

- **WHEN** o usuário seleciona mais de uma Release Week, Manual ou Escopo no filtro de vínculos
- **THEN** o board exibe as chamadas vinculadas a qualquer um deles, incluindo as já publicadas quando os pais estão publicados

#### Scenario: Barra de ferramentas no padrão das telas

- **WHEN** o board é exibido
- **THEN** a barra de ferramentas é um card branco com título, busca e botão Filtros, como nas demais telas, e os filtros rápidos ficam abaixo dela

#### Scenario: Filtros rápidos

- **WHEN** o usuário seleciona um Pacote de Origem, um Software Atendido ou um Parceiro / Cliente
- **THEN** o board passa a exibir apenas as chamadas correspondentes

#### Scenario: Busca textual

- **WHEN** o usuário digita um termo que corresponde a chamada, título, descrição, solução, software, módulo, parceiro, tag ou vínculo
- **THEN** o board exibe apenas as chamadas correspondentes

#### Scenario: Filtros avançados

- **WHEN** o usuário aplica filtros no modal e confirma
- **THEN** o board e as contagens das colunas passam a refletir o conjunto filtrado

#### Scenario: Estágio vazio

- **WHEN** uma coluna não possui chamadas no conjunto filtrado
- **THEN** a coluna exibe "Nenhuma chamada nesta etapa."

#### Scenario: Ciclo vazio

- **WHEN** não há chamadas no ciclo ativo
- **THEN** o board exibe "Nenhuma chamada no fluxo."

#### Scenario: Filtro sem resultado

- **WHEN** há chamadas no ciclo ativo, mas os filtros ou a busca não retornam nenhuma
- **THEN** o board exibe "Nenhum resultado encontrado para o filtro."

#### Scenario: Faixa de recusadas

- **WHEN** o acionador de recusadas está ativo e há chamadas `Recusado`
- **THEN** a faixa "Recusadas" é exibida abaixo das três colunas, com os cards e a ação Reabrir

### Requirement: Os cards exibem os dados da chamada e as ações do estágio

Cada card SHALL exibir a origem, o código do vínculo, a chamada, o software, o parceiro, o título, um
resumo da descrição, as tags (até três, com contador do excedente) e, quando houver, a quantidade de
imagens de evidência. As ações SHALL variar pelo estágio: **Em Revisão** — Inspecionar, Aprovar
Chamada e Recusar; **Homologados** — Voltar p/ Revisão e Publicar Item; **Publicados** — Suspender p/
Homologado e No Portal; **Recusadas** — Inspecionar e Reabrir. As ações SHALL ser exibidas **somente
como ícones, alinhados à direita**, cada uma com tooltip e nome acessível. A ação **No Portal** SHALL
abrir a Área Pública em uma nova aba. As ações de fluxo SHALL ser exibidas conforme as permissões do
módulo e o status da chamada.

#### Scenario: Card em revisão

- **WHEN** uma chamada está em `Revisar`
- **THEN** o card exibe os ícones de Inspecionar, Aprovar e Recusar, alinhados à direita e conforme as permissões do perfil

#### Scenario: Card homologado

- **WHEN** uma chamada está em `Aprovado`
- **THEN** o card exibe Voltar p/ Revisão e Publicar Item

#### Scenario: Card publicado aguardando o pai

- **WHEN** uma chamada está em `Publicar` e nenhum vínculo ativo aponta para pai `Publicado`
- **THEN** o card exibe Suspender p/ Homologado e No Portal desabilitado, com "Aguardando pai"

#### Scenario: Item publicado com pai publicado sai do board

- **WHEN** a chamada está em `Publicar` e ao menos um vínculo ativo aponta para pai `Publicado`
- **THEN** a chamada não é exibida no board por padrão, pois já está visível na Área Pública; ao filtrar o vínculo publicado, ela reaparece em Publicados com "No Portal" habilitado

#### Scenario: Card recusado

- **WHEN** uma chamada está em `Recusado` e a faixa de recusadas está visível
- **THEN** o card exibe Inspecionar e Reabrir

#### Scenario: Sem permissão de fluxo

- **WHEN** o perfil não concede `publicar` ou `alterar`
- **THEN** as ações correspondentes não são exibidas no card

### Requirement: O item publicado só é visível no portal quando o conteúdo pai está Publicado

Um item no terceiro estágio (`Publicar`) NÃO SHALL ser considerado visível na Área Pública apenas pelo
seu próprio status: a visibilidade SHALL exigir que ao menos um vínculo ativo aponte para conteúdo pai
com status `Publicado`. A ação **No Portal** SHALL ficar desabilitada, com motivo acessível, enquanto
o conteúdo pai não estiver publicado; o card SHALL indicar **Aguardando pai** nesse caso. Quando a
visibilidade for satisfeita, o item SHALL sair do board da Esteira por padrão, permanecendo
consultável quando o vínculo publicado é filtrado. A Área Pública SHALL aplicar a mesma regra ao
listar itens. A publicação do conteúdo pai SHALL continuar sendo uma ação explícita de
Release Week, Manual ou Escopo de Projetos.

#### Scenario: Item publicado com pai publicado

- **WHEN** o item está em `Publicar` e ao menos um vínculo ativo aponta para conteúdo pai `Publicado`
- **THEN** o item é visível na Área Pública e sai do board por padrão, reaparecendo em Publicados quando o vínculo publicado é filtrado

#### Scenario: Item publicado com pai em revisão

- **WHEN** o item está em `Publicar` e todos os vínculos apontam para conteúdo pai fora de `Publicado`
- **THEN** o item não é visível na Área Pública, permanece na coluna Publicados, a ação "No Portal" fica desabilitada e o card exibe "Aguardando pai"

#### Scenario: Item aprovado com pai publicado

- **WHEN** o item está em `Aprovado` e o conteúdo pai está `Publicado`
- **THEN** o item ainda não é visível na Área Pública, pois falta o estágio `Publicar`

#### Scenario: Item com múltiplos vínculos

- **WHEN** o item está em `Publicar` e tem dois vínculos, sendo um deles `Publicado`
- **THEN** o item é visível na Área Pública pelo vínculo publicado e sai do board por padrão, reaparecendo quando o vínculo publicado é filtrado

### Requirement: O detalhe exibe a chamada, os vínculos e o histórico em modo somente leitura

A tela SHALL oferecer a ação **Inspecionar**, que abre um modal `xl` somente leitura com identificação
(chamada, título, status, origem), conteúdo (descrição completa com formatação, solução, links,
imagens e tags), classificação (tipo, impacto, módulo, software e parceiro), vínculos
(código, nome/título e status do conteúdo pai), autor e timestamps, além do **histórico da esteira**
do mais recente para o mais antigo, com o atual primeiro. O histórico SHALL exibir, para cada transição, o status anterior, o novo
status, o responsável, o perfil, o parecer, os critérios de aceite, a data/hora e o tempo no estágio.
O modal SHALL fechar por `Escape`, pelo `X` ou por "Fechar", devolvendo o foco ao acionador.

#### Scenario: Abrir detalhe

- **WHEN** o usuário aciona "Inspecionar" em uma chamada
- **THEN** o modal exibe todos os dados da chamada e os vínculos sem campos editáveis

#### Scenario: Conteúdo formatado

- **WHEN** a chamada possui descrição ou solução com formatação rica
- **THEN** o modal exibe o HTML sanitizado com a formatação preservada

#### Scenario: Histórico com transições

- **WHEN** a chamada já passou por aprovação, recusa, publicação ou reabertura
- **THEN** o histórico exibe cada transição do mais recente para o mais antigo (atual primeiro), com responsável, parecer e data

#### Scenario: Chamada sem histórico

- **WHEN** a chamada está em `Revisar` e nunca passou por uma transição
- **THEN** o modal exibe o estado vazio do histórico, sem erro

#### Scenario: Fechar detalhe

- **WHEN** o usuário pressiona `Escape`, aciona o `X` ou "Fechar"
- **THEN** o modal fecha e o foco retorna ao acionador

### Requirement: As transições da esteira registram status, parecer e histórico

A tela SHALL oferecer as ações **Aprovar**, **Recusar**, **Reabrir**, **Publicar Item** e
**Suspender**, com confirmação. **Aprovar** SHALL exigir `esteira-revisao`/`publicar` e só ser
permitida a partir de `Revisar`; **Recusar** SHALL exigir `esteira-revisao`/`alterar`, só ser
permitida a partir de `Revisar` e SHALL exigir parecer não vazio; **Reabrir** SHALL exigir
`esteira-revisao`/`alterar` e só ser permitida a partir de `Aprovado` ou `Recusado`; **Publicar
Item** SHALL exigir `esteira-revisao`/`publicar` e só ser permitida a partir de `Aprovado`;
**Suspender** SHALL exigir `esteira-revisao`/`publicar` e só ser permitida a partir de `Publicar`.
Toda transição SHALL ser atômica e SHALL gravar uma linha em `historico_esteira_revisao` com status
anterior, novo status, responsável (id, nome e perfil), parecer, critérios de aceite, tempo no
estágio e data/hora, além de atualizar o status da chamada. O critério de aceite SHALL ser registrado
como atendido no aprovar e não atendido na recusa; publicar e suspender preservam os critérios como
atendidos. **Aprovar** SHALL preservar a `data_liberacao` existente e herdar a `data_publicacao` do
conteúdo pai (Release Week, Manual ou Escopo, nesta ordem) somente quando ela estiver vazia;
**Recusar** NÃO SHALL alterar a `data_liberacao`;
**Reabrir** SHALL limpar a `data_liberacao`; **Publicar** e **Suspender** SHALL preservar a
`data_liberacao`. Se o status da chamada tiver mudado desde a abertura da ação, a transição SHALL ser
recusada com conflito e o board SHALL ser atualizado.

#### Scenario: Aprovar chamada

- **WHEN** o usuário confirma a aprovação de uma chamada em `Revisar` com os critérios atendidos
- **THEN** o status passa a `Aprovado`, a `data_liberacao` é preservada ou herdada do conteúdo pai quando vazia, o histórico registra a transição e o board é atualizado

#### Scenario: Recusar com parecer

- **WHEN** o usuário confirma a recusa de uma chamada em `Revisar` com parecer preenchido
- **THEN** o status passa a `Recusado`, a `data_liberacao` não é alterada, o histórico registra o parecer e o board é atualizado

#### Scenario: Recusar sem parecer

- **WHEN** o usuário tenta recusar sem informar o parecer
- **THEN** o formulário exibe erro no campo, mantém o modal aberto e não grava a transição

#### Scenario: Reabrir chamada

- **WHEN** o usuário confirma a reabertura de uma chamada `Aprovado` ou `Recusado`
- **THEN** o status volta a `Revisar`, a `data_liberacao` é limpa, o histórico registra a transição e o board é atualizado

#### Scenario: Publicar item

- **WHEN** o usuário confirma "Publicar Item" em uma chamada `Aprovado`
- **THEN** o status passa a `Publicar`, a `data_liberacao` é preservada, o histórico registra a transição e o card aparece em Publicados; se o pai já está `Publicado`, a chamada sai do board e fica visível na Área Pública

#### Scenario: Suspender item

- **WHEN** o usuário confirma "Suspender" em uma chamada `Publicar`
- **THEN** o status volta a `Aprovado`, a `data_liberacao` é preservada, o histórico registra a transição e o card aparece em Homologados

#### Scenario: Transição inválida para o status

- **WHEN** a chamada está em um status incompatível com a ação
- **THEN** a ação não é exibida ou fica desabilitada com o motivo acessível

#### Scenario: Conflito de status

- **WHEN** outra pessoa alterou o status da chamada antes da confirmação
- **THEN** a API responde com conflito, a tela informa que a chamada já avançou e o board é atualizado

#### Scenario: Imutabilidade do histórico

- **WHEN** uma transição é concluída
- **THEN** o histórico daquela transição não é editado nem apagado por ações da esteira

### Requirement: A interface e as APIs respeitam a matriz RBAC do módulo

A tela SHALL usar o helper reativo `.can('esteira-revisao', ação)` para exibir ou ocultar as ações:
**visualizar** (acesso à tela e ao detalhe), **publicar** (Aprovar, Publicar Item e Suspender),
**alterar** (Recusar e Reabrir), **filtrar** (Filtros) e **buscar** (campo de busca). A tela SHALL
ser acessível apenas com **visualizar**, e o item da sidebar SHALL seguir a mesma regra. As rotas da
API SHALL validar as mesmas permissões no servidor: listagem/detalhe/histórico com `visualizar`;
aprovar/publicar/suspender com `publicar`; recusar/reabrir com `alterar`; busca e filtros com
`buscar`/`filtrar` quando informados. O perfil **Revisor** SHALL poder aprovar, publicar e suspender
chamadas na esteira por possuir `publicar` nesse módulo, sem ganhar `publicar` nos módulos de
conteúdo.

#### Scenario: Perfil com visualizar e sem publicar

- **WHEN** o perfil concede `visualizar` mas não `publicar`
- **THEN** a tela abre, mas as ações "Aprovar", "Publicar Item" e "Suspender" não são exibidas

#### Scenario: Perfil sem alterar

- **WHEN** o perfil não concede `alterar`
- **THEN** as ações "Recusar" e "Reabrir" não são exibidas e as rotas correspondentes respondem `403`

#### Scenario: Perfil sem filtrar ou buscar

- **WHEN** o perfil não concede `filtrar` ou `buscar`
- **THEN** o botão de filtros ou o campo de busca correspondente não é exibido

#### Scenario: Revisor aprova e publica na esteira

- **WHEN** um usuário com perfil Revisor confirma a aprovação e depois a publicação de uma chamada
- **THEN** as transições são gravadas com sucesso e o histórico registra o perfil Revisor

#### Scenario: Sem permissão de visualizar

- **WHEN** o perfil não concede `esteira-revisao`/`visualizar`
- **THEN** o item da sidebar não é exibido e as rotas da esteira respondem `403`

### Requirement: A API da esteira expõe o board, o detalhe, o histórico e as transições

O sistema SHALL expor `GET /api/esteira-revisao` devolvendo as chamadas do ciclo ativo, as opções dos
filtros (releases, manuais, projetos, softwares e parceiros ativos) e o progresso global; `GET
/api/esteira-revisao/:id` devolvendo a chamada com contexto dos vínculos; `GET
/api/esteira-revisao/:id/historico` devolvendo o histórico; e `PUT
/api/esteira-revisao/:id/{aprovar,recusar,reabrir,publicar,suspender}` executando as transições. A
listagem SHALL rejeitar id inexistente com `404`, transição em status incompatível com `409`, falta de
permissão com `403` e falta de sessão com `401`. Toda transição bem-sucedida SHALL registrar auditoria
com o recurso **"Esteira de Revisão"** e a ação **Homologação** (aprovar/publicar) ou **Alteração**
(recusar/reabrir/suspender). A aprovação e a recusa executadas em Lançar as Chamadas SHALL usar a
mesma regra de transição e gravar o mesmo histórico.

#### Scenario: Listagem da esteira

- **WHEN** a tela carrega com `visualizar`
- **THEN** a API devolve as chamadas do ciclo ativo, as opções dos filtros e o progresso, e a tela renderiza o board e o painel

#### Scenario: Detalhe e histórico

- **WHEN** o usuário abre o detalhe de uma chamada
- **THEN** a API devolve a chamada com os vínculos e o histórico é exibido no modal

#### Scenario: Transição inexistente

- **WHEN** a API recebe aprovação, recusa, reabertura, publicação ou suspensão de um id inexistente
- **THEN** responde `404` e não altera nenhum registro

#### Scenario: Transição em status incompatível

- **WHEN** a API recebe aprovação de uma chamada que não está em `Revisar`
- **THEN** responde `409` e não altera o status nem grava histórico

#### Scenario: Auditoria da transição

- **WHEN** uma chamada é aprovada ou publicada pela esteira
- **THEN** a trilha de auditoria recebe um registro de Homologação com o recurso "Esteira de Revisão", o usuário da sessão, o IP e o identificador da chamada

#### Scenario: Transição compartilhada com Lançar as Chamadas

- **WHEN** uma chamada é aprovada ou recusada em Lançar as Chamadas
- **THEN** o mesmo histórico é gravado e a chamada aparece com o novo status na Esteira

### Requirement: A tela é utilizável em telas estreitas

A tela SHALL empilhar as três colunas do board em uma coluna em telas estreitas, manter os cards e
as ações acessíveis sem overflow horizontal, empilhar o painel de progresso e os filtros rápidos, e
manter os modais de detalhe e de decisão utilizáveis na viewport.

#### Scenario: Board em tela estreita

- **WHEN** a tela é exibida em 375px
- **THEN** as colunas ficam empilhadas, os cards permanecem legíveis e as ações continuam acessíveis

#### Scenario: Cabeçalho em tela estreita

- **WHEN** o cabeçalho é exibido em 375px
- **THEN** o painel de progresso e os filtros rápidos ficam empilhados e legíveis

#### Scenario: Modal de decisão em tela estreita

- **WHEN** o modal de decisão é aberto em 375px
- **THEN** os campos e os botões permanecem visíveis, sem overflow horizontal
