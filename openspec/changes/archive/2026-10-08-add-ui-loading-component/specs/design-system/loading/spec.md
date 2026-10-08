# Spec Delta

## Purpose

Definir o contrato do componente de carregamento `UiLoading` do design system — overlay com
backdrop, caixa com borda em degradê giratório, ícone girando, mensagem explicando a operação e
barra de progresso opcional com contador —
para que código, vitrine `/design` e documentação (`docs/01` §5.17) observem o mesmo
comportamento de feedback de processamento.

## ADDED Requirements

### Requirement: O UiLoading abre como overlay com backdrop, caixa, ícone e mensagem
O sistema SHALL renderizar o `UiLoading` como um overlay de tela cheia composto por um backdrop
escuro translúcido cobrindo a viewport e uma caixa centralizada contendo uma linha com um ícone de
loading girando à esquerda e a mensagem que explica a operação em andamento à direita — e, quando
o consumidor informa progresso (`current`/`total`), um bloco opcional abaixo dessa linha com a
barra e o contador (requisito "Barra de progresso opcional com contador" abaixo).

#### Scenario: Abertura do overlay
- **WHEN** o consumidor monta o `UiLoading` (ex.: `v-if` verdadeiro) durante uma operação
- **THEN** o backdrop cobre a viewport inteira e a caixa aparece centralizada na tela, com o ícone
  à esquerda e a mensagem à direita

#### Scenario: Mensagem padrão quando não informada
- **WHEN** o componente é montado sem informar mensagem
- **THEN** a caixa exibe a mensagem padrão "Carregando…"

#### Scenario: Mensagem personalizada
- **WHEN** o consumidor informa a mensagem "Importando 1.240 registros de usuários…"
- **THEN** a caixa exibe exatamente esse texto ao lado do ícone

#### Scenario: Ícone permanece girando
- **WHEN** o overlay permanece aberto
- **THEN** o ícone de loading gira continuamente enquanto a operação não termina

### Requirement: A borda da caixa exibe degradê giratório na ordem das cores da marca
O sistema SHALL desenhar a borda da caixa do `UiLoading` com um degradê das cores de marca
**`#112051` (Navy) → `#0364f7` (Estrutural) → `#4ed813` (Accent)** na exata ordem informada,
girando continuamente ao redor da caixa enquanto o overlay está aberto.

#### Scenario: Ordem das cores no degradê
- **WHEN** o overlay é renderizado
- **THEN** a borda percorre as três cores na ordem Navy → Estrutural → Accent, sem troca de ordem
  nem cores extras

#### Scenario: Rotação contínua da borda
- **WHEN** o overlay permanece aberto
- **THEN** o degradê gira ao redor da caixa de forma contínua, sem piscar nem alternar para cor
  sólida

#### Scenario: Sem hex de marca dentro do componente
- **WHEN** o código de `app/components/ui/Loading.vue` é inspecionado
- **THEN** não há hex de marca embutido em estilo inline ou classe arbitrária (as cores vivem fora
  do componente, na folha de estilo do projeto)

### Requirement: O overlay fica acima dos modais e não é fechável pelo usuário
O sistema SHALL montar o `UiLoading` em camada superior aos modais (`UiModal`), de modo que fique
visível sobre qualquer diálogo aberto, e SHALL mantê-lo aberto até que o próprio consumidor o
remova — o clique no backdrop e a tecla `Escape` não o fecham.

#### Scenario: Loading sobre modal aberto
- **WHEN** um `UiModal` está aberto e o consumidor monta o `UiLoading`
- **THEN** o backdrop e a caixa do loading aparecem por cima do modal, que permanece por baixo

#### Scenario: Backdrop e Escape não fecham
- **WHEN** o overlay está aberto e o usuário clica no backdrop ou pressiona `Escape`
- **THEN** o overlay permanece visível e a operação continua em andamento

#### Scenario: Interação e rolagem bloqueadas
- **WHEN** o overlay está aberto
- **THEN** os cliques não alcançam os controles da página subjacente e a rolagem do documento
  fica bloqueada enquanto o loading existir

#### Scenario: Toast disparado durante o loading
- **WHEN** um toast é disparado enquanto o overlay está aberto
- **THEN** o toast fica atrás do backdrop até o loading ser removido (a remoção do overlay passa
  a exibi-lo), comportamento derivado da camada superior

### Requirement: O overlay de loading é acessível e respeita movimento reduzido
O sistema SHALL expor a mensagem do `UiLoading` como região viva (`role="status"`,
`aria-live="polite"`), SHALL marcar o backdrop como invisível para tecnologias assistivas
(`aria-hidden`), SHALL sem roubar o foco do elemento que disparou a operação, SHALL excluir o
overlay da impressão e SHALL interromper as rotações (borda e ícone) quando o sistema operacional
solicita movimento reduzido.

