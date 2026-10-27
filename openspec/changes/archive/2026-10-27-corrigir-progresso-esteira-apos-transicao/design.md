# Design

## Context

Ver `proposal.md` — Why. `atualizarNaLista` em `useEsteiraRevisaoModelo.ts` substitui o item e os computeds derivados do board (KPIs, contagens e colunas) são recalculados, mas `progresso` é um estado separado preenchido apenas em `carregar`. Por isso o painel fica congelado após a transição.

## Goals / Non-Goals

**Goals:**

- Atualizar o progresso global após cada ação, sem F5.
- Evitar recarregar itens, opções e filtros só para obter as contagens.
- Manter a decisão bem-sucedida mesmo se a leitura do progresso falhar.

**Non-Goals:**

- Alterar as regras de transição ou os contadores em si.
- Recarregar o board inteiro após cada ação.
- Mudar o contrato das rotas de transição.

## Decisions

### 1. Endpoint leve dedicado

Adicionar `GET /api/esteira-revisao/progresso`, protegido por `esteira-revisao`/`visualizar`, que devolve `{ progresso }`. O endpoint reutiliza `contarProgressoEsteira` e `montarProgresso` por meio de `obterProgressoEsteira()`.

Alternativas descartadas:
- `carregar(true)` após cada ação: correto, mas refaz itens, opções, decisões e filtros sem necessidade.
- Recalcular no cliente com `calcularProgresso(itens.value)`: incorreto quando há paginação ou filtro de status, pois o progresso é global.
- Alterar as cinco rotas de transição para devolver o progresso: exigiria mudar o contrato existente e duplicar a leitura em cada rota.

### 2. Sincronização após a transição

`decidir` continuará atualizando o item localmente para feedback imediato; em seguida, chamará `sincronizarProgresso()`. A chamada será best-effort: se falhar, a transição permanece concluída e o painel mantém o último valor, sendo corrigido na próxima carga.

### 3. Sem mudança no painel

`Progresso.vue` continua consumindo o mesmo contrato; a correção é exclusivamente de atualização de estado.

## Risks / Trade-offs

- **Requisição extra após a ação** → leitura leve, sem payload de itens/opções; aceitável frente à consistência do painel.
- **Falha silenciosa do progresso** → o painel pode ficar defasado até a próxima carga; a decisão nunca é revertida.
- **Corrida entre usuários** → o painel reflete o instante da leitura; a próxima ação ou recarga atualiza novamente.

## Migration Plan

Sem migration. Rollback removeria o endpoint e a chamada, restaurando o comportamento anterior.

## Open Questions

Nenhuma.
