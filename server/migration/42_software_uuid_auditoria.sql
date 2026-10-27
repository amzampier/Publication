-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 42
-- (change corrigir-auditoria-software-uuid - RL06 B-03)
--
-- Restaura uma identidade UUID estavel para softwares sem alterar a PK
-- `codigo`, usada pelas FKs e pela UI. A auditoria passa a gravar o UUID em
-- `entidade_id`, mantendo o codigo SFT-XXX em `detalhes`.
-- Aditiva e idempotente; sem `USE`; sem DROP TABLE/VIEW/DATABASE.
-- =========================================================================

ALTER TABLE softwares
  ADD COLUMN IF NOT EXISTS uuid UUID NULL;

UPDATE softwares
   SET uuid = UUID()
 WHERE uuid IS NULL;

ALTER TABLE softwares
  MODIFY COLUMN uuid UUID NOT NULL DEFAULT UUID();

CREATE UNIQUE INDEX IF NOT EXISTS uk_softwares_uuid
  ON softwares (uuid);

-- Conferencia sugerida:
-- SELECT COUNT(*) AS total,
--        SUM(uuid IS NULL) AS nulos,
--        COUNT(DISTINCT uuid) AS distintos
--   FROM softwares;
-- SHOW INDEX FROM softwares WHERE Key_name = 'uk_softwares_uuid';

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- DROP INDEX uk_softwares_uuid ON softwares;
-- ALTER TABLE softwares DROP COLUMN uuid;
-- DELETE FROM _migrations WHERE nome = '42_software_uuid_auditoria.sql';
-- =========================================================================
