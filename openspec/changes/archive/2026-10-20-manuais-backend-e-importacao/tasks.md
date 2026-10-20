# Tasks

## 1. Domínio compartilhado e backend

- [x] 1.1 Mover os tipos e regras puras de `app/components/manuais/validadores.ts` para `shared/utils/manuais.ts` (validação, `gerarCodigo`, `prefillClone`, guarda de exclusão, KPIs, filtros, `ehDataIso`, `hojeIso`) e deixar o arquivo do app reexportando `#shared/utils/manuais`; verificar `npm run typecheck`
- [x] 1.2 Atualizar `tests/manuais-validadores.test.ts` para importar do reexport/shared e cobrir `ehDataIso` e datas históricas; verificar `npm run test`
- [x] 1.3 Criar `server/utils/manuais.ts` com `listarManuais`, `buscarManual`, `listarItensManual`, `validarEntradaManual`, `criarManual`, `atualizarManual`, `publicarManual`, `arquivarManual`, `excluirManual` e `importarManuais` (joins de autor/revisor, `itensCount`, código `MAN-XX/AAAA`, `1062 → 409`, guarda de itens/anexos, datas históricas e `COALESCE` no publicar); verificar `npm run typecheck`
- [x] 1.4 Cobrir no `tests/manuais-validadores.test.ts` a guarda de exclusão ampliada (arquivado, itens e anexos) e a preservação de `data_publicacao`; verificar `npm run test`

## 2. API e auditoria

- [x] 2.1 Criar `server/api/manuais/index.get.ts` (`visualizar`; `?exportar=1` → `exportar`) e `server/api/manuais/[id]/itens/index.get.ts` (`visualizar_itens`, 404 para id inexistente); verificar `npm run typecheck`
- [x] 2.2 Criar `server/api/manuais/index.post.ts` (`criar`, 201, auditoria Inclusão) e `server/api/manuais/[id]/index.put.ts` (`alterar`, 400/404/409, auditoria Alteração); verificar `npm run typecheck`
- [x] 2.3 Criar `server/api/manuais/[id]/publicar/index.put.ts` (Homologação), `server/api/manuais/[id]/arquivar/index.put.ts` (Alteração) e `server/api/manuais/[id]/index.delete.ts` (Exclusão, 409 pela guarda); verificar `npm run typecheck`
- [x] 2.4 Criar `server/api/manuais/importar/index.post.ts` (`importar`, transação, auditoria Inclusão com a contagem); verificar `npm run typecheck`
- [x] 2.5 Atualizar `docs/05` (23→29 rotas, mapeamento `manuais` → recurso "Manuais Mensais") e `docs/02` (endpoints de apoio e remoção do "sem UI/API" para Manuais); verificar que as rotas citadas existem nos caminhos documentados

## 3. Frontend API-backed

- [x] 3.1 Trocar o dataset de `useManuaisModelo` por `useApiFetch` (`carregarManuais`, `carregando`/`carregado`, `adicionar`/`atualizar`/`publicar`/`arquivar`/`excluir`, itens lazy, `itensCount` da API e `importar` recarregando a lista); verificar a página com dados persistidos e o F5 mantendo o que foi gravado
- [x] 3.2 Ajustar `Formulario.vue` para `await` nas escritas, mapear `400/409` em `data.erros` (`titulo`/`mes`/`ano`), focar o primeiro erro e manter o código/timestamps/publicação somente leitura; verificar criar, editar e conflito de mês/ano
- [x] 3.3 Ajustar `admin/manuais.vue` para exibir `UiLoading` na carga, tratar falha com toast, tornar publicar/arquivar/excluir assíncronos e usar `linha.itensCount` na guarda visual de exclusão; verificar os fluxos na tela
- [x] 3.4 Ajustar `Itens.vue` para buscar `GET /api/manuais/:id/itens`, manter o cache e usar `carregarItens(id, true)` no "Tentar novamente"; verificar com manual com itens, sem itens e com erro
- [x] 3.5 Ajustar `Cabecalho.vue` para validar `GET /api/manuais?exportar=1` antes de gerar PDF/CSV e tratar falha da guarda; verificar os downloads do conjunto filtrado
- [x] 3.6 Garantir que `Tabela.vue` usa `linha.itensCount` para o botão de exclusão e mantém a flag de itens somente com `visualizar_itens`; verificar com perfis/permissões diferentes

## 4. Importação histórica

- [x] 4.1 Criar `app/components/manuais/lerPlanilhaManuais.ts` com `COLUNAS_MODELO` (Título, Mês, Ano, Descrição, Status, Data de Criação, Data de Publicação, Destaque do mês, Destaque da semana), normalização de datas (Excel, `dd/mm/aaaa`, `AAAA-MM-DD`) e `classificarLinhasManuais` (`pronto`/`já cadastrado`/`repetido`/`inválida`, publicação obrigatória quando `Publicado`); verificar `npm run typecheck`
- [x] 4.2 Criar `tests/manuais-import-parser.test.ts` cobrindo datas, status, publicação obrigatória, duplicidade no arquivo, mês já cadastrado e destaques; verificar `npm run test`
- [x] 4.3 Criar `docs/modelos/modelo-importacao-manuais.xlsx` com os cabeçalhos e exemplos do modelo; verificar a abertura do arquivo e os nomes das colunas
- [x] 4.4 Criar `app/components/manuais/Importar.vue` (upload `.xlsx`, pré-visualização, seleção das linhas prontas, contagem e commit via `POST /api/manuais/importar`); verificar arquivo válido, inválido e conflito
- [x] 4.5 Ligar o ícone de importação da `Tabela` ao `ManuaisImportar` na página (`importarAberto`), substituindo o toast de affordance; verificar abertura, cancelamento e recarga da lista após importar

## 5. Documentação

- [x] 5.1 Atualizar `docs/13 - Módulo de Manuais Mensais.md` para a fase backend (rotas, regras de código/autor/datas, guarda de exclusão, itens sob demanda, auditoria, importação histórica e limitação do autor = sessão); verificar que os caminhos citados existem
- [x] 5.2 Revisar `docs/13`/`docs/02`/`docs/05` contra o código final e confirmar que não restou "dataset em memória", "affordance" ou "sem UI/API" para Manuais

## 6. Integração e gates

- [x] 6.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar os quatro gates verdes
- [x] 6.2 Executar E2E/API com sessão: `GET` 200, `POST` válido 201 com código, duplicidade 409, edição/regeneração de código, publicar (data histórica preservada), arquivar, exclusão 409 e 200, itens, importação válida/inválida/conflito e `403` sem permissão
- [x] 6.3 Conferir manualmente em `/admin/manuais`: carga da API, criar, editar, clonar, publicar, arquivar, excluir, itens, importação histórica e F5 preservando os dados (requer credenciais válidas)
- [x] 6.4 Conferir regressão nas telas que usam `UiBadge`/`UiDataTable` e nas rotas `/design`, `/admin/perfis-acesso`, `/admin/release-week`, Softwares, Parceiros e Usuários; verificar HTTP 200
- [x] 6.5 Rodar `openspec validate "manuais-backend-e-importacao"` e confirmar a change válida
