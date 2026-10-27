# Tasks

## 1. Dados da galeria

- [x] 1.1 Carregar `carregarMidiasPorItem` em `listarChamadasParaEsteira` e passar as mídias para `montarChamada`; verificar que `GET /api/esteira-revisao` devolve `imagens` preenchido
- [x] 1.2 Usar `urlMiniatura` na grade e nas miniaturas do `Detalhe.vue` da Esteira, com fallback ao original; verificar galeria e acessibilidade
- [x] 1.3 Remover também a variante `-320.webp` ao excluir/editar imagens, evitando órfãos; verificar no E2E

## 2. Documentação e verificação

- [x] 2.1 Documentar em `docs/15`/`docs/16` que o upload gera original + `-320.webp` e que o detalhe da Esteira usa a variante reduzida
- [x] 2.2 Validar com uma chamada de teste: upload, board, detalhe e galeria; remover a chamada de teste
- [x] 2.3 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; revisar o diff final (sem schema/migrations nem segredos)
