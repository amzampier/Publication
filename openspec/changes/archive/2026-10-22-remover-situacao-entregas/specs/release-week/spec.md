# Spec Delta

## MODIFIED Requirements

### Requirement: Flag de itens e expansão somente leitura
A tabela SHALL oferecer um **controle no cabeçalho** que habilita a visualização dos itens. Enquanto
habilitado, cada Release Week SHALL exibir um sinal **"+"**; ao acioná-lo, a linha SHALL expandir e
revelar os **itens da release** (`entregas_itens` vinculados) em modo somente leitura, com Chamada,
Título, Software, Módulo, Tipo, Impacto, Status e Data de liberação, obtidos de
`GET /api/release-week/:id/itens` sob demanda. Acionar novamente recolhe a linha. Release sem itens
SHALL exibir um estado vazio próprio dentro da expansão. A coluna de expansão não SHALL afetar
ordenação, busca ou paginação. A flag, a expansão e o endpoint de itens SHALL exigir a permissão
**`release-week`/`visualizar_itens`**; sem ela, a flag não é exibida e a API responde `403`.

#### Scenario: Habilitar a flag revela o sinal de "+"
- **WHEN** o usuário marca a flag de itens no cabeçalho da tabela
- **THEN** cada Release Week passa a exibir um sinal "+" para expandir

#### Scenario: Expandir mostra os itens da release
- **WHEN** o usuário aciona o "+" de uma Release Week com itens
- **THEN** a linha expande e exibe os itens daquela release em modo somente leitura

#### Scenario: Release sem itens
- **WHEN** o usuário expande uma Release Week sem itens
- **THEN** a expansão exibe um estado vazio informando que não há itens

#### Scenario: Recolher a expansão
- **WHEN** o usuário aciona novamente o controle de uma linha expandida
- **THEN** a linha recolhe e os itens deixam de ser exibidos

#### Scenario: Itens exigem a permissão própria
- **WHEN** um perfil sem `release-week`/`visualizar_itens` chama `GET /api/release-week/:id/itens`
- **THEN** a API responde `403` e nenhum item é retornado
