-- Usuário de banco de menor privilégio para o Publications (RL06-M-07).
-- Execute como administrador do MariaDB, ajustando a senha.
-- Remove o GRANT OPTION/DDL total do usuário da aplicação.
CREATE USER IF NOT EXISTS 'publications_app'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA';
ALTER USER 'publications_app'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA';

GRANT SELECT, INSERT, UPDATE, DELETE ON publications.* TO 'publications_app'@'localhost';
-- Necessário para o Event Scheduler (expurgo de auditoria/sessões).
GRANT EVENT ON *.* TO 'publications_app'@'localhost';

REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'publications_app'@'localhost';
FLUSH PRIVILEGES;

-- Depois: ajuste DB_USER=publications_app e DB_PASSWORD no .env e reinicie.
-- Verificação:
-- SHOW GRANTS FOR 'publications_app'@'localhost';