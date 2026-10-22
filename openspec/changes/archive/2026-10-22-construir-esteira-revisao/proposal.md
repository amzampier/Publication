# Proposal

## Why

As chamadas de Release Week, Manuais e Escopo de Projetos nascem em `Revisar`, mas não existe uma
tela para revisá-las em conjunto. A aprovação e a recusa estão dispersas em Lançar as Chamadas, sem
parecer e sem trilha de decisão. A tabela `historico_esteira_revisao`, as colunas de revisor e o
módulo RBAC `esteira-revisao` já existem no banco e na matriz, porém não são usados. Isso impede
medir o progresso da revisão, identificar o que está parado e rastrear quem homologou cada chamada.

## What Changes

- Nova tela administrativa `/admin/esteira-revisao`, alcançável pelo item **Esteira de Revisão** da
  sessão **Movimentos** da sidebar, com a rota ativa e a mesma guarda de sessão das demais telas.
- Cabeçalho com título, chip do usuário e **Ver Portal Público**.
- Quatro **KPIs** do conjunto filtrado (**No filtro**, **Em revisão**, **Aprovadas**, **Recusadas**)
  no topo da página.
- Board de homologação das chamadas de `entregas_itens` do ciclo ativo (conteúdo pai não arquivado e
  não publicado), com as colunas **1. Em Revisão**, **2. Homologados** e **3. Publicados** (cabeçalhos
  com o degradê do header de modal e borda na cor do estágio), faixa de **Recusadas** sob demanda e
  barra de ferramentas no padrão das demais telas (título, busca, **Pacote de Origem à esquerda do
  botão Filtros**). Na segunda faixa da barra ficam o filtro **Demandas por origem** (Todas, Releases,
  Manuais, Escopo) e o **painel compacto de progresso** (percentual em `text-lg`, contagens em linha,
  barra `h-1.5`, acionador de recusadas). **Software Atendido** e **Parceiro / Cliente** ficam dentro
  do modal de Filtros. Os cards usam **ações somente em ícones alinhados à direita**.
- Ao criar, importar ou trocar vínculos em Lançar as Chamadas, o conteúdo pai vinculado passa
  automaticamente para `Em Revisão` (Release/Manual) ou `Homologação` (Escopo), inclusive se estava
  `Aprovado`/`Publicado`.
- As opções de vínculo do formulário só oferecem Release Week em `Aberta`/`Em Revisão`, Manuais em
  `Rascunho`/`Em Revisão` e Escopo em `Em Andamento`/`Homologação`; a importação XLSX rejeita linhas
  com pai fora desses status.
- Um item em `Publicar` só é visível na Área Pública quando ao menos um vínculo aponta para conteúdo
  pai `Publicado`; caso contrário, o card mostra "Aguardando pai" e a ação "No Portal" fica
  desabilitada.
- Transições **Aprovar**, **Recusar**, **Reabrir**, **Publicar Item** e **Suspender** na esteira,
  com parecer (obrigatório na recusa), critérios de aceite e gravação atômica em
  `historico_esteira_revisao`.
- Aprovar preserva a `data_liberacao` existente e herda a data da release apenas quando ela estiver
  vazia; reabrir limpa a `data_liberacao`; publicar e suspender preservam a data.
- As ações de aprovar, recusar e desaprovar em Lançar as Chamadas passam a usar a mesma transição de
  domínio, gravando histórico, parecer e auditoria.
- RBAC: adicionar `buscar` ao catálogo de `esteira-revisao` e conceder `publicar` ao perfil Revisor
  nesse módulo, via migration de reconciliação. O catálogo passa de 91 para 92 funcionalidades.
- Auditoria das transições com o recurso **"Esteira de Revisão"**.
- Documentação: novo `docs/16 - Módulo Esteira de Revisão.md` e atualização dos documentos afetados.

**Não faz parte desta mudança:** bloquear a publicação do conteúdo pai enquanto houver chamada em
`Revisar`/`Recusado` (fase 2); definir a semântica de `arquivar` na esteira (fase 2); preencher
`revisor_id`/`revisor_feedback` no conteúdo pai (fase 2); seleção/ações em lote, notificações e
paginação server-side.

## Capabilities

### New Capabilities

- `esteira-revisao`: board de homologação das chamadas de Release Week, Manuais e Escopo de Projetos;
  progresso do fluxo; transições com parecer e histórico; detalhe e RBAC do módulo.

### Modified Capabilities

- `lancar-chamadas`: as transições de status passam a registrar histórico, parecer e critérios, com
  regras de `data_liberacao` no aprovar e no reabrir.
- `perfis-acesso`: o catálogo de funcionalidades passa a ter 92 itens (novo `buscar` em
  `esteira-revisao`) e as contagens normativas dos perfis são atualizadas.

## Impact

- **Banco:** nenhuma tabela/coluna nova; passa a usar `historico_esteira_revisao`. Nova migration de
  dados de RBAC (`27_reconciliar_rbac_esteira.sql`) para `buscar` e `publicar` do Revisor.
- **API:** novas rotas `/api/esteira-revisao` (board, detalhe, histórico) e
  `/api/esteira-revisao/:id/{aprovar,recusar,reabrir,publicar,suspender}`; ajuste das rotas de
  transição de `/api/lancar-chamadas/:id/{aprovar,recusar,desaprovar}`.
- **Frontend:** nova página e componentes em `app/components/esteira/` (cabeçalho, painel compacto,
  board, cards, filtros, detalhe, histórico e decisão); rota em `app/config/navigation.ts`;
  parecer/critérios nos modais de transição de Lançar as Chamadas.
- **RBAC:** catálogo em `app/config/perfis.ts` e `server/utils/perfis.ts`; seed documentado e teste
  de catálogo (91 → 92).
- **Documentação:** `docs/16` novo; atualização de `docs/01`, `docs/02`, `docs/03`, `docs/07`,
  `docs/15` e `docs/bd/02_seed.sql`.
- **Dependências:** nenhuma nova biblioteca; reaproveita o UI kit e o pool MariaDB existentes.
