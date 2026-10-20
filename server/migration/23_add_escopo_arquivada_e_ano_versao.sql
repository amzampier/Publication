-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 23_add_escopo_arquivada_e_ano_versao.sql
-- (change escopo-projetos-backend-e-importacao) Persistencia do modulo Escopo
-- de Projetos: arquivamento soft da coluna `arquivada`, indice de listagem e
-- identidade de importacao por (ano, versao). SEM SEED: o modulo nasce vazio.
-- Aditiva e idempotente: o runner tolera coluna/indice ja' existentes (1060/1061).
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool ja' conecta em DB_NAME).
-- =========================================================================
ALTER TABLE projetos_escopo
    ADD COLUMN arquivada TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Escopo arquivado (soft): some da listagem sem apagar dados/itens'
    AFTER total_visualizacoes;

CREATE INDEX idx_projetos_arquivada ON projetos_escopo (arquivada);

ALTER TABLE projetos_escopo
    ADD UNIQUE KEY uk_projetos_ano_versao (ano, versao);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '23_add_escopo_arquivada_e_ano_versao.sql';
-- =========================================================================
-- ALTER TABLE projetos_escopo DROP INDEX uk_projetos_ano_versao;
-- DROP INDEX idx_projetos_arquivada ON projetos_escopo;
-- ALTER TABLE projetos_escopo DROP COLUMN arquivada;
-- =========================================================================
