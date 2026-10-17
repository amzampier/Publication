-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 12_indices_seguranca.sql
-- (change otimizar-desempenho-e-banco — RL04 Etapa 4, comportamento-preservante)
-- Aditiva e idempotente: índice para a varredura da aba Segurança
-- (usuarios.bloqueado_ate) e para o COUNT(DISTINCT usuario_nome) do agregado da
-- auditoria. Sem DROP; o runner tolera 1060/1061.
-- =========================================================================

CREATE INDEX idx_usuarios_bloqueado_ate ON usuarios (bloqueado_ate);
CREATE INDEX idx_audit_usuario ON auditoria (usuario_nome);

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Após reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '12_indices_seguranca.sql';
-- =========================================================================
-- DROP INDEX idx_audit_usuario ON auditoria;
-- DROP INDEX idx_usuarios_bloqueado_ate ON usuarios;