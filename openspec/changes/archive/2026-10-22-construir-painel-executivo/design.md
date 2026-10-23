# Design

## Context

See `proposal.md` — Why. O sistema já tem os dados e os índices, mas cada módulo entrega sua própria
listagem e seus KPIs no cliente: `release_week` expõe `itensCount`, Manuais e Escopo expõem itens sob
demanda, `entregas_itens` concentra as chamadas e `historico_esteira_revisao` tem as transições e o
tempo por estágio. A Esteira já define o ciclo ativo e o percentual do fluxo em
`#shared/esteira-revisao`, que o painel deve reutilizar para não divergir da tela. Não há biblioteca
de gráfico, nem componente de chart no kit. O item raiz da sidebar não declara `to`, então hoje o
clique mostra "Módulo em construção". A Área Pública ainda não existe, então `total_visualizacoes`
é sempre 0 e não entra no v1.

## Goals / Non-Goals

**Goals:**
- Uma tela e um endpoint que respondam às perguntas editoriais do ciclo em uma única carga.
- Definições de métrica explícitas, testáveis e iguais às regras já usadas pela Esteira.
- Visualização acessível e alinhada aos tokens, sem dependência nova.
- Navegação direta pelo item raiz e documentação em `docs/17`.

**Non-Goals:**
- Substituir os KPIs/listagens dos módulos; o painel é consolidado, não o CRUD.
- Criar módulo RBAC novo, permissões por indicador ou filtros por perfil.
- Incluir engajamento/visualizações, auditoria, segurança, usuários ou produtividade individual.
- Renderizar o bloco visual de fluxo da esteira (aging, aguardando pai, no portal e tempo médio por
  estágio); os KPIs de percentual de fluxo e taxa de recusa permanecem.
- Exportação PDF/CSV, cache distribuído, tempo real ou drill-down navegável nesta fase.

## Decisions

### D1 — Uma API de agregação, somente leitura
`GET /api/painel-executivo?ano=AAAA` devolve todos os blocos em uma resposta. Alternativa: a tela
chamar as APIs de cada módulo e agregar no cliente — descartada porque mistura paginação/filtros de
módulo, transfere volume desnecessário e espalha a definição das métricas. As queries são
parametrizadas e rodam em paralelo no servidor.

### D2 — Sem novo módulo RBAC
O item raiz é sempre visível e o endpoint exige apenas sessão (o middleware global já responde `401`
sem sessão). Os dados são agregados do ciclo editorial, não incluem dados pessoais nem financeiros.
Alternativa: criar `painel-executivo` como 12º módulo — descartada no v1 porque exigiria migration de
matriz, atualização de contagens de perfis/testes e mudaria a regra "item raiz sempre visível". Se
depois houver necessidade de restringir, entra como change própria.

### D3 — Semântica temporal explícita
- Publicações: `YEAR/MONTH(data_publicacao)`, nunca o texto `mes`.
- Chamadas lançadas: `data_lancamento`.
- Chamadas liberadas: `data_liberacao <= CURDATE()`, porque a aprovação herda a `data_publicacao`
  do pai e a data pode estar no futuro.
- Arquivadas: entram no histórico de publicações; não entram em blocos operacionais de fluxo.
- Ano selecionado: corrente por padrão; a série anual cobre os últimos cinco anos.

### D4 — Contagem por vínculo, com dupla contagem assumida
A tabela "chamadas por publicação" usa `release_id`, `manual_id` e `projeto_id`. Uma chamada com
origem `Ambos` aparece em mais de uma aba; por isso a soma das abas não é o total de chamadas. O
`docs/17` e a UI devem dizer isso explicitamente. Ranking de software usa
`entregas_itens_softwares` (N:N), não o snapshot `software_id`.

### D5 — Reutilizar a regra da Esteira nos KPIs de fluxo
O ciclo ativo, o percentual do fluxo e a taxa de recusa usam as funções puras de
`#shared/esteira-revisao` e `#shared/painel-executivo` (`itemNoCicloAtivo`, `itemPublicadoNoPortal` e
`calcularFluxoPainel`), garantindo que os KPIs do painel e a tela da Esteira usem a mesma regra.
Alternativa: reimplementar a regra no SQL — descartada por risco de divergência. O bloco visual de
fluxo (aging, aguardando pai, no portal e tempo médio por estágio) não é renderizado no v1; o
cálculo existe apenas como suporte aos dois KPIs.

### D6 — Gráficos em SVG/CSS no kit, sem dependência
Criar primitivas de barras verticais empilhadas, linha e barras horizontais em `app/components/ui/`,
com tokens do design system, legenda, `role="img"`, `aria-label` textual e valores visíveis. Elas
devem ser espelhadas em `/design` e documentadas no `docs/01`. Alternativa: adicionar Chart.js/
ApexCharts — descartada no v1 por peso de bundle, novo vocabulário visual e necessidade de wrapper
de qualquer forma.

### D7 — Estados sem dados antigos
A tela usa `UiLoading` na carga inicial e, em falha, zera todos os blocos (mesmo padrão dos módulos
após o RL04): nada da carga anterior permanece. Cada bloco tem estado vazio próprio. A troca de ano
recarrega a API e mantém o seletor utilizável.

### D8 — Navegação do item raiz
`itemRaiz` passa a declarar `to: '/admin'` em `app/config/navigation.ts`; o `AppSidebar` já navega
quando `to` existe e marca `aria-current`. A spec `design-system/layout-navigation` ganha o cenário
do item raiz. O placeholder de `app/pages/admin/index.vue` é substituído pelo painel.

### D9 — Sem cache e com os índices disponíveis
O volume é baixo: uma consulta de anos disponíveis e 12 consultas agregadas usam faixas de data (`>= início AND < próximo ano`) para aproveitar
`idx_rel_publicacao`, `idx_manuais_ano_mes` e `idx_proj_ano`. As colunas
`entregas_itens.data_lancamento`/`data_liberacao` **não têm índice dedicado** no schema atual: o
`EXPLAIN` mostra varredura da tabela de chamadas. No volume do v1 isso é aceitável; a limitação fica
registrada no `docs/17` §9, com a recomendação de avaliar um índice composto se o volume crescer. O
v1 não usa cache para não exibir números defasados em uma tela de decisão.

## Risks / Trade-offs

- **Definições divergentes entre painel e módulos** → reutilizar as funções puras da Esteira e
  documentar cada fórmula no `docs/17`; testes puros cobrem os limites.
- **Dupla contagem de `Ambos`** → a UI e o doc dizem explicitamente que a soma das abas não é o total.
- **Data de liberação futura** → o KPI de liberadas corta em hoje; a série de lançadas continua
  contando a chamada; o tooltip/legenda explica que a data é herdada do pai.
- **Gráfico sem biblioteca** → componentes pequenos e testáveis, com fallback textual; se a
  complexidade crescer, reavaliar uma dependência em change própria.
- **Performance em bases grandes** → queries agregadas com índices; medir com `EXPLAIN` antes de
  otimizar. Sem paginação no painel por definição (é uma visão consolidada).
- **Dependência da Área Pública para engajamento** → explicitamente fora do v1; os contadores
  permanecem sem uso até a vitrine existir.

## Migration Plan

Não há migration. A entrega é aditiva: nova rota, nova API, novos componentes e docs. O único ajuste
de comportamento existente é o `to` do item raiz e o conteúdo de `/admin`, cobertos por testes/E2E.
Rollback = reverter a change; nenhum dado é alterado.
