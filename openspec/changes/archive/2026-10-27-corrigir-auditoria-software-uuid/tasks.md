# Tasks

## 1. Schema e migration

- [x] 1.1 Criar `server/migration/42_software_uuid_auditoria.sql` com coluna `uuid UUID`, backfill dos registros, `NOT NULL` e índice único; incluir rollback e verificar em `information_schema`/`SHOW INDEX`
- [x] 1.2 Criar `scripts/verify-migration-42.mjs` read-only para conferir migration registrada, coluna, ausência de nulos e unicidade; executar contra o banco local
- [x] 1.3 Atualizar `docs/bd/01` com `softwares.uuid` e a migration 42; verificar que o DDL documentado corresponde ao schema

## 2. API e auditoria

- [x] 2.1 Incluir `uuid` em `SoftwareApi`, `COLUNAS` e `montarSoftware` em `server/utils/softwares.ts`; verificar que `listarSoftwares`/`buscarSoftware` devolvem o campo
- [x] 2.2 Alterar as auditorias de criação, alteração e exclusão de Software para usar `software.uuid`/`atualizado.uuid`/`existente.uuid` e manter o `SFT-XXX` em `detalhes`; verificar por E2E das três rotas
- [x] 2.3 Adicionar teste/E2E que confirme `auditoria.entidade_id` como UUID e código apenas em `detalhes`; atualizar `docs/05` e `docs/02`

## 3. Integração e verificação

- [x] 3.1 Aplicar a migration 42 em base existente e validar ausência de perda de dados/backfill completo
- [x] 3.2 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; registrar os gates
- [x] 3.3 Rodar `openspec validate "corrigir-auditoria-software-uuid" --type change --strict` e `openspec validate --specs`; revisar o diff final
- [x] 3.4 Atualizar o RL06 para marcar B-03 como corrigido com UUID; verificar consistência com a auditoria E2E
