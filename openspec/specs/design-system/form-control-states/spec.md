# Form Control States Specification

## Purpose

Define a forma e as cores dos estados visuais dos controles de formulário do Publications — foco e abertura recortados na borda inferior com os cantos arredondados inferiores, e validação inválida com o mesmo recorte — para que a vitrine `/design`, os componentes de `app/components/ui/` e a documentação exibam exatamente o mesmo destaque.

## Requirements

### Requirement: A folha de estilo do projeto é servida e contém a utilidade de recorte
O sistema SHALL entregar ao navegador a folha de estilo do projeto (`app/assets/css/main.css`) em desenvolvimento e em build, de modo que as regras próprias do design system — em especial o recorte `.ds-bottom-clip` — existam no CSS final.

#### Scenario: Regra de recorte existe no CSS servido
- **WHEN** o CSS entregue ao navegador é inspecionado
- **THEN** a regra `.ds-bottom-clip` com sua propriedade `clip-path` está presente

#### Scenario: A folha do projeto substitui o fallback genérico
- **WHEN** o projeto é compilado
- **THEN** o CSS de saída contém as regras próprias de `main.css` (recorte, folha de impressão e scrollbar discreta) e não é apenas o `tailwind.css` fallback de `node_modules`

#### Scenario: Estado de repouso não é afetado
- **WHEN** um controle não está focado nem em erro
- **THEN** a borda do campo permanece na cor de repouso, sem destaque algum

### Requirement: O destaque de foco ocupa somente a borda inferior e os cantos arredondados
O sistema SHALL exibir o estado de foco e de abertura dos controles de formulário como um destaque presente exclusivamente na borda inferior e nos dois cantos arredondados inferiores do campo, nunca contornando o componente inteiro.

#### Scenario: Foco do Input destaca só a base
- **WHEN** um `Input` recebe foco, ou é renderizado com `forceFocus`
- **THEN** o destaque aparece na borda inferior e nos cantos arredondados inferiores, sem cor de destaque na borda superior nem nas laterais

#### Scenario: Abertura do Select e do DatePicker
- **WHEN** um `Select` ou um `DatePicker` está aberto
- **THEN** o gatilho mostra o mesmo destaque restrito à borda inferior e aos cantos inferiores

#### Scenario: Contorno nunca envolve o componente
- **WHEN** qualquer controle da família (`Input`, `Select`, `DatePicker`) transita para o estado focado ou aberto
- **THEN** a borda superior e as laterais mantêm a cor de repouso

### Requirement: O verde canônico de foco é o token brand.focus (#1a9e07)
O sistema SHALL aplicar nos estados de foco e de abertura de todos os controles o verde canônico `#1a9e07`, exposto pelo token `brand.focus`, e não o `lime-500` (`#84cc16`).

#### Scenario: Destaque do Input usa o verde canônico
- **WHEN** um `Input` está focado
- **THEN** a cor do destaque é `#1a9e07`

#### Scenario: Anéis e contornos de foco usam o verde canônico
- **WHEN** `Checkbox`, `CheckChip`, `CheckCard`, `UploadFiles`, `CameraWeb`, o cabeçalho do app ou a busca da `DataTable` recebe foco visível
- **THEN** o anel ou contorno aplicado é `#1a9e07` (integral ou com opacidade), e não `#84cc16`

#### Scenario: Nenhum lime-500 de foco sobrevive
- **WHEN** os estados de foco e de abertura de todos os controles são revisados
- **THEN** não resta nenhuma classe de foco ou de abertura baseada em `lime-500`

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
