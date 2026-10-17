-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 14_softwares_codigo_pk.sql
-- (change softwares-backend-e-importacao) Promove o codigo sequencial
-- (SFT-XXX) a chave primaria de softwares e reaponta o FK de entregas_itens
-- para ele. As tabelas estavam vazias na criacao da migration (sem perda de
-- dados). Nao usa DROP TABLE/VIEW/DATABASE (migrations nao destrutivas).
-- SEM `USE`: o pool da aplicacao ja conecta no banco de DB_NAME.
-- =========================================================================
ALTER TABLE entregas_itens DROP FOREIGN KEY fk_entregas_soft_id;
ALTER TABLE entregas_itens MODIFY software_id VARCHAR(20) NULL COMMENT 'Chave estrangeira apontando para softwares.codigo';
ALTER TABLE softwares DROP PRIMARY KEY, CHANGE id codigo VARCHAR(20) NOT NULL COMMENT 'Codigo unico do software (SFT-XXX)', ADD PRIMARY KEY (codigo);
ALTER TABLE entregas_itens ADD CONSTRAINT fk_entregas_soft_id FOREIGN KEY (software_id) REFERENCES softwares(codigo) ON DELETE RESTRICT ON UPDATE CASCADE;
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '14_softwares_codigo_pk.sql';
-- =========================================================================
-- ALTER TABLE entregas_itens DROP FOREIGN KEY fk_entregas_soft_id;
-- ALTER TABLE softwares DROP PRIMARY KEY, CHANGE codigo id VARCHAR(64) NOT NULL COMMENT 'Identificador unico do software', ADD PRIMARY KEY (id);
-- ALTER TABLE entregas_itens MODIFY software_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para softwares.id';
-- ALTER TABLE entregas_itens ADD CONSTRAINT fk_entregas_soft_id FOREIGN KEY (software_id) REFERENCES softwares(id) ON DELETE RESTRICT ON UPDATE CASCADE;
