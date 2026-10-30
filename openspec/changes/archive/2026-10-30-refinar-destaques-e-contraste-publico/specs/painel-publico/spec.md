# Spec Delta

## MODIFIED Requirements

### Requirement: O painel exibe as chamadas em destaque do escopo

O painel SHALL exibir, na seção de Escopo de Projeto, o card **“Chamadas em destaque”** com até três
chamadas publicadas do escopo em destaque cujo `impacto` seja `Crítico` ou `Alto`, ordenadas com as
`Crítico` antes das `Alto` e, dentro de cada impacto, por `ordem_apresentacao` e depois por `chamada`.
Cada chamada SHALL exibir código, título, sistema(s), parceiro e o badge do impacto — `critico` com
`AlertTriangle` e **“Impacto: Crítico”**, ou `alto` com `Gauge` e **“Impacto: Alto”** —, sem depender
apenas de cor. Cada item SHALL abrir `/escopos/{id}#chamada-{id}` do escopo correspondente, e a página
de destino SHALL abrir rolada até o card da chamada. Sem chamadas `Crítico` ou `Alto` publicadas, o
card NÃO SHALL ser renderizado, mantendo o card do escopo visível.

#### Scenario: Lista em destaque

- **WHEN** o escopo em destaque tem chamadas publicadas com impacto `Crítico` ou `Alto`
- **THEN** o card exibe até três delas, com as críticas antes das altas, código, título, sistema(s),
  parceiro e o badge do impacto correspondente

#### Scenario: Abrir a chamada em destaque

- **WHEN** o visitante clica em uma chamada do card “Chamadas em destaque”
- **THEN** a navegação abre `/escopos/{id}#chamada-{id}` já rolada até o card correspondente, sem
  destaque adicional

#### Scenario: Mais de três chamadas em destaque

- **WHEN** o escopo tem mais de três chamadas publicadas com impacto `Crítico` ou `Alto`
- **THEN** o card exibe apenas as três primeiras pela ordenação definida

#### Scenario: Sem chamadas em destaque

- **WHEN** o escopo em destaque não tem chamada publicada com impacto `Crítico` ou `Alto`
- **THEN** o card “Chamadas em destaque” não é renderizado e o card do escopo permanece visível

#### Scenario: Dados opcionais da chamada em destaque

- **WHEN** a chamada em destaque não tem parceiro ou sistema publicado
- **THEN** o item omite o dado ausente, sem espaço vazio ou rótulo quebrado

#### Scenario: Impacto não depende de cor

- **WHEN** uma chamada em destaque é exibida
- **THEN** o texto do impacto e o ícone acompanham a cor — rose com `AlertTriangle` para `Crítico`,
  laranja com `Gauge` para `Alto`

### Requirement: A API do painel e do histórico tem contrato estável

`GET /api/publico/painel` SHALL retornar `releaseDestaque`, `manuaisDestaque`, `maisVistas`,
`modoMaisVistas` (`vistas` ou `recentes`), `filtros` com as opções de software e tipo,
`escopoDestaque` (ou `null`) e `chamadasCriticas` (lista de chamadas com impacto `Crítico` ou `Alto`,
possivelmente vazia).
`GET /api/publico/releases` SHALL aceitar `software`, `tipo`, `pagina` e `porPagina` e retornar os
itens da página, o total, a página e o tamanho da página. `porPagina` SHALL ter padrão 6 e limite
máximo 50; `pagina` inválida SHALL ser normalizada para 1; `tipo` fora do enum SHALL ser ignorado;
`software` desconhecido SHALL produzir resultado vazio. A resposta do histórico SHALL conter apenas
a página solicitada e as contagens agregadas por tipo, sem enviar todas as chamadas. As opções de
filtro SHALL ser derivadas apenas de conteúdo publicado.

#### Scenario: Contrato do painel

- **WHEN** `GET /api/publico/painel` responde
- **THEN** o corpo contém `releaseDestaque`, `manuaisDestaque`, `maisVistas`, `modoMaisVistas`,
  `filtros`, `escopoDestaque` e `chamadasCriticas`

#### Scenario: Contrato do escopo em destaque

- **WHEN** há escopo publicado
- **THEN** `escopoDestaque` contém id, código, nome, versão, ano, data efetiva, chamadas e sistemas, e
  `chamadasCriticas` contém no máximo três itens com impacto `Crítico` ou `Alto`, com código, título,
  sistema(s), parceiro e tipo

#### Scenario: Painel sem escopo

- **WHEN** não há escopo publicado
- **THEN** `escopoDestaque` é `null` e `chamadasCriticas` é uma lista vazia, sem erro

#### Scenario: Contrato do histórico

- **WHEN** `GET /api/publico/releases?pagina=2` responde
- **THEN** o corpo contém `itens`, `total`, `pagina` e `porPagina`, com no máximo seis itens por padrão

#### Scenario: Paginação limitada

- **WHEN** `porPagina` é maior que 50
- **THEN** a API limita o tamanho ao máximo permitido e não materializa o histórico inteiro

#### Scenario: Parâmetros inválidos

- **WHEN** `pagina` não é numérica ou `tipo` está fora do enum
- **THEN** a API normaliza a página para 1 e ignora o tipo inválido, sem erro de servidor

#### Scenario: Opções de filtro publicadas

- **WHEN** existem softwares ou tipos apenas em conteúdo não publicado
- **THEN** eles não aparecem nas opções de filtro do painel
