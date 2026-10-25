# Tasks

## 1. Painel Executivo

- [x] 1.1 Memoizar a matriz RBAC por request e derivar as 6 permissões de uma única leitura; verificar 15 → 10 queries e mesmos `403`/blocos.
- [x] 1.2 Reescrever `itensFluxo` sem os 21 `EXISTS` correlacionados e criar/avaliar índice covering; verificar `EXPLAIN` sem full scan e números iguais.
- [x] 1.3 Cachear `anosDisponiveis` com invalidação em escrita; verificar seletor e custo.
- [x] 1.4 Medir p50/p95 e N=10/20 com 5 mil chamadas; registrar antes/depois.

## 2. Esteira

- [x] 2.1 Paginar `GET /api/esteira-revisao` (`pagina`/`porPagina`, `{ itens, total }`) mantendo filtros, progresso e RBAC.
- [x] 2.2 Ajustar o modelo/UI para consumir a página; verificar board, filtros, contagens e estados vazios.
- [x] 2.3 Remover `existentesParaValidacao()` e validar unicidade por `WHERE chamada = ?`/UK + `1062`; verificar create/edição e concorrência.
- [x] 2.4 Medir payload/tempo do board com 5 mil chamadas; verificar ausência de materialização integral.

## 3. Exportação CSV

- [x] 3.1 Trocar `OFFSET` por keyset/cursor nas três exportações; verificar ordem estável e ausência de duplicados/omissos.
- [x] 3.2 Calcular `COUNT`/KPIs uma vez por exportação e remover do laço; verificar queries e bytes.
- [x] 3.3 Testar 1, 100, 5.000 e 100.000 linhas (transação revertida) e abort na desconexão.

## 4. Importação e gravação

- [x] 4.1 Usar `inserirEmLotes` na importação de Chamadas e upsert multi-row de softwares, mantendo a transação única.
- [x] 4.2 Testar 500 linhas e falha induzida no meio; verificar rollback total e tempo.
- [x] 4.3 Atualizar `docs/02`/`docs/15` com o modelo em lote.

## 5. Entrega de assets

- [x] 5.1 Definir `Cache-Control` curto/revalidável para `/uploads/logomarcas|avatares|logos`; verificar preview.
- [x] 5.2 Habilitar compressão dinâmica no Nitro ou documentar o proxy; verificar `Content-Encoding` em HTML/API/CSV e `Vary` único.
- [x] 5.3 Adicionar fallback para miniatura legada ausente (original) na galeria/rota; verificar chamadas antigas.
- [x] 5.4 Alinhar `DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT` em runtime e documentar `NUXT_*`; verificar boot.
- [x] 5.5 Remover a rota morta `GET /api/usuarios/emails/index.get.ts` e alinhar `docs/06` (se não tratada na change 3).

## 6. Fechamento

- [x] 6.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; corrigir falhas.
- [x] 6.2 Executar `openspec validate "otimizar-painel-esteira-entrega" --type change --strict` e `openspec validate --specs`.
- [x] 6.3 Revisar `git status`/`git diff --stat` e confirmar ausência de segredos/artefatos.

## 7. Achados adicionais

- [x] 7.1 Cache: evitar corrida de invalidação (single-flight/versão) e cachear `anosDisponiveis`.
- [ ] 7.2 SSR: reduzir as 3 validações de sessão por página para 1 (contexto do request/single-flight).
- [ ] 7.3 Opções de filtro: endpoint/cache ou corte para não enviar todos os nomes em cada página.
- [x] 7.4 Validar o IP real atrás do proxy (`TRUSTED_PROXIES`) e documentar; garantir buckets por IP no rate limit/auditoria.
- [x] 7.5 Avaliar CSP com nonce/hash e documentar a decisão.
- [x] 7.6 Expurgo de `rate_limit_contadores` por EVENT ou limite de chamadas documentado.