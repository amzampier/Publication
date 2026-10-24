# Spec Delta

## ADDED Requirements

### Requirement: O identificador da entidade na trilha é o UUID canônico

Ao registrar uma operação de escrita, o sistema SHALL gravar em `auditoria.entidade_id` o **UUID**
do registro afetado, e não o código de negócio (ex.: `RW-43/2026`, `MAN-10/2026`, `SFT-045`). O
código de negócio SHALL permanecer legível em `detalhes`. Quando a operação não tiver uma entidade
única (ex.: importação em lote), `entidade_id` PODE ser vazio, mas o detalhe SHALL identificar o
lote/recurso. A API de auditoria continua expondo `entidade_id`.

#### Scenario: Inclusão de usuário grava o UUID
- **WHEN** `POST /api/usuarios` conclui com sucesso
- **THEN** o registro de auditoria contém o UUID do usuário em `entidade_id` e o nome/e-mail em `detalhes`

#### Scenario: Código de negócio não substitui o UUID
- **WHEN** uma Release Week ou Software é criado/alterado/excluído
- **THEN** `entidade_id` recebe o UUID do registro e o código (`RW-…`/`SFT-…`) aparece apenas em `detalhes`

#### Scenario: Operação sem entidade única
- **WHEN** uma importação em lote é registrada
- **THEN** `entidade_id` fica vazio e o detalhe informa a contagem e o recurso importado