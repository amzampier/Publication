# Tasks

## 1. Leitura do progresso no servidor

- [x] 1.1 Exportar `obterProgressoEsteira()` em `server/utils/esteira-revisao.ts`, reutilizando `contarProgressoEsteira` e `montarProgresso`; verificar que `listarEsteira` continua usando a mesma montagem
- [x] 1.2 Criar `GET /api/esteira-revisao/progresso` com `visualizar`, retornando `{ progresso }`; verificar com sessão válida e sem sessão

## 2. Sincronização no cliente

- [x] 2.1 Adicionar `sincronizarProgresso()` em `useEsteiraRevisaoModelo.ts` e chamá-la após `atualizarNaLista` em `decidir`; verificar que falhas na leitura não transformam a ação em erro
- [x] 2.2 Documentar o endpoint e a atualização sem F5 em `docs/16 - Módulo Esteira de Revisão.md` (seção 6 e tabela de endpoints)

## 3. Verificação integrada

- [x] 3.1 Em uma transição controlada, confirmar que aprovar/publicar atualiza `aprovados` e `aguardando` no painel sem recarregar a página; restaurar o estado ao final
- [x] 3.2 Confirmar que recusar, reabrir e suspender também atualizam o painel, e que uma falha simulada na leitura mantém o item com o novo status
- [x] 3.3 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; confirmar que todos passam
- [x] 3.4 Rodar `openspec validate "corrigir-progresso-esteira-apos-transicao" --type change --strict` e `openspec validate --specs`; revisar o diff final
