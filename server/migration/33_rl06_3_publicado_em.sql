-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 33_rl06_3_publicado_em.sql
-- (change corrigir-publicado-em - RL06 B-05)
--
-- Adiciona o carimbo de publicação efetiva. `publicado_em` é a data em que o
-- conteúdo se torna público: a data agendada quando futura, ou o instante da
-- transição quando a data é passada/ausente. O backfill usa a data agendada
-- (ou a data de criação) para preservar o histórico.
-- =========================================================================

ALTER TABLE release_week ADD COLUMN IF NOT EXISTS publicado_em DATETIME(6) NULL;
ALTER TABLE manuais_mensal ADD COLUMN IF NOT EXISTS publicado_em DATETIME(6) NULL;
ALTER TABLE projetos_escopo ADD COLUMN IF NOT EXISTS publicado_em DATETIME(6) NULL;
ALTER TABLE entregas_itens ADD COLUMN IF NOT EXISTS publicado_em DATETIME(6) NULL;

CREATE INDEX IF NOT EXISTS idx_release_publicado_em
  ON release_week (status, arquivada, publicado_em);
CREATE INDEX IF NOT EXISTS idx_manuais_publicado_em
  ON manuais_mensal (status, arquivada, publicado_em);
CREATE INDEX IF NOT EXISTS idx_projetos_publicado_em
  ON projetos_escopo (status, arquivada, publicado_em);
CREATE INDEX IF NOT EXISTS idx_entregas_publicado_em
  ON entregas_itens (status, publicado_em);

UPDATE release_week
   SET publicado_em = TIMESTAMP(COALESCE(data_publicacao, DATE(criado_em)))
 WHERE status = 'Publicado' AND publicado_em IS NULL;

UPDATE manuais_mensal
   SET publicado_em = TIMESTAMP(COALESCE(data_publicacao, DATE(criado_em)))
 WHERE status = 'Publicado' AND publicado_em IS NULL;

UPDATE projetos_escopo
   SET publicado_em = TIMESTAMP(COALESCE(data_publicacao, DATE(criado_em)))
 WHERE status = 'Publicado' AND publicado_em IS NULL;

UPDATE entregas_itens
   SET publicado_em = TIMESTAMP(COALESCE(data_liberacao, DATE(criado_em)))
 WHERE status = 'Publicado' AND publicado_em IS NULL;

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- DROP INDEX idx_entregas_publicado_em ON entregas_itens;
-- DROP INDEX idx_projetos_publicado_em ON projetos_escopo;
-- DROP INDEX idx_manuais_publicado_em ON manuais_mensal;
-- DROP INDEX idx_release_publicado_em ON release_week;
-- ALTER TABLE entregas_itens DROP COLUMN publicado_em;
-- ALTER TABLE projetos_escopo DROP COLUMN publicado_em;
-- ALTER TABLE manuais_mensal DROP COLUMN publicado_em;
-- ALTER TABLE release_week DROP COLUMN publicado_em;
-- DELETE FROM _migrations WHERE nome = '33_rl06_3_publicado_em.sql';
-- =========================================================================
