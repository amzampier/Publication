# Slider Specification

## Purpose

Definir o contrato do componente de slider do design system (`UiSlider`) — faixa de valores, marcas rotuladas, emissão de valor, foco acessível e espelhamento na vitrine — para que telas que pedem controle de intervalo (como a retenção de auditoria) observem o mesmo comportamento.

## Requirements

### Requirement: O slider emite o valor numérico dentro de uma faixa configurável
O sistema SHALL renderizar um controle de intervalo com `v-model` numérico e evento `change` emitindo o número, com faixa configurável e defaults `min=30`, `max=730`, `step=1`.

#### Scenario: Valor fora do padrão
- **WHEN** o componente recebe `min`, `max` ou `step` diferentes dos defaults
- **THEN** o slider opera dentro da faixa informada e emite apenas valores dela

#### Scenario: change entrega número
- **WHEN** o usuário arrasta o thumb ou usa o teclado do input nativo
- **THEN** `update:modelValue` e `change` recebem um `number`, nunca uma string ou Event

### Requirement: A track preenchida usa degradê das cores da marca
O sistema SHALL preencher a track do slider, da origem até o thumb, com um degradê horizontal que começa em `#112051`, passa por `#0364f7` e termina em `#4ed813`, esticando-se junto com o valor; a região não preenchida permanece `slate-200`.

#### Scenario: Degradê acompanha o valor
- **WHEN** o slider está em qualquer valor da faixa
- **THEN** a região preenchida exibe as três cores (`#112051` na origem, `#0364f7` no meio e `#4ed813` junto ao thumb) e o resto da track é cinza `slate-200`

#### Scenario: Valor mínimo e máximo
- **WHEN** o valor é o mínimo ou o máximo
- **THEN** o degradê cobre praticamente só a cor inicial no mínimo e a track inteira no máximo, sem estourar os limites da faixa

### Requirement: Marcas rotuladas exibem-se sob a track
O sistema SHALL exibir, quando informadas `marks` (`{ value, label }[]`), uma legenda com os rótulos alinhados sob a track, **legível e sem sobreposição em telas estreitas (a partir de 320px)**, sem interferir na operação do slider.

#### Scenario: Marcas renderizam
- **WHEN** `marks` é passado com 5 entradas
- **THEN** os 5 rótulos aparecem sob a track na ordem informada

#### Scenario: Sem marcas
- **WHEN** `marks` não é informado
- **THEN** nenhuma legenda é renderizada e o controle opera normalmente

#### Scenario: Rótulos legíveis em telas estreitas
- **WHEN** o slider com 5 marcas de rótulos longos (ex.: "30 dias (1 mês)" … "730 dias (2 anos)") é exibido em um contêiner estreito de 320–375px (ex.: painel de retenção de auditoria)
- **THEN** todos os rótulos permanecem legíveis e sem sobreposição entre si, quebrando linha quando necessário

### Requirement: O foco do slider usa o verde canônico e o valor é acessível
O sistema SHALL aplicar no foco visível do slider o verde canônico `#1a9e07` (nunca `lime-500`) e expor o valor corrente textualmente a leitores de tela (ex.: "180 dias") via texto acessível.

#### Scenario: Foco canônico
- **WHEN** o slider recebe foco visível
- **THEN** o destaque de foco é `#1a9e07`

#### Scenario: Leitura do valor
- **WHEN** o slider tem o valor 180
- **THEN** a leitura acessível corresponde a "180 dias"

### Requirement: A vitrine e a documentação espelham o componente
O sistema SHALL documentar `UiSlider` em `docs/01 - design_system.md` e demonstrá-lo na seção 16 da vitrine `/design` com faixa, marcas e valor corrente visíveis.

#### Scenario: Seção 16 existe
- **WHEN** a vitrine `/design` é renderizada
- **THEN** a seção 16 exibe um `UiSlider` funcional com marcas

#### Scenario: Documentação acompanha
- **WHEN** `docs/01 - design_system.md` §5.14 é lido
- **THEN** as props e o comportamento descritos coincidem com o componente
