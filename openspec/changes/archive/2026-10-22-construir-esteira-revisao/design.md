# Design

## Context

Ver `proposal.md` — Why para a motivação. O estado atual que condiciona o desenho:

- `entregas_itens` é a tabela única das chamadas de Release, Projeto e Manual, com status
  `Revisar`/`Aprovado`/`Recusado`/`Publicar` (`Publicar` é legado e não é produzido pelo fluxo).
- Os conteúdos pai têm status editorial próprio (`release_week`, `manuais_mensal`,
  `projetos_escopo`) e publicação independente; `arquivada` é um booleano separado.
- `historico_esteira_revisao` existe com status anterior/novo, responsável, parecer, critérios,
  tempo no estágio e data/hora, mas nenhuma rota grava nela. `revisor_id`/`revisor_feedback` também
  existem nos pais e não são usados.
- Aprovar/recusar/desaprovar vivem em `server/utils/lancar-chamadas.ts` e não registram histórico.
- O módulo RBAC `esteira-revisao` já existe com `visualizar`, `alterar`, `publicar`, `arquivar` e
  `filtrar`; o item da sidebar existe sem rota.
- O padrão dos módulos de listagem é carregar o conjunto pela API e filtrar/paginar no cliente. A
  auditoria e os usuários usam paginação/busca server-side; os demais, client-side.
- O UI kit (`app/components/ui/*`) já cobre tabela, modais, badges, KPIs, segmented, textarea e
  checkbox; não há componente novo de kit previsto.

## Goals / Non-Goals

**Goals:**

- Entregar a esteira como uma fila unificada e acionável sobre `entregas_itens`, com progresso
  global, revisão com parecer e histórico imutável.
- Centralizar a regra de transição para que Esteira e Lançar as Chamadas não divirjam.
- Reconciliar o RBAC do módulo (`buscar` no catálogo; `publicar` do Revisor na esteira).
- Manter o padrão existente de componentes de domínio em `app/components/<modulo>/`, modelo com
  `useState` e page fina.

**Non-Goals:**

- Gate de publicação do conteúdo pai (fase 2).
- Semântica de `arquivar` na esteira (fase 2).
- Preencher `revisor_id`/`revisor_feedback` no pai (fase 2).
- Ações em lote, notificações, exportação PDF/CSV da esteira.
- Paginação/busca server-side nesta fase.

## Decisions

### 1. Reaproveitar `listarChamadas()` e filtrar o ciclo ativo no servidor da esteira

`server/utils/esteira-revisao.ts` usa `listarChamadas()` como fonte do item (mesmo mapper, softwares
e HTML) e carrega os pais em mapas (`release_week`, `manuais_mensal`, `projetos_escopo`). O universo
ativo é calculado no servidor:

```text
inclui item quando existe ao menos um vínculo com pai não arquivado e status <> 'Publicado'
```

A API devolve `itens`, `opcoes` e `progresso`. O cliente recebe o conjunto ativo e aplica abas de
origem, filtros, busca e o agrupamento em colunas do board no cliente.

**Por que:** evita duplicar o mapper de `entregas_itens` e mantém o mesmo contrato já usado por
Lançar as Chamadas. **Alternativa descartada:** query SQL dedicada com joins e agregações — mais
performática, mas duplicaria regras e o mapper nesta fase; fica para a fase 2 se o volume exigir.

### 2. Transição compartilhada em `server/utils/historico-esteira.ts`

O histórico e a transição saem de `lancar-chamadas.ts` para um módulo sem dependência de volta:

- `historico-esteira.ts`: `registrarTransicao`, `listarHistoricoItem`, `ultimaEntradaNoEstagio`.
- `lancar-chamadas.ts`: as funções `aprovarChamada`, `recusarChamada` e `desaprovarChamada` passam a
  receber o ator (`id`, `nome`, `perfil`) e opções (`parecer`, `criterios`) e delegam a transição.
- `esteira-revisao.ts`: importa as funções de `lancar-chamadas.ts` e o leitor de histórico; não há
  ciclo de imports.

A transição executa em transação:

