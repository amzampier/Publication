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
ainda está ativo — **não arquivado e não publicado** —, com o objetivo de revisar, homologar,
publicar ou recusar cada chamada com parecer e trilha imutável.

- **Rota:** `/admin/esteira-revisao` → `app/pages/admin/esteira-revisao.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`.
- **Processo:** `1. Revisar → 2. Aprovado → 3. Publicar`, com a exceção **Recusado** (correção) e as
  ações de reabertura/suspensão.
- **Persistência:** `entregas_itens` (status `Revisar`/`Aprovado`/`Recusado`/`Publicar`) e
  `historico_esteira_revisao` (transições). Não há tabela nova; a única migration é a de RBAC
  (`27_reconciliar_rbac_esteira.sql`).
- **Conteúdo pai:** `release_week`, `manuais_mensal` e `projetos_escopo` fornecem contexto, filtro de
  origem e o universo ativo. O status editorial do pai é independente do status da chamada.
- **Status do pai:** ao criar, importar ou trocar vínculos em Lançar as Chamadas, o pai vinculado
  passa automaticamente para `Em Revisão` (Release/Manual) ou `Homologação` (Escopo), inclusive se
  estava `Aprovado`/`Publicado`.
- **Vínculos permitidos:** o formulário de Lançar as Chamadas só oferece Release Week em
  `Aberta`/`Em Revisão`, Manuais em `Rascunho`/`Em Revisão` e Escopo em `Em Andamento`/`Homologação`.
- **Visibilidade pública:** um item em `Publicar` só aparece na Área Pública quando ao menos um
  vínculo aponta para conteúdo pai `Publicado`; caso contrário, o card mostra **Aguardando pai** e a
  ação "No Portal" fica desabilitada.
- **Navegação:** item **Esteira de Revisão** na sessão **Movimentos** da sidebar
  (`app/config/navigation.ts`), com `to: '/admin/esteira-revisao'` e `aria-current="page"`.
- **Ver Portal Público:** botão no cabeçalho abre a Área Pública (`/`) em nova aba.
- **Fora de escopo (fase 2):** bloquear a publicação do conteúdo pai enquanto houver chamada em
  `Revisar`/`Recusado`; definir a semântica de `arquivar` na esteira; preencher
  `revisor_id`/`revisor_feedback` no pai; seleção/ações em lote; notificações; exportação PDF/CSV.

## 2. Estrutura da página (componentização)

```text
admin/esteira-revisao.vue                       (page — definePageMeta + coordenação)
├── <EsteiraCabecalho />                          → tile Workflow #8b5cf6 + título + chip do usuário
│                                                   + "Ver Portal Público"
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
  "Esteira de Revisão" e subtítulo com o processo `1. Revisar → 2. Aprovado → 3. Publicar`.
- À direita: chip do usuário (avatar ou iniciais, nome e perfil via `useAuth`/`useAvatarUsuario`) e
  o botão **Ver Portal Público** (`ExternalLink`), que abre `/` em nova aba.
- O cabeçalho não renderiza mais o progresso nem as origens; eles ficam na barra de ferramentas do
  board.

### 3.2 `Progresso.vue` → `<EsteiraProgresso>`

- Painel **compacto**, na segunda faixa da barra de ferramentas, ao lado de **Demandas por origem**
  (`lg:grid-cols-[1fr_20rem]`). Em telas estreitas, empilha.
- Estrutura: `rounded-lg border border-slate-200 bg-white p-3 shadow-xs`; rótulo "Progresso" em
  versalete; **percentual em `text-lg`** (não é mais o número grande anterior); contagens
  **a revisar**, **aprov.** e **publ.** em linha com pontos coloridos; barra `h-1.5`; rodapé com
  `revisado/total` e acionador de **recusadas**.
- **Percentual do fluxo:** `(Aprovado + Publicar) / total`; recusadas não entram no numerador.
- **Barra segmentada:** cores sólidas — Revisar `#f59e0b`, Aprovado `#1a9e07`, Publicar `#0364f7` e
  Recusado `rose-700` `#be123c`; **sem degradê**.
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
  campo de busca (gate `buscar`), seletor **Pacote de Origem** (releases/manuais/projetos ativos)
  **à esquerda do botão Filtros** (gate `filtrar`, com badge de critérios ativos) e o ícone `X` para
  limpar filtros e busca.
- **Segunda faixa (onde ficavam os filtros rápidos):** à esquerda, o card **Demandas por origem**
  com o `UiSegmented` compacto (Todas, Releases, Manuais, Escopo) e as contagens globais; à direita,
  o painel compacto de progresso.
- **Software Atendido** e **Parceiro / Cliente** ficam **dentro do modal de Filtros**, junto de
  Status, Origem, Tipo, Impacto, vínculos e períodos.
