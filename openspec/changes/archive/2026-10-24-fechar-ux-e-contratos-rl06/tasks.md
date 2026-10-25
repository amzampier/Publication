# Tasks

## 1. UiDataTable e agrupamento

- [x] 1.1 Fazer a ordenação no modo servidor emitir/refazer a consulta (ou desabilitar `sortable` com justificativa); verificar `aria-sort` e ordem real.
- [x] 1.2 Renderizar estado vazio e estado de erro também no ramo agrupado; verificar base vazia, filtro sem resultado e falha com retry.
- [x] 1.3 Tornar os cabeçalhos de grupo focáveis/acionáveis (`role`, `tabindex`, `aria-expanded`, Enter/Espaço) e nomear "Remover agrupamento" por coluna.
- [x] 1.4 Formatar a data do cabeçalho de grupo em pt-BR e informar "nesta página" na contagem do modo servidor.
- [x] 1.5 Expor o nome acessível da busca como prop configurável e usá-lo nas telas; verificar `<input>` real.
- [x] 1.6 Cobrir com testes de unidade/DOM (agrupamento, vazio, teclado, ordenação) e validar em Chrome headless 320/375.

## 2. Shell, filtros e feedback

- [x] 2.1 Fechar o drawer mobile ao selecionar um item de navegação; verificar rota, backdrop e foco.
- [x] 2.2 Em Auditoria e Usuários, "Limpar Filtros" limpa apenas o rascunho; "Cancelar" descarta e "Aplicar" publica.
- [x] 2.3 Adicionar `salvando`/`loading` nas confirmações de aprovar/desaprovar/recusar/excluir de Chamadas.
- [x] 2.4 Exibir loading na recarga de página/busca/filtros server-side da listagem de Chamadas.
- [x] 2.5 Substituir `text-slate-400` por `slate-500/600` em textos de apoio restantes; verificar contraste AA.

## 3. Autocomplete de e-mails

- [x] 3.1 Escapar `%`/`_` e buscar prefixo **ou** conteúdo em e-mail/nome; verificar `q=teo`, `q=%%`, `q=_%`.
- [x] 3.2 Remover o handler órfão `server/api/usuarios/emails/index.get.ts` e alinhar `docs/06`; verificar uma única rota ativa.
- [x] 3.3 Adicionar testes de busca literal, curinga e paginação.

## 4. Documentação e contratos

- [x] 4.1 `docs/qa/00`: descrever middlewares reais, CSRF e rate limit persistente; `docs/qa/03`: remover exigência de `USE`.
- [x] 4.2 `docs/15`: reconciliar segunda-feira, Data de liberação editável/herdada e CSV `download=1&formato=csv`.
- [x] 4.3 `docs/05`: completar a tabela para 59 pontos (Parceiros, Release Week, Esteira) e o CSV em fluxo.
- [x] 4.4 `docs/bd/01`: cobrir migrations 32–35 (triggers, `publicado_em`, rate limit, FULLTEXT) sem duplicar a 34.
- [x] 4.5 `docs/02`: árvore com `server/routes`/middlewares, §3.4 com rate limit persistente/CSRF/headers e §4.2/§4.3 com `DELIMITER`/expurgo.
- [x] 4.6 `docs/01`/`AGENTS`/vitrine: 39 componentes, seções de `UiReportMenu`, `UiErrorState` e `UiRichTextLazy`, mapa de status e contraste.
- [x] 4.7 `docs/17`: separar a fórmula do KPI do Painel da regra da Esteira; `docs/07`: remover itens "sem rota"; `docs/06`: rota de e-mails.
- [x] 4.8 `docs/18`: adicionar comando + saída esperada por item (HTTPS/proxy, headers, migrations 1–35, backup/restore, e-mail, pool, compressão/CDN, carga, rollback).
- [x] 4.9 Specs: corrigir `softwares` (`DELETE /:codigo`), Purpose de `uploads` e catálogo RBAC (`GET /api/lancar-chamadas/:id`); validar `openspec validate --specs`.
- [x] 4.10 Remover resíduos de "4 tipos" de auditoria e `n/99`/`MATRIZ_SEED`; revisar docs/03 e docs/05.

## 5. Fechamento

- [x] 5.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; corrigir falhas.
- [x] 5.2 Executar `openspec validate "fechar-ux-e-contratos-rl06" --type change --strict` e `openspec validate --specs`.
- [x] 5.3 Revisar `git status`/`git diff --stat` e confirmar ausência de segredos/artefatos.

## 6. Achados adicionais

- [x] 6.1 Incluir affordance "Clique para expandir" no 3º nível do agrupamento.
- [x] 6.2 Checar permissão antes de validar q no autocomplete e documentar a ordem.
- [x] 6.3 Corrigir docs/qa/02 (Bearer vs cookie) e docs/06.
- [x] 6.4 Atualizar contagens do AGENTS (27 seções) e docs/03.
