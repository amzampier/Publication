# 17 - Painel Executivo — Área Administrativa

**Versão:** 1.0.0 — **Data:** 2026-10-22 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela inicial da Área Administrativa (`/admin`) — visão consolidada do **ciclo editorial**:
Releases Week, Manuais, Escopos, Chamadas e Esteira de Revisão. Inclui KPIs, série mensal/anual de
publicações, chamadas lançadas x liberadas, tabela de chamadas por publicação e dimensões editoriais
(software, tipo, impacto).
**Arquivos-fonte:** [`app/pages/admin/index.vue`](../app/pages/admin/index.vue) →
[`app/components/painel/`](../app/components/painel) →
[`app/composables/usePainelExecutivo.ts`](../app/composables/usePainelExecutivo.ts) →
[`shared/painel-executivo.ts`](../shared/painel-executivo.ts) →
[`server/utils/painel-executivo.ts`](../server/utils/painel-executivo.ts) →
[`server/api/painel-executivo/index.get.ts`](../server/api/painel-executivo/index.get.ts)
**Design system:** [`/design`](../app/pages/design.vue) — `UiKpi` (seção 12), `UiSegmented` (seção 9),
`UiSelect` (seção 9), `UiBadge` (seção 4), `UiButton` (seção 3), `UiLoading` (seção 18) e os gráficos
`UiChartBars`/`UiChartLine`/`UiChartHorizontalBars` (seção 27).
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) §5.28
**Autoridade de comportamento:** `openspec/specs/painel-executivo` e
`openspec/specs/design-system/layout-navigation`

