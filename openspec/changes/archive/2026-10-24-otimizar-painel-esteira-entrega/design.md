# Design

## Context

O Painel agrega 8 blocos com 6 chamadas `pode()` concorrentes; a Esteira monta o board sem `LIMIT`; o CSV pagina por `OFFSET`; e a importação de Chamadas grava linha a linha. Ver `proposal.md - Why`.

## Goals / Non-Goals

**Goals:** reduzir queries/fanout, estabilizar latência em N=20 com 5 mil chamadas, manter contratos e contagens, garantir streaming real.

**Non-Goals:** mudar schema, redesenhar o Painel/CSV ou introduzir cache distribuído.

## Decisions

1. **RBAC single-flight**: memoizar a promessa da matriz em `event.context` (`__permissoesPromise`) e derivar as 6 permissões de uma única leitura; alternativa descartada: cache global por perfil (invalidaria em mudanças de matriz).
2. **`itensFluxo`**: substituir os 21 `EXISTS` correlacionados por subquery única/LEFT JOIN com `status`, `arquivada` e `publicado_em`, e criar índice covering avaliado por `EXPLAIN`; cachear o agregado do fluxo com invalidação nas escritas.
3. **Esteira paginada**: `GET /api/esteira-revisao` aceita `pagina`/`porPagina` e devolve `{ itens, total, ... }`; o board mantém filtros e progresso sobre o conjunto filtrado. Alternativa descartada: keyset (o board ordena por múltiplos estágios).
4. **CSV keyset**: cada listagem usa cursor estável (`chamada`, `(data_hora, id)`, `id`) e calcula `COUNT`/KPIs uma vez antes do laço; lotes de 200 sem repetir contagem.
5. **Importação em lote**: `inserirEmLotes` para itens e upsert multi-row para softwares, dentro da mesma transação; rollback integral em falha.
6. **Entrega**: `Cache-Control: public, max-age=3600, must-revalidate` para identidade; compressão dinâmica no Nitro (ou proxy documentado); deduplicar `Vary`; fallback de miniatura no cliente/rota.
7. **Pool**: ler `process.env.DB_POOL_LIMIT` em runtime (além de `NUXT_*`) e documentar a precedência.

## Risks / Trade-offs

- [Contagens divergentes no Painel] → comparar números antes/depois e cobrir com teste de contrato.
- [Keyset com ordenação/filtros] → cursor composto e teste com empates.
- [Paginação da Esteira muda a UI] → preservar filtros/KPIs e estados vazios.
- [Compressão dinâmica consome CPU] → medir e permitir desligar por env/proxy.

## Migration Plan

1. Medir baseline (queries/p95) e implementar por bloco.
2. Rodar testes de contrato e `EXPLAIN`; comparar números.
3. Validar preview com 5 mil chamadas sintéticas (transação revertida).
4. Rollback: reverter o commit; sem mudança de schema.