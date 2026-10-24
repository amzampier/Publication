-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 34_rate_limit_persistente.sql
-- (change reforcar-seguranca-e-infra)
--
-- Contadores de rate limit compartilhados entre processos/instâncias.
-- A chave combina IP + rota; a janela é fixa de 1 minuto e a limpeza é
-- oportunista (linhas com mais de 1 dia).
-- =========================================================================

CREATE TABLE IF NOT EXISTS rate_limit_contadores (
  chave VARCHAR(255) NOT NULL PRIMARY KEY,
  janela_inicio DATETIME(6) NOT NULL,
  contagem INT UNSIGNED NOT NULL DEFAULT 0,
  atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_rate_limit_atualizado (atualizado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- DROP TABLE IF EXISTS rate_limit_contadores;
-- DELETE FROM _migrations WHERE nome = '34_rate_limit_persistente.sql';
-- =========================================================================
