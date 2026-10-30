# painel-publico Specification

## Purpose

Definir o painel de entrada da Área Pública que reúne a release da semana, os manuais em destaque, o escopo de projeto com chamadas críticas, as releases mais acessadas e o histórico filtrável de publicações.

## Requirements

### Requirement: O Painel de Destaques é a entrada da Área Pública

O sistema SHALL renderizar o **Painel de Destaques** em `/`, dentro do shell público existente, com o
título **“Painel de Destaques & Busca”** e as seções, nesta ordem: **Última Release Liberada da
Semana**, **Manuais em Destaque dessa Semana**, **Releases Mais Vistas**, **Escopo de Projeto** e
**Histórico de Releases Week**. O atalho **“Painel de Destaques & Busca”** da sidebar SHALL permanecer
ativo (`aria-current="page"`) quando nenhuma seleção estiver ativa. O painel SHALL ser somente
leitura, anônimo e NÃO SHALL exibir controles da Área Administrativa.

#### Scenario: Abrir a raiz

- **WHEN** o visitante abre `/`
- **THEN** o painel é renderizado dentro do shell público, com o título e as cinco seções na ordem
  definida

#### Scenario: Atalho Home ativo

- **WHEN** o painel é exibido sem seleção na sidebar
- **THEN** o atalho “Painel de Destaques & Busca” aparece como ativo e não há controles administrativos

#### Scenario: Área Administrativa intocada

- **WHEN** o visitante abre `/admin`
- **THEN** o shell e o conteúdo administrativos continuam como antes, sem o painel público

### Requirement: O painel exibe a última release liberada da semana

O painel SHALL exibir no topo a release publicada com `destaque_semana = 1` mais recente por
`publicado_em`. Sem release marcada, SHALL usar a release publicada mais recente e trocar o rótulo
para **“Última Release Publicada”**. A seção SHALL exibir semana, ano, versão, código da release,
data efetiva de publicação (`publicado_em`), título, descrição, contagem de visualizações quando
maior que zero e o crédito **“Aprovado pelo revisor técnico”** com `revisor_nome` quando existir. A
seção SHALL exibir até três chamadas publicadas da release, ordenadas por `ordem_apresentacao`, com
`chamada`, `titulo`, `software`, `modulo`, `tipo`, `parceiro` e a contagem de fotos quando maior que
zero. O CTA **“Ver release completa”** SHALL apontar para `/releases/{id}`. Sem release publicada, a
seção SHALL exibir um estado vazio próprio, sem CTA.

#### Scenario: Release em destaque

- **WHEN** existe uma release publicada com `destaque_semana = 1`
- **THEN** o hero exibe essa release com o rótulo de destaque, semana, versão, release, data, título e descrição

#### Scenario: Fallback sem destaque

- **WHEN** nenhuma release publicada tem `destaque_semana = 1`
- **THEN** o hero exibe a release publicada mais recente e o rótulo “Última Release Publicada”

#### Scenario: Chamadas do hero

- **WHEN** a release em destaque possui mais de três chamadas publicadas
- **THEN** o hero exibe apenas as três primeiras por `ordem_apresentacao` e o CTA leva à release completa

#### Scenario: Dados opcionais do hero

- **WHEN** a release tem visualizações, revisor ou chamadas com fotos
- **THEN** a seção exibe a contagem de visualizações, o crédito do revisor e a contagem de fotos de cada chamada; quando ausentes, esses elementos não são exibidos

#### Scenario: Sem release publicada

- **WHEN** não há release publicada
- **THEN** o hero exibe um estado vazio próprio e não exibe CTA

### Requirement: Os manuais em destaque são apresentados por item

O painel SHALL exibir até dois cards de **itens publicados** vinculados a manuais com
`destaque_semana = 1`, sem repetir o mesmo item, priorizando itens que possuem link de vídeo ou link
de manual. Cada card SHALL exibir o software, o módulo, o mês/ano, o título, a descrição e o tipo do
item. O card SHALL oferecer **“Ver vídeo”** quando houver `link_video`, **“Manual online”** quando
houver `link_manual` e **“Ler conteúdo”** apontando para `/manuais/{manualId}/itens/{itemId}`. Quando
o manual em destaque não tiver item publicado, o painel SHALL exibir um card de fallback do catálogo
mensal com título, descrição e **“Ler conteúdo”** apontando para `/manuais/{id}`. Sem manuais em
destaque, a seção SHALL exibir um estado vazio próprio.

