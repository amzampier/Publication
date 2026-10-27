# Tasks

## 1. Painel Executivo

- [x] 1.1 Trocar o `SELECT e.*` de `itensFluxo` por projeção mínima (`status`, `data_lancamento`, `criado_em` e flags) e verificar o `EXPLAIN`/contagem de colunas
- [x] 1.2 Cachear o agregado de fluxo (`painel:fluxo`) e `anosDasPublicacoes` por escopo; adicionar `invalidarCachePrefixo` e invalidar `painel:*` nas escritas
- [x] 1.3 Adicionar teste de cache/invalidação e atualizar `docs/17`; verificar N=20 sem `500`

## 2. Board, filtro e data

- [x] 2.1 Fazer `listarChamadasParaEsteira` enviar apenas contagem/capa de mídias; atualizar tipo/card e verificar que o board não carrega o array completo
- [x] 2.2 Adicionar `status` ao `GET /api/esteira-revisao`, aplicar antes de `LIMIT/OFFSET` e ajustar `total`; o modelo envia o status ativo
- [x] 2.3 Testar `status=Publicado` em página > 1, com e sem vínculo, e atualizar `docs/16`
- [x] 2.4 Limpar `dataLiberacao` ao remover a Release no formulário; validar data herdada na aprovação e cobrir os cenários em testes/E2E
- [x] 2.5 Atualizar `docs/15` e o delta de `lancar-chamadas`; verificar preservação de data existente e erro `409` para data herdada inválida

## 3. Formulário remoto e PDF

- [x] 3.1 Adicionar estado remoto dos cinco catálogos ao modelo de Chamadas, com busca/debounce, `loadMore` e seleção preservada; testar unidade dos helpers
- [x] 3.2 Migrar os selects do `Formulario.vue` para o modo remoto e remover o carregamento do catálogo completo na abertura; verificar criação e edição
- [x] 3.3 Aplicar limite de 5.000 no JSON do PDF, bloquear a geração acima do teto com mensagem e manter CSV em streaming; atualizar `docs/15`
- [x] 3.4 Adicionar E2E de formulário remoto (busca, seleção, edição) e de PDF acima/abaixo do limite

## 4. Importação de Chamadas em lote

- [x] 4.1 Usar `inserirEmLotes` para `entregas_itens` em blocos e verificar rollback em conflito
- [x] 4.2 Inserir vínculos de softwares em multi-row e trocar a checagem de duplicidade por `WHERE chamada IN (...)`; medir round-trips
- [x] 4.3 Adicionar teste de importação em lote e E2E de 500 linhas; atualizar `docs/02`

## 5. Integração e verificação

- [x] 5.1 Executar migration/boot não aplicável (sem schema) e validar os fluxos de Painel, Esteira, formulário, PDF e importação em dev
- [x] 5.2 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; registrar os gates
- [x] 5.3 Rodar `openspec validate "otimizar-painel-e-importacao-chamadas" --type change --strict` e `openspec validate --specs`; revisar o diff final
