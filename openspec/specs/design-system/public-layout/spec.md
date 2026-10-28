# Public Layout Specification

## Purpose

Definir o shell da Área Pública — header, sidebar, tema claro/escuro, responsividade e
acessibilidade — para que visitantes anônimos naveguem apenas pelo conteúdo editorial publicado.

## Requirements

### Requirement: O shell público é exclusivo da Área Pública
O sistema SHALL renderizar o shell público (header + sidebar) nas rotas da Área Pública e SHALL NOT
renderizar o shell administrativo nelas. As rotas sob `/admin/**` SHALL continuar usando o shell
administrativo definido em `design-system/layout-navigation`.

#### Scenario: Raiz renderiza o shell público
- **WHEN** o visitante abre `/`
- **THEN** a página exibe o header público e a sidebar pública, sem toggle, sino, Account ou
  sidebar/rail administrativos

#### Scenario: Rota administrativa permanece com o shell administrativo
- **WHEN** o visitante abre `/admin`
- **THEN** a página exibe o shell administrativo e não exibe o header ou a sidebar públicos

#### Scenario: A vitrine de design não herda nenhum dos dois shells
- **WHEN** o visitante abre `/design`
- **THEN** a página continua renderizando com layout próprio, sem o shell público e sem o shell
  administrativo

### Requirement: O header público exibe a identidade Dicas Teorema e as ações globais
O sistema SHALL exibir no header público, à esquerda, a logomarca configurada para a tela de login
seguida do nome fixo **“Dicas Teorema”**. Sem logomarca configurada, SHALL exibir o wordmark **“Dicas
Teorema”** com o badge `Building2`, sem “Publications”. À direita, SHALL exibir, nesta ordem, o campo
de pesquisa global, o botão de tema claro/escuro e a ação **“Entrar”**, que navega para
`/admin/login`.

#### Scenario: Logomarca configurada
- **WHEN** existe uma logomarca de login configurada
- **THEN** o header exibe essa logomarca ao lado de “Dicas Teorema”

#### Scenario: Sem logomarca configurada
- **WHEN** não existe logomarca de login configurada
- **THEN** o header exibe o badge `Building2` e o wordmark “Dicas Teorema”, sem “Publications”

#### Scenario: Ordem das ações no desktop
- **WHEN** o header é renderizado em viewport de desktop
- **THEN** o campo de pesquisa, o botão de tema e a ação “Entrar” aparecem à direita, nesta ordem

#### Scenario: Ações compactas no mobile
- **WHEN** o header é renderizado abaixo de `lg`
- **THEN** a pesquisa e a ação “Entrar” são apresentadas em ícone, com nome acessível, e o menu da
  sidebar é apresentado por um botão de menu

#### Scenario: Pesquisa global sem painel de resultados
- **WHEN** o visitante usa o campo de pesquisa global
- **THEN** o campo é acessível e identificado como pesquisa da Área Pública; o painel de resultados e
  a busca server-side não fazem parte desta capability

### Requirement: O header público oferece alternância de tema exclusiva da Área Pública
O sistema SHALL oferecer no header um botão que alterna entre tema claro e escuro somente na Área
Pública. A preferência SHALL ser persistida no navegador, SHALL ser aplicada antes do primeiro paint
para evitar flash e SHALL NOT alterar o tema da Área Administrativa.

#### Scenario: Alternância de tema
- **WHEN** o visitante aciona o botão de tema
- **THEN** o shell público alterna entre claro e escuro e o rótulo acessível descreve a ação

#### Scenario: Preferência preservada
- **WHEN** o visitante recarrega a página após escolher um tema
- **THEN** o shell público inicia no tema escolhido, sem exibir o tema oposto no primeiro paint

#### Scenario: Área Administrativa intocada
- **WHEN** o visitante alterna o tema na Área Pública e depois abre `/admin`
- **THEN** o shell administrativo permanece com sua aparência atual

### Requirement: A sidebar pública organiza o conteúdo publicado em três seções
O sistema SHALL exibir na sidebar pública o atalho **“Painel de Destaques & Busca”** e, na ordem,
as seções **Releases Week**, **Manuais Mensais** e **Escopo de Projetos**.