#### Scenario: Card por item

- **WHEN** um manual em destaque tem itens publicados
- **THEN** o card usa o título, a descrição, o software, o módulo, o mês/ano e o tipo do item

#### Scenario: Ações do item

- **WHEN** o item tem link de vídeo e link de manual
- **THEN** o card exibe “Ver vídeo” e “Manual online” com os destinos correspondentes, além de “Ler conteúdo”

#### Scenario: Ação ausente

- **WHEN** o item não tem link de vídeo ou de manual
- **THEN** a ação correspondente não é exibida, sem espaço vazio ou link quebrado

#### Scenario: Fallback do catálogo

- **WHEN** o manual em destaque não tem item publicado
- **THEN** o card exibe o catálogo mensal e “Ler conteúdo” aponta para `/manuais/{id}`

#### Scenario: Sem manuais em destaque

- **WHEN** não há manual publicado com `destaque_semana = 1`
- **THEN** a seção exibe um estado vazio próprio

### Requirement: As releases mais vistas têm fallback para recentes

O painel SHALL exibir até três releases publicadas, excluindo a release do hero. Quando ao menos uma
release tiver `total_visualizacoes > 0`, a seção SHALL se chamar **“Releases Mais Vistas”**, ordenar
por visualizações decrescentes e usar `publicado_em` decrescente como desempate; se houver menos de
três releases com visualizações, SHALL completar com as mais recentes. Quando nenhuma release tiver
visualizações, a seção SHALL se chamar **“Releases Recentes”**, ordenar por `publicado_em` decrescente
e ocultar a contagem de visualizações. Cada item SHALL exibir semana/ano, título, descrição, quantidade
de chamadas, data efetiva e visualizações apenas quando maiores que zero, com CTA para
`/releases/{id}`. Sem releases disponíveis, a seção SHALL exibir um estado vazio próprio.

#### Scenario: Ranking por visualizações

- **WHEN** existem releases com visualizações e a release do hero tem o maior valor
- **THEN** o hero não aparece no ranking e as três releases seguintes são exibidas por visualizações decrescentes

#### Scenario: Todas sem visualizações

- **WHEN** nenhuma release publicada tem visualizações
- **THEN** a seção passa a se chamar “Releases Recentes”, ordena por data e não exibe contagem de visualizações

#### Scenario: Ranking parcial

- **WHEN** apenas uma release tem visualizações
- **THEN** ela aparece primeiro e as demais posições são completadas com as releases mais recentes, sem contagem de visualizações para elas

#### Scenario: Sem releases

- **WHEN** não há release publicada além do hero
- **THEN** a seção exibe um estado vazio próprio

### Requirement: O histórico de releases é filtrável e paginado

O painel SHALL exibir o **Histórico de Releases Week** com todas as releases publicadas, ordenadas por
`publicado_em` decrescente, em páginas de seis itens. O histórico SHALL oferecer os filtros
**Software** e **Tipo**, com opções derivadas apenas de chamadas publicadas, combinados com E lógico.
O filtro de software SHALL selecionar releases que tenham ao menos uma chamada publicada daquele
software; o filtro de tipo SHALL selecionar releases que tenham ao menos uma chamada publicada
daquele tipo. As contagens exibidas em cada card SHALL refletir todas as chamadas publicadas da
release, independentemente do filtro ativo. Cada card SHALL exibir semana/ano, versão, código da
release, título, descrição, contagens de correções, melhorias e novas funcionalidades, data efetiva,
visualizações quando maiores que zero e CTA para `/releases/{id}`. Os filtros e a página SHALL ser
refletidos na URL (`software`, `tipo`, `pagina`); alterar um filtro SHALL voltar à primeira página.
A ação **“Carregar mais”** SHALL anexar a página seguinte sem duplicar itens. Sem resultados, o
histórico SHALL exibir um estado vazio com a ação **“Limpar filtros”**.

#### Scenario: Histórico padrão

- **WHEN** o histórico é aberto sem filtros
- **THEN** as releases aparecem por data decrescente, seis por página, com as contagens por tipo

#### Scenario: Filtro por software

- **WHEN** o visitante seleciona um software
- **THEN** o histórico exibe apenas releases com ao menos uma chamada publicada daquele software e volta à primeira página

#### Scenario: Filtro por tipo

- **WHEN** o visitante seleciona “Correção”, “Melhoria” ou “Nova Funcionalidade”
- **THEN** o histórico exibe apenas releases com ao menos uma chamada publicada daquele tipo

