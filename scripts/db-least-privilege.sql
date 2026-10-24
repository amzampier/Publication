-- Usuário de banco de menor privilégio para o Publications (RL06-M-07 / RL06-3 I-01).
-- Execute como administrador do MariaDB, ajustando a senha.
-- A aplicação recebe apenas DML nas tabelas operacionais. Auditoria e histórico
-- são append-only: sem UPDATE; DELETE de auditoria fica restrito ao EVENT de
-- expurgo, e os gatilhos da migration 32 bloqueiam DELETE comum.
CREATE USER IF NOT EXISTS 'publications_app'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA';
ALTER USER 'publications_app'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA';

REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'publications_app'@'localhost';

-- Leitura/inserção em todo o schema (inclui _migrations e views).
GRANT SELECT, INSERT ON publications.* TO 'publications_app'@'localhost';

-- Atualização/exclusão apenas nas tabelas operacionais.
GRANT UPDATE, DELETE ON publications.anexos_midias TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.configuracoes_globais TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.configuracoes_limite_requisicao TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.entregas_itens TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.entregas_itens_softwares TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.manuais TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.manuais_mensal TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.notificacoes_sistema TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.parceiros TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.perfis_acesso TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.permissoes_perfil TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.projetos_escopo TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.release_week TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.seguranca_eventos_login TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.sessoes TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.softwares TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.token_blacklist TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.tokens_acesso TO 'publications_app'@'localhost';
GRANT UPDATE, DELETE ON publications.usuarios TO 'publications_app'@'localhost';

-- Auditoria: sem UPDATE; DELETE só pelo EVENT de expurgo (gatilho exige a
-- variável de sessão definida pelo evento).
GRANT DELETE ON publications.auditoria TO 'publications_app'@'localhost';

-- Event Scheduler para o expurgo.
GRANT EVENT ON *.* TO 'publications_app'@'localhost';
FLUSH PRIVILEGES;

-- Depois: ajuste DB_USER=publications_app e DB_PASSWORD no .env e reinicie.
-- Verificação:
-- SHOW GRANTS FOR 'publications_app'@'localhost';
