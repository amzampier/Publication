-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 32_rl06_3_imutabilidade.sql
-- (change corrigir-pendencias-rl06-3 - RL06 I-01)
--
-- Torna a trilha de auditoria e o histórico da esteira append-only no banco:
-- - UPDATE é sempre rejeitado;
-- - DELETE é rejeitado, exceto para o expurgo controlado da auditoria,
--   executado pelo EVENT abaixo com a variável de sessão explícita.
-- O expurgo mantém a janela de `configuracoes_globais.dias_retencao_auditoria`.
-- =========================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_auditoria_sem_update$$
CREATE TRIGGER trg_auditoria_sem_update
BEFORE UPDATE ON auditoria
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Auditoria e imutavel: UPDATE bloqueado.';
END$$

DROP TRIGGER IF EXISTS trg_auditoria_sem_delete$$
CREATE TRIGGER trg_auditoria_sem_delete
BEFORE DELETE ON auditoria
FOR EACH ROW
BEGIN
  IF COALESCE(@rl06_permitir_auditoria, 0) <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Auditoria e imutavel: DELETE bloqueado (use o expurgo controlado).';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_historico_sem_update$$
CREATE TRIGGER trg_historico_sem_update
BEFORE UPDATE ON historico_esteira_revisao
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Historico da esteira e imutavel: UPDATE bloqueado.';
END$$

DROP TRIGGER IF EXISTS trg_historico_sem_delete$$
CREATE TRIGGER trg_historico_sem_delete
BEFORE DELETE ON historico_esteira_revisao
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Historico da esteira e imutavel: DELETE bloqueado.';
END$$

DROP EVENT IF EXISTS ev_expurgo_auditoria$$
CREATE EVENT ev_expurgo_auditoria
    ON SCHEDULE EVERY 1 DAY
    STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR)
    ON COMPLETION PRESERVE
    ENABLE
    COMMENT 'Expurgo diario controlado da auditoria conforme dias_retencao_auditoria'
    DO
        BEGIN
            SET @rl06_permitir_auditoria = 1;
            DELETE a FROM auditoria a
            JOIN configuracoes_globais c ON c.id = 'config_default'
            WHERE a.data_hora < DATE_SUB(NOW(6), INTERVAL c.dias_retencao_auditoria DAY);
            SET @rl06_permitir_auditoria = NULL;
        END$$

DELIMITER ;

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE como administrador; remova os "-- ".
-- DROP TRIGGER IF EXISTS trg_auditoria_sem_update;
-- DROP TRIGGER IF EXISTS trg_auditoria_sem_delete;
-- DROP TRIGGER IF EXISTS trg_historico_sem_update;
-- DROP TRIGGER IF EXISTS trg_historico_sem_delete;
-- DROP EVENT IF EXISTS ev_expurgo_auditoria;
-- CREATE EVENT ev_expurgo_auditoria ... (recriar a versão da migration 10, se necessário)
-- DELETE FROM _migrations WHERE nome = '32_rl06_3_imutabilidade.sql';
-- =========================================================================
