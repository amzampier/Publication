-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 19_add_release_week_arquivada.sql
-- (change release-week-backend-e-importacao) Arquivamento soft da Release Week:
-- a release arquivada deixa a listagem/KPIs sem ser apagada (os itens de
-- entregas_itens permanecem). `status` continua sendo o fluxo editorial de 4
-- valores; `arquivada` e' um booleano independente.
-- Aditiva e idempotente: o runner tolera coluna/indice ja' existentes (1060/1061).
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool ja' conecta em DB_NAME).
-- =========================================================================
ALTER TABLE release_week
    ADD COLUMN arquivada TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Release arquivada (soft): some da listagem sem apagar dados/itens'
    AFTER destaque_semana;

CREATE INDEX idx_rel_arquivada ON release_week (arquivada);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '19_add_release_week_arquivada.sql';
-- =========================================================================
-- ALTER TABLE release_week DROP COLUMN arquivada;
-- DROP INDEX idx_rel_arquivada ON release_week;
