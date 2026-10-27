# Proposal

## Why

O card da Esteira exibe “Sem descrição.” mesmo quando a chamada possui descrição: o componente lê `item.descricaoCompleta`, mas `listarChamadasParaEsteira` usa `COLUNAS_LISTA`, que não projeta `entregas_itens.descricao_completa`. A spec de `esteira-revisao` já exige o resumo da descrição no card; é uma correção de implementação.

## What Changes

- Criar uma projeção específica do board (`COLUNAS_ESTEIRA`) incluindo `e.descricao_completa` em texto puro.
- Usar essa projeção somente em `listarChamadasParaEsteira`.
- Manter `listarChamadasPaginadas` e a exportação PDF/JSON sem o campo extra, preservando seus payloads.
- Manter o card e o fallback “Sem descrição.” inalterados; o fallback só aparece quando o campo está realmente vazio.
- Adicionar teste/E2E do board com descrição e da busca por termo presente nela.
- Sem alteração de schema, migration, HTML ou regra de negócio.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. A spec de `esteira-revisao` já exige projeção enxuta com o resumo da descrição. O change declara `skip_specs: true`.

## Impact

- Servidor: `server/utils/lancar-chamadas.ts`.
- Cliente: nenhum; `app/components/esteira/ChamadaCard.vue` já lê `descricaoCompleta`.
- Testes: board/descrição e busca.
- Sem banco/migrations.