- **Releases Week:** agrupamento em três níveis — ano, mês e release da semana. Cada release SHALL
  exibir a semana, a versão, o selo **“NOVA”** quando for destaque da semana, a quantidade de
  chamadas publicadas e o código da release quando existir.
- **Manuais Mensais:** agrupamento em dois níveis — ano e mês. Os manuais individuais NÃO SHALL ser
  aninhados na sidebar; cada mês SHALL exibir a quantidade de manuais publicados.
- **Escopo de Projetos:** agrupamento em dois níveis — projeto e sistemas contemplados. Cada projeto
  SHALL exibir versão, ano, nome, quantidade de sistemas, quantidade de chamadas publicadas e a ação
  **“Ver Tudo”**; cada sistema SHALL exibir seu nome e a quantidade de chamadas publicadas.

#### Scenario: Hierarquia de Releases Week
- **WHEN** a seção Releases Week é expandida
- **THEN** os anos, os meses e as releases aparecem na hierarquia definida, com versão, selo “NOVA”
  quando aplicável, contagem de chamadas e código da release

#### Scenario: Manuais sem terceiro nível
- **WHEN** a seção Manuais Mensais é expandida
- **THEN** apenas anos e meses são exibidos, com a contagem de manuais por mês, sem manuais
  individuais aninhados

#### Scenario: Escopo com sistemas contemplados
- **WHEN** a seção Escopo de Projetos é expandida e um projeto é aberto
- **THEN** o projeto exibe versão, ano, nome, “Ver Tudo”, total de sistemas e total de chamadas, e
  cada sistema exibe seu nome e a contagem de chamadas

#### Scenario: Contadores por seção
- **WHEN** a sidebar é renderizada
- **THEN** cada seção exibe no cabeçalho a quantidade de itens públicos que contém, inclusive quando
  a quantidade é zero

### Requirement: A sidebar pública exibe apenas conteúdo publicado
O sistema SHALL alimentar a sidebar pública por uma leitura anônima que não exige sessão e SHALL NOT
expor conteúdo em rascunho, em revisão, aprovado sem publicação efetiva, arquivado ou com
`publicado_em` futuro. As contagens de chamadas, manuais e sistemas SHALL considerar apenas o
conteúdo publicamente visível.

#### Scenario: Conteúdo não publicado não aparece
- **WHEN** uma release, um manual ou um escopo não está `Publicado`, está arquivado ou tem
  `publicado_em` futuro
- **THEN** ele não aparece na sidebar pública

#### Scenario: Chamada não publicada não entra na contagem
- **WHEN** um conteúdo pai é público, mas uma chamada filha não está `Publicado` ou tem
  `publicado_em` futuro
- **THEN** a chamada não é contada na sidebar

#### Scenario: Filhas de pai arquivado não aparecem
- **WHEN** o conteúdo pai está arquivado, mesmo que suas chamadas estejam `Publicado`
- **THEN** nem o pai nem as filhas aparecem na sidebar pública

#### Scenario: Leitura pública sem sessão
- **WHEN** um visitante anônimo carrega a Área Pública
- **THEN** a navegação pública é carregada sem exigir autenticação e sem retornar campos internos de
  autoria, revisão ou auditoria

### Requirement: A sidebar pública indica o item ativo e preserva o estado de abertura
O sistema SHALL destacar o atalho Home quando nenhuma seleção estiver ativa e SHALL destacar a
release, o mês de manual ou o sistema de escopo selecionado. Selecionar um item SHALL atualizar o
estado visual local, sem alterar a URL nesta capability. Cada seção SHALL poder ser aberta e fechada
individualmente, preservando o estado das demais.

#### Scenario: Home ativo por padrão
- **WHEN** a Área Pública é carregada sem seleção
- **THEN** o atalho “Painel de Destaques & Busca” aparece como ativo

#### Scenario: Seleção de release
- **WHEN** o visitante seleciona uma release na sidebar
- **THEN** apenas aquele card de release fica destacado e o estado visual é mantido

