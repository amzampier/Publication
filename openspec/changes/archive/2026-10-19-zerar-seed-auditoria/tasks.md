# Tasks

## 1. Migration de remoção do seed

- [x] 1.1 Criar `server/migration/18_remover_seed_auditoria.sql` com `DELETE FROM auditoria WHERE id LIKE 'log-seed-%';`, cabeçalho explicando o escopo e bloco de rollback comentado (convenção `docs/02 §4.5`); verificar que o arquivo não contém `USE` e termina com `;`
- [x] 1.2 Reiniciar o dev server (`npm run dev`) e conferir no log `[migrations] Aplicando … 18_remover_seed_auditoria.sql` seguido de `[migrations] OK`; verificar `SELECT nome FROM _migrations WHERE nome = '18_remover_seed_auditoria.sql'` retorna 1 linha

## 2. Verificação do banco zerado

- [x] 2.1 Em banco existente, verificar `SELECT COUNT(*) FROM auditoria WHERE id LIKE 'log-seed-%'` = `0` e que os registros reais remanescentes (UUID) permanecem intactos
- [x] 2.2 Em banco novo (base `publications` recriada), subir o servidor e verificar `SELECT COUNT(*) FROM auditoria` = `0` após o boot completo
- [x] 2.3 Abrir `/admin/auditoria` com sessão válida e confirmar o estado vazio (tabela sem registros e KPIs zerados), depois executar uma operação real (ex.: criar usuário) e confirmar que ela aparece na trilha

## 3. Documentação

- [x] 3.1 Atualizar `docs/05 - Gestão de Auditoria.md` §7 para declarar que a trilha nasce vazia e que a `18` remove o seed de bancos existentes (a `07`/`13` deixam de persistir conteúdo)
- [x] 3.2 Atualizar a verificação da §12 do `docs/05` (trocar `SELECT COUNT(*) = 25` por `= 0` de `log-seed-%`) e conferir referências cruzadas no `docs/02`
- [x] 3.3 Rodar os gates `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar que permanecem verdes

## 4. Integração

- [x] 4.1 Rodar `openspec validate zerar-seed-auditoria --strict` (ou `--specs`) e confirmar que a change e as specs validadas passam; então seguir o fluxo `/opsx-sync` + `/opsx-archive` para sincronizar as specs alteradas