#### Scenario: Contagens não são filtradas

- **WHEN** o filtro de tipo está ativo
- **THEN** os cards continuam exibindo as contagens de todos os tipos publicados da release

#### Scenario: URL preserva filtros

- **WHEN** o visitante aplica filtros e recarrega ou compartilha a URL
- **THEN** os filtros e a página são restaurados a partir de `software`, `tipo` e `pagina`

#### Scenario: Carregar mais

- **WHEN** há mais de seis releases no resultado
- **THEN** “Carregar mais” anexa a página seguinte sem repetir itens já exibidos

#### Scenario: Sem resultados

- **WHEN** nenhum resultado corresponde aos filtros
- **THEN** o histórico exibe o estado vazio com “Limpar filtros”, que restaura a primeira página sem filtros

### Requirement: O painel exibe o último escopo de projeto liberado

O painel SHALL exibir a seção **“Escopo de Projeto”** antes do Histórico de Releases Week, com o
escopo publicado mais recente por `publicado_em` (desempate por `ano` e `versao`, ambos decrescentes).
A seção SHALL exibir código, nome, versão, ano, data efetiva de publicação (`publicadoEm`), total de
chamadas publicadas e os sistemas contemplados com suas contagens. O CTA **“Ver escopo completo”**
SHALL apontar para `/escopos/{id}`. Sem escopo publicado, a seção NÃO SHALL ser renderizada.

#### Scenario: Último escopo por data de publicação

- **WHEN** existem dois ou mais escopos publicados
- **THEN** a seção exibe o escopo com `publicadoEm` mais recente

#### Scenario: Desempate por ano e versão

- **WHEN** dois escopos publicados têm a mesma data efetiva de publicação
- **THEN** a seção exibe o de maior ano e, em seguida, a maior versão

#### Scenario: Dados do escopo

- **WHEN** o escopo em destaque tem versão, ano, chamadas e sistemas publicados
- **THEN** a seção exibe código, nome, versão, ano, data de publicação, total de chamadas e os
  sistemas com suas contagens

#### Scenario: CTA do escopo

- **WHEN** o visitante aciona “Ver escopo completo”
- **THEN** a navegação leva para `/escopos/{id}` do escopo em destaque

#### Scenario: Sem escopo publicado

- **WHEN** não há escopo publicado
- **THEN** a seção “Escopo de Projeto” não é renderizada, sem espaço vazio, e as demais seções do
  painel continuam íntegras

### Requirement: O painel exibe as chamadas críticas do escopo em destaque

O painel SHALL exibir, na seção de Escopo de Projeto, o card **“Chamadas críticas”** com até três
chamadas publicadas do escopo em destaque cujo `impacto` seja `Crítico`, ordenadas por
`ordem_apresentacao` e depois por `chamada`. Cada chamada SHALL exibir código, título, sistema(s) e
parceiro; a chamada SHALL usar o badge `critico` com `AlertTriangle` e o texto **“Impacto: Crítico”**,
sem depender apenas de cor. Cada item SHALL abrir `/escopos/{id}` do escopo correspondente. Sem
chamadas críticas publicadas, o card NÃO SHALL ser renderizado, mantendo o card do escopo visível.

#### Scenario: Lista de críticas

- **WHEN** o escopo em destaque tem chamadas publicadas com impacto `Crítico`
- **THEN** o card exibe até três delas por `ordem_apresentacao`, com código, título, sistema(s),
  parceiro e o badge crítico

#### Scenario: Mais de três críticas

- **WHEN** o escopo tem mais de três chamadas críticas publicadas
- **THEN** o card exibe apenas as três primeiras pela ordenação definida

#### Scenario: Sem chamadas críticas

- **WHEN** o escopo em destaque não tem chamada publicada com impacto `Crítico`
- **THEN** o card “Chamadas críticas” não é renderizado e o card do escopo permanece visível

#### Scenario: Dados opcionais da crítica

- **WHEN** a chamada crítica não tem parceiro ou sistema publicado
- **THEN** o item omite o dado ausente, sem espaço vazio ou rótulo quebrado

#### Scenario: Impacto não depende de cor

- **WHEN** uma chamada crítica é exibida
- **THEN** o texto “Impacto: Crítico” e o ícone `AlertTriangle` acompanham a cor rose

### Requirement: A leitura pública do painel é anônima e obedece ao gate de visibilidade

