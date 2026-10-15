-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 06_seguranca_eventos_bloqueio_liberado.sql
-- Acrescenta 'bloqueio-liberado' ao ENUM de tipos do log de tentativas de login
-- (change seguranca-rate-limits-reais, ajuste pos-QA): liberar um bloqueio de
-- e-mail inexistente vira um evento NOVO em vez de alterar os existentes -
-- o log permanece 100% append-only. NUNCA edite este arquivo depois de
-- aplicado (docs/qa/03): correcoes entram como 07_*.sql nova.
-- =========================================================================

ALTER TABLE seguranca_eventos_login
    MODIFY COLUMN tipo ENUM(
        'senha-invalida',
        'email-inexistente',
        'bloqueio-aplicado',
        'tentativa-bloqueado',
        'bloqueio-liberado'
    ) NOT NULL COMMENT 'Natureza da tentativa registrada';

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE se necessario; remova os "-- ".
-- Apos reverter, apague o registro: DELETE FROM _migrations WHERE nome = '06_seguranca_eventos_bloqueio_liberado.sql';
-- ATENCAO: reverter recusa linhas com 'bloqueio-liberado' ja gravadas - apague-as antes.
-- =========================================================================
-- ALTER TABLE seguranca_eventos_login
--     MODIFY COLUMN tipo ENUM(
--         'senha-invalida',
--         'email-inexistente',
--         'bloqueio-aplicado',
--         'tentativa-bloqueado'
--     ) NOT NULL COMMENT 'Natureza da tentativa registrada';
