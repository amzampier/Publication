# Spec Delta

## Purpose

Entregar ao design system um editor de texto rico (`UiRichText`) e um leitor (`UiRichTextViewer`) para campos de conteúdo longo com ênfase, cor e tamanho de fonte, com a mesma identidade visual e o mesmo contrato de acessibilidade da família de controles de formulário, e com persistência segura (texto puro + HTML sanitizado).

## ADDED Requirements

### Requirement: O UiRichText entrega um campo de texto rico com o mesmo DNA dos controles de formulário

O sistema SHALL expor o componente `UiRichText` (auto-import `UiRichText`) com `v-model` bidirecional
representando o HTML, `label`, `placeholder`, `error`, `disabled` e altura mínima, exibindo o label
acima do campo e o placeholder apenas enquanto o conteúdo estiver vazio. O campo SHALL reproduzir a
identidade visual da família de controles: caixa branca `rounded-lg` `border-slate-200`, foco recortado
com `.ds-bottom-clip` em `brand-focus` `#1a9e07` e erro em `rose-700` `#be123c` com ícone `AlertCircle`
e mensagem `role="alert"` associada por `aria-describedby`. O componente SHALL emitir também o texto
puro do conteúdo, para que o formulário valide e envie a representação textual.

#### Scenario: Renderização básica

- **WHEN** `UiRichText` é renderizado com `label`, `placeholder` e um valor inicial
- **THEN** o label aparece acima do campo, o conteúdo formatado é exibido e o placeholder some quando há conteúdo

#### Scenario: Modelo bidirecional

- **WHEN** o usuário digita no editor
- **THEN** o `v-model` (HTML) e o texto puro emitido são atualizados a cada entrada

#### Scenario: Foco e erro seguem a família

- **WHEN** `UiRichText` recebe foco ou é renderizado com `error`
- **THEN** ele exibe o mesmo destaque recortado dos demais controles (verde `brand.focus` no foco, `rose-700` no erro) e o ícone de erro com a mensagem acessível

#### Scenario: Desabilitado não edita

- **WHEN** `UiRichText` é renderizado com `disabled`
- **THEN** o conteúdo é exibido sem aceitar edição e o campo é anunciado como desabilitado

### Requirement: A toolbar de formatação aparece no hover, no foco e na seleção

O editor SHALL oferecer formatação de **negrito**, **cor de fonte** e **tamanho de fonte**. Os
controles de formatação SHALL aparecer em uma toolbar acoplada ao campo quando ele recebe hover ou
foco, e em uma toolbar flutuante posicionada sobre a seleção de texto; em dispositivos de toque, os
controles SHALL permanecer acessíveis enquanto o campo estiver focado. Cada controle SHALL ter nome
acessível, SHALL expor seu estado (`aria-pressed` no negrito) e SHALL ser alcançável e acionável por
teclado. A formatação SHALL ser aplicada ao trecho selecionado e, sem seleção, ao texto que for
digitado em seguida. O atalho `Ctrl` + `B` SHALL alternar o negrito.

#### Scenario: Toolbar no hover ou foco

- **WHEN** o ponteiro passa sobre o campo ou o campo recebe foco por teclado
- **THEN** a toolbar de formatação fica visível

#### Scenario: Toolbar na seleção

- **WHEN** o usuário seleciona um trecho de texto com o mouse ou o teclado
- **THEN** a toolbar flutuante aparece próxima à seleção e aplica a formatação ao trecho escolhido

#### Scenario: Atalho de negrito

- **WHEN** o usuário pressiona `Ctrl` + `B` com um trecho selecionado
- **THEN** o trecho alterna entre negrito e texto normal

#### Scenario: Toolbar acessível por teclado

- **WHEN** o usuário navega por `Tab` até os controles da toolbar e os aciona por teclado
- **THEN** a formatação é aplicada e o estado do controle é anunciado

### Requirement: A formatação respeita a allowlist de cores e tamanhos

O editor SHALL oferecer apenas as cores de texto e os tamanhos de fonte definidos na allowlist do
design system. A allowlist de cores SHALL incluir uma opção sem cor (padrão) e os tons de conteúdo
documentados, incluindo o **vermelho de conteúdo** `#dc2626`; a allowlist de tamanhos SHALL usar
valores relativos. Nenhuma cor, tamanho ou estilo fora da allowlist SHALL ser aplicado pelo editor.

#### Scenario: Cores disponíveis

- **WHEN** o usuário abre o seletor de cor da toolbar
- **THEN** são exibidas a opção sem cor e as cores de conteúdo da allowlist, entre elas o vermelho `#dc2626`

#### Scenario: Tamanhos disponíveis

- **WHEN** o usuário abre o seletor de tamanho da toolbar
- **THEN** são exibidos apenas os tamanhos relativos da allowlist

### Requirement: O HTML é sanitizado na escrita e o texto puro é derivado

O sistema SHALL tratar o HTML do editor como entrada não confiável: o HTML SHALL ser sanitizado no
servidor por uma allowlist de tags e atributos antes de ser persistido, e o texto puro SHALL ser
derivado desse HTML, preservando as quebras de linha. A allowlist SHALL permitir apenas as marcações
necessárias à ênfase, à quebra de linha e à cor/tamanho de fonte. O texto puro SHALL ser a base da
busca textual e o fallback de exibição quando não houver HTML.

#### Scenario: Marcação fora da allowlist é removida

- **WHEN** o HTML contém `script`, manipuladores de evento ou `style` não permitido
- **THEN** esses elementos e atributos são removidos e apenas a marcação permitida é persistida

#### Scenario: Texto puro derivado do HTML

- **WHEN** um HTML formatado é sanitizado
- **THEN** o texto puro resultante corresponde ao conteúdo sem marcação e preserva as quebras de linha

#### Scenario: Fallback de texto puro

- **WHEN** um conteúdo não possui HTML salvo
- **THEN** a exibição usa o texto puro com as quebras de linha preservadas

### Requirement: O UiRichTextViewer exibe apenas o conteúdo formatado permitido

O sistema SHALL expor um leitor `UiRichTextViewer` (auto-import `UiRichTextViewer`) que renderiza o
conteúdo formatado a partir do HTML já sanitizado, com os estilos de parágrafo, quebra de linha e
cor/tamanho da allowlist, sem estilos paralelos. O leitor SHALL ser usado na exibição de detalhes e
reutilizável pela Área Pública.

#### Scenario: Renderização do conteúdo

- **WHEN** `UiRichTextViewer` recebe um HTML sanitizado
- **THEN** o texto é exibido com negrito, cor e tamanho preservados, sem marcação visível

#### Scenario: Conteúdo sem HTML

- **WHEN** `UiRichTextViewer` recebe apenas texto puro
- **THEN** o texto é exibido preservando as quebras de linha
