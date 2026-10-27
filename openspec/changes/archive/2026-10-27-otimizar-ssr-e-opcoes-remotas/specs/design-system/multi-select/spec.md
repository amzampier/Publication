# Spec Delta

## ADDED Requirements

### Requirement: O UiMultiSelect oferece busca remota opcional

O `UiMultiSelect` SHALL manter o modo local como padrão e SHALL oferecer um modo remoto opcional, no qual as opções são carregadas pelo consumidor. No modo remoto, os itens já selecionados SHALL continuar visíveis como chips mesmo quando não estiverem na página atual, o componente SHALL emitir buscas com o termo digitado (com debounce no consumidor), SHALL suportar carregamento de mais resultados e SHALL exibir estados de carregamento, ausência de resultados e falha. A navegação por teclado, os papéis acessíveis e o comportamento de remover o último chip com `Backspace` SHALL permanecer iguais aos do modo local.

#### Scenario: Modo local permanece inalterado

- **WHEN** o `UiMultiSelect` é renderizado sem a opção de modo remoto
- **THEN** ele continua filtrando localmente as `options` recebidas, sem emitir eventos de busca

#### Scenario: Chips selecionados sobrevivem à busca

- **WHEN** o usuário já selecionou itens e digita uma busca que não os inclui na página retornada
- **THEN** os chips continuam visíveis e removíveis, e o `v-model` não perde os valores

#### Scenario: Busca remota e carregamento de mais resultados

- **WHEN** o usuário digita no campo de busca remota ou solicita mais resultados
- **THEN** o componente emite o termo/paginação e renderiza os itens devolvidos, sem duplicar opções

#### Scenario: Estados vazio, carregando e falha

- **WHEN** a busca remota não retorna itens, está em andamento ou falha
- **THEN** o componente informa “nenhum resultado”, exibe carregamento ou a mensagem de erro com nova tentativa

#### Scenario: Acessibilidade e teclado preservados

- **WHEN** o `UiMultiSelect` remoto é operado por teclado e leitor de tela
- **THEN** os papéis, o nome acessível, as setas, `Enter`, `Escape` e a remoção do último chip com `Backspace` continuam funcionando como no modo local