#### Scenario: Mensagem anunciada sem roubar foco
- **WHEN** o overlay é aberto
- **THEN** a região da mensagem tem `role="status"` com `aria-live="polite"` e o foco permanece
  no elemento que estava antes da abertura

#### Scenario: Backdrop fora do fluxo de leitura
- **WHEN** o overlay está aberto
- **THEN** o backdrop tem `aria-hidden="true"` e a tecnologia assistiva anuncia apenas a mensagem

#### Scenario: Movimento reduzido
- **WHEN** o sistema operacional do usuário está com "reduzir movimento" ativo
- **THEN** a borda e o ícone param de girar, mantendo o conteúdo (borda e mensagem) visível

#### Scenario: Impressão sem o overlay
- **WHEN** a página é impressa com o overlay aberto
- **THEN** nem o backdrop nem a caixa do loading aparecem no papel

### Requirement: O UiLoading oferece três tamanhos com médio como padrão
O sistema SHALL suportar os tamanhos `sm`, `md` e `lg` para o `UiLoading`, com `md` (tamanho
médio) como padrão quando nenhum tamanho é informado, variando ícone e respiro da caixa conforme
o tamanho escolhido.

#### Scenario: Padrão médio
- **WHEN** o componente é montado sem informar tamanho
- **THEN** o ícone e a caixa são exibidos no tamanho médio

#### Scenario: Tamanhos explícitos
- **WHEN** o consumidor informa `size="sm"` ou `size="lg"`
- **THEN** a caixa e o ícone renderizam respectivamente menor e maior que o padrão, mantendo a
  mesma composição e a mesma animação

#### Scenario: Escala do ícone por tamanho
- **WHEN** o componente renderiza em `sm`, `md` (padrão) e `lg`
- **THEN** o `LoaderCircle` usa `h-5`, `h-6` e `h-8` (largura igual à altura), crescendo
  uniformemente em cada tamanho da escala

### Requirement: O UiLoading oferece barra de progresso opcional com contador
O sistema SHALL exibir, quando o consumidor informar `current` e `total`, um bloco de progresso
abaixo da linha de ícone/mensagem composto por uma barra cujo preenchimento é proporcional a
`current / total` e um contador formatado em pt-BR com o valor atual e o total; SEM essas props a
caixa renderiza apenas com ícone e mensagem, e SHALL tratar `total` menor ou igual a zero (ou
valores não numéricos) como ausência de progresso.

#### Scenario: Sem progresso informado
- **WHEN** o componente é montado sem `current`/`total`
- **THEN** a caixa exibe apenas a linha de ícone e mensagem, sem barra nem contador

#### Scenario: Progresso com contador
- **WHEN** o consumidor informa `current=1240` e `total=5000`
- **THEN** a barra é preenchida proporcionalmente (24,8% da trilha) e o contador exibe "1.240 /
  5.000" à esquerda e "25%" (percentual arredondado para inteiro) à direita, com separadores pt-BR

#### Scenario: Progresso completo
- **WHEN** `current` é maior ou igual a `total`
- **THEN** a barra é preenchida em 100%, sem ultrapassar os limites da trilha

#### Scenario: Total inválido
- **WHEN** `total` é informado como zero, negativo ou não numérico (ou `current` não é numérico)
- **THEN** o componente renderiza sem o bloco de progresso, como se as props não existissem

#### Scenario: Acessibilidade da barra
- **WHEN** o bloco de progresso é renderizado
- **THEN** a barra expõe `role="progressbar"` com `aria-valuenow` (arredondado), `aria-valuemin="0"`,
  `aria-valuemax="100"` e `aria-valuetext` com o contador formatado, e a mensagem segue como
  região viva

#### Scenario: Movimento reduzido com progresso
- **WHEN** o sistema está com movimento reduzido e o valor do progresso muda
- **THEN** o preenchimento da barra é atualizado sem transição animada, mantendo o degradê da
  marca visível

### Requirement: A vitrine /design espelha o componente na seção 18
O sistema SHALL exibir o `UiLoading` na seção 18 da vitrine `/design`, listada no índice de
navegação, com demonstração real de abertura do overlay disparada por um botão e encerrada
automaticamente, de modo que a página da vitrine permaneça utilizável após a demonstração.

#### Scenario: Seção 18 presente no índice
- **WHEN** a página `/design` é aberta
- **THEN** o índice lateral lista a entrada "18. Loading (UiLoading)" e a seção correspondente
  existe na página

#### Scenario: Demonstração abre e encerra sozinha
- **WHEN** o usuário aciona o botão de demonstração da seção 18
- **THEN** o overlay real é exibido com a mensagem demonstrativa e se encerra automaticamente em
  poucos segundos, devolvendo o controle da página ao usuário

#### Scenario: Sem overflow com a nova seção
- **WHEN** `/design` é aberto entre 320px e 1440px com a seção 18 presente
- **THEN** a página continua sem rolagem horizontal, conforme o contrato da vitrine
