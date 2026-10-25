-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 39
-- Índice de apoio ao fluxo do Painel (status + vínculos + datas), evitando
-- full scan na agregação de itensFluxo.
-- =========================================================================

ALTER TABLE entregas_itens
  ADD INDEX idx_entregas_fluxo (
    status,
    release_id,
    manual_id,
    projeto_id,
    data_lancamento,
    criado_em,
    publicado_em
  );

-- REVERTER:
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_fluxo;