-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 35_busca_fulltext.sql
-- (change escalar-busca-e-entrega)
--
-- Índices FULLTEXT para os módulos de maior volume. A aplicação usa
-- MATCH ... AGAINST para termos com 3+ caracteres (innodb_ft_min_token_size=3)
-- e prefixo para códigos/e-mails/termos curtos.
-- =========================================================================

CREATE FULLTEXT INDEX IF NOT EXISTS ft_entregas_busca
  ON entregas_itens (chamada, titulo, descricao_completa, solucao, modulo, menu_funcionalidade);

CREATE FULLTEXT INDEX IF NOT EXISTS ft_auditoria_busca
  ON auditoria (usuario_nome, entidade, detalhes);

CREATE FULLTEXT INDEX IF NOT EXISTS ft_usuarios_busca
  ON usuarios (nome_completo, email_corporativo);

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- ALTER TABLE usuarios DROP INDEX ft_usuarios_busca;
-- ALTER TABLE auditoria DROP INDEX ft_auditoria_busca;
-- ALTER TABLE entregas_itens DROP INDEX ft_entregas_busca;
-- DELETE FROM _migrations WHERE nome = '35_busca_fulltext.sql';
-- =========================================================================
