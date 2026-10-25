# Spec Delta

## ADDED Requirements

### Requirement: A API da Esteira converte carimbos de publicação com segurança

A API da Esteira SHALL converter `publicado_em` (e demais datas do banco) para ISO aceitando tanto
`Date` quanto string, sem lançar `RangeError` e sem descartar itens. Um pai `Publicado` com carimbo
preenchido NÃO SHALL impedir a listagem, o detalhe, o histórico ou as transições da Esteira.

#### Scenario: Pai publicado com carimbo Date
- **WHEN** existe uma Release, Manual ou Escopo `Publicado` cujo `publicado_em` o driver entrega como `Date`
- **THEN** `GET /api/esteira-revisao` e `GET /api/esteira-revisao/:id` respondem `200`, com `contexto.*.publicadoEm` em ISO e todos os itens do board

#### Scenario: Carimbo nulo
- **WHEN** o pai não possui `publicado_em`
- **THEN** a API responde `200` e devolve `publicadoEm: null`, sem erro

#### Scenario: Transição continua funcionando
- **WHEN** o usuário aprova, recusa ou publica um item com pai publicado e carimbo preenchido
- **THEN** a transição é gravada e o histórico/auditoria são registrados normalmente