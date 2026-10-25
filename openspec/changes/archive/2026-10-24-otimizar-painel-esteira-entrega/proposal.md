# Change: Otimizar Painel, Esteira e entrega de exportações

## Why

A reauditoria do RL06 confirmou que o caminho feliz é rápido, mas o Painel Executivo executa 15 queries por request (6 idênticas de RBAC) e `itensFluxo` faz varredura completa com 21 `EXISTS`; a Esteira não é paginada e `existentesParaValidacao()` lê a tabela inteira; o CSV usa `OFFSET` e repete `COUNT` por lote; a importação de Chamadas faz N+1; e `/uploads` de identidade não tem `Cache-Control` em produção, com miniaturas legadas 404. Com 5 mil chamadas o Painel chega a p95 de 1,35 s em N=20.

## What Changes

- Reduzir o fanout do Painel: carregar a matriz RBAC uma vez por request, cachear `anosDisponiveis` e reescrever `itensFluxo` para evitar full scan/EXISTS correlacionados.
- Paginar/limitar o board da Esteira e remover a leitura integral de `entregas_itens` na validação de unicidade, usando a UK e o tratamento de `1062`.
- Trocar o CSV por keyset/cursor, com contagem/KPIs calculados uma vez por exportação.
- Importar Chamadas em blocos (`inserirEmLotes`) e softwares em upsert multi-row, mantendo a atomicidade.
- Servir `/uploads/logomarcas|avatares|logos` com cache curto/revalidável e eliminar `Vary` duplicado.
- Comprimir respostas dinâmicas no Nitro ou documentar/validar o proxy; não recomprimir mídia.
- Gerar fallback para miniaturas legadas (`-320.webp` inexistente → original) sem quebrar a galeria.
- Alinhar as variáveis do pool (`DB_POOL_*` em runtime) e documentar o contrato.

## Impact

- Affected specs: `painel-executivo`, `esteira-revisao`, `exportacao-streaming`, `lancar-chamadas`, `entrega-assets`, `uploads`.
- Affected code: `server/utils/painel-executivo.ts`, `server/utils/permission.ts`, `server/utils/esteira-revisao.ts`, `server/api/esteira-revisao/**`, `server/api/*/index.get.ts` (CSV), `server/utils/lancar-chamadas.ts`, `nuxt.config.ts`, `server/routes/uploads/chamadas/[...arquivo].get.ts`, `shared/lancar-chamadas.ts`, `server/utils/db.ts`.
- Sem mudança de schema; migrations 1–35 permanecem.
- Risco: alterar agregações/keyset pode mudar contagens; cobertura por testes de contrato e medições antes/depois.

## Non-goals

- Correções de bloqueadores de autorização/busca/Esteira 500 (change `corrigir-bloqueadores-rl06-final`).
- UX, acessibilidade e documentação ampla (change `fechar-ux-e-contratos-rl06`).
- CDN/proxy real, teste de carga sustentado e produção.