```text
1. lê o item e o status atual
2. calcula o tempo no estágio (último novo_status = status atual, ou criado_em)
3. UPDATE ... WHERE id = ? AND status = <status atual>
4. se affectedRows = 0 -> 409
5. INSERT em historico_esteira_revisao
6. COMMIT
```

**Por que:** garante atomicidade e evita dupla aprovação concorrente. **Alternativa descartada:**
`SELECT ... FOR UPDATE` — funciona, mas o update condicionado é mais simples e suficiente com o
`affectedRows` do MariaDB.

### 3. Painel compacto de progresso e board em estágios

`shared/esteira-revisao.ts` calcula o progresso a partir do conjunto ativo:

```text
avançou no fluxo = Aprovado + Publicar
% do fluxo       = avançou no fluxo / total
por vínculo      = itens com aquele vínculo ativo (multi-vínculo conta em cada origem)
```

Os **4 KPIs** do conjunto filtrado ficam no topo. Abaixo deles, a segunda faixa da barra de
ferramentas do board combina o filtro **Demandas por origem** (abas compactas
Todas/Releases/Manuais/Escopo com contagens globais) com o **painel compacto de progresso**
(`lg:grid-cols-[1fr_20rem]`). O painel é menor que o card anterior: percentual em `text-lg`,
contagens em linha, barra `h-1.5` e acionador de recusadas; ele é global (não segue os filtros). O
**board** organiza as chamadas em três colunas — Em Revisão, Homologados e Publicados — com a faixa
de recusadas sob demanda. A barra de ferramentas segue o padrão das demais telas (card branco com
título, busca, **Pacote de Origem à esquerda do botão Filtros** e limpeza rápida); **Software
Atendido** e **Parceiro / Cliente** ficam dentro do modal de filtros. Os cabeçalhos das colunas usam
o **mesmo degradê do header dos modais** (`brand-primary` → `brand-structure`) com borda esquerda na
cor do estágio; as ações dos cards são **somente ícones alinhados à direita**, com tooltip e
`aria-label`.

**Por que:** reproduz o processo visual 1. Revisar → 2. Aprovado → 3. Publicar, mantém a exceção de
recusa acessível sem poluir as três etapas principais e preserva a leitura de KPIs e filtros das
demais telas. **Alternativa descartada:** tabela paginada com abas de status — menos aderente ao
fluxo de homologação e ao board de conferência. O degradê nos cabeçalhos das colunas é uma exceção
visual explícita pedida para esta tela; o restante das superfícies continua sólido.

### 4. RBAC: 92 funcionalidades e `publicar` do Revisor na esteira

- `buscar` entra em `esteira-revisao` no catálogo (`app/config/perfis.ts` e `server/utils/perfis.ts`).
- O Revisor recebe `publicar` **somente** em `esteira-revisao`; ali a ação cobre **Aprovar**,
  **Publicar Item** e **Suspender**. Nos módulos de conteúdo e em Lançar as Chamadas continua sem
  `publicar`.
- Migration `27_reconciliar_rbac_esteira.sql`:
  - adiciona `buscar` a todas as linhas de `esteira-revisao` com `pode_visualizar = 1` (idempotente);
  - adiciona `publicar` ao perfil Revisor canônico.
- Totais: catálogo 92; Administrador 92/92, Editor 67/92, Revisor 41/92, Leitor 14/92; concedidas
  214/368.

**Por que:** o Revisor "revisa e homologa" e precisa aprovar; manter a ação sob `publicar` preserva
o significado já usado em Lançar as Chamadas. **Alternativa descartada:** mapear aprovação para
`alterar` — misturaria recusa e homologação e esvaziaria `publicar` na esteira.

### 5. Busca e filtros no cliente, com guarda de permissão no servidor

A API aceita `busca` e `filtros` como flags e usa `funcionalidadesDeConsulta` para exigir
`buscar`/`filtrar` quando informados. A UI oculta o campo/botão sem a permissão. A listagem continua
client-side nesta fase.

**Por que:** consistência com o padrão de Lançar as Chamadas e simplicidade. **Alternativa
descartada:** busca server-side — exigiria paginação/ordenação server-side e um contrato maior, sem
ganho imediato para o volume atual.

