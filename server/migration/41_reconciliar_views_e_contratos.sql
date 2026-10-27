-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 41
-- (change reconciliar-views-e-contratos-rl06)
--
-- Reconciliacao das views de itens com o schema atual e ajuste dos comentarios
-- das datas de chamada. Nao altera dados de negocio, tabelas base, colunas
-- existentes ou migrations anteriores.
-- Aditiva e idempotente; sem `USE`; sem DROP TABLE/VIEW/DATABASE.
-- =========================================================================

-- 1) Views com projecao explicita (evita congelar a lista em SELECT *).
CREATE OR REPLACE VIEW v_release_itens AS
  SELECT
    e.id,
    e.origem,
    e.release_id,
    e.projeto_id,
    e.manual_id,
    e.software_id,
    e.parceiro_id,
    e.autor_id,
    e.autor_nome,
    e.chamada,
    e.data_lancamento,
    e.data_liberacao,
    e.`release`,
    e.titulo,
    e.parceiro,
    e.software,
    e.modulo,
    e.menu_funcionalidade,
    e.tipo,
    e.impacto,
    e.descricao_completa,
    e.descricao_html,
    e.solucao,
    e.solucao_html,
    e.manual_titulo,
    e.link_manual,
    e.link_video,
    e.imagens,
    e.status,
    e.tags,
    e.ordem_apresentacao,
    e.criado_em,
    e.atualizado_em,
    e.publicado_em,
    e.tags_texto
  FROM entregas_itens e
  WHERE e.release_id IS NOT NULL;

CREATE OR REPLACE VIEW v_projeto_itens AS
  SELECT
    e.id,
    e.origem,
    e.release_id,
    e.projeto_id,
    e.manual_id,
    e.software_id,
    e.parceiro_id,
    e.autor_id,
    e.autor_nome,
    e.chamada,
    e.data_lancamento,
    e.data_liberacao,
    e.`release`,
    e.titulo,
    e.parceiro,
    e.software,
    e.modulo,
    e.menu_funcionalidade,
    e.tipo,
    e.impacto,
    e.descricao_completa,
    e.descricao_html,
    e.solucao,
    e.solucao_html,
    e.manual_titulo,
    e.link_manual,
    e.link_video,
    e.imagens,
    e.status,
    e.tags,
    e.ordem_apresentacao,
    e.criado_em,
    e.atualizado_em,
    e.publicado_em,
    e.tags_texto
  FROM entregas_itens e
  WHERE e.projeto_id IS NOT NULL;

CREATE OR REPLACE VIEW v_manual_itens AS
  SELECT
    e.id,
    e.origem,
    e.release_id,
    e.projeto_id,
    e.manual_id,
    e.software_id,
    e.parceiro_id,
    e.autor_id,
    e.autor_nome,
    e.chamada,
    e.data_lancamento,
    e.data_liberacao,
    e.`release`,
    e.titulo,
    e.parceiro,
    e.software,
    e.modulo,
    e.menu_funcionalidade,
    e.tipo,
    e.impacto,
    e.descricao_completa,
    e.descricao_html,
    e.solucao,
    e.solucao_html,
    e.manual_titulo,
    e.link_manual,
    e.link_video,
    e.imagens,
    e.status,
    e.tags,
    e.ordem_apresentacao,
    e.criado_em,
    e.atualizado_em,
    e.publicado_em,
    e.tags_texto
  FROM entregas_itens e
  WHERE e.manual_id IS NOT NULL OR e.link_manual IS NOT NULL;

CREATE OR REPLACE VIEW manuais AS
  SELECT
    m.id,
    m.codigo,
    m.ano,
    m.mes,
    m.mes_numero,
    m.titulo,
    m.descricao,
    m.status,
    m.destaque_mes,
    m.destaque_semana,
    m.arquivada,
    m.total_visualizacoes,
    m.autor_id,
    m.revisor_id,
    m.revisor_feedback,
    m.data_criacao,
    m.data_publicacao,
    m.criado_em,
    m.atualizado_em,
    m.chave_ativa,
    m.publicado_em
  FROM manuais_mensal m;

-- 2) Comentarios de schema coerentes com o contrato atual das Chamadas.
ALTER TABLE entregas_itens
  MODIFY COLUMN data_lancamento DATE NULL
    COMMENT 'Data de lançamento (qualquer data civil válida)',
  MODIFY COLUMN data_liberacao DATE NULL
    COMMENT 'Data de liberação (segunda-feira ou próximo dia útil)';

-- Conferencia sugerida:
-- SELECT 1 FROM v_release_itens LIMIT 1;
-- SELECT 1 FROM v_projeto_itens LIMIT 1;
-- SELECT 1 FROM v_manual_itens LIMIT 1;
-- SELECT 1 FROM manuais LIMIT 1;
-- SELECT COLUMN_NAME, COLUMN_COMMENT FROM information_schema.COLUMNS
--  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'entregas_itens'
--    AND COLUMN_NAME IN ('data_lancamento', 'data_liberacao');

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- 1) Restaurar as views anteriores (projecao congelada da migration 31):
-- CREATE OR REPLACE VIEW v_release_itens AS
--   SELECT * FROM entregas_itens WHERE release_id IS NOT NULL;
-- CREATE OR REPLACE VIEW v_projeto_itens AS
--   SELECT * FROM entregas_itens WHERE projeto_id IS NOT NULL;
-- CREATE OR REPLACE VIEW v_manual_itens AS
--   SELECT * FROM entregas_itens WHERE manual_id IS NOT NULL OR link_manual IS NOT NULL;
-- CREATE OR REPLACE VIEW manuais AS SELECT * FROM manuais_mensal;
-- 2) Restaurar os comentarios anteriores:
-- ALTER TABLE entregas_itens
--   MODIFY COLUMN data_lancamento DATE NULL COMMENT 'Data de lançamento (sempre 2ª feira)',
--   MODIFY COLUMN data_liberacao DATE NULL COMMENT 'Data de liberação técnica (sempre 2ª feira)';
-- 3) Remover o registro da migration:
-- DELETE FROM _migrations WHERE nome = '41_reconciliar_views_e_contratos.sql';
-- =========================================================================
