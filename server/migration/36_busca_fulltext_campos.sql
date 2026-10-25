-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 36
-- Amplia o FULLTEXT de Chamadas para os campos pesquisáveis documentados
-- (software, parceiro e código da release). `tags` é JSON e não aceita
-- FULLTEXT neste MariaDB; a busca por tags usa fallback literal controlado.
-- O índice antigo é mantido para rollback simples; o MATCH de 9 colunas usa
-- o novo índice.
-- =========================================================================

ALTER TABLE entregas_itens
  ADD FULLTEXT ft_entregas_busca_campos (
    chamada,
    titulo,
    descricao_completa,
    solucao,
    modulo,
    menu_funcionalidade,
    software,
    parceiro,
    `release`
  );

-- REVERTER:
-- ALTER TABLE entregas_itens DROP INDEX ft_entregas_busca_campos;