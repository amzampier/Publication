-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 40
-- Expurgo diário dos contadores de rate limit.
-- =========================================================================

CREATE EVENT IF NOT EXISTS ev_expurgo_rate_limit
  ON SCHEDULE EVERY 1 DAY
  STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
  DO
    DELETE FROM rate_limit_contadores
     WHERE atualizado_em < NOW(6) - INTERVAL 1 DAY;

-- REVERTER:
-- DROP EVENT IF EXISTS ev_expurgo_rate_limit;