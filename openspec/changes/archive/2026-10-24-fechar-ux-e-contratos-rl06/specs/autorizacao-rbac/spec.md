# Spec Delta

## ADDED Requirements

### Requirement: O catálogo cobre o detalhe da chamada

O catálogo de autorização SHALL incluir `GET /api/lancar-chamadas/:id` mapeado para
`lancar-chamadas`/`visualizar`.

#### Scenario: Detalhe exige visualizar
- **WHEN** um perfil sem `lancar-chamadas`/`visualizar` chama `GET /api/lancar-chamadas/:id`
- **THEN** a API responde `403`

#### Scenario: Perfil autorizado
- **WHEN** um perfil com `lancar-chamadas`/`visualizar` chama o detalhe de uma chamada existente
- **THEN** a API responde `200`
