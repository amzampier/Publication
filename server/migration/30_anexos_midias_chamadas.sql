-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 30_anexos_midias_chamadas.sql
-- (change midias-chamadas-relacionais) Backfill das imagens da chamada do
-- JSON legado (`entregas_itens.imagens`) para a tabela relacional
-- `anexos_midias`, com ordem, capa, nome e MIME derivados da URL.
-- Aditiva e idempotente: `NOT EXISTS` por (entrega_item_id, url_arquivo) e
-- runner tolera indices ja existentes (1061). Nao usa DROP TABLE/VIEW/DATABASE.
-- SEM `USE` e SEM `;` dentro de strings (convencao do runner).
-- =========================================================================
INSERT INTO anexos_midias
    (entrega_item_id, url_arquivo, nome_arquivo, tipo_mime,
     ordem_exibicao, destaque_capa, legenda_alt)
SELECT e.id,
       jt.url,
       SUBSTRING_INDEX(jt.url, '/', -1),
       CASE
           WHEN LOWER(jt.url) LIKE '%.jpg' OR LOWER(jt.url) LIKE '%.jpeg' THEN 'image/jpeg'
           WHEN LOWER(jt.url) LIKE '%.webp' THEN 'image/webp'
           WHEN LOWER(jt.url) LIKE '%.gif' THEN 'image/gif'
           ELSE 'image/png'
       END,
       MIN(jt.ord) - 1,
       CASE WHEN MIN(jt.ord) = 1 THEN 1 ELSE 0 END,
       NULL
  FROM entregas_itens e
  JOIN JSON_TABLE(
           e.imagens,
           '$[*]' COLUMNS (
               ord FOR ORDINALITY,
               url VARCHAR(500) PATH '$'
           )
       ) AS jt
 WHERE e.imagens IS NOT NULL
   AND JSON_VALID(e.imagens)
   AND jt.url IS NOT NULL
   AND jt.url <> ''
   AND NOT EXISTS (
       SELECT 1 FROM anexos_midias m
        WHERE m.entrega_item_id = e.id
          AND m.url_arquivo = jt.url COLLATE utf8mb4_unicode_520_ci
   )
 GROUP BY e.id, jt.url;

-- Indices para a leitura ordenada e para a checagem de compartilhamento por URL.
ALTER TABLE anexos_midias
    ADD UNIQUE KEY uk_midias_item_url (entrega_item_id, url_arquivo);

ALTER TABLE anexos_midias
    ADD KEY idx_midias_url (url_arquivo(191));

-- Conferencia sugerida apos o backfill:
-- SELECT COUNT(*) FROM entregas_itens WHERE imagens IS NOT NULL AND JSON_VALID(imagens);
-- SELECT COUNT(*) FROM anexos_midias WHERE entrega_item_id IS NOT NULL;
-- SELECT entrega_item_id, url_arquivo, COUNT(*) FROM anexos_midias
--  WHERE entrega_item_id IS NOT NULL
--  GROUP BY entrega_item_id, url_arquivo HAVING COUNT(*) > 1;
-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '30_anexos_midias_chamadas.sql';
-- 1) remover os indices:
-- ALTER TABLE anexos_midias DROP INDEX uk_midias_item_url;
-- ALTER TABLE anexos_midias DROP INDEX idx_midias_url;
-- 2) em rollback completo, remover as linhas de chamadas (o JSON legado permanece):
-- DELETE FROM anexos_midias WHERE entrega_item_id IS NOT NULL;
-- =========================================================================
