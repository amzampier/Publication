-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 22_reconciliar_rbac_manuais.sql
-- (change construir-manuais-mensais) Acrescenta ao modulo `manuais` as
-- funcionalidades novas da matriz:
--   - `clonar` no Administrador e no Editor (a clonagem grava via `criar`);
--   - `visualizar_itens` em todos os perfis que enxergam Manuais.
-- Idempotente: so' acrescenta quando a funcionalidade ainda nao esta no `extras`.
-- Preserva as demais funcionalidades do array JSON.
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool ja' conecta em DB_NAME).
-- =========================================================================
UPDATE permissoes_perfil
   SET extras = JSON_ARRAY_APPEND(COALESCE(extras, JSON_ARRAY()), '$', 'clonar')
 WHERE modulo = 'manuais'
   AND perfil_id IN (
       '10000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000002'
   )
   AND (extras IS NULL OR JSON_CONTAINS(extras, '"clonar"', '$') = 0);

UPDATE permissoes_perfil
   SET extras = JSON_ARRAY_APPEND(COALESCE(extras, JSON_ARRAY()), '$', 'visualizar_itens')
 WHERE modulo = 'manuais'
   AND perfil_id IN (
       '10000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000002',
       '10000000-0000-4000-8000-000000000003',
       '10000000-0000-4000-8000-000000000004'
   )
   AND (extras IS NULL OR JSON_CONTAINS(extras, '"visualizar_itens"', '$') = 0);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Remove as duas funcionalidades dos arrays e apaga o registro:
-- DELETE FROM _migrations WHERE nome = '22_reconciliar_rbac_manuais.sql';
-- UPDATE permissoes_perfil
--    SET extras = JSON_REMOVE(extras, JSON_UNQUOTE(JSON_SEARCH(extras, 'one', 'clonar')))
--  WHERE modulo = 'manuais' AND JSON_SEARCH(extras, 'one', 'clonar') IS NOT NULL;
-- UPDATE permissoes_perfil
--    SET extras = JSON_REMOVE(extras, JSON_UNQUOTE(JSON_SEARCH(extras, 'one', 'visualizar_itens')))
--  WHERE modulo = 'manuais' AND JSON_SEARCH(extras, 'one', 'visualizar_itens') IS NOT NULL;
-- =========================================================================
