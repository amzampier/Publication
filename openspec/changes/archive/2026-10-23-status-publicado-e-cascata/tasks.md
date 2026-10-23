# Tasks

## 1. Banco e migração

- [x] 1.1 Criar `server/migration/29_status_publicado_cascata.sql` ampliando `entregas_itens.status` para `ENUM('Revisar','Aprovado','Recusado','Publicar','Publicado')` e adicionando os índices compostos `(release_id, status)`, `(manual_id, status)` e `(projeto_id, status)`; verificar com `SHOW COLUMNS FROM entregas_itens LIKE 'status'` e `SHOW INDEX` após `npm run dev`.
- [x] 1.2 No mesmo arquivo, inserir o histórico de migração e atualizar para `Publicado` as chamadas em `Publicar` com pai ativo `Publicado` (qualquer vínculo), de forma idempotente; verificar com consultas antes/depois que não restam `Publicar` com pai publicado e que cada filha tem uma linha de histórico `Publicar → Publicado`.
- [x] 1.3 Documentar o rollback no rodapé da migration (reverter `Publicado` para `Publicar`, remover índices e, por último, o valor do enum) e validar que o script de rollback é executável manualmente.

## 2. Modelo compartilhado e regras puras

- [x] 2.1 Adicionar `Publicado` em `shared/lancar-chamadas.ts` (`StatusChamada`, `STATUS_CHAMADA`, `VARIANTE_STATUS_CHAMADA` mapeando para `publicado`, KPIs e motivos de bloqueio de aprovação/recusa/desaprovação/exclusão); verificar com `npm run test -- lancar-chamadas` e `npm run typecheck`.
- [x] 2.2 Atualizar `shared/esteira-revisao.ts`: `itemPublicadoNoPortal` exige `status === 'Publicado'` + pai ativo publicado; `itemNoCicloAtivo` exclui `Publicado`; `podeTransicionar('suspender')` aceita `Publicar` e `Publicado`; `ProgressoVinculo` ganha `publicado` e `aguardando` com os percentuais recalculados; verificar com `npm run test -- esteira-revisao` e `npm run typecheck`.
- [x] 2.3 Atualizar `shared/painel-executivo.ts` (`calcularFluxoPainel`) para classificar `Publicado` como `noPortal` e `Publicar` como `aguardando`, mantendo o percentual sobre `Aprovado + Publicar`; verificar com `npm run test -- painel-executivo`.
- [x] 2.4 Revisar os testes de validadores existentes e adicionar cenários para `Publicado` (aprovar/recusar/excluir bloqueados, suspender permitido, visibilidade e progresso); verificar com `npm run test`.

## 3. Backend da cascata e transições

- [x] 3.1 Criar `server/utils/publicacao-pais.ts` com `reconciliarFilhasPublicacao(executor, tipo, id, ator)` para publicar (`Publicar → Publicado`) e reverter (`Publicado → Publicar`) com `INSERT ... SELECT` de histórico antes do `UPDATE` e regra de múltiplos pais; verificar em banco local com chamadas de teste em `Publicar`, `Aprovado` e `Recusado`.
- [x] 3.2 Tornar `publicarReleaseWeek`, `publicarManual` e `publicarEscopo` transacionais, receber `AtorTransicao` e chamar o reconciliador; atualizar as três rotas `PUT .../publicar` para obter o ator da sessão e incluir a contagem de filhas no detalhe da auditoria; verificar publicando um pai com filhas em `Publicar` e conferindo status, histórico e auditoria.
- [x] 3.3 Chamar o reconciliador em `criar*`, `atualizar*` e `importar*` dos três conteúdos pai quando o status entrar ou sair de `Publicado`; verificar via `PUT` com `status: 'Publicado'` e com `status: 'Em Revisão'`/`Homologação`.
- [x] 3.4 Propagar o ator para `sincronizarStatusPais` em `server/utils/lancar-chamadas.ts` e chamar o reconciliador quando a reabertura retirar o pai de `Publicado`, inclusive em criação, edição e importação de chamadas; verificar com uma chamada nova vinculada a um pai publicado.
- [x] 3.5 Ajustar `publicarChamada` (atalho para `Publicado` quando o pai já está publicado) e `suspenderChamada` (aceitar `Publicar` e `Publicado`); verificar pelos endpoints da Esteira que o status e o histórico são gravados corretamente.
- [x] 3.6 Adicionar testes/verificações de concorrência para a transição (status alterado entre leitura e escrita) e para a idempotência da cascata (publicar duas vezes não duplica histórico); verificar com chamadas repetidas à API.

## 4. Frontend — Esteira de Revisão

- [x] 4.1 Atualizar `app/components/esteira/Board.vue`, `ChamadaCard.vue` e `useEsteiraRevisaoModelo.ts` para `Publicado`: coluna Publicados com `Publicar`/`Publicado`, indicador **Aguardando pai**, **No Portal** habilitada apenas em `Publicado`, filtro de status e ações do card; verificar visualmente em `/admin/esteira-revisao`.
- [x] 4.2 Atualizar `Progresso.vue` e o cálculo de progresso para a contagem informativa **no portal** (`Publicado`) e o rótulo **aguardando** (`Publicar`), preservando o percentual sobre o ciclo ativo; verificar com dados em todos os estágios e com o painel global ignorando filtros.
- [x] 4.3 Atualizar `Cabecalho.vue` e os textos de estágio (`1. Revisar → 2. Aprovado → 3. Publicar/Publicado`), além dos testes de `esteira-revisao` afetados; verificar com `npm run test -- esteira-revisao`.
- [x] 4.4 Atualizar `docs/16 - Módulo Esteira de Revisão.md` (fluxo, visibilidade, board, progresso, ações) e o mapeamento de badges em `docs/01 - design_system.md`; conferir que os textos batem com a tela em `/admin/esteira-revisao`.

## 5. Frontend — Lançar as Chamadas e Painel Executivo

- [x] 5.1 Atualizar `app/components/lancar-chamadas/{Tabela,Detalhes,Filtros,useLancarChamadasModelo}` para exibir/filtrar `Publicado` e os novos motivos de bloqueio; verificar em `/admin/lancar-chamadas` e com `npm run test -- lancar-chamadas`.
- [x] 5.2 Atualizar as consultas de `server/utils/painel-executivo.ts` (`SUM(e.status = 'Publicar')`, percentual e colunas por publicação) para a nova definição e ajustar `shared/painel-executivo.ts` se necessário; verificar com `npm run test -- painel-executivo` e conferindo os KPIs em `/admin`.
- [x] 5.3 Atualizar `docs/15 - Módulo Lançar Chamadas.md` (status, bloqueios, transições e backend) e `docs/17 - Painel Executivo.md` (definição do percentual e contagens); conferir que as definições documentadas batem com as respostas da API.

## 6. Documentação de banco e verificação integrada

- [x] 6.1 Atualizar `docs/bd/01 - banco_dados_mariadb.sql` com o enum `Publicado` e os índices compostos, mantendo o arquivo alinhado à migration 29; verificar por inspeção e `openspec validate --specs` quando as specs forem sincronizadas.
- [x] 6.2 Executar os gates `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` e `openspec validate status-publicado-e-cascata`; corrigir qualquer falha antes de encerrar.
- [x] 6.3 Executar a verificação E2E manual com MariaDB local: publicar Release Week/Manual/Escopo com filhas em `Publicar`, conferir `Publicado` e histórico; reabrir o pai e conferir a volta para `Publicar`; testar múltiplos vínculos; suspender uma filha publicada; confirmar que a Área Pública (quando existir) só considera `Publicado` com pai ativo publicado.
