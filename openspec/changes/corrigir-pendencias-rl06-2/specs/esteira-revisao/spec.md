# Spec Delta

## ADDED Requirements

### Requirement: O filtro de status inclui itens fora do ciclo ativo

Quando o usuário aplica um filtro de **Status** no board, a lista SHALL incluir os itens daquele
status mesmo que eles estejam fora do ciclo ativo padrão. Em especial, `status=Publicado` SHALL
exibir as chamadas publicadas (com o vínculo ativo correspondente), ainda que a coluna Publicados
não as mostre por padrão. O filtro explícito de vínculo continua prevalecendo quando informado.

#### Scenario: Filtro Publicado exibe publicados
- **WHEN** o usuário aplica `status=Publicado` sem filtro de vínculo específico
- **THEN** o board exibe as chamadas em `Publicado` do conjunto, com o vínculo e o status correspondentes

#### Scenario: Filtro de vínculo prevalece
- **WHEN** o usuário aplica `status=Publicado` e um vínculo específico
- **THEN** o board exibe apenas os publicados daquele vínculo

### Requirement: A listagem do board usa projeção enxuta e cache de opções

A listagem do board SHALL carregar apenas os campos necessários para renderizar os cards, o
progresso e o contexto dos vínculos, sem materializar o HTML completo das descrições nem o array de
mídias. Os catálogos de opções dos filtros SHALL ser cacheados por curto período e invalidados nas
escritas que alterem chamadas ou seus vínculos, de modo que a abertura do board não repita as cinco
consultas de catálogo a cada requisição.

#### Scenario: Board sem over-fetch de conteúdo
- **WHEN** o board é aberto
- **THEN** a resposta não inclui o HTML completo de descrição/solução nem a lista completa de mídias de cada card

#### Scenario: Opções reaproveitadas
- **WHEN** o board é aberto duas vezes dentro da janela de cache sem escritas
- **THEN** os catálogos de opções são reaproveitados e as consultas de catálogo não se repetem

#### Scenario: Escrita invalida as opções
- **WHEN** uma chamada é criada, alterada, excluída ou transicionada
- **THEN** o cache de opções do board é invalidado para a próxima abertura