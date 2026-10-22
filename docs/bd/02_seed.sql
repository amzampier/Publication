-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - SEEDS INICIAIS (MARIADB 11.8+ LTS)
-- Arquivo: 02_seed.sql — executar APÓS 01_create_tables.sql no banco publications.
-- Fonte da matriz de permissões: docs/07 §7 / app usePerfisModelo MATRIZ_SEED
-- (4 perfis × 11 módulos × 9 ações = 99 permissões possíveis por perfil).
-- Re-execução: as UNIQUE keys (uk_perfil_modulo, uk_usuarios_email, PKs de
-- config) evitam duplicidade — o runner tolera erros 1062 (docs/qa/03).
-- =========================================================================
USE publications;

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
-- Catálogo de funcionalidades POR MÓDULO (server/utils/perfis.ts): as fixas
-- (visualizar, criar, alterar, excluir) viram colunas; as específicas vão no
-- `extras` JSON. Uma coluna só é 1 quando o módulo possui a funcionalidade.
-- Totais (catálogo = 92): Administrador 92, Editor 67, Revisor 41, Leitor 14.
-- =========================================================================

-- --- Administrador: 92/92 (todas as funcionalidades do catálogo) ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000001', 'manuais', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar","filtrar","buscar","clonar","visualizar_itens"]'),
    ('10000000-0000-4000-8000-000000000001', 'release-week', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar","filtrar","buscar","clonar","visualizar_itens"]'),
    ('10000000-0000-4000-8000-000000000001', 'escopo-projetos', 1, 1, 1, 1, '["publicar","arquivar","download","exportar","importar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'esteira-revisao', 1, 0, 1, 0, '["publicar","arquivar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'lancar-chamadas', 1, 1, 1, 1, '["publicar","arquivar","download","importar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'parceiros', 1, 1, 1, 1, '["importar","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'softwares', 1, 1, 1, 1, '["importar","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'gestao-usuarios', 1, 1, 1, 1, '["importar","exportar","filtrar","buscar","convite"]'),
    ('10000000-0000-4000-8000-000000000001', 'perfis-acesso', 1, 1, 1, 1, '["permissoes","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'auditoria', 1, 0, 0, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000001', 'configuracoes-globais', 1, 0, 1, 0, NULL);

-- --- Editor: 67/92 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000002', 'manuais', 1, 1, 1, 0, '["publicar","arquivar","download","exportar","filtrar","buscar","clonar","visualizar_itens"]'),
    ('10000000-0000-4000-8000-000000000002', 'release-week', 1, 1, 1, 0, '["publicar","arquivar","download","exportar","filtrar","buscar","clonar","visualizar_itens"]'),
    ('10000000-0000-4000-8000-000000000002', 'escopo-projetos', 1, 1, 1, 0, '["publicar","arquivar","download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'esteira-revisao', 1, 0, 1, 0, '["publicar","arquivar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'lancar-chamadas', 1, 1, 1, 0, '["publicar","arquivar","download","importar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'parceiros', 1, 1, 1, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'softwares', 1, 1, 1, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'gestao-usuarios', 1, 0, 0, 0, '["importar","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000002', 'auditoria', 1, 0, 0, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000002', 'configuracoes-globais', 0, 0, 0, 0, NULL);

-- --- Revisor: 41/92 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000003', 'manuais', 1, 0, 1, 0, '["download","exportar","filtrar","buscar","visualizar_itens"]'),
    ('10000000-0000-4000-8000-000000000003', 'release-week', 1, 0, 1, 0, '["download","exportar","filtrar","buscar","visualizar_itens"]'),
    ('10000000-0000-4000-8000-000000000003', 'escopo-projetos', 1, 0, 1, 0, '["download","exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'esteira-revisao', 1, 0, 1, 0, '["publicar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'lancar-chamadas', 1, 0, 1, 0, '["filtrar"]'),
    ('10000000-0000-4000-8000-000000000003', 'parceiros', 1, 0, 0, 0, '["filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'softwares', 1, 0, 0, 0, '["filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'gestao-usuarios', 1, 0, 0, 0, '["filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'perfis-acesso', 0, 0, 0, 0, NULL),
    ('10000000-0000-4000-8000-000000000003', 'auditoria', 1, 0, 0, 0, '["exportar","filtrar","buscar"]'),
    ('10000000-0000-4000-8000-000000000003', 'configuracoes-globais', 0, 0, 0, 0, NULL);

-- --- Leitor: 14/92 ---
INSERT INTO permissoes_perfil (perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras) VALUES
    ('10000000-0000-4000-8000-000000000004', 'manuais', 1, 0, 0, 0, '["download","filtrar","buscar","visualizar_itens"]'),
    ('10000000-0000-4000-8000-000000000004', 'release-week', 1, 0, 0, 0, '["download","filtrar","buscar","visualizar_itens"]'),
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
-- 3. USUÁRIO ADMINISTRADOR INICIAL — NÃO É SEMEADO POR SQL
-- O administrador é provisionado em TypeScript pelo bootstrap do Nitro
-- (`server/utils/bootstrap-admin.ts`, chamado por `server/plugins/migration.ts`)
-- após as migrations: cria `admin@empresa.com.br` com bcrypt cost 12 de
-- 'Public@2026' e `senha_provisoria = 1`, SOMENTE fora de produção
-- (NODE_ENV !== 'production'). Por isso este arquivo de referência NÃO contém o
-- INSERT do admin (um hash placeholder aqui produziria lockout silencioso).
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
