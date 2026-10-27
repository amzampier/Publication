# Spec Delta

## ADDED Requirements

### Requirement: O UiSelect oferece busca remota opcional

O `UiSelect` SHALL manter o modo local como padrão e SHALL oferecer um modo remoto opcional, no qual as opções são carregadas pelo consumidor em vez de recebidas completas. No modo remoto, o componente SHALL aceitar uma opção selecionada fora da página atual (para exibir o label), SHALL emitir um evento de busca com o termo digitado (com debounce no consumidor) e SHALL exibir estados de carregamento, ausência de resultados e falha. A navegação por teclado, os papéis `combobox`/`listbox`/`option` e o destaque de foco/erro SHALL permanecer iguais aos do modo local.

#### Scenario: Modo local permanece inalterado

- **WHEN** o `UiSelect` é renderizado sem a opção de modo remoto
- **THEN** ele continua filtrando localmente as `options` recebidas, sem emitir eventos de busca

#### Scenario: Abertura carrega a primeira página

- **WHEN** um `UiSelect` remoto é aberto com a busca vazia
- **THEN** o consumidor é notificado para carregar a primeira página e o componente exibe o indicador de carregamento enquanto aguarda

#### Scenario: Busca remota atualiza as opções

- **WHEN** o usuário digita no campo de busca de um `UiSelect` remoto
- **THEN** o componente emite o termo (respeitando o debounce) e renderiza apenas as opções devolvidas pelo consumidor

#### Scenario: Seleção fora da página é preservada

- **WHEN** o valor selecionado não está entre as opções da página atual
- **THEN** o gatilho continua exibindo o label da opção selecionada informada pelo consumidor

#### Scenario: Estados vazio, carregando e falha

- **WHEN** a busca remota não retorna itens, está em andamento ou falha
- **THEN** o componente exibe, respectivamente, “nenhum resultado”, o indicador de carregamento ou a mensagem de erro com possibilidade de nova tentativa

#### Scenario: Acessibilidade preservada

- **WHEN** o `UiSelect` remoto é operado por teclado e leitor de tela
- **THEN** os papéis, o nome acessível, as setas, `Enter`, `Escape` e o destaque de foco/erro continuam funcionando como no modo local
