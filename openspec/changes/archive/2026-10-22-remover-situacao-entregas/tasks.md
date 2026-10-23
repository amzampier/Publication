# Tasks

## 1. Banco e referência

- [x] 1.1 Auditar os valores existentes com `SELECT situacao, COUNT(*) FROM entregas_itens GROUP BY situacao` e registrar que só existe `Desenvolvimento`; se houver outro valor, parar e tratar antes da migration
- [x] 1.2 Criar `server/migration/28_remover_situacao_entregas.sql` com `ALTER TABLE entregas_itens DROP COLUMN IF EXISTS situacao` e rollback comentado recriando coluna e índice; verificar que o boot aplica a migration e registra o nome em `_migrations`
- [x] 1.3 Atualizar `docs/bd/01 - banco_dados_mariadb.sql` removendo `situacao` e `idx_entregas_situacao` de `entregas_itens`; conferir que a referência bate com `SHOW CREATE TABLE entregas_itens` após a migration
- [x] 1.4 Atualizar `docs/02 - Guia de Arquitetura e Migrations.md` §4.5 com a exceção de coluna obsoleta (auditoria prévia, `DROP COLUMN IF EXISTS` e rollback); verificar que a regra e o exemplo não contradizem a spec `migracoes-banco`

## 2. Contrato compartilhado

- [x] 2.1 Remover `SituacaoChamada`, `SITUACOES_CHAMADA`, o campo `situacao` de `ChamadaModelo`/`EntradaChamada`, a validação, a prioridade de erro e o filtro em `shared/lancar-chamadas.ts`; `npm run typecheck` deve apontar apenas os usos ainda não migrados
- [x] 2.2 Remover `SituacaoItem` e o campo `situacao` de `ItemRelease`, `ItemManual` e `ItemProjeto` em `shared/release-week.ts`, `shared/manuais.ts` e `shared/escopo-projetos.ts`; verificar com `npm run typecheck`
- [x] 2.3 Atualizar `tests/lancar-chamadas-validadores.test.ts`, `tests/esteira-revisao-validadores.test.ts`, `tests/release-week-validadores.test.ts` e `tests/manuais-validadores.test.ts` removendo fixtures/casos de situação; `npm run test` deve passar sem referências ao campo
- [x] 2.4 Atualizar em `docs/15 - Módulo Lançar Chamadas.md` o modelo de dados, a lista de filtros e as regras de importação; conferir que nenhuma menção a Situação permaneça no documento

## 3. Servidor

- [x] 3.1 Remover `e.situacao` do `SELECT`, do `montarChamada`, do `montarEntrada`, de `ChamadaPreparada`, do `SQL_INSERT`/valores, do `UPDATE`/valores e do caminho de importação em `server/utils/lancar-chamadas.ts`; conferir a ordem dos parâmetros posicionais e rodar `npm run typecheck`
- [x] 3.2 Remover `situacao` dos SELECTs e mapeamentos de `listarItensRelease`, `listarItensManual` e `listarItensProjeto`; verificar com `npm run typecheck` e por chamada real aos endpoints de itens
- [x] 3.3 Atualizar a tabela de colunas de `entregas_itens` e o contrato da API em `docs/15`; conferir que criação, edição e importação não enviam nem recebem `situacao`
- [x] 3.4 Validar a API em execução: criar chamada, editar, importar e listar; verificar que o JSON não contém `situacao` e que um payload legado com o campo é aceito e ignorado

## 4. Interface

- [x] 4.1 Remover a seção Situação de `app/components/lancar-chamadas/Filtros.vue`, o campo do rascunho/envio em `Formulario.vue` e o filtro/contagem em `useLancarChamadasModelo.ts`; conferir que o badge de filtros ativos não conta mais o campo
- [x] 4.2 Ajustar o subtítulo de `app/components/lancar-chamadas/Tabela.vue` e remover o bloco Situação de `app/components/esteira/Detalhe.vue` e o mapeamento em `useEsteiraRevisaoModelo.ts`; verificar no navegador que o detalhe da esteira não exibe o campo
- [x] 4.3 Remover a coluna Situação de `app/components/release-week/Itens.vue`, `app/components/manuais/Itens.vue` e `app/components/escopo-projetos/Itens.vue`; verificar a expansão de itens nas três telas
- [x] 4.4 Atualizar `docs/12`–`docs/16` removendo Situação das colunas de itens, filtros e detalhe; conferir que as descrições batem com as telas reais

## 5. Verificação integrada

- [x] 5.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; todos devem passar
- [x] 5.2 Subir o app contra o MariaDB local e conferir `_migrations`, `SHOW CREATE TABLE entregas_itens` (sem coluna/índice) e a ausência de `situacao` nas respostas de `/api/lancar-chamadas`, `/api/release-week/:id/itens`, `/api/manuais/:id/itens` e `/api/escopo-projetos/:id/itens`
- [x] 5.3 Percorrer manualmente Nova Chamada, Edição, Importação, filtros, expansão de itens e detalhe da esteira; confirmar que não há campo/coluna Situação e que os demais dados persistem
