# escopo-publico Specification

## Purpose

Permitir que visitantes anônimos consultem, por escopo de projeto e por sistema contemplado, as
chamadas publicadas e suas evidências, com cabeçalho de contexto, filtro pela sidebar e leitura
pública sem expor dados internos.

## Requirements

### Requirement: A página pública do escopo existe em /escopos/[id]
O sistema SHALL expor a página pública do escopo em `/escopos/[id]`, dentro do shell público, e SHALL
usar a query `sistema` para filtrar as chamadas pelo sistema selecionado. Sem `sistema`, a página
SHALL exibir todas as chamadas públicas do escopo. A leitura SHALL ser anônima e a página NÃO SHALL
exibir controles da Área Administrativa.

#### Scenario: Abrir com sistema selecionado
- **WHEN** o visitante abre `/escopos/{id}?sistema=ERP%20Enterprise`
- **THEN** a página é renderizada dentro do shell público com o cabeçalho do escopo e apenas as
  chamadas públicas daquele sistema

#### Scenario: Abrir sem sistema
- **WHEN** o visitante abre `/escopos/{id}`
- **THEN** a página exibe todas as chamadas públicas do escopo, sem o chip e sem a contagem do
  sistema selecionado

#### Scenario: Leitura anônima
- **WHEN** um visitante sem sessão abre a página
- **THEN** a página e as leituras públicas respondem sem exigir cookie de sessão e sem exibir
  controles administrativos

#### Scenario: Área Administrativa intocada
- **WHEN** o visitante abre `/admin/escopo-projetos`
- **THEN** a tela administrativa continua usando o shell administrativo, sem a página pública

### Requirement: A sidebar e a página compartilham a seleção pela URL
O sistema SHALL navegar para `/escopos/{id}?sistema={nome}` quando o visitante selecionar um sistema
na sidebar e para `/escopos/{id}` quando acionar **“Ver Tudo”**. A página SHALL derivar o escopo e o
sistema selecionados da URL, de modo que recarregar, compartilhar ou usar voltar/avançar preserve a
seleção. A ação **“Voltar aos Destaques”** SHALL apontar para `/`.

#### Scenario: Selecionar sistema
- **WHEN** o visitante clica em um sistema na seção Escopo de Projetos da sidebar
- **THEN** o navegador vai para `/escopos/{id}?sistema={nome}`, o projeto permanece aberto e o sistema
  fica destacado

#### Scenario: Ver Tudo
- **WHEN** o visitante aciona “Ver Tudo” no card do projeto
- **THEN** o navegador vai para `/escopos/{id}` e todas as chamadas públicas do escopo são exibidas

#### Scenario: URL direta
- **WHEN** o visitante abre diretamente `/escopos/{id}?sistema={nome}`
- **THEN** a sidebar abre o projeto correspondente e marca o sistema informado como ativo

#### Scenario: Voltar aos Destaques
- **WHEN** o visitante aciona “Voltar aos Destaques” na página do escopo
- **THEN** o navegador retorna para `/` e o atalho Home da sidebar fica ativo

#### Scenario: Navegação do navegador
- **WHEN** o visitante usa voltar ou avançar entre escopos/sistemas
- **THEN** o cabeçalho, a lista e o destaque da sidebar acompanham a URL

### Requirement: O cabeçalho apresenta os dados do escopo e as contagens públicas
O cabeçalho SHALL exibir versão, ano, nome do escopo, sistema selecionado quando houver, texto
contextual e as contagens de chamadas públicas no projeto, sistemas contemplados e chamadas públicas
no sistema selecionado. As contagens SHALL considerar apenas chamadas publicamente visíveis e SHALL
usar singular/plural correto. Sem sistema selecionado, o cabeçalho NÃO SHALL exibir a contagem
“neste sistema”.

#### Scenario: Cabeçalho com sistema
- **WHEN** a página é exibida com um sistema selecionado
- **THEN** o cabeçalho mostra versão, ano, nome do escopo, chip “Sistema: {nome}”, as três contagens e
  o texto contextual do sistema

#### Scenario: Cabeçalho sem sistema
- **WHEN** a página é exibida sem sistema
- **THEN** o cabeçalho mostra versão, ano, nome do escopo, as contagens do projeto e dos sistemas, sem
  o chip nem a contagem do sistema