O sistema SHALL servir a leitura do painel por `GET /api/publico/painel` e
`GET /api/publico/releases`, sem exigir sessão. As duas leituras SHALL aplicar o gate público tanto
ao conteúdo pai quanto às chamadas: `status = 'Publicado'`, `arquivada = 0`, `publicado_em IS NOT
NULL` e `publicado_em <= NOW(6)`. Rascunho, revisão, aprovação sem publicação efetiva, arquivamento e
publicação futura NÃO SHALL aparecer. O escopo em destaque e as chamadas críticas SHALL obedecer ao
mesmo gate de visibilidade. Uma chamada com `origem = 'Ambos'` PODE aparecer na release e no manual
correspondentes; isso não é duplicidade. As respostas SHALL usar cache público de curta duração e
SHALL responder `500` genérico em falha de banco, sem detalhe de infraestrutura. Escritas em
`/api/publico/**` NÃO SHALL ser liberadas.

#### Scenario: Leitura sem sessão

- **WHEN** um visitante anônimo chama `GET /api/publico/painel` ou `GET /api/publico/releases`
- **THEN** a resposta é `200` e não exige cookie de sessão

#### Scenario: Conteúdo não publicado não aparece

- **WHEN** uma release, um manual, um escopo ou uma chamada está em rascunho, em revisão, arquivado
  ou com publicação futura
- **THEN** o conteúdo não aparece no painel nem nas contagens

#### Scenario: Escopo não publicado

- **WHEN** um escopo está em rascunho, arquivado ou com publicação futura
- **THEN** ele não aparece na seção de Escopo de Projeto nem no card de chamadas críticas

#### Scenario: Chamada filha não publicada

- **WHEN** a release é pública, mas uma chamada filha não está publicada
- **THEN** a chamada não aparece no hero, nos manuais nem nas contagens do histórico

#### Scenario: Conteúdo com dois vínculos

- **WHEN** uma chamada tem vínculo com release e manual
- **THEN** ela pode aparecer nas duas seções, sem ser tratada como duplicidade

#### Scenario: Cache público

- **WHEN** a leitura é servida com sucesso
- **THEN** a resposta inclui cache público de curta duração, sem armazenar dados internos

#### Scenario: Falha de banco

- **WHEN** a leitura falha no banco
- **THEN** a API responde `500` genérico, sem expor SQL, host ou stack trace

### Requirement: O contrato público do painel não expõe dados internos

As respostas públicas SHALL expor apenas os campos de negócio necessários ao painel: identificadores
públicos, semana, ano, mês, versão, código da release, título, descrição, tipo, software, módulo,
parceiro, chamada, data efetiva, visualizações, contagem de fotos, links de vídeo/manual e
`revisorNome`. Para o escopo em destaque, SHALL expor identificador público, código, nome, versão,
ano, data efetiva, total de chamadas e sistemas com contagens. Para as chamadas críticas, SHALL expor
identificador público, código da chamada, título, sistema(s), parceiro, tipo e impacto. As respostas
NÃO SHALL expor `autor_id`, `autor_nome`, `revisor_id`, `revisor_feedback`, status interno,
arquivamento, trilha de auditoria, anexos completos, caminhos físicos ou timestamps internos. O
crédito do revisor SHALL aparecer apenas quando `revisor_nome` existir. Links externos de vídeo e
manual SHALL ser servidos como URL e abertos com atributos de segurança pela interface.

#### Scenario: Campos permitidos

- **WHEN** o painel recebe a resposta pública
- **THEN** os cards conseguem exibir título, descrição, tipo, software, módulo, parceiro, chamada,
  fotos, links, revisor, escopo em destaque e chamadas críticas

#### Scenario: Campos internos ausentes

- **WHEN** a resposta pública é inspecionada
- **THEN** não há autor, feedback de revisor, IDs internos, auditoria, anexos completos ou timestamps
  internos

#### Scenario: Escopo e críticas sem dados internos

- **WHEN** a seção de Escopo de Projeto é inspecionada
- **THEN** ela expõe apenas os campos públicos do escopo e das chamadas críticas, sem autor, revisor,
  feedback, status interno ou caminhos físicos

#### Scenario: Revisor opcional

- **WHEN** a release não tem `revisor_nome`
- **THEN** o crédito do revisor não é exibido e o restante do hero permanece íntegro

#### Scenario: Link externo seguro

- **WHEN** o card exibe “Ver vídeo” ou “Manual online”
- **THEN** o link usa a URL pública e é aberto com `rel` seguro, sem expor caminho interno

