-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 17_reconciliar_convite.sql
-- (change de finalizacao do RBAC) Acrescenta a funcionalidade `convite`
-- ("Enviar o Convite") ao modulo `gestao-usuarios` do perfil Administrador —
-- o catalogo passou a expor `convite` separado de `criar`. Idempotente.
-- Totais (catalogo = 86): Administrador 86, Editor 61, Revisor 37, Leitor 12.
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool ja' conecta em DB_NAME).
-- =========================================================================
UPDATE permissoes_perfil
   SET extras = '["importar","exportar","filtrar","buscar","convite"]'
 WHERE perfil_id = '10000000-0000-4000-8000-000000000001'
   AND modulo = 'gestao-usuarios';
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '17_reconciliar_convite.sql';
-- =========================================================================
-- UPDATE permissoes_perfil
--    SET extras = '["importar","exportar","filtrar","buscar"]'
--  WHERE perfil_id = '10000000-0000-4000-8000-000000000001'
--    AND modulo = 'gestao-usuarios';
