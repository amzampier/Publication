-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 15_seed_softwares.sql
-- (change softwares-backend-e-importacao) Catalogo inicial de softwares.
-- Codigos fixos (PK) + INSERT IGNORE: reexecucao e inofensiva.
-- SEM `USE`: o pool da aplicacao ja conecta no banco de DB_NAME.
-- =========================================================================
INSERT IGNORE INTO softwares (codigo, descricao, categoria, situacao) VALUES
    ('SFT-001', 'Teorema ERP', 'Delphi e Web', 'Ativo'),
    ('SFT-002', 'Teorema WMS', 'Delphi', 'Ativo'),
    ('SFT-003', 'Teorema Fiscal', 'Delphi e Web', 'Ativo'),
    ('SFT-004', 'Teorema Frente de Caixa', 'Delphi', 'Ativo'),
    ('SFT-005', 'Teorema Estoque', 'Delphi e Web', 'Inativo'),
    ('SFT-006', 'Portal Web Teorema', 'Web', 'Ativo');
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '15_seed_softwares.sql';
-- =========================================================================
-- DELETE FROM softwares WHERE codigo IN ('SFT-001','SFT-002','SFT-003','SFT-004','SFT-005','SFT-006');
