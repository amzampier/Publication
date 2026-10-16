-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 09_add_token_version.sql
-- (change endurecer-sessao-segredos-e-uploads — capability revogacao-sessao)
-- Versão da sessão por usuário: o access JWT carrega o valor e o middleware
-- recusa tokens cuja versão não confere (logout/desativação incrementam).
-- Aditiva e idempotente (o runner tolera 1060 = coluna já existe).
-- =========================================================================

ALTER TABLE usuarios
    ADD COLUMN token_version INT NOT NULL DEFAULT 0 COMMENT 'Versão da sessão — incrementada para revogar os access JWT vigentes';

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '09_add_token_version.sql';
-- =========================================================================
-- ALTER TABLE usuarios DROP COLUMN token_version;
