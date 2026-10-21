-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 24_lancar-chamadas_backend.sql
-- (change lancar-chamadas-backend-e-importacao) Persistencia do modulo
-- Lancar as Chamadas:
--   - status `Recusado` no fluxo editorial;
--   - coluna `manual_titulo` usada pelo formulario/detalhes;
--   - unicidade de `chamada` (o indice simples vira UNIQUE);
--   - funcionalidade `importar` no Administrador e no Editor.
-- Aditiva e idempotente: o runner tolera coluna/indice ja' existentes
-- (1060/1061) e a checagem de boot valida o UNIQUE depois (1062 nao pode
-- ser tolerado sem verificacao).
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool conecta em DB_NAME).
-- =========================================================================
ALTER TABLE entregas_itens
    MODIFY COLUMN status ENUM('Revisar', 'Aprovado', 'Recusado', 'Publicar')
    NOT NULL DEFAULT 'Revisar'
    COMMENT 'Status de workflow na esteira: Revisar, Aprovado, Recusado ou Publicar';

ALTER TABLE entregas_itens
    ADD COLUMN IF NOT EXISTS manual_titulo VARCHAR(255) NULL
    COMMENT 'Titulo do manual vinculado a chamada (campo textual do formulario)'
    AFTER descricao_completa;

ALTER TABLE entregas_itens
    DROP INDEX IF EXISTS idx_entregas_chamada;

ALTER TABLE entregas_itens
    ADD UNIQUE KEY uk_entregas_chamada (chamada);

UPDATE permissoes_perfil
   SET extras = JSON_ARRAY_APPEND(COALESCE(extras, JSON_ARRAY()), '$', 'importar')
 WHERE modulo = 'lancar-chamadas'
   AND perfil_id IN (
       '10000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000002'
   )
   AND (extras IS NULL OR JSON_CONTAINS(extras, '"importar"', '$') = 0);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '24_lancar-chamadas_backend.sql';
-- =========================================================================
-- UPDATE permissoes_perfil
--    SET extras = JSON_REMOVE(extras, JSON_UNQUOTE(JSON_SEARCH(extras, 'one', 'importar')))
--  WHERE modulo = 'lancar-chamadas'
--    AND perfil_id IN (
--        '10000000-0000-4000-8000-000000000001',
--        '10000000-0000-4000-8000-000000000002'
--    )
--    AND JSON_SEARCH(extras, 'one', 'importar') IS NOT NULL;
-- ALTER TABLE entregas_itens DROP INDEX uk_entregas_chamada;
-- ALTER TABLE entregas_itens ADD INDEX idx_entregas_chamada (chamada);
-- ALTER TABLE entregas_itens DROP COLUMN manual_titulo;
-- -- NAO encolher o ENUM se existirem linhas com 'Recusado':
-- ALTER TABLE entregas_itens
--     MODIFY COLUMN status ENUM('Revisar', 'Aprovado', 'Publicar')
--     NOT NULL DEFAULT 'Revisar';
-- =========================================================================
