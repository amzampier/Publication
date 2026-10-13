-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 02_seed.sql
-- Cópia executável de: docs/bd/02_seed.sql
-- (sem o INSERT do administrador: o bootstrap do admin é feito em TS pelo
-- plugin Nitro com bcrypt real cost 12 — design.md decisão 3)
-- Executar APÓS 01_create_tables.sql no banco publications.
-- Fonte da matriz de permissões: docs/07 §7 / app usePerfisDemo MATRIZ_SEED
-- (4 perfis × 11 módulos × 9 ações = 99 permissões possíveis por perfil).
-- Re-execução: as UNIQUE keys (uk_perfil_modulo, PKs de config) evitam
-- duplicidade — o runner tolera erros 1062 (docs/qa/03).
-- NUNCA edite este arquivo depois de aplicado (docs/qa/03).
-- SEM `USE`: o pool da aplicação já conecta no banco de DB_NAME.
-- =========================================================================

-- =========================================================================
-- 1. PERFIS PADRÃO (4 perfis canônicos, todos Ativo)
-- =========================================================================
INSERT INTO perfis_acesso (id, nome_perfil, descricao, situacao) VALUES
    ('10000000-0000-4000-8000-000000000001', 'Administrador', 'Acesso total ao sistema, incluindo perfis de acesso e configurações globais.', 'Ativo'),
    ('10000000-0000-4000-8000-000000000002', 'Editor', 'Produz, publica e mantém conteúdos e cadastros do portal.', 'Ativo'),
    ('10000000-0000-4000-8000-000000000003', 'Revisor', 'Revisa e homologa conteúdos na esteira, sem criar nem excluir registros.', 'Ativo'),
    ('10000000-0000-4000-8000-000000000004', 'Leitor', 'Consulta e baixa os conteúdos publicados.', 'Ativo');

-- =========================================================================
-- 2. MATRIZ DE PERMISSÕES (11 módulos × 4 perfis = 44 linhas)
-- Colunas fixas: pode_visualizar, pode_incluir, pode_editar, pode_excluir.
-- extras: JSON array das ações extras (publicar, arquivar, download,
-- exportar, importar); NULL = nenhuma ação extra concedida no módulo.
-- =========================================================================

-- --- Administrador: 99/99 (todas as ações em todos os módulos) ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000001', 'manuais', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'release-week', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'escopo-projetos', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'esteira-revisao', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'lancar-chamadas', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'parceiros', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'softwares', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'gestao-usuarios', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'perfis-acesso', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'auditoria', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]'),
    ('10000000-0000-4000-8000-000000000001', 'configuracoes-globais', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar"]');

-- --- Editor: 45/99 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000002', 'manuais', 1, 1, 1, 0, '["publicar","arquivar","download","exportar"]'),
    ('10000000-0000-4000-8000-000000000002', 'release-week', 1, 1, 1, 0, '["publicar","arquivar","download","exportar"]'),
    ('10000000-0000-4000-8000-000000000002', 'escopo-projetos', 1, 1, 1, 0, '["publicar","arquivar","download","exportar"]'),
    ('10000000-0000-4000-8000-000000000002', 'esteira-revisao', 1, 1, 1, 0, '["publicar","arquivar"]'),
    ('10000000-0000-4000-8000-000000000002', 'lancar-chamadas', 1, 1, 1, 0, '["publicar","arquivar","download"]'),
    ('10000000-0000-4000-8000-000000000002', 'parceiros', 1, 1, 1, 0, '["exportar"]'),
    ('10000000-0000-4000-8000-000000000002', 'softwares', 1, 1, 1, 0, '["exportar"]'),
    ('10000000-0000-4000-8000-000000000002', 'gestao-usuarios', 1, 0, 0, 0, '["importar","exportar"]'),
    ('10000000-0000-4000-8000-000000000002', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000002', 'auditoria', 1, 0, 0, 0, '["exportar"]'),
    ('10000000-0000-4000-8000-000000000002', 'configuracoes-globais', 0, 0, 0, 0, NULL);

-- --- Revisor: 21/99 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000003', 'manuais', 1, 0, 1, 0, '["download","exportar"]'),
    ('10000000-0000-4000-8000-000000000003', 'release-week', 1, 0, 1, 0, '["download","exportar"]'),
    ('10000000-0000-4000-8000-000000000003', 'escopo-projetos', 1, 0, 1, 0, '["download","exportar"]'),
    ('10000000-0000-4000-8000-000000000003', 'esteira-revisao', 1, 0, 1, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'lancar-chamadas', 1, 0, 1, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'parceiros', 1, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'softwares', 1, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'gestao-usuarios', 1, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'auditoria', 1, 0, 0, 0, '["exportar"]'),
    ('10000000-0000-4000-8000-000000000003', 'configuracoes-globais', 0, 0, 0, 0, NULL);

-- --- Leitor: 6/99 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000004', 'manuais', 1, 0, 0, 0, '["download"]'),
    ('10000000-0000-4000-8000-000000000004', 'release-week', 1, 0, 0, 0, '["download"]'),
    ('10000000-0000-4000-8000-000000000004', 'escopo-projetos', 1, 0, 0, 0, '["download"]'),
    ('10000000-0000-4000-8000-000000000004', 'esteira-revisao', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'lancar-chamadas', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'parceiros', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'softwares', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'gestao-usuarios', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'auditoria', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000004', 'configuracoes-globais', 0, 0, 0, 0, NULL);

-- =========================================================================
-- 3. (REMOVIDO) USUÁRIO ADMINISTRADOR INICIAL
-- O INSERT do admin foi removido desta migration: o hash bcrypt é gerado
-- em TypeScript no boot (server/plugins/migration.ts + bcrypt cost 12),
-- idempotente por e-mail (ana.carolina@empresa.com.br) — design.md decisão 3.
-- =========================================================================

-- =========================================================================
-- 4. CONFIGURAÇÕES GLOBAIS (linha única padrão)
-- =========================================================================
INSERT INTO configuracoes_globais (
    id, nome_empresa, banner_publico_ativo, banner_texto, banner_tipo,
    exigir_revisao_para_publicar, notificar_por_email, sidebar_grupos,
    dias_retencao_auditoria
) VALUES (
    'config_default',
    'Publication Enterprise Suite',
    1,
    NULL,
    'novidade',
    1,
    0,
    '{"publicacoes":true,"movimentos":true,"cadastros":true,"administracao":true}',
    180
);

-- =========================================================================
-- 5. RATE LIMIT (linha única padrão)
-- =========================================================================
INSERT INTO configuracoes_limite_requisicao (
    id, ativo, limite_requisicoes_minuto, limite_pico, taxa_atual, ips_bloqueados
) VALUES (
    'rate_limit_default',
    1,
    120,
    180,
    0,
    NULL
);

-- =========================================================================
-- FIM DOS SEEDS
-- =========================================================================

-- =========================================================================
-- REVERTER (ROLLBACK) — executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '02_seed.sql';
-- =========================================================================
-- DELETE FROM permissoes_perfil WHERE perfil_id IN (SELECT id FROM perfis_acesso WHERE nome_perfil IN ('Administrador', 'Editor', 'Revisor', 'Leitor'));
-- DELETE FROM perfis_acesso WHERE nome_perfil IN ('Administrador', 'Editor', 'Revisor', 'Leitor');
-- DELETE FROM configuracoes_globais WHERE id = 'config_default';
-- DELETE FROM configuracoes_limite_requisicao WHERE id = 'rate_limit_default';
