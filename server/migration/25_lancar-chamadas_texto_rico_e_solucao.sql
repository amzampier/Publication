-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 25_lancar-chamadas_texto_rico_e_solucao.sql
-- (change lancar-chamadas-texto-rico-e-solucao) Texto rico na Descricao e
-- novo campo Solucao:
--   - descricao_html: representacao HTML sanitizada da Descricao completa;
--   - solucao: texto puro da Solucao (novo campo, opcional);
--   - solucao_html: representacao HTML sanitizada da Solucao.
-- O texto puro (descricao_completa/solucao) continua canonico para busca,
-- importacao e fallback; as colunas *_html sao apresentacao sanitizada e ficam
-- NULL em registros antigos e importados.
-- Aditiva e idempotente: o runner tolera coluna ja' existente (1060).
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool conecta em DB_NAME).
-- =========================================================================
ALTER TABLE entregas_itens
    ADD COLUMN IF NOT EXISTS descricao_html MEDIUMTEXT NULL
    COMMENT 'HTML sanitizado da Descricao completa (allowlist do design system)'
    AFTER descricao_completa;

ALTER TABLE entregas_itens
    ADD COLUMN IF NOT EXISTS solucao MEDIUMTEXT NULL
    COMMENT 'Texto puro da Solucao da chamada (campo novo, exibido na Area Publica)'
    AFTER descricao_html;

ALTER TABLE entregas_itens
    ADD COLUMN IF NOT EXISTS solucao_html MEDIUMTEXT NULL
    COMMENT 'HTML sanitizado da Solucao (allowlist do design system)'
    AFTER solucao;
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '25_lancar-chamadas_texto_rico_e_solucao.sql';
-- =========================================================================
-- ALTER TABLE entregas_itens DROP COLUMN solucao_html;
-- ALTER TABLE entregas_itens DROP COLUMN solucao;
-- ALTER TABLE entregas_itens DROP COLUMN descricao_html;
-- =========================================================================
