# Tasks

## 1. Banco e reconciliação

- [x] 1.1 Criar `33_rl06_3_publicado_em.sql` adicionando `publicado_em DATETIME(6) NULL` em `release_week`, `manuais_mensal`, `projetos_escopo` e `entregas_itens`; verificar aplicação idempotente em banco de teste.
- [x] 1.2 Criar os índices de leitura pública (`status`/`arquivada`/`publicado_em` e `status`/`publicado_em` em chamadas) com rollback documentado; verificar presença em `information_schema`.
- [x] 1.3 Backfillar registros `Publicado` a partir de `data_publicacao`/`data_liberacao` (ou data de criação quando ausente), preservando datas futuras; verificar RW-52 e a chamada 0000545878.
- [x] 1.4 Adicionar teste/consulta de reconciliação que confirme colunas, índices e carimbos futuros/passados; verificar que registros fora de `Publicado` permanecem nulos.
- [x] 1.5 Atualizar `docs/bd/01` com a migration 33, colunas, índices e rollback; verificar contra o SQL.

## 2. Transições de publicação

- [x] 2.1 Implementar um helper de cálculo de `publicado_em` (data futura → data agendada; data passada/ausente → agora) e testá-lo com datas futura/passada/nula.
- [x] 2.2 Gravar/limpar `publicado_em` na criação, edição e publicação de Release Week, incluindo recálculo quando a data muda com status `Publicado`; verificar por teste de integração.
- [x] 2.3 Aplicar a mesma regra em Manuais e Escopo, preservando suas datas históricas; verificar criação, edição, publicar e reabrir.
- [x] 2.4 Atualizar `transicionarChamada` para gravar/limpar `publicado_em` e recalcular ao entrar em `Publicado`; verificar aprovar, publicar, recusar e reabrir.
- [x] 2.5 Atualizar `reconciliarFilhasPublicacao` para setar/limpar o carimbo das filhas na mesma transação; verificar cascata de publicação e reversão.
- [x] 2.6 Adicionar testes de transição/cascata cobrindo entrada, saída, reentrada e concorrência; verificar que o histórico continua sendo gravado.
- [x] 2.7 Atualizar `docs/12`–`15` com a regra de `publicado_em` e a diferença entre status editorial e publicação efetiva; verificar contra o código.

## 3. Gate de visibilidade e mídia

- [x] 3.1 Adicionar `publicadoEm` ao `ContextoVinculo`/modelo de chamada e mapear o campo nas consultas administrativas; verificar que o campo aparece no detalhe/lista sem quebrar contratos existentes.
- [x] 3.2 Atualizar `contextoPublicado`/`itemVisivelNoPortal` para exigir `publicadoEm <= agora`, além de status publicado e pai não arquivado; testar futuro, passado e nulo.
- [x] 3.3 Atualizar `sqlVinculoPublicado` com `publicado_em IS NOT NULL AND publicado_em <= NOW()` nos três EXISTS; testar consultas com pais futuros/passados.
- [x] 3.4 Atualizar a rota de mídia para usar `e.publicado_em` e os carimbos dos pais, removendo a dependência exclusiva de `data_liberacao`/`data_publicacao`; testar anônimo, admin e pai arquivado.
- [x] 3.5 Atualizar/criar testes de visibilidade e mídia para publicação futura, efetiva e saída de `Publicado`; verificar que conteúdo administrativo em revisão continua acessível.
- [x] 3.6 Atualizar `AGENTS.md` e os docs de visibilidade/mídia com o gate `publicado_em`; verificar que não há mais regra duplicada de data nas leituras públicas.

## 4. Integração e fechamento

- [x] 4.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; registrar o número de testes e corrigir falhas.
- [x] 4.2 Executar E2E/consultas dos fluxos: publicar conteúdo futuro, publicar conteúdo passado, reabrir, cascata pai → filhas e mídia anônima; limpar dados de teste.
- [x] 4.3 Executar `openspec validate "corrigir-publicado-em" --type change --strict` e `openspec validate --specs`; verificar ambos válidos.
- [x] 4.4 Revisar `git status`/`git diff --stat` e confirmar que só a migration 33 foi adicionada, sem segredos ou artefatos de teste.
