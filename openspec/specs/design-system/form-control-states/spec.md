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

#### Scenario: Foco do Textarea destaca só a base
- **WHEN** um `UiTextarea` recebe foco
- **THEN** o destaque aparece na borda inferior e nos cantos arredondados inferiores, sem cor de destaque na borda superior nem nas laterais

#### Scenario: Abertura do Select e do DatePicker
- **WHEN** um `Select` ou um `DatePicker` está aberto
- **THEN** o gatilho mostra o mesmo destaque restrito à borda inferior e aos cantos inferiores

#### Scenario: Contorno nunca envolve o componente
- **WHEN** qualquer controle da família (`Input`, `Select`, `DatePicker`, `Textarea`) transita para o estado focado ou aberto
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
O sistema SHALL exibir a validação inválida de `Input`, `Select`, `DatePicker` e `Textarea` com o mesmo recorte do foco (borda inferior + dois cantos arredondados inferiores) na cor `rose-700` (`#be123c`), com precedência sobre o destaque de foco.

#### Scenario: Erro do Input substitui o foco
- **WHEN** um `Input` recebido `error` está com o campo focado
- **THEN** o destaque exibido é `rose-700`, e não o verde de foco

#### Scenario: Erro do Textarea usa o mesmo recorte
- **WHEN** um `UiTextarea` está em erro, focado ou não
- **THEN** o destaque exibido é `rose-700` apenas na borda inferior e nos cantos arredondados inferiores, com o label em `rose-700`

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
- **THEN** a mensagem continua disponível no tooltip do ícone interno à direita, com o ícone e o recorte `rose-700` sempre presentes no controle enquanto o erro persistir — a mensagem não aparece como texto visível abaixo do campo

### Requirement: O erro é exibido por ícone com tooltip e anunciado como região viva
O sistema SHALL exibir a validação inválida de `Input`, `Select`, `DatePicker`, `Textarea` e `Segmented` como um ícone `AlertCircle` `rose-700` à direita, dentro do controle, com a mensagem em tooltip no hover sobre o ícone; a mensagem SHALL permanecer no DOM logo que a propriedade `error` estiver preenchida, como região viva (`role="alert"`) associada ao controle por `aria-describedby` — sem nenhum texto visível abaixo do campo —, usando o mesmo padrão nos cinco controles, de modo que o estado de erro seja percebido sem mouse (ícone e recorte sempre visíveis) e a mensagem seja anunciável sem interação.

#### Scenario: Mensagem existe no DOM sem hover
- **WHEN** um controle é renderizado com `error` preenchido
- **THEN** o HTML contém um nó de texto com a mensagem (oculto visualmente, para quem não usa leitor de tela), presente sem nenhuma interação de mouse

#### Scenario: Mensagem anunciada por leitor de tela
- **WHEN** a mensagem de erro aparece para um campo
- **THEN** ela é anunciada pelo leitor de tela via região viva (`role="alert"`) e o controle a referencia por `aria-describedby`

#### Scenario: Ícone de erro com tooltip dentro do controle
- **WHEN** um controle em erro é observado sem passar o mouse sobre ele
- **THEN** o ícone `AlertCircle` `rose-700` permanece visível à direita, dentro do controle, e o hover sobre o ícone exibe a mensagem em tooltip

#### Scenario: Padrão idêntico nos cinco controles
- **WHEN** `Input`, `Select`, `DatePicker`, `Textarea` e `Segmented` são comparados em estado de erro
- **THEN** os cinco exibem o ícone à direita com tooltip, a mesma região viva e a mesma identidade visual (`rose-700`), sem texto visível abaixo do campo

### Requirement: Controles desabilitados mostram-se somente leitura de forma inequívoca
O sistema SHALL exibir os controles desabilitados de formulário (`Input`, `Textarea`,
`Select`, `DatePicker` e `Segmented`) com fundo `slate-200` atenuado (`opacity-60`), cursor
`not-allowed` e **sem** estados de hover nem de foco (borda e fundo de repouso inalterados, e
gatilho fora do Tab), de modo que o estado somente leitura seja visível de imediato e o
controle não pareça interativo.

#### Scenario: Fundo cinza visível nos cinco controles
- **WHEN** `Input`, `Textarea`, `Select`, `DatePicker` ou `Segmented` é renderizado com
  `disabled`
- **THEN** o controle exibe fundo `slate-200` (distinguível do fundo branco do campo ativo e
  do corpo `slate-100` dos modais), `cursor-not-allowed` e `opacity-60`

#### Scenario: Sem hover nem foco indevido
- **WHEN** um controle desabilitado é passado pelo mouse ou alcançado por teclado
- **THEN** nenhuma borda ou fundo de hover/foco é aplicado (em especial, nenhum destaque
  `brand.focus`) e o controle não recebe foco pelo `Tab`

#### Scenario: Seleção do Segmented continua legível
- **WHEN** um `Segmented` desabilitado tem uma opção selecionada
- **THEN** a track usa `slate-200` **sem** `opacity` no grupo e a seleção aparece como pílula
  `bg-white`, mantendo a opção escolhida distinguível

