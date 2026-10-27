# Proposal

## Why

Após aprovar ou publicar um item na Esteira, o board e os KPIs são atualizados, mas o painel **Progresso da Esteira** continua exibindo as contagens anteriores até um F5. O usuário vê, por exemplo, itens em `Publicar` no board enquanto o painel ainda os contabiliza como `Aprovado` e mostra `0 aguardando`.

## What Changes

- Sincronizar o progresso global imediatamente após cada transição bem-sucedida (aprovar, recusar, reabrir, publicar e suspender).
- Expor uma leitura leve do progresso no servidor para evitar recarregar o board inteiro após a ação.
- Manter a atualização local do item no board e atualizar o painel com os totais reais do servidor.
- Documentar o comportamento e cobrir a sincronização na verificação integrada.
- Sem alteração de schema, migration, regra de transição ou payload do board.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `esteira-revisao`: o painel de progresso passa a refletir o resultado da transição sem exigir recarregar a página.

## Impact

- `server/utils/esteira-revisao.ts`: leitura reutilizável do progresso global.
- `server/api/esteira-revisao/progresso.get.ts`: endpoint leve, protegido por `visualizar`.
- `app/components/esteira/useEsteiraRevisaoModelo.ts`: sincronização após a transição.
- `docs/16 - Módulo Esteira de Revisão.md`: documentação do comportamento.