### Requirement: O painel trata carregamento, vazio e erro

O painel SHALL exibir estado de carregamento na carga inicial, sem renderizar números parciais. Cada
seção SHALL ter estado vazio próprio quando não houver conteúdo, exceto a seção de Escopo de Projeto,
que NÃO SHALL ser renderizada quando não houver escopo publicado; nesse caso o card de chamadas
críticas também não é exibido. Com escopo publicado e sem chamadas críticas, apenas o card do escopo
é exibido. A falha da leitura principal SHALL exibir um estado de erro com **“Tentar novamente”**, sem
manter dados antigos. A falha da leitura do histórico SHALL ficar restrita ao histórico, mantendo o
hero, os manuais, o ranking e o escopo utilizáveis. A troca de filtros SHALL exibir carregamento apenas
na lista do histórico e manter os controles utilizáveis.

#### Scenario: Carga inicial

- **WHEN** o painel é aberto pela primeira vez
- **THEN** um estado de carregamento cobre as seções até a leitura responder, sem números parciais

#### Scenario: Falha principal

- **WHEN** `GET /api/publico/painel` falha
- **THEN** o painel exibe erro com “Tentar novamente” e não reutiliza dados de uma carga anterior

#### Scenario: Falha do histórico

- **WHEN** `GET /api/publico/releases` falha
- **THEN** apenas o histórico exibe erro com “Tentar novamente”; as demais seções continuam visíveis

#### Scenario: Seções vazias

- **WHEN** uma seção não tem conteúdo publicado
- **THEN** ela exibe seu estado vazio sem quebrar o layout das demais, exceto a seção de Escopo de
  Projeto, que é omitida

#### Scenario: Sem escopo publicado

- **WHEN** não há escopo publicado
- **THEN** a seção de Escopo de Projeto não ocupa espaço e o histórico continua acessível

#### Scenario: Escopo sem críticas

- **WHEN** há escopo em destaque, mas nenhuma chamada crítica publicada
- **THEN** somente o card do escopo é exibido, sem card vazio de críticas

### Requirement: O painel é responsivo

O painel SHALL manter o hero em largura total, os manuais e o ranking em duas colunas proporcionais no
desktop e empilhados abaixo de `lg`, e o histórico em três colunas no desktop, duas em tablet e uma
no mobile. A seção de Escopo de Projeto SHALL exibir o card do escopo e o card de chamadas críticas
lado a lado no desktop e empilhados abaixo de `lg`. Em nenhuma largura entre 320px e 1440px o painel
SHALL produzir overflow horizontal. Os chips SHALL quebrar linha, os filtros SHALL empilhar no mobile
e os alvos de toque SHALL ter no mínimo 44x44 no mobile. O drawer da sidebar pública SHALL continuar
independente do painel.

#### Scenario: Desktop

- **WHEN** o painel é exibido em 1440px ou 1280px
- **THEN** o hero ocupa a largura total, manuais e ranking ficam lado a lado, a seção de Escopo de
  Projeto mostra os dois cards lado a lado e o histórico usa três colunas

#### Scenario: Tablet

- **WHEN** o painel é exibido entre 768px e 1023px
- **THEN** manuais e ranking ficam empilhados, a seção de Escopo de Projeto empilha os cards e o
  histórico usa duas colunas

#### Scenario: Mobile

- **WHEN** o painel é exibido em 390px
- **THEN** todas as seções empilham, os filtros ocupam a largura disponível e não há overflow
  horizontal

#### Scenario: Drawer preservado

- **WHEN** o visitante abre a sidebar no mobile
- **THEN** o drawer continua com backdrop e foco controlado, sem alterar o layout do painel

### Requirement: O painel é acessível

O painel SHALL usar um `h1` com o título **“Painel de Destaques & Busca”** e um `h2` por seção,
associado ao conteúdo por `aria-labelledby`. Cada card SHALL ser um artigo com título `h3`. A seção de
Escopo de Projeto SHALL usar `h2` “Escopo de Projeto” e `h3` para o escopo e para o card “Chamadas
críticas”. Os links de CTA SHALL ter nomes acessíveis que incluam a semana, o título do item ou o nome
do escopo. Os badges de tipo e o impacto crítico NÃO SHALL depender apenas de cor; o rótulo textual
SHALL estar presente. A contagem de visualizações SHALL ter nome acessível (“1.434 visualizações”).
Os filtros SHALL ter rótulos visíveis, o resultado SHALL ser anunciado por `aria-live` e o
carregamento SHALL expor `aria-busy`. O foco SHALL ser visível com o anel canônico do design system, a
ordem de tabulação SHALL seguir hero, manuais, ranking, escopo, críticas, filtros e cards do
histórico, e o contraste SHALL atender AA nos temas claro e escuro.

