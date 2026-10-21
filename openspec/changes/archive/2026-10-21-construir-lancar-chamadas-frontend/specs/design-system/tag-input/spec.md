# Spec Delta

## Purpose

Definir o `UiTagInput`, controle do design system para coleções de tags em chips, com adição e remoção
por mouse e teclado, limites configuráveis e estados de foco, erro e desabilitado alinhados aos
tokens canônicos.

## ADDED Requirements

### Requirement: O UiTagInput representa uma coleção de tags em chips

O `UiTagInput` SHALL receber uma coleção de `string` e renderizar cada item como um chip com botão de
remoção. O controle SHALL permitir adicionar uma tag ao pressionar `Enter` ou vírgula, aplicando
`trim` e ignorando valores vazios ou duplicados. O controle SHALL emitir a coleção resultante em
`update:modelValue` e `change` sempre que uma tag for adicionada ou removida.

#### Scenario: Adicionar tag com Enter

- **WHEN** o usuário digita uma tag e pressiona `Enter`
- **THEN** a tag é adicionada ao final da coleção, o texto é limpo e o evento de mudança é emitido

#### Scenario: Adicionar tag com vírgula

- **WHEN** o usuário digita uma tag seguida de vírgula
- **THEN** a tag é adicionada e o texto remanescente permanece no campo

#### Scenario: Ignorar vazio e duplicado

- **WHEN** o usuário tenta adicionar uma tag vazia ou já existente na coleção
- **THEN** nenhuma nova tag é adicionada

#### Scenario: Remover tag pelo chip

- **WHEN** o usuário aciona o botão de remoção de um chip
- **THEN** a tag correspondente é removida e o evento de mudança é emitido

### Requirement: O UiTagInput respeita os limites configurados

O controle SHALL aceitar limites de quantidade de tags e de comprimento por tag. Ao atingir o limite
de quantidade, SHALL impedir novas adições e informar o limite; ao exceder o comprimento, SHALL
rejeitar a tag e manter o controle em estado válido.

#### Scenario: Limite de quantidade

- **WHEN** a coleção já contém a quantidade máxima de tags permitida
- **THEN** novas tentativas de adição não alteram a coleção e o limite é comunicado

#### Scenario: Limite de comprimento

- **WHEN** o usuário tenta adicionar uma tag maior que o comprimento máximo
- **THEN** a tag não é adicionada e o controle informa o limite

### Requirement: O UiTagInput segue os estados canônicos de formulário

O controle SHALL alinhar-se aos tokens do design system: o foco SHALL usar `brand-focus` (`#1a9e07`)
no recorte inferior canônico; o erro SHALL usar `rose-700` (`#be123c`) com ícone de alerta, mensagem
em região viva e recorte inferior; o estado desabilitado SHALL usar fundo `slate-200`, opacidade
reduzida e nenhum estado de foco ou hover.

#### Scenario: Foco canônico

- **WHEN** o controle recebe foco por teclado
- **THEN** o destaque aparece na borda inferior e nos cantos inferiores em `#1a9e07`

#### Scenario: Erro canônico

- **WHEN** o controle é renderizado com mensagem de erro
- **THEN** o recorte inferior e o ícone usam `rose-700` e a mensagem é anunciada por região viva

#### Scenario: Desabilitado

- **WHEN** o controle é renderizado como desabilitado
- **THEN** exibe fundo `slate-200`, opacidade reduzida e não recebe foco nem hover

#### Scenario: Texto auxiliar

- **WHEN** o controle recebe texto auxiliar
- **THEN** o texto é exibido abaixo do campo em estilo de legenda do design system

### Requirement: O UiTagInput é acessível por teclado e leitor de tela

O controle SHALL associar o rótulo ao campo, expor os chips como uma lista e cada botão de remoção
com nome acessível que identifique a tag removida. O controle SHALL permitir remover a última tag com
`Backspace` quando o campo de entrada estiver vazio, sem prender o foco, e SHALL manter ordem de foco
previsível entre o campo e os botões dos chips.

#### Scenario: Nome acessível do chip

- **WHEN** um leitor de tela percorre os chips
- **THEN** cada botão de remoção anuncia a tag que será removida

#### Scenario: Remover última tag com Backspace

- **WHEN** o campo de entrada está vazio e o usuário pressiona `Backspace`
- **THEN** a última tag é removida e o foco permanece no campo de entrada

#### Scenario: Navegação por Tab

- **WHEN** o usuário percorre o controle com `Tab`
- **THEN** o foco segue do campo para os botões de remoção e para o próximo controle, sem ciclo fechado

### Requirement: A vitrine e a documentação espelham o UiTagInput

O sistema SHALL documentar o `UiTagInput` na seção numerada correspondente da vitrine `/design` e no
documento do design system, com um exemplo interativo que exercite adição, remoção, limite e estado de
erro.

#### Scenario: Vitrine interativa

- **WHEN** o usuário abre a seção do `UiTagInput` em `/design`
- **THEN** consegue adicionar e remover tags e observar os estados habilitado, erro e desabilitado

#### Scenario: Documentação alinhada

- **WHEN** a documentação do design system é consultada
- **THEN** ela descreve as props, os eventos e os estados do `UiTagInput` de forma compatível com a vitrine
