-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 37
-- Cria uma coluna gerada para o JSON de tags e um FULLTEXT que cobre todos
-- os campos pesquisáveis de Chamadas. Assim a busca textual usa MATCH sem
-- OR com LIKE, preservando o índice.
-- =========================================================================

ALTER TABLE entregas_itens
  ADD COLUMN tags_texto LONGTEXT
    GENERATED ALWAYS AS (JSON_UNQUOTE(tags)) STORED;

ALTER TABLE entregas_itens
  ADD FULLTEXT ft_entregas_busca_completo (
    chamada,
    titulo,
    descricao_completa,
    solucao,
    modulo,
    menu_funcionalidade,
    software,
    parceiro,
    tags_texto,
    `release`
  );

-- REVERTER:
-- ALTER TABLE entregas_itens DROP INDEX ft_entregas_busca_completo;
-- ALTER TABLE entregas_itens DROP COLUMN tags_texto;