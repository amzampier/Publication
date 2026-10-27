# Proposal

## Why

A reauditoria do RL06 no estado atual encontrou resíduos de schema e de contrato que não bloqueiam o uso diário, mas impedem o fechamento formal do RL06-2: as views de itens foram criadas com `SELECT *` e não expõem as colunas adicionadas depois (`publicado_em`, `tags_texto`, `chave_ativa`); o catálogo RBAC não registra que o convite de conta existente exige também `alterar`; e a spec de e-mails/uploads ainda diverge do comportamento atual. A documentação de banco também está defasada em relação às migrations 31–40.

## What Changes

- Criar a migration 41 recriando `v_release_itens`, `v_projeto_itens`, `v_manual_itens` e `manuais` com projeção explícita das colunas atuais, incluindo `publicado_em`, `tags_texto` e `chave_ativa` onde aplicável.
- Validar as views no boot: `SELECT 1` e presença das colunas-chave; falhar cedo se alguma estiver inválida ou defasada.
- Atualizar comentários de schema de `data_lancamento`/`data_liberacao` via migration 41, preservando as migrations já aplicadas.
- Alinhar as specs ao comportamento atual:
  - convite de conta existente exige `convite` + `alterar`;
  - `GET /api/usuarios/emails` exige sempre `visualizar` + `buscar`;
  - upload `chunked` sem `Content-Length` é recusado imediatamente com `413`.
- Atualizar a documentação de banco (`docs/bd/01`, `docs/bd/02`), `docs/02` e as notas de status do RL06.
- Não alterar código de aplicação, schema de tabelas de negócio, migrations já aplicadas ou dados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `autorizacao-rbac`: convite de conta existente exige `alterar` adicional; busca de e-mails exige sempre `buscar`.
- `uploads`: upload `chunked` sem `Content-Length` é recusado imediatamente com `413`.

## Impact

- Banco: `server/migration/41_reconciliar_views_e_contratos.sql` (novo); nenhuma alteração de tabela de negócio.
- Boot: `server/plugins/migration.ts` (verificação das views).
- Scripts: `scripts/verify-migration-41.mjs` (novo, read-only).
- Specs: `openspec/specs/autorizacao-rbac/spec.md`, `openspec/specs/uploads/spec.md`.
- Documentação: `docs/02`, `docs/bd/01`, `docs/bd/02`, `docs/RL06`.
- `server/migration/02_seed.sql` permanece imutável; os totais históricos serão corrigidos apenas na documentação.
