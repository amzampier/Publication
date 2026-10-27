# Tasks

## 1. Views e schema

- [x] 1.1 Criar `server/migration/41_reconciliar_views_e_contratos.sql` recriando `v_release_itens`, `v_projeto_itens`, `v_manual_itens` e `manuais` com projeção explícita das colunas atuais, incluindo `publicado_em`, `tags_texto` e `chave_ativa` onde aplicável; incluir rollback e verificar com `SELECT 1` nas quatro views
- [x] 1.2 Ajustar os comentários de `entregas_itens.data_lancamento` e `data_liberacao` na migration 41, sem editar a migration 01 aplicada; verificar os comentários em `information_schema.COLUMNS`
- [x] 1.3 Adicionar `verificarViewsItens()` em `server/plugins/migration.ts` após `runMigrations()` para validar `SELECT 1` e as colunas-chave; verificar boot normal e falha explícita com uma view/coluna ausente
- [x] 1.4 Criar `scripts/verify-migration-41.mjs` read-only para conferir views e colunas; executar contra o banco local e documentar o resultado

## 2. Contratos e documentação

- [x] 2.1 Atualizar `docs/02` para refletir convite de conta existente com `alterar` e busca de e-mails sempre com `buscar`; verificar contra `server/api/convite/index.post.ts` e `server/api/usuarios/emails.get.ts`
- [x] 2.2 Atualizar `docs/bd/01` com o DDL/complemento das migrations 31–41, incluindo texto rico, `entregas_itens_softwares`, `projetos_escopo` e `publicado_em`; verificar que os objetos documentados existem no schema
- [x] 2.3 Atualizar `docs/bd/02` com os totais 92/67/41/14 e a nota de que `server/migration/02_seed.sql` é histórico/imutável; não editar o arquivo aplicado
- [x] 2.4 Corrigir `docs/02` para remover `visualizar_itens` de Escopo de Projetos, alinhando à ação real `visualizar`; verificar contra `app/config/perfis.ts` e `openspec/specs/autorizacao-rbac/spec.md`
- [x] 2.5 Atualizar o RL06 com o status de A-06, A-08, M-05, M-21, M-22, M-23 e M-29; manter o veredito global em aberto até o Change 2

## 3. Integração e verificação

- [x] 3.1 Rodar a migration em base local e confirmar `SELECT 1` nas views, colunas em `information_schema` e ausência de perda de dados
- [x] 3.2 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; registrar que os gates passam
- [x] 3.3 Rodar `openspec validate "reconciliar-views-e-contratos-rl06" --type change --strict` e `openspec validate --specs`; confirmar os deltas de `autorizacao-rbac` e `uploads`
