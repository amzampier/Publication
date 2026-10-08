# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: A mensagem de erro é persistente, anunciável e acessível sem mouse
**Reason**: A regra vigente (implementada nos 5 controles e documentada no `docs/01` §5.3) é **ícone `AlertCircle` à direita + tooltip no hover + região viva `sr-only`**, sem texto visível abaixo do campo; o requisito mandava exatamente o oposto ("texto persistente abaixo", "visível e legível sem hover"). Os cenários "Acessível apenas com teclado", "Padrão idêntico nos três controles" e "Padrão idêntico no Textarea" não se aplicam à regra nova (família agora de cinco controles, mensagem sem texto visível).
**Migration**: Coberto pelo requisito novo "O erro é exibido por ícone com tooltip e anunciado como região viva"; a divulgação do erro sem mouse passa a ser o ícone+recorte sempre visíveis e a anúncio por `role="alert"`.