#### Scenario: Hierarquia de títulos

- **WHEN** o painel é percorrido por tecnologia assistiva
- **THEN** o título da página e cada seção são anunciados na ordem correta, com os cards como
  subseções

#### Scenario: Tipo não depende de cor

- **WHEN** um badge de tipo é exibido
- **THEN** o texto “Correção”, “Melhoria” ou “Nova Funcionalidade” está presente, além da cor e do
  ícone

#### Scenario: Escopo e críticas acessíveis

- **WHEN** a seção de Escopo de Projeto é percorrida por tecnologia assistiva
- **THEN** o escopo e cada chamada crítica têm nome acessível com o código e o título, e o impacto
  crítico é anunciado como “Impacto: Crítico”

#### Scenario: Visualizações anunciadas

- **WHEN** a contagem de visualizações é exibida
- **THEN** o leitor de tela anuncia o número e o rótulo “visualizações”

#### Scenario: Filtros e resultados

- **WHEN** o visitante altera um filtro
- **THEN** o resultado é anunciado por `aria-live` e o foco permanece no controle utilizado

#### Scenario: Foco visível

- **WHEN** qualquer link, botão ou filtro recebe foco por teclado
- **THEN** o anel de foco canônico é exibido e a ordem de tabulação é previsível

#### Scenario: Tema escuro

- **WHEN** o painel é exibido no tema escuro
- **THEN** os cards, chips, textos e contadores mantêm contraste AA e não herdam cores administrativas

### Requirement: A API do painel e do histórico tem contrato estável

`GET /api/publico/painel` SHALL retornar `releaseDestaque`, `manuaisDestaque`, `maisVistas`,
`modoMaisVistas` (`vistas` ou `recentes`), `filtros` com as opções de software e tipo,
`escopoDestaque` (ou `null`) e `chamadasCriticas` (lista, possivelmente vazia).
`GET /api/publico/releases` SHALL aceitar `software`, `tipo`, `pagina` e `porPagina` e retornar os
itens da página, o total, a página e o tamanho da página. `porPagina` SHALL ter padrão 6 e limite
máximo 50; `pagina` inválida SHALL ser normalizada para 1; `tipo` fora do enum SHALL ser ignorado;
`software` desconhecido SHALL produzir resultado vazio. A resposta do histórico SHALL conter apenas
a página solicitada e as contagens agregadas por tipo, sem enviar todas as chamadas. As opções de
filtro SHALL ser derivadas apenas de conteúdo publicado.

#### Scenario: Contrato do painel

- **WHEN** `GET /api/publico/painel` responde
- **THEN** o corpo contém `releaseDestaque`, `manuaisDestaque`, `maisVistas`, `modoMaisVistas`,
  `filtros`, `escopoDestaque` e `chamadasCriticas`

#### Scenario: Contrato do escopo em destaque

- **WHEN** há escopo publicado
- **THEN** `escopoDestaque` contém id, código, nome, versão, ano, data efetiva, chamadas e sistemas, e
  `chamadasCriticas` contém no máximo três itens com código, título, sistema(s), parceiro, tipo e
  impacto

#### Scenario: Painel sem escopo

- **WHEN** não há escopo publicado
- **THEN** `escopoDestaque` é `null` e `chamadasCriticas` é uma lista vazia, sem erro

#### Scenario: Contrato do histórico

- **WHEN** `GET /api/publico/releases?pagina=2` responde
- **THEN** o corpo contém `itens`, `total`, `pagina` e `porPagina`, com no máximo seis itens por padrão

#### Scenario: Paginação limitada

- **WHEN** `porPagina` é maior que 50
- **THEN** a API limita o tamanho ao máximo permitido e não materializa o histórico inteiro

#### Scenario: Parâmetros inválidos

- **WHEN** `pagina` não é numérica ou `tipo` está fora do enum
- **THEN** a API normaliza a página para 1 e ignora o tipo inválido, sem erro de servidor

#### Scenario: Opções de filtro publicadas

- **WHEN** existem softwares ou tipos apenas em conteúdo não publicado
- **THEN** eles não aparecem nas opções de filtro do painel