### 6. Regras de `data_liberacao`

- Aprovar: preserva a data existente; herda `release_week.data_publicacao` somente quando vazia.
- Recusar: não altera.
- Reabrir: limpa (`NULL`).
- Publicar Item: preserva a data existente (não é data de publicação no portal).
- Suspender: preserva a data existente.

**Por que:** corrige o comportamento atual de zerar a data em itens sem release e mantém a
semântica de "data planejada" ao reabrir para correção. É uma mudança de comportamento documentada
no delta de `lancar-chamadas`.

### 7. Rota e componentes

- `app/config/navigation.ts`: `to: '/admin/esteira-revisao'` no item `esteira-revisao`.
- Page fina em `app/pages/admin/esteira-revisao.vue` com `definePageMeta({ layout: 'admin' })`.
- Componentes em `app/components/esteira/`: `Cabecalho`, `Progresso`, `Kpis`, `Board`,
  `ChamadaCard`, `Filtros`, `Detalhe`, `Decisao`, `Historico`, mais `useEsteiraRevisaoModelo.ts` e
  `validadores.ts`.
- O histórico é exibido dentro do detalhe; `Historico` é um subcomponente de apresentação.
- Reaproveita `UiModal`, `UiModalSection`, `UiBadge`, `UiSegmented`, `UiSelect`, `UiInput`,
  `UiTextarea`, `UiCheckbox` e `UiButton`. O board não usa `UiDataTable` (não há paginação nem
  agrupamento por coluna; os cards são a unidade visual).

### 8. Auditoria

As rotas de transição registram `registrarAuditoria` com recurso **"Esteira de Revisão"**:
`Homologação` no aprovar/publicar e `Alteração` no recusar/reabrir/suspender. A Esteira grava o
histórico; a auditoria permanece na rota, como nos demais módulos. As rotas de Lançar as Chamadas
continuam auditando com o recurso "Lançar as Chamadas", mesmo usando a mesma transição.

### 9. FK do histórico

Mantém `historico_esteira_revisao.entrega_item_id → entregas_itens(id) ON DELETE RESTRICT`. A
exclusão do pai já é bloqueada quando há itens; o `RESTRICT` preserva a trilha de revisão. O caminho
para retirar conteúdo de circulação é arquivar, não excluir. A decisão será registrada em `docs/02`
(substituindo a pendência atual).

### 10. `Publicar` e `Suspender` como estágios ativos do item

O board usa o status `Publicar` (antes legado) como terceiro estágio: **Aprovado → Publicar** pela
ação **Publicar Item** e **Publicar → Aprovado** pela ação **Suspender**. As duas transições gravam
histórico e auditoria, preservam a `data_liberacao` e exigem `esteira-revisao`/`publicar`. O
`Publicar` do item é um marcador de visibilidade, mas a **visibilidade efetiva no portal** exige que
ao menos um vínculo aponte para conteúdo pai `Publicado`: a ação "No Portal" fica desabilitada e o
card mostra "Aguardando pai" enquanto o pai não estiver publicado. O gate de publicação do pai
(bloquear a publicação enquanto houver itens em `Revisar`/`Recusado`) continua na fase 2. **Por que:**
completa o fluxo 1. Revisar → 2. Aprovado → 3. Publicar sem expor conteúdo antes da publicação do
pai. **Alternativa descartada:** considerar o item publicado apenas pelo status `Publicar` — exporia
itens de releases/manuais/escopos ainda em revisão.

### 11. O vínculo reabre o conteúdo pai para revisão

Ao criar, importar ou trocar vínculos, o servidor move cada conteúdo pai vinculado para
`Em Revisão` (Release/Manual) ou `Homologação` (Escopo) na mesma transação da chamada, de forma
idempotente. Conteúdos `Aprovado`/`Publicado` também são reabertos; a publicação do pai continua sendo
uma ação explícita do módulo. **Por que:** o pai precisa refletir que possui itens em revisão e a
Área Pública não deve exibir conteúdo com itens novos ainda não homologados. **Alternativa
descartada:** manter o pai `Publicado` e publicar apenas o item — o conteúdo pai ficaria público com
um item novo ainda em revisão.

