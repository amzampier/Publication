# Design

## Context

Ver `proposal.md`. As views `v_release_itens`, `v_projeto_itens`, `v_manual_itens` e `manuais` foram recriadas na migration 31 com `SELECT *`, que congelou a projeção no schema daquele momento. As migrations 33 e 37 adicionaram `publicado_em` e `tags_texto`, mas não recriaram as views. Nenhum código de aplicação consome essas views hoje; o risco é para ferramentas, relatórios e backups.

O catálogo RBAC e a spec de uploads têm pequenas divergências com o código: convite de conta existente exige `alterar`, e-mails exigem `buscar` sempre, e uploads `chunked` sem `Content-Length` são recusados com `413` antes da leitura.

## Goals / Non-Goals

**Goals:**

- Alinhar as views ao schema vigente com projeção explícita.
- Falhar o boot se uma view estiver inválida ou sem as colunas-chave.
- Alinhar specs e documentação ao comportamento atual, sem alterar endpoints.
- Manter migrations já aplicadas imutáveis.

**Non-Goals:**

- M-10/M-11/B-07 (Change 2).
- Alterar dados de negócio ou tabelas de aplicação.
- Mudar permissões efetivas ou código de RBAC/upload.
- Área Pública.

## Decisions

### 1. Projeção explícita nas views

Usar `CREATE OR REPLACE VIEW ... AS SELECT <colunas explícitas> FROM ...` em vez de `SELECT *`.

Rationale: `SELECT *` em view congela a lista de colunas; a próxima migration que adicionar uma coluna não a expõe. A lista explícita documenta o contrato e permite ao boot check detectar ausência das colunas-chave.

Alternativa descartada: `SELECT *` agora + boot check apenas de `SELECT 1`; não detectaria a defasagem que gerou o M-05.

### 2. Verificação no boot

Adicionar `verificarViewsItens()` em `server/plugins/migration.ts`, após `runMigrations()`:

- `SELECT 1 FROM <view> LIMIT 1` nas quatro views;
- consulta a `information_schema.COLUMNS` para exigir:
  - `publicado_em` e `tags_texto` nas views de itens;
  - `arquivada`, `publicado_em` e `chave_ativa` em `manuais`.

Falha gera erro com o nome da view/coluna e aborta o boot (fail-fast já existente).

Alternativa descartada: confiar só em `SELECT 1`; uma view pode ser consultável e ainda não expor as colunas novas.

### 3. Comentários de schema na migration 41

A migration 41 também ajusta os comentários de `entregas_itens.data_lancamento` e `data_liberacao` via `ALTER TABLE ... MODIFY COLUMN` com a mesma definição, para não editar a migration 01 já aplicada.

Alternativa descartada: editar `01_create_tables.sql`; ele é histórico e já foi aplicado.

### 4. `02_seed.sql` permanece imutável

Os comentários de totais em `server/migration/02_seed.sql` estão históricos, mas o próprio arquivo declara que não deve ser editado após aplicação. A correção será documental em `docs/bd/02` e no complemento de `docs/bd/01`.

### 5. Specs alinhadas ao código

- Convite de conta existente: `convite` + `alterar`; perfil real do alvo preservado.
- E-mails: `visualizar` + `buscar` sempre, com `q` mínimo de 2.
- Uploads: `chunked` sem `Content-Length` → `413` imediato.

Não há alteração de código de autorização/upload; a spec passa a descrever o comportamento atual.

## Risks / Trade-offs

- **Views com lista explícita exigem manutenção futura** → comentário na migration e boot check; toda nova coluna usada por consumidores deve atualizar a view.
- **Boot check adiciona consultas leves** → quatro `SELECT 1 LIMIT 1` + uma consulta em `information_schema`; custo desprezível no boot.
- **`ALTER TABLE ... MODIFY COLUMN` pode bloquear a tabela** → apenas metadados/comentário; executar em janela de manutenção se a tabela estiver grande.
- **M-22 permanece histórico** → documentação registra que o comentário da migration 02 é imutável.
- **Specs mais restritivas que o código antigo** → não há mudança de comportamento; apenas contrato documentado.

## Migration Plan

1. Criar `41_reconciliar_views_e_contratos.sql`.
2. Subir a aplicação; o runner aplica a migration e executa o boot check.
3. Validar as views e as colunas com o script `scripts/verify-migration-41.mjs`.
4. Rollback documentado no SQL: recriar as views anteriores e reverter comentários, se necessário; nenhum dado de negócio é alterado.

## Open Questions

Nenhuma.
