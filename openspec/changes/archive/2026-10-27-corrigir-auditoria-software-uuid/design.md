# Design

## Context

Ver `proposal.md`. `softwares.codigo` é a PK desde a migration 14 e é referenciada por `entregas_itens.software_id` e `entregas_itens_softwares.software_codigo`. Não há UUID na tabela. As rotas de Software auditam com `codigo`, contrariando a spec de auditoria, que exige o UUID canônico e deixa o código em `detalhes`.

## Goals / Non-Goals

**Goals:**

- Dar a cada Software um UUID estável para auditoria.
- Preservar `codigo` como PK/FK e identidade de negócio.
- Corrigir as três rotas de auditoria de Software.
- Validar a migration e os eventos em E2E.

**Non-Goals:**

- Trocar a PK de Softwares para UUID.
- Alterar FKs, UI, importação ou regras de negócio.
- Reescrever registros históricos da auditoria append-only.
- Alterar a spec de auditoria (já exige UUID).

## Decisions

### 1. Coluna separada `uuid`

Adicionar `softwares.uuid UUID` com `UNIQUE`, em vez de restaurar o antigo `id` como PK.

Rationale: o código é a chave usada pelas FKs e pela UI; trocar a PK exigiria mudanças em `entregas_itens`, `entregas_itens_softwares`, rotas e frontend. A coluna separada atende a auditoria sem quebrar contratos.

### 2. Migration 42

Sequência:

1. `ADD COLUMN IF NOT EXISTS uuid UUID NULL`;
2. `UPDATE softwares SET uuid = UUID() WHERE uuid IS NULL`;
3. `MODIFY uuid UUID NOT NULL`;
4. `CREATE UNIQUE INDEX IF NOT EXISTS uk_softwares_uuid (uuid)`.

Rollback documentado: remover índice/coluna e o registro em `_migrations`. Nenhum dado de negócio é alterado.

### 3. Exposição e auditoria

- `SoftwareApi` e `COLUNAS` incluem `uuid`; `montarSoftware` o devolve.
- `POST /api/softwares` usa `software.uuid`.
- `PUT /api/softwares/:codigo` usa `atualizado.uuid`.
- `DELETE /api/softwares/:codigo` usa `existente.uuid`.
- `detalhes` continuam com `SFT-XXX`.

A auditoria histórica com códigos permanece como snapshot imutável; apenas novos eventos passam a usar UUID.

### 4. Verificação

- `scripts/verify-migration-42.mjs` confere coluna, ausência de nulos, unicidade e registro da migration.
- E2E: criar, editar e excluir Software; consultar auditoria e validar UUID em `entidade_id` + código em `detalhes`; limpar os registros de teste.
- Gates completos.

## Risks / Trade-offs

- **Backfill em tabela existente** → `UPDATE` único e transação; volume de Softwares é pequeno.
- **UUID duplicado** → índice único e `IF NOT EXISTS`; a migration falha explicitamente se houver colisão.
- **Auditoria histórica mista** → mantida como snapshot append-only; documentada como legado.
- **Rotas antigas** → cobertas por E2E das três operações.

## Migration Plan

1. Aplicar a migration 42 no boot.
2. Executar `scripts/verify-migration-42.mjs`.
3. Validar auditoria E2E.
4. Rollback: remover índice/coluna e apagar o registro da migration; a auditoria histórica não é tocada.

## Open Questions

Nenhuma.
