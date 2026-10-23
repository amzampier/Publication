# 16 - Módulo Esteira de Revisão — Área Administrativa

**Versão:** 1.1.0 — **Data:** 2026-10-22 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal da **Esteira de Revisão** — board de homologação das chamadas de Release
Week, Manuais e Escopo de Projetos, painel compacto **Progresso da Esteira**, card de origem, KPIs, busca,
filtros rápidos/avançados, cards por estágio, detalhe com contexto e histórico, e transições de
aprovar, recusar, reabrir, publicar e suspender com parecer e critérios.
**Arquivos-fonte:** [`app/pages/admin/esteira-revisao.vue`](../app/pages/admin/esteira-revisao.vue) ·
[`app/components/esteira/`](../app/components/esteira) ·
[`server/api/esteira-revisao/`](../server/api/esteira-revisao) ·
[`server/utils/esteira-revisao.ts`](../server/utils/esteira-revisao.ts) ·
[`server/utils/historico-esteira.ts`](../server/utils/historico-esteira.ts) ·
[`shared/esteira-revisao.ts`](../shared/esteira-revisao.ts) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Design system:** [`/design`](../app/pages/design.vue) — `UiSegmented` (seção 9), `UiModal`/
`UiModalSection` (seção 15), `UiBadge` (seção 4), `UiSelect` (seção 9), `UiTextarea` (seção 19),
`UiCheckbox` (seção 11) e `UiButton` (seção 3).
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) (§5.27, §5.12, §5.15).
**Autoridade de comportamento:** `openspec/specs/esteira-revisao` (delta da change
`construir-esteira-revisao`) + deltas de `lancar-chamadas` e `perfis-acesso`.

