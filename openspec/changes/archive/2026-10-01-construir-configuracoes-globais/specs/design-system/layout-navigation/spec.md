# Spec Delta

## ADDED Requirements

### Requirement: Itens de navegação podem declarar rota e o ativo reflete a rota atual
Os itens da sidebar e do menu do Account SHALL poder declarar uma rota opcional (`to`); quando declarada, o clique do usuário navega para essa rota, e o item da sidebar correspondente à rota corrente é exibido como ativo. Itens sem rota continuam apenas marcando estado visual, como hoje.

#### Scenario: Item com rota navega
- **WHEN** o usuário clica em "Configurações Globais" na sidebar ou no menu do Account
- **THEN** o navegador vai para `/admin/configuracoes-globais` e o menu do Account é fechado

#### Scenario: Item ativo acompanha a rota
- **WHEN** a rota corrente corresponde à rota declarada de um item da sidebar
- **THEN** aquele item é exibido com o estado ativo (mesmo estilo do item selecionado hoje), com `aria-current="page"`

#### Scenario: Item sem rota preserva o comportamento atual
- **WHEN** o usuário clica em um item sem rota declarada (ex.: Manuais)
- **THEN** apenas o estado visual de item ativo muda, sem navegação, como no comportamento atual

#### Scenario: Chegar por URL direta também marca o item
- **WHEN** o usuário abre `/admin/configuracoes-globais` diretamente pelo endereço
- **THEN** o item "Configurações Globais" da sidebar aparece como ativo

### Requirement: A sidebar alterna entre modo expandido e rail exibindo todos os ícones e preservando o estado
O sistema SHALL alternar a sidebar entre o modo expandido (títulos completos) e o modo rail (somente
ícones), exibindo no rail **todos os ícones de todas as sessões — independentemente do estado de
recolhimento das sessões**, que passa a valer apenas no modo expandido — com um divisor entre sessões
e um tooltip por item — e SHALL preservar o estado de recolhimento das sessões ao reexpandir.

#### Scenario: Rail mostra todos os ícones mesmo com todas as sessões recolhidas
- **WHEN** a sidebar é recolhida com todas as sessões em modo acordeão (recolhidas)
- **THEN** os cabeçalhos de sessão não são exibidos, todos os itens permanecem visíveis como ícones
  centralizados (inclusive os de sessões recolhidas) e há um divisor entre sessões

#### Scenario: Tooltip por item no rail
- **WHEN** a sidebar está em rail e o usuário interage com um item
- **THEN** seu rótulo é exibido em tooltip sem ser cortado pela borda da sidebar, e o tooltip não
  aparece no modo expandido

#### Scenario: Estado preservado ao reexpandir
- **WHEN** uma sessão é recolhida, a sidebar vai para o rail e volta a expandir
- **THEN** a sessão continua recolhida e as demais mantêm seus estados

## REMOVED Requirements

### Requirement: A sidebar alterna entre modo expandido e rail preservando o estado
