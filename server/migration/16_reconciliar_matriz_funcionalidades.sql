-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 16_reconciliar_matriz_funcionalidades.sql
-- (change rbac-funcionalidades-por-modulo) Reaplica a matriz de permissoes_perfil
-- sobre o CATALOGO POR MODULO, reconciliando bases que rodaram a matriz antiga
-- (vocabulario unico de 9 acoes): passa a conceder `permissoes` (Perfis), alem de
-- `filtrar`/`buscar` onde o perfil ja' tinha `visualizar`, e remove funcionalidades
-- fora do catalogo. Reset idempotente: DELETE + INSERT das 44 linhas (11 modulos x 4 perfis).
-- Totais (catalogo = 85): Administrador 85, Editor 61, Revisor 37, Leitor 12.
-- Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE` (o pool ja' conecta em DB_NAME).
-- =========================================================================
DELETE FROM permissoes_perfil;

-- --- Administrador: 85/85 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000001', 'manuais', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'release-week', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'escopo-projetos', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'esteira-revisao', 1, 0, 1, 0, '["publicar","arquivar","filtrar"]'),
    ('10000000-0000-4000-8000-000000000001', 'lancar-chamadas', 1, 1, 1, 1, '["publicar","arquivar","download","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'parceiros', 1, 1, 1, 1, '["importar","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'softwares', 1, 1, 1, 1, '["importar","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'gestao-usuarios', 1, 1, 1, 1, '["importar","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'perfis-acesso', 1, 1, 1, 1, '["permissoes","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'auditoria', 1, 0, 0, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'configuracoes-globais', 1, 0, 1, 0, NULL);

-- --- Editor: 61/85 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000002', 'manuais', 1, 1, 1, 0, '["publicar","arquivar","download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'release-week', 1, 1, 1, 0, '["publicar","arquivar","download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'escopo-projetos', 1, 1, 1, 0, '["publicar","arquivar","download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'esteira-revisao', 1, 0, 1, 0, '["publicar","arquivar","filtrar"]'),
    ('10000000-0000-4000-8000-000000000002', 'lancar-chamadas', 1, 1, 1, 0, '["publicar","arquivar","download","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'parceiros', 1, 1, 1, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'softwares', 1, 1, 1, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'gestao-usuarios', 1, 0, 0, 0, '["importar","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000002', 'auditoria', 1, 0, 0, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'configuracoes-globais', 0, 0, 0, 0, NULL);

-- --- Revisor: 37/85 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000003', 'manuais', 1, 0, 1, 0, '["download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'release-week', 1, 0, 1, 0, '["download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'escopo-projetos', 1, 0, 1, 0, '["download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'esteira-revisao', 1, 0, 1, 0, '["filtrar"]'),
    ('10000000-0000-4000-8000-000000000003', 'lancar-chamadas', 1, 0, 1, 0, '["filtrar"]'),
    ('10000000-0000-4000-8000-000000000003', 'parceiros', 1, 0, 0, 0, '["filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'softwares', 1, 0, 0, 0, '["filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'gestao-usuarios', 1, 0, 0, 0, '["filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'auditoria', 1, 0, 0, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'configuracoes-globais', 0, 0, 0, 0, NULL);

-- --- Leitor: 12/85 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000004', 'manuais', 1, 0, 0, 0, '["download","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000004', 'release-week', 1, 0, 0, 0, '["download","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000004', 'escopo-projetos', 1, 0, 0, 0, '["download","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000004', 'esteira-revisao', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'lancar-chamadas', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'parceiros', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'softwares', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'gestao-usuarios', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'auditoria', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'configuracoes-globais', 0, 0, 0, 0, NULL);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '16_reconciliar_matriz_funcionalidades.sql';
-- Restaura a matriz anterior: DELETE FROM permissoes_perfil; e reaplicar 02_seed.sql.
-- =========================================================================
-- DELETE FROM permissoes_perfil;