- **Três colunas:**
  - **1. Em Revisão** (`Revisar`) — "Chamadas aguardando homologação do Revisor / QA";
  - **2. Homologados** (`Aprovado`) — "Validadas pelo QA, prontas para publicação";
  - **3. Publicados** (`Publicar`) — "Visíveis aos clientes e parceiros no portal público".
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
    - **Homologados:** `Undo2` (Voltar p/ Revisão) e `UploadCloud` (Publicar Item);
    - **Publicados:** `ArchiveRestore` (Suspender p/ Homologado) e `ExternalLink` (No Portal);
    - **Recusadas:** `Eye` (Inspecionar) e `Undo2` (Reabrir).
- **No Portal** abre a Área Pública (`/`) em nova aba.

### 3.5 `Filtros.vue` → `<EsteiraFiltros>`

- `UiModal size="lg"` com três colunas a partir de `sm` e `UiModalSection` para **Status**,
  **Origem**, **Tipo**, **Impacto**, **Release Week**, **Manual**, **Escopo de Projetos**,
  **Software**, **Parceiro**, **Período de lançamento** (De/Até) e **Período de liberação** (De/Até).
- **Software Atendido** e **Parceiro / Cliente** ficam neste modal, não na barra de ferramentas.
- `UiSelect` para seleção única e `UiDatePicker` para os períodos; vazio = todos.
- "Aplicar" refina o board; "Limpar Filtros" zera rascunho e estado; "Cancelar" fecha sem aplicar.
- A toolbar indica a quantidade de filtros ativos (`criteriosAtivosCount`).

### 3.6 `Detalhe.vue` → `<EsteiraDetalhe>`

- `UiModal size="xl"` somente leitura com as seções:
  - **Identificação:** chamada, título, status, origem, lançamento, liberação, autor, revisor e
    última decisão;
  - **Vínculos:** Release Week, Manual e Escopo de Projetos com código, nome e status do pai;
  - **Classificação:** parceiro, softwares, módulo, menu, tipo, impacto, situação e tags;
  - **Conteúdo:** descrição e solução com `UiRichTextViewer`, título do manual e links;
  - **Imagens:** grade de miniaturas com link para a imagem;
  - **Histórico da esteira:** `<EsteiraHistorico>`;
  - **Informações de cadastro:** criado/atualizado.
- Ao abrir, carrega `GET /api/esteira-revisao/:id/historico` (cache por item no modelo; invalidado
  após uma transição).
- Fecha por `Escape`, pelo `X` do `UiModal` ou por "Fechar", devolvendo o foco ao acionador.

### 3.7 `Historico.vue` → `<EsteiraHistorico>`

- Timeline cronológica com badges de status anterior/novo, data/hora, responsável, perfil, parecer
  (quando houver), critérios de aceite (atendidos/não atendidos) e tempo no estágio (min/h).
- Estados de carregamento e "Nenhuma transição registrada para esta chamada.".

### 3.8 `Decisao.vue` → `<EsteiraDecisao>`

- Modal único para **Aprovar**, **Recusar**, **Reabrir**, **Publicar Item** e **Suspender**, com
  título, subtítulo e ícone variando por ação.
- **Aprovar:** checkbox "Confirmo que os critérios de aceite foram atendidos" obrigatório e parecer
  opcional.
- **Recusar:** `UiTextarea` de parecer **obrigatório** (erro canônico em `rose-700`); critérios
  gravados como não atendidos.
- **Reabrir:** parecer opcional; a chamada volta a `Revisar` e a `data_liberacao` é limpa.
- **Publicar Item:** parecer opcional; o item homologado passa a `Publicar` e fica visível no portal.
- **Suspender:** parecer opcional; o item volta de `Publicar` para `Aprovado`.
- O botão de confirmação fica desabilitado quando a validação falha ou o checkbox de critérios não
  está marcado. Emite `confirmar({ acao, parecer, criterios })`.

### 3.9 `useEsteiraRevisaoModelo.ts`

- `useState` para `esteira-itens`, `esteira-opcoes`, `esteira-carregando`, `esteira-carregado`,
  `esteira-busca`, `esteira-filtros`, `esteira-mostrar-recusadas`, `esteira-historico` e
  `esteira-historico-carregando`.
- `carregar(forcar)` → `GET /api/esteira-revisao` (com `?busca=1`/`?filtros=1` quando aplicável);
  hidrata itens, opções e progresso.
- Derivados: `itensFiltrados` (origem + filtros + busca), `linhas` (shape dos cards),
  `progresso` (global, calculado por `calcularProgresso`), `contagemPorOrigem`,
  `contagemPorStatus`, `filtrosAtivosCount`, `criteriosAtivosCount`, `opcoesFiltro`,
  `opcoesPacotes`, `pacoteSelecionado` e `aplicarPacote`.
