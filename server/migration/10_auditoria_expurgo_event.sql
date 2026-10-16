-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 10_auditoria_expurgo_event.sql
-- (change correcoes-funcionais-e-ux — RL02 M-03)
-- Aplica a política de retenção de auditoria automaticamente: um EVENTO do
-- MariaDB (Event Scheduler) roda 1x/dia às 03:00 e apaga os registros mais
-- antigos que `configuracoes_globais.dias_retencao_auditoria`.
-- Requer o Event Scheduler habilitado (o boot tenta `SET GLOBAL
-- event_scheduler = ON` de forma best-effort) e o privilégio EVENT.
-- Aditiva e idempotente (CREATE EVENT IF NOT EXISTS).
-- =========================================================================

CREATE EVENT IF NOT EXISTS ev_expurgo_auditoria
    ON SCHEDULE EVERY 1 DAY
    STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR)
    ON COMPLETION PRESERVE
    ENABLE
    COMMENT 'Expurgo diário da trilha de auditoria conforme dias_retencao_auditoria'
    DO
        DELETE a FROM auditoria a
        JOIN configuracoes_globais c ON c.id = 'config_default'
        WHERE a.data_hora < DATE_SUB(NOW(6), INTERVAL c.dias_retencao_auditoria DAY);

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '10_auditoria_expurgo_event.sql';
-- =========================================================================
-- DROP EVENT IF EXISTS ev_expurgo_auditoria;
