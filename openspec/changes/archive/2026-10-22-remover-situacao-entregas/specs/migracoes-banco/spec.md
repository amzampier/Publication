# Spec Delta

## MODIFIED Requirements

### Requirement: Migrations não destrutivas
Os arquivos de migration SHALL NOT remover dados ou objetos existentes de forma implícita: nenhuma migration pode conter `DROP TABLE`, `DROP VIEW` ou `DROP DATABASE` de objetos da aplicação, de modo que aplicar uma migration pendente nunca cause perda de dados não intencional. Objetos já existentes SHALL ser tratados de forma idempotente (`CREATE ... IF NOT EXISTS`). Uma migration de correção PODE remover registros de seed conhecidos por meio de `DELETE` escopado a identificadores fixos (ex.: `id LIKE 'log-seed-%'`), desde que não atinja dados operacionais. Uma migration PODE remover uma coluna declarada obsoleta por uma change registrada, desde que: (a) nenhum código leia ou escreva a coluna; (b) uma auditoria prévia comprove que todos os valores são o default ou semanticamente vazios; (c) a remoção use `DROP COLUMN IF EXISTS` e seja idempotente; (d) o rollback documentado recrie a coluna e seus índices.

#### Scenario: Migration aplicada sobre banco existente não apaga dados
- **WHEN** uma migration pendente é aplicada sobre um banco que já contém tabelas com dados
- **THEN** nenhum dado é removido e as tabelas e objetos permanecem intactos, salvo a remoção explícita de coluna obsoleta prevista no requirement

#### Scenario: Base vazia é provisionada pelos CREATEs
- **WHEN** as migrations rodam sobre um banco sem tabelas
- **THEN** o schema completo é criado pelos `CREATE TABLE` (sem depender de `DROP` prévio)

#### Scenario: Correção de seed é escopada e reexecutável
- **WHEN** uma migration de correção remove registros de seed por identificador fixo em um banco com dados operacionais
- **THEN** apenas as linhas de seed são removidas e a migration é idempotente em reexecução

#### Scenario: Remoção de coluna obsoleta é explícita e idempotente
- **WHEN** uma change registrada declara uma coluna obsoleta e a auditoria prévia mostra apenas o valor default
- **THEN** a migration remove a coluna com `DROP COLUMN IF EXISTS`, é registrada uma única vez em `_migrations` e o rollback documentado recria a coluna e o índice

#### Scenario: Coluna com valores não default bloqueia a remoção
- **WHEN** a auditoria prévia encontra valores diferentes do default na coluna declarada obsoleta
- **THEN** a remoção não é aplicada e o caso é tratado manualmente antes da migration
