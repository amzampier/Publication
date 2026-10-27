# Design

## Context

Ver `proposal.md - Why`. O estado atual relevante:

- `server/utils/db.ts` cria um único pool a partir de `runtimeConfig.db*`; `server/utils/migration-runner.ts` usa esse mesmo pool (`getDbPool()`) para DDL e DML.
- `nuxt.config.ts` lê apenas `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`; não existe leitura de `DB_MIGRATION_*` em nenhum arquivo do repositório.
- O MariaDB local tem somente `root@localhost` e `zampier@%`; não há `publications_migration` nem `publications_app`.
- O único artefato que provisiona usuário é `scripts/db-least-privilege.sql`, referenciado por `.env.example`, `docs/02` e `docs/18`.
- O script concede DML + `EVENT`, mas não DDL — incompatível com o runner, que executa `CREATE TABLE`/`ALTER TABLE` no boot.

## Goals / Non-Goals

**Goals:**

- Remover do repositório qualquer provisionamento de usuário/grants no MariaDB.
- Manter uma única conta de conexão e migrations, vinda de `DB_*`.
- Documentar os pré-requisitos de privilégio da conta fornecida pelo operador, inclusive DDL para migrations pendentes.
- Preservar o histórico de auditoria/changes.

**Non-Goals:**

- Alterar o código do pool, do runner ou do `nuxt.config.ts` (já compatível).
- Criar conta separada de migração ou qualquer forma de elevação automática de privilégio.
- Executar `DROP USER`/rotação de senha automaticamente pelo projeto.
- Reescrever `docs/RL0x` ou `openspec/changes/archive/**`.
- Redefinir a política de privilégios do operador (o operador pode restringir a conta por conta própria, fora do projeto).

## Decisions

1. **Remover o script em vez de corrigi-lo.** `scripts/db-least-privilege.sql` existe apenas para criar/ajustar uma conta; adicionar DDL a ele continuaria provisionando usuário sem autorização. Alternativa descartada: manter o script e conceder DDL ao `publications_app`.
2. **Não introduzir conta de migração.** O runner e o pool já usam a mesma conta; `DB_MIGRATION_*` nunca foi lido. Alternativa descartada: separar runtime (DML) de migrations (DDL) com duas contas — exigiria novo segredo/config e não foi autorizada.
3. **Não alterar código de runtime.** A mudança é de documentação e artefatos operacionais; tocar no pool/runner aumentaria o risco sem necessidade. A única exigência nova é documental: a conta do operador precisa cobrir o que o boot executa.
4. **Neutralizar `.env.example` e a documentação viva.** `DB_USER` passa a ser um placeholder genérico; `docs/02` e `docs/18` descrevem a conta como fornecida pelo operador e removem o passo de criação. Alternativa descartada: manter a recomendação de menor privilégio como "opcional" — reintroduziria o conceito que o usuário pediu para retirar.
5. **Preservar registros históricos.** `docs/RL0x` e `openspec/changes/archive/**` documentam o que foi decidido/auditado no passado e não serão editados; a documentação viva passa a ser a fonte atual.
6. **Limpeza operacional fora do repositório.** Como não há usuário criado no ambiente local (verificado), a remoção de `publications_migration`/`publications_app` e das variáveis `DB_MIGRATION_*` é um checklist para ambientes onde elas existirem, com rotação da senha exposta. O projeto não executa essa limpeza automaticamente.

## Risks / Trade-offs

- [Perda da recomendação de menor privilégio] → A documentação passa a declarar que a conta é responsabilidade do operador e que o blast radius depende dos grants dele; quem quiser restringir faz isso fora do projeto.
- [Conta sem DDL quebra o boot] → Pré-requisito documentado e erro explícito do runner (privilégio negado); não há criação automática de conta.
- [Instruções antigas em arquivos históricos] → Nota na documentação viva de que `docs/RL0x`/arquivos arquivados são históricos e não instruções atuais.
- [Segredo exposto em conversa/ambiente] → Rotacionar a senha e remover a variável do ambiente; localmente não há usuário correspondente.
- [Alguém reintroduzir o script] → O requisito em `migracoes-banco` torna a proibição explícita e testável por inspeção do repositório.

## Migration Plan

1. Remover `scripts/db-least-privilege.sql`.
2. Atualizar `.env.example`, `docs/02` e `docs/18`; verificar `AGENTS.md` por menção residual.
3. Confirmar por busca que não restam referências vivas a `publications_app`, `db-least-privilege`, `DB_MIGRATION_*` ou instruções de `CREATE USER`/`GRANT`.
4. Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
5. Em cada ambiente já provisionado: remover `DB_MIGRATION_*` do `.env`, dropar `publications_migration`/`publications_app` se existirem e rotacionar a senha exposta (com backup/confirmacão do operador).
6. Rollback: restaurar os arquivos de documentação/script a partir do commit anterior; nenhuma alteração de schema ou dado é feita por esta change.

## Open Questions

Nenhuma pendente. A decisão de manter uma conta única com DDL (como o `zampier` atual) foi confirmada no escopo desta change; restringir privilégios é opcional e externo ao projeto.
