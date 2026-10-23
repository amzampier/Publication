# Tasks

## 1. Migração 31 e reconciliação de schema

- [x] 1.1 Criar `server/migration/31_rl06_2_reconciliacao.sql` recriando `v_release_itens`, `v_projeto_itens`, `v_manual_itens` e `manuais` sem `situacao` e com `arquivada` onde aplicável; verificar com `SELECT 1 FROM <view>` que as quatro views respondem sem `ER_VIEW_INVALID`.
- [x] 1.2 Incluir na migration a limpeza `UPDATE release_week SET data_aprovacao = NULL WHERE status <> 'Publicado'` e os índices de `entregas_itens(data_lancamento)`/`(data_liberacao)`, idempotentes; verificar `_migrations` com a 31 aplicada e `SHOW INDEX` nos dois índices.
- [x] 1.3 Incluir na migration as colunas geradas `chave_ativa` e os novos índices únicos de Release/Manual/Escopo (um ativo, vários arquivados), com rollback documentado; verificar em transação que recriar um ciclo arquivado funciona e que duplicar um ativo continua `409`.
- [x] 1.4 Atualizar `docs/02` (§4), `docs/bd/01` e `docs/bd/02` com a migration 31, as views, os índices, a limpeza de carimbo e a nova regra de unicidade; verificar que os nomes/ordens citados existem no arquivo e no banco.
- [x] 1.5 Adicionar teste de integração/SQL que aplique a 31 em base de teste e valide views, índices e recriação após arquivamento; verificar que a suíte passa e que o rollback documentado é executável.

## 2. Lançar as Chamadas e Esteira

- [x] 2.1 Aplicar `ehSegundaFeira` (ou próximo dia útil, se a regra da Release for compartilhada) em `validarChamada` para Data de lançamento/liberação e ajustar os testes; verificar que datas de terça/quinta são recusadas com `400` e segunda aceita.
- [x] 2.2 Preencher a Data de liberação ao selecionar a Release (editável) no formulário e herdar no create quando vazia; verificar que o rascunho e a API devolvem a data da release e que a edição a preserva.
- [x] 2.3 Implementar `GET /api/lancar-chamadas` paginado (`pagina`, `porPagina`, `{ itens, total, pagina, porPagina }`) com projeção enxuta e `GET /api/lancar-chamadas/:id` com o registro completo; verificar `LIMIT/OFFSET`, clamp, `404` e ausência de HTML/mídias na listagem.
- [x] 2.4 Atualizar `useLancarChamadasModelo`/tabela para consumir a paginação e buscar o detalhe sob demanda; verificar troca de página, busca, KPIs e abertura de Detalhes/Editar.
- [x] 2.5 Corrigir o filtro `status=Publicado` da Esteira para incluir itens fora do ciclo quando o status é explícito, e o histórico de id inexistente para `404`; verificar board com filtro e requisição HTTP.
- [x] 2.6 Adicionar projeção lean e cache de opções no board, com invalidação nas escritas de chamadas; verificar que a resposta não traz HTML/mídias completas e que as consultas de catálogo não se repetem dentro do TTL.
- [x] 2.7 Adicionar testes dos validadores, da paginação/detalhe, do filtro de publicados e do 404 do histórico; verificar a suíte.
- [x] 2.8 Atualizar `docs/12`, `docs/13`, `docs/14`, `docs/15` e `docs/16` para cascata, paginação/detalhe, segunda-feira, data herdada, filtro de publicados, 404 e projeção; verificar os contratos citados contra as rotas.

## 3. Painel Executivo

- [x] 3.1 Ajustar o KPI “% do fluxo concluído” para contar `Publicado` no numerador, mantendo o universo da spec, e atualizar `tests/painel-executivo.test.ts`; verificar que um ciclo 100% publicado resulta em 100%.
- [x] 3.2 Substituir a materialização de `itensFluxo` por agregação SQL com `SUM(CASE)`/`GROUP BY`, usar os índices de data e cachear `anosDisponiveis`; verificar `EXPLAIN` sem full scan nas janelas e números iguais aos atuais.
- [x] 3.3 Adicionar teste de contrato do Painel para o KPI corrigido e para a ausência de materialização; verificar a suíte e a resposta HTTP.
- [x] 3.4 Atualizar `docs/17` e `docs/16` para a regra do KPI (publicados contam como concluídos) e a agregação indexada; verificar que não restam fórmulas divergentes.

## 4. Uploads, segurança e hierarquia

- [x] 4.1 Validar destino e permissão antes de consumir o multipart e aplicar limite de corpo efetivo (inclusive `chunked`); verificar `403` sem parse e `413` para corpo acima do teto.
- [x] 4.2 Incluir `logos` e o `413` na spec/docs de uploads e cobrir a permissão `parceiros`/`alterar`; verificar upload válido de logo e negação sem permissão.
- [x] 4.3 Adicionar `sharp`, gerar a variante `-320.webp` no upload de chamadas com fallback, servir a variante pela rota autorizada, e usar `srcset`/`loading=lazy`/cache na galeria; verificar upload, `200` da variante, fallback e ausência de erro no build.
- [x] 4.4 Implementar `ipConfiavel` (IP/CIDR, IPv4/IPv6) e usá-lo em `ipDoCliente`/rate limit; verificar que XFF só é aceito de proxy da lista e que a lista vazia mantém o IP do socket.
- [x] 4.5 Implementar a hierarquia de atribuição de perfil (subconjunto de permissões, ressalva para quem controla perfis) e tests; verificar `403` para perfil superior e `200` para igual/inferior.
- [x] 4.6 Entregar `scripts/db-least-privilege.sql` com usuário DML + EVENT sem `GRANT OPTION` e atualizar `.env.example`/`docs/02`; verificar o script em ambiente de teste e o boot com o usuário restrito.
- [x] 4.7 Aplicar o gate de data (`data_liberacao`/`data_publicacao` ≤ hoje) na visibilidade de mídia e na futura leitura pública; verificar mídia publicada com data futura `404` e data efetiva `200`.
- [x] 4.8 Adicionar testes de upload (permissão/limite/chunked), IP/CIDR, hierarquia e data de visibilidade; verificar a suíte.

