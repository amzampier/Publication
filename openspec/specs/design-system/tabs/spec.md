# Tabs Specification

## Purpose

Definir o contrato do componente de navegação segmentada em abas do design system (`UiTabs`) — estados, papéis ARIA, teclado e espelhamento na vitrine — para que qualquer tela administrativa que precise de abas observe o mesmo comportamento acessível e visual.

## Requirements

### Requirement: O componente de abas gerencia seleção por v-model com papéis ARIA de tablist
O sistema SHALL exibir um componente de abas com `v-model` (e evento `change` com o id selecionado) que renderiza uma lista com `role="tablist"`, cada aba com `role="tab"` e `aria-selected="true"` apenas na aba vigente.

#### Scenario: Seleção inicial e troca
- **WHEN** o componente é renderizado com `modelValue` igual a um dos ids
- **THEN** aquela aba tem `aria-selected="true"` e as demais `aria-selected="false"`; ao emitir novo valor, a troca é refletida

#### Scenario: Evento change entrega o id
- **WHEN** o usuário seleciona uma aba diferente
- **THEN** o evento `change` emite o `id` da aba (string), nunca um Event do DOM

### Requirement: A aba ativa usa pill lime e o ícone usa a cor declarada do item
O sistema SHALL estilizar a aba ativa com pill no estilo lime do kit (`bg-lime-50`, borda `lime-300`, texto `lime-900` — o mesmo padrão do chip lime ativo), a aba inativa com texto slate sobre fundo transparente, e renderizar o ícone de cada item na cor (`cor`) declarada no item, preservando-a também na aba ativa.

#### Scenario: Pill ativa
- **WHEN** uma aba está selecionada
- **THEN** seu fundo é `bg-lime-50` com borda `border-lime-300` e texto `text-lime-900`, e as demais permanecem sem fundo colorido

#### Scenario: Ícone colorido por item
- **WHEN** um item com `cor` é renderizado
- **THEN** o ícone exibe essa cor, tanto na aba ativa quanto nas inativas

### Requirement: O tablist é centralizado horizontalmente
O sistema SHALL centralizar as abas horizontalmente no espaço disponível do tablist (`justify-center`), mantendo a centralização inclusive quando os itens quebram em mais de uma linha.

#### Scenario: Abas centralizadas
- **WHEN** o componente é renderizado com espaço disponível maior que a soma das abas
- **THEN** a lista de abas aparece centralizada horizontalmente, e continua centralizada quando os itens ocupam mais de uma linha

### Requirement: A navegação por teclado percorre as abas
O sistema SHALL permitir mudar a aba ativa pelo teclado: `←`/`→` percorrem as abas, `Home`/`End` levam à primeira/última, com `Tab` alcançando o tablist e foco visível no verde canônico.

#### Scenario: Setas trocam a aba
- **WHEN** o tablist tem foco e o usuário pressiona `→`
- **THEN** a próxima aba (circularmente) é selecionada

#### Scenario: Home e End
- **WHEN** o usuário pressiona `Home` ou `End` com foco no tablist
- **THEN** a primeira ou a última aba é selecionada

### Requirement: A vitrine e a documentação espelham o componente
O sistema SHALL documentar `UiTabs` em `docs/01 - design_system.md` e demonstrá-lo na seção 16 da vitrine `/design`, com os mesmos estados (ativa, inativa, ícone colorido) exibidos pelo componente real.

#### Scenario: Seção 16 existe
- **WHEN** a vitrine `/design` é renderizada
- **THEN** a seção 16 demonstra o `UiTabs` com abas funcionais

#### Scenario: Documentação acompanha
- **WHEN** `docs/01 - design_system.md` §5.13 é lido
- **THEN** as props, eventos e comportamento descritos coincidem com o componente