#### Scenario: Contagens não incluem conteúdo não público
- **WHEN** o escopo possui chamadas em rascunho, em revisão, arquivadas ou com publicação futura
- **THEN** essas chamadas não entram em nenhuma contagem do cabeçalho

#### Scenario: Singular e plural
- **WHEN** uma contagem vale 1 ou mais de 1
- **THEN** o rótulo usa “1 chamada”, “1 sistema”, “4 chamadas” ou “5 sistemas”, conforme o valor

### Requirement: A lista exibe as chamadas públicas do escopo ou do sistema
A lista SHALL retornar apenas chamadas com `status = 'Publicado'`, `publicado_em` não nulo e não
futuro, vinculadas a um escopo `Publicado`, não arquivado e com `publicado_em` efetivo. Com `sistema`,
SHALL incluir a chamada quando qualquer software vinculado corresponder ao nome; quando não houver
vínculo N:N, SHALL usar o software principal da chamada. A lista SHALL ser ordenada por
`ordem_apresentacao` e depois por `chamada`, com seis itens por página por padrão, ajustável pelo
seletor de linhas por página do kit. Uma chamada com múltiplos
softwares SHALL aparecer no filtro de cada sistema e contar em cada sistema.

#### Scenario: Filtro por sistema
- **WHEN** o visitante seleciona um sistema
- **THEN** a lista mostra apenas chamadas públicas do escopo que tenham aquele software, inclusive
  quando ele é um dos vários softwares da chamada

#### Scenario: Sem filtro
- **WHEN** a página é aberta sem `sistema`
- **THEN** a lista mostra todas as chamadas públicas do escopo

#### Scenario: Chamada com múltiplos softwares
- **WHEN** uma chamada está vinculada a dois softwares do escopo
- **THEN** ela aparece na lista dos dois sistemas e conta em cada contagem de sistema

#### Scenario: Conteúdo não público oculto
- **WHEN** uma chamada está em rascunho, revisão, arquivada ou com publicação futura
- **THEN** ela não aparece na lista nem nas contagens

#### Scenario: Paginação
- **WHEN** o escopo ou o sistema tem mais de seis chamadas públicas
- **THEN** a lista exibe seis por página por padrão, com o `UiPagination` do kit (resumo, seletor de
  linhas por página e navegação) permitindo navegar sem duplicar ou perder itens

#### Scenario: Troca do tamanho da página
- **WHEN** o visitante altera “Linhas por página” no `UiPagination`
- **THEN** a lista recarrega com o novo tamanho e volta para a página 1, preservando o filtro de
  sistema

### Requirement: O card da chamada reúne os dados de verificação
Cada card SHALL exibir o código da chamada, o parceiro, o tipo, o impacto, os sistemas, o título, um
resumo em texto puro da descrição, a solução em texto puro, o título do manual (`manualTitulo`), as
tags e a data de liberação quando existirem. Os metadados do topo SHALL seguir a ordem: código da
chamada, parceiro, tipo, impacto e sistema(s). O card SHALL exibir, no lado direito, a data efetiva
de publicação (`publicadoEm`). O título SHALL ser apresentado em um container com o mesmo degradê do
cabeçalho de modal (`brand.primary` -> `brand.structure`) e borda esquerda accent (`brand.accent`),
com texto legível. O card SHALL exibir evidências e os links externos de manual e vídeo somente
quando existirem; o link de documentação externa SHALL usar o tratamento de ação primária do design
system. O tipo SHALL usar badge com rótulo textual; o impacto SHALL ser exibido com o valor textual;
os sistemas SHALL ser exibidos como chips de todos os softwares da chamada, sem repetição. A
descrição SHALL ser apresentada em um container com borda verde (`brand.focus`) e a solução em um
container com borda em `brand.structure`, ambos visualmente delimitados. As tags SHALL ser exibidas
à direita, precedidas do rótulo **“Tags:”**. O impacto **Crítico** SHALL receber destaque visual no card — borda base rose de 1px, cometa SVG rose percorrendo o contorno em loop de 5s e badge `critico` com `AlertTriangle` e o texto “Impacto: Crítico” —, sem depender apenas de cor. O impacto **Alto** SHALL receber o mesmo tratamento em laranja — borda base orange, cometa SVG orange no mesmo loop de 5s e badge `alto` com `Gauge` e o texto “Impacto: Alto” —, também sem depender apenas de cor. Os demais impactos SHALL permanecer com o badge neutro. Cada card
SHALL ter o `id` de âncora `chamada-{id}`; quando a URL contiver esse hash, a página SHALL abrir
rolada até o card, sem destaque adicional. O card NÃO SHALL exibir autor, revisor, status interno ou
auditoria.

