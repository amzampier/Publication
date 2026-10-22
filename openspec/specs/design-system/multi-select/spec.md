# Design System — Multi Select Specification

## Purpose

Entregar ao design system um campo de seleção múltipla (`UiMultiSelect`) com busca e chips, para que formulários escolham vários itens de um catálogo com a mesma identidade visual, o mesmo contrato de eventos e a mesma acessibilidade da família de controles de formulário, sem estilos paralelos.

## Requirements

### Requirement: O UiMultiSelect entrega um campo de escolha múltipla com busca e chips

O sistema SHALL expor o componente `UiMultiSelect` (auto-import `UiMultiSelect`) com `v-model`
bidirecional de um array de valores, `options`, `label`, `placeholder`, `disabled`, `error` e
`helperText`, exibindo o label acima do campo e o placeholder enquanto nenhum item estiver
selecionado. O campo SHALL reproduzir a identidade visual da família de controles: caixa branca
`rounded-lg` `border-slate-200`, foco recortado com `.ds-bottom-clip` em `brand-focus` `#1a9e07` e
erro em `rose-700` `#be123c` com ícone `AlertCircle` e mensagem `role="alert"` associada por
`aria-describedby`. Os itens selecionados SHALL ser exibidos como **chips removíveis** dentro do
campo.

#### Scenario: Renderização básica

- **WHEN** `UiMultiSelect` é renderizado com `label`, `placeholder` e `options`
- **THEN** o label aparece acima do campo e o placeholder é exibido enquanto não há itens selecionados

#### Scenario: Selecionar e remover itens

- **WHEN** o usuário abre o campo, seleciona um item e depois remove o chip correspondente
- **THEN** o `v-model` (array) reflete a inclusão e a remoção, sem duplicar itens

#### Scenario: Foco e erro seguem a família

- **WHEN** `UiMultiSelect` recebe foco ou é renderizado com `error`
- **THEN** exibe o mesmo destaque recortado dos demais controles (verde `brand.focus` no foco, `rose-700` no erro) e o ícone de erro com a mensagem acessível

#### Scenario: Desabilitado não edita

- **WHEN** `UiMultiSelect` é renderizado com `disabled`
- **THEN** o campo não abre nem aceita seleção e é anunciado como desabilitado

### Requirement: O UiMultiSelect busca e respeita o teclado

O campo SHALL oferecer um campo de busca que filtra as opções por texto, insensível a acentos e
maiúsculas, e SHALL indicar quando nenhum item corresponde à busca. A abertura SHALL ocorrer por
clique, `Enter`, `Space` ou setas; as setas SHALL navegar pelas opções; `Enter` SHALL alternar a opção
destacada; `Escape` SHALL fechar a lista; e `Backspace` com a busca vazia SHALL remover o último chip.
O componente SHALL expor papéis e estados acessíveis (`combobox`/`listbox`/`option`), nome acessível e
`aria-expanded`.

#### Scenario: Filtrar opções

- **WHEN** o usuário digita no campo de busca
- **THEN** a lista exibe apenas as opções correspondentes ao texto

#### Scenario: Sem correspondência

- **WHEN** o texto de busca não corresponde a nenhuma opção
- **THEN** a lista informa que nenhum item foi encontrado

#### Scenario: Navegação por teclado

- **WHEN** o usuário percorre as opções com as setas e confirma com `Enter`
- **THEN** a opção destacada é alternada na seleção e o estado é anunciado

#### Scenario: Remover pelo teclado

- **WHEN** o usuário pressiona `Backspace` com a busca vazia e há itens selecionados
- **THEN** o último chip é removido

### Requirement: O UiMultiSelect é reutilizável por outros formulários

O componente SHALL ser genérico quanto ao catálogo (recebe `options` no formato do kit) e SHALL ser
demonstrado na vitrine `/design` e documentado no `docs/01 - design_system.md`, sem estilos paralelos
em consumidores.

#### Scenario: Uso genérico

- **WHEN** um formulário fornece `options` e um `v-model` de array
- **THEN** o componente funciona sem conhecer o domínio das opções

#### Scenario: Espelhamento na vitrine

- **WHEN** a seção do `UiMultiSelect` é aberta em `/design`
- **THEN** a demonstração exibe o campo com busca, chips e os estados de erro e desabilitado
