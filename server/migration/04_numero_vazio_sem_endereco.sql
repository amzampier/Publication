-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - MIGRATION 04_numero_vazio_sem_endereco.sql
-- O campo numero nasce vazio em vez de 'S/N' (change integrar-via-cep; fix:
-- o DEFAULT 'S/N' da coluna era herdado por TODO INSERT que omite as colunas
-- de endereço - importação por planilha, convite find-or-create, bootstrap -
-- deixando numero='S/N' com o endereço inteiramente vazio). Limpa também os
-- resíduos 'S/N' de registros legados cujo endereço está vazio; 'S/N' junto a
-- endereço preenchido é o "sem número" legítimo e permanece.
-- NUNCA edite este arquivo depois de aplicado (docs/qa/03): correções
-- entram como 05_*.sql nova.
-- =========================================================================

ALTER TABLE usuarios ALTER numero SET DEFAULT '';

UPDATE usuarios
   SET numero = ''
 WHERE numero = 'S/N'
   AND cep = ''
   AND endereco = ''
   AND bairro = ''
   AND cidade = '';

-- =========================================================================
-- REVERTER (ROLLBACK) - executar MANUALMENTE se necessário; remova os "-- ".
-- Após reverter, apague o registro: DELETE FROM _migrations WHERE nome = '04_numero_vazio_sem_endereco.sql';
-- ATENÇÃO: a limpeza de dados acima não é reversível (não é possível
-- distinguir o 'S/N' removido de um 'S/N' digitado com endereço vazio).
-- =========================================================================
-- ALTER TABLE usuarios ALTER numero SET DEFAULT 'S/N';