## 5. Auditoria

- [x] 5.1 Trocar `entidadeId` de código para UUID nas rotas de escrita de usuários, perfis, release, manuais, escopo, softwares, parceiros e uploads; importações em lote usam `''` com detalhe do lote; verificar amostras no banco.
- [x] 5.2 Atualizar `docs/05` com a cobertura real (59 pontos) e a regra do UUID; verificar a tabela de recursos e os totais.
- [x] 5.3 Adicionar teste/consulta que valide UUIDs em `auditoria.entidade_id` para os principais recursos e detalhes com o código; verificar a suíte/consulta.

## 6. UX, acessibilidade e consistência

- [ ] 6.1 Adicionar `error`/`errorMessage`/`retry` à `UiDataTable` e criar `UiErrorState` para telas sem tabela; ligar os catches das listagens (Softwares, Parceiros, Release, Manuais, Escopo, Chamadas, Esteira, Usuários, Perfis, Auditoria, Configurações, Painel) ao estado de erro; verificar que falha/403 não aparecem como lista vazia.
- [ ] 6.2 Adicionar `salvando` + `:loading`/`:disabled` nos formulários de Softwares, Parceiros, Escopo, Perfis, Permissões, Configurações e Meu Perfil; verificar duplo clique gera uma requisição e restaura no erro.
- [x] 6.3 Criar `shared/status-badge.ts` e usar o mesmo mapa no Painel e nos módulos; adicionar teste dos mapas; verificar o mesmo status com a mesma variante em telas diferentes.
- [x] 6.4 Corrigir a paginação responsiva (`flex-wrap`/rolagem interna) em `UiDataTable`/`UiPagination`; verificar 320/375 px sem corte/overflow.
- [ ] 6.5 Fazer `Escape` devolver o foco ao gatilho no header e transformar o drawer mobile em diálogo (`role=dialog`, `aria-modal`, trap, backdrop, Escape); verificar por teclado e SSR.
- [x] 6.6 Dar nome acessível à busca da `UiDataTable`/buscas próprias e associar o label ao editor `UiRichText` (`id`/`aria-labelledby`); verificar por inspeção/SSR e leitor de tela quando possível.
- [ ] 6.7 Ajustar contraste de texto de apoio (`slate-500/600`), mono/tabular em códigos/datas, “Limpar Filtros” apenas no rascunho, textos de “Recusar/Convite” e o SQL bruto da retenção; verificar visualmente e por inspeção.
- [x] 6.8 Atualizar `docs/01`, `docs/03`, `docs/10`, `docs/11`, `docs/17`, `AGENTS.md` e a vitrine `/design` para contagens, seções, variantes canônicas e estados de erro; verificar que o doc não contradiz o kit.

## 7. Contratos e documentação restante

- [x] 7.1 Atualizar `autorizacao-rbac` (catálogo com 11 módulos/rotas novas) e `docs/07`; verificar `openspec validate --specs` e a matriz 92/67/41/14.
- [ ] 7.2 Atualizar `docs/02` (estrutura real, convite com `convite`/`alterar`, status `Publicar/Publicado`, endpoints/Painel, contagem de componentes, `.can()`), `docs/08` e `.env.example`; verificar os trechos contra o código.
- [x] 7.3 Atualizar `docs/10`/`docs/11` (RBAC de UI/exportação), `docs/13` (totais RBAC), `docs/bd/02` (seed 92/67/41/14) e a spec de `softwares` (`:codigo`, Código, 409, exportação); verificar números e rotas.
- [ ] 7.4 Atualizar a spec de `gestao-usuarios` (sem dados de demonstração) e `docs/09`/`docs/06` quando aplicável; verificar que nenhum texto promete demo.
- [ ] 7.5 Revisar `docs/01`/`AGENTS`/`docs/bd/01` contra a implementação e registrar eventuais lacunas como tarefa específica, não como “explorar depois”.

## 8. Integração final

- [x] 8.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; verificar todos verdes e registrar o número de testes.
- [x] 8.2 Executar `openspec validate "corrigir-pendencias-rl06-2" --type change --strict` e `openspec validate --specs`; verificar ambos válidos.
- [ ] 8.3 Executar E2E dos itens M-01…M-05, M-10…M-12, M-13/M-14, M-17/M-18, B-02/B-03, B-05 e da hierarquia; verificar PASS e limpar dados de teste.
- [x] 8.4 Revisar o diff final, `git status` e `git diff --stat`; verificar que nenhum segredo/teste ficou no repositório e que a migration 31 é a única nova.