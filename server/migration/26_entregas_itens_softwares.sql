-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 26_entregas_itens_softwares.sql
-- (change lancar-chamadas-multiplos-softwares) Vinculo N:N entre chamadas e
-- softwares:
--   - nova tabela `entregas_itens_softwares` (junção item x software) com o
--     nome do software como snapshot e a ordem de selecao;
--   - `entregas_itens.software_id`/`software` permanecem como o SOFTWARE
--     PRINCIPAL (primeiro selecionado), mantendo compatibilidade;
--   - backfill idempotente dos registros existentes (um software por chamada).
-- Aditiva e idempotente: o runner tolera objeto ja' existente (1050/1060/1061)
-- e o INSERT usa NOT EXISTS. Nao usa DROP TABLE/VIEW/DATABASE. SEM `USE`.
-- =========================================================================
CREATE TABLE IF NOT EXISTS entregas_itens_softwares (
    entrega_item_id VARCHAR(64) NOT NULL COMMENT 'Chave estrangeira apontando para entregas_itens.id',
    software_codigo VARCHAR(20) NOT NULL COMMENT 'Chave estrangeira apontando para softwares.codigo',
    software_nome VARCHAR(200) NOT NULL COMMENT 'Snapshot do nome do software na data do vinculo',
    ordem TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Ordem de selecao do software na chamada',
    PRIMARY KEY (entrega_item_id, software_codigo),
    KEY idx_entregas_softwares_codigo (software_codigo),
    CONSTRAINT fk_entregas_softwares_item
        FOREIGN KEY (entrega_item_id)
        REFERENCES entregas_itens(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_entregas_softwares_soft
        FOREIGN KEY (software_codigo)
        REFERENCES softwares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci
  COMMENT='Softwares vinculados a cada chamada (N:N)';

INSERT INTO entregas_itens_softwares (entrega_item_id, software_codigo, software_nome, ordem)
SELECT e.id, e.software_id, COALESCE(NULLIF(e.software, ''), s.descricao), 0
  FROM entregas_itens e
  JOIN softwares s ON s.codigo = e.software_id
 WHERE e.software_id IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM entregas_itens_softwares x
        WHERE x.entrega_item_id = e.id AND x.software_codigo = e.software_id
   );
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '26_entregas_itens_softwares.sql';
-- =========================================================================
-- DROP TABLE IF EXISTS entregas_itens_softwares;
-- =========================================================================
