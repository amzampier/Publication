# Tasks

## 1. RBAC e migration

- [x] 1.1 Adicionar `buscar` ao módulo `esteira-revisao` em `app/config/perfis.ts` e `server/utils/perfis.ts`, mantendo os dois catálogos idênticos, e verificar com `npm run test -- tests/perfis-funcionalidades.test.ts` (total 92)
- [x] 1.2 Criar `server/migration/27_reconciliar_rbac_esteira.sql` com os `UPDATE`s idempotentes de `buscar` e `publicar` (Revisor) e verificar aplicando a migration no MariaDB local e consultando `permissoes_perfil`
- [x] 1.3 Atualizar `docs/bd/02_seed.sql` com as linhas de `esteira-revisao` e os totais 92/92, 67/92, 41/92, 14/92 e 214/368
- [x] 1.4 Atualizar `docs/07 - Perfis de Acesso (RBAC).md` (catálogo 92, `buscar`, Revisor com `publicar` na esteira, regra "não publica conteúdo") e conferir as contagens

## 2. Domínio compartilhado

- [x] 2.1 Criar `shared/esteira-revisao.ts` com tipos, `calcularProgresso`, `filtrarItensEsteira`, `podeTransicionar`, `validarParecer`, `origemDoItem` e `rotuloVinculo`, incluindo `publicar`/`suspender` e o filtro de parceiro
- [x] 2.2 Criar `tests/esteira-revisao-validadores.test.ts` cobrindo progresso (percentual = aprovado + publicado), filtros, transições (aprovar/recusar/reabrir/publicar/suspender) e parecer, e verificar com `npm run test -- tests/esteira-revisao-validadores.test.ts`

## 3. Backend

- [x] 3.1 Criar `server/utils/historico-esteira.ts` com `registrarTransicao`, `listarHistoricoItem` e `ultimaEntradaNoEstagio`
- [x] 3.2 Refatorar as transições de `server/utils/lancar-chamadas.ts` para receber ator/opções, update condicionado em transação, histórico e regras de `data_liberacao`
- [x] 3.3 Atualizar as rotas `aprovar.put.ts`, `recusar.put.ts` e `desaprovar.put.ts` de Lançar as Chamadas para passar a sessão e manter a auditoria no recurso "Lançar as Chamadas"
- [x] 3.4 Criar `server/utils/esteira-revisao.ts` com ciclo ativo, mapas de vínculos, última decisão, listagem, detalhe e histórico
- [x] 3.5 Criar as rotas `GET /api/esteira-revisao`, `GET /:id`, `GET /:id/historico`, `PUT /:id/aprovar|recusar|reabrir|publicar|suspender` com as permissões do módulo
- [x] 3.6 Atualizar `docs/02 - Guia de Arquitetura e Migrations.md` com as rotas da esteira, o uso de `historico_esteira_revisao` e a regra da FK `ON DELETE RESTRICT`
- [x] 3.7 Verificar as respostas 200/401/403/404/409 das rotas e a gravação do histórico em aprovar, recusar, reabrir, publicar e suspender com o servidor local
- [x] 3.8 Verificar que a listagem devolve `itens`, `opcoes` e `progresso`, que o ciclo ativo exclui conteúdo arquivado/publicado e que o percentual usa aprovado + publicado
- [x] 3.11 Sincronizar o status do conteúdo pai ao criar/importar/trocar vínculos (`Em Revisão` para Release/Manual e `Homologação` para Escopo), na mesma transação
- [x] 3.12 Filtrar as opções de vínculo por status (Release `Aberta`/`Em Revisão`, Manual `Rascunho`/`Em Revisão`, Escopo `Em Andamento`/`Homologação`) e rejeitar pais fora desses status na importação

## 4. Frontend

- [x] 4.1 Adicionar `to: '/admin/esteira-revisao'` ao item `esteira-revisao` em `app/config/navigation.ts`
- [x] 4.2 Criar `app/components/esteira/useEsteiraRevisaoModelo.ts` e `validadores.ts` com estado do board, abas de origem, busca, filtros, progresso, histórico e ações de fluxo
- [x] 4.3 Criar `Cabecalho.vue` (título/usuário/portal), `Progresso.vue` compacto (percentual em `text-lg`, contagens em linha, barra `h-1.5`, recusadas) e `Kpis.vue` com os 4 KPIs no topo
- [x] 4.4 Criar `Board.vue` e `ChamadaCard.vue` com barra padrão (busca, Pacote de Origem à esquerda de Filtros), segunda faixa (Demandas por origem + Progresso), Software/Parceiro no modal, três colunas com cabeçalho em degradê e ações somente em ícones alinhados à direita
- [x] 4.5 Criar `Detalhe.vue` e `Historico.vue` com conteúdo rico, vínculos, classificação, autor, timestamps e timeline do histórico
- [x] 4.6 Criar `Decisao.vue` com aprovar/recusar/reabrir/publicar/suspender, parecer e critérios
- [x] 4.7 Criar `app/pages/admin/esteira-revisao.vue` compondo cabeçalho, painel, board, filtros, detalhe e decisão
- [x] 4.8 Atualizar `docs/01 - design_system.md` com KPIs no topo, progresso compacto junto à origem, Pacote de Origem à esquerda de Filtros, Software/Parceiro no modal, cabeçalhos em degradê e ações icon-only
- [x] 4.9 Atualizar `docs/03 - Header e Sidebar.md` com a rota da Esteira de Revisão e a remoção do aviso de "Módulo em construção"
- [x] 4.10 Criar `docs/16 - Módulo Esteira de Revisão.md` com o board, o painel compacto, publicar/suspender, contrato da API, RBAC/auditoria e pendências
- [x] 4.13 Desabilitar a ação "No Portal" e exibir "Aguardando pai" quando o item está em `Publicar` mas o conteúdo pai não está `Publicado`
- [x] 4.11 Verificar o board em desktop e 375px: colunas empilhadas, cards legíveis, ações acessíveis, estados vazios e faixa de recusadas

## 5. Integração com Lançar as Chamadas

- [x] 5.1 Atualizar `Aprovar.vue`, `Recusar.vue` e `Desaprovar.vue` para coletar parecer/critérios e enviar nas rotas de transição
- [x] 5.2 Atualizar `docs/15 - Módulo Lançar Chamadas.md` com a referência à Esteira, o histórico/parecer e as regras de `data_liberacao`

## 6. Verificação de integração

- [x] 6.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e corrigir qualquer falha introduzida pela mudança
- [x] 6.2 Executar o roteiro manual completo: criar chamada, conferir o status automático dos pais, as opções de vínculo filtradas, aprovar, publicar, suspender, recusar com parecer, reabrir, conferir a visibilidade pública (No Portal), o painel, as origens, a busca, os filtros, a faixa de recusadas, o histórico, a auditoria, o acesso do Revisor e a negação do Leitor, e recarregar para confirmar a persistência