#### Scenario: Card completo
- **WHEN** uma chamada tem tipo, impacto, softwares, parceiro, publicação, tags, evidências e links
- **THEN** o card exibe todos esses dados, com o código em destaque, o impacto identificado, o
  parceiro identificado e a publicação no lado direito

#### Scenario: Ordem dos metadados
- **WHEN** o topo do card é renderizado
- **THEN** os metadados aparecem na ordem código da chamada, parceiro, tipo, impacto e sistema(s),
  com a publicação no bloco da direita

#### Scenario: Publicação do escopo
- **WHEN** o escopo tem `publicadoEm`
- **THEN** o card exibe “Publicado em: {publicadoEm}”, formatado em `dd/mm/aaaa`, no lado direito

#### Scenario: Título em container
- **WHEN** o card exibe o título
- **THEN** o título aparece em um container com o degradê do cabeçalho de modal e a borda esquerda
  accent, com contraste legível

#### Scenario: Descrição e solução
- **WHEN** a chamada tem descrição e solução
- **THEN** o card exibe a descrição como resumo e a solução em um bloco próprio, ambos em texto puro

#### Scenario: Containers de descrição e solução
- **WHEN** o card exibe descrição e solução
- **THEN** a descrição aparece em um container com borda verde e a solução em um container com borda
  em `brand.structure`, visualmente delimitados

#### Scenario: Título do manual e documentação externa
- **WHEN** a chamada tem `manualTitulo` e/ou `linkManual`
- **THEN** o card exibe o título do manual quando existir e o link “Documentação Externa” com o
  tratamento de ação primária do design system quando houver link

#### Scenario: Tags alinhadas à direita
- **WHEN** a chamada tem tags
- **THEN** as tags aparecem à direita, precedidas do rótulo “Tags:”, mantendo o texto de cada tag

#### Scenario: Impacto da chamada
- **WHEN** a chamada tem impacto
- **THEN** o card exibe “Impacto: {valor}” com o valor textual, sem depender apenas de cor

#### Scenario: Destaque do impacto crítico
- **WHEN** o impacto da chamada é `Crítico`
- **THEN** o card exibe borda base rose e um cometa SVG rose percorrendo o contorno em loop de 5s, além do badge `critico` com `AlertTriangle` e “Impacto: Crítico”; os demais impactos mantêm o badge neutro

#### Scenario: Destaque do impacto alto
- **WHEN** o impacto da chamada é `Alto`
- **THEN** o card exibe borda base orange e um cometa SVG orange percorrendo o contorno no mesmo loop de 5s, além do badge `alto` com `Gauge` e “Impacto: Alto”, sem depender apenas de cor

#### Scenario: Movimento reduzido
- **WHEN** o visitante prefere movimento reduzido (`prefers-reduced-motion: reduce`)
- **THEN** o cometa não é animado e o card mantém uma borda estática de 2px na cor do impacto, com o badge e o texto do impacto preservados

#### Scenario: Ancoragem da chamada
- **WHEN** a página é aberta com `#chamada-{id}` de uma chamada publicada
- **THEN** a página abre rolada até o card correspondente, sem destaque adicional

#### Scenario: Dados opcionais ausentes
- **WHEN** a chamada não tem tags, evidências ou links
- **THEN** as seções e ações correspondentes não são renderizadas, sem espaço vazio ou link quebrado

#### Scenario: Múltiplos softwares
- **WHEN** a chamada tem mais de um software
- **THEN** todos os softwares aparecem como chips no campo “Sistema”, sem repetição

#### Scenario: Descrição em texto puro
- **WHEN** o card exibe o resumo ou a solução da chamada
- **THEN** o conteúdo é texto puro, sem interpretar HTML da descrição ou da solução

