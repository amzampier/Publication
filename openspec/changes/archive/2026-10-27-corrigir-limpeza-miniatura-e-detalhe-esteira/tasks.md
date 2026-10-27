# Tasks

## 1. Limpeza de miniatura

- [x] 1.1 Incluir a variante legada `radical-320.webp` na remoção de imagens, preservando a checagem de referência
- [x] 1.2 Cobrir a limpeza com teste e confirmar em E2E que original, miniatura nova e miniatura legada são removidos

## 2. Detalhe da Esteira

- [x] 2.1 Buscar `GET /api/esteira-revisao/:id` ao abrir a inspeção e usar o item completo
- [x] 2.2 Atualizar o detalhe após decisões e renomear o rótulo para “Descrição do Resumo”
- [x] 2.3 Atualizar `docs/16` e validar descrição/solução em E2E

## 3. Verificação final

- [x] 3.1 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`
- [x] 3.2 Rodar `openspec validate "corrigir-limpeza-miniatura-e-detalhe-esteira" --type change --strict` e `openspec validate --specs`
