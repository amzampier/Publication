-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 38
-- Índices para o caminho de prefixo/igualdade da busca de Chamadas
-- (códigos, termos curtos e e-mails não usam MATCH).
-- =========================================================================

ALTER TABLE entregas_itens ADD INDEX idx_entregas_software (software);
ALTER TABLE entregas_itens ADD INDEX idx_entregas_parceiro (parceiro);
ALTER TABLE entregas_itens ADD INDEX idx_entregas_release (`release`);

-- REVERTER:
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_software;
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_parceiro;
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_release;