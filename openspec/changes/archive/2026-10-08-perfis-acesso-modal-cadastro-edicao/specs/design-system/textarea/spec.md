# Spec Delta

## Purpose

Entregar ao design system um campo de texto multilinha (`UiTextarea`) para descrições e
observações longas, com a mesma identidade visual, contrato de eventos e acessibilidade da
família de controles de formulário, para que formulários como o cadastro de perfis de acesso
editem campos `TEXT` sem criar estilos paralelos.

## ADDED Requirements

### Requirement: O UiTextarea entrega um campo multilinha com label, modelo e estado desabilitado
O sistema SHALL expor o componente `UiTextarea` (auto-import `UiTextarea`) com `v-model`
bidirecional, `label`, `placeholder`, `error`, `disabled` e `rows` (número de linhas visíveis,
padrão 3), exibindo o label acima do campo e o placeholder apenas enquanto o valor estiver
vazio, nos mesmos moldes demais controles de formulário do kit.

#### Scenario: Renderização básica
- **WHEN** `UiTextarea` é renderizado com `label`, `placeholder` e `rows`
- **THEN** o label aparece acima da área de texto, a área respeita as linhas indicadas e o
  placeholder é exibido apenas com o valor vazio

#### Scenario: Modelo bidirecional
- **WHEN** o usuário digita na área de texto
- **THEN** o `v-model` é atualizado a cada entrada, e um valor externo atribuído ao
  `v-model` reflete no campo

#### Scenario: Desabilitado não edita
- **WHEN** `UiTextarea` é renderizado com `disabled`
- **THEN** o campo não aceita entrada nem foco de edição e é anunciado como desabilitado

#### Scenario: O foco e o erro seguem a família
- **WHEN** `UiTextarea` recebe foco ou é renderizado com `error`
- **THEN** ele exibe o mesmo destaque recortado na borda inferior dos demais controles
  (verde `brand.focus` no foco, `rose-700` no erro) e a mensagem de erro abaixo do campo,
  conforme a capability `design-system/form-control-states`

### Requirement: O UiTextarea respeita o teclado e a navegação do formulário
O sistema SHALL fazer com que a tecla **Enter** dentro do `UiTextarea` insira quebra de linha
(avance para a próxima linha do texto) em vez de acionar o envio do formulário ou navegar
para o próximo campo, e que a tecla **Tab** saia do campo para o próximo elemento focável —
mantendo o `Enter` dos demais `input` do formulário comportando-se como navegação em cadeia.

#### Scenario: Enter quebra linha
- **WHEN** o usuário pressiona Enter com o cursor dentro do `UiTextarea`
- **THEN** uma quebra de linha é inserida no valor e nenhum outro campo é focado nem formulário
  é submetido

#### Scenario: Tab sai do campo
- **WHEN** o usuário pressiona Tab com o foco no `UiTextarea`
- **THEN** o foco avança para o próximo elemento focável do formulário, na ordem visual

#### Scenario: Erro anunciável sem mouse
- **WHEN** o `UiTextarea` está exibindo uma mensagem de erro
- **THEN** a mensagem permanece no DOM abaixo do campo, com `role="alert"`, associada ao
  controle por `aria-describedby`, perceptível apenas por teclado ou leitor de tela
