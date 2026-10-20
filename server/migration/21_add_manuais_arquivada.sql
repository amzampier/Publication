-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 21_add_manuais_arquivada.sql
-- (change construir-manuais-mensais) Arquivamento soft do catálogo mensal de
-- manuais: o catálogo arquivado deixa a listagem/KPIs sem ser apagado (os
-- itens de entregas_itens e os anexos_midias permanecem). `status` continua
-- sendo o fluxo editorial de 5 valores; `arquivada` e' um booleano independente.
-- Aditiva e idempotente: o runner tolera coluna/indice ja' existentes (1060/1061).
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool ja' conecta em DB_NAME).
-- =========================================================================
ALTER TABLE manuais_mensal
    ADD COLUMN arquivada TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Catalogo arquivado (soft): some da listagem sem apagar dados/itens'
    AFTER destaque_semana;

CREATE INDEX idx_manuais_arquivada ON manuais_mensal (arquivada);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '21_add_manuais_arquivada.sql';
-- =========================================================================
-- ALTER TABLE manuais_mensal DROP COLUMN arquivada;
-- DROP INDEX idx_manuais_arquivada ON manuais_mensal;
