-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 05_seguranca_eventos_login.sql
-- Log append-only de tentativas de login (change seguranca-rate-limits-reais):
-- cada falha/senha inválida, e-mail inexistente, bloqueio aplicado ou tentativa
-- em conta bloqueada vira uma linha imutável — alimenta a aba Segurança de
-- Configurações Globais. A aplicação só insere e lê (mesma regra da auditoria);
-- a FK em usuarios usa ON DELETE SET NULL para o log sobreviver à exclusão da
-- conta. NUNCA edite este arquivo depois de aplicado (docs/qa/03): correções
-- entram como 06_*.sql nova.
-- =========================================================================

CREATE TABLE seguranca_eventos_login (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador do evento de login',
    ocorrido_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Data e hora da tentativa',
    email_alvo VARCHAR(255) NOT NULL COMMENT 'E-mail digitado no login (minúsculas)',
    usuario_id UUID NULL COMMENT 'Conta alvo quando existir (NULL = e-mail inexistente ou conta excluída)',
    ip VARCHAR(45) NOT NULL COMMENT 'Endereço IPv4 ou IPv6 do cliente',
    tipo ENUM('senha-invalida', 'email-inexistente', 'bloqueio-aplicado', 'tentativa-bloqueado') NOT NULL COMMENT 'Natureza da tentativa registrada',
    tentativas_acumuladas TINYINT UNSIGNED NULL COMMENT 'Falhas consecutivas ao registrar (NULL quando não aplicável)',
    PRIMARY KEY (id),
    CONSTRAINT fk_seguranca_eventos_usuario_id
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    KEY idx_seguranca_eventos_ocorrido_em (ocorrido_em DESC),
    KEY idx_seguranca_eventos_email_alvo (email_alvo),
    KEY idx_seguranca_eventos_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
  COMMENT='Log de tentativas de login (append-only - change seguranca-rate-limits-reais)';

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '05_seguranca_eventos_login.sql';
-- ATENÇÃO: o rollback descarta todo o histórico de eventos registrado.
-- =========================================================================
-- DROP TABLE seguranca_eventos_login;