> Este documento é a referência da tela `/admin/esteira-revisao`, da API e do histórico. Em caso de
> divergência com a spec, a spec prevalece.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Contrato de dados (API)](#4-contrato-de-dados-api)
5. [Regras do fluxo](#5-regras-do-fluxo)
6. [Progresso da Esteira](#6-progresso-da-esteira)
7. [Navegação, RBAC e auditoria](#7-navegação-rbac-e-auditoria)
8. [Testes e verificação](#8-testes-e-verificação)
9. [Pendências e próximos passos](#9-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A Esteira de Revisão é a **dona do fluxo de homologação** das chamadas de `entregas_itens`. Ela
reúne, em um board visual, os itens cujo conteúdo pai (Release Week, Manual ou Escopo de Projetos)
ainda está ativo — **não arquivado** —, exceto os itens em `Publicado` (ocultos por padrão, pois já
estão no portal, mas consultáveis ao filtrar o vínculo publicado), com o objetivo de revisar,
homologar, publicar ou recusar cada chamada com parecer e trilha imutável.

- **Rota:** `/admin/esteira-revisao` → `app/pages/admin/esteira-revisao.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Processo:** `1. Revisar → 2. Aprovado → 3. Publicar/Publicado`, com a exceção **Recusado**
  (correção) e as ações de reabertura/suspensão.
- **Persistência:** `entregas_itens` (status
  `Revisar`/`Aprovado`/`Recusado`/`Publicar`/`Publicado`) e `historico_esteira_revisao` (transições).
  A migration `29_status_publicado_cascata.sql` amplia o enum e cura as chamadas antigas.
- **Conteúdo pai:** `release_week`, `manuais_mensal` e `projetos_escopo` fornecem contexto, filtro de
  origem e o universo ativo. O status editorial do pai é independente do status da chamada.
- **Status do pai:** ao criar, importar ou trocar vínculos em Lançar as Chamadas, o pai vinculado
  passa automaticamente para `Em Revisão` (Release/Manual) ou `Homologação` (Escopo), inclusive se
  estava `Aprovado`/`Publicado`; as filhas em `Publicado` sem outro pai publicado voltam para
  `Publicar`.
- **Vínculos permitidos:** o formulário de Lançar as Chamadas só oferece Release Week em
  `Aberta`/`Em Revisão`, Manuais em `Rascunho`/`Em Revisão` e Escopo em `Em Andamento`/`Homologação`.
- **Visibilidade pública:** um item em `Publicado` aparece na Área Pública quando ao menos um vínculo
  ativo aponta para conteúdo pai `Publicado` e não arquivado; `Publicar` mostra **Aguardando pai** e
  mantém "No Portal" desabilitado. Quando o pai é publicado, a cascata promove as filhas em `Publicar`
  para `Publicado`; ao filtrar o vínculo publicado (Release Week, Manual ou Escopo), elas reaparecem
  na coluna Publicados com "No Portal" habilitado.
- **Navegação:** item **Esteira de Revisão** na sessão **Movimentos** da sidebar
  (`app/config/navigation.ts`), com `to: '/admin/esteira-revisao'` e `aria-current="page"`.
- **Ver Portal Público:** ícone `Globe` no header global (ao lado esquerdo das notificações), visível
  na rota da Esteira, abre a Área Pública (`/`) em nova aba.
- **Fora de escopo (fase 2):** bloquear a publicação do conteúdo pai enquanto houver chamada em
  `Revisar`/`Recusado`; definir a semântica de `arquivar` na esteira; preencher
  `revisor_id`/`revisor_feedback` no pai; seleção/ações em lote; notificações; exportação PDF/CSV.

## 2. Estrutura da página (componentização)

```text
admin/esteira-revisao.vue                       (page — definePageMeta + coordenação)
├── <EsteiraCabecalho />                          → tile Workflow #8b5cf6 + título + subtítulo
├── <EsteiraKpis class="mt-4" />                  → 4 UiKpi do conjunto filtrado
├── <EsteiraBoard
│       @detalhes @aprovar @recusar @reabrir
│       @publicar @suspender @open-filters />     → barra de ferramentas (busca + Pacote + Filtros)
│                                                   + segunda faixa (Demandas por origem + Progresso)
│                                                   + 3 colunas + faixa de recusadas
├── <EsteiraFiltros v-model="filtrosAbertos" />   → modal de filtros avançados
├── <EsteiraDetalhe v-model :item />              → modal xl + histórico
└── <EsteiraDecisao v-model :item :acao @confirmar /> → modal de aprovar/recusar/reabrir/publicar/suspender
```

- **Estado de coordenação:** `carregando`, `filtrosAbertos`, `detalheAberto`/`itemDetalhe`,
  `decisaoAberta`/`itemDecisao`/`acaoDecisao`. A página resolve o item completo por `id` no modelo
  antes de abrir cada modal.
- **Loading:** no F5 a tela exibe `UiLoading` ("Carregando a Esteira de Revisão...") enquanto o
  `GET /api/esteira-revisao` responde; em falha, toast de erro e board vazio.
- **Largura:** container `mx-auto max-w-[85rem]` dentro do padding `p-4 sm:p-6 lg:p-1 lg:py-8`.
- **Auto-import:** o diretório `app/components/esteira/` gera os prefixos `Esteira*`
  (`EsteiraCabecalho`, `EsteiraProgresso`, `EsteiraKpis`, `EsteiraBoard`, `EsteiraChamadaCard`,
  `EsteiraFiltros`, `EsteiraDetalhe`, `EsteiraHistorico`, `EsteiraDecisao`).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<EsteiraCabecalho>`

- Cabeçalho sem container: tile `bg-brand-primary` com `Workflow` em `#8b5cf6`, título
  "Esteira de Revisão" e subtítulo com o processo `1. Revisar → 2. Aprovado → 3. Publicar/Publicado`.
  O bloco de usuário e o botão "Ver Portal Público" não ficam mais aqui; o acesso ao portal é o
  ícone `Globe` do header global.
- O cabeçalho não renderiza mais o progresso nem as origens; eles ficam na barra de ferramentas do
  board.

### 3.2 `Progresso.vue` → `<EsteiraProgresso>`

- Painel **compacto**, na segunda faixa da barra de ferramentas, ao lado de **Demandas por origem**
  (`lg:grid-cols-[1fr_20rem]`). Em telas estreitas, empilha.
- Estrutura: `rounded-lg border border-slate-200 bg-white p-3 shadow-xs`; rótulo "Progresso" em
  versalete; **percentual em `text-lg`** (não é mais o número grande anterior); contagens
  **a revisar**, **aprov.**, **aguard.** e **no portal** em linha com pontos coloridos; barra
  `h-1.5`; rodapé com `revisado/total` e acionador de **recusadas**.
- **Percentual do fluxo:** `(Aprovado + Publicar) / total do ciclo ativo`; recusadas e `Publicado`
  não entram no numerador. `Publicado` aparece como contagem informativa **no portal**.
- **Barra segmentada:** cores sólidas — Revisar `#f59e0b`, Aprovado `#1a9e07`, Publicar `#0364f7`,
  Publicado `#112051` (contagem informativa) e Recusado `rose-700` `#be123c`; **sem degradê**.
- A trilha expõe `role="progressbar"` com `aria-valuenow` (percentual do fluxo), `aria-valuemin="0"`,
  `aria-valuemax="100"` e `aria-label` textual com as contagens.
- O painel é **global** (não segue os filtros do board).
- Com total zero, exibe "Nenhuma chamada no fluxo." e não calcula percentuais.

### 3.2.1 `Kpis.vue` → `<EsteiraKpis>`

- Fileira de 4 `UiKpi` do conjunto filtrado: **No filtro** (`#0364f7`, `ListFilter`), **Em revisão**
  (`#f59e0b`, `Clock`), **Aprovadas** (`#1a9e07`, `ShieldCheck`) e **Recusadas** (`#be123c`,
  `XCircle`), no topo da página, acima da barra de ferramentas e do progresso.

### 3.3 `Board.vue` → `<EsteiraBoard>`

- **Barra de ferramentas no padrão das demais telas:** card branco `rounded-xl border
  border-slate-200 shadow-xs` com ícone `FileSpreadsheet`, título "Chamadas da esteira", subtítulo,
  campo de busca (gate `buscar`), seletor **Pacote de Origem** (releases/manuais/projetos não
  arquivados, inclusive publicados — selecionar um publicado revela as chamadas em `Publicar` daquele
  vínculo) **à esquerda do botão Filtros** (gate `filtrar`, com badge de critérios ativos) e o ícone
  `X` para limpar filtros e busca.
- **Segunda faixa (onde ficavam os filtros rápidos):** à esquerda, o card **Demandas por origem**
  com o `UiSegmented` compacto (Todas, Releases, Manuais, Escopo) e as contagens globais; à direita,
  o painel compacto de progresso.
- **Software Atendido** e **Parceiro / Cliente** ficam **dentro do modal de Filtros**, junto de
  Status, Origem, Tipo, Impacto, vínculos e períodos.
- **Três colunas:**
  - **1. Em Revisão** (`Revisar`) — "Chamadas aguardando homologação do Revisor / QA";
  - **2. Aprovado** (`Aprovado`) — "Validadas pelo QA, prontas para publicação";
  - **3. Publicados** (`Publicar` e `Publicado`) — "Aguardando o pai ou já visíveis no portal; filtre
    o vínculo para consultar". Por padrão, mostra só o que aguarda o pai; ao filtrar um vínculo
    publicado, inclui as chamadas já visíveis no portal (`Publicado`), com "No Portal" habilitado.
  Cada coluna tem o **cabeçalho com o mesmo background do header dos modais**
  (`bg-gradient-to-r from-brand-primary to-brand-structure`), texto branco, borda esquerda de `2.5px`
  na cor do estágio (`#f59e0b`, `#1a9e07`, `#0364f7`) e contagem em pílula `bg-white/15`. Em telas
  estreitas as colunas empilham.
- **Faixa de recusadas:** seção separada, exibida sob demanda pelo painel, com o mesmo cabeçalho em
  degradê e borda esquerda `rose-700`; contém os cards `Recusado` e a ação Reabrir.
- **Estados vazios:** "Nenhuma chamada nesta etapa." por coluna e "Nenhuma chamada no fluxo."/
  "Nenhum resultado encontrado para o filtro." no board.
- **Seleção em lote:** o mock de referência mostra "Selecionar todos"; essa ação fica para a fase 2.

### 3.4 `ChamadaCard.vue` → `<EsteiraChamadaCard>`

- Card branco `rounded-xl border border-slate-200 p-3.5 shadow-xs` com:
  - origem em `UiBadge` (Release Week/Manual/Escopo/Ambos) e código do vínculo em `font-mono`;
  - contador de imagens de evidência (quando houver);
  - chamada em `font-mono`, software e parceiro;
  - título, resumo da descrição (`line-clamp-3`) e tags (até três + `+N`);
  - **ações somente com ícones, alinhadas à direita** no rodapé, com tooltip e `aria-label`:
    - **Em Revisão:** `Eye` (Inspecionar), `ShieldCheck` (Aprovar) e `XCircle` (Recusar);
    - **Aprovado:** `Undo2` (Voltar p/ Revisão) e `UploadCloud` (Publicar Item);
    - **Publicados:** `ArchiveRestore` (Suspender p/ Homologado) e `ExternalLink` (No Portal); o card
      em `Publicar` mantém "Aguardando pai" e "No Portal" desabilitado; o card em `Publicado` habilita
      "No Portal".
    - **Recusadas:** `Eye` (Inspecionar) e `Undo2` (Reabrir).
- **No Portal** abre a Área Pública (`/`) em nova aba; fica desabilitado enquanto o item está em
  `Publicar`. Com a promoção a `Publicado`, o item sai do board por padrão, mas reaparece com "No
  Portal" habilitado quando o vínculo publicado é filtrado.

### 3.5 `Filtros.vue` → `<EsteiraFiltros>`

- `UiModal size="lg"` com três colunas a partir de `sm` e `UiModalSection` para **Status**,
  **Origem**, **Tipo**, **Impacto**, **Release Week**, **Manual**, **Escopo de Projetos**,
  **Software**, **Parceiro**, **Período de lançamento** (De/Até) e **Período de liberação** (De/Até).
- **Software Atendido** e **Parceiro / Cliente** ficam neste modal, não na barra de ferramentas.
- `UiSelect` para seleção única e `UiDatePicker` para os períodos; vazio = todos.
- Os vínculos específicos combinam por **união**: ao selecionar Release Week + Manual (ou Escopo), o
  board traz as chamadas vinculadas a qualquer um deles, incluindo as já publicadas.
- "Aplicar" refina o board; "Limpar Filtros" zera rascunho e estado; "Cancelar" fecha sem aplicar.
- A toolbar indica a quantidade de filtros ativos (`criteriosAtivosCount`).

### 3.6 `Detalhe.vue` → `<EsteiraDetalhe>`

- `UiModal size="xl"` somente leitura com as seções:
  - **Identificação:** chamada, título, status, origem, lançamento, liberação, autor, revisor e
    última decisão;
  - **Vínculos:** Release Week, Manual e Escopo de Projetos com código, nome e status do pai;
  - **Classificação:** parceiro, softwares, módulo, menu, tipo, impacto e tags;
  - **Conteúdo:** descrição e solução com `UiRichTextViewer`, título do manual e links;
  - **Imagens:** grade de miniaturas com link para a imagem, a partir de `imagens` (lista derivada de `anexos_midias`, com fallback ao JSON legado);
  - **Histórico da esteira:** `<EsteiraHistorico>`;
  - **Informações de cadastro:** criado/atualizado.
- Ao abrir, carrega `GET /api/esteira-revisao/:id/historico` (cache por item no modelo; invalidado
  após uma transição).
- Fecha por `Escape`, pelo `X` do `UiModal` ou por "Fechar", devolvendo o foco ao acionador.

### 3.7 `Historico.vue` → `<EsteiraHistorico>`

- Timeline do mais recente para o mais antigo (a transição atual fica primeiro), com badges de status
  anterior/novo, data/hora, responsável, perfil, parecer (quando houver), critérios de aceite
  (atendidos/não atendidos) e tempo no estágio (min/h).
- Estados de carregamento e "Nenhuma transição registrada para esta chamada.".

### 3.8 `Decisao.vue` → `<EsteiraDecisao>`

- Modal único para **Aprovar**, **Recusar**, **Reabrir**, **Publicar Item** e **Suspender**, com
  título, subtítulo e ícone variando por ação.
- **Aprovar:** checkbox "Confirmo que os critérios de aceite foram atendidos" obrigatório e parecer
  opcional.
- **Recusar:** `UiTextarea` de parecer **obrigatório** (erro canônico em `rose-700`); critérios
  gravados como não atendidos.
- **Reabrir:** parecer opcional; a chamada volta a `Revisar` e a `data_liberacao` é limpa.
- **Publicar Item:** parecer opcional; o item homologado passa a `Publicar`. Se ao menos um vínculo
  ativo já está `Publicado`, passa diretamente a `Publicado` e fica visível no portal; sem pai
  publicado, permanece em "Aguardando pai".
- **Suspender:** parecer opcional; o item volta de `Publicar` ou `Publicado` para `Aprovado`.
- O botão de confirmação fica desabilitado quando a validação falha ou o checkbox de critérios não
  está marcado. Emite `confirmar({ acao, parecer, criterios })`.

### 3.9 `useEsteiraRevisaoModelo.ts`

- `useState` para `esteira-itens`, `esteira-opcoes`, `esteira-carregando`, `esteira-carregado`,
  `esteira-busca`, `esteira-filtros`, `esteira-mostrar-recusadas`, `esteira-historico` e
  `esteira-historico-carregando`.
- `carregar(forcar)` → `GET /api/esteira-revisao` (com `?busca=1`/`?filtros=1` quando aplicável);
  hidrata itens, opções e progresso.
- Derivados: `itensCiclo` (exclui `Publicado` e `Publicar` com pai publicado), `itensFiltrados`
  (ciclo + filtros + busca; ao filtrar um vínculo, inclui os itens `Publicado` daquele vínculo),
  `linhas` (shape dos cards), `progresso` (global do universo com vínculo ativo, calculado por
  `calcularProgresso`), `contagemPorOrigem`, `contagemPorStatus`, `filtrosAtivosCount`,
  `criteriosAtivosCount`, `opcoesFiltro`, `opcoesPacotes`, `pacoteSelecionado` e `aplicarPacote`.
- `limparFiltros`, `filtrarPorOrigem`, `alternarRecusadas`, `resolver(id)`,
  `carregarHistorico(id, forcar)`.
- Ações `aprovar`, `recusar`, `reabrir`, `publicar` e `suspender` chamam as rotas da esteira,
  atualizam o item na lista, recalculam o painel e invalidam o cache do histórico. O item promovido a
  `Publicado` sai do board por padrão, mas continua disponível para consulta ao filtrar o vínculo.

## 4. Contrato de dados (API)

| Ação | Método e rota | Permissão |
|---|---|---|
| Listar board + opções + progresso | `GET /api/esteira-revisao` | `visualizar`; `buscar`/`filtrar` via `?busca=1`/`?filtros=1` |
| Detalhe | `GET /api/esteira-revisao/:id` | `visualizar` |
| Histórico | `GET /api/esteira-revisao/:id/historico` | `visualizar` |
| Aprovar | `PUT /api/esteira-revisao/:id/aprovar` | `publicar` |
| Recusar | `PUT /api/esteira-revisao/:id/recusar` | `alterar` |
| Reabrir | `PUT /api/esteira-revisao/:id/reabrir` | `alterar` |
| Publicar Item | `PUT /api/esteira-revisao/:id/publicar` | `publicar` |
| Suspender | `PUT /api/esteira-revisao/:id/suspender` | `publicar` |

- **Listagem:** `{ itens, opcoes, progresso }` — `itens` são as chamadas com ao menos um vínculo não
  arquivado (inclusive as em `Publicado`, para consulta por filtro), com `contexto`
  (release/manual/projeto), `revisorId`, `revisorNome`, `dataDecisao` e `parecer`; `opcoes` traz
  releases, manuais, projetos, softwares e parceiros ativos; `progresso` segue o contrato de
  `shared/esteira-revisao` e considera o ciclo ativo (sem `Publicado`, com contagem informativa).
- **Transições:** aceitam `{ parecer?, criterios? }`; `recusar` exige `parecer` não vazio. `publicar`
  grava `Publicado` quando algum vínculo ativo já está `Publicado`; senão, `Publicar`.
- **Cascata:** publicar/reabrir um conteúdo pai grava histórico por filha e auditoria única no pai.
- **Erros:** `401` sem sessão, `403` sem permissão, `404` id inexistente, `409` status incompatível
  ou concorrência.
- **Auditoria:** as transições registram recurso **"Esteira de Revisão"**, ação `Homologação`
  (aprovar/publicar) ou `Alteração` (recusar/reabrir/suspender), com o id da chamada.
- **Histórico:** `historico_esteira_revisao` com status anterior/novo, responsável (id, nome,
  perfil), parecer, critérios, tempo no estágio e data/hora.

## 5. Regras do fluxo

```text
          +------------+
          |  REVISAR   |
          +------------+
            |        |
   aprovar  |        |  recusar (parecer obrigatório)
 (publicar) |        |  (alterar)
            v        v
     +------------+  +------------+
     |  APROVADO  |  |  RECUSADO  |
     +------------+  +------------+
        |      |          |
 publicar|      | reabrir  | reabrir
 (publicar)     | (alterar)|
        v      |          |
  +------------+ |          |
  | PUBLICAR   | |          |
  +------------+ |          |
        |        |          |
 suspender      +----------+
 (publicar)                |
        v                  v
  +------------+      +------------+
  |  APROVADO  |      |  REVISAR   |
  +------------+      +------------+
```

- **Aprovar:** só de `Revisar`; preserva a `data_liberacao` existente e herda a `data_publicacao` do
  conteúdo pai (Release Week, Manual ou Escopo, nesta ordem) somente quando estiver vazia; grava
  `criterios_aceite_atendidos = 1`.
- **Recusar:** só de `Revisar`; parecer obrigatório; não altera `data_liberacao`; grava
  `criterios_aceite_atendidos = 0`.
- **Reabrir:** de `Aprovado` ou `Recusado`; volta para `Revisar`; **limpa** `data_liberacao`; grava
  `criterios_aceite_atendidos = 0`.
- **Publicar Item:** de `Aprovado`; passa para `Publicado` quando ao menos um vínculo ativo já está
  `Publicado`, senão para `Publicar`; preserva `data_liberacao`; grava
  `criterios_aceite_atendidos = 1`.
- **Suspender:** de `Publicar` ou `Publicado`; volta para `Aprovado`; preserva `data_liberacao`; grava
  `criterios_aceite_atendidos = 1`.
- **Atomicidade:** o update condicionado ao status lido e o insert do histórico ocorrem na mesma
  transação; se outra pessoa mudou o status, a API responde `409` e o board é atualizado.
- **Lançar as Chamadas:** as ações de aprovar/recusar/desaprovar usam a mesma transição de domínio,
  gravam o mesmo histórico e mantêm a auditoria no recurso "Lançar as Chamadas". Publicar/Suspender
  ficam na Esteira.
- **Imutabilidade:** o histórico não é editado nem apagado por ações da esteira.
- **Visibilidade pública:** o item em `Publicado` só é visível na Área Pública quando ao menos um
  vínculo ativo aponta para conteúdo pai `Publicado`. `Publicar` não é visível: a ação "No Portal"
  fica desabilitada com o motivo "Aguardando publicação do conteúdo pai" e o card exibe "Aguardando
  pai". Quando o pai é publicado, a cascata promove as filhas em `Publicar` para `Publicado`; ao
  filtrar o vínculo publicado, elas reaparecem em Publicados com "No Portal" habilitado.
- **Cascata do conteúdo pai:** publicar uma Release Week, Manual ou Escopo grava o histórico de cada
  filha em `Publicar` → `Publicado` e auditoria única no pai. Reabrir o pai devolve para `Publicar` as
  filhas em `Publicado` que não tenham outro vínculo ativo publicado.
- **Publicar o item não publica o conteúdo pai:** o gate de publicação do pai (bloquear a publicação
  enquanto houver itens em `Revisar`/`Recusado`) continua na fase 2; a visibilidade pública do item
  já é gated pelo status `Publicado` do pai.

## 6. Progresso da Esteira

**Universo (ciclo ativo):** inclui a chamada quando **ao menos um** vínculo aponta para conteúdo pai
`arquivada = 0`, **exceto** a chamada em `Publicado` e a chamada em `Publicar` cujo ao menos um vínculo
ativo aponta para pai `Publicado` (já visível no portal, portanto fora do ciclo e do percentual).
Itens em `Revisar`, `Aprovado` ou `Recusado` permanecem mesmo com o pai publicado. Itens sem vínculo
não arquivado não entram. A listagem da API ainda devolve as chamadas `Publicado` para consulta; ao
filtrar o vínculo correspondente, o board as exibe em Publicados, sem alterar o painel global.

```text
total          = itens distintos no ciclo ativo
revisar        = status Revisar
aprovado       = status Aprovado
recusado       = status Recusado
publicar       = status Publicar (aguardando o pai)
aguardando     = publicar
publicado      = status Publicado (contagem informativa, fora do percentual)
avançou        = aprovado + publicar
% do fluxo     = avançou / total
```

- **Painel global:** não muda com os filtros do board; o card Demandas por origem mostra as contagens por
  vínculo ativo.
- **Quebra por origem:** usa os vínculos **ativos** de cada item; uma chamada com dois vínculos
  ativos aparece nas duas abas e conta **uma vez** no total geral.
- **Recusadas:** não entram no numerador do percentual (aguardam correção); o acionador do painel
  mostra/oculta a faixa.
- **Total zero:** estado vazio, sem divisão por zero.
- **Cores:** Revisar `#f59e0b`, Aprovado `#1a9e07`, Publicar `#0364f7`, Publicado `#112051`,
  Recusado `#be123c` — sólidas, sem degradê.

## 7. Navegação, RBAC e auditoria

- O item **Esteira de Revisão** da sessão **Movimentos** declara `to: '/admin/esteira-revisao'` e
  fica ativo na rota (`aria-current`). A rota está sujeita à guarda de sessão das demais telas
  administrativas.
- A matriz do módulo `esteira-revisao` controla a tela e a API:
  **visualizar** (tela/detalhe/histórico), **publicar** (Aprovar, Publicar Item e Suspender),
  **alterar** (Recusar e Reabrir), **filtrar** (Filtros) e **buscar** (campo de busca).
- **Catálogo de 92 funcionalidades** (o `buscar` foi acrescentado ao módulo). Contagens normativas:
  Administrador `92/92`, Editor `67/92`, Revisor `41/92`, Leitor `14/92`; concedidas `214/368`.
- **Revisor:** recebe `publicar` **somente** na esteira (homologação e publicação do item); continua
  sem `publicar` nos módulos de conteúdo e em Lançar as Chamadas.
- O item da sidebar é ocultado sem `esteira-revisao`/`visualizar`; as rotas respondem `403`.
- **Auditoria:** recurso **"Esteira de Revisão"**; `Homologação` no aprovar/publicar e `Alteração` no
  recusar/reabrir/suspender. O filtro de recursos da Gestão de Auditoria passa a exibir o recurso
  automaticamente.
- **Migration:** `server/migration/27_reconciliar_rbac_esteira.sql` (somente dados de
  `permissoes_perfil`, idempotente) acrescenta `buscar` aos perfis que enxergam a esteira e
  `publicar` ao Revisor canônico.

## 8. Testes e verificação

- **Gates:** `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- **Testes unitários:**
  - `tests/esteira-revisao-validadores.test.ts` — ciclo ativo (pai publicado em Revisar/Aprovado/
    Recusado permanece; `Publicar` com pai publicado sai; `Publicar` aguardando pai permanece;
    `Publicado` sai do ciclo), visibilidade no portal (`Publicado` com pai publicado; `Publicar`
    nunca visível), visibilidade no board (item publicado oculto por padrão e revelado ao filtrar o
    vínculo), progresso (zero, contagens, percentual = aprovado + aguardando, contagem informativa
    de publicados, multi-vínculo por origem, vínculo arquivado), filtros (origem, status, vínculo,
    união de vínculos, software, parceiro, tipo, impacto, período e busca sem acento) e
    transições/parecer (aprovar, recusar, reabrir, publicar, suspender).
  - `tests/perfis-funcionalidades.test.ts` — catálogo de 92 e `buscar` na esteira.
  - `tests/historico-esteira.test.ts` — tempo no estágio calculado no banco (fallback em
    `entregas_itens.criado_em`) e protegido contra valor negativo com `GREATEST(..., 0)`.
- **API/E2E:** `GET /api/esteira-revisao` 200 com `itens`, `opcoes` e `progresso`; detalhe/histórico;
  aprovar 200; recusar sem parecer `400`; recusar com parecer 200; reabrir 200; publicar 200;
  suspender 200; id inexistente `404`; status incompatível `409`; sem permissão `403`; sem sessão
  `401`.
- **Manual:** criar chamada em Lançar as Chamadas → abrir a esteira → conferir o painel, as abas de
  origem e a coluna Em Revisão → aprovar → conferir Aprovado → publicar Item → conferir Publicados
  com "Aguardando pai" e "No Portal" desabilitado → publicar o Manual/Release Week → confirmar que a
  cascata promove a chamada a `Publicado`, ela sai do board e aparece na Área Pública → selecionar o
  vínculo publicado no Pacote de Origem e confirmar que a chamada reaparece em Publicados com "No
  Portal" habilitado → reabrir o pai e confirmar a volta para `Publicar` → recusar com parecer →
  reabrir → filtrar por origem, buscar, usar os filtros rápidos e a faixa de recusadas → repetir
  como Revisor (aprova/publica) e Leitor (sem acesso) → recarregar e confirmar a persistência.
- **Cascata:** conferir que publicar um pai com filhas em `Publicar` grava histórico em cada filha e
  auditoria única no pai; publicar de novo não duplica histórico; reabrir o pai devolve para
  `Publicar` somente as filhas sem outro vínculo ativo publicado.
- **Banco:** conferir `historico_esteira_revisao` após cada transição (status anterior/novo,
  responsável, parecer, critérios, tempo e data) e `permissoes_perfil` após a migration 27.

## 9. Pendências e próximos passos

- **Gate de publicação:** bloquear a publicação de Release Week, Manual e Escopo de Projetos
  enquanto houver chamada em `Revisar` ou `Recusado` (fase 2).
- **`arquivar` na esteira:** definir a semântica (arquivar a revisão de um ciclo? soft archive de
  item?) e implementar a ação na UI/API (fase 2).
- **Revisor no conteúdo pai:** preencher `revisor_id`/`revisor_feedback` de `release_week` e
  `manuais_mensal` ao concluir a revisão do ciclo (fase 2).
- **Seleção/ações em lote:** o mock de referência mostra "Selecionar todos"; a seleção e as ações em
  lote ficam para a fase 2.
- **Notificações e exportação:** avaliação futura; a matriz da esteira não tem
  `download`/`exportar`.
- **Paginação/consulta server-side:** se o volume do ciclo ativo crescer, migrar a listagem para
  paginação/agregação no servidor (o contrato da API já separa `itens`, `opcoes` e `progresso`).
- **Vitrine:** a seção 5.27 do `docs/01` documenta o painel e o board; se o card/progresso virar
  componente reutilizável, adicionar um exemplo espelhado em `/design`.
