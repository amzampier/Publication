# Spec Delta

## MODIFIED Requirements

### Requirement: O UiRichText entrega um campo de texto rico com o mesmo DNA dos controles de formulário

O sistema SHALL expor o componente `UiRichText` (auto-import `UiRichText`) com `v-model` bidirecional
representando o HTML, `label`, `placeholder`, `error`, `disabled` e altura mínima, exibindo o label
acima do campo e o placeholder apenas enquanto o conteúdo estiver vazio. O campo SHALL reproduzir a
identidade visual da família de controles: caixa branca `rounded-lg` `border-slate-200`, foco recortado
com `.ds-bottom-clip` em `brand-focus` `#1a9e07` e erro em `rose-700` `#be123c` com ícone `AlertCircle`
e mensagem `role="alert"` associada por `aria-describedby`. O editor `contenteditable` SHALL ter `id`
e/ou `aria-labelledby` associado ao label visível, de modo que o nome acessível seja anunciado ao
focar o campo. O componente SHALL emitir também o texto puro do conteúdo, para que o formulário valide
e envie a representação textual.

#### Scenario: Renderização básica

- **WHEN** `UiRichText` é renderizado com `label`, `placeholder` e um valor inicial
- **THEN** o label aparece acima do campo, o conteúdo formatado é exibido e o placeholder some quando há conteúdo

#### Scenario: Label associado ao editor
- **WHEN** o foco vai para o editor por teclado ou leitor de tela
- **THEN** o campo é anunciado com o texto do label, por `id`/`aria-labelledby`, e não apenas como “edição de texto”

#### Scenario: Modelo bidirecional

- **WHEN** o usuário digita no editor
- **THEN** o `v-model` (HTML) e o texto puro emitido são atualizados a cada entrada

#### Scenario: Foco e erro seguem a família

- **WHEN** `UiRichText` recebe foco ou é renderizado com `error`
- **THEN** ele exibe o mesmo destaque recortado dos demais controles (verde `brand.focus` no foco, `rose-700` no erro) e o ícone de erro com a mensagem acessível

#### Scenario: Desabilitado não edita

- **WHEN** `UiRichText` é renderizado com `disabled`
- **THEN** o conteúdo é exibido sem aceitar edição e o campo é anunciado como desabilitado