-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 08_integridade_e_indices.sql
-- (change endurecer-banco-e-bootstrap — achados RL02 M-10, M-15, M-16)
-- Integridade: nome de perfil único (a API responde 409 em duplicidade).
-- Performance: índices dos filtros server-side de Auditoria (por ação) e da
-- aba Segurança (bloqueio por e-mail/tipo/janela).
-- Aditiva e idempotente: erros de objeto já existente (1061) são tolerados
-- pelo runner. SEM `USE` (o pool conecta no banco de DB_NAME).
-- =========================================================================

ALTER TABLE perfis_acesso
    ADD UNIQUE KEY uk_perfis_nome (nome_perfil);

ALTER TABLE auditoria
    ADD KEY idx_audit_acao (acao);

ALTER TABLE seguranca_eventos_login
    ADD KEY idx_seg_email_tipo_data (email_alvo, tipo, ocorrido_em);

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '08_integridade_e_indices.sql';
-- =========================================================================
-- ALTER TABLE perfis_acesso DROP INDEX uk_perfis_nome;
-- ALTER TABLE auditoria DROP INDEX idx_audit_acao;
-- ALTER TABLE seguranca_eventos_login DROP INDEX idx_seg_email_tipo_data;