### Requirement: As evidências podem ser ampliadas em galeria
As evidências SHALL ser exibidas como miniaturas com texto alternativo e SHALL poder ser abertas em
uma galeria modal com navegação por teclado, fechamento por `Escape` e contagem “X de Y”. Sem
evidências, a seção NÃO SHALL ser renderizada.

#### Scenario: Abrir a galeria
- **WHEN** o visitante aciona uma miniatura de evidência
- **THEN** a galeria abre na imagem correspondente, com a contagem de imagens e o texto alternativo

#### Scenario: Navegar na galeria
- **WHEN** a galeria está aberta e o visitante usa as setas do teclado ou os controles de anterior e
  próxima
- **THEN** a imagem exibida muda sem fechar a galeria

#### Scenario: Fechar a galeria
- **WHEN** o visitante pressiona `Escape` ou aciona o fechamento
- **THEN** a galeria fecha e a página permanece no estado anterior

#### Scenario: Sem evidências
- **WHEN** a chamada não tem imagens
- **THEN** o bloco de evidências não é exibido

### Requirement: A leitura pública é anônima e não expõe dados internos
O sistema SHALL servir a página por `GET /api/publico/escopos/:id` e
`GET /api/publico/escopos/:id/chamadas`, sem exigir sessão. As respostas SHALL expor apenas os campos
de negócio do cabeçalho e dos cards. NÃO SHALL expor autor, revisor, feedback, status interno,
arquivamento, auditoria, caminhos físicos ou timestamps internos. As respostas SHALL usar cache
público de curta duração e SHALL responder `500` genérico em falha de banco. Escritas em
`/api/publico/**` NÃO SHALL ser liberadas.

#### Scenario: Leitura sem sessão
- **WHEN** um visitante anônimo chama os dois endpoints
- **THEN** as respostas são `200` e não exigem cookie de sessão

#### Scenario: Campos internos ausentes
- **WHEN** as respostas públicas são inspecionadas
- **THEN** não há autor, revisor, feedback, status interno, arquivamento, auditoria ou timestamp
  interno

#### Scenario: Cache público
- **WHEN** a leitura é servida com sucesso
- **THEN** a resposta inclui cache público de curta duração

#### Scenario: Falha de banco
- **WHEN** a leitura falha no banco
- **THEN** a API responde `500` genérico, sem SQL, host ou stack trace

#### Scenario: Escrita bloqueada
- **WHEN** uma requisição de escrita é enviada para `/api/publico/**`
- **THEN** ela não é liberada pelo middleware público

### Requirement: A página trata carregamento, vazio, erro e não encontrado
A página SHALL exibir carregamento com `aria-busy`, estado vazio próprio quando não houver chamadas,
erro com **“Tentar novamente”** em falha transitória e `404` quando o escopo não existir ou não for
público. Um `sistema` desconhecido SHALL produzir estado vazio com ação **“Ver todas as chamadas”**,
sem quebrar o cabeçalho.

#### Scenario: Carregamento
- **WHEN** a página é aberta pela primeira vez
- **THEN** um estado de carregamento cobre o cabeçalho e a lista, com `aria-busy`

#### Scenario: Escopo sem chamadas
- **WHEN** o escopo não tem chamadas públicas
- **THEN** a página exibe estado vazio próprio e mantém o cabeçalho

#### Scenario: Sistema sem chamadas
- **WHEN** o sistema selecionado não tem chamadas públicas
- **THEN** a lista exibe estado vazio com a ação “Ver todas as chamadas”

#### Scenario: Erro transitório
- **WHEN** a leitura falha por erro transitório
- **THEN** a página exibe erro com “Tentar novamente” e não reutiliza dados antigos

#### Scenario: Escopo não público
- **WHEN** o visitante abre um escopo inexistente, não publicado ou arquivado
- **THEN** a resposta é `404`

#### Scenario: Sistema desconhecido
- **WHEN** a URL informa um sistema que não pertence ao escopo
- **THEN** a lista fica vazia, o cabeçalho permanece íntegro e a ação “Ver todas as chamadas” é
  oferecida

### Requirement: A página é responsiva
O cabeçalho SHALL ocupar a largura total e os cards SHALL ficar em uma coluna; metadados, chips,
evidências e ações SHALL quebrar linha no mobile. Em nenhuma largura entre 320px e 1440px a página
SHALL produzir overflow horizontal. O drawer da sidebar SHALL permanecer independente.

