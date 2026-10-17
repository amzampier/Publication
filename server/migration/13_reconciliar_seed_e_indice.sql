-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 13_reconciliar_seed_e_indice.sql
-- (RL05-M-05 / RL05-B-21) Aditiva e idempotente.
-- 1) Restaura o seed da trilha de auditoria (migration 07) quando as linhas
--    'log-seed-%' nao existem, embora a 07 conste em _migrations (drift).
--    INSERT IGNORE: re-execucao e inofensiva (ids fixos).
-- 2) Indice para a varredura da aba Seguranca (usuarios.tentativas_falhas).
-- SEM `USE`: o pool da aplicacao ja conecta no banco de DB_NAME.
-- =========================================================================
INSERT IGNORE INTO auditoria (id, usuario_id, data_hora, usuario_nome, usuario_perfil, acao, entidade, entidade_id, endereco_ip, detalhes) VALUES
    ('log-seed-001', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 0 DAY), INTERVAL 9 HOUR), INTERVAL 12 MINUTE), 'Ana Carolina Ribeiro', 'Administrador', 'Inclusão', 'Publicações', '', '200.189.45.12', 'Criou a publicação ''Release Week #40 — Correções de Exibição'''),
    ('log-seed-002', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 0 DAY), INTERVAL 8 HOUR), INTERVAL 47 MINUTE), 'Rafael Souza', 'Editor', 'Alteração', 'Publicações', '', '189.34.12.8', 'Alterou o status de ''Manuais Internos'' de rascunho para publicado'),
    ('log-seed-003', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 DAY), INTERVAL 17 HOUR), INTERVAL 5 MINUTE), 'Carlos Mendes', 'Administrador', 'Homologação', 'Perfis de Acesso', '', '10.0.0.5', 'Homologou o perfil ''Analista Fiscal'' com permissões de leitura'),
    ('log-seed-004', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 DAY), INTERVAL 14 HOUR), INTERVAL 30 MINUTE), 'Mariana Lopes', 'Revisor', 'Alteração', 'Configurações Globais', '', '177.92.10.44', 'Atualizou a política de retenção de logs de 180 para 365 dias'),
    ('log-seed-005', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 DAY), INTERVAL 11 HOUR), INTERVAL 15 MINUTE), 'Ana Carolina Ribeiro', 'Administrador', 'Exclusão', 'Logomarcas', '', '200.189.45.12', 'Removeu a logomarca de login ''antiga-v2.png'''),
    ('log-seed-006', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 DAY), INTERVAL 16 HOUR), INTERVAL 22 MINUTE), 'Rafael Souza', 'Editor', 'Inclusão', 'Publicações', '', '191.5.200.7', 'Criou a publicação ''Manual de Integração API v3'''),
    ('log-seed-007', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 DAY), INTERVAL 10 HOUR), INTERVAL 5 MINUTE), 'Carlos Mendes', 'Administrador', 'Alteração', 'Usuários', '', '10.0.0.5', 'Alterou o perfil de acesso de ''João Lima'' para Editor'),
    ('log-seed-008', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 DAY), INTERVAL 15 HOUR), INTERVAL 40 MINUTE), 'Mariana Lopes', 'Revisor', 'Inclusão', 'Logomarcas', '', '177.92.10.44', 'Enviou nova logomarca do header ''logo-header.png'''),
    ('log-seed-009', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 DAY), INTERVAL 9 HOUR), INTERVAL 20 MINUTE), 'Ana Carolina Ribeiro', 'Administrador', 'Alteração', 'Rate Limits', '', '200.189.45.12', 'Revalidou as regras de rate limit do módulo de autenticação'),
    ('log-seed-010', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 4 DAY), INTERVAL 18 HOUR), INTERVAL 3 MINUTE), 'Rafael Souza', 'Editor', 'Homologação', 'Publicações', '', '189.34.12.8', 'Homologou a publicação ''Release Week #39'''),
    ('log-seed-011', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 4 DAY), INTERVAL 11 HOUR), INTERVAL 48 MINUTE), 'Carlos Mendes', 'Administrador', 'Inclusão', 'Usuários', '', '10.0.0.5', 'Criou o usuário ''paula.torres@empresa.com.br'' com perfil Revisora'),
    ('log-seed-012', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 DAY), INTERVAL 16 HOUR), INTERVAL 10 MINUTE), 'Mariana Lopes', 'Revisor', 'Alteração', 'Perfis de Acesso', '', '177.92.10.44', 'Revogou a permissão ''exportar'' do perfil Convidado'),
    ('log-seed-013', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 6 DAY), INTERVAL 14 HOUR), INTERVAL 25 MINUTE), 'Ana Carolina Ribeiro', 'Administrador', 'Inclusão', 'Configurações Globais', '', '200.189.45.12', 'Definiu a logomarca padrão da tela de login'),
    ('log-seed-014', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 7 DAY), INTERVAL 10 HOUR), INTERVAL 33 MINUTE), 'Rafael Souza', 'Editor', 'Exclusão', 'Publicações', '', '191.5.200.7', 'Removeu a publicação duplicada ''Release Week #38 (cópia)'''),
    ('log-seed-015', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 8 DAY), INTERVAL 15 HOUR), INTERVAL 55 MINUTE), 'Carlos Mendes', 'Administrador', 'Alteração', 'Rate Limits', '', '10.0.0.5', 'Bloqueou o IP 45.190.22.1 por tentativas suspeitas'),
    ('log-seed-016', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 9 DAY), INTERVAL 9 HOUR), INTERVAL 44 MINUTE), 'Mariana Lopes', 'Revisor', 'Inclusão', 'Perfis de Acesso', '', '177.92.10.44', 'Criou o perfil ''Auditor Somente-Leitura'''),
    ('log-seed-017', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 11 DAY), INTERVAL 17 HOUR), INTERVAL 12 MINUTE), 'Ana Carolina Ribeiro', 'Administrador', 'Homologação', 'Usuários', '', '200.189.45.12', 'Homologou a troca de perfil de ''Camila Rocha'' para Super Admin'),
    ('log-seed-018', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 12 DAY), INTERVAL 13 HOUR), INTERVAL 7 MINUTE), 'Rafael Souza', 'Editor', 'Alteração', 'Logomarcas', '', '189.34.12.8', 'Substituiu a logomarca do header para a versão 2.1'),
    ('log-seed-019', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 16 HOUR), INTERVAL 40 MINUTE), 'Carlos Mendes', 'Administrador', 'Inclusão', 'Publicações', '', '10.0.0.5', 'Criou a publicação ''Escopo de Projetos — Outubro'''),
    ('log-seed-020', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 16 DAY), INTERVAL 11 HOUR), INTERVAL 22 MINUTE), 'Mariana Lopes', 'Revisor', 'Exclusão', 'Usuários', '', '177.92.10.44', 'Desativou o usuário ''teste.hml@empresa.com.br'''),
    ('log-seed-021', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 18 DAY), INTERVAL 14 HOUR), INTERVAL 58 MINUTE), 'Ana Carolina Ribeiro', 'Administrador', 'Alteração', 'Configurações Globais', '', '200.189.45.12', 'Habilitou a exibição de tooltips na sidebar'),
    ('log-seed-022', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 10 HOUR), INTERVAL 15 MINUTE), 'Rafael Souza', 'Editor', 'Homologação', 'Logomarcas', '', '191.5.200.7', 'Homologou a logomarca de login ''novo-login.svg'''),
    ('log-seed-023', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 22 DAY), INTERVAL 15 HOUR), INTERVAL 31 MINUTE), 'Carlos Mendes', 'Administrador', 'Inclusão', 'Rate Limits', '', '10.0.0.5', 'Registrou nova regra de bloqueio para a rota /api/login'),
    ('log-seed-024', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 25 DAY), INTERVAL 9 HOUR), INTERVAL 5 MINUTE), 'Mariana Lopes', 'Revisor', 'Alteração', 'Perfis de Acesso', '', '177.92.10.44', 'Renomeou o perfil ''Operador'' para ''Operador de Publicação'''),
    ('log-seed-025', NULL, DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 28 DAY), INTERVAL 17 HOUR), INTERVAL 49 MINUTE), 'Ana Carolina Ribeiro', 'Administrador', 'Inclusão', 'Usuários', '', '200.189.45.12', 'Criou o usuário ''carlos.mendes@empresa.com.br'' com perfil Administrador');

CREATE INDEX idx_usuarios_tentativas_falhas ON usuarios (tentativas_falhas);
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '13_reconciliar_seed_e_indice.sql';
-- =========================================================================
-- DELETE FROM auditoria WHERE id LIKE 'log-seed-%';
-- DROP INDEX idx_usuarios_tentativas_falhas ON usuarios;