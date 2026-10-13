-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 03_add_sidebar_expandida.sql
-- Adiciona a coluna que guarda se a sidebar do shell inicia expandida (1)
-- ou recolhida (0) — persistência da preferência "Comportamento Padrão da
-- Barra Lateral" da aba Sidebar de Configurações Globais (change
-- integrar-configuracoes-globais-api; fix: o expandir/recolher não era
-- persistido porque o schema só tinha o JSON sidebar_grupos das sessões).
-- NUNCA edite este arquivo depois de aplicado (docs/qa/03): correções
-- entram como 04_*.sql nova.
-- =========================================================================

ALTER TABLE configuracoes_globais
    ADD COLUMN sidebar_expandida TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Preferência da barra lateral do shell: 1 = expandida, 0 = recolhida'
        AFTER sidebar_grupos;

-- =========================================================================
-- REVERTER (ROLLBACK) — executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '03_add_sidebar_expandida.sql';
-- =========================================================================
-- ALTER TABLE configuracoes_globais DROP COLUMN sidebar_expandida;