#### Scenario: Desktop
- **WHEN** a página é exibida em 1440px ou 1280px
- **THEN** o cabeçalho ocupa a largura total, os cards ficam em uma coluna e a paginação permanece
  visível

#### Scenario: Tablet
- **WHEN** a página é exibida entre 768px e 1023px
- **THEN** o cabeçalho e os cards se adaptam sem overflow horizontal

#### Scenario: Mobile
- **WHEN** a página é exibida em 390px
- **THEN** chips, evidências e ações empilham, a paginação permanece utilizável e não há overflow
  horizontal

#### Scenario: Drawer preservado
- **WHEN** o visitante abre a sidebar no mobile
- **THEN** o drawer continua com backdrop e foco controlado, sem alterar o layout da página

### Requirement: A página é acessível
A página SHALL usar um `h1` para o escopo, `h2` para a lista e `h3` nos cards; as contagens SHALL ter
nomes acessíveis; as tags SHALL ser uma lista; as evidências SHALL ser botões com nome acessível; os
links externos SHALL abrir com `rel` seguro; o foco SHALL ser visível; o carregamento SHALL expor
`aria-busy` e a atualização da lista SHALL ser anunciada por `aria-live`. O contraste SHALL atender
AA nos temas claro e escuro e nenhuma informação SHALL depender apenas de cor.

#### Scenario: Hierarquia de títulos
- **WHEN** a página é percorrida por tecnologia assistiva
- **THEN** o escopo, a lista e cada chamada são anunciados na ordem correta

#### Scenario: Contagens anunciadas
- **WHEN** uma contagem é exibida
- **THEN** o leitor de tela anuncia o número e o rótulo correspondente

#### Scenario: Evidências e tags
- **WHEN** uma evidência ou tag é exibida
- **THEN** ela tem nome acessível e não depende apenas de cor

#### Scenario: Links externos seguros
- **WHEN** o card exibe “Documentação Externa” ou “Ver vídeo”
- **THEN** o link abre em nova aba com `rel="noopener noreferrer"`

#### Scenario: Foco e contraste
- **WHEN** qualquer controle recebe foco ou o tema escuro é ativado
- **THEN** o anel de foco canônico é visível e o contraste atende AA

### Requirement: O contrato da API é estável e normaliza parâmetros
`GET /api/publico/escopos/:id` SHALL retornar o escopo com `id`, `codigo`, `nome`, `versao`, `ano`,
`chamadas`, `sistemas` e `publicadoEm`. `GET /api/publico/escopos/:id/chamadas` SHALL aceitar
`sistema`, `pagina` e `porPagina` e retornar `itens`, `total`, `pagina`, `porPagina` e
`sistemaSelecionado`. `pagina` inválida SHALL virar 1; `porPagina` SHALL ter padrão 6 e máximo 50;
`sistema` desconhecido SHALL produzir resultado vazio; `id` inexistente ou não público SHALL
responder `404`; parâmetros inválidos NÃO SHALL causar erro de servidor.

#### Scenario: Contrato do escopo
- **WHEN** `GET /api/publico/escopos/:id` responde
- **THEN** o corpo contém `id`, `codigo`, `nome`, `versao`, `ano`, `chamadas`, `sistemas` e
  `publicadoEm`

#### Scenario: Contrato das chamadas
- **WHEN** `GET /api/publico/escopos/:id/chamadas?pagina=2` responde
- **THEN** o corpo contém `itens`, `total`, `pagina`, `porPagina` e `sistemaSelecionado`, com no
  máximo seis itens por padrão

#### Scenario: Paginação limitada
- **WHEN** `porPagina` é maior que 50
- **THEN** a API limita o tamanho ao máximo permitido

#### Scenario: Parâmetros inválidos
- **WHEN** `pagina` não é numérica
- **THEN** a API normaliza a página para 1, sem erro de servidor

#### Scenario: Sistema desconhecido
- **WHEN** `sistema` não pertence ao escopo
- **THEN** a API retorna lista vazia, sem erro de servidor

#### Scenario: Escopo não público
- **WHEN** o `id` não existe ou o escopo não é público
- **THEN** a API responde `404`
