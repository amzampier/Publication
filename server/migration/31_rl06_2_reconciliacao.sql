-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 31_rl06_2_reconciliacao.sql
-- (change corrigir-pendencias-rl06-2) Reconcilia as views de itens com o
-- schema apos a remocao de `situacao`, limpa `data_aprovacao` residual,
-- cria indices de data para o Painel e substitui a unicidade de
-- Release/Manual/Escopo por uma chave que admite um ativo + varios arquivados.
-- Aditiva e idempotente; sem `USE`; sem DROP TABLE/VIEW/DATABASE.
-- =========================================================================

-- 1) Views de itens: recriadas contra as colunas atuais (sem `situacao`).
CREATE OR REPLACE VIEW v_release_itens AS
  SELECT * FROM entregas_itens WHERE release_id IS NOT NULL;

CREATE OR REPLACE VIEW v_projeto_itens AS
  SELECT * FROM entregas_itens WHERE projeto_id IS NOT NULL;

CREATE OR REPLACE VIEW v_manual_itens AS
  SELECT * FROM entregas_itens WHERE manual_id IS NOT NULL OR link_manual IS NOT NULL;

CREATE OR REPLACE VIEW manuais AS
  SELECT * FROM manuais_mensal;

-- 2) Carimbo de aprovacao coerente com o status.
UPDATE release_week SET data_aprovacao = NULL WHERE status <> 'Publicado';

-- 3) Indices de data usados pelo Painel (runner tolera 1061 se ja existirem).
ALTER TABLE entregas_itens ADD INDEX idx_entregas_data_lancamento (data_lancamento);
ALTER TABLE entregas_itens ADD INDEX idx_entregas_data_liberacao (data_liberacao);

-- 4) Unicidade com arquivadas: um ativo (chave_ativa = 'ativo') e varios
--    arquivados (chave_ativa = id). Remove tambem a unicidade de `codigo`,
--    que impediria recriar o mesmo codigo derivado da chave.
ALTER TABLE release_week
  ADD COLUMN chave_ativa VARCHAR(64) AS (IF(arquivada = 0, 'ativo', id)) STORED;
ALTER TABLE release_week DROP INDEX IF EXISTS uk_release_ano_semana;
ALTER TABLE release_week DROP INDEX IF EXISTS uk_release_codigo;
ALTER TABLE release_week
  ADD UNIQUE KEY uk_release_ano_semana_ativa (ano, semana, chave_ativa);

ALTER TABLE manuais_mensal
  ADD COLUMN chave_ativa VARCHAR(64) AS (IF(arquivada = 0, 'ativo', id)) STORED;
ALTER TABLE manuais_mensal DROP INDEX IF EXISTS uk_manual_ano_mes;
ALTER TABLE manuais_mensal DROP INDEX IF EXISTS uk_manual_codigo;
ALTER TABLE manuais_mensal
  ADD UNIQUE KEY uk_manual_ano_mes_ativa (ano, mes_numero, chave_ativa);

ALTER TABLE projetos_escopo
  ADD COLUMN chave_ativa VARCHAR(64) AS (IF(arquivada = 0, 'ativo', id)) STORED;
ALTER TABLE projetos_escopo DROP INDEX IF EXISTS uk_projetos_ano_versao;
ALTER TABLE projetos_escopo DROP INDEX IF EXISTS uk_projeto_codigo;
ALTER TABLE projetos_escopo
  ADD UNIQUE KEY uk_projetos_ano_versao_ativa (ano, versao, chave_ativa);

-- Conferencia sugerida:
-- SELECT 1 FROM v_release_itens LIMIT 1;
-- SELECT 1 FROM v_projeto_itens LIMIT 1;
-- SELECT 1 FROM v_manual_itens LIMIT 1;
-- SELECT arquivada FROM manuais LIMIT 1;
-- SHOW INDEX FROM entregas_itens WHERE Key_name LIKE 'idx_entregas_data_%';
-- SHOW INDEX FROM release_week WHERE Key_name = 'uk_release_ano_semana_ativa';

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Se houver mais de um arquivado com a mesma chave, consolide/remova as
-- duplicatas antes de recriar os indices antigos.
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '31_rl06_2_reconciliacao.sql';
-- 1) remover os indices/colunas novas:
-- ALTER TABLE release_week DROP INDEX uk_release_ano_semana_ativa;
-- ALTER TABLE manuais_mensal DROP INDEX uk_manual_ano_mes_ativa;
-- ALTER TABLE projetos_escopo DROP INDEX uk_projetos_ano_versao_ativa;
-- ALTER TABLE release_week DROP COLUMN chave_ativa;
-- ALTER TABLE manuais_mensal DROP COLUMN chave_ativa;
-- ALTER TABLE projetos_escopo DROP COLUMN chave_ativa;
-- 2) recriar os indices antigos:
-- ALTER TABLE release_week ADD UNIQUE KEY uk_release_codigo (codigo);
-- ALTER TABLE release_week ADD UNIQUE KEY uk_release_ano_semana (ano, semana);
-- ALTER TABLE manuais_mensal ADD UNIQUE KEY uk_manual_codigo (codigo);
-- ALTER TABLE manuais_mensal ADD UNIQUE KEY uk_manual_ano_mes (ano, mes_numero);
-- ALTER TABLE projetos_escopo ADD UNIQUE KEY uk_projeto_codigo (codigo);
-- ALTER TABLE projetos_escopo ADD UNIQUE KEY uk_projetos_ano_versao (ano, versao);
-- 3) remover os indices de data:
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_data_lancamento;
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_data_liberacao;
-- 4) as views antigas permanecem invalidas no rollback; restaure a definicao
--    anterior a partir do backup se necessario.
-- =========================================================================