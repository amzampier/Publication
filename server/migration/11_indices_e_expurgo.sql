-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 11_indices_e_expurgo.sql
-- (change desempenho-indices-expurgo-bundle — RL03 Etapa 4)
-- Aditiva e idempotente: índices compostos para eliminar o filesort das
-- listagens (auditoria, segurança, usuários) e eventos diários de expurgo de
-- sessões/tokens/log de segurança. Não há DROP — o runner tolera os errno de
-- "já existe" (1060/1061/1062) e os eventos usam CREATE EVENT IF NOT EXISTS.
-- =========================================================================

-- Índices de ordenação (casam com os ORDER BY ... DESC, id DESC existentes)
CREATE INDEX idx_audit_data_hora_id ON auditoria (data_hora DESC, id DESC);
CREATE INDEX idx_seguranca_ocorrido_id ON seguranca_eventos_login (ocorrido_em DESC, id DESC);
CREATE INDEX idx_usuarios_nome ON usuarios (nome_completo);

-- Expurgo diário de sessões: expiradas (sem revogação) ou revogadas há +1 dia
CREATE EVENT IF NOT EXISTS ev_expurgo_sessoes
    ON SCHEDULE EVERY 1 DAY
    STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR + INTERVAL 10 MINUTE)
    ON COMPLETION PRESERVE
    ENABLE
    COMMENT 'Expurgo diário de sessões expiradas/revogadas'
    DO
        DELETE FROM sessoes
         WHERE (revogado_em IS NULL AND expira_em < NOW(6))
            OR (revogado_em IS NOT NULL AND revogado_em < DATE_SUB(NOW(6), INTERVAL 1 DAY));

CREATE EVENT IF NOT EXISTS ev_expurgo_token_blacklist
    ON SCHEDULE EVERY 1 DAY
    STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR + INTERVAL 20 MINUTE)
    ON COMPLETION PRESERVE
    ENABLE
    COMMENT 'Expurgo diário de tokens revogados vencidos'
    DO
        DELETE FROM token_blacklist WHERE expira_em < NOW(6);

CREATE EVENT IF NOT EXISTS ev_expurgo_seguranca_login
    ON SCHEDULE EVERY 1 DAY
    STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR + INTERVAL 30 MINUTE)
    ON COMPLETION PRESERVE
    ENABLE
    COMMENT 'Expurgo diário do log de segurança (janela fixa de 90 dias)'
    DO
        DELETE FROM seguranca_eventos_login WHERE ocorrido_em < DATE_SUB(NOW(6), INTERVAL 90 DAY);

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '11_indices_e_expurgo.sql';
-- =========================================================================
-- DROP EVENT IF EXISTS ev_expurgo_seguranca_login;
-- DROP EVENT IF EXISTS ev_expurgo_token_blacklist;
-- DROP EVENT IF EXISTS ev_expurgo_sessoes;
-- DROP INDEX idx_usuarios_nome ON usuarios;
-- DROP INDEX idx_seguranca_ocorrido_id ON seguranca_eventos_login;
-- DROP INDEX idx_audit_data_hora_id ON auditoria;
