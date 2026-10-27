# Tasks

## 1. A-04 — evidência de carga

- [x] 1.1 Endurecer `scripts/load-painel-esteira.mjs` para falhar (`exit 1`) quando `ok < N` ou houver `503`/`500`, não apenas `500`; verificar com `node --check scripts/load-painel-esteira.mjs` e leitura da condição final
- [x] 1.2 Subir o dev server, aguardar `GET /api/configuracoes/identidade`, definir `ADMIN_EMAIL`/`ADMIN_PASSWORD` apenas no shell e rodar `N=20 node scripts/load-painel-esteira.mjs`; verificar `painel N=20 ok=20 503=0 500=0` e `esteira N=20 ok=20 503=0 500=0`
- [x] 1.3 Registrar a execução de 27/10 em `docs/02` (data, N, `ok/503/500` e comando), sem gravar credenciais; verificar a nota e a ausência de segredo no diff

## 2. A-05 — gate de visibilidade

- [x] 2.1 Estender `tests/visibilidade-publica.test.ts` com `release`, `manual` e `projeto` arquivados, além de múltiplos vínculos com um pai ativo; verificar com `npx vitest run tests/visibilidade-publica.test.ts`
- [x] 2.2 Adicionar em `docs/02` o contrato de leitura pública (“toda leitura pública usa `sqlVinculoPublicado`/`itemVisivelNoPortal`; arquivar não altera as filhas”); verificar a passagem no documento
- [x] 2.3 Adicionar nota opcional de revalidação de A-04/A-05 em 27/10 no RL06, sem reescrever os achados; verificar que a nota existe e o texto histórico permanece

## 3. Verificação final

- [x] 3.1 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; verificar que todos passam
- [x] 3.2 Revisar o diff final e confirmar que apenas `scripts/`, `tests/` e `docs/` foram alterados; verificar ausência de mudanças em `app/`, `server/`, `shared/` e `server/migration/`
- [x] 3.3 Rodar `openspec validate --specs` como sanity check (46/46) e confirmar que nenhuma spec principal foi alterada