#### Scenario: Seleção de mês de manual
- **WHEN** o visitante seleciona um mês em Manuais Mensais
- **THEN** apenas aquele mês fica destacado, com a contagem de manuais

#### Scenario: Seleção de sistema de escopo
- **WHEN** o visitante seleciona um sistema em Escopo de Projetos
- **THEN** apenas aquele sistema fica destacado e o projeto permanece aberto

#### Scenario: Abertura independente das seções
- **WHEN** o visitante fecha uma seção
- **THEN** as demais seções mantêm seu estado de abertura

### Requirement: O shell público é responsivo e o drawer tem foco controlado
O sistema SHALL manter a sidebar fixa em `w-72` ao lado do conteúdo a partir de `lg` (1024px) e
SHALL exibi-la como drawer sobreposto abaixo de `lg`. O drawer SHALL ter backdrop, semântica de
diálogo (`role="dialog"`, `aria-modal="true"`, nome acessível), fechar com `Escape` e com clique no
backdrop, prender o foco enquanto aberto e devolver o foco ao gatilho ao fechar. Em nenhuma largura o
shell SHALL produzir overflow horizontal.

#### Scenario: Sidebar estática no desktop
- **WHEN** a viewport tem 1024px ou mais
- **THEN** a sidebar ocupa `w-72` ao lado do conteúdo e a página não tem overflow horizontal

#### Scenario: Drawer no mobile
- **WHEN** a viewport tem menos de 1024px e o visitante abre o menu
- **THEN** a sidebar aparece sobreposta com backdrop e o conteúdo permanece em largura total

#### Scenario: Fechamento do drawer
- **WHEN** o drawer está aberto e o visitante pressiona `Escape` ou clica no backdrop
- **THEN** o drawer fecha e o foco retorna ao botão de menu

#### Scenario: Foco preso
- **WHEN** o drawer está aberto e o visitante navega por `Tab`
- **THEN** o foco circula apenas entre os controles do drawer e não alcança o conteúdo de trás

### Requirement: O shell público é acessível por teclado e tecnologia assistiva
O sistema SHALL expor landmarks de header e navegação, SHALL associar os gatilhos das seções ao seu
conteúdo por `aria-expanded` e `aria-controls`, SHALL marcar o item ativo com `aria-current`, SHALL
oferecer nome acessível para a pesquisa, para o tema e para “Entrar”, e SHALL manter foco visível em
todos os controles. Nenhuma informação SHALL depender apenas de cor.

#### Scenario: Leitor de tela identifica as regiões
- **WHEN** a Área Pública é percorrida por tecnologia assistiva
- **THEN** o header e a navegação lateral são identificados e os gatilhos das seções anunciam seu
  estado aberto/fechado

#### Scenario: Item ativo anunciado
- **WHEN** um item da sidebar está ativo
- **THEN** ele expõe `aria-current` e seu estado não depende apenas da cor

#### Scenario: Ações do header nomeadas
- **WHEN** o visitante percorre o header por teclado
- **THEN** a pesquisa, o botão de tema e “Entrar” têm nomes acessíveis, mesmo quando exibidos apenas
  como ícone no mobile

#### Scenario: Foco visível
- **WHEN** qualquer controle do shell recebe foco por teclado
- **THEN** o foco é visível com o anel canônico do design system

### Requirement: O shell público trata carregamento, vazio e erro
O sistema SHALL exibir um estado de carregamento enquanto a navegação pública estiver sendo obtida,
SHALL exibir uma mensagem de estado vazio em cada seção sem conteúdo e SHALL exibir um estado de erro
com possibilidade de tentar novamente quando a leitura falhar.

#### Scenario: Carregamento inicial
- **WHEN** a Área Pública é aberta e a navegação ainda não foi carregada
- **THEN** a sidebar exibe um estado de carregamento sem quebrar o layout

#### Scenario: Seção vazia
- **WHEN** uma seção não possui conteúdo publicado
- **THEN** ela permanece acessível e exibe uma mensagem de estado vazio

#### Scenario: Falha de leitura
- **WHEN** a leitura da navegação pública falha
- **THEN** a sidebar exibe um estado de erro e permite tentar novamente
