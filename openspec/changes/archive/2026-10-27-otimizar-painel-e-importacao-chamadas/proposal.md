# Proposal

## Why

O RL06-2 ainda tem custos de leitura e escrita que crescem com o histórico: o Painel Executivo projeta `e.*` e repete agregações sem cache; o board da Esteira volta a carregar todas as mídias de cada card; o formulário de Chamadas baixa o catálogo completo; o PDF baixa todas as linhas filtradas; e a importação de Chamadas faz round-trips por linha. Também restam dois ajustes de contrato: o filtro de status da Esteira é aplicado só na página carregada e a Data de liberação não é limpa ao remover a Release.

## What Changes

- **Painel (M-10):** projetar apenas as colunas usadas no fluxo, cachear o agregado e `anosDasPublicacoes`, com invalidação por prefixo.
- **Esteira (M-11/M-02):** o board envia apenas contagem/capa de mídias; o detalhe continua completo; o filtro de status passa a ser aplicado na API antes da paginação.
- **Formulário (M-11):** os cinco selects passam a usar `/api/lancar-chamadas/opcoes?tipo=...&q=...`, com loading, busca, “carregar mais” e labels preservados na edição.
- **PDF (M-11):** impor teto de 5.000 linhas no `download=1` JSON; acima disso, a tela pede refinar filtros. CSV continua streaming.
- **Importação (B-07):** inserir chamadas e softwares em lote com `inserirEmLotes`, mantendo transação única e rollback total.
- **Data de liberação (M-03):** limpar a data ao remover a Release; validar datas herdadas de Manual/Escopo na aprovação.
- Sem mudança de schema/migrations; cache em memória e mudanças de API/UI.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `lancar-chamadas`: limite operacional do PDF/JSON e regra de limpeza/validação da Data de liberação.

## Impact

- Servidor: `server/utils/painel-executivo.ts`, `server/utils/cache.ts`, `server/utils/lancar-chamadas.ts`, `server/utils/esteira-revisao.ts`, `server/api/lancar-chamadas/index.get.ts`, `server/api/esteira-revisao/index.get.ts`.
- Cliente: `app/components/lancar-chamadas/{Formulario,Cabecalho,useLancarChamadasModelo}.vue/ts`, `app/components/esteira/{useEsteiraRevisaoModelo,ChamadaCard}.ts/vue`.
- Documentação: `docs/15`, `docs/16`, `docs/17`, `docs/02`, `docs/RL06`.
- Testes: unitários de cache/importação, E2E de board, filtro, formulário, PDF e importação.