#### Scenario: Controles habilitados não são afetados
- **WHEN** o mesmo controle é renderizado sem `disabled`
- **THEN** ele mantém o fundo de repouso (branco ou `slate-100` da track), o hover e o foco
  canônicos, sem nenhum vestígio do estado desabilitado

### Requirement: O Checkbox segue foco e erro canônicos
O `UiCheckbox` SHALL seguir os tokens canônicos do design system em qualquer variante: o estado
de **erro** SHALL usar `rose-700` (nunca `rose-600`) e o anel de **foco** SHALL usar
`brand-focus` (`#1a9e07`), e não a cor da variante.

#### Scenario: Erro no Checkbox em rose-700
- **WHEN** um `UiCheckbox` está em erro
- **THEN** o estado de erro usa `rose-700`

#### Scenario: Foco do Checkbox em brand-focus
- **WHEN** um `UiCheckbox` (de qualquer variante) recebe foco por teclado
- **THEN** o anel de foco usa `brand-focus`

### Requirement: Os controles de formulário expõem nome acessível
Os controles compostos do kit SHALL expor um nome acessível: o `Select` SHALL usar o `label` informado quando houver e, quando não houver `label` (ex.: filtros em modal), SHALL expor um nome acessível alternativo — o gatilho `role="combobox"` nunca pode referenciar um `id` inexistente; e o checkbox embutido no `CheckCard` SHALL ter um nome acessível (o do cartão), de modo que tecnologia assistiva o anuncie.

#### Scenario: Select sem label tem nome acessível
- **WHEN** um `UiSelect` é renderizado sem `label` (ex.: dentro do modal de filtros)
- **THEN** o gatilho `role="combobox"` expõe um nome acessível válido (não referencia um `id` inexistente)

#### Scenario: CheckCard expõe o nome do cartão ao checkbox
- **WHEN** um `CheckCard` é percorrido por tecnologia assistiva
- **THEN** o checkbox interno é anunciado com o nome do cartão

### Requirement: Os botões secundários exibem foco de teclado
Os botões secundários do kit — o limpar do `Select` e o limpar do `DatePicker` — SHALL exibir um indicador de foco visível quando alcançados por teclado, sem desenhar contorno no clique de mouse.

#### Scenario: Limpar do Select mostra foco
- **WHEN** o botão de limpar do `UiSelect` recebe foco por teclado
- **THEN** um indicador de foco visível é exibido

#### Scenario: Limpar do DatePicker mostra foco
- **WHEN** o botão de limpar do `UiDatePicker` recebe foco por teclado
- **THEN** um indicador de foco visível é exibido

### Requirement: As ações de submissão usam loading e disabled

Todo botão que dispara uma operação de escrita (`Salvar`, `Enviar`, `Publicar`, `Recusar`,
`Aprovar`, `Importar`) SHALL entrar em estado de carregamento e ficar desabilitado enquanto a
requisição estiver em voo, impedindo duplo envio. O estado SHALL ser restaurado em sucesso, erro ou
cancelamento, e o botão SHALL expor `aria-busy`/`disabled` de forma acessível. O formulário NÃO SHALL
disparar duas requisições concorrentes para a mesma ação.

#### Scenario: Clique duplo gera uma requisição
- **WHEN** o usuário aciona “Salvar” duas vezes rapidamente
- **THEN** apenas uma requisição é enviada e o botão permanece em loading até a resposta

#### Scenario: Erro restaura o botão
- **WHEN** a requisição falha
- **THEN** o botão sai do loading e volta a permitir nova tentativa, com o erro exibido

#### Scenario: Ação destrutiva também protege
- **WHEN** o usuário confirma “Excluir” ou “Recusar” e a requisição está em voo
- **THEN** o botão de confirmação fica desabilitado até a resposta

### Requirement: A ação de ícone do controle é acionável por teclado

Quando um controle de formulário exibe uma ação em ícone à direita do campo (ex.: revelar senha,
limpar busca ou abrir seletor), essa ação SHALL ser um controle focável com papel de botão, nome
acessível e acionamento por `Enter` e `Space`, além do clique. Ela NÃO SHALL ser um elemento
apenas clicável sem equivalente de teclado. Quando desabilitada, a ação SHALL expor o estado
desabilitado de forma acessível e não SHALL disparar o evento.

#### Scenario: Foco e acionamento por teclado

- **WHEN** o usuário navega por `Tab` até a ação de ícone e pressiona `Enter` ou `Space`
- **THEN** a ação é disparada como no clique e o foco permanece visível no controle

#### Scenario: Nome acessível

- **WHEN** a ação de ícone recebe foco
- **THEN** a tecnologia assistiva anuncia um nome que descreve a ação, não apenas “ícone” ou “botão”

#### Scenario: Ação desabilitada

- **WHEN** a ação de ícone está desabilitada
- **THEN** ela é anunciada como desabilitada e não dispara o evento ao clique ou teclado
