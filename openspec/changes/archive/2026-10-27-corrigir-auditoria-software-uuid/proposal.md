# Proposal

## Why

O B-03 voltou ao escopo: a migration 14 promoveu `softwares.codigo` a PK e removeu o UUID da tabela, mas a auditoria de Softwares continua gravando `SFT-XXX` em `auditoria.entidade_id`. A spec de auditoria exige o UUID canônico da entidade, com o código de negócio apenas em `detalhes`.

## What Changes

- Manter `softwares.codigo` como PK e chave de negócio usada pelas FKs.
- Adicionar `softwares.uuid UUID UNIQUE`, com backfill dos registros existentes.
- Expor `uuid` em `SoftwareApi`, `COLUNAS` e no mapeador de leitura.
- Usar `software.uuid` em `entidade_id` nas auditorias de criação, alteração e exclusão; manter `SFT-XXX` em `detalhes`.
- Criar migration 42, script de verificação e testes de auditoria por UUID.
- Atualizar `docs/02`, `docs/05` e RL06.
- Não alterar a PK, FKs, rotas de UI ou dados de negócio; não reescrever a auditoria histórica append-only.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. A spec `auditoria` já exige UUID em `entidade_id`; esta change alinha a implementação. O change declara `skip_specs: true`.

## Impact

- Banco: `server/migration/42_software_uuid_auditoria.sql` (novo).
- Servidor: `server/utils/softwares.ts`, `server/api/softwares/index.post.ts`, `server/api/softwares/[codigo]/index.put.ts`, `server/api/softwares/[codigo]/index.delete.ts`.
- Scripts: `scripts/verify-migration-42.mjs` (novo).
- Testes: auditoria de Software por UUID e verificação da migration.
- Documentação: `docs/02`, `docs/05`, `docs/RL06`.
