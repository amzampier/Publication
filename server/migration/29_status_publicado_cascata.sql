-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 29_status_publicado_cascata.sql
-- (change status-publicado-e-cascata) Estado explicito de chamada publicada e
-- indices para a cascata pai -> filhas:
--   - `entregas_itens.status` passa a aceitar `Publicado` (visivel no portal);
--   - chamadas em `Publicar` cujo pai ativo ja esta `Publicado` sao alinhadas
--     para `Publicado`, com historico de migracao;
--   - indices compostos por vinculo + status para a reconciliacao em massa.
-- Aditiva e idempotente: o runner tolera objeto/indice ja existente (1050/1060/
-- 1061) e o backfill so atua em `Publicar`. Nao usa DROP TABLE/VIEW/DATABASE.
-- SEM `USE` e SEM `;` dentro de strings (convencao do runner).
-- =========================================================================
ALTER TABLE entregas_itens
    MODIFY COLUMN status ENUM('Revisar', 'Aprovado', 'Recusado', 'Publicar', 'Publicado')
    NOT NULL DEFAULT 'Revisar'
    COMMENT 'Status de workflow na esteira: Revisar, Aprovado, Recusado, Publicar (aguardando pai) ou Publicado (no portal)';

ALTER TABLE entregas_itens
    ADD INDEX idx_entregas_rel_status (release_id, status);

ALTER TABLE entregas_itens
    ADD INDEX idx_entregas_man_status (manual_id, status);

ALTER TABLE entregas_itens
    ADD INDEX idx_entregas_proj_status (projeto_id, status);

-- Historico da transicao de migracao (antes do UPDATE, para preservar
-- `status_anterior = Publicar`). Tempo no estagio fica nulo na migracao.
INSERT INTO historico_esteira_revisao
    (entrega_item_id, chamada, status_anterior, novo_status, responsavel_id,
     responsavel_nome, responsavel_perfil, parecer_tecnico,
     criterios_aceite_atendidos, tempo_no_estagio_minutos)
SELECT e.id, e.chamada, 'Publicar', 'Publicado', NULL,
       'Migracao', 'Sistema', 'Publicacao alinhada ao conteudo pai ja publicado (migracao)',
       1, NULL
  FROM entregas_itens e
 WHERE e.status = 'Publicar'
   AND (
       EXISTS (
           SELECT 1 FROM release_week r
            WHERE r.id = e.release_id AND r.status = 'Publicado' AND r.arquivada = 0
       )
       OR EXISTS (
           SELECT 1 FROM manuais_mensal m
            WHERE m.id = e.manual_id AND m.status = 'Publicado' AND m.arquivada = 0
       )
       OR EXISTS (
           SELECT 1 FROM projetos_escopo p
            WHERE p.id = e.projeto_id AND p.status = 'Publicado' AND p.arquivada = 0
       )
   )
   AND NOT EXISTS (
       SELECT 1 FROM historico_esteira_revisao h
        WHERE h.entrega_item_id = e.id
          AND h.status_anterior = 'Publicar'
          AND h.novo_status = 'Publicado'
   );

UPDATE entregas_itens e
   SET e.status = 'Publicado'
 WHERE e.status = 'Publicar'
   AND (
       EXISTS (
           SELECT 1 FROM release_week r
            WHERE r.id = e.release_id AND r.status = 'Publicado' AND r.arquivada = 0
       )
       OR EXISTS (
           SELECT 1 FROM manuais_mensal m
            WHERE m.id = e.manual_id AND m.status = 'Publicado' AND m.arquivada = 0
       )
       OR EXISTS (
           SELECT 1 FROM projetos_escopo p
            WHERE p.id = e.projeto_id AND p.status = 'Publicado' AND p.arquivada = 0
       )
   );

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE; remova os "-- ".
-- Apos reverter, apague o registro:
-- DELETE FROM _migrations WHERE nome = '29_status_publicado_cascata.sql';
-- 1) devolver o estado publicado ao status anterior:
-- UPDATE entregas_itens SET status = 'Publicar' WHERE status = 'Publicado';
-- 2) remover os indices compostos:
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_rel_status;
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_man_status;
-- ALTER TABLE entregas_itens DROP INDEX idx_entregas_proj_status;
-- 3) por ultimo, encolher o enum:
-- ALTER TABLE entregas_itens
--     MODIFY COLUMN status ENUM('Revisar', 'Aprovado', 'Recusado', 'Publicar')
--     NOT NULL DEFAULT 'Revisar'
--     COMMENT 'Status de workflow na esteira: Revisar, Aprovado, Recusado ou Publicar';
-- =========================================================================
