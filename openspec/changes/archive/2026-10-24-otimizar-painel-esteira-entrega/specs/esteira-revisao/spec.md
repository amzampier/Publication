# Spec Delta

## ADDED Requirements

### Requirement: O board da Esteira é paginado

`GET /api/esteira-revisao` SHALL aceitar `pagina` e `porPagina`, aplicar `LIMIT/OFFSET` no servidor
e devolver `{ itens, total, pagina, porPagina }` (além dos agregados existentes). A paginação SHALL
respeitar os mesmos filtros e o RBAC do board e NÃO SHALL materializar todas as chamadas em memória.

#### Scenario: Board com mais itens que a página
- **WHEN** o conjunto filtrado tem mais itens que `porPagina`
- **THEN** a resposta traz apenas a página solicitada e o total do conjunto

#### Scenario: Filtros preservados
- **WHEN** o usuário filtra por status/vinculo e troca de página
- **THEN** os filtros continuam aplicados e a contagem reflete a interseção

#### Scenario: RBAC preservado
- **WHEN** um perfil sem `esteira-revisao/visualizar` chama a API
- **THEN** a resposta é `403` antes de qualquer leitura