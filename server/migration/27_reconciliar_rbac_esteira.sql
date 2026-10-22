-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 27_reconciliar_rbac_esteira.sql
-- (change construir-esteira-revisao) Reconcilia o modulo `esteira-revisao`:
--   - acrescenta `buscar` a todos os perfis que ja' enxergam a esteira;
--   - acrescenta `publicar` ao perfil Revisor (homologacao da chamada), sem
--     conceder `publicar` nos modulos de conteudo nem em Lancar as Chamadas.
-- Idempotente: so' acrescenta quando a funcionalidade ainda nao esta no `extras`.
-- Preserva as demais funcionalidades do array JSON. Somente dados: sem DDL.
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool ja' conecta em DB_NAME).
-- =========================================================================
UPDATE permissoes_perfil
   SET extras = JSON_ARRAY_APPEND(COALESCE(extras, JSON_ARRAY()), '$', 'buscar')
 WHERE modulo = 'esteira-revisao'
   AND pode_visualizar = 1
   AND (extras IS NULL OR JSON_CONTAINS(extras, '"buscar"', '$') = 0);

UPDATE permissoes_perfil
   SET extras = JSON_ARRAY_APPEND(COALESCE(extras, JSON_ARRAY()), '$', 'publicar')
 WHERE modulo = 'esteira-revisao'
   AND perfil_id = '10000000-0000-4000-8000-000000000003'
   AND (extras IS NULL OR JSON_CONTAINS(extras, '"publicar"', '$') = 0);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Remove as funcionalidades dos arrays e apaga o registro:
-- DELETE FROM _migrations WHERE nome = '27_reconciliar_rbac_esteira.sql';
-- UPDATE permissoes_perfil
--    SET extras = JSON_REMOVE(extras, JSON_UNQUOTE(JSON_SEARCH(extras, 'one', 'buscar')))
--  WHERE modulo = 'esteira-revisao' AND JSON_SEARCH(extras, 'one', 'buscar') IS NOT NULL;
-- UPDATE permissoes_perfil
--    SET extras = JSON_REMOVE(extras, JSON_UNQUOTE(JSON_SEARCH(extras, 'one', 'publicar')))
--  WHERE modulo = 'esteira-revisao'
--    AND perfil_id = '10000000-0000-4000-8000-000000000003'
--    AND JSON_SEARCH(extras, 'one', 'publicar') IS NOT NULL;
-- =========================================================================