> Em caso de divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Escopo v1 e não escopo](#2-escopo-v1-e-não-escopo)
3. [Dicionário de métricas](#3-dicionário-de-métricas)
4. [Estrutura da página, responsividade e acessibilidade](#4-estrutura-da-página-responsividade-e-acessibilidade)
5. [Gráficos](#5-gráficos)
6. [Contrato da API](#6-contrato-da-api)
7. [Navegação e RBAC](#7-navegação-e-rbac)
8. [Estados: carregamento, erro e vazio](#8-estados-carregamento-erro-e-vazio)
9. [Desempenho e índices](#9-desempenho-e-índices)
10. [Testes e verificação](#10-testes-e-verificação)
11. [Limitações e roadmap](#11-limitações-e-roadmap)

---

## 1. Visão geral e rota

> **RL06-2:** `Publicado` conta como fluxo concluído (numerador e denominador) e as agregações usam índices de data/consulta agregada, sem materializar todas as chamadas.


- **Rota:** `/admin` → [`app/pages/admin/index.vue`](../app/pages/admin/index.vue) com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar).
- **Navegação:** item raiz **Painel Executivo** da sidebar (`app/config/navigation.ts`) declara
  `to: '/admin'`; o clique navega (sem toast de "Módulo em construção") e o item fica ativo com
  `aria-current="page"`.
- **Público:** usuários autenticados com `visualizar` em ao menos um dos módulos agregados
  (`release-week`, `manuais`, `escopo-projetos`, `lancar-chamadas`, `softwares` ou `parceiros`).
  Não há módulo RBAC novo, mas cada bloco exige a permissão do módulo de origem; sem nenhum módulo
  permitido, a API responde `403`.
- **Somente leitura:** o painel não cria, edita nem exclui registros; toda escrita continua nos
  módulos donos.
- **Período:** seletor de ano e ação **Atualizar**. O seletor lista apenas anos com ao menos uma
  chamada lançada; o ano inicial é o corrente quando ele tem chamadas, senão o mais recente com
  chamadas. Sem anos disponíveis, o seletor é omitido e a tela exibe o estado vazio. A troca de ano
  recarrega a API. Os KPIs de % de fluxo e taxa de recusa continuam usando o ciclo ativo global
  (mesma regra da tela da Esteira); o bloco visual de fluxo não é exibido.

## 2. Escopo v1 e não escopo

**Entra no v1**

- Releases Week, Manuais e Escopos como publicações do ano.
- Chamadas vinculadas (contagem por vínculo, classificação e cobertura temporal).
- KPIs de percentual do fluxo concluído e taxa de recusa (ciclo ativo global).
- Softwares, tipo e impacto como dimensões editoriais das chamadas.

**Não entra no v1**

- Usuários, perfis, auditoria, segurança, notificações e produtividade individual por autor.
- Visualizações/engajamento: `total_visualizacoes` ainda é 0 em todas as tabelas porque a Área
  Pública não existe; os contadores ficam para uma fase futura.
- Bloco visual de fluxo da esteira (aging, aguardando pai, no portal e tempo médio por estágio).
- Exportação PDF/CSV, filtros por período customizado, drill-down navegável e cache distribuído.

## 3. Dicionário de métricas

Definições normativas. O `ANO` é o ano selecionado; `HOJE` é a data civil local.

| Indicador | Fórmula / fonte | Observações |
|---|---|---|
| **Releases publicadas** | `COUNT(release_week)` com `status='Publicado'` e `data_publicacao` no ano | Inclui releases arquivadas (histórico) |
| **Chamadas lançadas** | `COUNT(entregas_itens)` com `data_lancamento` no ano | Independe de status |
| **Chamadas liberadas** | `COUNT(entregas_itens)` com `data_liberacao` no ano e `data_liberacao <= HOJE` | A data é herdada do pai na aprovação; pode ser futura |
| **% do fluxo concluído** | `(Aprovado + Publicar + Publicado) / total do universo com vínculo ativo` | Mesma regra de `#shared/esteira-revisao`; recusadas não entram no numerador |
| **Lead time médio** | `AVG(DATEDIFF(data_liberacao, data_lancamento))` das chamadas liberadas até hoje, com `data_liberacao >= data_lancamento` | Sem chamadas válidas, 0 |
| **Taxa de recusa** | `Recusado / total do universo com vínculo ativo` | Sem universo ativo, 0% |
| **Chamadas por publicação** | `COUNT(entregas_itens)` por `release_id`, `manual_id` e `projeto_id` | Ver ressalva de `Ambos` abaixo |
| **Progresso da publicação** | `(aprovado + publicar + publicado) / chamadas` daquela publicação | `publicar` = aguardando o pai; `publicado` = no portal; 0% quando não há chamadas |
| **Ranking de softwares** | `COUNT(DISTINCT chamada)` por software em `entregas_itens_softwares` (N:N), por `data_lancamento` no ano | Top 10 |
| **Tipo / impacto** | `COUNT(*)` por `tipo` e por `impacto`, por `data_lancamento` no ano | Enums do banco |

**Ressalvas obrigatórias**

- **`origem = Ambos`:** uma chamada pode ter `release_id` e `manual_id`. Ela aparece nas duas abas da
  tabela e a soma das abas **pode superar** o total de chamadas. Isso é esperado; não é duplicidade.
- **Data de liberação herdada:** a aprovação preenche `data_liberacao` com a `data_publicacao` do pai
  (Release/Manual/Escopo), que pode estar no futuro. Por isso a série de liberadas corta em `HOJE`.
- **Arquivadas:** entram no histórico de publicações do ano; não entram no ciclo operacional da
  Esteira (vínculo arquivado é inativo).
- **Ciclo ativo global:** o fluxo e a taxa de recusa não são filtrados pelo ano; refletem o mesmo
  ciclo da tela `/admin/esteira-revisao`.
- **`situacao` não existe mais** em `entregas_itens` (change `remover-situacao-entregas`); nenhum
  indicador usa esse campo.

## 4. Estrutura da página, responsividade e acessibilidade

```
/admin — Painel Executivo
+--------------------------------------------------------------------------+
| [ícone] Painel Executivo        Ano: [2026 v]        [Atualizar]         |
| Visão consolidada do ciclo editorial                                     |
+--------------------------------------------------------------------------+
| KPI Releases publicadas | Chamadas lançadas | Chamadas liberadas          |
|     % fluxo concluído   | Lead time médio    | Taxa de recusa             |
+--------------------------------------------------------------------------+
| Gráfico Publicações por mês/ano (barras empilhadas)                      |
+--------------------------------------------------------------------------+
| Gráfico Chamadas lançadas x liberadas (linha, 12 meses)                  |
+--------------------------------------------------------------------------+
| Tabela Chamadas por publicação [Release Week | Manuais | Escopo]         |
+--------------------------------------------------------------------------+
| Top softwares | Tipo | Impacto                                         |
+--------------------------------------------------------------------------+
```

O seletor de ano aparece apenas quando há anos com chamadas; sem anos, o topo exibe o estado vazio
e a tela não renderiza números. O bloco de fluxo da esteira não faz parte do layout.

- **Container:** `mx-auto max-w-[85rem]` dentro de `p-4 sm:p-6 lg:px-1 lg:py-8`.
- **KPIs:** grade `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` ou `xl:grid-cols-6`; valores em
  `UiKpi` com `font-mono tabular-nums`.
- **Gráficos:** dois por linha em `xl`, empilhados abaixo; a tabela ocupa a largura toda.
- **Responsividade (320–1440px):** sem overflow horizontal na página; os gráficos usam colunas
  flexíveis e rótulos curtos; a tabela rola internamente (`overflow-x-auto`) quando necessário.
- **Acessibilidade:** controles nativos do kit (foco/teclado), `aria-label` nos gráficos, legenda
  textual com valores, contraste dos tokens e estados vazios anunciados. O seletor de ano é
  `UiSelect`; a alternância Mensal/Anual é `UiSegmented`.

## 5. Gráficos

### 5.1 Publicações (Mensal/Anual)

- **Mensal:** 12 colunas (jan–dez) com Releases Week empilhadas por status (`Aberta`, `Em Revisão`,
  `Aprovado`, `Publicado`), eixo por `data_publicacao`. Meses sem dados aparecem com zero.
- **Anual:** últimos cinco anos com a contagem de releases publicadas.
- **Cores:** `Aberta` `#0364f7`, `Em Revisão` `#f59e0b`, `Aprovado` `#1a9e07`, `Publicado` `#112051`.
- **Componente:** `UiChartBars` (empilhado) com legenda e `aria-label` contendo os totais.
- **Vazio:** "Nenhuma publicação no período." sem quebrar o layout.

### 5.2 Chamadas lançadas x liberadas

- Duas séries no eixo mensal do ano: lançadas (`data_lancamento`) e liberadas
  (`data_liberacao <= HOJE`).
- **Cores:** lançadas `#0364f7`; liberadas `#1a9e07`.
- **Componente:** `UiChartLine`, com legenda, pontos e `aria-label` com os totais.
- **Nota visível:** a data de liberação é herdada do conteúdo pai e pode representar uma liberação
  prevista; o KPI de liberadas corta em hoje.

### 5.3 Rankings

- **Top softwares:** `UiChartHorizontalBars` com até 10 itens.
- **Tipo/Impacto:** `UiChartHorizontalBars` com as contagens do ano.
- **Cores:** software `#0364f7`, tipo `#8b5cf6`, impacto `#f59e0b`.
- **Vazio:** "Sem dados no período." por bloco.
- O bloco visual de fluxo da esteira (aging, aguardando pai, no portal e tempo médio por estágio) não
  é renderizado no v1.

## 6. Contrato da API

`GET /api/painel-executivo?ano=AAAA`

- **Sessão:** obrigatória (`401` sem sessão). Acesso com `visualizar` em ao menos um módulo
  agregado; sem nenhum, `403`. Cada bloco respeita o módulo de origem. Sob saturação da fila do
  pool, responde `503` com `Retry-After` em vez de `500`.
- **`ano`:** opcional; ausente = ano corrente quando ele tem chamadas, senão o mais recente com
  chamadas (sem chamadas, o ano corrente). Precisa ter quatro dígitos (`1900`–`2999`); inválido →
  `400` sem consultar o banco. A resposta devolve o ano efetivamente usado em `periodo.ano` e a lista
  `anosDisponiveis` (somente anos com chamadas lançadas, em ordem decrescente).
- **Cache:** nenhum no v1.

Resposta (`200`):

```ts
interface PainelExecutivo {
  periodo: { ano: number; inicio: string; fim: string; hoje: string; rotulo: string }
  anosDisponiveis: number[]
  kpis: {
    releasesPublicadas: number
    chamadasLancadas: number
    chamadasLiberadas: number
    percentualFluxo: number      // 0..100
    leadTimeMedioDias: number
    taxaRecusa: number           // 0..100
  }
  serieMensal: Array<{
    mes: number
    rotulo: string
    releases: { aberta: number; emRevisao: number; aprovado: number; publicado: number }
    chamadasLancadas: number
    chamadasLiberadas: number
  }>
  serieAnual: Array<{ ano: number; publicadas: number }>
  porPublicacao: {
    releases: PublicacaoPainel[]
    manuais: PublicacaoPainel[]
    escopos: PublicacaoPainel[]
  }
  porSoftware: Array<{ rotulo: string; total: number }>
  porTipo: Array<{ rotulo: string; total: number }>
  porImpacto: Array<{ rotulo: string; total: number }>
}

interface PublicacaoPainel {
  id: string
  codigo: string
  nome: string
  dataPublicacao: string      // AAAA-MM-DD ou ''
  status: string
  arquivada: boolean
  chamadas: number
  revisar: number
  aprovado: number
  recusado: number
  publicar: number
  percentualFluxo: number
}
```

As agregações rodam no servidor, em paralelo, com queries parametrizadas. As datas usam faixas
(`>= início do ano AND < início do próximo ano`), e não `YEAR(coluna)`, para aproveitar índices
quando existirem.

## 7. Navegação e RBAC

- O item raiz da sidebar (`itemRaiz`) declara `to: '/admin'`; o `AppSidebar` já navega e marca
  `aria-current="page"`.
- O item raiz continua sem módulo próprio (conforme `design-system/layout-navigation`), mas o
  conteúdo é filtrado por bloco: publicações exigem `visualizar` do módulo correspondente;
  chamadas, séries e dimensões exigem `lancar-chamadas`/`visualizar`; softwares exigem
  `softwares`/`visualizar`.
- Sem nenhum módulo agregado, a API responde `403` e a tela exibe o estado de acesso negado.

## 8. Estados: carregamento, erro e vazio

- **Carga inicial:** `UiLoading` cobre o conteúdo até a API responder; nenhum número parcial é
  exibido.
- **Troca de ano/Atualizar:** o seletor permanece utilizável; a tela recarrega e substitui os dados.
- **Falha:** toast de erro e **zera** KPIs, séries e tabelas (nada da carga anterior permanece). O
  painel exibe os estados vazios dos blocos.
- **Vazio por bloco:** publicações ("Nenhuma publicação no período."), chamadas ("Nenhuma chamada
  lançada no período.") e rankings ("Sem dados no período."). Sem anos com chamadas, o seletor é
  omitido e a tela exibe o estado vazio.

## 9. Desempenho e índices

- A API executa uma consulta de anos disponíveis e 12 consultas agregadas em paralelo (a consulta
  de itens do ciclo ativo também alimenta os KPIs de fluxo/recusa); o volume do v1 é baixo.
- `release_week.data_publicacao` usa `idx_rel_publicacao`; `manuais_mensal.ano` usa
  `idx_manuais_ano_mes`; `projetos_escopo.ano` usa `idx_proj_ano`.
- **Limitação conhecida:** `entregas_itens.data_lancamento` e `data_liberacao` não têm índice
  dedicado. O `EXPLAIN` mostra varredura da tabela de chamadas para as séries e rankings. No volume
  atual é aceitável; se o volume crescer, avaliar um índice composto (ex.:
  `(data_lancamento, status)`) em change própria.
- Sem cache no v1 para não exibir números defasados em uma tela de decisão.
- `dados` não é paginado: o painel é uma visão consolidada, não uma listagem.

## 10. Testes e verificação

- **Gates:** `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- **Unitários:** [`tests/painel-executivo.test.ts`](../tests/painel-executivo.test.ts) cobre:
  12 meses com zeros, série anual de cinco anos, percentual do fluxo igual ao da Esteira, lead time
  só de liberadas, taxa de recusa com total zero, dupla contagem de vínculos e aging.
- **API/E2E:** `GET /api/painel-executivo` `200` com todos os blocos e `anosDisponiveis`; `400` para
  `ano=abc`; `401` sem sessão; comparação dos números com SQL direto (releases publicadas, chamadas
  por mês, chamadas por publicação e KPIs de fluxo/recusa), incluindo uma chamada de origem `Ambos`.
- **Manual:** `/admin` em 320, 768 e 1440px; seletor de ano apenas com anos que têm chamadas,
  Mensal/Anual, abas da tabela, loading/erro/vazio e navegação pelo item raiz; conferência visual de
  `/design` seção 27.
- **Registro da verificação:** executar os gates e a conferência acima; os números do painel devem
  bater com as consultas SQL do §3.

**Verificação executada em 2026-10-22 (ambiente local com MariaDB):**

- `GET /api/painel-executivo` sem `ano` → `2026`, `anosDisponiveis: [2026]`.
- KPIs: releases publicadas `0`, chamadas lançadas `4`, liberadas `1`, fluxo `75%`, lead time `0 d`,
  recusa `0%`.
- Chamadas por publicação: `RW-43/2026` 2, `RW-44/2026` 1, `MAN-10/2026` 2,
  `PE-2026.01` 0; a chamada `0000580110` (origem `Ambos`) aparece em Release Week e Manuais.
- Navegador headless: `/admin` sem "Fluxo da esteira"; seletor com apenas `2026`;
  Mensal/Anual alterna; abas Release/Manuais trocam a tabela; `scrollWidth == innerWidth` em 1440,
  768 e 320px.
- Gates: `npm run lint`, `npm run test` (243), `npm run typecheck` e `npm run build`.

## 11. Limitações e roadmap

- **Visualizações/engajamento:** fora do v1; dependem da Área Pública.
- **Bloco visual de fluxo da esteira** (aging, aguardando pai, no portal e tempo médio por estágio):
  fora do v1; os KPIs de fluxo/recusa permanecem.
- **Cobertura editorial** (chamadas com manual/vídeo/imagem/solução): não entrou no v1.
- **Exportação** PDF/CSV e **filtros de período** (mês/data): roadmap.
- **Produtividade por autor:** fora do v1 (indicador sensível).
- **Índice de datas de chamadas:** avaliar migration própria se o volume crescer.
- **Drill-down:** o painel é somente leitura; a navegação para os módulos pode ser adicionada depois.
- **Cache:** se necessário, curto e com invalidação nas escritas, sem perder a semântica de "HOJE".
