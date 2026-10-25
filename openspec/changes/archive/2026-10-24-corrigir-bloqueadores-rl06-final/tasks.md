# Tasks

## 1. Esteira e datas do banco

- [x] 1.1 Criar normalizador de data (Date/string) e usá-lo em `server/utils/esteira-revisao.ts` e `server/utils/visibilidade-publica.ts`; verificar board/detalhe 200 com `publicado_em` preenchido e com nulo.
- [x] 1.2 Adicionar teste de regressão com `publicado_em` retornado como `Date` (mysql2) e com string; verificar que nenhum item é perdido e que `publicadoEm` sai em ISO.
- [x] 1.3 Rodar E2E da Esteira com `RW-52/2026` no baseline; verificar listagem, detalhe, aprovar/recusar/publicar e filtro `Publicado`.

## 2. Hierarquia de perfil

- [x] 2.1 Aplicar `validarHierarquiaPerfil` em `criarUsuario`, `atualizarUsuario` e `criarConvite` (incluindo conta existente); verificar `403` sem gravar.
- [x] 2.2 Adicionar testes por perfil (Administrador, intermediário, Leitor) nos três caminhos; verificar criação/promoção/convite com perfil superior negados.
- [x] 2.3 Rodar E2E com perfil customizado e confirmar que nenhuma conta Administrador é criada/promovida.

## 3. Busca FULLTEXT

- [x] 3.1 Sanitizar tokens (operadores booleanos, hífens, acentos) e separar FULLTEXT de prefixo indexável; verificar e-mail completo, código com hífen, sufixo e substrings em software/parceiro/tags/release.
- [x] 3.2 Garantir que termos hostis (`---`, `-a-`, `' OR 1=1 --`) retornem 200/0 ou 400, nunca 500; verificar os três módulos.
- [x] 3.3 Ajustar `EXPLAIN` para usar FULLTEXT quando aplicável e prefixo apenas em colunas indexáveis; registrar planos.
- [x] 3.4 Adicionar testes de busca (texto, e-mail, código, curto, acento, hostil) e atualizar a spec/docs com a semântica exata.

## 4. Saturação do pool

- [x] 4.1 Mapear `ehSaturacaoDePool` em error handler global/middleware para `503` + `Retry-After`, cobrindo sessão, RBAC e listagens.
- [x] 4.2 Testar com `NUXT_DB_POOL_LIMIT=2`/fila 1 em N=3/5/10/20; verificar 503 (não 500) em Painel, Chamadas, Auditoria e Esteira.
- [x] 4.3 Documentar o contrato e o teste de carga em `docs/18`.

## 5. Integridade de publicação e usuários

- [x] 5.1 Preservar `publicado_em` em edição de conteúdo já `Publicado` (Release/Manual/Escopo); verificar que só a transição grava o carimbo.
- [x] 5.2 Incluir `criado_em`/`atualizado_em` na projeção da listagem e da exportação de usuários; verificar `dataCadastro`/`atualizadoEm` preenchidos.
- [x] 5.3 Adicionar testes de regressão para os dois itens.

## 6. Upload e banco

- [x] 6.1 Exigir `pasta` na query e remover a autorização tardia pelo corpo; verificar `400` sem query e `403` sem permissão antes do parse.
- [x] 6.2 Aplicar `scripts/db-least-privilege.sql` em ambiente de teste; validar boot, migrations, DML e expurgo com `publications_app`.
- [x] 6.3 Documentar o procedimento e o rollback em `docs/18`/`docs/02`; confirmar `SHOW GRANTS` sem `GRANT OPTION`.

## 7. Resíduos de QA e fechamento

- [x] 7.1 Fazer backup e arquivar/despublicar `RW-52/2026` e `0000545878` (e mídias) para não publicarem em 28/12/2026; registrar a decisão.
- [x] 7.2 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; corrigir falhas.
- [x] 7.3 Executar `openspec validate "corrigir-bloqueadores-rl06-final" --type change --strict` e `openspec validate --specs`.
- [x] 7.4 Revisar `git status`/`git diff --stat` e confirmar ausência de segredos/artefatos.

## 8. Achados adicionais da reauditoria

- [x] 8.1 Usar NOW(6)/microssegundos no gate público para eliminar a janela de ~1s em que a mídia recém-publicada responde 404.
- [x] 8.2 Normalizar `auditoria.entidade_id` para UUID (código em `detalhes`) e cobrir com consulta/teste.
- [x] 8.3 Decidir e corrigir as chamadas legadas com `data_lancamento` fora de segunda-feira (dados de QA), com backup.
- [x] 8.4 Centralizar o tratamento de erros para não expor stack/mensagem do banco em nenhum ambiente.