- `limparFiltros`, `filtrarPorOrigem`, `alternarRecusadas`, `resolver(id)`,
  `carregarHistorico(id, forcar)`.
- Ações `aprovar`, `recusar`, `reabrir`, `publicar` e `suspender` chamam as rotas da esteira,
  atualizam o item na lista, recalculam o painel e invalidam o cache do histórico.

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

- **Listagem:** `{ itens, opcoes, progresso }` — `itens` são as chamadas do ciclo ativo com
  `contexto` (release/manual/projeto), `revisorId`, `revisorNome`, `dataDecisao` e `parecer`;
  `opcoes` traz releases, manuais, projetos, softwares e parceiros ativos; `progresso` segue o
  contrato de `shared/esteira-revisao`.
- **Transições:** aceitam `{ parecer?, criterios? }`; `recusar` exige `parecer` não vazio.
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

- **Aprovar:** só de `Revisar`; preserva a `data_liberacao` existente e herda
  `release_week.data_publicacao` somente quando estiver vazia; grava `criterios_aceite_atendidos = 1`.
- **Recusar:** só de `Revisar`; parecer obrigatório; não altera `data_liberacao`; grava
  `criterios_aceite_atendidos = 0`.
- **Reabrir:** de `Aprovado` ou `Recusado`; volta para `Revisar`; **limpa** `data_liberacao`; grava
  `criterios_aceite_atendidos = 0`.
- **Publicar Item:** de `Aprovado`; passa para `Publicar`; preserva `data_liberacao`; grava
  `criterios_aceite_atendidos = 1`.
- **Suspender:** de `Publicar`; volta para `Aprovado`; preserva `data_liberacao`; grava
  `criterios_aceite_atendidos = 1`.
- **Atomicidade:** o update condicionado ao status lido e o insert do histórico ocorrem na mesma
  transação; se outra pessoa mudou o status, a API responde `409` e o board é atualizado.
- **Lançar as Chamadas:** as ações de aprovar/recusar/desaprovar usam a mesma transição de domínio,
  gravam o mesmo histórico e mantêm a auditoria no recurso "Lançar as Chamadas". Publicar/Suspender
  ficam na Esteira.
- **Imutabilidade:** o histórico não é editado nem apagado por ações da esteira.
- **Visibilidade pública:** o item em `Publicar` só é visível na Área Pública quando ao menos um
  vínculo aponta para conteúdo pai `Publicado`. A ação "No Portal" fica desabilitada com o motivo
  "Aguardando publicação do conteúdo pai" e o card exibe "Aguardando pai" enquanto o pai não estiver
  publicado.
- **Publicar o item não publica o conteúdo pai:** o gate de publicação do pai (bloquear a publicação
  enquanto houver itens em `Revisar`/`Recusado`) continua na fase 2; a visibilidade pública do item
  já é gated pelo status `Publicado` do pai.

## 6. Progresso da Esteira

**Universo (ciclo ativo):** inclui a chamada quando **ao menos um** vínculo aponta para conteúdo pai
`arquivada = 0` **e** `status <> 'Publicado'`. Itens sem vínculo ativo não entram.

```text
total          = itens distintos no ciclo ativo
revisar        = status Revisar
aprovado       = status Aprovado
recusado       = status Recusado
publicar       = status Publicar
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
- **Cores:** Revisar `#f59e0b`, Aprovado `#1a9e07`, Publicar `#0364f7`, Recusado `#be123c` —
  sólidas, sem degradê.

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
  - `tests/esteira-revisao-validadores.test.ts` — progresso (zero, contagens, percentual =
    aprovado + publicado, multi-vínculo por origem, vínculo arquivado/publicado), filtros (origem,
    status, vínculo, software, parceiro, tipo, impacto, período e busca sem acento) e
    transições/parecer (aprovar, recusar, reabrir, publicar, suspender).
  - `tests/perfis-funcionalidades.test.ts` — catálogo de 92 e `buscar` na esteira.
- **API/E2E:** `GET /api/esteira-revisao` 200 com `itens`, `opcoes` e `progresso`; detalhe/histórico;
  aprovar 200; recusar sem parecer `400`; recusar com parecer 200; reabrir 200; publicar 200;
  suspender 200; id inexistente `404`; status incompatível `409`; sem permissão `403`; sem sessão
  `401`.
- **Manual:** criar chamada em Lançar as Chamadas → abrir a esteira → conferir o painel, as abas de
  origem e a coluna Em Revisão → aprovar → conferir Homologados → publicar → conferir Publicados e o
  link "No Portal" → suspender → recusar com parecer → reabrir → filtrar por origem, buscar, usar os
  filtros rápidos e a faixa de recusadas → repetir como Revisor (aprova/publica) e Leitor (sem
  acesso) → recarregar e confirmar a persistência.
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
