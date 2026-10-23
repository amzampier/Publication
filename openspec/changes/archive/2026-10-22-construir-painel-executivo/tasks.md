# Tasks

## 1. Contrato e agregação

- [x] 1.1 Criar `shared/painel-executivo.ts` com os tipos do contrato (`PeriodoPainel`, `KpisPainel`, `SerieMensal`, `SerieAnual`, `PublicacaoComChamadas`, `RankingSoftware`, `FluxoPainel`) e funções puras de série/percentual/lead time; verificar com `npm run typecheck`
- [x] 1.2 Criar `tests/painel-executivo.test.ts` cobrindo 12 meses com zeros, série anual de cinco anos, percentual do fluxo igual ao da Esteira, lead time só de liberadas, taxa de recusa com total zero e dupla contagem de vínculos; `npm run test` deve passar
- [x] 1.3 Criar `server/utils/painel-executivo.ts` com as queries agregadas (releases por status/mês, chamadas por lançamento/liberação, chamadas por release/manual/projeto, softwares N:N, tipo/impacto e fluxo) usando os índices existentes; validar com `npm run typecheck` e `EXPLAIN` das consultas principais
- [x] 1.4 Criar `server/api/painel-executivo/index.get.ts` com sessão obrigatória, `ano` opcional, default do ano corrente (ou o mais recente com chamadas) e `400` para ano inválido; conferir `200` com `anosDisponiveis` e o contrato completo, `400` para `ano=abc` e `401` sem sessão
- [x] 1.5 Registrar em `docs/17 - Painel Executivo.md` o dicionário de métricas (§3) e o contrato da API (§6), incluindo `anosDisponiveis`, a ressalva de `Ambos` e da data de liberação herdada, e a ausência do bloco visual de fluxo; conferir que cada fórmula bate com o teste de 1.2

## 2. Tela e navegação

- [x] 2.1 Substituir o placeholder de `app/pages/admin/index.vue` pelo shell do painel (título, subtítulo, seletor de ano apenas com anos que têm chamadas, atualizar, `UiLoading`, toast de erro e estados vazios); verificar no navegador que `/admin` renderiza dentro do shell e que a falha zera os blocos
- [x] 2.2 Criar `app/composables/usePainelExecutivo.ts` com `useApiFetch`, estado de ano, carga inicial, recarga por ano e descarte de dados em falha; verificar a troca de ano e o reload
- [x] 2.3 Criar os componentes de KPI do painel usando `UiKpi` (Releases publicadas, Chamadas lançadas, Chamadas liberadas, % do fluxo, Lead time, Taxa de recusa); conferir os valores contra a API e o estado vazio
- [x] 2.4 Criar os componentes do gráfico mensal/anual de publicações e da série de chamadas lançadas x liberadas, com legenda e valores acessíveis; conferir a alternância Mensal/Anual e meses zerados
- [x] 2.5 Criar a tabela de chamadas por publicação (abas Release Week, Manuais, Escopo) com código, nome, data, status, total e progresso; conferir uma chamada de origem `Ambos` nas duas abas
- [x] 2.6 Criar os blocos de ranking de softwares, tipo e impacto (sem o bloco de fluxo da esteira); conferir os números com o banco
- [x] 2.7 Declarar `to: '/admin'` em `itemRaiz` (`app/config/navigation.ts`), remover o comportamento de "Módulo em construção" nesse item e documentar em `docs/03` e `docs/17` §7; clicar no item raiz e confirmar a navegação sem toast

## 3. Design system e gráficos

- [x] 3.1 Criar as primitivas `UiChartBars`, `UiChartLine` e `UiChartHorizontalBars` em `app/components/ui/` com tokens do design system, legenda, `role="img"` e `aria-label` textual; verificar uso real na tela do painel
- [x] 3.2 Adicionar as seções correspondentes em `app/pages/design.vue` espelhando as primitivas e atualizar `docs/01 - design_system.md`; conferir visualmente em `http://localhost:3000/design`
- [x] 3.3 Revisar responsividade e acessibilidade do painel (320–1440px, sem overflow horizontal, foco/teclado nos controles, contraste e textos alternativos), sem bloco de fluxo; registrar a conferência no `docs/17` §4

## 4. Verificação integrada e documentação final

- [x] 4.1 Completar `docs/17 - Painel Executivo.md` (§1 visão, §2 escopo/não escopo, §5 gráficos, §8 estados, §9 desempenho, §10 testes, §11 limitações/roadmap) e revisar contra a implementação; conferir que nenhum indicador de governança/segurança/visualizações nem o bloco de fluxo entrou no v1
- [x] 4.2 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; todos devem passar
- [x] 4.3 Subir o app contra o MariaDB local e comparar os números do painel com consultas SQL diretas (releases publicadas, chamadas por mês, chamadas por publicação, KPIs de fluxo/recusa), incluindo o caso de chamada `Ambos`
- [x] 4.4 Percorrer manualmente `/admin` em 320, 768 e 1440px: seletor de ano (só anos com chamadas), alternância Mensal/Anual, troca de abas, loading/erro/vazio e navegação pelo item raiz; registrar o resultado no `docs/17` §10
