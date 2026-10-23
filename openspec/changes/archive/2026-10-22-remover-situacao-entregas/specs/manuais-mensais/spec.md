# Spec Delta

## MODIFIED Requirements

### Requirement: Flag de itens e expansão somente leitura
A tabela SHALL oferecer um **controle no cabeçalho** que habilita a visualização dos itens. Enquanto
habilitado, cada catálogo mensal SHALL exibir um sinal **"+"**; ao acioná-lo, a linha SHALL expandir
e revelar os **itens do manual** (`entregas_itens` com `manual_id` vinculado) em modo somente
leitura, com Chamada, Título, Software, Módulo, Tipo, Impacto, Status e Data de liberação,
obtidos sob demanda de `GET /api/manuais/:id/itens`. Acionar novamente recolhe a linha. Catálogo sem
itens SHALL exibir um estado vazio próprio dentro da expansão. A coluna de expansão não SHALL afetar
ordenação, busca ou paginação. A flag, a expansão e o endpoint de itens SHALL exigir a permissão
**`manuais`/`visualizar_itens`**; sem ela, a flag não é exibida e a API responde `403`.

#### Scenario: Habilitar a flag revela o sinal de "+"
- **WHEN** o usuário marca a flag de itens no cabeçalho da tabela
- **THEN** cada catálogo mensal passa a exibir um sinal "+" para expandir

#### Scenario: Expandir mostra os itens do manual
- **WHEN** o usuário aciona o "+" de um catálogo com itens
- **THEN** a linha expande e exibe os itens daquele manual em modo somente leitura

#### Scenario: Catálogo sem itens
- **WHEN** o usuário expande um catálogo sem itens
- **THEN** a expansão exibe um estado vazio informando que não há itens

#### Scenario: Recolher a expansão
- **WHEN** o usuário aciona novamente o controle de uma linha expandida
- **THEN** a linha recolhe e os itens deixam de ser exibidos

#### Scenario: Itens exigem a permissão própria
- **WHEN** o perfil não concede `manuais`/`visualizar_itens`
- **THEN** a flag de itens não é exibida na tabela e `GET /api/manuais/:id/itens` responde `403`
