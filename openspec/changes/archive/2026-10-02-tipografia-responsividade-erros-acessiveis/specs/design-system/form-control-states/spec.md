# Spec Delta

## MODIFIED Requirements

### Requirement: O estado de erro usa o mesmo recorte em rose-700
O sistema SHALL exibir a validação inválida de `Input`, `Select` e `DatePicker` com o mesmo recorte do foco (borda inferior + dois cantos arredondados inferiores) na cor `rose-700` (`#be123c`), com precedência sobre o destaque de foco.

#### Scenario: Erro do Input substitui o foco
- **WHEN** um `Input` recebido `error` está com o campo focado
- **THEN** o destaque exibido é `rose-700`, e não o verde de foco

#### Scenario: Label e ícone do erro acompanham o vermelho oficial
- **WHEN** um `Input` ou um `Select` está em erro
- **THEN** o label e o ícone de alerta usam `rose-700`, e não `rose-600` ou `rose-500`

#### Scenario: Erro do Select
- **WHEN** um `Select` está em erro, aberto ou fechado
- **THEN** a borda inferior e os cantos aparecem em `rose-700`

#### Scenario: Erro do DatePicker deixa de contornar o campo
- **WHEN** um `DatePicker` está em erro
- **THEN** somente a borda inferior e os cantos ficam em `rose-700`, permanecendo a cor de repouso na borda superior e nas laterais — sem contorno `rose` em toda a volta

#### Scenario: A mensagem de erro continua no tooltip
- **WHEN** um controle está em erro
- **THEN** a mensagem continua disponível no tooltip do ícone interno como reforço ao hover/foco, sem ser o único lugar onde existe — o texto persistente abaixo do campo a mantém sempre presente

## ADDED Requirements

### Requirement: A mensagem de erro é persistente, anunciável e acessível sem mouse
O sistema SHALL expor a mensagem de erro de `Input`, `Select` e `DatePicker` como texto no DOM logo que a propriedade `error` estiver preenchida, posicionado abaixo do campo, com `role="alert"` e associado ao controle por `aria-describedby`, usando o mesmo padrão nos três componentes — de modo que a mensagem seja percebida sem mouse, por teclado, toque ou leitor de tela.

#### Scenario: Mensagem existe no DOM sem hover
- **WHEN** um controle é renderizado com `error` preenchido
- **THEN** o HTML contém um nó de texto com a mensagem abaixo do campo, presente sem nenhuma interação de mouse

#### Scenario: Mensagem anunciada por leitor de tela
- **WHEN** a mensagem de erro aparece para um campo
- **THEN** ela é anunciada pelo leitor de tela via região viva (`role="alert"`) e o controle a referencia por `aria-describedby`

#### Scenario: Acessível apenas com teclado
- **WHEN** o usuário navega pelo formulário apenas com a tecla `Tab`
- **THEN** a mensagem de erro permanece visível e legível, sem exigir hover ou foco em um elemento auxiliar

#### Scenario: Padrão idêntico nos três controles
- **WHEN** `Input`, `Select` e `DatePicker` são comparados em estado de erro
- **THEN** os três exibem a mensagem no mesmo local, com as mesmas regras de acessibilidade e a mesma identidade visual (`rose-700`)
