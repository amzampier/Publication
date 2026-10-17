# Tasks

## 1. Migration: índices e expurgo

- [x] 1.1 Criar `server/migration/11_indices_e_expurgo.sql` com (a) `CREATE INDEX idx_audit_data_hora_id ON auditoria (data_hora DESC, id DESC)`, (b) `CREATE INDEX idx_seguranca_ocorrido_id ON seguranca_eventos_login (ocorrido_em DESC, id DESC)`, (c) `CREATE INDEX idx_usuarios_nome ON usuarios (nome_completo)`, (d) três `CREATE EVENT IF NOT EXISTS` diários (statement único cada): `ev_expurgo_sessoes`, `ev_expurgo_token_blacklist`, `ev_expurgo_seguranca_login` — todos com bloco `-- REVERTER (ROLLBACK)` comentado ao final, sem `USE`. Verificação: `npm run build` OK e, no boot, `_migrations` passa a conter `11_indices_e_expurgo.sql` (11 registros).
- [x] 1.2 Verificar no banco que os índices existem e o `EXPLAIN` deixa de acusar `Using filesort`. Verificação: `SHOW INDEX`/`information_schema.STATISTICS` confirma `idx_audit_data_hora_id`, `idx_seguranca_ocorrido_id`, `idx_usuarios_nome`; `EXPLAIN ... ORDER BY data_hora DESC, id DESC` usa o índice composto (sem `filesort`).
- [x] 1.3 Verificar que os três eventos de expurgo estão `ENABLED` no `information_schema.EVENTS`. Verificação: `SELECT EVENT_NAME, STATUS FROM information_schema.EVENTS` lista `ev_expurgo_sessoes`, `ev_expurgo_token_blacklist`, `ev_expurgo_seguranca_login` com `ENABLED`.

## 2. Pool e teto de detalhes

- [x] 2.1 Em `server/utils/db.ts`, adicionar `connectTimeout` e `acquireTimeout` ao `createPool`, lidos de `DB_CONNECT_TIMEOUT`/`DB_ACQUIRE_TIMEOUT` (ms) com defaults (ex.: 10000). Verificação: `npm run build` OK.
- [x] 2.2 Em `server/utils/audit.ts`, reduzir o teto de `detalhes` de `16_000_000` para `8_000`. Verificação: `npm run build` OK.

## 3. jspdf sob demanda

- [x] 3.1 Em `app/components/usuarios/gerarPdfUsuarios.ts`, trocar os imports estáticos de `jspdf`/`jspdf-autotable` por `await import(...)` dentro da função exportada. Verificação: `npm run build` OK e o chunk do jspdf deixa de ser importado estaticamente pelo cabeçalho da tela.
- [x] 3.2 Aplicar o mesmo em `app/components/usuarios/gerarPdfFichaCadastral.ts`. Verificação: build OK.
- [x] 3.3 Aplicar o mesmo em `app/components/auditoria/gerarPdfAuditoria.ts`. Verificação: build OK.
- [x] 3.4 Aplicar o mesmo em `app/components/perfis/gerarPdfPerfis.ts`. Verificação: build OK; no bundle de produção, o chunk `jspdf` não é puxado pelos `Cabecalho.vue` das 3 telas.

## 4. Escritas menores

- [x] 4.1 Em `server/utils/perfis.ts`, substituir o loop de `INSERT` por um único INSERT multi-row em `salvarMatriz` e `copiarMatriz`. Verificação: `npm run build` OK; E2E: salvar a matriz de um perfil responde `200` e persiste.
- [x] 4.2 Em `server/utils/perfis.ts`, fazer `carregarVinculos` rodar apenas quando necessário (ex.: listagem), não a cada `buscarPerfil`. Verificação: `npm run build` OK; listagem de perfis continua exibindo as contagens de vínculos.
- [x] 4.3 Em `server/utils/usuarios.ts`, converter `migrarSenhasSmtp` para um único `UPDATE` em lote (sem N+1). Verificação: `npm run build` OK.

## 5. Verificação integrada e documentação

- [x] 5.1 Rodar o build de produção. Verificação: `npm run build` conclui sem erro.
- [x] 5.2 Executar o roteiro E2E/medições consolidado. Verificação: (a) `EXPLAIN` de auditoria/segurança/usuários sem `filesort` (índices usados); (b) os 3 eventos de expurgo `ENABLED`; (c) salvar/copiar matriz de perfil `200`; (d) o bundle das 3 telas não importa o `jspdf` estaticamente.
- [x] 5.3 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, marcando `RL03-M-07` a `RL03-M-13` e `RL03-B-12/14/16` como corrigidos (com a data e a change) na Etapa 4. Verificação: as linhas da Etapa 4 constam como corrigidas.
