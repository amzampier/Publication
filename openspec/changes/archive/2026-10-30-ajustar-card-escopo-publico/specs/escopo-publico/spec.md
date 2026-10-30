# Spec Delta

## MODIFIED Requirements

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
à direita, precedidas do rótulo **“Tags:”**. O impacto **Crítico** SHALL receber destaque visual no
card — moldura rose com barra de 4px na borda esquerda (acompanhando os cantos superior e inferior),
anel/sombra e badge de alerta com `AlertTriangle` e o texto “Impacto: Crítico” —, sem depender apenas
de cor; os demais impactos SHALL permanecer com o badge neutro. O
card NÃO SHALL exibir autor, revisor, status interno ou auditoria.

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
- **THEN** o card recebe moldura rose com barra de 4px na borda esquerda, anel/sombra e badge
  `critico` com `AlertTriangle` e
  “Impacto: Crítico”; os demais impactos mantêm o badge neutro

#### Scenario: Dados opcionais ausentes
- **WHEN** a chamada não tem tags, evidências ou links
- **THEN** as seções e ações correspondentes não são renderizadas, sem espaço vazio ou link quebrado

#### Scenario: Múltiplos softwares
- **WHEN** a chamada tem mais de um software
- **THEN** todos os softwares aparecem como chips no campo “Sistema”, sem repetição

#### Scenario: Descrição em texto puro
- **WHEN** o card exibe o resumo ou a solução da chamada
- **THEN** o conteúdo é texto puro, sem interpretar HTML da descrição ou da solução
