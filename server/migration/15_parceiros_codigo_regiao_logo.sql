-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 15_parceiros_codigo_regiao_logo.sql
-- (change construir-parceiros) Adiciona ao cadastro de parceiros o codigo
-- secundario (PAR-XXX, nao e chave primaria), a regiao (apos estado) e a logo.
-- A tabela esta vazia na criacao, sem risco para NOT NULL/UNIQUE.
-- Nao usa DROP TABLE/VIEW/DATABASE (migrations nao destrutivas).
-- SEM `USE`: o pool da aplicacao ja conecta no banco de DB_NAME.
-- =========================================================================
ALTER TABLE parceiros
    ADD COLUMN codigo VARCHAR(20) NOT NULL COMMENT 'Codigo unico do parceiro (PAR-XXX), identificador secundario' AFTER id,
    ADD COLUMN regiao VARCHAR(20) NOT NULL DEFAULT '' COMMENT 'Regiao do Brasil (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)' AFTER estado,
    ADD COLUMN logo_url VARCHAR(500) NULL COMMENT 'Caminho/URL da logo do parceiro (/uploads/logos/...)',
    ADD UNIQUE KEY uq_parceiros_codigo (codigo);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '15_parceiros_codigo_regiao_logo.sql';
-- =========================================================================
-- ALTER TABLE parceiros DROP INDEX uq_parceiros_codigo;
-- ALTER TABLE parceiros DROP COLUMN logo_url;
-- ALTER TABLE parceiros DROP COLUMN regiao;
-- ALTER TABLE parceiros DROP COLUMN codigo;
