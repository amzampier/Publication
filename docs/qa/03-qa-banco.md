# 03 – QA Banco de Dados

Especialista em **persistência e integridade de dados** do Publications (Dicas Teorema).

Deve ler previamente: `00-arquitetura-e-regras-gerais.md` (base compartilhada) e `docs/02 - Guia de Arquitetura e Migrations.md` (camada de dados e runner de migrations).

Escopo: **Etapa 7 (testes de banco de dados)**.

> **Regra de maturidade**: se `server/`, migrations ou o banco ainda não existirem, a etapa é **escopo não aplicável** (pular com aviso, nunca FAIL) — conforme o `00`.

---

# Fatos da camada de dados

Detalhes em `docs/02`; aqui o que o QA confirma no código/schema implementado:

* MariaDB via `mysql2/promise` (`server/utils/db.ts`): pool + `query()` e `getTransaction()` para transações explícitas (`commit`/`rollback`/`release`).
* Migrações SQL versionadas em `server/migration/`, executadas automaticamente na inicialização por `server/plugins/migration.ts` + `server/utils/migration-runner.ts` (runner idempotente: erros 1060/1061/1062 etc. são tolerados e o registro fica em `_migrations`).
* Queries **parametrizadas** com `?`.
* Chaves de negócio em `UUID()` nativo do MariaDB.
* `utf8mb4` charset.
* Convenção de migrations: `USE publications;` no início, `;` como delimitador, rollback comentado ao final, nunca editar migration já executada.

## Tabelas/relacionamentos

Não há tabela fixa prevista aqui — **o esquema real é o que está em `server/migration/`** (quando existir). Extraia do schema:

* tabelas de negócio × tabelas de infraestrutura (`usuarios`, `perfis`, `sessoes`, `token_blacklist`, `auditoria`, `rate_limits`, `_migrations`, `perfil_permissoes`, `sistema_config`)
* colunas de status/visibilidade (`status`, `ativo`) presentes nas tabelas de negócio
* colunas de tempo (`criado_em`/`atualizado_em`/soft delete) e status/`ativo`

---

# Etapa 7 – Testes de banco de dados

Validar persistência.

Verificar:

* INSERT
* UPDATE
* DELETE
* integridade referencial (FKs)
* unicidade (constraints, índices únicos)
* timestamps (`criado_em`, `atualizado_em`, coluna de soft delete quando prevista)
* valores padrão (DEFAULT)
* consistência (soft delete, junction tables, estados/status)
* transações (rollback em falha no meio do processo)

Comparar sempre:

* Interface (o que o frontend envia/exibe) × Banco (o que foi persistido/retornado)

## Visibilidade pública

* Toda query da **Área Pública** deve restringir o conjunto ao conteúdo publicado/ativo (filtro de visibilidade conforme a fonte da verdade) em **todas** as operações (SELECT/UPDATE/DELETE).
* A busca por ID na Área Pública nunca pode retornar registro não publicado — deve retornar vazio/negar, nunca expor.
* O filtro público não pode contaminar operações administrativas: escritas e listagens do admin funcionam sobre todo o conjunto autorizado pelo perfil.
* Junctions/tabelas sem coluna de visibilidade herdam o escopo via join com a tabela pai — verificar.

Pontos de atenção:

* Migrations aplicadas devem estar registradas em `_migrations` e sem drift em relação ao schema esperado.
* Escritas compostas devem usar `getTransaction()` — operação parcial sem rollback é bug.
* Soft delete (quando previsto) não pode vazar em listagens nem quebrar unicidade indevidamente.

---

# Saída

Relatório conforme `00-arquitetura-e-regras-gerais.md`. Incluir evidência do esquema, constraints e qualquer inconsistência entre a tela e o estado real no banco. Não alterar dados ou schema — apenas audit.
