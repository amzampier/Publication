# Proposal

## Why

`/admin` hoje é um placeholder ("indicadores e telas serão exibidos aqui") e o item raiz **Painel
Executivo** nem navega para ele. Cada módulo tem seus próprios KPIs, mas não existe uma visão
consolidada do ciclo editorial para responder às decisões de liberação: quantas Releases Week saem
por mês/ano, quantas chamadas cada publicação carrega, como o fluxo da esteira está andando e qual é
o lead time/recusa. O Painel Executivo v1 fecha essa lacuna sem esperar a Área Pública.

## What Changes

- Substitui o placeholder de `/admin` por um painel executivo do **ciclo editorial**: Release Week,
  Manuais, Escopos, Chamadas e Esteira.
- Adiciona KPIs consolidados, gráfico mensal/anual de publicações, série de chamadas lançadas x
  liberadas, tabela de chamadas por publicação e rankings de software, tipo e impacto.
- Cria `GET /api/painel-executivo`, com agregações no servidor, sob sessão autenticada, **sem novo
  módulo RBAC** (o item raiz é sempre visível pela spec de navegação).
- Cria primitivas de gráfico no kit (`UiChartBars`, `UiChartLine`, `UiChartHorizontalBars`), espelhadas
  em `/design` e documentadas no `docs/01`.
- Faz o item raiz da sidebar navegar para `/admin` (hoje exibe "Módulo em construção") e limita o
  seletor de ano aos anos que têm chamadas lançadas, sem anos vazios anteriores ou posteriores.
- Documenta o painel em `docs/17 - Painel Executivo.md` e atualiza `docs/03`/`docs/01`.
- **Não** inclui usuários, perfis, auditoria/segurança, notificações, produtividade por autor,
  visualizações/engajamento (contadores ainda são 0 sem Área Pública) nem o bloco visual de fluxo da
  esteira (aging, aguardando pai, no portal e tempo médio por estágio).

## Capabilities

### New Capabilities

- `painel-executivo`: visão consolidada do ciclo editorial, com KPIs, séries temporais, tabela de
  chamadas por publicação e dimensões de software/tipo/impacto, servida por uma API de agregação e
  renderizada em `/admin`.

### Modified Capabilities

- `design-system/layout-navigation`: a tela inicial em `/admin` deixa de exibir o placeholder e passa
  a renderizar o Painel Executivo; o item raiz da sidebar passa a navegar para a rota.

## Impact

- **App:** `app/pages/admin/index.vue` (substituição), novo `app/components/painel/*`, novo
  `app/composables/usePainelExecutivo.ts`, componentes de gráfico em `app/components/ui/`, ajuste em
  `app/config/navigation.ts` e em `app/pages/design.vue`.
- **Server:** novo `server/api/painel-executivo/index.get.ts` e `server/utils/painel-executivo.ts`.
- **Shared:** novo `shared/painel-executivo.ts` com tipos e funções puras de agregação/formatação.
- **Banco:** nenhuma migration; usa os índices existentes (`idx_entregas_*`, `idx_rel_publicacao`,
  `idx_manuais_ano_mes`) e agrega no servidor.
- **Testes:** novo `tests/painel-executivo.test.ts` para séries, KPIs, percentual de fluxo, lead time
  e definições; verificação E2E dos estados e números contra o banco.
- **Docs:** novo `docs/17 - Painel Executivo.md`; atualizações em `docs/01`, `docs/03` e spec
  `design-system/layout-navigation`.
- **Dependências:** nenhuma nova (gráficos em SVG/CSS).
- **Compatibilidade:** sem breaking changes; nenhuma rota ou contrato existente muda.