### 12. Só pais em status vinculável aparecem no formulário

O formulário de Lançar as Chamadas filtra as opções por status: Release Week `Aberta`/`Em Revisão`,
Manuais `Rascunho`/`Em Revisão` (o Manual não tem `Aberta`) e Escopo `Em Andamento`/`Homologação`.
A importação XLSX rejeita linhas com pai fora desses status. Na edição, o vínculo atual é preservado
mesmo que o pai tenha mudado de status, para não perder o vínculo existente. **Por que:** evita
vincular chamadas a conteúdos já aprovados/publicados ou concluídos. **Alternativa descartada:**
filtrar apenas no cliente sem validar a importação — a planilha poderia gravar vínculos inválidos.

## Risks / Trade-offs

- **Carregar o conjunto ativo completo** → simples e consistente com Lançar as Chamadas, mas cresce
  com o volume. Mitigação: fase 2 migra para consulta paginada/agregada no servidor; o contrato da
  API já separa `itens`, `opcoes` e `progresso`.
- **Multi-vínculo conta em mais de uma origem** → o total geral distinto e a soma das origens podem
  divergir. Mitigação: nota visual no card e regra documentada na spec.
- **`Publicar` como estágio ativo** → o status antes legado passa a ser produzido pela esteira.
  Mitigação: o item publicado é um marcador de visibilidade; o conteúdo pai continua com sua
  publicação própria e o gate de publicação do pai fica para a fase 2. Itens antigos em `Publicar`
  aparecem na coluna Publicados e podem ser suspensos.
- **Pai publicado é reaberto ao vincular** → criar/alterar uma chamada em um pai `Publicado` o move
  para `Em Revisão`/`Homologação`, retirando-o da Área Pública até nova publicação. Mitigação: é o
  comportamento explícito pedido para garantir que todo item novo passe por revisão; documentado em
  `docs/12`, `docs/13`, `docs/14`, `docs/15` e `docs/16`.
- **Importação com pai fora do status** → a linha é rejeitada como código não encontrado. Mitigação:
  o servidor revalida tudo antes de gravar; uma melhoria futura pode refletir o status no preview da
  planilha.
- **Board sem paginação** → muitos cards podem deixar as colunas longas. Mitigação: as colunas
  rolam com a página e a fase 2 pode migrar para consulta paginada/agregada no servidor. A seleção
  em lote ("Selecionar todos") do mock fica para a fase 2.
- **Revisor com `publicar` na esteira** → pode parecer que o Revisor publica conteúdo. Mitigação:
  a concessão é restrita ao módulo `esteira-revisao`; ali a ação cobre homologar e publicar o item,
  não o conteúdo pai. `docs/07` passa a explicar essa distinção.
- **Mudança nos modais de Lançar as Chamadas** → a recusa passa a exigir parecer. Mitigação: os
  modais existentes ganham o campo e a validação; o comportamento anterior de confirmação simples
  permanece para aprovar/desaprovar.
- **Transição concorrente** → mitigada pelo update condicionado + `409` e atualização da lista.
- **Exclusão de conteúdo com histórico** → o `RESTRICT` pode surpreender. Mitigação: documentar em
  `docs/02`/`docs/16` e manter a guarda de itens já existente.

## Migration Plan

1. Criar `server/migration/27_reconciliar_rbac_esteira.sql` (somente dados de `permissoes_perfil`,
   sem DDL de tabela/coluna), idempotente, com bloco de rollback comentado.
2. O boot do Nitro aplica a migration automaticamente; em produção, o mesmo runner.
3. Rollback manual: remover `buscar` e `publicar` do `extras` das linhas de `esteira-revisao` e
   apagar o registro em `_migrations`.
4. Não há migração de dados de `entregas_itens`; o histórico passa a ser gravado a partir do deploy.

## Open Questions

- Momento de mover a listagem para paginação/agregação server-side (fase 2, condicionado ao volume).
- Definição do gate de publicação e da semântica de `arquivar` (fase 2, fora deste design).
